# create some indexes that might help
CREATE INDEX t1_ind ON t1 (t1_filter_condition, order_info );
CREATE INDEX t1_join_ind ON t1 (user_id, t1_filter_condition, order_info);
CREATE INDEX t2_ind ON t2 (t2_filter_condition);
# query t1 with filter conditions active, returning in fixed order
SELECT t1.id, t1.info, t1.user_id FROM t1
WHERE t1.t1_filter_condition = 0
ORDER BY t1.order_info
LIMIT 100;  # very fast query, index used
# query t1 + t2 columns with filter conditions active for t1 and t2, returning in fixed order
SELECT t1.id, t1.info, t1.user_id, t2.info
FROM t1
LEFT JOIN t2 ON t1.user_id = t2.user_id
WHERE t1.t1_filter_condition = 0 AND t2.t2_filter_condition = 1
ORDER BY t1.order_info
LIMIT 100;  # very slow query