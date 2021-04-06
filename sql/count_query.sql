SELECT pt.wiki_namespace, COUNT(rt.rev_id)
FROM revision rt
LEFT JOIN page pt ON rt.page_id = pt.page_id
GROUP BY pt.wiki_namespace;

SELECT COUNT(*), SUM(rt.is_reverted)
FROM revision rt
LEFT JOIN page pt ON rt.page_id = pt.page_id
WHERE pt.wiki_namespace = 0
AND rt.is_user_bot IS TRUE;
