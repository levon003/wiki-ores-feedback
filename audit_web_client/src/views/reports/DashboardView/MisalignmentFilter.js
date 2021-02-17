import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import Chart from "react-google-charts";

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
import { AlignCenter } from 'react-feather';

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
//     <Chart
//     style={{
//       position: 'relative', left: '20%', top: '0%',
//       // transform: 'translate(-50%, -50%)'
//   }}
//   width={600}
//   height={'400px'}
//   chartType="Sankey"
//   loader={<div>Loading Chart</div>}
//   options={{
//     sankey: {
//       link: { 
//         color: { fill: '#a6cee3'},
//         // colors: ['#ed5353', '#ed5353','#ed9853','#ed9853', '#edde53', '#edde53', '#39d44e', '#39d44e'],
//         // colorMode: 'gradient',
//       },
//       node: {
//         colors: ['#ed5353', '#ed5353','#39d44e','#ed9853', '#edde53', '#39d44e'],
//         label: { color: '#2e49bf' },
//         width: 40,
//         nodePadding: 50,
//         label: {fontSize: 15}
//       },
     
//     },
//   }}
//   data={[
//     ['From', 'To', 'Weight'],
//     ['Very likely have problems', 'Reverted', 95],
//     ['Very likely have problems', 'Not Reverted', 10],
//     ['Likely have problems', 'Reverted', 97],
//     ['Likely have problems', 'Not Reverted', 20],
//     ['May have problems', 'Not Reverted', 86],
//     ['May have problems', 'Reverted', 16],
//     ['Very likely good', 'Reverted', 5],
//     ['Very likely good', 'Not Reverted', 100],
//   ]}
//   rootProps={{ 'data-testid': '1' }}
// /> 
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
