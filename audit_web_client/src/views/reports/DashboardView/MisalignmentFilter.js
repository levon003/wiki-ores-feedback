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
  TableContainer,
  TextField,
  Tooltip,
  Paper,
  makeStyles
} from '@material-ui/core';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveSankey } from '@nivo/sankey'
import { ResponsiveBar } from '@nivo/bar'
import PredictionResponseFlowchart from './PredictionResponseFlowchart';

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  textField: { //used for the search bar
    width: '98%',
    margin: theme.spacing(1),
  },
  table: {
    minWidth: 80,
  },
}));

const MisalignmentFilter = ({ className, ...rest }) => {
  const classes = useStyles();
  
  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
      <CardHeader
        title="Misalignment Filter"
      />

      <Divider />
      <Box height="30vh">
        <PredictionResponseFlowchart data={{
          "nodes": [
            {
              "id": "Very Likely Good",
              "color": "hsl(70, 70%, 50%)"
            },
            {
              "id": "Very Likely Bad",
              "color": "hsl(90, 70%, 50%)"
            },
            {
              "id": "Not Reverted",
              "color": "hsl(100, 70%, 50%)"
            },
            {
              "id": "Reverted",
              "color": "hsl(80, 70%, 50%)"
            },
          ],
          "links": [
            
            {
              "source": "Very Likely Bad",
              "target": "Reverted",
              "value": 20,
            },
            {
              "source": "Very Likely Good",
              "target": "Not Reverted",
              "value": 1000,
            },
            {
              "source": "Very Likely Good",
              "target": "Reverted",
              "value": 100,
            },
            {
              "source": "Very Likely Bad",
              "target": "Not Reverted",
              "value": 1,
            },
          ]
        }} />
      </Box>
    </Card>
  );
};

MisalignmentFilter.propTypes = {
  className: PropTypes.string
};

export default MisalignmentFilter;
