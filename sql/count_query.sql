DESCRIBE revision;
DESCRIBE page;
SELECT 0 FROM nonexistent;

SELECT * FROM information_schema.tables WHERE table_schema = DATABASE();

# Print summary info about total memory usage of OIDB
SELECT t.table_schema, t.table_name, 
t.data_length/1024/1024/1024 AS table_size_in_gb, 
t.index_length/1024/1024/1024 AS index_size_in_gb, 
(t.data_length + t.index_length)/1024/1024/1024 AS total_size_in_gb FROM
(SELECT * FROM information_schema.tables WHERE table_schema = DATABASE()) AS t;

###################

SELECT COUNT(*) FROM revision;

SELECT * FROM revision LIMIT 10;

SELECT * FROM revision ORDER BY rev_id LIMIT 40000,10;

SELECT * FROM revision WHERE page_id = 38901460 LIMIT 10;



SELECT * FROM revision WHERE rev_id = 876227298;

SELECT * FROM revision_count LIMIT 10;
SELECT COUNT(*) FROM revision_count;
SELECT SUM(count) FROM revision_count WHERE damaging_pred_filter in (1, 2);


###################
SELECT rev_id, page_id, rev_timestamp, seconds_to_prev, is_minor, user_text, is_user_registered
FROM revision 
WHERE page_namespace = 0 AND page_rev_count = 3 AND is_user_bot = 0
AND damaging_pred_filter = 2 AND is_reverted = 1 AND is_reverted_for_damage = 1
ORDER BY random
LIMIT 0,20;

SELECT rev_id, page_id, rev_timestamp, seconds_to_prev, is_minor, user_text, is_user_registered
FROM revision 
WHERE page_namespace = 1 AND is_user_bot = 0
AND damaging_pred_filter = 2 AND is_reverted = 1 AND is_reverted_for_damage = 1
ORDER BY random
LIMIT 0,20;

SELECT COUNT(*)
FROM revision 
WHERE page_namespace = 0 AND page_rev_count = 3 AND is_user_bot = 0
AND damaging_pred_filter = 2 AND is_reverted = 1 AND is_reverted_for_damage = 1;

SELECT page_namespace, COUNT(*)
FROM revision
GROUP BY page_namespace;

SELECT page_namespace, is_user_bot, damaging_pred_filter, is_reverted, is_reverted_for_damage, COUNT(*)
FROM revision
WHERE is_reverted = is_reverted_for_damage
GROUP BY page_namespace, is_user_bot, damaging_pred_filter, is_reverted, is_reverted_for_damage;
#############################################
# Create revision count table
CREATE TABLE revision_count (
rid INTEGER NOT NULL AUTO_INCREMENT,
damaging_pred_filter TINYINT,
reverted_filter_mask TINYINT,
reverted_within_filter TINYINT,
reverted_after_filter TINYINT,
page_namespace TINYINT,
user_type TINYINT,
rev_count_gt_filter TINYINT,
rev_count_lt_filter TINYINT,
revision_filter_mask TINYINT,
delta_bytes_filter TINYINT, 
count INTEGER,
PRIMARY KEY (rid) 
)
SELECT 
		damaging_pred_filter,
        reverted_filter_mask,
        reverted_within_filter,
        reverted_after_filter,
        page_namespace,
        user_type,
        rev_count_gt_filter,
        rev_count_lt_filter,
        revision_filter_mask,
        delta_bytes_filter, 
        COUNT(*) as count
FROM revision
GROUP BY damaging_pred_filter,
        reverted_filter_mask,
        reverted_within_filter,
        reverted_after_filter,
        page_namespace,
        user_type,
        rev_count_gt_filter,
        rev_count_lt_filter,
        revision_filter_mask,
        delta_bytes_filter;


SELECT *
FROM revision USE INDEX (revision_full_ind)
WHERE damaging_pred_filter = 0 AND
        reverted_filter_mask = 0 AND  # not reverted
        reverted_within_filter IS NULL AND
        reverted_after_filter IS NULL AND
        page_namespace = 0 AND
        user_type IN (0, 2, 3, 4) AND
        rev_count_gt_filter IN (2, 3, 4, 5) AND
        rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND
        revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND
        delta_bytes_filter IN (-2, -1, 0, 1, 2)
