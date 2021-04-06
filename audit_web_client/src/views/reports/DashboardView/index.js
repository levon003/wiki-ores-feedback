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
  const data =  { 
                  vlhp_R : 1000,
                  vlhp_NR : 200,
                  confrevs_R : 200,
                  confrevs_NR : 100,
                  vlg_R  : 10,
                  vlg_NR  : 400,
                };

  const [globalFilterState, setGlobalFilterState] = useState();
  const [revisions, setRevisions] = useState();
    
    
  const handleStateUpdate = (new_state) => () => {
      setGlobalFilterState(new_state);
      // TODO do a GET request to the backend with the new filters
      // Get the new revisions and save them
      //fetch().then({
      //    setRevisions(...data from backend...)
      //})
  };
    
  return (
    <Page
      className={classes.root}
      title="RevReflect: Inspect ORES Predictions"
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
              onChange={handleStateUpdate}
              data= {data}  
            />
          </Grid>
          <Grid
            item
            xs={12}
          >
            {/* <RevisionViewer 
              revisions={revisions}
            /> */}
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
};

export default Dashboard;
