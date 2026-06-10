# Create persistent virtual columns
ALTER TABLE revision
ADD COLUMN damaging_pred_filter BOOLEAN AS (CASE WHEN damaging_pred >= 0.944 THEN 2 WHEN damaging_pred <= 0.301 THEN 0 ELSE 1 END) PERSISTENT,
ADD COLUMN is_reverted_for_damage BOOLEAN AS (is_reverted AND NOT (is_reverted_to_by_other OR is_self_reverted)) PERSISTENT;

ALTER TABLE revision
ADD COLUMN delta_bytes_filter TINYINT(1) SIGNED AS (CASE 
	WHEN delta_bytes IS NULL THEN NULL
	WHEN delta_bytes >= 1000 THEN 2 
    WHEN delta_bytes >= 20 THEN 1
    WHEN delta_bytes > -20 THEN 0
    WHEN delta_bytes > -1000 THEN -1
    WHEN delta_bytes <= -1000 THEN -2
    ELSE NULL
END) PERSISTENT,
ADD COLUMN rev_count_gt_filter TINYINT(1) UNSIGNED AS (CASE 
	WHEN page_rev_count >= 100 THEN 5
    WHEN page_rev_count >= 10 THEN 4
    WHEN page_rev_count >= 5 THEN 3
    WHEN page_rev_count >= 3 THEN 2
    WHEN page_rev_count >= 2 THEN 1
    ELSE 0
END) PERSISTENT,
ADD COLUMN rev_count_lt_filter TINYINT(1) UNSIGNED AS (CASE 
	WHEN page_rev_count <= 1 THEN 0
    WHEN page_rev_count <= 2 THEN 1
    WHEN page_rev_count <= 3 THEN 2
    WHEN page_rev_count <= 5 THEN 3
    WHEN page_rev_count <= 10 THEN 4
    ELSE 5
END) PERSISTENT;

ALTER TABLE revision
ADD COLUMN str INT(11) AS (seconds_to_revert) VIRTUAL;

ALTER TABLE revision
ADD COLUMN reverted_within_filter TINYINT(1) UNSIGNED AS (CASE 
	WHEN str IS NULL THEN NULL  # null when not set
	WHEN str <= 6 THEN 0  # 6 seconds
    WHEN str <= 360 THEN 1  # 6 minutes
    WHEN str <= 21600 THEN 2  # 6 hours
    WHEN str <= 518400 THEN 3  # 6 days
    WHEN str <= 15552000 THEN 4  # 6 months
    ELSE 5  # 1 year
END) PERSISTENT,
ADD COLUMN reverted_after_filter TINYINT(1) UNSIGNED AS (CASE 
	WHEN str IS NULL THEN NULL  # null when not set
	WHEN str >= 15552000 THEN 5  # reverted after more than 6 months
    WHEN str >= 518400 THEN 4  # 6 days
    WHEN str >= 21600 THEN 3  # 6 hours
    WHEN str >= 360 THEN 2  # 6 minutes
    WHEN str >= 6 THEN 1  # 6 seconds
    ELSE 0  # reverted after less than five seconds
END) PERSISTENT;

ALTER TABLE revision 
ADD COLUMN reverted_within_filter TINYINT(1) UNSIGNED,
ADD COLUMN reverted_after_filter TINYINT(1) UNSIGNED;
# This is the "compute it myself" solution to the 252-character limitation imposed on ADD COLUMN statements that add virtual columns.
# Error Code: 1470. String '...' is too long for VIRTUAL COLUMN EXPRESSION (should be no longer than 252)
UPDATE revision SET reverted_within_filter = (CASE 
	WHEN seconds_to_revert IS NULL THEN NULL  # null when not set
	WHEN seconds_to_revert <= 6 THEN 0  # 6 seconds
    WHEN seconds_to_revert <= 6*60 THEN 1  # 6 minutes
    WHEN seconds_to_revert <= 6*60*60 THEN 2  # 6 hours
    WHEN seconds_to_revert <= 6*60*60*24 THEN 3  # 6 days
    WHEN seconds_to_revert <= 6*60*60*24*30 THEN 4  # 6 months
    ELSE 5  # 1 year
END);

