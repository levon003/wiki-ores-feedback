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
import "../../../../src/style.css"
import moment from 'moment';

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

}));

const RevisionView = ({revision, className, ...rest }) => {
  const classes = useStyles();
  const [revisionDiff, setRevisionDiff] = useState("Diff not loaded yet.");
  const [expanded, setExpanded] = useState(false);
  const [iplink, setiplink] = useState ("");
  const [userlink, setuserlink] = useState ("");
  const [revisionMetadata, setRevisionMetadata] = useState({
    'from_user': '',
    'from_timestamp': '',
    'from_parsedcomment': '',
    'to_user': '',
    'to_timestamp': '',
    'to_parsedcomment': '',
    'from_revid': '',
    'to_revid': '',
    'from_userid' :'',
    'to_userid' :'',

  });

  const handleChange = (event, isExpanded) => {
    setExpanded(!expanded);
  }

  function userCheck(id){
    // console.log(id);
    if (id == 0 ){
      setiplink("https://en.wikipedia.org/wiki/Special:Contributions/");
    }else{
      setuserlink("https://en.wikipedia.org/wiki/User:");
    }
  } 

  // demonstration of using the Compare API to retrieve HTML and set it to state.
  // Note that it needs styling to look anything like the Wikipedia view!
  // https://www.mediawiki.org/wiki/Manual:CORS
  useEffect(() => {
    fetch('https://en.wikipedia.org/w/api.php?action=compare&fromrev=1001836865&torev=1001836878&format=json&prop=diff|title|ids|user|comment|size|timestamp&origin=*', {
        crossDomain: true,
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                 'Origin': 'http://localhost:3000'
                 },
      })
        .then(res => res.json())
        .then(data => {
          userCheck(data.compare['touserid']);
          userCheck(data.compare['fromuserid']);
          // console.log(iplink);
          console.log(data);
          setRevisionDiff(data.compare['*']);
          setRevisionMetadata({
            'from_user': data.compare['fromuser'],
            'from_timestamp': data.compare['fromtimestamp'],
            'from_parsedcomment': data.compare['fromparsedcomment'],
            'to_user': data.compare['touser'],
            'to_timestamp': data.compare['totimestamp'],
            'to_parsedcomment': data.compare['toparsedcomment'],
            'from_revid': data.compare['fromrevid'],
            'to_revid': data.compare['torevid'],
            'to_userid': data.compare['touserid'],
            'from_userid': data.compare['fromuserid'],
          })
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
          <tbody>
            <tr>
              <td id= "time" colSpan={2}><a href={"https://en.wikipedia.org/w/index.php?oldid=" + revisionMetadata.from_revid.toString()}>
                  Revision as of  {moment(revisionMetadata.from_timestamp).format("h:mm, D MMMM YYYY") }</a> 
                    (<a href={"https://en.wikipedia.org/w/index.php?&action=edit&oldid=" + revisionMetadata.from_revid.toString()}>
                    edit</a>)</td>
              <td id= "time" colSpan={2}><a href={"https://en.wikipedia.org/w/index.php?oldid=" + revisionMetadata.to_revid.toString()}>
                  Revision as of {moment(revisionMetadata.to_timestamp).format("h:mm, D MMMM YYYY") }</a> 
                  (<a href={"https://en.wikipedia.org/w/index.php?&action=edit&oldid=" + revisionMetadata.to_revid.toString()}>edit</a>) 
                  (<a href={"https://en.wikipedia.org/w/index.php?&action=edit&undoafter=" + revisionMetadata.from_revid.toString() + "&undo=" + revisionMetadata.to_revid.toString()}>undo</a>)</td>
            </tr>
            <tr>
              <td id= "user" colSpan={2}><a href = {iplink + revisionMetadata.from_user.toString()}> {revisionMetadata.from_user}</a></td>
              <td id= "user" colSpan={2}><a href = {userlink + revisionMetadata.to_user.toString()}>{revisionMetadata.to_user} </a></td>
            </tr>
            <tr>
              <td id= "parsecom" colSpan={2} dangerouslySetInnerHTML={{__html: revisionMetadata.from_parsedcomment}}/>
              <td id= "parsecom" colSpan={2} dangerouslySetInnerHTML={{__html: revisionMetadata.to_parsedcomment}}/>
            </tr>
            <tr>
              <td id= "edit" colSpan={2}> <a href={"https://en.wikipedia.org/w/index.php?&diff=prev&oldid=" +  revisionMetadata.from_revid.toString()}> &lt;- Previous edit </a></td>
              <td id= "edit" colSpan={2}> <a href={"https://en.wikipedia.org/w/index.php?&diff=next&oldid" +  revisionMetadata.from_revid.toString()}> Next edit -{">"}  </a></td>
            </tr>
          </tbody>
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
  </Paper>

  );
};

RevisionView.propTypes = {
  className: PropTypes.string
};

export default RevisionView;
