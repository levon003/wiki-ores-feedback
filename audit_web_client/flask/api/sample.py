
import click
from flask import current_app, g, request, make_response, Blueprint, jsonify
from flask.cli import with_appcontext

from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import select, or_, and_, func

import logging
from datetime import datetime
import hashlib
import json


from . import replica
from . import db

bp = Blueprint('sample', __name__)


PAGE_SIZE = 10

def get_filter_hash(filter_dict):
    """

    Given a dictionary for a fixed set of filter values, generates a filter hash

    see also: https://www.doc.ic.ac.uk/~nuric/coding/how-to-hash-a-dictionary-in-python.html

    """
    filter_hash = hashlib.md5()
    filter_bytes = json.dumps(filter_dict, sort_keys=True).encode()
    filter_hash.update(filter_bytes)
    return filter_hash.hexdigest()


def get_rev_ids_for_filters(filters):
    """
    1. If filter_hash in rev_cache, then retrieve those revisions
    2. If filter_hash not in rev_cache, retrieve 10K revs for filter and add them to the cache. Then, GOTO step 1.
    3. Get user_data on revs, 100 at a time: have these revisions already been annotated?
    4. If fewer than PAGE_SIZE remain after filtering, retrieve an ADDITIONAL 10K revs for filter and add them to the cache. Then, GOTO step 1.
    5. Paginate the retrieved revisions based on the query (is it requesting a page offset? How many?)
    6. Get full data for the page of revisions.
    7. Return revision data.
    """
    filter_hash = get_filter_hash(filters)


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


@bp.route('/api/sample/', methods=('POST',))
def get_sample_revisions():
    logger = logging.getLogger('sample.get_sample')
    start = datetime.now()
    
    filters = request.get_json()['filters']
    user_filters = filters['user_type_filter']
    include_bot = user_filters['bots']
    include_unregistered = user_filters['unregistered']
    include_newcomers = user_filters['newcomers']
    include_learners = user_filters['learners']
    include_experienced = user_filters['experienced']

    filtered_usernames = filters['filtered_usernames']
    linked_from_values = filters['linked_from_values']
    linked_to_values = filters['linked_to_values']
    page_values = filters['page_values']

    minor_filters = filters['minor_filters']
    namespace_selected = filters['namespace_selected']

    revision_filters = filters['revision_filters']
    large_additions = revision_filters['largeAdditions']
    large_removals = revision_filters['largeRemovals']
    neutral = revision_filters['neutral']
    small_additions = revision_filters['smallAdditions']
    small_removals = revision_filters['smallRemovals']

    rt = db.get_revision_table()
    s = select(rt.c.rev_id)  # TODO add the other columns here that are expected by the frontend

    valid_user_types = []
    if include_unregistered:
        valid_user_types.append(0)
    if include_bot:
        valid_user_types.append(1)
    if include_newcomers:
        valid_user_types.append(2)
    if include_learners:
        valid_user_types.append(3)
    if include_experienced:
        valid_user_types.append(4)
    s = s.where(rt.c.user_type.in_(valid_user_types))
    
    valid_revision_filters = []
    if minor_filters['isMinor']:
        valid_revision_filters.extend([4, 5, 6, 7])
    if minor_filters['isMajor']:
        valid_revision_filters.extend([0, 1, 2, 3])
    if len(valid_revision_filters) < 8:
        s = s.where(rt.c.revision_filter_mask.in_(valid_revision_filters))

    valid_delta_bytes_filters = []
    if large_additions:
        valid_delta_bytes_filters.append(2)
    if small_additions:
        valid_delta_bytes_filters.append(1)
    if neutral:
        valid_delta_bytes_filters.append(0)
    if small_removals:
        valid_delta_bytes_filters.append(-1)
    if large_removals:
        valid_delta_bytes_filters.append(-2)
    if len(valid_delta_bytes_filters) < 5:
        s = s.where(rt.c.delta_bytes_filter.in_(valid_delta_bytes_filters))


    revision_list = []
    Session = db.get_oidb_session()
    with Session() as session:
        with session.begin():
            for row in session.execute(s): #something wrong is happening at this line... request doesn't ever even happen
                rev_id = row    
                revision_list.append({
                    'rev_id': rev_id,
                })

    # s = select(func.count('*')).select_from(rt)

    return {'revisions': revision_list}

    # if i comment out everything from line 152-156 and uncomment line 164, the request is sent successfully? 
    # millions of revisions are probably returned from default filters, is this a problem...
    # return request.get_json()
