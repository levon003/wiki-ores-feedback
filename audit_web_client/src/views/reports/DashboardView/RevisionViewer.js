import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  Popover,
  IconButton,
  makeStyles,
  Divider
} from '@material-ui/core';
import RevisionView from './RevisionView';

import HelpIcon from '@material-ui/icons/Help';

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  statusDescription: {
    margin: theme.spacing(1),
  },
}));

const RevisionViewer = ({ className, revisions, revisionFilter, minorFilter, preDefinedSelected, filteredUsernames, userTypeFilter, pageValues, linkedToValues, linkedFromValues, namespaceSelected, ...rest }) => {
  const defaultPreloadMessage = "Loading and retrieving revision data. Please wait a moment."
  
  const revisionFilterPrettyNames = {
    largeAdditions: "large additions",
    smallAdditions: "small additions",
    neutral: "near zero changes",
    smallRemovals: "small removals",
    largeRemovals: "large removals"
  }

  console.log(linkedFromValues)
  console.log(pageValues)
  console.log(linkedToValues)
  const getPageFilterSummary = () => {
    let pageSummaryString = ""
    if (pageValues.length > 0) {
      if (pageValues.length === 1) {
        pageSummaryString += "on page "
      }
      else {
        pageSummaryString += "on pages "
      }
      pageValues.forEach(element => {
        pageSummaryString += `${element.primary_text}, `
      });
    }
    if (linkedFromValues.length > 0) {
      pageSummaryString += "linked from "
      linkedFromValues.forEach(element => {
        pageSummaryString += `${element.primary_text}, `
      });
    }
    if (linkedToValues.length > 0) {
      pageSummaryString += "linked to "
      linkedToValues.forEach(element => {
        pageSummaryString += `${element.primary_text}, `
      });
    }
    return pageSummaryString
  }

  const getUserFilterSummary = () => {
    if (filteredUsernames.length > 0) {
        // For now, explicit username filters overrule everything
        // i.e. show all revisions from specified usernames, even if they wouldn't meet the filter criteria
        return "Only these users: " + filteredUsernames.join(', ');
    }
    
    const total_checked = userTypeFilter.unregistered + userTypeFilter.newcomers + userTypeFilter.learners + userTypeFilter.experienced + userTypeFilter.bots;
    if (total_checked === 0) {
        return "no users";
    } else if (userTypeFilter.unregistered && total_checked === 1) {
        return "only unregistered users";
    } else if (userTypeFilter.unregistered && userTypeFilter.bots && total_checked === 2) {
        return "all unregistered and bot users";
    } else if (total_checked === 1) {
        if (userTypeFilter.newcomers) {
            return "only newcomers";
        } else if (userTypeFilter.learners) {
            return "only learners";
        } else if (userTypeFilter.experienced) {
            return "only experienced users";
        } else if (userTypeFilter.bots) {
            return "only bots";
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
        
        const summary_string = "all " + bot_string + registered_string + "users" + exception_string;
        return summary_string;
    }
  };
  
  const getRevisionFilterSummary = () => {
    const total_checked = revisionFilter.largeAdditions + revisionFilter.smallAdditions + revisionFilter.neutral + revisionFilter.smallRemovals + revisionFilter.largeRemovals
    let summaryString = "all edit sizes"
    if (total_checked === 0) {
      summaryString = "no edit sizes selected"
    } else if (total_checked === 1 || total_checked === 2 || total_checked === 3) {
      if (revisionFilter.largeAdditions && revisionFilter.largeRemovals && total_checked === 2) {
        summaryString = "only large changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.smallRemovals && total_checked === 2) {
        summaryString = "only small changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.largeAdditions && total_checked === 2) {
        summaryString = "only additions"
      } else if (revisionFilter.largeRemovals && revisionFilter.smallRemovals && total_checked === 2) {
        summaryString = "only removals"
      } else if (total_checked === 1 || total_checked === 2) {
        summaryString = "only "
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
        summaryString = "everything except "
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
        summaryString = "everything except large additions"
      } else if (!revisionFilter.smallAdditions) {
        summaryString = "everything except small additions"
      } else if (!revisionFilter.neutral) {
        summaryString = "everything except near zero changes"
      } else if (!revisionFilter.smallRemovals) {
        summaryString = "everything except small removals"
      } else if (!revisionFilter.largeRemovals) {
        summaryString = "everything except large removals"
      }
    }
    if (minorFilter.isMinor && !minorFilter.isMajor && summaryString !== "all edit sizes") {
      if (total_checked === 1 || total_checked === 2) {
        summaryString = summaryString.slice(0, 5) + "minor " + summaryString.slice(5)
      } else {
        summaryString = summaryString.slice(0, 18) + "minor " + summaryString.slice(17)
      }
    } else if (!minorFilter.isMinor && minorFilter.isMajor && summaryString !== "all edit sizes") {
      if (total_checked === 1 || total_checked === 2) {
        summaryString = summaryString.slice(0, 5) + "major " + summaryString.slice(5)
      } else {
        summaryString = summaryString.slice(0, 18) + "major " + summaryString.slice(17)
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
    }

    return result
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
    
  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >

      <Box>
        <Box className='box'>
            <Box className="title text-h2">
                Inspect
                <IconButton className="tooltip-margin" color="#717281" style={{height:"24px", width:"24px"}} size="small" onClick={handleIconClick}>
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
                        Investigate Popover Placeholder Text
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
                      {/* todo: add correct updating text line, add number of revisions returned from the backend */}
                      [Inspecting 6.7 million {getSummary()}]
                    </Box>
                </Box>

                <Box
                  display="flex"
                  flexDirection="column"
                  style= {{ display: "inline-flex", float: "right"}}
                >
                    <Box className="text-h3 subtitle" style = {{ color: "#C7C7C7"}}>
                      [0 out of 10 annotated, 0 damaging (00.00%)]
                    </Box>
                </Box>
            </Box>


            <Divider style={{marginTop: "14px", marginBottom: "22px"}}></Divider>


            {/* revisions section */}
            <Box
              display="flex"
              flexDirection="column"
              flexWrap="nowrap"
              alignItems="center"
            >
              <Box>
                <RevisionView 
                  revisions={revisions}
                />
              </Box>
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
