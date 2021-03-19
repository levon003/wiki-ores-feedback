
import click
from flask import current_app, g, request, make_response, Blueprint
from flask.cli import with_appcontext

from sqlalchemy.orm import sessionmaker

import logging
from urllib.parse import unquote

from . import replica

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
        'Wikipedia:': 4,
        'Wikipedia_talk:': 5,
        'File:': 6,
        'File_talk:': 7,
        'MediaWiki:': 8,
        'MediaWiki_talk:': 9,
        'Template:': 10,
        'Template_talk:': 11,
        'Help:': 12,
        'Help_talk:': 13,
        'Category:': 14,
        'Category_talk:': 15,
        'Portal:': 100,
        'Portal_talk:': 101,
        'Draft:': 118,
        'Draft_talk:': 119,
    }
    return g.namespace_prefix_dict


@bp.route('/api/autocomplete/page_title')
def autocomplete_page_title():
    logger = logging.getLogger('autocomplete.page_title')
    query_str = request.args.get('query', '')
    query_str = unquote(query_str)
    if query_str.strip() == '':
        logger.debug(f"Served query request with query param '{request.args.get('query', 'NONE')}'.")
        return make_response("Need a non-empty text query.", 400)
    query_str = query_str.replace(' ', '_')
    logger.debug(f"Serving autocomplete request with query '{query_str}'.")


    ns = 0
    ns_prefix = ""
    if ':' in query_str:
        ns_prefix_dict = get_namespace_prefix_dict()
        ns_prefix = query_str.split(':')[0] + ':'
        logger.debug(f"Investigating potential namespace prefix '{ns_prefix}'.")
        if ns_prefix in ns_prefix_dict:
            ns = ns_prefix_dict[ns_prefix]
            query_str = query_str[len(ns_prefix):]
            logger.debug(f"Treating prefix '{ns_prefix}' as namespace {ns} for query '{query_str}'.")
        else:
            ns_prefix = ""

    engine = replica.get_replica_engine()
    Session = sessionmaker(engine)
    with Session.begin() as session:
        page_list = replica.get_pages_by_partial_title(query_str, ns, session)
        logger.debug(f"Identified {len(page_list)} pages for query '{query_str}'.")
    engine.dispose()

    page_title_data = []
    for page in page_list[:5]:
        page_title_data.append({
            'page_id': page['page_id'],
            'primary_text': ns_prefix + page['page_title'].replace('_', ' '),
            'secondary_text': '0 edits'
        })

    return {'options': page_title_data, 'page_namespace': ns}
