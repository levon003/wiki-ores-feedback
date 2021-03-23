import click
from flask import current_app, g
from flask.cli import with_appcontext

import sqlalchemy as sa
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import sessionmaker, scoped_session

import os
import json
import logging
from collections import defaultdict
from tqdm import tqdm
from datetime import datetime


def get_oidb_engine():
    if 'oidb_engine' in g:
        return g.oidb_engine
    env = current_app.config['ENV']
    if env == 'toolforge':
        # see: https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database#Connecting_to_the_database_replicas
        mariadb_url = "tools.db.svc.wikimedia.cloud"
        pool_size = 6
    elif env == 'development':
        # assume an SSH tunnel is set up
        mariadb_url = '127.0.0.1:3307'
        pool_size = 2
    else:
        raise ValueError(f"Unknown database environment '{env}'.")
    mariadb_pass = current_app.config['MARIADB_PASSWORD']
    mariadb_conn_url = f'mysql+mysqldb://s54660:{mariadb_pass}@{mariadb_url}/s54660__oidb?charset=utf8'
    g.oidb_engine = create_engine(mariadb_conn_url,
        pool_pre_ping=True,
        encoding='utf-8',
        pool_size=pool_size,  # https://docs.sqlalchemy.org/en/14/core/pooling.html#sqlalchemy.pool.QueuePool.__init__
        max_overflow=0,
    )
    return g.oidb_engine
    

def get_oidb_session():
    if 'oidb_session' in g:
        return g.oidb_session
    engine = get_oidb_engine()
    g.oidb_session = scoped_session(sessionmaker(engine))
    return g.oidb_session


def teardown_session(exception):
    session = g.pop('oidb_session', None)
    if session is not None:
        session.remove()


def teardown_engine(exception):
    engine = g.pop('oidb_engine', None)
    if engine is not None:
        engine.dispose()


def create_tables(engine):
    logger = logging.getLogger('cli.create-db.create_tables')
    metadata = MetaData()

    page = Table('page', metadata,
        Column('page_id', Integer, primary_key=True),
        Column('wiki_namespace', Integer, nullable=False),
        Column('page_title', Text, nullable=False),
        Column('is_redirect', Boolean, nullable=False),
        Column('rev_count', Integer, nullable=False),
    )

    revision = Table('revision', metadata,
        Column('rev_id', Integer, primary_key=True),
        Column('page_id', None, ForeignKey('page.page_id')),
        Column('prev_rev_id', Integer),

        Column('rev_timestamp', Integer, nullable=False),
        Column('seconds_to_prev', Integer),
        Column('is_minor', Boolean, nullable=False),
        Column('has_edit_summary', Boolean, nullable=False),

        Column('user_text', Text(length=85), nullable=False),
        Column('user_id', Integer),  # note: "user_id IS NULL" means "unregistered"
        Column('is_user_bot', Boolean, nullable=False),
        Column('n_user_contributions_at_rev', Integer, nullable=False),
                     
        Column('curr_bytes', Integer),
        Column('delta_bytes', Integer),
        
        Column('is_reverted', Boolean, nullable=False),
        Column('is_revert', Boolean, nullable=False),
        Column('is_self_reverted', Boolean, nullable=False),
        Column('is_self_revert', Boolean, nullable=False),
        Column('revert_target_id', Integer),
        Column('revert_set_size', Integer),
        Column('revert_id', Integer),
        Column('seconds_to_revert', Integer),

        Column('damaging_pred', Float),
        Column('goodfaith_pred', Float),
    )

    metadata.drop_all(engine, checkfirst=True)
    metadata.create_all(engine, checkfirst=True)


