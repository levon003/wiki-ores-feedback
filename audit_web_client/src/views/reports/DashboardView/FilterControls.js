import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import Grid from '@material-ui/core/Grid';

import CircularProgress from '@material-ui/core/CircularProgress';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import throttle from 'lodash/throttle';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Paper,
  Popover,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
  IconButton,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

import RevisionFilterControls from './RevisionFilterControls';
import PageFilterControls from './PageFilterControls';

import HelpIcon from '@material-ui/icons/Help'

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

const userTypeOptions = [
  { key: 'all', desc: 'All users', },
  { key: 'unregistered', desc: 'Unregistered users', },
  { key: 'registered', desc: 'Registered users', },
  { key: 'newcomers', desc: 'Newcomers', },
  { key: 'learners', desc: 'Learners', },
  { key: 'experienced', desc: "Experienced users", },
  { key: 'bots', desc: 'Bots', },
];

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  nestedList: {
    paddingLeft: theme.spacing(4),
  },

}));

const UserFilterChip = ({ className, onChange, userTypeFilter, setUserTypeFilter, filteredUsernames, setFilteredUsernames, userTypeAnchorEl, setUserTypeAnchorEl,...rest }) => {

  const classes = useStyles();
    
  const userTypePrettyNames = {
      "newcomers": "Newcomers",
      "learners": "Learners",
      "experienced": "Experienced users",
      "bots": "Bots",
  }
  
  const getUserFilterSummary = () => {
      if (filteredUsernames.length > 0) {
          // For now, explicit username filters overrule everything
          // i.e. show all revisions from specified usernames, even if they wouldn't meet the filter criteria
          return "Only these users: " + filteredUsernames.join(', ');
      }
      
      const total_checked = userTypeFilter.unregistered + userTypeFilter.newcomers + userTypeFilter.learners + userTypeFilter.experienced + userTypeFilter.bots;
      if (total_checked == 0) {
          return "No users";
      } else if (userTypeFilter.unregistered && total_checked == 1) {
          return "Only unregistered users";
      } else if (userTypeFilter.unregistered && userTypeFilter.bots && total_checked == 2) {
          return "All unregistered and bot users";
      } else if (total_checked == 1) {
          if (userTypeFilter.newcomers) {
              return "Only newcomers";
          } else if (userTypeFilter.learners) {
              return "Only learners";
          } else if (userTypeFilter.experienced) {
              return "Only experienced users";
          } else if (userTypeFilter.bots) {
              return "Only bots";
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
          
          const summary_string = "All " + bot_string + registered_string + "users" + exception_string;
          return summary_string;
      }
  };
    
  const handleToggle = (value) => () => {
      // TODO call onChange() with the new state;
      
      if (value == 'registered') {
          if (userTypeFilter.registered) {
              // registered turning off, so deactivate all subs
              setUserTypeFilter({
                  unregistered: userTypeFilter.unregistered,
                  registered: false,
                  newcomers: false,
                  learners: false,
                  experienced: false,
                  bots: false
              });
          } else {
              //registered turning on, so activate all subs
              setUserTypeFilter({
                  unregistered: userTypeFilter.unregistered,
                  registered: true,
                  newcomers: true,
                  learners: true,
                  experienced: true,
                  bots: true
              });
          }
      } else {
          // toggle the value
          var newState = { ... userTypeFilter, [value]: !userTypeFilter[value]};
          // check for all sub-types off
          if (newState.newcomers && newState.learners && newState.experienced && newState.bots) {
              // all sub-types true, set registered == true
              newState = { ... newState, 'registered': true};
          } else {
              // at least one sub-type is false, so ensure registered == false
              newState = { ... newState, 'registered': false};
          }
          setUserTypeFilter(newState);
      }
  };
    
  const handleClick = (event) => {
    setUserTypeAnchorEl(event.currentTarget);
  };
    
  const handleClose = (event) => {
    setUserTypeAnchorEl(null);
  };

  const [pageHelpPopup, setPageHelpPopup] = useState();

  const pageHelpOpen = Boolean(pageHelpPopup);
  const helpID = pageHelpOpen ? 'simple-popover' : undefined;

  const handleIconClick = (event) => {
    setPageHelpPopup(event.currentTarget)
  }

  const handleIconClickClose = () => {
    setPageHelpPopup(null)
  }
    
  const handleUsernameFilterChange = (event, value, reason) => {
      setFilteredUsernames(value);
  };
    
  const handleUserFilterReset = (event) => {
      setFilteredUsernames([]);
      setUserTypeFilter({
          unregistered: true,
          registered: false,
          newcomers: true,
          learners: true,
          experienced: true,
          bots: false,
      });
  };
    
  const open = Boolean(userTypeAnchorEl);
  const id = open ? 'simple-popover' : undefined;
    
  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="nowrap"
    >
      <Chip clickable onClick={handleClick} label={getUserFilterSummary()} />
      <IconButton color="primary" size="small" onClick={handleIconClick}>
        <HelpIcon/>
      </IconButton>
      <Popover
      id={helpID}
      open={pageHelpOpen}
      anchorEl={pageHelpPopup}
        onClose={handleIconClickClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}>
        <p style={{margin: 5, fontSize: 12}}>User Filters Popup Placeholder</p>
        {/* TODO: add something here */}
    </Popover>
      <Popover
        id={id}
        open={open}
        anchorEl={userTypeAnchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Paper variant='elevation'>
          <List
            component="nav"
            aria-labelledby="user-type-list-subheader"
            subheader={
              <ListItem>
                <ListItemText component="div" id="user-type-list-subheader">
                  Filter by User Type
                </ListItemText>
              </ListItem>
            }
            className={classes.root}
          >
            <ListItem key="unregistered" role={undefined} dense button onClick={handleToggle("unregistered")}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={userTypeFilter.unregistered}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': 'user-type-unregistered-desc' }}
                />
              </ListItemIcon>
              <ListItemText id="user-type-unregistered-desc" primary="Unregistered" />
            </ListItem>
            <ListItem key="registered" role={undefined} dense button onClick={handleToggle("registered")}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={userTypeFilter.registered}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': 'user-type-registered-desc' }}
                />
              </ListItemIcon>
              <ListItemText id="user-type-registered-desc" primary="Registered" />
            </ListItem>
            <List component="div" disablePadding>
              {['newcomers', 'learners', 'experienced', 'bots'].map((value) => {
                  
                return (
                  <ListItem key={value} role={undefined} dense button onClick={handleToggle(value)} className={classes.nestedList}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={userTypeFilter[value]}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ 'aria-labelledby': "user-type-" + value + "-desc" }}
                      />
                    </ListItemIcon>
                    <ListItemText id={"user-type-" + value + "-desc"} primary={userTypePrettyNames[value]} />
                  </ListItem>
                );
              })}
              
            </List>
          </List>
          <Autocomplete
            multiple
            freeSolo
            id="username-filter-autocomplete"
            onChange={handleUsernameFilterChange}
            options={filteredUsernames}
            value={filteredUsernames}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Filter to specific users"
              />
            )}
          />
          <Button
            onClick={handleUserFilterReset}
          >
          Reset to default
          </Button>
        </Paper>
      </Popover>
    </Box>
  );
};

