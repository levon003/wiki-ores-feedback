DESCRIBE revision;
DESCRIBE page;

SELECT * FROM page 
WHERE wiki_namespace = 0
LIMIT 100;
SELECT * FROM page LIMIT 100;
SELECT COUNT(*), SUM(is_redirect) FROM page 
WHERE wiki_namespace = 0
LIMIT 100;

SELECT * FROM revision WHERE rev_id = 880062021;
SELECT * FROM revision WHERE is_reverted = 1 LIMIT 10;

SELECT 0 FROM nonexistent;

DROP INDEX revision_user_text ON revision;
CREATE INDEX revision_user_text ON revision (user_text(80) );

DROP VIEW IF EXISTS revision_page_view;

CREATE VIEW revision_page_view AS
SELECT rev_id, 
# Columns from revision
revision.page_id, rev_timestamp, seconds_to_prev, is_minor, user_text, is_user_registered,
# Columns from page
wiki_namespace, page_title, rev_count, is_redirect,
# New columns needed for filtering
(is_user_registered = 1 AND n_user_contributions_at_rev < 10) AS is_newcomer,
n_user_contributions_at_rev >= 10 and n_user_contributions_at_rev < 500 AS is_learner,
n_user_contributions_at_rev >= 500 AS is_experienced
FROM revision 
LEFT JOIN page ON revision.page_id = page.page_id
LIMIT 1000000;

EXPLAIN SELECT * FROM revision_page_view;
EXPLAIN SELECT * FROM revision;

CREATE INDEX revision_page_view_namespace ON revision_page_view (wiki_namespace);

SELECT user_id, user_text, COUNT(*) AS user_count
FROM revision
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY user_count DESC
LIMIT 100;

SELECT page_id, page_title, wiki_namespace, rev_count
FROM page
WHERE rev_count > 0
ORDER BY rev_count DESC
LIMIT 100;

#########################################################################################

/*
For general filtering, we need the following columns:
wiki_namespace = X  # namespace, 20 unique values
rev_count >= X  # page activity level, 6 unique values in [0, 1, 3, 5, 7, 9]

Edit size, see https://xtools.wmflabs.org/ec/en.wikipedia.org/Suriname0
delta_bytes < 20 AND delta_bytes > -20  # small edits
delta_bytes < 1000 AND delta_bytes >= 20  # medium additions
delta_bytes >= 1000  # large additions
delta_bytes > -1000 AND delta_bytes <= -20  # medium removals
delta_bytes <= -1000  # large removals
is_minor = X  # Minor revisions, boolean
is_revert = X  # Revert revisions, boolean

is_user_registered = X  # Registration status, boolean
is_user_bot = X  # Bot status, boolean
is_newcomer = X  # Editor experience, boolean
is_learner = X  # Editor experience, boolean
is_experienced = X  # Editor experience, boolean

That's 20 * 6 * 2 * 2 * 2 * 2 * 2 * 2 * 2 * 2 * 2 * 2 * 2 * 2 = 491520 supported filter conditions

For prediction filtering, there's:
damaging_pred >= 0.944  # VLB
damaging_pred < 0.944 AND damaging_pred > 0.301  # Neither
damaging_pred <= 0.301  # LG

For revert filtering, there's:
is_reverted = 1  # required condition
is_self_revert = X  # Boolean
is_reverted_to_by_other  # Boolean
is_user_trusted  # Boolean
revert_set_size  # Multi-reversion reverts, 2 unique values in [1, 1+]
seconds_to_revert  # Time to revert, 6 unique values in [6 seconds, 6 minutes, 6 hours, 6 days, 6 months, 1 year]
OR is_reverted = 0

That's 3 * 2 * 2 * 2 * 2 * 6 + 1 = 289

To precompute all filter conditions together, that's 141,557,760 combinations.
That's probably too many computations to pre-compute!
However, if we compute the default + all settings that are 1 setting off of the default,
we have only: 68 combinations. Very reasonable!
In other words, could choose combinations using a strategy to build a more reasonable 
pre-computed count set over time, slowly pushing bounds.
Could prioritize counting for sets with large counts... e.g. likely good revisions, non-reverted revisions

In addition, there are very specific filters that can be used.
These should probably have their own indices; just using one results in a tiny dataset.
Note that some are still pretty big: Monkbot has 1,138,488 revisions in our dataset
page_title = X  # for exact page title matches
page_id IN (X, ...)  # for links to and from specific pages
user_text = X  # for exact user matches

*/

SELECT rev_id, 
# Columns from revision
page_id, rev_timestamp, seconds_to_prev, is_minor, user_text, is_user_registered
FROM revision 
WHERE is_user_bot=0
ORDER BY random
LIMIT 100;

