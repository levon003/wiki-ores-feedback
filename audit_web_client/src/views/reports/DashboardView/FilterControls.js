import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Collapse,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  makeStyles
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

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

const FilterControls = ({ className, ...rest }) => {

  const classes = useStyles();
    
  const [userTypeAnchorEl, setUserTypeAnchorEl] = useState();
    
  const userTypePrettyNames = {
      "newcomers": "Newcomers",
      "learners": "Learners",
      "experienced": "Experienced users",
      "bots": "Bots",
  }
  const [userTypeFilter, setUserTypeFilter] = useState({
      unregistered: true,
      registered: false,
      newcomers: true,
      learners: true,
      experienced: true,
      bots: false
  });
  const [filteredUsernames, setFilteredUsernames] = useState([]);
  
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
        >
          <Box
            display="flex"
            flexDirection="row"
            flexWrap="nowrap"
          >
            <Chip clickable onClick={handleClick} label={getUserFilterSummary()} />
            <Tooltip title="Help tooltip for the user filter controls goes here.">
              <HelpOutlineIcon aria-label="User filter controls help" />
            </Tooltip>
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
                    <ListSubheader component="div" id="user-type-list-subheader">
                      Filter users by type
                    </ListSubheader>
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
                Reset to defaults
                </Button>
              </Paper>
            </Popover>
                <Autocomplete
                  multiple
                  id="user-type-checkboxes"
                  options={userTypeOptions}
                  disableCloseOnSelect
                  getOptionLabel={(option) => option.desc}
                  renderOption={(option, { selected }) => (
                    <React.Fragment>
                      <Checkbox
                        icon={checkboxIcon}
                        checkedIcon={checkboxCheckedIcon}
                        style={{ marginRight: 6 }}
                        checked={selected}
                      />
                      {option.desc}
                    </React.Fragment>
                  )}
                  style={{ width: 500 }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" label="Filter view with checkboxes" placeholder="" />
                  )}
                />
            
            
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

FilterControls.propTypes = {
  className: PropTypes.string
};

export default FilterControls;
