import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import clsx from 'clsx';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonGroup,
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
  TextareaAutosize,
  TextField,
  Tooltip,
  Paper,
  makeStyles
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
}));

const RevisionView = ({revision, className, ...rest }) => {
  const classes = useStyles();
  
  const [revisionDiff, setRevisionDiff] = useState("Diff not loaded yet.");
      
  // demonstration of using the Compare API to retrieve HTML and set it to state.
  // Note that it needs styling to look anything like the Wikipedia view!
  // https://www.mediawiki.org/wiki/Manual:CORS
  useEffect(() => {
    fetch('https://en.wikipedia.org/w/api.php?action=compare&fromrev=1001836865&torev=1001836878&format=json&origin=*', {
        crossDomain: true,
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                 'Origin': 'http://localhost:3000'
                 },
      })
        .then(res => res.json())
        .then(data => {
          //console.log(data.compare['*']);
          setRevisionDiff(data.compare['*']);
    });
  }, []);
  
  return (
    <Paper
      className={clsx(classes.root, className)}
      variant="outlined"
      m={1}
      p={1}
      {...rest}
    >
      <Box 
        display="flex"
        flexWrap="nowrap"
        flexDirection="column"
        flexGrow={1}
      >
        <Box maxHeight="20vh" maxWidth="80vw" style={{'overflowY': 'scroll'}}>
          <div dangerouslySetInnerHTML={{__html: revisionDiff}} />
        </Box>
      </Box>
    </Paper>
  );
};

RevisionView.propTypes = {
  className: PropTypes.string
};

export default RevisionView;
