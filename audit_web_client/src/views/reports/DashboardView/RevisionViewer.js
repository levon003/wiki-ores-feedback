import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  makeStyles
} from '@material-ui/core';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
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

const RevisionViewer = ({ className, ...rest }) => {
  const defaultPreloadMessage = "Loading and retrieving revision data. Please wait a moment."
  
  const classes = useStyles();
  const [revisions, setRevisions] = useState([{'rev_id': 0}]);
  const [displayLimit, setDisplayLimit] = useState(5);  // TODO Probably want to remember this for a user
  const [statusDescription, setStatusDescription] = useState(defaultPreloadMessage);

  // Want state to track total available at multiple levels. Probably want to store it one state dictionary, since each should change only "one at a time"...
  const [prefilteredTotal, setPrefilteredTotal] = useState(0);
    
  useEffect(() => {
    // TODO Actually retrieve a set of revisions here by querying the backend
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
              <RevisionView 
                key={revision.rev_id} 
                revision={revision} 
              />
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
