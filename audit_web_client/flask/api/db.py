import click
from flask import current_app, g
from flask.cli import with_appcontext

import sqlalchemy as sa
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, ForeignKey, Text, Boolean, Float, Index
from sqlalchemy.orm import sessionmaker, scoped_session

import os
import json
import logging
from collections import defaultdict
from tqdm import tqdm
from datetime import datetime

INSERT_BATCH_SIZE = 1000000


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


def get_metadata():
    if 'oidb_metadata' in g:
        return g.oidb_metadata
    g.oidb_metadata = MetaData()
    Table('page', g.oidb_metadata,
        Column('page_id', Integer, primary_key=True),
        Column('wiki_namespace', Integer, nullable=False),
        Column('page_title', Text, nullable=False),
        Column('is_redirect', Boolean, nullable=False),
        Column('rev_count', Integer, nullable=False),
    )
    Table('revision', g.oidb_metadata,
        Column('rev_id', Integer, primary_key=True),
        Column('page_id', None, ForeignKey('page.page_id')),
        Column('prev_rev_id', Integer),

        Column('rev_timestamp', Integer, nullable=False),
        Column('seconds_to_prev', Integer),
        Column('is_minor', Boolean, nullable=False),
        Column('has_edit_summary', Boolean, nullable=False),

        Column('user_text', Text(length=85), nullable=False),
        Column('user_id', Integer),  # note: "user_id IS NULL" means "unregistered"
        Column('is_user_registered', Boolean, nullable=False),
        Column('is_user_bot', Boolean, nullable=False),
        Column('n_user_contributions_at_rev', Integer, nullable=False),
                     
        Column('curr_bytes', Integer, nullable=False),
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
    return g.oidb_metadata


def get_table(table_name):
    metadata = get_metadata()
    return metadata.tables[table_name]


def get_page_table():
    return get_table('page')


def get_revision_table():
    return get_table('revision')


def create_tables(engine):
    #logger = logging.getLogger('cli.create-db.create_tables')
    metadata = get_metadata()
    metadata.create_all(engine, checkfirst=True)
    

def import_oidb_data(engine, import_page, import_revision):
    logger = logging.getLogger('cli.create-db.import_oidb_data')

    metadata = MetaData(bind=engine)
    metadata.reflect()
    page_table = metadata.tables['page']
    revision_table = metadata.tables['revision']

    # hard-coding flagon paths
    data_dir = "/export/scratch2/levon003/repos/wiki-ores-feedback/data"
    if not os.path.exists(data_dir):
        logger.error(f"Expected data directory '{data_dir}'. Is this Flagon?")
        return
    oidb_dir = os.path.join(data_dir, 'derived', 'stub-history-all-revisions', 'oidb')
    
    page_table_filepath = os.path.join(oidb_dir, 'page.ndjson')
    rev_tsv_filepath = os.path.join(oidb_dir, 'revs.tsv')

    if import_page:
        logger.info("Creating page table.")
        import_page_data(engine, page_table, page_table_filepath)
    else:
        logger.debug("Skipping page table creation.")

    if import_revision:
        logger.info("Creating revision table.")
        import_revision_data(engine, revision_table, data_dir, oidb_dir, rev_tsv_filepath)
    else:
        logger.debug("Skipping revision table creation.")


def import_page_data(engine, page_table, page_table_filepath):
    logger = logging.getLogger('cli.create-db.import_page_data')
    start = datetime.now()
    with engine.connect() as conn: 
        # import page data
        processed_count = 0
        with open(page_table_filepath) as infile:
            page_list = []
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
                    logger.debug(f"Committed page insert with {len(page_list)} pages ({processed_count} total) in {datetime.now() - start}.")
                    page_list = []
            if len(page_list) > 0:
                conn.execute(page_table.insert(), page_list)
                page_list = []
            logger.debug(f"Finished constructing page table ({processed_count} total) in {datetime.now() - start}.")


def import_revision_data(engine, revision_table, data_dir, oidb_dir, rev_tsv_filepath):
    """
    Note: imports 55493557 revisions in 4:10:29
    """
    logger = logging.getLogger('cli.create-db.import_revision_data')
    # load in bot users
    registered_bot_username_filepath = os.path.join(data_dir, 'raw', 'bots', 'registered-enwiki-bots-quarry53348-2021-03-18.tsv')
    with open(registered_bot_username_filepath, 'r') as infile:
        header = infile.readline()
        registered_bot_user_ids = set()
        for line in infile:
            user_id, _, _, _ = line.strip().split('\t')
            user_id = int(user_id)
            registered_bot_user_ids.add(user_id)
    logger.info(f"Loaded {len(registered_bot_user_ids)} registered bot user ids.")

    # load existing user edit counts
    edit_counts_filepath = os.path.join(oidb_dir, 'pre2018_edit_counts.tsv')
    user_id_editcount_dict = defaultdict(int)
    user_text_editcount_dict = defaultdict(int)
    with open(edit_counts_filepath, 'r') as infile:
        for line in infile:
            user_id, editcount = line.strip().split('\t')
            user_id_editcount_dict[user_id] = editcount
    logger.info(f"Loaded {len(user_id_editcount_dict)} user ids with existing non-zero edit counts.")

    start = datetime.now()
    end_date = datetime.fromisoformat('2019-01-01')
    end_timestamp = int(end_date.timestamp())
    logger.info(f"Loading revisions created before {end_date}.")
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
                user_id = None if user_id == 'None' or user_id == '' else int(user_id)
                if user_id is not None:
                    user_id_editcount_dict[user_id] += 1
                    n_user_contributions_at_rev = user_id_editcount_dict[user_id]
                else:  # this is an unregistered user; we could these separately
                    user_text_editcount_dict[user_text] += 1
                    n_user_contributions_at_rev = user_text_editcount_dict[user_id]
                is_user_bot = user_id is not None and user_id in registered_bot_user_ids
                rev_data = {
                    'page_id': int(page_id),
                    'rev_id': int(rev_id), 
                    'prev_rev_id': int(prev_rev_id) if prev_rev_id != 'None' else None, 
                    'is_minor': is_minor == 'True', 
                    'user_text': user_text, 
                    'user_id': user_id, 
                    'rev_timestamp': int(rev_timestamp), 
                    'seconds_to_prev': int(seconds_to_prev) if seconds_to_prev != 'None' else None, 
                    'curr_bytes': int(curr_bytes), 
                    'delta_bytes': int(delta_bytes) if delta_bytes != 'None' else None, 
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
                    'is_user_registered': user_id is not None,
                }
                rev_list.append(rev_data)

                if len(rev_list) >= INSERT_BATCH_SIZE:
                    conn.execute(revision_table.insert(), rev_list)
                    logger.debug(f"Revision insert complete ({processed_count} total) in {datetime.now() - start}.")
                    rev_list = []
            if len(rev_list) > 0:
                conn.execute(revision_table.insert(), rev_list)
                rev_list = []
            logger.debug(f"Final revision insert ({processed_count} total) complete in {datetime.now() - start}.")


@click.command('create-index')
@click.option('--page/--no-page', 'create_page', default=False)
@click.option('--revision/--no-revision', 'create_revision', default=False)
@with_appcontext
def create_index_command(create_page, create_revision):
    logger = logging.getLogger('cli.create-index.main')
    logger.info('Creating indices.')
    engine = get_oidb_engine()
    if create_page:
        page = get_page_table()
        i = Index('page_page_id', page.c.page_id)
        i.create(engine, checkfirst=True)
        logger.info('Created page indices.')
    logger.info('Finished creating specified indices.')


@click.command('create-db')
@click.option('--page/--no-page', 'import_page', default=False)
@click.option('--revision/--no-revision', 'import_revision', default=False)
@with_appcontext
def create_db_command(import_page, import_revision):
    logger = logging.getLogger('cli.create-db.main')
    logger.info("Creating and populating OIDB database in Tools.")
    start = datetime.now()
    engine = get_oidb_engine()
    create_tables(engine)
    logger.info(f"Finished creating tables after {datetime.now() - start}.")
    import_oidb_data(engine, import_page, import_revision)
    logger.info(f"Finished importing table data after {datetime.now() - start}.")


@click.command('drop-db')
@click.option('--revision-only', default=False, is_flag=True)
@click.option('--page-only', default=False, is_flag=True)
@click.option('--all', 'drop_all', default=False, is_flag=True)
@with_appcontext
def drop_db_command(revision_only, page_only, drop_all):
    print(revision_only, page_only, drop_all)
    logger = logging.getLogger('cli.drop-db.main')
    logger.info("Dropping OIDB database in Tools.")
    start = datetime.now()
    engine = get_oidb_engine()
    metadata = MetaData(bind=engine)
    metadata.reflect()
    logger.info(f"Existing tables ({len(metadata.tables)} total):")
    for key, value in metadata.tables.items():
        logger.info(f"{key}")
    if drop_all:
        logger.info("Dropping all tables identified via reflection.")
        metadata.drop_all()
    elif revision_only:
        logger.info("Dropping revision table.")
        metadata.drop_all(tables=[metadata.tables['revision'],])
    elif page_only: 
        logger.info("Dropping page table.")
        metadata.drop_all(tables=[metadata.tables['page'],])
    else:
        logger.info("No table specified; dropping nothing.")
    #to_drop = []
    #metadata.drop_all(tables=['revision',])
    logger.info(f"Finished dropping table data after {datetime.now() - start}.")


def init_app(app):
    app.cli.add_command(create_db_command)
    app.cli.add_command(drop_db_command)
    app.cli.add_command(create_index_command)
    app.teardown_appcontext(teardown_engine)
    app.teardown_request(teardown_session)
