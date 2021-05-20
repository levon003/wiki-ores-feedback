import click
from flask import current_app, g
from flask.cli import with_appcontext

import sqlalchemy as sa
from sqlalchemy import create_engine, Table, Column, Integer, SmallInteger, String, MetaData, ForeignKey, Text, Boolean, Float, Index, bindparam
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.dialects.mysql import TINYINT

import os
import json
import logging
from collections import defaultdict
from tqdm import tqdm
from datetime import datetime
import pytz
import numpy as np

from . import db


def get_metadata():
    if 'oidb_user_metadata' in g:
        return g.oidb_user_metadata
    g.oidb_user_metadata = MetaData()
    Table('activity_log', g.oidb_user_metadata,
        Column('activity_id', Integer, primary_key=True, autoincrement=True),
        Column('timestamp', Integer, nullable=False),
        Column('user_token', Text, nullable=False),
        Column('activity_type', Text, nullable=False),
        Column('new_state', Text, nullable=False),
    )
    Table('rev_annotation', g.oidb_user_metadata,
        Column('annotation_id', Integer, primary_key=True, autoincrement=True),
        Column('timestamp', Integer, nullable=False),
        Column('user_token', Text, nullable=False),
        Column('rev_id', Integer, nullable=False),
        Column('annotation_type', Text, nullable=False),
        Column('annotation_data', Text, nullable=False),
        Index('rev_annotation_multiindex', 'user_token', 'rev_id', 'annotation_type', 'timestamp'),
    )
    return g.oidb_user_metadata


def get_table(table_name):
    metadata = get_metadata()
    return metadata.tables[table_name]


def get_activity_log_table():
    return get_table('activity_log')

def get_rev_annotation_table():
    return get_table('rev_annotation')


def create_tables(engine):
    metadata = get_metadata()
    metadata.create_all(engine, checkfirst=True)


@click.command('create-user-db')
@with_appcontext
def create_user_db_command():
    logger = logging.getLogger('cli.create-user-db.main')
    logger.info("Creating and populating user tables in Tools OIDB database.")
    start = datetime.now()
    engine = db.get_oidb_engine()
    create_tables(engine)
    logger.info(f"Finished creating tables after {datetime.now() - start}.")


@click.command('drop-user-db')
@click.option('--all', 'drop_all', default=False, is_flag=True)
@with_appcontext
def drop_user_db_command(drop_all):
    logger = logging.getLogger('cli.drop-user-db.main')
    logger.info("Dropping user tables in Tools OIDB database.")
    start = datetime.now()
    engine = db.get_oidb_engine()
    metadata = MetaData(bind=engine)
    metadata.reflect()
    logger.info(f"Existing tables ({len(metadata.tables)} total):")
    for key, value in metadata.tables.items():
        logger.info(f"{key}")
    if drop_all:
        logger.info("Dropping all user tables identified via reflection.")
        metadata.drop_all(tables=[metadata.tables['rev_annotation'], metadata.tables['activity_log'], ])
    else:
        logger.info("Only listing tables without --all.")
    logger.info(f"Finished dropping table data after {datetime.now() - start}.")


def init_app(app):
    app.cli.add_command(create_user_db_command)
    app.cli.add_command(drop_user_db_command)
