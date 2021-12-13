import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  makeStyles
} from '@material-ui/core';
import Page from 'src/components/Page';
import RevisionViewer from './RevisionViewer';
import MisalignmentFilter from './MisalignmentFilter';
import FilterControls from './FilterControls';
import DefaultFilters from './DefaultFilters';
import FocusControls from './FocusControls';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(1),
    paddingTop: theme.spacing(1)
  }
}));

const Dashboard = () => {
  const classes = useStyles();
  // Temporary data here: 
  const [data, /*setData*/] =  useState({
    vlhp_r : 1000,
    vlhp_nr : 200,
    confrevs_r : 200,
    confrevs_nr : 100,
    vlg_r  : 10,
    vlg_nr  : 400,
  });

  const [revisions, setRevisions] = useState([{
    rev_id: 1001836878, 
    prev_rev_id: 1001836865,
    rev_timestamp: 0,
    // has_edit_summary: false,
    user_text: "Suriname0",
    user_id: 50,
    page_title: "Armadillidium vulgare",
    curr_bytes: 2289,
    delta_bytes: 1550,
    is_minor: true,
    has_edit_summary: true,
    damaging_pred: 0.11111111,
  },
  {
    rev_id: 1001836878, 
    prev_rev_id: 1001836865,
    rev_timestamp: 0,
    // has_edit_summary: false,
    user_text: "Suriname0",
    user_id: 50,
    page_title: "Armadillidium vulgare",
    curr_bytes: 2289,
    delta_bytes: 1550,
    is_minor: true,
    has_edit_summary: true,
    damaging_pred: 0.11111111,
}]); // TODO should be empty, but has one entry for testing
  
  // All of this state has been lifted up from the RevisionFilterChip, UserFilterChip, and PageFilterChip components.
  // filter
  const [ preDefinedSelected, setPreDefinedSelected ] = useState(1)

  // focus
  const [ focusSelected, setFocusSelected ] = useState()
  
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

  useEffect(() => {
    handleStateUpdate()
  })

  useEffect(() => {
    if (revisionFilter === DefaultFilters.defaultRevisionFilters && minorFilter === DefaultFilters.defaultMinorFilters && userTypeFilter === DefaultFilters.defaultUserFilters && filteredUsernames.length === 0 && pageValues.length === 0 && namespaceSelected === DefaultFilters.defaultNamespaceSelected && linkedToValues.length === 0 && linkedFromValues.length === 0) {
      setPreDefinedSelected(1)
    } else if (revisionFilter === DefaultFilters.defaultRevisionFilters && minorFilter === DefaultFilters.defaultMinorFilters && userTypeFilter === DefaultFilters.defaultNewcomerUserFilters && filteredUsernames.length === 0 && pageValues.length === 0 && namespaceSelected === DefaultFilters.defaultNamespaceSelected && linkedToValues.length === 0 && linkedFromValues.length === 0) {
      setPreDefinedSelected(2)
    } else if (revisionFilter === DefaultFilters.defaultLGBTHistoryFilters && minorFilter === DefaultFilters.defaultMinorFilters && userTypeFilter === DefaultFilters.defaultUserFilters && filteredUsernames.length === 0 && pageValues.length === 0 && namespaceSelected === DefaultFilters.defaultNamespaceSelected && linkedToValues.length === 0 && linkedFromValues.length === 0) {
      setPreDefinedSelected(3)
    } else {
      setPreDefinedSelected(null)
    }
  })
  
  const handleMisalignmentFilterChange = (new_filter) => {
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
    fetch('/api/sample/', {
      method: 'POST', 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        revert_filter: new_filter.revert_filter,
        prediction_filter: new_filter.prediction_filter,
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error("Failed to retrieve sample.");
      }
      return res;
    })
    .then(res => res.json())
    .then(data => {
      setRevisions(data.revisions);
    })
    .catch(err => console.error(err));
  };

  const handleStateUpdate = () => {
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
        filters: {
          revision_filters: revisionFilter,
          minor_filters: minorFilter,
          user_type_filter: userTypeFilter,
          filtered_usernames: filteredUsernames,
          page_values: pageValues,
          namespace_selected: namespaceSelected,
          linked_to_values: linkedToValues,
          linked_from_values: linkedFromValues
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log("data: ", data)
        setRevisions(data.revisions);
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

  useEffect(() => {
    // TODO Make an initial request with the default/loaded filter criteria 
  }, []);
    
  return (
    <Page
      className={classes.root}
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
            <FocusControls data={data} focusSelected={focusSelected} setFocusSelected={setFocusSelected} onChange={handleMisalignmentFilterChange}/>

          </Grid>

          <Grid
            item
            xs={12}
          >
            <RevisionViewer 
              revisions={revisions}
            />
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
};

export default Dashboard;
