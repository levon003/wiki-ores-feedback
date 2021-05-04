import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  makeStyles
} from '@material-ui/core';
import RevisionView from './RevisionView';

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  statusDescription: {
    margin: theme.spacing(1),
  },
}));

const RevisionViewer = ({ className, revisions, ...rest }) => {
  const defaultPreloadMessage = "Loading and retrieving revision data. Please wait a moment."
  
  const classes = useStyles();
  const [displayLimit, setDisplayLimit] = useState(20);  // TODO Probably want to remember this as a user setting
  const [statusDescription, setStatusDescription] = useState(defaultPreloadMessage);

  // Want state to track total available at multiple levels. Probably want to store it one state dictionary, since each should change only "one at a time"...
  const [prefilteredTotal, setPrefilteredTotal] = useState(0);
    
  useEffect(() => {
    // TODO Actually retrieve a set of revisions here by querying the backend
    // JK, we're actually doing this in index and passing them in.  
    // Perhaps the expected behavior is to move loading status into the index, and just include a rev count in this component.
    setStatusDescription('Loaded revisions; change filters or use page controls to see more.')
  }, []);
    
  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
      <Box
        height="90vh"
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
      >
      <Box 
        minWidth="30vw" 
        maxWidth="100vw"
        minHeight="30vw"
        flexGrow={1}
        style={{'overflowY': 'scroll'}}
      >
        <Box
          display="flex"
          flexDirection="column"
          flexWrap="nowrap"
          alignItems="center"
        >
        {revisions.map((revision) => (
              <Box p={1} width='100%'>
                <RevisionView 
                  key={revision.rev_id} 
                  revision={revision} 
                />
              </Box>
            ))}
        
        <Box className={clsx(classes.margin, classes.statusDescription)}>
           <p>{statusDescription}</p>
        </Box>
        </Box>
      </Box>
      <Box
        display="flex"
        justifyContent="flex-start"
        p={2}
      >
        <div>{prefilteredTotal} revisions available (display limit {displayLimit})</div>
      </Box>
      </Box>
    </Card>
  );
};

RevisionViewer.propTypes = {
  className: PropTypes.string
};

export default RevisionViewer;
