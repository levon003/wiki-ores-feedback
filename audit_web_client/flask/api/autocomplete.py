
import click
from flask import current_app, g, request, make_response, Blueprint
from flask.cli import with_appcontext

from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import select

import logging
from urllib.parse import unquote
from datetime import datetime

from . import replica
from . import db

bp = Blueprint('autocomplete', __name__)

def get_namespace_prefix_dict():
    if 'namespace_prefix_dict' in g:
        return g.namespace_prefix_dict
    # see: https://en.wikipedia.org/wiki/Wikipedia:Namespace
    g.namespace_prefix_dict = {
        'Main:': 0,
        'Article:': 0,
        'Talk:': 1,
        'User:': 2,
        'User_talk:': 3,
        'WP:': 4,
        'Project:': 4,
        'Wikipedia:': 4,
        'MOS:': 4,  # pseudo-namespace
        'WT:': 5,
        'Project_talk:': 5,
        'Wikipedia_talk:': 5,
        'File:': 6,
        'Image:': 6,
        'File_talk:': 7,
        'Image_talk:': 7,
        'MediaWiki:': 8,
        'MediaWiki_talk:': 9,
        'Template:': 10,
        'T:': 10,  # pseudo-namespace
        'Template_talk:': 11,
        'Help:': 12,
        'H:': 12,  # pseudo-namespace
        'Help_talk:': 13,
        'Category:': 14,
        'CAT:': 14,  # pseudo-namespace
        'Category_talk:': 15,
        'Portal:': 100,
        'P:': 100,  # pseudo-namespace
        'Portal_talk:': 101,
        'Draft:': 118,
        'Draft_talk:': 119,
    }
    return g.namespace_prefix_dict


def sort_page_list_by_edit_count(ns, page_list):
    """
    Sorts page_list in-place by edit count, and adds the rev_count key to the associated page dictionaries.

    :page_list: list of page dictionaries, each of which has a page_id key
    """
    logger = logging.getLogger('autocomplete.sort_page_list_by_edit_count')
    if len(page_list) == 0:
        return
    page_ids = [page['page_id'] for page in page_list]
    # mapping of page_id to an index in the page_list
    page_id_index_dict = {page['page_id']: i for i, page in enumerate(page_list)}
    Session = db.get_oidb_session()
    with Session() as session:
        with session.begin():
            pt = db.get_page_table()
            s = select(pt.c.page_id, pt.c.rev_count).where(pt.c.page_id.in_(page_ids))
            for row in session.execute(s):
                page_id, rev_count = row
                ind = page_id_index_dict[page_id]
                page_list[ind]['rev_count'] = rev_count
                del page_id_index_dict[page_id]
    if len(page_id_index_dict) > 0:
        logger.debug(f"Identified {len(page_id_index_dict)} pages in autocomplete results with 0 edits.")
        for ind in page_id_index_dict.values():
            page_list[ind]['rev_count'] = 0
    # sort the list of pages according to the retrieved edit counts
    page_list.sort(key=lambda page: page['rev_count'], reverse=True)
    logger.debug(f"Sorted {len(page_list)} pages by edit count ({len(page_id_index_dict)} / {len(page_list)} have 0 edits).")


@bp.route('/api/autocomplete/page_title')
def autocomplete_page_title():
    logger = logging.getLogger('autocomplete.page_title')
    start = datetime.now()
    query_str = request.args.get('query', '')
    query_str = unquote(query_str)
    if query_str.strip() == '':
        logger.debug(f"Served query request with query param '{request.args.get('query', 'NONE')}'.")
        return make_response("Need a non-empty text query.", 400)
    query_str = query_str.replace(' ', '_')
    logger.debug(f"Serving autocomplete request with query '{query_str}'.")


    ns = 0   # default: assume namespace 0 (main/article)
    ns_prefix = ""
    if ':' in query_str:
        # check to see if this is a namespace prefix
        # if it is, change the searched namespace
        ns_prefix_dict = get_namespace_prefix_dict()
        ns_prefix = query_str.split(':')[0] + ':'
        logger.debug(f"Investigating potential namespace prefix '{ns_prefix}'.")
        if ns_prefix in ns_prefix_dict:
            ns = ns_prefix_dict[ns_prefix]
            query_str = query_str[len(ns_prefix):]
            logger.debug(f"Treating prefix '{ns_prefix}' as namespace {ns} for query '{query_str}'.")
        else:
            ns_prefix = ""

    Session = replica.get_replica_session()
    with Session() as session:
        with session.begin():
            page_list = replica.get_pages_by_partial_title(query_str, ns, session)
    logger.info(f"Identified {len(page_list)} pages for query '{query_str}' in {datetime.now() - start}.")

    sort_page_list_by_edit_count(ns, page_list)

    page_title_data = []
    for page in page_list[:5]:
        page_title_data.append({
            'page_id': page['page_id'],
            'primary_text': ns_prefix + page['page_title'].replace('_', ' '),
            'secondary_text': f"{page['rev_count']} edits"
        })
    logger.info(f"Constructed result set from {len(page_list)} page titles for query '{query_str}' in {datetime.now() - start}.")

    return {'options': page_title_data, 'page_namespace': ns}

