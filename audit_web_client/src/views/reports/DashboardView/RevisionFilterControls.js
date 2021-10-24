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

const RevisionFilterControls = ({ className, onChange, ...rest }) => {

  const [revisionFilter, setRevisionFilter] = useState({
    largeAdditions: true,
    smallAdditions: true,
    neutral: true,
    smallRemovals: true,
    largeRemovals: true,
    isMinor: false
  })

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
        <ListItem key="largeAdditions" dense button>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.largeAdditions}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-large-additions' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-large-additions' primary="Large additions" />
        </ListItem>
        <ListItem key="smallAdditions" dense button>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.smallAdditions}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-small-addition' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-small-addition' primary="Small additions" />
        </ListItem>
        <ListItem key="neutral" dense button>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.neutral}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-size-0' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-size-0' primary="Neutral" />
        </ListItem>
        <ListItem key="smallRemoval" dense button>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.smallRemovals}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-small-removal' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-small-removal' primary="Small removals" />
        </ListItem>
        <ListItem key="largeRemoval" dense button>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.largeRemovals}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-large-removal' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-size-0' primary="Large removals" />
        </ListItem>
        <ListSubheader>
          Is Minor
        </ListSubheader>
        <ListItem key="isMinor" dense button>
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
        onClick={null}
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
