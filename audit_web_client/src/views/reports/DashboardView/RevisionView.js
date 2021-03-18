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
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
// import ScrollUpButton from "react-scroll-up-button";
import {TinyButton as ScrollUpButton} from "react-scroll-up-button"; 
import { Collapse } from '@material-ui/core';
import { render } from 'nprogress';


const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  actions: {
    justifyContent: 'flex-end'
  },
  heading: {
    flexShrink: 0,
    flexBasis: '33.33%',
  },  
  // secondaryHeading: {
  //   fontSize: theme.typography.pxToRem(15),
  //   color: theme.palette.text.secondary,

}));

const RevisionView = ({revision, className, ...rest }) => {
  const classes = useStyles();
  const [revisionDiff, setRevisionDiff] = useState("Diff not loaded yet.");
  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  }   

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
          console.log(data.compare['*']);
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
      {/* <Box 
        display="flex"
        flexWrap="nowrap"
        flexDirection="row"
        flexGrow={1}
        width = "1300px"
      > */}
      <Accordion expanded={expanded === 'panel'} onChange={handleChange('panel')}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-content" id="panel-header"> 
      </AccordionSummary>
      <AccordionDetails>
        <table class="diff diff-contentalign-left diff-editfont-monospace" data-mw="interface">
          <colgroup>
				    <col class="diff-marker"/>
				    <col class="diff-content"/>
            <col class="diff-marker"/>
			      <col class="diff-content"/>
				  </colgroup> 
          <tbody dangerouslySetInnerHTML={{__html: revisionDiff}}></tbody>
        </table>
        <div>
          {/* <ScrollUpButton ContainerClassName="ScrollUpButton__Container" TransitionClassName="ScrollUpButton__Toggled">
      </ScrollUpButton> */}
      <ScrollUpButton/>
      
      </div>
      </AccordionDetails>
  </Accordion>
  {/* </Box> */}
  </Paper>

  );
};

RevisionView.propTypes = {
  className: PropTypes.string
};

export default RevisionView;
