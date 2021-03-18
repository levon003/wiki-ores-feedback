# For functions that depend on the enwiki replica database

from sqlalchemy import create_engine
from sqlalchemy.sql import text
from sqlalchemy.orm import sessionmaker

import click
from flask import current_app, g
from flask.cli import with_appcontext
import logging

def get_replica_engine():
    if 'replica_eng' in g:
        return g.replica_engine
    env = current_app.config['ENV']
    if env == 'toolforge':
        # see: https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database#Connecting_to_the_database_replicas
        mariadb_url = "enwiki.web.db.svc.wikimedia.cloud"
        pool_size = 6
    elif env == 'development':
        # assume an SSH tunnel is set up
        mariadb_url = '127.0.0.1'
        pool_size = 2
    mariadb_pass = current_app.config['MARIADB_PASSWORD']
    mariadb_conn_url = f'mysql+mysqldb://s54660:{mariadb_pass}@{mariadb_url}/enwiki_p?charset=utf8'
    g.replica_engine = create_engine(mariadb_conn_url,
        pool_pre_ping=True,
        encoding='utf-8',
        pool_size=pool_size,  # https://docs.sqlalchemy.org/en/14/core/pooling.html#sqlalchemy.pool.QueuePool.__init__
        max_overflow=0,
    )
    return g.replica_engine
    

def get_pages_linked_from_page_id(page_id, session):
    logger = logging.getLogger('replica.links.from')
    s = text("""
    SELECT pl.pl_from, IFNULL(redir_p.page_id, p.page_id) AS pl_to
    FROM pagelinks AS pl
    LEFT JOIN page AS p ON (pl.pl_title = p.page_title AND pl.pl_namespace = p.page_namespace)
    LEFT JOIN pagelinks AS redir_pl ON p.page_is_redirect AND p.page_id = redir_pl.pl_from
    LEFT JOIN page AS redir_p ON (redir_pl.pl_title = redir_p.page_title AND redir_pl.pl_namespace = redir_p.page_namespace)
    WHERE pl.pl_from=:page_id;
    """)
    s = s.bindparams(page_id=page_id)
    result = session.execute(s)
    page_ids = []
    multiredirect_count = 0
    for row in result.all():
        pl_from, pl_to = row
        assert pl_from == page_id
        if pl_to is None:
            # I *think* this happens in cases of multiple redirects
            # But it probably doesn't matter much
            multiredirect_count += 1
        else:
            page_ids.append(pl_to)
    logger.debug(f'Identified {len(page_ids)} pages linked from page_id {page_id}, and an additional {multiredirect_count} redirects.')
    return page_ids


def get_pages_linked_to_page_id(page_id, session):
    logger = logging.getLogger('replica.links.to')
    s = text("""
    SELECT pl.pl_from, p.page_id as pl_to, p.page_is_redirect
    FROM pagelinks AS pl
    LEFT JOIN page AS p ON (pl.pl_title = p.page_title AND pl.pl_namespace = p.page_namespace)
    WHERE p.page_id=:page_id;
    """)
    s = s.bindparams(page_id=page_id)
    result = session.execute(s)
    page_ids = []
    redirect_count = 0
    for row in result.all():
        pl_from, pl_to, page_is_redirect = row
        assert pl_to == page_id
        if page_is_redirect == 1:
            redirect_count += 1
        page_ids.append(pl_from)
    logger.debug(f'Identified {len(page_ids)} pages linked to page_id {page_id}; {redirect_count} of those are redirects.')
    return page_ids


def get_pages_by_partial_title(query_str, page_namespace, session):
    """
    :query_str Query string: Expected to have spaces replaced with underscores.
    Otherwise, this function will escape any % and _ characters and add a trailing %.
    """
    logger = logging.getLogger('replica.page.partial_title')
    s = text("""
    SELECT page_id, page_title
    FROM page
    WHERE page_is_redirect = 0 
        AND page_namespace = :page_namespace 
        AND page_title LIKE :query_str
    LIMIT 100;
    """)

    # fix query string to remove any existing wildcard characters
    query_str = query_str.replace('%', '\\%').replace('_', '\\_') + "%"

    s = s.bindparams(query_str=query_str, page_namespace=page_namespace)
    result = session.execute(s)
    page_list = []
    for row in result.all():
        page_id, page_title = row
        page_list.append({
            'page_id': page_id,
            'page_title': page_title.decode('utf-8'),
        })
    logger.debug(f'Identified {len(page_list)} pages in namespace {page_namespace} for query "{query_str}".')
    return page_list


@click.command('test-replica')
@with_appcontext
def test_replicas_command():
    logger = logging.getLogger('cli.test-replica')
    logger.info("Testing replica database connection.")

    engine = get_replica_engine()
    Session = sessionmaker(engine)
    with Session.begin() as session:

        page_id = 62715690
        page_ids = get_pages_linked_from_page_id(page_id, session)
        logger.info(f"Identified {len(page_ids)} pages linked from page {page_id}.")

        page_ids = get_pages_linked_to_page_id(page_id, session)
        logger.info(f"Identified {len(page_ids)} pages linked to page {page_id}.")

        query_str = 'Bảo_'
        page_list = get_pages_by_partial_title(query_str, 0, session)
        logger.info(f"Identified {len(page_list)} pages linked to query '{query_str}', including '{page_list[0]}'.")


def init_app(app):
    app.cli.add_command(test_replicas_command)
