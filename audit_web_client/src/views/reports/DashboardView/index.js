import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Container,
  Grid,
  makeStyles,
  useTheme,
  Paper,
  Box
} from '@material-ui/core';
import clsx from 'clsx';
import Page from 'src/components/Page';
import RevisionViewer from './RevisionViewer';
import FilterControls from './FilterControls';
import DefaultFilters from './DefaultFilters';
import FocusControls from './FocusControls';
import TutorialCard from './TutorialCard';
import { DrawerContext } from 'src/App';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronRight';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import DeleteIcon from '@material-ui/icons/Delete';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { isEqual } from 'lodash'

const drawerWidth = 240

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(1),
    paddingTop: theme.spacing(1)
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: 0,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const theme = useTheme()
  // Temporary data here: 
  const [data, /*setData*/] =  useState({
    vlhp_r : 1000,
    vlhp_nr : 200,
    confrevs_r : 200,
    confrevs_nr : 100,
    vlg_r  : 10,
    vlg_nr  : 400,
  });

  const [revisions, setRevisions] = useState([]);
  const [counts, setCounts] = useState({}) 
  const [revisionsLoading, setRevisionsLoading] = useState(false)

  const {drawerOpen, setDrawerOpen} = useContext(DrawerContext)
  
  // All of this state has been lifted up from the RevisionFilterChip, UserFilterChip, and PageFilterChip components.
  // filter
  const [ preDefinedSelected, setPreDefinedSelected ] = useState(1)

  // focus
  const [focusSelected, setFocusSelected] = useState({
    'prediction_filter': 'very_likely_good',  // valid values: very_likely_good, very_likely_bad, confusing, any
    'revert_filter': 'reverted',  // valid values: reverted, nonreverted, any
  });
  
  // Revision filter state
  const [revisionFilter, setRevisionFilter] = useState(DefaultFilters.defaultRevisionFilters)
  const [minorFilter, setMinorFilter] = useState(DefaultFilters.defaultMinorFilters)
  
  // user filter state
  const [userTypeFilter, setUserTypeFilter] = useState(DefaultFilters.defaultUserFilters)
  const [filteredUsernames, setFilteredUsernames] = useState([]);
  
  // page filter state
  
  const [pageValues, setPageValues] = useState([]);
  
  const [namespaceSelected, setNameSpaceSelected] = useState(DefaultFilters.defaultNamespaceSelected)
  
  const [linkedToValues, setLinkedToValues] = useState([])
  
  const [linkedFromValues, setLinkedFromValues] = useState([])

  const [ currRevisionIdx, setCurrRevisionIdx ] = useState(0)

  // This state is for the annotation history. userHasAnnotatedWithinThisFilterCriteria is used to determine if the user has made an annotation within this filter criteria yet. If they haven't, we don't want to add this filter criteria to the annotation history list. Set to true when the annotation buttons are clicked.
  const [ userHasAnnotatedWithinThisFilterCriteria, setUserHasAnnotatedWithinThisFilterCriteria ] = useState(false)
  const [annotationHistory, setAnnotationHistory] = useState([])

  const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }
  const prevFilters = usePrevious({revisionFilter, minorFilter, userTypeFilter, filteredUsernames, pageValues, namespaceSelected, linkedToValues, linkedFromValues, preDefinedSelected, focusSelected})

  useEffect(() => {
    fetchInitAnnotationHistory()
  }, [])

  useEffect(() => {
    setUserHasAnnotatedWithinThisFilterCriteria(false)
    handleStateUpdate()
    if (prevFilters !== undefined) {
      if (prevFilters.revisionFilter !== revisionFilter) {
        handleLogging(revisionFilter)
      }
      else if (prevFilters.minorFilter !== minorFilter) {
        handleLogging(minorFilter)
      }
      else if (prevFilters.userTypeFilter !== userTypeFilter) {
        handleLogging(userTypeFilter)
      }
      else if (prevFilters.filteredUsernames !== filteredUsernames) {
        handleLogging(filteredUsernames)
      }
      else if (prevFilters.pageValues !== pageValues) {
        handleLogging(pageValues)
      }
      else if (prevFilters.namespaceSelected !== namespaceSelected) {
        handleLogging(namespaceSelected)
      }
      else if (prevFilters.linkedToValues !== linkedToValues) {
        handleLogging(linkedToValues)
      }
      else if (prevFilters.linkedFromValues !== linkedFromValues) {
        handleLogging(linkedFromValues)
      }
      else if (prevFilters.preDefinedSelected !== preDefinedSelected) {
        handleLogging(preDefinedSelected)
      }
      else if (prevFilters.focusSelected !== focusSelected) {
        handleLogging(focusSelected)
      }
    }
  }, [revisionFilter, minorFilter, userTypeFilter, filteredUsernames, pageValues, namespaceSelected, linkedToValues, linkedFromValues, preDefinedSelected, focusSelected])

  const checkFocusSelectedEquality = (rf, mf, utf, fu, pv, ns, ltv, lfv) => {
    if (isEqual(rf, DefaultFilters.defaultRevisionFilters) && isEqual(mf, DefaultFilters.defaultMinorFilters) && isEqual(utf, DefaultFilters.defaultUserFilters) && fu.length === 0 && pv.length === 0 && isEqual(ns, DefaultFilters.defaultNamespaceSelected) && ltv.length === 0 && lfv.length === 0) {
      setPreDefinedSelected(1)
    }
    else if (isEqual(rf, DefaultFilters.defaultRevisionFilters) && isEqual(mf, DefaultFilters.defaultMinorFilters) && isEqual(utf, DefaultFilters.defaultNewcomerUserFilters) && fu.length === 0 && pv.length === 0 && isEqual(ns, DefaultFilters.defaultNamespaceSelected) && ltv.length === 0 && lfv.length === 0) {
      setPreDefinedSelected(2)
    }
    else if (isEqual(rf, DefaultFilters.defaultRevisionFilters) && isEqual(mf, DefaultFilters.defaultMinorFilters) && isEqual(utf, DefaultFilters.defaultUserFilters) && fu.length === 0 && isEqual(pv, DefaultFilters.defaultLGBTHistoryFilters) && isEqual(ns, DefaultFilters.defaultNamespaceSelected) && ltv.length === 0 && lfv.length === 0) {
      setPreDefinedSelected(3)
    }
    else {
      setPreDefinedSelected(null)
    }
  }

  useEffect(() => {
    checkFocusSelectedEquality(revisionFilter, minorFilter, userTypeFilter, filteredUsernames, pageValues, namespaceSelected, linkedToValues, linkedFromValues)
  })
  
  const handleMisalignmentFilterChange = (new_filter) => {
    // TODO this function is now deprecated; figuring out a better global logging solution
    // currently maintained in case the logic here is useful in creating the new function
    console.log("new_filter");
    console.log(new_filter);
    // notify the backend that a new misalignment filter is set
    fetch('/api/activity_log', {
      method: 'POST', 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity_type: 'misalignment_filter_update',
        revert_filter: new_filter.revert_filter,
        prediction_filter: new_filter.prediction_filter,
      })
    })
    .then(res => {
      if (res.ok) {
        console.log("Logged misalignment filter update.");
      } else {
        console.warn("Failed to update misaslignment filter.");
      }
    });
    // get a new sample of revisions from the backend with the revised misalignment filter
    // Code removed
  };

  const handleStateUpdate = () => {
    setRevisions([])
    setCurrRevisionIdx(0)
    setCounts({})
    setRevisionsLoading(true)
    // setGlobalFilterState(new_state);
    // TODO do a POST request to the backend with the new filters
    // Get the new revisions and save them
    // ALSO get the new counts of each of the conditions
    // i.e. number of revisions that are Very Likely Bad
    //fetch().then({
    //    setRevisions(...data from backend...)
    //})  
    // fetch('/api/revision_counts', {method: 'GET'})
    //   .then(res => res.json())
    //   .then(data => {
    //     setData(data.counts);
    // });

    fetch('/api/sample/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // NOTE: If you change the filter criteria, also need to add/remove them in RevisionView's POST request
        filters: {
          revision_filters: revisionFilter,
          minor_filters: minorFilter,
          user_type_filter: userTypeFilter,
          filtered_usernames: filteredUsernames,
          page_values: pageValues,
          namespace_selected: namespaceSelected,
          linked_to_values: linkedToValues,
          linked_from_values: linkedFromValues
        },
        focus: {
          focus_selected: focusSelected,
          revert_definition: {
            // TODO: implement revert definition state on frontend
          },
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        //console.log("data: ", data)
        console.log("retrieved revisions from backend, n =", data.revisions.length)
        setRevisions(data.revisions)
        setCounts(data.counts)
        setRevisionsLoading(false)
        if (data.revisions.length !== 0) {
          let i = 0
          while (data.revisions[i].correctness_type_data !== null) {
            i++
          }
          setCurrRevisionIdx(i)
        }
    })
    .catch(err => {
      console.log(err)
    });
    // }
    // fetch('/api/activity_log', {method: 'GET'})
    //   .then(res => res.json())
    //   .then(data => {
    //     console.log(data);
    // });
  };

  const fetchInitAnnotationHistory = () => {
    fetch('/api/annotation_history/')
    .then(res => res.json())
    .then(data => setAnnotationHistory(data.annotation_history))
    .catch(err => console.log(err))
  }

  const handleLogging = (change) => {
     fetch('/api/activity_log', {
      method: 'POST', 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(change)
    })
    .then(res => {
      if (res.ok) {
        console.log("Logged change.");
      } else {
        console.warn("Failed to log :(.");
      }
    });
  }

  useEffect(() => {
    // TODO Make an initial request with the default/loaded filter criteria 
  }, []);

  const handleDrawerClose = () => {
    setDrawerOpen(false)
  }

  const handleDeleteAnnotationHistory = (history_id) => {
    fetch(`/api/annotation_history/delete/${history_id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => setAnnotationHistory(annotationHistory.filter(history => history.history_id !== history_id)))
    .catch((err) => console.log(err))
  }

  const handleGetAnnotationHistoryFilters = (history_id, prediction_filter, revert_filter) => {
    console.log(history_id)
    fetch(`/api/annotation_history/filter_get/${history_id}`)
    .then(res => res.json())
    .then((data) => {
      const filters = data.filters
      console.log(filters)
      checkFocusSelectedEquality(filters.revision_filters, filters.minor_filters, filters.user_type_filter, filters.filtered_usernames, filters.page_values, filters.namespace_selected, filters.linked_to_values, filters.linked_from_values)
      setFilteredUsernames(filters.filtered_usernames)
      setLinkedFromValues(filters.linked_from_values)
      setLinkedToValues(filters.linked_to_values)
      setMinorFilter(filters.minor_filters)
      setNameSpaceSelected(filters.namespace_selected)
      setPageValues(filters.page_values)
      setFocusSelected({
        'prediction_filter': prediction_filter,
        'revert_filter': revert_filter
      })
      setUserTypeFilter(filters.user_type_filter)
      setRevisionFilter(filters.revision_filters)
    })
    .catch((err) => console.log(err))
  }
    
  return (
    <div>
      <main
          className={clsx(classes.content, classes.root, {
            [classes.contentShift]: drawerOpen,
          })}
        >
        <Page
          title="ORES-Inspect"
        >
          <Container maxWidth={false}>
            <Grid
              container
              direction="column"
              spacing={1}
            >
              <Grid
                item
                xs={12}
              >
                <TutorialCard />
              </Grid>

              <Grid
                item
                xs={12}
              >
                <FilterControls 
                    onChange={handleStateUpdate}
                    revisionFilter={revisionFilter}
                    setRevisionFilter={setRevisionFilter}
                    minorFilter={minorFilter}
                    setMinorFilter={setMinorFilter}
                    userTypeFilter={userTypeFilter}
                    setUserTypeFilter={setUserTypeFilter}
                    filteredUsernames={filteredUsernames}
                    setFilteredUsernames={setFilteredUsernames}
                    pageValues={pageValues}
                    setPageValues={setPageValues}
                    namespaceSelected={namespaceSelected}
                    setNameSpaceSelected={setNameSpaceSelected}
                    linkedToValues={linkedToValues}
                    setLinkedToValues={setLinkedToValues}
                    linkedFromValues={linkedFromValues}
                    setLinkedFromValues={setLinkedFromValues}
                    preDefinedSelected={preDefinedSelected}
                    setPreDefinedSelected={setPreDefinedSelected}
                />
              </Grid>

              <Grid
                item
                xs={12}
              >
                <FocusControls counts={counts} data={data} focusSelected={focusSelected} setFocusSelected={setFocusSelected} />
              </Grid>

              <Grid
                item
                xs={12}
              >
                <RevisionViewer 
                  revisions={revisions}
                  setRevisions={setRevisions}
                  counts={counts}
                  revisionsLoading={revisionsLoading}
                  currRevisionIdx={currRevisionIdx}
                  setCurrRevisionIdx={setCurrRevisionIdx}
                  revisionFilter={revisionFilter}
                  minorFilter={minorFilter}
                  preDefinedSelected={preDefinedSelected}
                  filteredUsernames={filteredUsernames}
                  userTypeFilter={userTypeFilter}
                  namespaceSelected={namespaceSelected}
                  pageValues={pageValues}
                  linkedFromValues={linkedFromValues}
                  linkedToValues={linkedToValues}
                  focusSelected={focusSelected}
                  setAnnotationHistory={setAnnotationHistory}
                  userHasAnnotatedWithinThisFilterCriteria={userHasAnnotatedWithinThisFilterCriteria}
                  setUserHasAnnotatedWithinThisFilterCriteria={setUserHasAnnotatedWithinThisFilterCriteria}
                />
              </Grid>
            </Grid>
          </Container>
        </Page>
      </main>
      <Drawer
      className={classes.drawer}
      variant="persistent"
      anchor="right"
      open={drawerOpen}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <div className={classes.drawerHeader}>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </div>
      <List>
        <ListItem>
          <div className="title text-h2">Annotation History</div>
        </ListItem>
      </List>
      <div style={{'overflowY': 'scroll'}}>
        <List>
          {annotationHistory.length > 0 ? annotationHistory.map((history, index) => (
            <div key={history.custom_name + history.prediction_filter + history.revert_filter + index} >
              <ListItem button onClick={() => handleGetAnnotationHistoryFilters(history.history_id, history.prediction_filter, history.revert_filter)} key={history.custom_name}>
                <ListItemText>
                  <b className="text-h2">{history.custom_name}</b><br></br>
                  <b className="text-h2">{history.prediction_filter === 'very_likely_good' ? "Unexpected Reverts" : history.prediction_filter === 'very_likely_bad' ? "Unexpected Consensus" : "Confusing Edits"}</b><br></br>
                  <IconButton onClick={() => handleDeleteAnnotationHistory(history.history_id)} style={{padding: 0}}>
                   <DeleteIcon/>
                  </IconButton>
                  <div>
                    {history.total_annotated} Annotated<br></br>
                    {history.num_not_damaging} Not Damaging {history.prediction_filter === 'very_likely_bad' && `(${history.num_not_damaging} ORES Misclassifications)`}<br></br>
                    {history.num_flagged} Unsure<br></br>
                    {history.num_damaging} Damaging {history.prediction_filter === 'very_likely_good' && `(${history.num_damaging} ORES Misclassifications)`}
                  </div>
                </ListItemText>
              </ListItem>
            </div>
          ))
          :
          <div style={{textAlign: 'center'}}>No annotation history.</div>}
        </List>
        <footer><Paper style={{position: "fixed", bottom: 0, right: 0, fontSize: 10}} elevation={3}>ORES-Inspect v0.2.1 <a href="https://github.com/levon003/wiki-ores-feedback/releases">(on GitHub)</a></Paper></footer>
      </div>
    </Drawer>
  </div>
  );
};

export default Dashboard;
