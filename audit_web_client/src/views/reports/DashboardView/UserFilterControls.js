import React, { useState, useEffect, useMemo} from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import throttle from 'lodash/throttle';
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
import Typography from 'src/theme/typography';

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

  const [filteredUsernamesInputValue, setFilteredUsernamesInputValue] = useState('')
  const [filteredUsernamesOptions, setFilteredUsernamesOptions] = useState([])
  const [filteredUsernamesOpen, setFilteredUsernamesOpen] = useState(false);
  const [filteredUsernamesActiveQuery, setFilteredUsernamesActiveQuery] = useState(false);
  const filteredUsernamesLoading = filteredUsernamesOpen && filteredUsernamesActiveQuery;

  const usernameThrottledAutocompleteFetch = useMemo(
    () =>
      throttle((request, callback) => {
        setFilteredUsernamesActiveQuery(true);
        const username_autocomplete_url = '/api/autocomplete/username?query=' + encodeURI(request.input);
        fetch(username_autocomplete_url, {method: 'GET'})
          .then(res => res.json())
          .then(data => data.users)
          .then(callback);
      }, 200),
    [],
  );

  useEffect(() => {
    let active = true;

    if (filteredUsernamesInputValue === '') {
      setFilteredUsernamesOptions(filteredUsernames.length > 0 ? filteredUsernames : []);
      return undefined;
    }

    usernameThrottledAutocompleteFetch({ input: filteredUsernamesInputValue }, (results) => {
      if (active) {
        let newOptions = [];

        if (filteredUsernames.length > 0) {
          newOptions = filteredUsernames;
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setFilteredUsernamesOptions(newOptions);
        setFilteredUsernamesActiveQuery(false);
      }
    });

    return () => {
      active = false;
      setFilteredUsernamesActiveQuery(false);
    };
  }, [filteredUsernames, filteredUsernamesInputValue, usernameThrottledAutocompleteFetch]);

    
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
            id="username-filter-complete"
            open={filteredUsernamesOpen}
            onOpen={() => {
              setFilteredUsernamesOpen(true);
            }}
            onClose={() => {
              setFilteredUsernamesOpen(false);
            }}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.primary_text)}
            filterOptions={(x) => x}
            options={filteredUsernamesOptions}
            autoComplete
            includeInputInList
            filterSelectedOptions
            value={filteredUsernames}
            onChange={(event, newValues) => {
              setFilteredUsernamesOptions(newValues ? [...newValues, ...filteredUsernamesOptions] : filteredUsernamesOptions);
              setFilteredUsernames(newValues);
              // TODO call onChange with new set of filter criteria
            }}
            onInputChange={(event, newInputValue) => {
              setFilteredUsernamesInputValue(newInputValue);
            }}
            renderInput={(params) => (
              <TextField {...params} 
                label="Filter to specific users" 
                variant="outlined" 
                fullWidth 
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {filteredUsernamesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
                />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option.user_name} {...getTagProps({ index })} />
              ))
            }
            renderOption={(option) => {
              const matches = match(option.user_name, filteredUsernamesInputValue);
              const parts = parse(
                option.user_name,
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
                    {/* <Typography>{option.user_name}</Typography> */}
                  </Grid>
                </Grid>
              );
            }}
          />
          {/* <Autocomplete
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
          /> */}
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