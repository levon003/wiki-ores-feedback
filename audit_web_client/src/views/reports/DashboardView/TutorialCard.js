import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Popover,
  IconButton,
  makeStyles,
  Typography,
  Divider,
  Button
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles((theme) => ({
  root: {},
  closeButton: {
    marginLeft: 'auto',
  },
}));

const TutorialCard = () => {

  const handleClose = () => {
    console.log("Close clicked.")
  }

  const classes = useStyles();

  return (
    <Card
      className={clsx(classes.root)}
    >
      <Box position="relative">
      <Box position="absolute" top="5px" right="5px" zIndex={9}>
        <IconButton
          className={clsx(classes.closeButton)}
          onClick={handleClose}
          aria-label="hide tutorial"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <CardContent>
        <Typography variant="h2" color="textPrimary" component="h2" display="inline">
          ORES finds vandalism.
        </Typography>
        <Typography variant="body1" color="textPrimary" component="div">
        ORES is a machine learning model that scores every edit on Wikipedia from 0 (least likely to be damaging) to 1 (most likely to be damaging). 
        </Typography>
        <Typography variant="body1" color="textPrimary" component="div">
          ORES-Inspect helps you see what ORES predicts and to determine if its predictions are accurate.
        </Typography>
        <Typography variant="h3" color="textPrimary" component="div">
          Audit ORES in 3 steps:
        </Typography>
        <Box display="flex" flexDirection="row" justifyContent="space-evenly">
          <Box>Test1</Box>
          <Box>Test2</Box>
        </Box>
        
      </CardContent>
      </Box>
    </Card>
  );
};

TutorialCard.propTypes = {
  className: PropTypes.string
};

export default TutorialCard;
