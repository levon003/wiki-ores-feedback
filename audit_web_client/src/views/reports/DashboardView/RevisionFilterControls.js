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

  const classes = useStyles();

  return (
    <Paper variant='elevation'>

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