ORDER BY random
LIMIT 0, 20;

SELECT SUM(count) as revision_total
FROM revision_count
WHERE damaging_pred_filter = 0 AND
        reverted_filter_mask = 0 AND  # not reverted
        reverted_within_filter IS NULL AND
        reverted_after_filter IS NULL AND
        page_namespace = 0 AND
        user_type IN (0, 2, 3, 4) AND
        rev_count_gt_filter IN (2, 3, 4, 5) AND
        rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND
        revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND
        delta_bytes_filter IN (-2, -1, 0, 1, 2);

SELECT SUM(count) as revision_total FROM revision_count WHERE page_namespace = 0 AND user_type IN (0, 2, 3, 4) AND rev_count_gt_filter IN (2, 3, 4, 5) AND rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND delta_bytes_filter IN (-2, -1, 0, 1, 2)
AND damaging_pred_filter = 0 AND reverted_filter_mask = 0 AND reverted_within_filter IS NULL AND reverted_after_filter IS NULL;
SELECT SUM(count) as revision_total FROM revision_count WHERE page_namespace = 0 AND user_type IN (0, 2, 3, 4) AND rev_count_gt_filter IN (2, 3, 4, 5) AND rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND delta_bytes_filter IN (-2, -1, 0, 1, 2)
AND damaging_pred_filter = 1 AND reverted_filter_mask = 0 AND reverted_within_filter IS NULL AND reverted_after_filter IS NULL;
SELECT SUM(count) as revision_total FROM revision_count WHERE page_namespace = 0 AND user_type IN (0, 2, 3, 4) AND rev_count_gt_filter IN (2, 3, 4, 5) AND rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND delta_bytes_filter IN (-2, -1, 0, 1, 2)
AND damaging_pred_filter = 2 AND reverted_filter_mask = 0 AND reverted_within_filter IS NULL AND reverted_after_filter IS NULL;

SELECT SUM(count) as revision_total FROM revision_count WHERE page_namespace = 0 AND user_type IN (0, 2, 3, 4) AND rev_count_gt_filter IN (2, 3, 4, 5) AND rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND delta_bytes_filter IN (-2, -1, 0, 1, 2)
AND damaging_pred_filter = 2 AND reverted_filter_mask IN (1, 3, 5, 7) AND reverted_within_filter IN (0, 1, 2, 3, 4, 5) AND reverted_after_filter IN (0, 1, 2, 3, 4, 5);

# Question: Why is reverted_filter_mask always <= 7 when damaging_pred_filter = 2?  Need to investigate, seems bad/unexpected...
SELECT reverted_filter_mask, damaging_pred_filter, COUNT(*) as n_unique_vals, SUM(count) as revision_total FROM revision_count WHERE page_namespace = 0 AND user_type IN (0, 2, 3, 4) AND rev_count_gt_filter IN (2, 3, 4, 5) AND rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND delta_bytes_filter IN (-2, -1, 0, 1, 2)
GROUP BY damaging_pred_filter, reverted_filter_mask;
# Could investigate the following rare case:
SELECT * FROM revision WHERE page_namespace = 0 AND user_type IN (0, 2, 3, 4) AND rev_count_gt_filter IN (2, 3, 4, 5) AND rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND delta_bytes_filter IN (-2, -1, 0, 1, 2)
AND reverted_filter_mask = 15 AND damaging_pred_filter = 1;


# this is the default query
SELECT *
FROM revision
WHERE damaging_pred_filter = 0 AND
        reverted_filter_mask = 0 AND  # not reverted
        reverted_within_filter IS NULL AND
        reverted_after_filter IS NULL AND
        page_namespace = 0 AND
        user_type IN (0, 2, 3, 4) AND
        rev_count_gt_filter IN (0, 1, 2, 3, 4, 5) AND
        rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND
        revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND
        delta_bytes_filter IN (-2, -1, 0, 1, 2)
ORDER BY random
LIMIT 0, 20;

SELECT *
FROM revision
WHERE damaging_pred_filter = 0 AND
        reverted_filter_mask = 0 AND  # not reverted
        reverted_within_filter IS NULL AND
        reverted_after_filter IS NULL AND
        page_namespace = 0 AND
        user_type = 0 AND
        rev_count_gt_filter IN (2, 3, 4, 5) AND
        rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND
        revision_filter_mask = 7 AND
        delta_bytes_filter IN (1, 2)
