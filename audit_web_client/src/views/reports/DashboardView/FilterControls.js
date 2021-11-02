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
  makeStyles
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

import RevisionFilterControls from './RevisionFilterControls';

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

const UserFilterChip = ({ className, onChange, ...rest }) => {

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
    </Box>
  );
};

const PageFilterChip = ({className, onChange, ...rest }) => {

  const classes = useStyles();

  const [values, setValues] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);

  const [open, setOpen] = useState(false);
  const [isActiveQuery, setActiveQuery] = useState(false);
  const loading = open && isActiveQuery;

  const throttledAutocompleteFetch = useMemo(
    () =>
      throttle((request, callback) => {
        setActiveQuery(true);
        const page_autocomplete_url = '/api/autocomplete/page_title?query=' + encodeURI(request.input);
        fetch(page_autocomplete_url, {method: 'GET'})
          .then(res => res.json())
          .then(data => data.options)
          .then(callback);
      }, 200),
    [],
  );

  useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions(values.length > 0 ? values : []);
      return undefined;
    }

    throttledAutocompleteFetch({ input: inputValue }, (results) => {
      if (active) {
        let newOptions = [];

        if (values.length > 0) {
          newOptions = values;
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
        setActiveQuery(false);
      }
    });

    return () => {
      active = false;
      setActiveQuery(false);
    };
  }, [values, inputValue, throttledAutocompleteFetch]);

  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  const getAutocompleteOptions = (queryString) => {
    // TODO ensure this is safe to delete
    const page_autocomplete_url = '/api/autocomplete/page_title?query=' + encodeURI(queryString);
    fetch(page_autocomplete_url, {method: 'GET'})
      .then(res => res.json())
      .then(data => {
        console.log(data.options);
        return data.options;
      });
  }

  return (
    <Autocomplete
      multiple
      id="specific-site-filter"
      style={{ width: 300 }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.primary_text)}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={values}
      onChange={(event, newValues) => {
        setOptions(newValues ? [...newValues, ...options] : options);
        setValues(newValues);
        // TODO call onChange with new set of filter criteria
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} 
          label="Specific page titles" 
          variant="outlined" 
          fullWidth 
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip label={option.primary_text} {...getTagProps({ index })} />
        ))
      }
      renderOption={(option) => {
        const matches = match(option.primary_text, inputValue);
        const parts = parse(
          option.primary_text,
          matches
        );

        return (
          <Grid container alignItems="center">
            <Grid item xs>
              {parts.map((part, index) => (
                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}

              <Typography variant="body2" color="textSecondary">
                {option.secondary_text}
              </Typography>
            </Grid>
          </Grid>
        );
      }}
    />
  );
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

  const getRevisionFilterSummary = () => {
    const total_checked = revisionFilter.largeAdditions + revisionFilter.smallAdditions + revisionFilter.neutral + revisionFilter.smallRemovals + revisionFilter.largeRemovals
    if (total_checked == 0) {
      return "No revisions selected"
    } else if (total_checked == 1 || total_checked == 2 || total_checked == 3) {
      if (revisionFilter.largeAdditions && revisionFilter.largeRemovals && total_checked == 2) {
        return "Only large changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.smallRemovals && total_checked == 2) {
        return "Only small changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.largeAdditions && total_checked == 2) {
        return "Only additions"
      } else if (revisionFilter.largeRemovals && revisionFilter.smallRemovals && total_checked == 2) {
        return "Only removals"
      } else {
        let summaryString = "Only "
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
        return summaryString
      }
    } else if (total_checked == 4) {
      if (!revisionFilter.largeAdditions) {
        return "Everything except large additions"
      } else if (!revisionFilter.smallAdditions) {
        return "Everything except small additions"
      } else if (!revisionFilter.neutral) {
        return "Everything except neutral revisions"
      } else if (!revisionFilter.smallRemovals) {
        return "Everything except small removals"
      } else if (!revisionFilter.largeRemovals) {
        return "Everything except large removals"
      }
    }
    return "Revision Filters"
  }

  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="nowrap"
    >
      <Chip clickable onClick={handleRevisionChipClick} label={getRevisionFilterSummary()} />
      <Tooltip title={
        <Box style={{whiteSpace: 'pre-line'}}>Minor edits: https://en.wikipedia.org/wiki/Help:Minor_edit</Box>
      }>
        <HelpOutlineIcon aria-label="User filter controls help" />
      </Tooltip>
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

const FilterControls = ({ className, onChange, ...rest }) => {

  const classes = useStyles();

  const [revisionAnchorEl, setRevisionAnchorEl] = useState();

  const [revisionFilter, setRevisionFilter] = useState({
    largeAdditions: true,
    smallAdditions: true,
    neutral: true,
    smallRemovals: true,
    largeRemovals: true
  })
  const [minorFilter, setMinorFilter] = useState({
    isMinor: false,
    isMajor: false
  })

  const WarningMessage = () => {
    if ((!revisionFilter.largeAdditions) && (!revisionFilter.smallAdditions) && (!revisionFilter.neutral) && (!revisionFilter.smallRemovals) && (!revisionFilter.largeRemovals)) {
    return <Box style={{color: 'red', paddingTop: 0, textAlign: 'center'}}>
      Warning: No Revision Filters Selected
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
              isMinor: false,
              isMajor: false
            })
            setRevisionAnchorEl(true)  
          }
          }
          >
          Reset to defaults
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
        >
          <PageFilterChip onChange={onChange} />
          <RevisionFilterChip onChange={onChange} revisionFilter={revisionFilter} setRevisionFilter={setRevisionFilter} minorFilter={minorFilter} setMinorFilter={setMinorFilter} revisionAnchorEl={revisionAnchorEl} setRevisionAnchorEl={setRevisionAnchorEl}/>
          <UserFilterChip onChange={onChange} />
        </Box>
        <WarningMessage>
        </WarningMessage>
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