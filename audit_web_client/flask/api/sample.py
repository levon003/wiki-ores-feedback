
from webbrowser import get
import click
from flask import current_app, g, request, make_response, Blueprint, jsonify
from flask.cli import with_appcontext

import sqlalchemy
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import select, or_, and_, func


import logging
from datetime import datetime
import hashlib
import json


from . import replica
from . import db
from . import user_db

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
            for row in session.execute(s):
                rev_id = row[0]
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

    # specific page filters
    page_values = filters['page_values']
    specific_page_ids = [page['page_id'] for page in page_values]
    
    linked_from_values = filters['linked_from_values']
    linked_to_values = filters['linked_to_values']
    # Note: currently doing n queries for n pages, rather than 1 query; can be optimized with a new function in replica
    if len(linked_from_values) > 0:
        session = replica.get_replica_session()
        for page in linked_from_values:
            linked_from_page_ids = replica.get_pages_linked_from_page_id(page['page_id'], session)
            specific_page_ids.extend(linked_from_page_ids)
    if len(linked_to_values) > 0:
        session = replica.get_replica_session()
        for page in linked_to_values:
            linked_to_page_ids = replica.get_pages_linked_to_page_id(page['page_id'], session)
            specific_page_ids.extend(linked_to_page_ids)
    # add required page_ids as a condition to the query
    if len(specific_page_ids) > 0:
       s = s.where(rt.c.page_id.in_(specific_page_ids))

    filtered_usernames = filters['filtered_usernames']
    if len(filtered_usernames) > 0:
        user_text_list = [filtered_usernames,]
        s = s.where(rt.c.user_text.in_(user_text_list))

    user_filters = filters['user_type_filter']
    include_bot = user_filters['bots']
    include_unregistered = user_filters['unregistered']
    include_newcomers = user_filters['newcomers']
    include_learners = user_filters['learners']
    include_experienced = user_filters['experienced']
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

    minor_filters = filters['minor_filters']
    namespace_selected = filters['namespace_selected']
    if len(namespace_selected) == 0:
        raise ValueError("No namespaces selected.")
    namespace_ids = [int(ns['namespace'].split(" - ")[1]) for ns in namespace_selected]
    s = s.where(rt.c.page_namespace.in_(namespace_ids))

    valid_revision_filters = []
    if minor_filters['isMinor']:
        valid_revision_filters.extend([4, 5, 6, 7])
    if minor_filters['isMajor']:
        valid_revision_filters.extend([0, 1, 2, 3])
    s = s.where(rt.c.revision_filter_mask.in_(valid_revision_filters))

    revision_filters = filters['revision_filters']
    large_additions = revision_filters['largeAdditions']
    large_removals = revision_filters['largeRemovals']
    neutral = revision_filters['neutral']
    small_additions = revision_filters['smallAdditions']
    small_removals = revision_filters['smallRemovals']
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

    # TODO implement the rev_count filter criteria
    s = s.where(rt.c.rev_count_gt_filter.in_([0, 1, 2, 3, 4, 5]))
    s = s.where(rt.c.rev_count_lt_filter.in_([0, 1, 2, 3, 4, 5]))

    prediction_filter = filters['prediction_filter']
    if prediction_filter == 'any':
        s = s.where(rt.c.damaging_pred_filter.in_([0, 1, 2]))
    elif prediction_filter == 'very_likely_good':
        s = s.where(rt.c.damaging_pred_filter == 0)
    elif prediction_filter == 'confusing':
        s = s.where(rt.c.damaging_pred_filter == 1)
    elif prediction_filter == 'very_likely_bad':
        s = s.where(rt.c.damaging_pred_filter == 2)
    else:
        raise ValueError("Invalid prediction_filter.")
    
    revert_filter = filters['revert_filter']
    if revert_filter == 'any':
        s = s.where(rt.c.reverted_filter_mask.in_([0, 1, 3, 5, 7]))
        s = s.where(rt.c.reverted_within_filter.in_([None, 0, 1, 2, 3, 4, 5]))
        s = s.where(rt.c.reverted_after_filter.in_([None, 0, 1, 2, 3, 4, 5]))
    elif revert_filter == 'reverted':
        # is_self_reverted == False
        # is_user_trusted == False
        # is_reverted_to_by_other in [True, False]
        s = s.where(rt.c.reverted_filter_mask.in_([1, 3]))
        s = s.where(rt.c.reverted_within_filter.in_([0, 1, 2, 3, 4, 5]))
        s = s.where(rt.c.reverted_after_filter.in_([0, 1, 2, 3, 4, 5]))
    elif revert_filter == 'nonreverted':
        s = s.where(rt.c.reverted_filter_mask == 0)
        s = s.where(rt.c.reverted_within_filter.is_(None))
        s = s.where(rt.c.reverted_after_filter.is_(None))
    else:
        raise ValueError("Invlaid revert_filter.")

    return s


