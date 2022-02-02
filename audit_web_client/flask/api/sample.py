
from webbrowser import get
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

    Given a dictionary for a fixed set of filter values, generates a filter hash.
    The hash has length 32.

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

    rev_cache is a table defined in db.py

    TODO Consider extending this function to take an optional (or required?) session object.
    """
    filter_hash = get_filter_hash(filters)

    # check to see if this filter_hash is already in the rev_cache table
    # SELECT rev_id FROM rev_cache WHERE filter_hash = (our filter hash);
    rev_ids = []
    Session = db.get_oidb_session()
    with Session() as session:
        with session.begin():
            rct = db.get_rev_cache_table()
            s = select(rct.c.rev_id).where(rct.c.filter_hash == filter_hash)
            for rev_id in session.execute(s):
                rev_ids.append(rev_id)
    return rev_ids


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


def build_sample_query(filters, rt, s):
    """
    Given a SELECT query, adds WHERE clauses based on the given filters.

    The default query conditions are something like:
    SELECT ... FROM revision
    WHERE damaging_pred_filter = 0 AND
            reverted_filter_mask = 0 AND  # not reverted
            reverted_within_filter IS NULL AND
            reverted_after_filter IS NULL AND
            page_namespace = 0 AND
            user_type IN (0, 2, 3, 4) AND
            rev_count_gt_filter IN (0, 1, 2, 3, 4, 5) AND
            rev_count_lt_filter IN (0, 1, 2, 3, 4, 5) AND
            revision_filter_mask IN (0, 1, 2, 3, 4, 5, 6, 7) AND
            delta_bytes_filter IN (-2, -1, 0, 1, 2)
    ORDER BY random

    :filters - dict of user filters
    :rt - revision table
    :s - SELECT query
    """
    # extract needed data from the revision filters
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

    # TODO add all the WHERE clauses

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
    s = s.where(rt.c.delta_bytes_filter.in_(valid_delta_bytes_filters))
    return s


@bp.route('/api/sample/', methods=('POST',))
def get_sample_revisions():
        logger = logging.getLogger('sample.get_sample')
        start = datetime.now()
        
        filters = request.get_json()['filters']

        cached_rev_ids = get_rev_ids_for_filters(filters)
        if len(cached_rev_ids) > 0:
            # TODO query the revision table for these specific rev_ids
            # SELECT * FROM revision WHERE rev_id IN (cached_rev_ids);
            Session = db.get_oidb_session()
            with Session() as session:
                with session.begin():
                    rt = db.get_revision_table()
                    s = select(rt.c.rev_id, rt.c.prev_rev_id, rt.c.rev_timestamp, rt.c.user_text, rt.c.user_id, rt.c.page_title, rt.c.curr_bytes, rt.c.delta_bytes, rt.c.is_minor, rt.c.has_edit_summary, rt.c.damaging_pred) .where(rt.c.rev_id.in_(cached_rev_ids))
                    
                    revision_list = []
                    for row in session.execute(s):
                        rev_id = row    
                        revision_list.append({
                            'rev_id': rev_id,
                        })
                    return {'revisions': revision_list}
        else:
            # need to query the revision table for matching revisions
            rt = db.get_revision_table()
            s = select(rt.c.rev_id, rt.c.prev_rev_id, rt.c.rev_timestamp, rt.c.user_text, rt.c.user_id, rt.c.page_title, rt.c.curr_bytes, rt.c.delta_bytes, rt.c.is_minor, rt.c.has_edit_summary, rt.c.damaging_pred)
            s = build_sample_query(filters, rt, s)
            s.order_by(rt.c.random).limit(500)
            logger.info(s)

            revision_list = []
            Session = db.get_oidb_session()
            with Session() as session:
                with session.begin():
                    for row in session.execute(s):
                        rev_id = row    
                        revision_list.append({
                            'rev_id': rev_id,
                        })
                    rct = db.get_rev_cache_table()
                    rev_ids_to_cache = [rev['rev_id'] for rev in revision_list]
                    filter_hash = get_filter_hash(filters)
                    rev_cache_list = []
                    for rev_id in rev_ids_to_cache:
                        rev_cache_list.append({
                            'rev_id': rev_id,
                            'filter_hash': filter_hash
                        })
                    session.execute(rct.insert(), rev_cache_list)


        return {'revisions': revision_list}
