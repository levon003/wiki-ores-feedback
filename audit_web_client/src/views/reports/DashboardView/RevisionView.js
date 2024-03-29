import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Link,
  Typography,
  TextField,
  useTheme,
  Tooltip
} from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import "../../../../src/style.css"
import moment from 'moment';
import FlagIcon from '@material-ui/icons/Flag';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import { Oval } from 'react-loading-icons';
import ArrowBackIosIcon from '@material-ui/icons//ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons//ArrowForwardIos';
import { LoggingContext } from '../../../App'

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  sticky: {
    position: "-webkit-sticky",
    position: "sticky",
  },
  actions: {
    justifyContent: 'flex-end',
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

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    border: '1px solid #dadde9',
  },
}))(Tooltip);

const NotesLoadingIcon = ({ typing, userChangedNote, noteSuccess }) => {
    if (typing || (userChangedNote && noteSuccess === null)) {
      // user is typing OR the user has changed the note, and we don't yet know if the update was successful
      return <Oval stroke="#000000" style={{height: 20, width: 20, marginTop: 20, marginLeft: 8}}/>
    } else if (noteSuccess === true) {
      return <CheckIcon style={{fill: "green", marginTop: 20, marginLeft: 8}}/>
    } else if (noteSuccess === false) {
      return <CloseIcon style={{fill: "red", marginTop: 20, marginLeft: 8}}/>
    } else {
      return null
    }
}

