import sqlite3
from tqdm import tqdm
from datetime import datetime

db = sqlite3.connect(
        '/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/audit/td_doc_indices.sqlite',
        detect_types=sqlite3.PARSE_DECLTYPES
    )
try:
    db.execute("DROP TABLE IF EXISTS inds")
    create_table_command = """
    CREATE TABLE IF NOT EXISTS inds (
          token_index INTEGER NOT NULL,
          revision_index INTEGER NOT NULL
        )
    """
    db.execute(create_table_command)
    db.commit()
    
    # create (and remove existing) table to be inserted into
    input_filepath = '/export/scratch2/levon003/repos/wiki-ores-feedback/data/derived/audit/td_doc_indices_colSorted.csv'
    with open(input_filepath, 'r') as infile:
        processed_count = 0
        s = datetime.now()
        for line in tqdm(infile, total=9367935445):
            t1, t2 = line.strip().split(',')
            token_index = int(t1)
            revision_index = int(t2)
            db.execute(
                'INSERT INTO inds (token_index, revision_index) VALUES (?, ?)',
                (token_index, revision_index)
            )
            processed_count += 1
            if processed_count % 10000000 == 0:
                db.commit()
                print(f"Rows committed after {datetime.now() - s}. ({processed_count} total)")
    db.commit()
    print(f"Final rows committed after {datetime.now() - s}. ({processed_count} total)")
finally:
    db.close()