import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Paper,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';


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
  const [expanded, setExpanded] = useState(false);

  const handleChange = (event, isExpanded) => {
    setExpanded(!expanded);
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
      <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-content" id="panel-header"> 
      View Diff
      </AccordionSummary>
      <AccordionDetails>
        <Box
          display="flex"
          flexDirection="column"
        >
        <table className="diff diff-contentalign-left diff-editfont-monospace" data-mw="interface">
          <colgroup>
				    <col className="diff-marker"/>
				    <col className="diff-content"/>
            <col className="diff-marker"/>
			      <col className="diff-content"/>
				  </colgroup> 
          <tbody dangerouslySetInnerHTML={{__html: revisionDiff}}></tbody>
        </table>
        <Button
          onClick={handleChange}
        >
          <ExpandLessIcon /> Collapse diff <ExpandLessIcon />
        </Button>
        </Box>
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
