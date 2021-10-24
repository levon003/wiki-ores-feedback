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
    large: false,
    minor: true,
    neutral: false
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
        <ListItem key="large" dense button>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.large}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-size-large' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-size-large' primary="Large" />
        </ListItem>
        <ListItem key="Minor" dense button>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.minor}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-size-minor' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-size-minor' primary="Minor" />
        </ListItem>
        <ListItem key="large" dense button>
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
