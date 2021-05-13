import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Link,
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
  mwPlusminusPos: {
      color: "#006400",
  },
  mwPlusminusNeg: {
      color: "#8b0000",
  },
  mwPlusminusNull: {
    color: "#a2a9b1",
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

  const handleAccordionExpansionToggle = (event, isExpanded) => {
    setExpanded(!expanded);
  }

  const handleButtonClick = (button_type) => {
    // TODO Make any needed updates to the frontend and save to the backend
    fetch('/api/annotation');  // TODO put the new button_type and the revision.rev_id in the request
  }

  function getUserLink(user_text, user_id) {
    if (user_id === 0) {
      return (
        <Box display="inline" component="span">
         <Link href={"https://en.wikipedia.org/wiki/Special:Contributions/" + user_text.toString()}>{user_text}</Link> (<Link href={"https://en.wikipedia.org/wiki/User_talk:" + user_text.toString()}>talk</Link>)
        </Box>
      );
    } else {
      return (
        <Box display="inline" component="span">
         <Link href={"https://en.wikipedia.org/wiki/User:" + user_text.toString()}>{user_text}</Link> (<Link href={"https://en.wikipedia.org/wiki/User_talk:" + user_text.toString()}>talk</Link>&nbsp;|&nbsp;<Link href={"https://en.wikipedia.org/wiki/Special:Contributions/" + user_text.toString()}>contribs</Link>)
        </Box>
      );
    }
  }

  function formatTimestamp(timestamp) {
    return moment.utc(timestamp).utc().format("HH:mm, DD MMMM YYYY");
  }

  function convertRelativeLinks(tpcomment) {
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
            'from_parsedcomment': convertRelativeLinks(data.compare['fromparsedcomment']),
            'to_user': data.compare['touser'],
            'to_timestamp': data.compare['totimestamp'],
            'to_parsedcomment': convertRelativeLinks(data.compare['toparsedcomment']),
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
              <td id= "user" colSpan={2}>{getUserLink(revisionMetadata.from_user, revisionMetadata.from_userid)}</td>
              <td id= "user" colSpan={2}>{getUserLink(revisionMetadata.to_user, revisionMetadata.to_userid)}</td>
            </tr>
            <tr>
              <td id= "parsecom" colSpan={2} dangerouslySetInnerHTML={{__html: revisionMetadata.from_parsedcomment}}/>
              <td id= "parsecom" colSpan={2} dangerouslySetInnerHTML={{__html: revisionMetadata.to_parsedcomment}}/>
            </tr>
            <tr>
              <td id= "edit" colSpan={2}> <a href={"https://en.wikipedia.org/w/index.php?&diff=prev&oldid=" +  revisionMetadata.from_revid.toString()}>← Previous edit</a></td>
              <td id= "edit" colSpan={2}> <a href={"https://en.wikipedia.org/w/index.php?&diff=next&oldid=" +  revisionMetadata.to_revid.toString()}>Next edit →</a></td>
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

  function InlineDescription(props) {
    if (revision.has_edit_summary) {
      if (revisionMetadata.loaded) {
        return (<Box display="inline" component="span" fontStyle='italic' dangerouslySetInnerHTML={{__html: revisionMetadata.to_parsedcomment}}></Box>);
      } else {
        return (<Box display="inline" component="span" fontSize='10px'>loading</Box>);
      }
    } else {
      return (<Box display="inline" component="span" fontSize='10px'>none</Box>);
    }
  }

  function getBytesDeltaDescriptor() {
    let delta_bytes = revision.delta_bytes;
    if (delta_bytes === null) {
      // assume this is a page creation
      delta_bytes = revision.curr_bytes;
    }

    if (delta_bytes >= 500) {
      return (
        <Box component="span" className={clsx(classes.mwPlusminusPos)}>
          <strong>(+{delta_bytes.toLocaleString()})</strong>
        </Box>
      );
    } else if (delta_bytes > 0) {
      return (
        <Box component="span" className={clsx(classes.mwPlusminusPos)}>
          (+{delta_bytes.toLocaleString()})
        </Box>
      );
    } else if (delta_bytes === 0) {
      return (
        <Box component="span" className={clsx(classes.mwPlusminusNull)}>
          ({delta_bytes.toLocaleString()})
        </Box>
      );
    } else if (delta_bytes < 0) {
      return (
        <Box component="span" className={clsx(classes.mwPlusminusNeg)}>
          (-{delta_bytes.toLocaleString()})
        </Box>
      );
    } else {
      return (
        <Box component="span" className={clsx(classes.mwPlusminusNeg)}>
          <strong>(-{delta_bytes.toLocaleString()})</strong>
        </Box>
      );
    }
  }

  function RevisionSummary(props) {
    return (
      <Box>
        <Box><Link href={"https://en.wikipedia.org/w/index.php?title=" + revision.page_title}>{revision.page_title}</Link></Box>
        <Box display="flex" flexDirection='row'>
          <Box pl={1}><Typography>{'\u2022'}</Typography></Box>
          <Box 
            pl={1} 
            fontFamily="sans-serif" 
            fontSize={14}
            whiteSpace="normal"
          >
              (
              <Link href={"https://en.wikipedia.org/w/index.php?diff=0&oldid=" + revision.rev_id}>cur</Link>
              &nbsp;|&nbsp;
              <Link href={"https://en.wikipedia.org/w/index.php?diff="+ revision.rev_id.toString() + "&oldid=" + revision.prev_rev_id}>prev</Link>
              ) 
              &nbsp;&nbsp;
              <Box display="inline" component="span">{formatTimestamp(revision.rev_timestamp)}</Box>
              &nbsp;&nbsp;
              {getUserLink(revision.user_text, revision.user_id)}
              {' . . '}
              <Box display="inline" component="span">({revision.curr_bytes.toLocaleString()} bytes)</Box> {getBytesDeltaDescriptor()}
              {' . . '}
              <Box display="inline" component="span">(<InlineDescription />)</Box>
              &nbsp;(<Link href={"https://en.wikipedia.org/w/index.php?title=" + revision.page_title + "&action=edit&undoafter=" + revision.prev_rev_id.toString() + "&undo=" + revision.rev_id.toString()}>undo</Link>)
          </Box>
        </Box>
      </Box>
    );
  }

  function PredictionDisplay(props) {
    return (
      <Box>
        ORES prediction: {revision.damaging_pred.toString()}
      </Box>
    );
  }

  function AnnotationButtons(props) {
    return (
      <Box>
        <Button variant="outlined" onClick={handleButtonClick('flag')}>Flag/IDK/Not Sure/Ambiguous/Interesting</Button>
        <Button variant="outlined">Confirm damaging</Button>
        <Button variant="outlined">Not damaging / misclassification</Button>
        <TextField id="notes" label="Notes" />
      </Box>
    );
  }

  function RevisionAnnotationControls(props) {
    return (
      <Box
        display="flex"
        flexDirection="row"
      >
        <PredictionDisplay />
        <AnnotationButtons />
      </Box>
    );
  }

  return (
    <Paper
      className={clsx(classes.root, className)}
      variant="outlined"
      m={1}
      p={1}
      {...rest}
    >
      <Box p={1}>
        <RevisionSummary />
        <RevisionAnnotationControls />
        <Accordion expanded={expanded} onChange={handleAccordionExpansionToggle}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="diff-content" id="diff-header"> 
        {expanded ? 'Collapse difference between revisions' : 'View difference between revisions'}
        </AccordionSummary>
        <AccordionDetails>
          <Box
            display="flex"
            flexDirection="column"
          >
          <DiffTable />
          <Button
            onClick={handleAccordionExpansionToggle}
          >
            <ExpandLessIcon /> Collapse difference between revisions <ExpandLessIcon />
          </Button>
          </Box>
        </AccordionDetails>
        </Accordion>
    </Box>
  </Paper>

  );
};

RevisionView.propTypes = {
  className: PropTypes.string
};

export default RevisionView;
