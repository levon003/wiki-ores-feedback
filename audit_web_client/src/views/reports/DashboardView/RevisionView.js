import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Link,
  Card,
  Typography,
  TextField,
  useTheme
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import "../../../../src/style.css"
import moment from 'moment';
import { LoadingContext } from 'src/App';
import FlagIcon from '@material-ui/icons/Flag';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import { Oval } from 'react-loading-icons'

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

const NotesIcon = ({ typing, firstTyped, noteSuccess }) => {
  if (typing) {
    return <Oval stroke="#000000" style={{height: 20, width: 20, marginTop: 20, marginLeft: 5}}/>
  } else if (!typing && firstTyped && noteSuccess) {
    return <CheckIcon style={{fill: "green", marginTop: 20, marginLeft: 5}}/>
  } else if (!typing && firstTyped && !noteSuccess) {
    return <CloseIcon style={{fill: "red", marginTop: 20, marginLeft: 5}}/>
  } else {
    return null
  }
}

// gonna keep this here for now, maybe move it later
// Box can inherit global styles, easier to change styles
const ErrorNotification = ({ errorMessage }) => {
  return <Box className="text-h3" style={{color: 'red', fontWeight: "normal"}}>{errorMessage}</Box>
}

const RevisionView = ({ revisions, className, ...rest }) => {
  const [ currRevisionIdx, setCurrRevisionIdx ] = useState(0)
  const revision = revisions[currRevisionIdx]
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
  const [annotationData, setAnnotationData] = useState({
    'correctness_type': null,
    'note': null,
  });
  const [ note, setNote ] = useState("")
  const [ noteSuccess, setNoteSuccess ] = useState(null)
  const [typing, setTyping ] = useState(false)
  const [ firstTyped, setFirstTyped ] = useState(false)
  const [errorMessage, setErrorMessage ] = useState(null)
  const { /*loading,*/ setLoading } = useContext(LoadingContext)
  
  // this is for setting the typing state of the note field
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTyping(false)
    }, 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [note])
  
  useEffect(() => {
    if (!typing && firstTyped) {
      handleNoteSave()
    }
  })
  
  const handleAccordionExpansionToggle = (event, isExpanded) => {
    setExpanded(!expanded);
  }
  
  const handleButtonClick = (button_type) => {
    const correctness_type = button_type === annotationData.correctness_type ? null : button_type;
    // TODO setting the state value allows the visuals to update instantly... but can result in confusing state changes if many requests are made in quick succession.
    // What should be done here? One option would be to make THIS change; but block further updates until this POST request is fully resolved. How might we do that?
    // Note the above strategy would be inappropriate for the note; one will need other approaches.
    setLoading(true)
    
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
      setLoading(false)
      setErrorMessage(null)
      // update the annotations with the new data (if it was not rejected)
        // TODO what if this would change the annotation data?  The user might have scrolled away, not noticing 
        // that their annotation change was rejected. Should we notify the user in some way?
        setAnnotationData({
          'correctness_type': data.correctness_type,
          'note': data.note,
        })
        setNote(data.note)
      }).catch(data => {
        setLoading(false)
        setErrorMessage("Didn't go through, please try again.")
      });
    }
    
    const handleNoteSave = () => {
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
      setNoteSuccess(true)
      setNote(data.note)
    })
    .catch(data => {
      setNoteSuccess(false)
    })
  }
  

  const getUserLink = (user_text, user_id) => {
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

    fetch('/api/annotation/?rev_id=' + revision.rev_id.toString(), {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
                'Origin': 'https://ores-inspect.toolforge.org'
                },
    })
      .then(res => res.json())
      .then(data => {
        // this is causing button to automatically be set to misclassification?
        setAnnotationData({
          'correctness_type': data.correctness_type,
          'note': data.note,
        })
        setNote(data.note)
    });
  }, [revision]);

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

  const InlineDescription = () => {
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

  const getBytesDeltaDescriptor = () => {
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

  const RevisionSummary = () => {
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
      <div className ={PredColor()}>
        <div>{pred.toString()}</div>
    </div>
    );
  }

  const AnnotationButtons = () => {
    const theme = useTheme()
    const flagButtonStyle = annotationData.correctness_type === 'flag' ? {backgroundColor: theme.palette.primary.main, color: 'white'} : {}
    const correctButtonStyle = annotationData.correctness_type === 'correct' ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: "12p"} : {marginRight: "12px"}
    const misclassButtonStyle = annotationData.correctness_type === 'misclassification' ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: "12p"} : {marginRight: "12px"}
    return (
      <Box 
      display="flex"
      flexDirection="column"
      style={{marginBottom: "10px"}}>
          <Box>
            <Button 
              style={correctButtonStyle}
              variant="outlined"
              onClick={(event) => handleButtonClick('correct')}
            >
              <CheckIcon 
                style={{paddingRight: 5}}
              />
              Confirm damaging
            </Button>
            <Button 
              style={misclassButtonStyle}
              variant="outlined"
              onClick={(event) => handleButtonClick('misclassification')}
            >
              <CloseIcon 
                style={{paddingRight: 5}}
              />
              Not damaging
            </Button>
            <Button 
              style={flagButtonStyle}
              variant="outlined"
              onClick={(event) => handleButtonClick('flag')}
            >
              <FlagIcon 
                style={{paddingRight: 5}}
              />
              Flag
            </Button>
            <br></br>
          </Box>

      </Box>
    );
  }

  const RevisionAnnotationControls = () => {
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
  <Box
      className={clsx(classes.root, className)}
      {...rest}
  >
    <Box>
        <RevisionSummary/>
        
        <Box 
            display="flex"
            flexDirection="row"
            style={{paddingTop: "25px"}}
        >
            <Box style={{paddingRight: "12px"}}>
                <RevisionAnnotationControls/>
            </Box>
            <ErrorNotification errorMessage={errorMessage}/>

        </Box>

        <Box 
            style={{overflow: "auto", marginBottom: "10px"}}
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
                  label="Notes" 
                  value={note} 
                  onChange={(event) => {
                    setNote(event.target.value)
                    setTyping(true)
                    setFirstTyped(true)
                  }} 
                  style={{width: "50vw"}}
                  />
                    <NotesIcon typing={typing} firstTyped={firstTyped} noteSuccess={noteSuccess}/>
              </Box>
          </Box>

          
          <Box
                display="flex"
                flexDirection="row"
                style= {{ display: "inline-flex", float: "right", marginTop: "1.9em"}}
            >
                  <Box style={{display: "inline-flex", float: "left"}}>
                    {/* _ of _ */}
                    <Box
                      display="flex"
                      alignItems= "center"
                      justifyContent = "center"
                      className="text-h4" 
                      style={{marginRight: "1vw"}}
                    >
                      ARTICLE: {currRevisionIdx + 1} OF {revisions.length}
                    </Box>
                  </Box>

                  {/* Previous/next */}
                  <Box style={{display: "inline-flex", float: "right"}}>
                    {/* Previous */}
                    <Box className="text-h4"
                    display="flex"
                    alignItems= "center"
                    justifyContent= "center"
                    style={{cursor: 'pointer'}}
                    >
                      <Button className="text-h4" onClick={() => {
                      if (currRevisionIdx > 0) {
                        setCurrRevisionIdx(currRevisionIdx - 1)
                      }
                      }}><ArrowBackIcon style={{marginRight: "4px"}} className="text-h4"/>Previous</Button>
                    </Box>

                    {/* Next */}
                    <Box 
                    display="flex"
                    alignItems= "center"
                    justifyContent= "center"
                    className="text-h4" 
                    style={{marginLeft: "5px", cursor: 'pointer'}}>
                      <Button className="text-h4" onClick={() => {
                        if (currRevisionIdx < revisions.length - 1) {
                          setCurrRevisionIdx(currRevisionIdx + 1)
                        }
                      }
                    }>Next<ArrowForwardIcon style={{marginLeft: "4px"}} className="text-h4"/></Button>
                    </Box>
                  </Box>

            </Box>

        </Box>

        {/* Difference between revision accordion */}

        <Accordion style={{marginTop: "10px"}}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                >
                <Typography>Difference Between Revisions</Typography>
            </AccordionSummary>
        
            <Box
                // todo: change height to size where we can still see buttons
                  height="35vh"
                  display="flex"
                  flexDirection="column"
                  flexWrap="nowrap"
            >
                <Box style={{'overflowY': 'scroll'}}>
                    <AccordionDetails>
                        <Box
                          display="flex"
                          flexDirection="column"
                        >
                            <DiffTable />
                            {/* <Button
                              onClick={handleAccordionExpansionToggle}
                            >
                                <ExpandLessIcon /> Collapse difference between revisions <ExpandLessIcon />
                            </Button> */}
                        </Box>
                    </AccordionDetails>
                </Box>
            </Box>
        </Accordion>
                
    </Box>
  </Box>

  );
};

RevisionView.propTypes = {
  className: PropTypes.string
};

export default RevisionView;