def import_oidb_data(engine):
    logger = logging.getLogger('cli.create-db.import_oidb_data')

    metadata = MetaData(bind=engine)
    metadata.reflect()
    page_table = metadata.tables['page']
    revision_table = metadata.tables['revision']

    INSERT_BATCH_SIZE = 1000000
    # hard-coding flagon paths
    data_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback/data"
    if not os.path.exists(data_dir):
        logger.error(f"Expected data directory '{data_dir}'. Is this Flagon?")
        return
    oidb_dir = os.path.join(data_dir, 'derived', 'stub-history-all-revisions', 'oidb')
    
    page_table_filepath = os.path.join(oidb_dir, 'page.ndjson')
    rev_tsv_filepath = os.path.join(oidb_dir, 'revs.tsv')

    start = datetime.now()
    with engine.connect() as conn: 
        # import page data
        with open(page_table_filepath) as infile:
            page_list = []
            processed_count += 1
            for line in tqdm(infile, total=15082470, desc='Constructing page table'):
                page = json.loads(line)
                page_data = {
                    'page_id': int(page['page_id']),
                    'wiki_namespace': int(page['wiki_namespace']),
                    'page_title': page['page_title'],
                    'is_redirect': int(page['is_page_redirect']) == 1,
                    'rev_count': int(page['range_rev_count']),
                }
                if page_data['rev_count'] == 0:
                    # omit pages that appear only in 2019, not in 2018
                    continue
                processed_count += 1
                page_list.append(page_data)

                if len(page_list) >= INSERT_BATCH_SIZE:
                    conn.execute(page_table.insert(), page_list)
            if len(page_list) > 0:
                conn.execute(page_table.insert(), page_list)
            logger.debug(f"Finished constructing page table ({processed_count} total) in {datetime.now() - start}.")


    # load in bot users
    registered_bot_username_filepath = os.path.join(data_dir, 'raw', 'bots', 'registered-enwiki-bots-quarry53348-2021-03-18.tsv')
    with open(registered_bot_username_filepath, 'r') as infile:
        header = infile.readline()
        registered_bot_user_ids = set()
        for line in infile:
            user_id, _, _, _ = line.strip().split('\t')
            user_id = int(user_id)
            registered_bot_user_ids.add(user_id)

    # load existing user edit counts
    edit_counts_filepath = os.path.join(oidb_dir, 'pre2018_edit_counts.tsv')
    user_id_editcount_dict = defaultdict(int)
    user_text_editcount_dict = defaultdict(int)
    with open(edit_counts_filepath, 'r') as infile:
        for line in infile:
            user_id, editcount = line.strip().split('\t')
            user_id_editcount_dict[user_id] = editcount

    start = datetime.now()
    end_date = datetime.fromisoformat('2019-01-01')
    end_timestamp = int(end_date.timestamp())
    with engine.connect() as conn: 
        with open(rev_tsv_filepath, 'r') as infile:
            processed_count = 0
            rev_list = []
            for line in tqdm(infile, total=111200155, desc='Constructing revision table'):
                processed_count += 1
                tokens = line.strip().split('\t')
                assert len(tokens) == 20
                rev_timestamp, page_id, rev_id, prev_rev_id, is_minor, user_text, user_id, rev_timestamp, seconds_to_prev, curr_bytes, delta_bytes, has_edit_summary, is_reverted, is_revert, is_self_reverted, is_self_revert, revert_target_id, revert_set_size, revert_id, seconds_to_revert = tokens
                rev_timestamp = int(rev_timestamp)
                if rev_timestamp > end_timestamp:
                    # only includes revisions up to end_timestamp
                    break

                # we track the number of edits made by each user over time
                # note: assumes that each line is sequential
                if user_id is not None:
                    user_id = int(user_id)
                    user_id_editcount_dict[user_id] += 1
                    n_user_contributions_at_rev = user_id_editcount_dict[user_id]
                else:  # this is an unregistered user; we could these separately
                    user_text_editcount_dict[user_text] += 1
                    n_user_contributions_at_rev = user_text_editcount_dict[user_id]
                is_user_bot = user_id is not None and user_id in registered_bot_user_ids
                rev_data = {
                    'page_id': int(page_id),
                    'rev_id': int(rev_id), 
                    'prev_rev_id': int(prev_rev_id), 
                    'is_minor': is_minor == 'True', 
                    'user_text': user_text, 
                    'user_id': int(user_id), 
                    'rev_timestamp': int(rev_timestamp), 
                    'seconds_to_prev': int(seconds_to_prev), 
                    'curr_bytes': int(curr_bytes), 
                    'delta_bytes': int(delta_bytes), 
                    'has_edit_summary': has_edit_summary == 'True', 
                    'is_reverted': is_reverted == 'True', 
                    'is_revert': is_revert == 'True',
                    'is_self_reverted': is_self_reverted == 'True',
                    'is_self_revert': is_self_revert == 'True',
                    'revert_target_id': int(revert_target_id) if revert_target_id != 'None' else None,
                    'revert_set_size': int(revert_set_size) if revert_set_size != 'None' else None,
                    'revert_id': int(revert_id) if revert_id != 'None' else None,
                    'seconds_to_revert': int(seconds_to_revert) if seconds_to_revert != 'None' else None, 
                    'n_user_contributions_at_rev': n_user_contributions_at_rev,
                    'is_user_bot': is_user_bot,
                }
                rev_list.append(rev_data)

                if len(rev_list) >= INSERT_BATCH_SIZE:
                    conn.execute(revision_table.insert(), rev_list)
                    logger.debug(f"Revision insert complete ({processed_count} total) in {datetime.now() - start}..")
            if len(rev_list) > 0:
                conn.execute(revision_table.insert(), rev_list)
                logger.debug(f"Final revision insert ({processed_count} total) complete in {datetime.now() - start}.")

