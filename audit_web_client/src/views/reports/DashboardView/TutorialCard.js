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
      <CardActions disableSpacing>
        <IconButton
          className={clsx(classes.closeButton)}
          onClick={handleClose}
          aria-label="hide tutorial"
        >
          <CloseIcon />
        </IconButton>
      </CardActions>
      <CardContent>
        <Typography variant="h2" color="textPrimary" component="h2">
          Header.
        </Typography>
        <Typography variant="body2" color="textSecondary" component="p">
          Text test.
        </Typography>
        
      </CardContent>
    </Card>
  );
};

TutorialCard.propTypes = {
  className: PropTypes.string
};

export default TutorialCard;