const RevisionView = ({ revisions, setRevisions, className, currRevisionIdx, setCurrRevisionIdx, accordionExpanded, setAccordionExpanded, revisionFilter, minorFilter, filteredUsernames, userTypeFilter, pageValues, linkedToValues, linkedFromValues, namespaceSelected, filter_summary, setAnnotationHistory, focusSelected,userHasAnnotatedWithinThisFilterCriteria, setUserHasAnnotatedWithinThisFilterCriteria, ...rest }) => {
  
  const revision = revisions[currRevisionIdx]
  const classes = useStyles()
  const handleLogging = useContext(LoggingContext)
  const [revisionDiff, setRevisionDiff] = useState("Loading revision diff from the Wikipedia Compare API...")
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
  })
  const [revertMetadata, setRevertMetadata] = useState({
    'has_revert': revision.revert_id !== null,
    'revert_id': revision.revert_id,
    'is_self_reverted': revision.is_self_reverted,
    'seconds_to_revert': revision.seconds_to_revert,
    'timestamp': revision.rev_timestamp + revision.seconds_to_revert,
    'revert_set_size': revision.revert_set_size,
    'has_edit_summary': true,  // until we learn it doesn't, assume it does have one
    'edit_summary': '',
    'revert_user': '',
    'revert_userid': 0,
    'curr_bytes': null,
    'delta_bytes': null,
    'loaded': false,
  })
  const [ correctnessType, setCorrectnessType ] = useState(revision.correctness_type_data)
  const [ note, setNote ] = useState(revision.note_data == null ? "" : revision.note_data)

  // state for controlling note
  const [ noteSuccess, setNoteSuccess ] = useState(null)  // null if no POST pending, true if POST success, false if POST failure
  const [ typing, setTyping ] = useState(false)  // true if user has typed and for 1 second afterwards
  const [ unsentNoteUpdate, setUnsentNoteUpdate ] = useState(false)  // true if a user has typed something and we haven't POSTed that change yet
  const [ userChangedNote, setUserChangedNote ] = useState(false)  // true if the user has ever changed the note
  
  // state for controlling buttons
  const [ buttonSuccess, setButtonSuccess ] = useState(null)
  
  useEffect( () => {
    return () => {
      // Executed only when component unmounts
      // This approach is from: https://stackoverflow.com/a/68165678/4146714
      let e = new Event("revisionViewComponentUnmount");
      document.dispatchEvent(e);
    }
  }, []);

  // Revision change useEffect
  useEffect(() => {
    // When this component loads, make a request to generate the diff
    // Note this could be changed to only make the request once the diff is expanded
    let ignoreFetchResult = false
    async function fetchRevisionDiff() {
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
        if (data.hasOwnProperty("error")) {
          console.log(data.error.code, data.error.info)
          if (data.error.code === "nosuchrevid" || data.error.code === "missingcontent") {
            setRevisionDiff("Revision was revdeled (probably) after January 2020 or so. " + data.error.info + " (error code: " + data.error.code + ") You can try to <a href=\"https://en.wikipedia.org/w/index.php?diff=" + revision.rev_id.toString() + "\" target=\"_blank\" rel=\"noopener noreferrer\">view the revision on Wikipedia</a> for more info.")
          } else {
            // We have never seen this error before
            // Panic
            setRevisionDiff("Error loading revision: " + data.error.info + " (error code: " + data.error.code + ") You can try to <a href=\"https://en.wikipedia.org/w/index.php?diff=" + revision.rev_id.toString() + "\" target=\"_blank\" rel=\"noopener noreferrer\">view the revision on Wikipedia</a> for more info.")
          }
        } else {
          if (!ignoreFetchResult) {
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
          } else {
            console.log("Skipping revision metadata result.")
          }
        }
      });
      if (revision.revert_id !== null) {
        fetch('https://en.wikipedia.org/w/api.php?action=compare&fromrev=' + revision.rev_id.toString() + '&torev=' + revision.revert_id.toString() + '&format=json&prop=ids|user|comment|size|timestamp&origin=*', {
          crossDomain: true,
          method: 'GET',
          headers: {'Content-Type': 'application/json',
                    'Origin': 'https://ores-inspect.toolforge.org'
                    },
        })
        .then(res => res.json())
        .then(data => {
          if (data.hasOwnProperty("error")) {
            console.log("revert", data.error.code, data.error.info)
            setRevertMetadata({
              ...revertMetadata,
              'has_edit_summary': true,
              'edit_summary': "Error loading revision: " + data.error.info + " (error code: " + data.error.code + ") You can try to <a href=\"https://en.wikipedia.org/w/index.php?diff=" + revision.rev_id.toString() + "\" target=\"_blank\" rel=\"noopener noreferrer\">view the revision on Wikipedia</a> for more info.",
              'loaded': true,
            })
          } else {
            if (!ignoreFetchResult) {
              setRevertMetadata({
                ...revertMetadata,
                'has_edit_summary': true,
                'edit_summary': convertRelativeLinks(data.compare['toparsedcomment']),
                'loaded': true,
                'revert_user': data.compare['touser'],
                'revert_userid': data.compare['touserid'],
                'curr_bytes': data.compare['tosize'],
                'delta_bytes': data.compare['tosize'] - data.compare['fromsize'],
              })
            } else {
              console.log("Skipping revert metadata result.")
            }
          }
        })
      }
    }

    fetchRevisionDiff()
    return () => { ignoreFetchResult = true }
  }, [revision]);
  
  let prevUnannotatedDisabledCount = currRevisionIdx - 1
  if (currRevisionIdx !== 0) {
    while (prevUnannotatedDisabledCount >= 0 && revisions[prevUnannotatedDisabledCount].correctness_type_data !== null) {
      prevUnannotatedDisabledCount--
    }
  }

  let nextUnannotatedDisabledCount = currRevisionIdx + 1
  if (currRevisionIdx !== revisions.length - 1) {
    while ((nextUnannotatedDisabledCount <= revisions.length - 1) && revisions[nextUnannotatedDisabledCount].correctness_type_data !== null) {
      nextUnannotatedDisabledCount++
    }
  }

  // this is for setting the typing state of the note field
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTyping(false)
    }, 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [note])
  
  // determines when to POST updated note
  useEffect(() => {
    let ignoreFetchResult = false
    // note: ignoreFetchResult is used by the fetch callback to avoid setting RevisionView state
    // importantly, that means the callback WILL call setRevisions, to set state in the parent

    function doOnUnmount() {
      // Runs when this RevisionView unmounts
      ignoreFetchResult = true;
      if (unsentNoteUpdate) {
        // Sending note update as component unmounts
        // note that ignoreFetchResult is already set to true
        postNoteUpdate()
      } else {
        // Component unmount, with no unsaved note state.
      }
      if (revision.note_data !== note) {
        // State mismatch between saved revision data and actual note data
        // this might be unnecessary, but I think revision data won't necessarily be set correctly in the POST callback
        let copy = [...revisions]
        copy[currRevisionIdx] = {...copy[currRevisionIdx], note_data: note}
        setRevisions(copy)
      }
    }
    
    async function postNoteUpdate() {
      fetch('/api/annotation/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rev_id: revision.rev_id,
          annotation_type: 'note',
          note_text: note,
        })
      }).then(res => res.json())
      .then(data => {
        if (data.rev_id === revision.rev_id) {
          if (!ignoreFetchResult) {
            setNoteSuccess(true)
          }
          let copy = [...revisions]
          copy[currRevisionIdx] = {...copy[currRevisionIdx], note_data: data.note_data == null ? "" : data.note_data}
          setRevisions(copy)
        } else {
          console.log(`Current rev is ${revision.rev_id}, but just finished a POST request updating rev ${data.rev_id}'s note.`)
          revisions.filter(rev => rev.rev_id === data.rev_id)[0].note_data = data.note_data == null ? "" : data.note_data
          let copy = [...revisions]
          const revisionIdx = revisions.findIndex((rev) => rev.rev_id === data.rev_id)
          if (revisionIdx !== -1) {
            copy[revisionIdx] = {...copy[revisionIdx], note_data: data.note_data == null ? "" : data.note_data}
            setRevisions(copy)
          } else {
            console.warn('Warning: POST request to update revision note completed, but no revision with that rev_id found in the current revisions list.')
          }
        }
      })
      .catch(data => {
        if (!ignoreFetchResult) {
          setNoteSuccess(false)
        }
      })
    }

    if (!typing && unsentNoteUpdate) {
      console.log(`POSTing note update: Typing ${typing}, unsentNoteUpdate ${unsentNoteUpdate}, revision.rev_id ${revision.rev_id}, revision.note_data ${revision.note_data}, note ${note}`)
      //if (noteSuccess === null) {
        // there is a POST request currently being processed
        // TODO could cancel the previous request https://frontend-digest.com/cancelling-fetch-requests-in-react-applications-58a52a048e8e
      //}
      postNoteUpdate()
      setUnsentNoteUpdate(false)
    }

    document.addEventListener("revisionViewComponentUnmount", doOnUnmount);
    return () => {
        document.removeEventListener("revisionViewComponentUnmount", doOnUnmount);
    }
  }, [revision, typing, note, unsentNoteUpdate])
  
  const handleAccordionExpansionToggle = (event, isExpanded) => {
    setAccordionExpanded(!accordionExpanded);
  }

  const handleAnnotationHistoryRequest = (total_annotated,num_damaging, num_flagged, num_not_damaging) => {
    fetch('/api/annotation_history/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          revision_filters: revisionFilter,
          minor_filters: minorFilter,
          user_type_filter: userTypeFilter,
          filtered_usernames: filteredUsernames,
          page_values: pageValues,
          namespace_selected: namespaceSelected,
          linked_to_values: linkedToValues,
          linked_from_values: linkedFromValues
        },
        focus: {
          focus_selected: focusSelected,
          revert_definition: {
            // TODO: implement revert definition state on frontend
          },
        },
        custom_name: filter_summary,
        total_annotated: total_annotated,
        num_damaging: num_damaging,
        num_flagged: num_flagged,
        num_not_damaging: num_not_damaging,
      })
    })
    .then(res => res.json())
    .then(data => {
      setAnnotationHistory(data.annotation_history)
    })
    .catch(err => console.log(err))
  }
  
  const handleButtonClick = (button_type) => {
    const correctness_type = button_type
    // Setting the state value allows the visuals to update instantly... but can result in confusing state changes if many requests are made in quick succession.
    // What should be done here? One option would be to make THIS change; but block further updates until this POST request is fully resolved. How might we do that?
    // Note the above strategy would be inappropriate for the note; one will need other approaches.
    setButtonSuccess("loading")
    if (!userHasAnnotatedWithinThisFilterCriteria) {
      setUserHasAnnotatedWithinThisFilterCriteria(true)
    }
    console.log("Sending annotation to /api/annotation.");
    fetch('/api/annotation/' , {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rev_id: revision.rev_id,
        annotation_type: 'correctness',
        correctness_type: correctness_type,
        note: note
      }),
    }).then(res => res.json())
    .then(data => {
      setButtonSuccess(true)
        // update the annotations with the new data (if it was not rejected)
        setCorrectnessType(data.correctness_type_data)
        setNote(data.note_data == null ? "" : data.note_data)
        let copy = [...revisions]
        copy[currRevisionIdx] = {...copy[currRevisionIdx], correctness_type_data: data.correctness_type_data, note_data: data.note_data}
        setRevisions(copy)
      }).catch(data => {
        setButtonSuccess(false)
      });
    }

    // update revision history whenever revisions changes
    useEffect(() => {
      const annotated = revisions.filter(revision => revision.correctness_type_data != null).length
      if (annotated != 0 && userHasAnnotatedWithinThisFilterCriteria) { 
        handleAnnotationHistoryRequest(
          annotated,
          revisions.filter(revision => revision.correctness_type_data === "correct").length,
          revisions.filter(revision => revision.correctness_type_data === "flag").length,
          revisions.filter(revision => revision.correctness_type_data === "misclassification").length
        )
      }
    }, [revisions])  

  const getUserLink = (user_text, user_id) => {
    if (user_text === "") {
      return ( <Box display="inline" component="span"></Box>)
    }
    if (user_id === 0) {
      return (
        <Box display="inline" component="span">
         <Link target="_blank" href={"https://en.wikipedia.org/wiki/Special:Contributions/" + user_text.toString()}>{user_text}</Link> (<Link target="_blank" href={"https://en.wikipedia.org/wiki/User_talk:" + user_text.toString()}>talk</Link>)
        </Box>
      );
    } else {
      return (
        <Box display="inline" component="span">
         <Link target="_blank" href={"https://en.wikipedia.org/wiki/User:" + user_text.toString()}>{user_text}</Link> (<Link target="_blank" href={"https://en.wikipedia.org/wiki/User_talk:" + user_text.toString()}>talk</Link>&nbsp;|&nbsp;<Link target="_blank" href={"https://en.wikipedia.org/wiki/Special:Contributions/" + user_text.toString()}>contribs</Link>)
        </Box>
      );
    }
  }

  const formatEpochTimestamp = timestamp => {
    return moment.unix(timestamp).format("HH:mm, DD MMMM YYYY");
  }
  const formatTimestamp = timestamp => {
    return moment.utc(timestamp).utc().format("HH:mm, DD MMMM YYYY");
  }

  const convertRelativeLinks = tpcomment => {
    var doc = new DOMParser().parseFromString(tpcomment, "text/html");
    var links = doc.getElementsByTagName("a");
    for(let link of links){
      // Update the relative links to point to enwiki directly
      link.href = "https://en.wikipedia.org" + link.getAttribute('href'); 
      }
    return doc.body.innerHTML;
  }


  const DiffTable = () => {
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
                <a target="_blank" href={"https://en.wikipedia.org/w/index.php?oldid=" + revisionMetadata.from_revid.toString()}>
                  Revision as of {formatTimestamp(revisionMetadata.from_timestamp)}</a> 
                    (<a target="_blank" href={"https://en.wikipedia.org/w/index.php?&action=edit&oldid=" + revisionMetadata.from_revid.toString()}>
                    edit</a>)
              </td>
              <td id= "time" colSpan={2}>
                <a target="_blank" href={"https://en.wikipedia.org/w/index.php?oldid=" + revisionMetadata.to_revid.toString()}>
                  Revision as of {formatTimestamp(revisionMetadata.to_timestamp)}
                </a> 
                (<a target="_blank" href={"https://en.wikipedia.org/w/index.php?&action=edit&oldid=" + revisionMetadata.to_revid.toString()}>edit</a>) 
                (<a target="_blank" href={"https://en.wikipedia.org/w/index.php?&action=edit&undoafter=" + revisionMetadata.from_revid.toString() + "&undo=" + revisionMetadata.to_revid.toString()}>undo</a>)
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
              <td id= "edit" colSpan={2}> <a target="_blank" href={"https://en.wikipedia.org/w/index.php?&diff=prev&oldid=" +  revisionMetadata.from_revid.toString()}>← Previous edit</a></td>
              <td id= "edit" colSpan={2}> <a target="_blank" href={"https://en.wikipedia.org/w/index.php?&diff=next&oldid=" +  revisionMetadata.to_revid.toString()}>Next edit →</a></td>
            </tr>
          </tbody>
          <tbody dangerouslySetInnerHTML={{__html: revisionDiff}}></tbody>
        </table>
      );
    } else {
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
              <td id= "edit" style={{height: 500}} colSpan={4} dangerouslySetInnerHTML={{__html: revisionDiff}}>
              </td>
            </tr>
          </tbody>
        </table>
      );
    }
  }

  const InlineDescription = ({ hasEditSummary, isSummaryLoaded, editSummary }) => {
    if (hasEditSummary) {
      if (isSummaryLoaded) {
        return (<Box display="inline" component="span" fontStyle='italic' dangerouslySetInnerHTML={{__html: editSummary}}></Box>);
      } else {
        return (<Box display="inline" component="span" fontSize='10px'>loading</Box>);
      }
    } else {
      return (<Box display="inline" component="span" fontSize='10px'>none</Box>);
    }
  }

  const getBytesDeltaDescriptor = (rev_delta_bytes, rev_curr_bytes) => {
    let delta_bytes = rev_delta_bytes;
    if (delta_bytes === null) {
      // assume this is a page creation
      delta_bytes = rev_curr_bytes;
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
          ({delta_bytes.toLocaleString()})
        </Box>
      );
    } else {
      return (
        <Box component="span" className={clsx(classes.mwPlusminusNeg)}>
          <strong>({delta_bytes.toLocaleString()})</strong>
        </Box>
      );
    }
  }

  const getElapsedTimeSummary = (time_in_seconds) => {
    let time = time_in_seconds
    if (time < 60) {
      return `${time} seconds`
    }
    time = time / 60
    if (time < 60) {
      return `${time.toFixed(0)} minutes`
    }
    time = time / 60
    if (time < 48) {
      return `${time.toFixed(0)} hours`
    }
    time = time / 24
    if (time < 21) {
      return `${time.toFixed(0)} days`
    }
    time = time / 7
    if (time < 52) {
      return `${time.toFixed(0)} weeks`
    }
    time = time_in_seconds / 31557600
    return `${time.toFixed(1)} years`
  }

  const RevertUserSizeSummary = () => {
    if (revertMetadata.loaded) {
      return (
        <Box display="inline" component="span">
          &nbsp;&nbsp;
          {getUserLink(revertMetadata.revert_user, revertMetadata.revert_userid)}
          {' . . '}
          <Box display="inline" component="span">({revertMetadata.curr_bytes.toLocaleString()} bytes)</Box> {getBytesDeltaDescriptor(revertMetadata.delta_bytes, revertMetadata.curr_bytes)}
          {' . . '}
        </Box>
      )
    } else {
      return (
        <Box display="inline" component="span">
          {' . . '}
        </Box>
      )
    }
  }


  const RevisionSummary = () => {
    return (
      <Box>
        <Box>
          <Link target="_blank" href={"https://en.wikipedia.org/w/index.php?title=" + revision.page_title}>
            {revision.page_title}
          </Link> (
          <Link target="_blank" href={"https://en.wikipedia.org/w/index.php?title=" + revision.page_title + "&curid=" + revision.rev_id + "&diff=" + revision.rev_id.toString() + "&oldid=" + revision.prev_rev_id}>diff</Link> | <Link target="_blank" href={"https://en.wikipedia.org/w/index.php?title=" + revision.page_title + "&action=history"}>hist</Link>)
        </Box>
        <Box display="flex" flexDirection='row'>
          <Box pl={1}><Typography>{'\u2022'}</Typography></Box>
          <Box 
            pl={1} 
            fontFamily="sans-serif" 
            fontSize={14}
            whiteSpace="normal"
          >
              (
              <Link target="_blank" href={"https://en.wikipedia.org/w/index.php?diff=0&oldid=" + revision.rev_id}>cur</Link>
              &nbsp;|&nbsp;
              <Link target="_blank" href={"https://en.wikipedia.org/w/index.php?diff="+ revision.rev_id.toString() + "&oldid=" + revision.prev_rev_id}>prev</Link>
              ) 
              &nbsp;&nbsp;
              <Box display="inline" component="span">{formatEpochTimestamp(revision.rev_timestamp)}</Box>
              &nbsp;&nbsp;
              {getUserLink(revision.user_text, revision.user_id)}
              {' . . '}
              <Box display="inline" component="span">({revision.curr_bytes.toLocaleString()} bytes)</Box> {getBytesDeltaDescriptor(revision.delta_bytes, revision.curr_bytes)}
              {' . . '}
              <Box display="inline" component="span">(<InlineDescription hasEditSummary={revision.has_edit_summary} isSummaryLoaded={revisionMetadata.loaded} editSummary={revisionMetadata.to_parsedcomment} />)</Box>
              &nbsp;(<Link target="_blank" href={"https://en.wikipedia.org/w/index.php?title=" + revision.page_title + "&action=edit&undoafter=" + revision.prev_rev_id.toString() + "&undo=" + revision.rev_id.toString()}>undo</Link>)
          </Box>
        </Box>
        { revertMetadata.has_revert ? (
          <Box>
            Reverted after {getElapsedTimeSummary(revertMetadata.seconds_to_revert)} by:
            <Box display="flex" flexDirection='row'>
          <Box pl={1}><Typography>{'\u2022'}</Typography></Box>
          <Box 
            pl={1} 
            fontFamily="sans-serif" 
            fontSize={14}
            whiteSpace="normal"
          >
              (
              <Link target="_blank" href={"https://en.wikipedia.org/w/index.php?diff=0&oldid=" + revertMetadata.revert_id}>cur</Link>
              &nbsp;|&nbsp;
              <Link target="_blank" href={"https://en.wikipedia.org/w/index.php?diff="+ revertMetadata.revert_id.toString() + "&oldid=" + revision.rev_id}>diff</Link>
              ) 
              &nbsp;&nbsp;
              <Box display="inline" component="span">{formatEpochTimestamp(revertMetadata.timestamp)}</Box>
              <RevertUserSizeSummary />
              <Box display="inline" component="span">(
                <InlineDescription 
                  hasEditSummary={revertMetadata.has_edit_summary} 
                  isSummaryLoaded={revertMetadata.loaded} 
                  editSummary={revertMetadata.edit_summary}
                />
              )</Box>
          </Box>
        </Box> </Box> ) : null }
      </Box>
    );
  }


  const PredColor = () => {
    if (revision.damaging_pred <= 0.301) {
      return ("container-g");
    } else if (revision.damaging_pred <= 0.629 && revision.damaging_pred > 0.301){
      return ("container-y");
    } else if (revision.damaging_pred <= 0.944 && revision.damaging_pred > 0.629){
      return ("container-o");
    } else {
      return ("container-r");
    }
  }

  const PredictionDisplay = () => {
    var pred = revision.damaging_pred;
    pred = pred.toFixed(3);
    return (
      <HtmlTooltip title={
        <React.Fragment>
          <Typography>ORES Damaging Prediction</Typography>
        </React.Fragment>
      } >
      <div className ={PredColor()}>
        <div>{pred.toString()}</div>
      </div>
      </HtmlTooltip>
    );
  }

  const ButtonLoadingIcon = ({ buttonSuccess }) => {
    if (buttonSuccess === 'loading') {
      return <Oval stroke="#000000" style={{height: 20, width: 20}}/>
    }
    else if (buttonSuccess === true) {
      return <CheckIcon style={{fill: "green"}}/>
    }
    else if (buttonSuccess === false) {
      return <CloseIcon style={{fill: "red"}}/>
    }
    else {
      return null
    }
  }

  const AnnotationButtons = () => {
    const theme = useTheme()
    const flagButtonStyle = correctnessType === 'flag' ? {backgroundColor: theme.palette.primary.main, color: 'white'} : {color: "black"}
    const correctButtonStyle = correctnessType === 'correct' ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: "12px"} : {color: "black", marginRight: "12px"}
    const misclassButtonStyle = correctnessType === 'misclassification' ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: "12px"} : {color: "black", marginRight: "12px"}
    return (
          <Box
          >
            <HtmlTooltip
              title={
                <React.Fragment>
                  <Typography color="inherit">{focusSelected.prediction_filter === 'very_likely_good' ? "ORES Incorrect/Revert Appropriate" : focusSelected.prediction_filter === 'very_likely_bad' ? "ORES Correct/Consensus Inappropriate" : ""}</Typography>
                </React.Fragment>
              }
            >
              <Button 
                style={correctButtonStyle}
                variant="outlined"
                onClick={(event) => handleButtonClick('correct')}
              >
                <CloseIcon 
                  style={{paddingRight: 5}}
                />
                Damaging
              </Button>
            </HtmlTooltip>
            <HtmlTooltip
              title={
                <React.Fragment>
                  <Typography color="inherit">{focusSelected.prediction_filter === 'very_likely_good' ? "ORES Correct/Revert Inappropriate" : focusSelected.prediction_filter === 'very_likely_bad' ? "ORES Incorrect/Consensus Appropriate" : ""}</Typography>
                </React.Fragment>
              }
            >
            <Button 
              style={misclassButtonStyle}
              variant="outlined"
              onClick={(event) => handleButtonClick('misclassification')}
            > 
              <CheckIcon 
                style={{paddingRight: 5}}
                />
              Not damaging
            </Button>
            </HtmlTooltip>
            <Button 
              style={flagButtonStyle}
              variant="outlined"
              onClick={(event) => handleButtonClick('flag')}
              >
              <FlagIcon 
                style={{paddingRight: 5}}
                />
              Unsure
            </Button>
            <br></br>
          </Box>
    );
  }

  const RevisionAnnotationControls = () => {
    return (
        <Box
          style={{color: "black"}}
          display="flex"
          flexDirection="row"
          alignItems="center"
        >
          <PredictionDisplay />
          <AnnotationButtons/>
          
        </Box>  
    );
  }

  const handlePreviousClick = () => {
    setButtonSuccess(null)
    if (currRevisionIdx > 0) {
      setCurrRevisionIdx(currRevisionIdx - 1)
    }
  }

  const handleNextClick = () => {
    setButtonSuccess(null)
    if (currRevisionIdx < revisions.length - 1) {
      setCurrRevisionIdx(currRevisionIdx + 1)
    }
  }

  const handlePreviousUnannotatedClick = () => {
    setButtonSuccess(null)
    let revPtr = currRevisionIdx - 1
    while (revPtr > 0) {
      if (!revisions[revPtr].correctness_type_data) {
        setCurrRevisionIdx(revPtr)
        break
      }
      revPtr--
    }
  }


  const handleNextUnannotatedClick = () => {
    setButtonSuccess(null)
    let revPtr = currRevisionIdx + 1
    while (revPtr < revisions.length) {
      if (!revisions[revPtr].correctness_type_data) {
        setCurrRevisionIdx(revPtr)
        break
      }
      revPtr++
    }
  }
  useEffect(() => {
    function isTextBox(element) {
      // source: https://stackoverflow.com/a/38795917/4146714
      // CC BY-SA 3.0
      var tagName = element.tagName.toLowerCase();
      if (tagName === 'textarea') return true;
      if (tagName !== 'input') return false;
      var type = element.getAttribute('type').toLowerCase(),
          // if any of these input types is not supported by a browser, it will behave as input type text.
          inputTypes = ['text', 'password', 'number', 'email', 'tel', 'url', 'search', 'date', 'datetime', 'datetime-local', 'time', 'month', 'week']
      return inputTypes.indexOf(type) >= 0;
    }

    // FIXME Probably should use key instead https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
    document.onkeydown = (e) => {
      const isUserInTextBox = isTextBox(document.activeElement)
      if (!isUserInTextBox) {
        if (e.keyCode === 37) {
          handlePreviousClick()
          handleLogging("User used keyboard shortcut to move to previous revision")
        }
        else if (e.keyCode === 39) {
          handleNextClick()
        }
        else if (e.keyCode === 90) {
          handlePreviousUnannotatedClick()
        }
        else if (e.keyCode === 88) {
          handleNextUnannotatedClick()
        }
      }
    }
  })

  return (
  <Box
      className={clsx(classes.root, className)}
  >
    <RevisionSummary/>
    
    {/* Sticky Box*/}
    <Box
      style={{position: "sticky", zIndex: 99, top: 0, backgroundColor: "white", paddingTop: "5px"}}
    >
      <Box 
          display="flex"
          flexDirection="row"
          alignItems="center"
          style={{marginTop: "5px"}}
      >
          <Box style={{marginRight: "8px"}}>
              <RevisionAnnotationControls/>
          </Box>
          <ButtonLoadingIcon buttonSuccess={buttonSuccess}/>

      </Box>

      <Box 
          style={{overflow: "auto", marginBottom: "5px"}}
      >
        {/* Notes */}
        <Box
            display="flex"
            flexDirection="row"
            style= {{ display: "inline-flex", float: "left"}}
        >
          <Box display="flex" style={{paddingTop: "8px"}}>
              <TextField
              multiline
              name="noteTextField"
              label="Notes" 
              value={note} 
              onChange={(event) => {
                setNote(event.target.value)
                setUnsentNoteUpdate(true)
                setTyping(true)
                setUserChangedNote(true)
                setNoteSuccess(null)
              }} 
              style={{width: "45vw"}}
              />
              <NotesLoadingIcon typing={typing} userChangedNote={userChangedNote} noteSuccess={noteSuccess}/>
          </Box>
        </Box>

        {/* Article Number & Buttons */}
        <Box
            display="flex"
            flexDirection="row"
            width="100%" 
            justify-content="space-between"
            style= {{float: "left", marginTop: "5px"}}
        >
          {currRevisionIdx === revisions.length - 1 && (
            <Box>You've reached the last revision for this set of filter criteria. Change the filters to get some new revisions.</Box>
          )}

          {/* Buttons */}
          <Box style={{display: "inline-flex", marginLeft: "auto"}}>
            {/* Previous Unannotated */}
            <Box className="text-h4"
            display="flex"
            alignItems= "center"
            justifyContent= "center"
            title="Shortcut: z"
            style={{cursor: 'pointer'}}
            >
              <Button disabled={currRevisionIdx === 0 || prevUnannotatedDisabledCount === -1} className="text-h4" onClick={(handlePreviousUnannotatedClick)}>
                <ArrowBackIosIcon style={{marginRight: "4px", color: (currRevisionIdx === 0 || prevUnannotatedDisabledCount === -1) ? "#BDBDBD" : "black"}} className="text-h4"/>Previous Unannotated
              </Button>
            </Box>

            {/* Previous */}
            <Box className="text-h4"
            display="flex"
            alignItems= "center"
            justifyContent= "center"
            title="Shortcut: <left arrow>"
            style={{marginLeft: "5px", cursor: 'pointer'}}
            >
              <Button disabled={currRevisionIdx === 0} className="text-h4" onClick={(handlePreviousClick)}>
                <ArrowBackIcon style={{marginRight: "4px", color: (currRevisionIdx === 0) ? "#BDBDBD" : "black"}} className="text-h4"/>Previous
              </Button>
            </Box>

            {/* Next */}
            <Box 
            display="flex"
            alignItems= "center"
            justifyContent= "center"
            className="text-h4" 
            title="Shortcut: <right arrow>"
            style={{marginLeft: "5px", cursor: 'pointer'}}>
              <Button disabled={currRevisionIdx === revisions.length - 1} className="text-h4" onClick={(handleNextClick)}>
                Next<ArrowForwardIcon style={{marginLeft: "4px", color: (currRevisionIdx === revisions.length - 1) ? "#BDBDBD" : "black"}} className="text-h4"/>
              </Button>
            </Box>

            {/* Next Unannotated */}
            <Box 
            display="flex"
            alignItems= "center"
            justifyContent= "center"
            className="text-h4" 
            title="Shortcut: x"
            style={{marginLeft: "5px", cursor: 'pointer'}}>
              <Button disabled={(currRevisionIdx === revisions.length - 1) || (nextUnannotatedDisabledCount === revisions.length)} className="text-h4" onClick={(handleNextUnannotatedClick)}>
                  Next Unannotated<ArrowForwardIosIcon style={{marginLeft: "4px", color: ((currRevisionIdx === revisions.length - 1) || (nextUnannotatedDisabledCount === revisions.length)) ? "#BDBDBD" : "black"}} className="text-h4"/>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>

    {/* Difference between revision accordion */}
    <Accordion 
      style={{marginTop: "10px", color: "black"}}
      defaultExpanded={true}
      expanded={accordionExpanded}
      onChange={handleAccordionExpansionToggle}
    >
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            >
            <Typography>Difference Between Revisions</Typography>
        </AccordionSummary>
    
        <Box
              //height="35vh"
              display="flex"
              flexDirection="column"
              flexWrap="nowrap"
        >
            <Box>
                <AccordionDetails>
                    <Box
                      display="flex"
                      flexDirection="column"
                    >
                        <DiffTable />
                    </Box>
                </AccordionDetails>
            </Box>
        </Box>
    </Accordion>
  </Box>

  );
};

RevisionView.propTypes = {
  className: PropTypes.string
};

export default RevisionView;