const PageFilterChip = ({className, onChange, pageValues, setPageValues, namespaceSelected, setNameSpaceSelected, linkedToValues, setLinkedToValues, linkedFromValues, setLinkedFromValues, pageAnchorEl, setPageAnchorEl, ...rest }) => {
  const classes = useStyles();

  return <PageFilterControls pageValues={pageValues} setPageValues={setPageValues} namespaceSelected={namespaceSelected} setNameSpaceSelected={setNameSpaceSelected} linkedToValues={linkedToValues} setLinkedToValues={setLinkedToValues} linkedFromValues={linkedFromValues} setLinkedFromValues={setLinkedFromValues} pageAnchorEl={pageAnchorEl} setPageAnchorEl={setPageAnchorEl} />
  
};

const RevisionFilterChip = ({className, onChange, revisionFilter, setRevisionFilter, minorFilter, setMinorFilter, revisionAnchorEl, setRevisionAnchorEl, ...rest}) => {

  const classes = useStyles(); //remove?
  
  const revisionFilterPrettyNames = {
    largeAdditions: "large additions",
    smallAdditions: "small additions",
    neutral: "near zero changes",
    smallRemovals: "small removals",
    largeRemovals: "large removals"
  }

  const open = Boolean(revisionAnchorEl);
  const id = open ? 'simple-popover' : undefined;

  const handleRevisionChipClick = (event) => {
    setRevisionAnchorEl(event.currentTarget);
  };
    
  const handleRevisionPopoverClose = (event) => {
    setRevisionAnchorEl(null);
  };

  const [pageHelpPopup, setPageHelpPopup] = useState();

  const pageHelpOpen = Boolean(pageHelpPopup);
  const helpID = pageHelpOpen ? 'simple-popover' : undefined;

  const handleIconClick = (event) => {
    setPageHelpPopup(event.currentTarget)
  }

  const handleIconClickClose = () => {
    setPageHelpPopup(null)
  }

  const getRevisionFilterSummary = () => {
    const total_checked = revisionFilter.largeAdditions + revisionFilter.smallAdditions + revisionFilter.neutral + revisionFilter.smallRemovals + revisionFilter.largeRemovals
    let summaryString = "Revision Filters"
    if (total_checked == 0) {
      summaryString = "No revisions selected"
    } else if (total_checked == 1 || total_checked == 2 || total_checked == 3) {
      if (revisionFilter.largeAdditions && revisionFilter.largeRemovals && total_checked == 2) {
        summaryString = "Only large changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.smallRemovals && total_checked == 2) {
        summaryString = "Only small changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.largeAdditions && total_checked == 2) {
        summaryString = "Only additions"
      } else if (revisionFilter.largeRemovals && revisionFilter.smallRemovals && total_checked == 2) {
        summaryString = "Only removals"
      } else if (total_checked == 1 || total_checked == 2) {
        summaryString = "Only "
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
      } else if (total_checked == 3) {
        summaryString = "Everything except "
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
    } else if (total_checked == 4) {
      if (!revisionFilter.largeAdditions) {
        summaryString = "Everything except large additions"
      } else if (!revisionFilter.smallAdditions) {
        summaryString = "Everything except small additions"
      } else if (!revisionFilter.neutral) {
        summaryString = "Everything except near zero changes"
      } else if (!revisionFilter.smallRemovals) {
        summaryString = "Everything except small removals"
      } else if (!revisionFilter.largeRemovals) {
        summaryString = "Everything except large removals"
      }
    }
    if (minorFilter.isMinor && !minorFilter.isMajor && summaryString != "Revision Filters") {
      if (total_checked == 1 || total_checked == 2) {
        summaryString = summaryString.slice(0, 5) + "minor " + summaryString.slice(5)
      } else {
        summaryString = summaryString.slice(0, 18) + "minor " + summaryString.slice(17)
      }
    } else if (!minorFilter.isMinor && minorFilter.isMajor && summaryString != "Revision Filters") {
      if (total_checked == 1 || total_checked == 2) {
        summaryString = summaryString.slice(0, 5) + "major " + summaryString.slice(5)
      } else {
        summaryString = summaryString.slice(0, 18) + "major " + summaryString.slice(17)
      }
    }
    return summaryString
  }

  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="nowrap"
    >
      <Chip clickable onClick={handleRevisionChipClick} label={getRevisionFilterSummary()} />
      <IconButton color="primary" size="small" onClick={handleIconClick}>
      <HelpIcon/>
      </IconButton>
      <Popover
        id={helpID}
        open={pageHelpOpen}
        anchorEl={pageHelpPopup}
          onClose={handleIconClickClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}>
          <p style={{margin: 5, fontSize: 12}}><a href="https://en.wikipedia.org/wiki/Help:Minor_edit" target="_blank">Minor Edit Definition</a></p>
          {/* TODO: add something here */}
      </Popover>
      <Popover
        id={id}
        open={open}
        anchorEl={revisionAnchorEl}
        onClose={handleRevisionPopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >

        <RevisionFilterControls onChange={onChange} revisionFilter={revisionFilter} setRevisionFilter={setRevisionFilter} minorFilter={minorFilter} setMinorFilter={setMinorFilter}/>
      </Popover>
    </Box>
  );
};

const FilterControls = ({ className, onChange, revisionFilter, setRevisionFilter, minorFilter, 
  setMinorFilter, userTypeFilter, setUserTypeFilter, filteredUsernames, setFilteredUsernames, pageValues, setPageValues, namespaceSelected, setNameSpaceSelected, linkedToValues, setLinkedToValues, linkedFromValues, setLinkedFromValues, ...rest }) => {

  const classes = useStyles();

  const [revisionAnchorEl, setRevisionAnchorEl] = useState();
  const [userTypeAnchorEl, setUserTypeAnchorEl] = useState();
  const [pageAnchorEl, setPageAnchorEl] = useState();

  const WarningMessage = () => {
    if (((!revisionFilter.largeAdditions) && (!revisionFilter.smallAdditions) && (!revisionFilter.neutral) && (!revisionFilter.smallRemovals) && (!revisionFilter.largeRemovals)) || ((!minorFilter.isMinor) && (!minorFilter.isMajor))) {
      return <Box style={{color: 'red', paddingTop: 0, textAlign: 'center'}}>
        Warning: Current revision filter selection will not yield any results.
          <Button
            onClick={ () => {
              setRevisionFilter ({
                largeAdditions: true,
                smallAdditions: true,
                neutral: true,
                smallRemovals: true,
                largeRemovals: true,
              }  
              )  
              setMinorFilter({
                isMinor: true,
                isMajor: true
              })
              setRevisionAnchorEl(true)  
            }
            }
            >
            Reset to default
          </Button>
        </Box>
    }
    else if ((!userTypeFilter.unregistered) && (!userTypeFilter.registered) && (!userTypeFilter.newcomers) && (!userTypeFilter.learners) && (!userTypeFilter.experienced) && (!userTypeFilter.bots)) {
      return <Box style={{color: 'red', paddingTop: 0, textAlign: 'center'}}>
      Warning: No User Filters Selected
        <Button
          onClick={ () => {
            setFilteredUsernames([]);
            setUserTypeFilter({
                unregistered: true,
                registered: false,
                newcomers: true,
                learners: true,
                experienced: true,
                bots: false,
            });
            setUserTypeAnchorEl(true)
          }
          }
          >
          Reset to default
        </Button>
      </Box>
      
    }
    // TODO: this works if index.js namespaces are all set to false
    // delete?
    // else if ((!namespaces[0].selected) && (!namespaces[1].selected) && (!namespaces[2].selected) && (!namespaces[3].selected) && (!namespaces[4].selected) && (!namespaces[5].selected) && (!namespaces[6].selected) && (!namespaces[7].selected) && (!namespaces[8].selected) && (!namespaces[9].selected) && (!namespaces[10].selected) && (!namespaces[11].selected) && (!namespaces[12].selected) && (!namespaces[13].selected) && (!namespaces[14].selected) && (!namespaces[15].selected))

    // only need to check if any namespaces are selected
    else if (namespaceSelected.length === 0) {
      return <Box style={{color: 'red', paddingTop: 0, textAlign: 'center'}}>
      Warning: No Page Filters Selected
        <Button
          onClick={ () => {
          setNameSpaceSelected([{namespace: "Main/Article - 0"}]); 
          setPageAnchorEl(true)
          }
          }
          >
          Reset to default
        </Button>
      </Box>  
    }
    else {
      return null
    }
  }

  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
      <Box
        height="20vh"
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
      >
        <Box
          display="flex"
          flexDirection="row"
          style= {{ paddingTop : 10, paddingLeft : 10}}
        >
          <PageFilterChip onChange={onChange} 
              pageValues={pageValues}
              setPageValues={setPageValues}
              namespaceSelected={namespaceSelected}
              setNameSpaceSelected={setNameSpaceSelected}
              linkedToValues={linkedToValues}
              setLinkedToValues={setLinkedToValues}
              linkedFromValues={linkedFromValues}
              setLinkedFromValues={setLinkedFromValues}
              pageAnchorEl={pageAnchorEl}
              setPageAnchorEl={setPageAnchorEl}
          />
          <RevisionFilterChip onChange={onChange} 
            revisionFilter={revisionFilter} 
            setRevisionFilter={setRevisionFilter} 
            minorFilter={minorFilter} 
            setMinorFilter={setMinorFilter} 
            revisionAnchorEl={revisionAnchorEl} 
            setRevisionAnchorEl={setRevisionAnchorEl}
          />

          <UserFilterChip 
            onChange={onChange} 
            userTypeFilter={userTypeFilter} 
            setUserTypeFilter={setUserTypeFilter} 
            filteredUsernames={filteredUsernames} 
            setFilteredUsernames={setFilteredUsernames}
            userTypeAnchorEl={userTypeAnchorEl}
            setUserTypeAnchorEl={setUserTypeAnchorEl}
          />
        </Box>
        <WarningMessage />
      </Box>
    </Card>
  );
};

FilterControls.propTypes = {
  className: PropTypes.string
};

export default FilterControls;

// highlight box if that box is selected etc
// click twice --> unclick, click another that is selected 
// 1. set the values
// 2. show the visual effects 
// 3. 