@bp.route('/api/sample/', methods=('POST',))
def get_sample_revisions():
    logger = logging.getLogger('sample.get_sample')
    
    request_json = request.get_json()
    filters = request_json['filters']
    if 'focus' in request_json:
        focus_selected = request_json['focus']['focus_selected']
        filters['prediction_filter'] = focus_selected['prediction_filter']
        assert filters['prediction_filter'] in ['very_likely_bad', 'very_likely_good', 'confusing', 'any']
        filters['revert_filter'] = focus_selected['revert_filter']
        assert filters['revert_filter'] in ['reverted', 'nonreverted', 'any']
    else:
        filters['prediction_filter'] = 'any'
        filters['revert_filter'] = 'any'
        logger.warn("No focus_selected key provided in the JSON body of this request; using defaults.")
        raise ValueError("No focus_selected.")

    cached_rev_ids = get_rev_ids_for_filters(filters)
    logger.info(f"Identified {len(cached_rev_ids)} cached revisions for these filters.")
    if len(cached_rev_ids) == 0:
        # need to query the revision table for matching revisions
        rt = db.get_revision_table()
        s = select(rt.c.rev_id)
        s = build_sample_query(filters, rt, s)
        s = s.order_by(rt.c.random).limit(500)  # TODO put this limit somewhere more prominent
        logger.info(f"Built revision table query (for uncached revs): {s}")

        revision_list = []
        Session = db.get_oidb_session()
        with Session() as session:
            with session.begin():
                for row in session.execute(s):
                    revision_list.append(row._asdict())
                logger.info(f"Retrieved {len(revision_list)} revisions from revision table.")
                rct = db.get_rev_cache_table()
                rev_ids_to_cache = [rev['rev_id'] for rev in revision_list]
                filter_hash = get_filter_hash(filters)
                logger.info(f"Caching {len(rev_ids_to_cache)} revisions under filter hash '{filter_hash}'.")
                rev_cache_list = []
                for rev_id in rev_ids_to_cache:
                    rev_cache_list.append({
                        'rev_id': rev_id,
                        'filter_hash': filter_hash,
                    })
                session.execute(rct.insert(), rev_cache_list)
        rev_ids = rev_ids_to_cache
    else:
        rev_ids = list(set(cached_rev_ids))
    logger.info(f"Retrieving full data for {len(rev_ids)} rev_ids.")

    # query the revision table for the specific rev_ids we need
    # SELECT * FROM revision WHERE rev_id IN ({rev_ids});
    Session = db.get_oidb_session()
    with Session() as session:
        with session.begin():
            rt = db.get_revision_table()
            pt = db.get_page_table()
            
            s = select(
                rt.c.rev_id, rt.c.prev_rev_id, rt.c.rev_timestamp, rt.c.user_text, rt.c.user_id, rt.c.curr_bytes, rt.c.delta_bytes, rt.c.is_minor, rt.c.has_edit_summary, rt.c.damaging_pred, pt.c.page_title
            ).where(rt.c.rev_id.in_(rev_ids)).join(pt, (rt.c.page_id == pt.c.page_id))
            user_token = ""  # TODO retrieve this from the current session
            if user_token is not None:
                # if the user is logged in, then retrieve annotations they may have done on these revisions
                rat = user_db.get_rev_annotation_table()

                # join in correctness data
                rat_c = rat.alias("rat_c")
                most_recent_c = select(sqlalchemy.sql.functions.max(rat_c.c.annotation_id)).\
                where(
                    rat_c.c.rev_id == rt.c.rev_id, 
                    rat_c.c.user_token == user_token,
                    rat_c.c.annotation_type == 'correctness'
                ).scalar_subquery().correlate(rt)
                s = s.join(rat_c, 
                    (rat_c.c.rev_id == rt.c.rev_id)&(rat_c.c.user_token == user_token)&(rat_c.c.annotation_type == 'correctness'),
                    isouter=True,
                ).where(
                    or_(
                        rat_c.c.annotation_id == None,
                        rat_c.c.annotation_id == most_recent_c
                    )
                ).add_columns(
                    rat_c.c.annotation_data.label("correctness_type_data")
                )

                # join in note data
                rat_n = rat.alias("rat_n")
                most_recent_n = select(sqlalchemy.sql.functions.max(rat_n.c.annotation_id)).\
                where(
                    rat_n.c.rev_id == rt.c.rev_id, 
                    rat_n.c.user_token == user_token,
                    rat_n.c.annotation_type == 'note'
                ).scalar_subquery().correlate(rt)
                s = s.join(rat_n, 
                    (rat_n.c.rev_id == rt.c.rev_id)&(rat_n.c.user_token == user_token)&(rat_n.c.annotation_type == 'note'),
                    isouter=True,
                ).where(
                    or_(
                        rat_n.c.annotation_id == None,
                        rat_n.c.annotation_id == most_recent_n
                    )
                ).add_columns(
                    rat_n.c.annotation_data.label("note_data")
                )

            logger.info(f"Built revision table query (for cached revs): {s}")

            revision_list = []
            result = session.execute(s)
            for row in result:
                revision_list.append(row._asdict())
            if len(revision_list) != len(rev_ids):
                logger.warning(f"Expected {len(rev_ids)} revisions; retrieved {len(revision_list)} instead.")

    logger.info(f"Returning {len(revision_list)} revisions.")
    return {'revisions': revision_list}


