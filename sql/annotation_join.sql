SELECT * FROM revision LIMIT 10;

SELECT * FROM rev_annotation;

# create test data
INSERT INTO rev_annotation 
SET rev_id = 876227289, annotation_type="note", annotation_data="a", timestamp=0, user_token="";
INSERT INTO rev_annotation 
SET rev_id = 876227289, annotation_type="note", annotation_data="b", timestamp=1, user_token="";
INSERT INTO rev_annotation 
SET rev_id = 876227289, annotation_type="correctness", annotation_data="d", timestamp=1, user_token="";
INSERT INTO rev_annotation 
SET rev_id = 876227290, annotation_type="correctness", annotation_data="c", timestamp=1, user_token="";


SELECT revision.rev_id, 
	ra_note.annotation_id, 
    ra_note.annotation_type, 
    ra_note.annotation_data AS note_data,
    ra_c.annotation_id,
    ra_c.annotation_type,
    ra_c.annotation_data AS correctness_data
FROM revision
LEFT JOIN rev_annotation AS ra_note ON 
	(ra_note.rev_id = revision.rev_id 
    AND ra_note.user_token = "" 
    AND ra_note.annotation_type = "note")
LEFT JOIN rev_annotation AS ra_c ON 
	(ra_c.rev_id = revision.rev_id 
    AND ra_c.user_token = "" 
    AND ra_c.annotation_type = "correctness")
WHERE revision.rev_id IN (876227289, 876227290, 876227291)
AND (ra_note.annotation_id IS NULL OR ra_note.annotation_id = (SELECT MAX(ra_note.annotation_id) AS max_annotation_id
    FROM rev_annotation AS ra_note
    WHERE revision.rev_id = ra_note.rev_id 
    AND ra_note.user_token = "" 
    AND ra_note.annotation_type = 'note') )
AND (ra_c.annotation_id IS NULL OR ra_c.annotation_id = (SELECT MAX(ra_c.annotation_id) AS max_annotation_id
    FROM rev_annotation AS ra_c
    WHERE revision.rev_id = ra_c.rev_id 
    AND ra_c.user_token = "" 
    AND ra_c.annotation_type = 'correctness') )
;




AND (ra_note.annotation_type = "note" OR ra_note.annotation_type IS NULL)
AND (ra_note.user_token = "" OR ra_note.user_token IS NULL)

AND (ra_c.annotation_type = "correctness" OR ra_c.annotation_type IS NULL)
AND (ra_c.user_token = "" OR ra_c.user_token IS NULL)
