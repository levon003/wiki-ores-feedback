import click
from flask import current_app, g
from flask.cli import with_appcontext

import sqlalchemy as sa
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, ForeignKey, Text


def get_engine():
    env = current_app.config['ENV']
    if env == 'development':
        #engine = create_engine('sqlite:///:memory:', echo=True)
        test_db_filepath = f'sqlite:///{current_app.root_path}/test/oidb.sqlite'
        print(test_db_filepath)
        engine = create_engine(test_db_filepath, echo=True)
        return engine
    elif env == 'toolforge':
        mariadb_pass = current_app.config['MARIADB_PASSWORD']
        mariadb_url = f'mysql+mysqldb://s5660:{mariadb_pass}@tools.db.svc.eqiad.wmflabs/s5660__oidb'
        engine = create_engine(mariadb_url,
            pool_pre_ping=True,
        )
        return engine
    else:
        raise ValueError(f"Unknown database environment '{env}'.")


def create_tables(engine):
    metadata = MetaData()

    page_metadata = Table('page_metadata', metadata,
        Column('page_id', Integer, primary_key=True),
        Column('wiki_namespace', Integer, nullable=False),
        Column('page_name', Text, nullable=False),
        Column('rev_count', Integer, nullable=False),
    )

    category_name = Table('category_name', metadata,
        Column('category_id', Integer, primary_key=True),
        Column('category_name', Text, nullable=False),
    )

    page_category = Table('page_category', metadata,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('page_id', None, ForeignKey('page_metadata.page_id')),
        Column('category_id', None, ForeignKey('category_name.category_id')),
    )

    metadata.create_all(engine, checkfirst=True)


def create_test_data(engine):
    metadata = MetaData(bind=engine)
    metadata.reflect()

    page_metadata = metadata.tables['page_metadata']
    category_name = metadata.tables['category_name']
    page_category = metadata.tables['page_category']

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
    


@click.command('create-db')
@with_appcontext
def create_db_command():
    print("Creating test database.")
    engine = get_engine()
    create_tables(engine)
    create_test_data(engine)


def init_app(app):
    #app.teardown_appcontext(close_db)
    app.cli.add_command(create_db_command)