@click.command('get-filter-hash')
def get_filter_hash_command():
    logger = logging.getLogger('cli.get-filter-hash.main')
    
    filters = {
        'page_values': [],
        'linked_from_values': [],
        'linked_to_values': [],
        'filtered_usernames': [],
        'namespace_selected': [{'namespace': "Main/Article - 0"}],
        'user_type_filter': {
            'bots': False,
            'unregistered': True,
            'newcomers': True,
            'learners': True,
            'experienced': True,
        },
        'minor_filters': {
            'isMinor': True,
            'isMajor': True,
        },
        'revision_filters': {
            'largeAdditions': True,
            'smallAdditions': True,
            'neutral': True,
            'smallRemovals': True,
            'largeRemovals': True,
        },
    }
    filter_hash = get_filter_hash(filters)
    logger.info(filter_hash)
    logger.info("Finished.")

@click.command('initialize-cache')
def initialize_cache_command():
    import requests
    logger = logging.getLogger('cli.initialize-cache.main')
    start = datetime.now()

    filter_criteria_to_change = [
      # default filters
      {},
      # newcomer edits
        {
          'user_type_filter': {
                'learners': False,
                'experienced': False,
            }
        }, 
      # lgbt edits
          {
            'linked_from_values': [
              {
                'page_id': 1421393,
                'primary_text': "LGBT history",
                'secondary_text': "73 edits"
              }
            ]
          },
            # experienced edits
            {
              'user_type_filter': {
                'bots': False,
                'unregistered': False,
                'newcomers': False,
                'learners': False,
                'experienced': True,
              }
            },
          ]
    for criteria in filter_criteria_to_change:
        filters = {
            'page_values': [],
            'linked_from_values': [],
            'linked_to_values': [],
            'filtered_usernames': [],
            'namespace_selected': [{'namespace': "Main/Article - 0"}],
            'user_type_filter': {
                'bots': False,
                'unregistered': True,
                'newcomers': True,
                'learners': True,
                'experienced': True,
            },
            'minor_filters': {
                'isMinor': True,
                'isMajor': True,
            },
            'revision_filters': {
                'largeAdditions': True,
                'smallAdditions': True,
                'neutral': True,
                'smallRemovals': True,
                'largeRemovals': True,
            },
        }
        for key, val in criteria.items():
            if type(val) == dict:
                for inner_key, inner_val in val.items():
                    filters[key][inner_key] = inner_val
            else:
                filters[key] = val
        # make a GET request against the sample endpoint
        result = requests.post('http://127.0.0.1:5000/api/sample/', json={'filters': filters})
        logger.info(result)

        logger.info(f"Finished cache initialization after {datetime.now() - start}.")

@click.command('get-sample')
@click.option('--use-default', default=False, is_flag=True)
@click.option('--condition', default="default", type=str)
def get_sample_command(use_default, condition):
    logger = logging.getLogger('cli.get-sample.main')
    logger.info(f"Running with {use_default} and {condition}.")
    start = datetime.now()
    
    request_json = {
        'filters': {
            'page_values': [],
            'linked_from_values': [],
            'linked_to_values': [],
            'filtered_usernames': [],
            'namespace_selected': [{'namespace': "Main/Article - 0"}],
            'user_type_filter': {
                'bots': False,
                'unregistered': True,
                'newcomers': True,
                'learners': True,
                'experienced': True,
            },
            'minor_filters': {
                'isMinor': True,
                'isMajor': True,
            },
            'revision_filters': {
                'largeAdditions': True,
                'smallAdditions': True,
                'neutral': True,
                'smallRemovals': True,
                'largeRemovals': True,
            },
        }
    }
    if condition == 'specific_page':
        request_json['filters']['page_values'] = [{'page_id': 62715690}]
    elif condition == 'default':
        pass
    else:
        raise ValueError(condition)
    # make a GET request against the sample endpoint
    import requests
    result = requests.post('http://127.0.0.1:5000/api/sample/', json=request_json)
    logger.info(result)
    logger.info(result.json())

    logger.info(f"Finished querying backend after {datetime.now() - start}.")


def init_app(app):
    app.cli.add_command(get_sample_command)
    app.cli.add_command(get_filter_hash_command)
    app.cli.add_command(initialize_cache_command)
