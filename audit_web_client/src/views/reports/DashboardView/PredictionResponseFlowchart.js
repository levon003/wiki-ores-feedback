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
        
const PredictionResponseFlowchart = ( { data } ) => {

  const handleClick = (source, target) => {
    console.log("Clicked link", source.id, target.id);
  }
  
  // generated example code from the nivo web interface, with a few tweaks
  return (
    <ResponsiveSankey
      data={data}
      margin={{ top: 50, right: 200, bottom: 50, left: 200 }}
      align="justify"
      sort="input"
      colors={{ scheme: 'category10' }}
      nodeOpacity={1}
      nodeHoverOpacity={0.9}
      nodeHoverOthersOpacity={0.5}
      nodeThickness={40}
      nodeInnerPadding={1}
      nodeSpacing={30}
      nodeBorderWidth={0}
      nodeBorderColor={{ from: 'color', modifiers: [ [ 'darker', 0.8 ] ] }}
      linkOpacity={1}
      linkHoverOpacity={0.9}
      linkHoverOthersOpacity={0.5}
      enableLinkGradient={true}
      labelPosition="outside"
      labelPadding={16}
      labelTextColor={{ from: 'color', modifiers: [ [ 'darker', '1' ] ] }}
      animate={false}
      onClick={(data, event) => {
                if ("source" in data) {
                  // this is a link click, since it has a source attribute
                  handleClick(data.source, data.target);
                }
              }}
  />
  )
}

export default PredictionResponseFlowchart;