ORDER BY random
LIMIT 0, 20;

CREATE INDEX revision_full_ind ON revision (
        damaging_pred_filter,
        reverted_filter_mask,
        reverted_within_filter,
        reverted_after_filter,
        page_namespace,
        user_type,
        rev_count_gt_filter,
        rev_count_lt_filter,
        revision_filter_mask,
        delta_bytes_filter,
        random);

###################
# Analysis of ClueBot NG, who has user_id = 13286072

# What is the time to revert for ClueBot NG?
# Note: this requires a join, since seconds_to_revert is a property of the reverted revisions, not the revert itself
SELECT LEAST(revision.seconds_to_revert, 30) AS seconds_to_revert, COUNT(*) as reverted_rev_count
FROM revision
LEFT JOIN revision AS revert ON revision.revert_id = revert.rev_id
WHERE revision.is_reverted = 1 AND revert.user_id = 13286072
GROUP BY LEAST(revision.seconds_to_revert, 30);
/*
Seconds_to_revert, reverted_rev_count
0, 4
1, 9501
2, 28877
3, 18220
4, 10886
5, 8009
6, 4857
7, 2905
8, 1717
9, 1054
10, 709
11, 514
12, 348
13, 266
14, 173
15, 149
16, 122
17, 113
18, 92
19, 93
20, 94
21, 77
22, 51
23, 78
24, 82
25, 49
26, 59
27, 65
28, 69
29, 72
30, 16980

*/

SELECT revert.user_text as reverting_user_text, revert.rev_id as reverting_rev_id, revision.seconds_to_revert, revision.*
FROM revision
LEFT JOIN revision AS revert ON revision.revert_id = revert.rev_id
WHERE revision.is_reverted = 1 AND revision.seconds_to_revert >= 30 AND revert.user_id = 13286072
LIMIT 10;

SELECT COUNT(*), SUM(is_revert) FROM revision WHERE page_namespace = 0 AND user_id = 13286072;  # ns0 revisions by ClueBot NG; 93523 total, 93245 reverts
SELECT * FROM revision WHERE page_namespace = 0 AND user_id = 13286072 AND is_revert = 0;  # investigate the non-reverts about the non-reverts?

###################
# Analysis of the length of page titles
SELECT MAX(LENGTH(page_title)) FROM page;
SELECT page_title, LENGTH(page_title) FROM page ORDER BY LENGTH(page_title) DESC LIMIT 0, 10;
SELECT COUNT(*) FROM page;
SELECT page_title, LENGTH(page_title) FROM page ORDER BY LENGTH(page_title) DESC LIMIT 474449, 5;  # 474449 = 9489004 × 0.05, aka the 95% of title lengths, returns 45
SELECT page_title, LENGTH(page_title) FROM page ORDER BY LENGTH(page_title) DESC LIMIT 94890, 5;  # 99%
SELECT page_title, LENGTH(page_title) FROM page ORDER BY LENGTH(page_title) DESC LIMIT 9489, 5;  # 99.9%, returns 83

###################

SELECT * FROM page 
WHERE wiki_namespace = 0
LIMIT 100;
SELECT * FROM page LIMIT 100;
SELECT COUNT(*), SUM(is_redirect) FROM page 
WHERE wiki_namespace = 0
LIMIT 100;

SELECT * FROM revision WHERE rev_id = 880062021;
SELECT * FROM revision WHERE is_reverted = 1 LIMIT 10;


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
is_reverted_to_by_other = X # Boolean
is_user_trusted = X # Boolean
revert_set_size = X # Multi-reversion reverts, 2 unique values in [1, 1+]
seconds_to_revert = X # Time to revert, 6 unique values in [6 seconds, 6 minutes, 6 hours, 6 days, 6 months, 1 year]
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

CREATE INDEX revision_default ON revision (page_namespace, page_rev_count, is_user_bot, random );
#CREATE INDEX revision_join_default ON revision (page_id, is_user_bot, random );
#CREATE INDEX page_default ON page (wiki_namespace, rev_count );
#CREATE INDEX page_join_default ON page (page_id, wiki_namespace, rev_count );

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