def create_test_data(engine):
    metadata = MetaData(bind=engine)
    metadata.reflect()

    page_metadata = metadata.tables['page_metadata']
    category_name = metadata.tables['category_name']
    page_category = metadata.tables['page_category']
    revision = metadata.tables['revision']

    conn = engine.connect()
    conn.execute(page_metadata.insert(), [
        {'page_id': 0, 'wiki_namespace': 0, 'page_name': 'Salt', 'rev_count': 1},
        {'page_id': 1, 'wiki_namespace': 0, 'page_name': 'Paul Dourish', 'rev_count': 2},
    ])
    conn.execute(category_name.insert(), [
        {'category_id': 0, 'category_name': 'LGBT History'},
        {'category_id': 1, 'category_name': 'Food'},
        {'category_id': 2, 'category_name': 'Computer Scientists'},
    ])
    conn.execute(page_category.insert(), [
        {'page_id': 0, 'page_category': 1},
        {'page_id': 1, 'page_category': 0},
        {'page_id': 1, 'page_category': 2},
    ])

    conn.execute(revision.insert(), [
        {
            'rev_id': 1, 
            'page_id': 0,
            'prev_rev_id': 0,
            'rev_timestamp': 1396329403,
            'prev_rev_timestamp': 1396328403,
            'is_minor': False,
            'username': 'Suriname0',
            'is_user_registered': True,
            'is_user_bot': False,
            'n_user_contributions_at_rev': 100,
            'damaging_pred': 0.0001,
            'goodfaith_pred': 0.999,
        },
        {
            'rev_id': 2, 
            'page_id': 0,
            'prev_rev_id': 1,
            'rev_timestamp': 1396329603,
            'prev_rev_timestamp': 1396329403,
            'is_minor': False,
            'username': 'Suriname0',
            'is_user_registered': True,
            'is_user_bot': False,
            'n_user_contributions_at_rev': 101,
            'damaging_pred': 0.995,
            'goodfaith_pred': 0.001,
        },
    ])
    


@click.command('create-db')
@with_appcontext
def create_db_command():
    logger = logging.getLogger('cli.create-db.main')
    logger.info("Creating and populating OIDB database in Tools.")
    start = datetime.now()
    engine = get_oidb_engine()
    create_tables(engine)
    logger.info(f"Finished creating tables after {datetime.now() - start}.")
    import_oidb_data(engine)
    logger.info(f"Finished importing table data after {datetime.now() - start}.")


def init_app(app):
    #app.teardown_appcontext(close_db)
    app.cli.add_command(create_db_command)
    app.teardown_appcontext(teardown_engine)
    app.teardown_request(teardown_session)
