# For functions that depend on the enwiki replica database

from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.sql import text, select
from sqlalchemy.orm import sessionmaker, scoped_session

import click
from flask import current_app, g
from flask.cli import with_appcontext
import logging


def get_replica_engine():
    if 'replica_engine' in g:
        return g.replica_engine
    env = current_app.config['ENV']
    if env == 'toolforge':
        # see: https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database#Connecting_to_the_database_replicas
        mariadb_url = "enwiki.web.db.svc.wikimedia.cloud"
        pool_size = 6
    elif env == 'development':
        # assume an SSH tunnel is set up
        mariadb_url = f"127.0.0.1:{current_app.config['REPLICA_DB_PORT']}"
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
    

def get_replica_session():
    if 'replica_session' in g:
        return g.replica_session
    engine = get_replica_engine()
    g.replica_session = scoped_session(sessionmaker(engine))
    return g.replica_session


def teardown_session(exception):
    session = g.pop('replica_session', None)
    if session is not None:
        session.remove()


def teardown_engine(exception):
    engine = g.pop('replica_engine', None)
    if engine is not None:
        engine.dispose()


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


def _get_pages_in_categories(metadata, session, category_set, curr_depth=0, max_depth=None):
    """
    :returns page_ids - a set of page_ids
             previous_category_dict - a list of tuples: (page_id, parent_category, curr_depth)
    """
    logger = logging.getLogger('replica.get_pages_in_categories')
    page_ids = set()
    page_category_list = []
    previous_category_dict = {}
    while len(category_set) > 0 and (max_depth is None or curr_depth < max_depth):
        if len(category_set) > 999:
            logger.warn(f"Searching for {len(category_set)} > 999 categories at depth {curr_depth}, which might violate MariaDB's IN clause limits.")
            logger.warn("This might just break, or we might need to randomly remove categories until fewer than 999 exist at a given depth.")

        # this is the proper way to do this, but I couldn't make this work in SQLAlchemy
        """ pt = metadata.tables['page']
        clt = metadata.tables['categorylinks']
        
        s = select(
            pt.c.page_id,
            pt.c.page_namespace,
            pt.c.page_title,
            pt.c.page_is_redirect,
            clt.c.cl_to,
            clt.c.cl_type
        ).select_from(
            pt.join(clt, 
                clt.c.cl_from == pt.c.page_id,
            )
        ).where(
            # can't pass strings for a VARBINARY(255) column
            clt.c.cl_to.in_([bytes(cat, "utf-8") for cat in category_set])
        ) """

        s = text("""
        SELECT p.page_id, p.page_namespace, p.page_title, p.page_is_redirect, cl.cl_to, cl.cl_type
        FROM page p
        JOIN categorylinks cl ON cl.cl_from = p.page_id
        WHERE cl.cl_to IN :category_list;
        """)
        s = s.bindparams(category_list=list(category_set))
        logger.info(f"Generated category query: {s} (with |category_list|={len(category_set)}; curr_depth={curr_depth}; {len(page_ids)} found so far)")

        # mark categories in query as previously searched
        for category in category_set:
            previous_category_dict[category] = curr_depth
        category_set = set()
        
        result = session.execute(s)
        for row in result:
            cl_type = row.cl_type.decode("utf-8")
            page_title = row.page_title.decode("utf-8")
            cl_to = row.cl_to.decode("utf-8")
            parent_category = cl_to
            if cl_type == 'page':
                page_ids.add(row.page_id)
                page_category_list.append((row.page_id, parent_category, curr_depth))
            elif cl_type == 'subcat':
                child_category = page_title
                assert row.page_namespace == 14
                if child_category in previous_category_dict:
                    # this is a cycle
                    # don't include it
                    pass
                else:  # this is a new category
                    category_set.add(str(child_category))
                    #logger.info(f"New category '{child_category}'; depth={curr_depth}")
        curr_depth += 1
    return page_ids, page_category_list


def get_pages_in_category(category, max_depth=None):
    engine = get_replica_engine()
    metadata = MetaData()
    # reflect the tables needed in the query
    Table('page', metadata, autoload_with=engine)
    Table('categorylinks', metadata, autoload_with=engine)
    
    Session = get_replica_session()
    with Session() as session:
        with session.begin():
            return _get_pages_in_categories(metadata, session, set([category]), max_depth=max_depth)


@click.command('test-replica')
@with_appcontext
def test_replicas_command():
    logger = logging.getLogger('cli.test-replica')
    logger.info("Testing replica database connection.")

    Session = get_replica_session()
    with Session() as session:
        with session.begin():
            page_id = 62715690
            page_ids = get_pages_linked_from_page_id(page_id, session)
            logger.info(f"Identified {len(page_ids)} pages linked from page {page_id}.")

            page_ids = get_pages_linked_to_page_id(page_id, session)
            logger.info(f"Identified {len(page_ids)} pages linked to page {page_id}.")

            query_str = 'Bảo_'
            page_list = get_pages_by_partial_title(query_str, 0, session)
            logger.info(f"Identified {len(page_list)} pages linked to query '{query_str}', including '{page_list[0]}'.")


@click.command('get-pages-in-category')
@click.option('--category', 'category', default="LGBT_history", show_default=True, type=str, help='root category to search through')
@click.option('--stdout/--no-stdout', 'write_to_stdout', default=False, show_default=True, help='if the pages found should be written to stdout')
@with_appcontext
def get_pages_in_category_command(category, write_to_stdout):
    logger = logging.getLogger('replica.cli.main')
    logger.info("Testing replica database connection.")

    page_ids, page_category_list = get_pages_in_category(category)
    
    logger.info(f"Identified {len(page_ids)} pages in category '{category}'.")

    if write_to_stdout:
        # write the page_category_list to stdout
        for tup in page_category_list:
            line = "\t".join([str(v) for v in tup])
            print(line)


def init_app(app):
    app.cli.add_command(test_replicas_command)
    app.cli.add_command(get_pages_in_category_command)
    app.teardown_appcontext(teardown_engine)
    app.teardown_request(teardown_session)
