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

  const userTypePrettyNames = {
    "newcomers": "Newcomers",
    "learners": "Learners",
    "experienced": "Experienced users",
    "bots": "Bots",
  }

  const userButtonStyle = (userTypeFilter !== DefaultFilters.defaultUserFilters || filteredUsernames.length !== 0) && preDefinedSelected === null ? {backgroundColor: theme.palette.primary.main, color: 'white'} : {}
    
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