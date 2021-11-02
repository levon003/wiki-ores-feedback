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
import CheckBox from '@material-ui/icons/CheckBox';

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  nestedList: {
    paddingLeft: theme.spacing(4),
  },

}));

const RevisionFilterControls = ({ revisionFilter, setRevisionFilter, className, onChange, ...rest }) => {

  const handleToggle = (value) => () => {  
    var newState = { ... revisionFilter, [value]: !revisionFilter[value]};
    setRevisionFilter(newState);

    if (value == 'isMinor') {
      if (revisionFilter.isMinor) {
        setRevisionFilter ({
          largeAdditions: true,
          smallAdditions: false,
          neutral: false,
          smallRemovals: false,
          largeRemovals: true,
          isMinor: false
        })

      }
      else {
        setRevisionFilter ({
          largeAdditions: false,
          smallAdditions: true,
          neutral: false,
          smallRemovals: true,
          largeRemovals: false,
          isMinor: true
        })
      }
    }
    // if (value == 'registered') {
    //     if (userTypeFilter.registered) {
    //         // registered turning off, so deactivate all subs
    //         setUserTypeFilter({
    //             unregistered: userTypeFilter.unregistered,
    //             registered: false,
    //             newcomers: false,
    //             learners: false,
    //             experienced: false,
    //             bots: false
    //         });
    //     } else {
    //         //registered turning on, so activate all subs
    //         setUserTypeFilter({
    //             unregistered: userTypeFilter.unregistered,
    //             registered: true,
    //             newcomers: true,
    //             learners: true,
    //             experienced: true,
    //             bots: true
    //         });
    //     }
    // } else {
    //     // toggle the value
    //     var newState = { ... userTypeFilter, [value]: !userTypeFilter[value]};
    //     // check for all sub-types off
    //     if (newState.newcomers && newState.learners && newState.experienced && newState.bots) {
    //         // all sub-types true, set registered == true
    //         newState = { ... newState, 'registered': true};
    //     } else {
    //         // at least one sub-type is false, so ensure registered == false
    //         newState = { ... newState, 'registered': false};
    //     }
    //     setUserTypeFilter(newState);
    // }
  };

  const classes = useStyles();

  return (
    <Paper variant='elevation'>
      <List
        component="nav"
        aria-labelledby="revision-filter-list-subheader"
        subheader={
          <ListSubheader component="div" id="revision-filter-list-subheader">
            Filter by Revision Size
          </ListSubheader>
        }
      >
        <ListItem key="largeAdditions" dense button onClick={handleToggle("largeAdditions")}> 
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.largeAdditions}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-large-additions' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-large-additions' primary="Large additions" secondary="(>= 1000 bytes)"/>
        </ListItem>
        <ListItem key="smallAdditions" dense button onClick={handleToggle("smallAdditions")}>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.smallAdditions}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-small-addition' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-small-addition' primary="Small additions" secondary="(>20 bytes)"/>
        </ListItem>
        <ListItem key="neutral" dense button onClick={handleToggle("neutral")}>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.neutral}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-size-0' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-size-0' primary="Neutral" secondary="(between -20 and 20 bytes)"/>
        </ListItem>
        <ListItem key="smallRemovals" dense button onClick={handleToggle("smallRemovals")}>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.smallRemovals}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-small-removal' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-small-removal' primary="Small removals" secondary="(< -20 bytes)"/>
        </ListItem>
        <ListItem key="largeRemovals" dense button onClick={handleToggle("largeRemovals")}>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.largeRemovals}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-large-removal' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-size-0' primary="Large removals" secondary="(<= -1000 bytes)"/>
        </ListItem>
        <ListSubheader>
          Is Minor
        </ListSubheader>
        <ListItem key="isMinor" dense button onClick={handleToggle("isMinor")}>
          <ListItemIcon>
            <Checkbox
            edge="start"
            checked={revisionFilter.isMinor}
            tabIndex={-1}
            inputprops={{'aria-labelledby': 'is-minor'}}
            />
          </ListItemIcon>
          <ListItemText id='is-minor' primary="Is Minor"/>
        </ListItem>

      </List>
      <Button
        onClick={ () => {
          setRevisionFilter ({
            largeAdditions: true,
            smallAdditions: true,
            neutral: true,
            smallRemovals: true,
            largeRemovals: true,
            isMinor: false
          }  
          )  
        }
        }
      >
      Reset to defaults
      </Button>
    </Paper>
  );
};

RevisionFilterControls.propTypes = {
  className: PropTypes.string
};

export default RevisionFilterControls;
