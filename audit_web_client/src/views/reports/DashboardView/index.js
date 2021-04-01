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

import LatestProducts from './LatestProducts';
import Sales from './Sales';
import TasksProgress from './TasksProgress';
import TotalCustomers from './TotalCustomers';
import TotalProfit from './TotalProfit';
import TrafficByDevice from './TrafficByDevice';
import { PinDropSharp } from '@material-ui/icons';

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
  const [data, setData] =  useState({
    vlhp_R : 1000,
    vlhp_NR : 200,
    confrevs_R : 200,
    confrevs_NR : 100,
    vlg_R  : 10,
    vlg_NR  : 400,
  });

  const [globalFilterState, setGlobalFilterState] = useState();
  const [revisions, setRevisions] = useState([]);
    
  const handleMisalignmentFilterChange = (new_filter) => {
    console.log(new_filter);
  };

  const handleStateUpdate = (new_state) => {
    setGlobalFilterState(new_state);
    // TODO do a POST request to the backend with the new filters
    // Get the new revisions and save them
    // ALSO get the new counts of each of the conditions
    // i.e. number of revisions that are Very Likely Bad
    //fetch().then({
    //    setRevisions(...data from backend...)
    //})
    const filter_conditions_changed = false;
    const should_get_new_revisions = false;
    if (filter_conditions_changed) {
      fetch('/api/rev_counts', {method: 'GET'})
        .then(res => res.json())
        .then(data => {
          setData(data.counts);
      });
    }
    if (should_get_new_revisions) {
      fetch('/api/sample', {method: 'GET'})
        .then(res => res.json())
        .then(data => {
          setRevisions(data.revisions);
      });
    }
    fetch('/api/activity_log', {method: 'GET'})
      .then(res => res.json())
      .then(data => {
        console.log(data);
    });
  };
    
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
            />
          </Grid>
          <Grid
            item
            xs={12}
          >

            <MisalignmentFilter 
              onChange={handleMisalignmentFilterChange}
              data= {data}
            />
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
