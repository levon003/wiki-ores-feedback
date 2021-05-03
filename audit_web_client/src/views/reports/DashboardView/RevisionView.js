import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Paper,
  Typography,
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
    'loaded': false,
  });

  const handleChange = (event, isExpanded) => {
    setExpanded(!expanded);
  }

  function getUserLink(user_text, user_id) {
    if (user_id === 0) {
      return "https://en.wikipedia.org/wiki/Special:Contributions/" + user_text.toString();
    } else {
      return "https://en.wikipedia.org/wiki/User:" + user_text.toString();
    }
  }

  function formatTimestamp(timestamp) {
    return moment(timestamp).format("h:mm, D MMMM YYYY");
  }

  function parsetoHTML(tpcomment) {
    var doc = new DOMParser().parseFromString(tpcomment, "text/html");
    var links = doc.getElementsByTagName("a");
    for(let link of links){
      // Update the relative links to point to enwiki directly
      link.href = "https://en.wikipedia.org" + link.getAttribute('href'); 
      }
    return doc.body.innerHTML;
  }

  useEffect(() => {
    // When this component loads, make a request to generate the diff
    // Note this could be changed to only make the request once the diff is expanded
    const compare_url = 'https://en.wikipedia.org/w/api.php?action=compare&fromrev=' + revision.prev_rev_id.toString() + '&torev=' + revision.rev_id.toString() + '&format=json&prop=diff|title|ids|user|comment|size|timestamp&origin=*'
    fetch(compare_url, {
        crossDomain: true,
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                 'Origin': 'https://ores-inspect.toolforge.org'
                 },
      })
        .then(res => res.json())
        .then(data => {
          setRevisionDiff(data.compare['*']);
          setRevisionMetadata({
            'from_user': data.compare['fromuser'],
            'from_timestamp': data.compare['fromtimestamp'],
            'from_parsedcomment': parsetoHTML(data.compare['fromparsedcomment']),
            'to_user': data.compare['touser'],
            'to_timestamp': data.compare['totimestamp'],
            'to_parsedcomment': parsetoHTML(data.compare['toparsedcomment']),
            'from_revid': data.compare['fromrevid'],
            'to_revid': data.compare['torevid'],
            'to_userid': data.compare['touserid'],
            'from_userid': data.compare['fromuserid'],
            'loaded': true,
          })
    });
  }, [revision]);

  function DiffTable(props) {
    if (revisionMetadata.loaded) {
      return (
        <table className="diff diff-contentalign-left diff-editfont-monospace">
          <colgroup>
            <col className="diff-marker"/>
            <col className="diff-content"/>
            <col className="diff-marker"/>
            <col className="diff-content"/>
          </colgroup> 
          <tbody>
            <tr>
              <td id= "time" colSpan={2}>
                <a href={"https://en.wikipedia.org/w/index.php?oldid=" + revisionMetadata.from_revid.toString()}>
                  Revision as of {formatTimestamp(revisionMetadata.from_timestamp)}</a> 
                    (<a href={"https://en.wikipedia.org/w/index.php?&action=edit&oldid=" + revisionMetadata.from_revid.toString()}>
                    edit</a>)
              </td>
              <td id= "time" colSpan={2}>
                <a href={"https://en.wikipedia.org/w/index.php?oldid=" + revisionMetadata.to_revid.toString()}>
                  Revision as of {formatTimestamp(revisionMetadata.to_timestamp)}
                </a> 
                (<a href={"https://en.wikipedia.org/w/index.php?&action=edit&oldid=" + revisionMetadata.to_revid.toString()}>edit</a>) 
                (<a href={"https://en.wikipedia.org/w/index.php?&action=edit&undoafter=" + revisionMetadata.from_revid.toString() + "&undo=" + revisionMetadata.to_revid.toString()}>undo</a>)
              </td>
            </tr>
            <tr>
              <td id= "user" colSpan={2}><a href={getUserLink(revisionMetadata.from_user, revisionMetadata.from_userid)}>{revisionMetadata.from_user}</a></td>
              <td id= "user" colSpan={2}><a href={getUserLink(revisionMetadata.to_user, revisionMetadata.to_userid)}>{revisionMetadata.to_user}</a></td>
            </tr>
            <tr>
              <td id= "parsecom" colSpan={2} dangerouslySetInnerHTML={{__html: revisionMetadata.from_parsedcomment}}/>
              <td id= "parsecom" colSpan={2} dangerouslySetInnerHTML={{__html: revisionMetadata.to_parsedcomment}}/>
            </tr>
            <tr>
              <td id= "edit" colSpan={2}> <a href={"https://en.wikipedia.org/w/index.php?&diff=prev&oldid=" +  revisionMetadata.from_revid.toString()}> &lt;- Previous edit </a></td>
              <td id= "edit" colSpan={2}> <a href={"https://en.wikipedia.org/w/index.php?&diff=next&oldid=" +  revisionMetadata.to_revid.toString()}> Next edit -{">"}  </a></td>
            </tr>
          </tbody>
          <tbody dangerouslySetInnerHTML={{__html: revisionDiff}}></tbody>
        </table>
      );
    } else {
      return (
        <Typography>Still loading diff from the Wikipedia Compare API.</Typography>
      );
    }
  }

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
      {expanded ? 'Collapse difference between revisions' : 'View difference between revisions'}
      </AccordionSummary>
      <AccordionDetails>
        <Box
          display="flex"
          flexDirection="column"
        >
        <DiffTable />
        <Button
          onClick={handleChange}
        >
          <ExpandLessIcon /> Collapse difference between revisions <ExpandLessIcon />
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
