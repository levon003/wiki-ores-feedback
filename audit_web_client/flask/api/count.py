
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

bp = Blueprint('count', __name__)


@bp.route('/api/revision_counts')
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

