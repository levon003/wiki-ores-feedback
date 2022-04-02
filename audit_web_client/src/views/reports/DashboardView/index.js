import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Container,
  Grid,
  makeStyles,
  useTheme
} from '@material-ui/core';
import clsx from 'clsx';
import Page from 'src/components/Page';
import RevisionViewer from './RevisionViewer';
import FilterControls from './FilterControls';
import DefaultFilters from './DefaultFilters';
import FocusControls from './FocusControls';
import { DrawerContext } from 'src/App';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronRight';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

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

  useEffect(() => {
    if (revisionFilter === DefaultFilters.defaultRevisionFilters && minorFilter === DefaultFilters.defaultMinorFilters && userTypeFilter === DefaultFilters.defaultUserFilters && filteredUsernames.length === 0 && pageValues.length === 0 && namespaceSelected === DefaultFilters.defaultNamespaceSelected && linkedToValues.length === 0 && linkedFromValues.length === 0) {
      // all article edits
      setPreDefinedSelected(1)
    } else if (revisionFilter === DefaultFilters.defaultRevisionFilters && minorFilter === DefaultFilters.defaultMinorFilters && userTypeFilter === DefaultFilters.defaultNewcomerUserFilters && filteredUsernames.length === 0 && pageValues.length === 0 && namespaceSelected === DefaultFilters.defaultNamespaceSelected && linkedToValues.length === 0 && linkedFromValues.length === 0) {
      // newcomer
      setPreDefinedSelected(2)
    } else if (revisionFilter === DefaultFilters.defaultRevisionFilters && minorFilter === DefaultFilters.defaultMinorFilters && userTypeFilter === DefaultFilters.defaultUserFilters && filteredUsernames.length === 0 && pageValues === DefaultFilters.defaultLGBTHistoryFilters && namespaceSelected === DefaultFilters.defaultNamespaceSelected && linkedToValues.length === 0 && linkedFromValues.length === 0) {
      // lgbt history
      setPreDefinedSelected(3)
    } else {
      setPreDefinedSelected(null)
    }
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
    setCounts({})
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
        setRevisions(data.revisions);
        setCounts(data.counts)
        let i = 0;
        while (data.revisions[i].correctness_type_data !== null) {
          i++
        }
        setCurrRevisionIdx(i)
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
          {annotationHistory.length > 0 ? annotationHistory.map((history) => (
            <div key={history.custom_name + history.prediction_filter + history.revert_filter} >
              <ListItem button key={history.custom_name}>
                <ListItemText><b className="text-h3">{history.custom_name}</b><br></br><div className="text-h5">{history.prediction_filter === 'very_likely_good' ? "Unexpected Reverts" : history.prediction_filter === 'very_likely_bad' ? "Unexpected Consensus" : "Confusing Edits"}<br></br>{history.total_annotated} Annotated<br></br>{history.num_not_damaging} Misclassifications<br></br>{history.num_flagged} Flagged<br></br>{history.num_damaging} Damaging</div></ListItemText>
              </ListItem>
            </div>
          ))
          :
          <div style={{textAlign: 'center'}}>No annotations yet.</div>}
        </List>
      </div>
    </Drawer>
  </div>
  );
};

export default Dashboard;