/*
reverted_within_filter / reverted_after_filter and rev_count_gt_filter / rev_count_lt_filter
both have a weird relationship.

For counts/filtering, it doesn't make sense to consider all combinations; only combinations that produce valid predicates that could return at least 1 row.
(This is important because all 6*6 combinations is a lot, but far fewer should actually be considered valid filter combinations.)
specifically, when:
rev_count_gt_filter = 1 (rev_count >= 2) then:
	when rev_count_lt_filter = 1 (rev_count <= 2) just remove all filters on this column
    when rev_count_lt_filter = 0 (rev_count <= 1) this is an inverted and thus invalid equality
So when generating counts, use condition rev_count_lt_filter <= rev_count_gt_filter

For reverted_within_filter / reverted_after_filter, 
use condition reverted_within_filter <= reverted_after_filter (- 1?)

ADD COLUMN delta_bytes_filter TINYINT(1) SIGNED AS (CASE 
	WHEN delta_bytes IS NULL THEN NULL
	WHEN delta_bytes >= 1000 THEN 2 
    WHEN delta_bytes < 1000 AND delta_bytes >= 20 THEN 1
    WHEN delta_bytes < 20 AND delta_bytes > -20 THEN 0
    WHEN delta_bytes > -1000 AND delta_bytes <= -20 THEN -1
    WHEN delta_bytes <= -1000 THEN -2
    ELSE NULL
END) PERSISTENT
ADD COLUMN reverted_within_filter TINYINT(1) UNSIGNED AS (CASE 
	WHEN seconds_to_revert IS NULL THEN NULL  # null when not set
	WHEN seconds_to_revert <= 6 THEN 0  # 6 seconds
    WHEN seconds_to_revert <= 6*60 THEN 1  # 6 minutes
    WHEN seconds_to_revert <= 6*60*60 THEN 2  # 6 hours
    WHEN seconds_to_revert <= 6*60*60*24 THEN 3  # 6 days
    WHEN seconds_to_revert <= 6*60*60*24*30 THEN 4  # 6 months
    ELSE 5  # 1 year
END) PERSISTENT,
ADD COLUMN reverted_after_filter TINYINT(1) UNSIGNED AS (CASE 
	WHEN seconds_to_revert IS NULL THEN NULL  # null when not set
	WHEN seconds_to_revert >= 6*60*60*24*30 THEN 5  # reverted after more than 6 months
    WHEN seconds_to_revert >= 6*60*60*24 THEN 4  # 6 days
    WHEN seconds_to_revert >= 6*60*60 THEN 3  # 6 hours
    WHEN seconds_to_revert >= 6*60 THEN 2  # 6 minutes
    WHEN seconds_to_revert >= 6 THEN 1  # 6 seconds
    ELSE 0  # reverted after less than five seconds
END) PERSISTENT;

*/

#ALTER TABLE revision MODIFY COLUMN damaging_pred_filter TINYINT AS (CASE WHEN damaging_pred >= 0.944 THEN 2 WHEN damaging_pred <= 0.301 THEN 0 ELSE 1 END) PERSISTENT;

SELECT * FROM revision;
SELECT * FROM revision WHERE damaging_pred_filter = 2;

# Create revision indices
CREATE INDEX revision_default ON revision(page_rev_count, page_namespace, is_user_bot, damaging_pred_filter, is_reverted, is_reverted_for_damage, random);
CREATE INDEX revision_default_random ON revision(random, page_rev_count, page_namespace, is_user_bot, damaging_pred_filter, is_reverted, is_reverted_for_damage);


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
        
CREATE INDEX revision_count_full_ind ON revision_count (
        damaging_pred_filter,
        reverted_filter_mask,
        reverted_within_filter,
        reverted_after_filter,
        page_namespace,
        user_type,
        rev_count_gt_filter,
        rev_count_lt_filter,
        revision_filter_mask,
        delta_bytes_filter);

DROP INDEX revision_default ON revision;

SHOW TABLE STATUS;

# Create page indices
CREATE INDEX page_title_index ON page (page_title(83) );