EXPLAIN SELECT rev_id, 
# Columns from revision
revision.page_id, rev_timestamp, seconds_to_prev, is_minor, user_text, is_user_registered,
# Columns from page
wiki_namespace, page_title, rev_count, is_redirect
FROM revision 
LEFT JOIN page ON revision.page_id = page.page_id
WHERE wiki_namespace = 0 AND is_user_bot=0
LIMIT 100;

SELECT rev_id, random,
# Columns from revision
revision.page_id, rev_timestamp, seconds_to_prev, is_minor, user_text, is_user_registered, 
# Columns from page
wiki_namespace, page_title, rev_count, is_redirect
FROM revision STRAIGHT_JOIN page
WHERE revision.page_id = page.page_id AND wiki_namespace = 0 AND rev_count >= 3 AND is_user_bot = 0
ORDER BY random
LIMIT 0,20;

EXPLAIN SELECT rev_id, 
# Columns from revision
revision.page_id, rev_timestamp, seconds_to_prev, is_minor, user_text, is_user_registered,
# Columns from page
wiki_namespace, page_title, rev_count, is_redirect
FROM revision 
LEFT JOIN page ON revision.page_id = page.page_id
WHERE wiki_namespace = 0 AND is_user_bot=0
ORDER BY random
LIMIT 100;

CREATE INDEX revision_default ON revision (is_user_bot, random );
CREATE INDEX revision_join_default ON revision (page_id, is_user_bot, random );
CREATE INDEX page_default ON page (wiki_namespace, rev_count );
CREATE INDEX page_join_default ON page (page_id, wiki_namespace, rev_count );

CREATE INDEX revision_count ON revision (is_user_bot, damaging_pred, seconds_to_revert );

# total revisions that match these filter criteria
SELECT COUNT(*), 
SUM(is_reverted = 1 AND seconds_to_revert <= 5) AS n_quick_removals
FROM revision 
LEFT JOIN page ON revision.page_id = page.page_id
WHERE wiki_namespace = 0 AND rev_count >= 3 AND is_user_bot=0;

SELECT COUNT(*),
SUM(seconds_to_revert <= 5) AS n_quick_removals,
SUM(seconds_to_revert IS NULL) AS n_quick_removals,
SUM(damaging_pred >= 0.94) as n_pred_vlb
FROM revision 
WHERE is_user_bot=0;

SELECT COUNT(*)
FROM revision 
WHERE is_user_bot=0 AND damaging_pred >= 0.94;

# Cross tabs
SELECT COUNT(*) FROM revision WHERE is_user_bot=0 AND damaging_pred >= 0.944 AND seconds_to_revert IS NULL;
SELECT COUNT(*) FROM revision WHERE is_user_bot=0 AND damaging_pred <= 0.301 AND seconds_to_revert IS NULL;
SELECT COUNT(*) FROM revision WHERE is_user_bot=0 AND damaging_pred < 0.944 AND damaging_pred > 0.301 AND seconds_to_revert IS NULL;
SELECT COUNT(*) FROM revision WHERE is_user_bot=0 AND damaging_pred >= 0.944 AND seconds_to_revert <= 360;
SELECT COUNT(*) FROM revision WHERE is_user_bot=0 AND damaging_pred <= 0.301 AND seconds_to_revert <= 360;
SELECT COUNT(*) FROM revision WHERE is_user_bot=0 AND damaging_pred < 0.944 AND damaging_pred > 0.301 AND seconds_to_revert <= 360;

SELECT COUNT(*)
FROM revision 
LEFT JOIN page ON revision.page_id = page.page_id
WHERE wiki_namespace = 0 AND rev_count >= 3 AND is_user_bot=0 AND damaging_pred >= 0.944;

SELECT COUNT(*)
FROM revision 
WHERE is_user_bot=0 AND damaging_pred <= 0.94 AND seconds_to_revert < 5;

SELECT COUNT(*)
FROM revision STRAIGHT_JOIN page
WHERE revision.page_id = page.page_id AND wiki_namespace = 0 AND rev_count >= 3 AND is_user_bot = 0;

#########################################################################################
ANALYZE TABLE revision;
ANALYZE TABLE page;

SELECT * FROM revision LIMIT 10;

SELECT * FROM revision 
WHERE rev_timestamp < 1568420356
ORDER BY random 
LIMIT 0,10;

SELECT * FROM revision 
WHERE user_text = 'Drat8sub';

SELECT * FROM revision 
WHERE user_text = 'Suriname0' ORDER BY random;

SELECT MAX(rev_id)
FROM revision;

SELECT COUNT(*)
FROM revision;

SELECT pt.wiki_namespace, COUNT(rt.rev_id)
FROM revision rt
LEFT JOIN page pt ON rt.page_id = pt.page_id
GROUP BY pt.wiki_namespace;

SELECT COUNT(*), SUM(rt.is_reverted)
FROM revision rt
LEFT JOIN page pt ON rt.page_id = pt.page_id
WHERE pt.wiki_namespace = 0
AND rt.is_user_bot IS TRUE;
