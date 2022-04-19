import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  Popover,
  IconButton,
  makeStyles,
  Divider,
  Button
} from '@material-ui/core';
import { DrawerContext } from 'src/App';
import RevisionView from './RevisionView';

import HelpIcon from '@material-ui/icons/Help';
import { Oval } from 'react-loading-icons';

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  statusDescription: {
    margin: theme.spacing(1),
  },
}));

const RevisionViewer = ({ className, revisions, setRevisions, counts, revisionFilter, minorFilter, preDefinedSelected, filteredUsernames, userTypeFilter, pageValues, linkedToValues, linkedFromValues, namespaceSelected, currRevisionIdx, setCurrRevisionIdx, setAnnotationHistory, focusSelected, userHasAnnotatedWithinThisFilterCriteria, setUserHasAnnotatedWithinThisFilterCriteria, ...rest }) => {
  const defaultPreloadMessage = "Loading and retrieving revision data. Please wait a moment."
  // todo: this is not very efficient, but works. think of better way like useRef or something.
  const numAnnotated = revisions.filter(revision => revision.correctness_type_data != null).length
  const numDamaging = revisions.filter(revision => revision.correctness_type_data === "correct").length
  const percentDisplay = numAnnotated === 0 ? 0 : Number(numDamaging / numAnnotated * 100).toFixed(2)
  const {drawerOpen, setDrawerOpen} = useContext(DrawerContext)

  const [revisionAccordionExpanded, setRevisionAccordionExpanded] = useState(true)  // control accordion expansion in RevisionView
  
  const revisionFilterPrettyNames = {
    largeAdditions: "large additions",
    smallAdditions: "small additions",
    neutral: "near zero changes",
    smallRemovals: "small removals",
    largeRemovals: "large removals"
  }

  const getPageFilterSummaryHelper = (values, mainText, pageSummaryString) => {
    if (values.length > 0) {
      pageSummaryString += mainText
      if (values.length <= 2) {
        values.forEach(element => {
          pageSummaryString += `${element.primary_text}, `
        })
      }
      else {
        pageSummaryString += `${values[0].primary_text}, `
        pageSummaryString += `${values[1].primary_text}, `
        pageSummaryString += `and ${values.length - 2} more pages, `
      }
    }
    return pageSummaryString
  }

  const getPageFilterSummary = () => {
    let pageSummaryString = ""
    pageSummaryString = getPageFilterSummaryHelper(pageValues, "on pages ", pageSummaryString)
    pageSummaryString = getPageFilterSummaryHelper(linkedFromValues, "linked from ", pageSummaryString)
    pageSummaryString = getPageFilterSummaryHelper(linkedToValues, "linked to ", pageSummaryString)
    return pageSummaryString
  }

  const getUserFilterSummary = () => {
    if (filteredUsernames.length > 0) {
        // For now, explicit username filters overrule everything
        // i.e. show all revisions from specified usernames, even if they wouldn't meet the filter criteria
        return "with only these users: " + filteredUsernames.map(username => username.user_name).join(', ');
    }
    
    const total_checked = userTypeFilter.unregistered + userTypeFilter.newcomers + userTypeFilter.learners + userTypeFilter.experienced + userTypeFilter.bots;
    if (total_checked === 0) {
        return "with no users";
    } else if (userTypeFilter.unregistered && total_checked === 1) {
        return "with only unregistered users";
    } else if (userTypeFilter.unregistered && userTypeFilter.bots && total_checked === 2) {
        return "with all unregistered and bot users";
    } else if (total_checked === 1) {
        if (userTypeFilter.newcomers) {
            return "with only newcomers";
        } else if (userTypeFilter.learners) {
            return "with only learners";
        } else if (userTypeFilter.experienced) {
            return "with only experienced users";
        } else if (userTypeFilter.bots) {
            return "with only bots";
        }
    } else {
        var bot_string = userTypeFilter.bots ? "" : "non-bot ";
        var registered_string = userTypeFilter.unregistered ? "" : "registered "
        
        var registered_count = userTypeFilter.newcomers + userTypeFilter.learners + userTypeFilter.experienced;
        var exception_string = "";
        if (registered_count > 0 && registered_count < 3) {
            exception_string = " except";
            var first_exception = true;
            if (!userTypeFilter.newcomers) {
                exception_string += " newcomers";
                first_exception = false;
            }
            if (!userTypeFilter.learners) {
                exception_string += first_exception ? " learners" : " and learners";
                first_exception = false;
            }
            if (!userTypeFilter.experienced) {
                exception_string += first_exception ? " experienced users" : " and experienced users";
            }
        }
        
        const summary_string = "with all " + bot_string + registered_string + "users" + exception_string;
        return summary_string;
    }
  };
  
  const getRevisionFilterSummary = () => {
    const total_checked = revisionFilter.largeAdditions + revisionFilter.smallAdditions + revisionFilter.neutral + revisionFilter.smallRemovals + revisionFilter.largeRemovals
    let summaryString = "with all edit sizes"
    if (total_checked === 0) {
      summaryString = "with no edit sizes selected"
    } else if (total_checked === 1 || total_checked === 2 || total_checked === 3) {
      if (revisionFilter.largeAdditions && revisionFilter.largeRemovals && total_checked === 2) {
        summaryString = "with only large changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.smallRemovals && total_checked === 2) {
        summaryString = "with only small changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.largeAdditions && total_checked === 2) {
        summaryString = "with only additions"
      } else if (revisionFilter.largeRemovals && revisionFilter.smallRemovals && total_checked === 2) {
        summaryString = "with only removals"
      } else if (total_checked === 1 || total_checked === 2) {
        summaryString = "with only "
        let count = 0;
        for (let k in revisionFilter) {
          if (revisionFilter[k]) {
            if (count > 0) {
              summaryString += "and " + revisionFilterPrettyNames[k] + " "
            } else {
              summaryString += revisionFilterPrettyNames[k] + " "
            }
            count++
          }
        }
      } else if (total_checked === 3) {
        summaryString = "with everything except "
        let count = 0;
        for (let k in revisionFilter) {
          if (!revisionFilter[k]) {
            if (count > 0) {
              summaryString += "and " + revisionFilterPrettyNames[k] + " "
            } else {
              summaryString += revisionFilterPrettyNames[k] + " "
            }
            count++
          }
        }
      }
    } else if (total_checked === 4) {
      if (!revisionFilter.largeAdditions) {
        summaryString = "with everything except large additions"
      } else if (!revisionFilter.smallAdditions) {
        summaryString = "with everything except small additions"
      } else if (!revisionFilter.neutral) {
        summaryString = "with everything except near zero changes"
      } else if (!revisionFilter.smallRemovals) {
        summaryString = "with everything except small removals"
      } else if (!revisionFilter.largeRemovals) {
        summaryString = "with everything except large removals"
      }
    }
    if (minorFilter.isMinor && !minorFilter.isMajor && summaryString !== "all edit sizes") {
      if (total_checked === 1 || total_checked === 2) {
        summaryString = summaryString.slice(0, 10) + "minor " + summaryString.slice(10)
      } else {
        summaryString = summaryString.slice(0, 23) + "minor " + summaryString.slice(22)
      }
    } else if (!minorFilter.isMinor && minorFilter.isMajor && summaryString !== "all edit sizes") {
      if (total_checked === 1 || total_checked === 2) {
        summaryString = summaryString.slice(0, 10) + "major " + summaryString.slice(10)
      } else {
        summaryString = summaryString.slice(0, 23) + "major " + summaryString.slice(22)
      }
    }
    return summaryString
  }
  
  const getSummary = () => {
    let result = "";
    if (preDefinedSelected === 1) {
      result = "non-bot article edits"
    }
    else if (preDefinedSelected === 2) {
      result = "newcomer edits"
    }
    else if (preDefinedSelected === 3) {
      result = "LGBT History edits"
    }
    else {
      result = "edits " + getPageFilterSummary() + getRevisionFilterSummary() + ", " + getUserFilterSummary()
      // result = `edits${pageValues.length === 0 ? "," : ` ${getPageFilterSummary()}`} ${getRevisionFilterSummary()}, ${getUserFilterSummary()}`
    }

    return result
  }
  var ranges = [
    { divider: 1e18 , suffix: 'E' },
    { divider: 1e15 , suffix: 'P' },
    { divider: 1e12 , suffix: 'T' },
    { divider: 1e9 , suffix: 'G' },
    { divider: 1e6 , suffix: 'M' },
    { divider: 1e3 , suffix: 'k' }
  ];

  const formatNumber = (n) => {
    for (var i = 0; i < ranges.length; i++) {
      if (n >= ranges[i].divider) {
        return (n / ranges[i].divider).toFixed(1).toString() + ranges[i].suffix;
      }
    }
    return n.toString();
  }

  const suffixDict = {
    "1": "st",
    "2": "nd",
    "3": "rd",
  }
  const formatIndex = (idx) => {
    const string = idx.toString()
    const lastChar = string.slice(-1)
    const secondToLastChar = string.slice(-2)[0]
    let res = string
    if (lastChar in suffixDict && !(secondToLastChar === "1")) {
      res += suffixDict[lastChar]
    }
    else {
      res += "th"
    }
    return res
  }

  const classes = useStyles();
  const [displayLimit, /*setDisplayLimit*/] = useState(20);  // TODO Probably want to remember this as a user setting
  const [statusDescription, setStatusDescription] = useState(defaultPreloadMessage);

  // Want state to track total available at multiple levels. Probably want to store it one state dictionary, since each should change only "one at a time"...
  const [prefilteredTotal, /*setPrefilteredTotal*/] = useState(0);
    
  useEffect(() => {
    // TODO Actually retrieve a set of revisions here by querying the backend
    // JK, we're actually doing this in index and passing them in.  
    // Perhaps the expected behavior is to move loading status into the index, and just include a rev count in this component.
    setStatusDescription('Loaded revisions; change filters or use page controls to see more.')
  }, []);

  const [investigateControlsPopup, setInvestigateControlsPopup] = useState();

  const investigateControlsOpen = Boolean(investigateControlsPopup);
  const investigateID = investigateControlsOpen ? 'simple-popover' : undefined;

  const handleIconClick = (event) => {
    setInvestigateControlsPopup(event.currentTarget)
  }

  const handleIconClickClose = () => {
    setInvestigateControlsPopup(null)
  }
  
  const getInvestigatingText = () => {
    if (counts?.all?.all) {
      return "Inspecting " + formatIndex(currRevisionIdx + 1) + " of " + formatNumber(counts?.all?.all) + " " + getSummary()
    }
    return "Loading..."
  }

  return (
    <Card
      className={clsx(classes.root, className)}
      style={{'overflow': 'visible'} /*
        We set "overflow: visible" here because the Card component's default CSS class (.MuiCard-root) sets "overflow: hidden", which borks internal sticky components.
        Here's a blogpost describing some of the issues and a potential workaround: https://uxdesign.cc/position-stuck-96c9f55d9526
        Fortunately, we can just override this default and force this card to use "overflow: visible" (the default) so that "position: sticky" can still work in child components.
      */}
      {...rest}
    >
      <Box>
        <Box className='box'>

            <Box className="title text-h2">
                Inspect
                <IconButton className="tooltip-margin" style={{color:"#717281", height:"24px", width:"24px"}} size="small" onClick={handleIconClick}>
                    <HelpIcon style={{height:"20px"}}/>
                </IconButton>
                <Popover
                    id={investigateID}
                    open={investigateControlsOpen}
                    anchorEl={investigateControlsPopup}
                    onClose={handleIconClickClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    >
                    <p style={{margin: 5, fontSize: 12}}>
                        Inspect Popover Placeholder Text
                    </p>
                </Popover>
            </Box>

            {/* top text section */}
            <Box style= {{ overflow: "auto"}}>
                <Box
                    display="flex"
                    flexDirection="column"
                    style= {{ display: "inline-flex", float: "left"}}
                  >
                    <Box className="text-h3 subtitle">
                      {getInvestigatingText()}
                    </Box>
                </Box>

                <Box
                  display="flex"
                  flexDirection="column"
                  style= {{ display: "inline-flex", float: "right"}}
                >
                    <Box className="text-h3 subtitle">
                      {/* {numAnnotated} out of {revisions.length} annotated, {numDamaging} damaging ({percentDisplay}%) */}
                      <Button onClick={() => setDrawerOpen(true)}>View annotation history</Button>
                    </Box>
                </Box>
            </Box>


            <Divider style={{marginTop: "14px", marginBottom: "22px"}}></Divider>


            {/* revisions section */}
            <Box
              style={{ color:"black" }}
              display="flex"
              flexDirection="column"
              flexWrap="nowrap"
              alignItems="center"
            >
             {revisions.length !== 0 && Object.keys(counts).length !== 0 ? ( 
             <Box>
               {/* Set the key to force an unmount when currRevisionIdx changes: https://stackoverflow.com/questions/71684884/avoiding-stale-state-in-double-useeffect */}
                <RevisionView 
                  key={revisions[currRevisionIdx].rev_id}
                  revisions={revisions}
                  setRevisions={setRevisions}
                  currRevisionIdx={currRevisionIdx}
                  setCurrRevisionIdx={setCurrRevisionIdx}
                  accordionExpanded={revisionAccordionExpanded}
                  setAccordionExpanded={setRevisionAccordionExpanded}
                  filter_summary={getSummary()}
                  revisionFilter={revisionFilter}
                  minorFilter={minorFilter}
                  preDefinedSelected={preDefinedSelected}
                  filteredUsernames={filteredUsernames}
                  userTypeFilter={userTypeFilter}
                  namespaceSelected={namespaceSelected}
                  pageValues={pageValues}
                  linkedFromValues={linkedFromValues}
                  linkedToValues={linkedToValues}
                  focusSelected={focusSelected}
                  setAnnotationHistory={setAnnotationHistory}
                  userHasAnnotatedWithinThisFilterCriteria={userHasAnnotatedWithinThisFilterCriteria}
                  setUserHasAnnotatedWithinThisFilterCriteria={setUserHasAnnotatedWithinThisFilterCriteria}
                />
              </Box>
              ) : <Oval stroke="#000000"/>
             }
            </Box>
             

        </Box>

      </Box>
    </Card>
  );
};

RevisionViewer.propTypes = {
  className: PropTypes.string
};

export default RevisionViewer;
