import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  TextField,
  IconButton,
  useTheme
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import HelpIcon from '@material-ui/icons/Help'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import DefaultFilters from './DefaultFilters';

const UserFilterControls = ({userTypeFilter, setUserTypeFilter, filteredUsernames, setFilteredUsernames, userTypeAnchorEl, setUserTypeAnchorEl, useStyles, preDefinedSelected, ...rest}) => {
  const classes = useStyles();

  const theme = useTheme()

  const userButtonStyle = (userTypeFilter !== DefaultFilters.defaultUserFilters || filteredUsernames.length !== 0) && preDefinedSelected === null ? {backgroundColor: theme.palette.primary.main, color: 'white'} : {}
    
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
      if (total_checked === 0) {
          return "No users";
      } else if (userTypeFilter.unregistered && total_checked === 1) {
          return "Only unregistered users";
      } else if (userTypeFilter.unregistered && userTypeFilter.bots && total_checked === 2) {
          return "All unregistered and bot users";
      } else if (total_checked === 1) {
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
      
      if (value === 'registered') {
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
          var newState = { ...userTypeFilter, [value]: !userTypeFilter[value]};
          // check for all sub-types off
          if (newState.newcomers && newState.learners && newState.experienced && newState.bots) {
              // all sub-types true, set registered == true
              newState = { ...newState, 'registered': true};
          } else {
              // at least one sub-type is false, so ensure registered == false
              newState = { ...newState, 'registered': false};
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
      setUserTypeFilter(DefaultFilters.defaultUserFilters);
  };
    
  const open = Boolean(userTypeAnchorEl);
  const id = open ? 'simple-popover' : undefined;
    
  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="nowrap"
    >
      <Button className="text-h3" variant="outlined" style={userButtonStyle} onClick={handleClick}> User Filters <KeyboardArrowDownIcon /></Button>
      <IconButton className="tooltip-margin-last" color="#717281" size="small" onClick={handleIconClick}>
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
}

export default UserFilterControls;