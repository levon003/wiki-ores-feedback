import React from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Button, ListItem } from '@mui/material';

import { makeStyles } from 'tss-react/mui';

// react-router v6+ NavLink applies an `active` class automatically when the
// link matches (replacing the removed `activeClassName` prop), so we style
// `&.active` here. `classes` lets us reference sibling rules (the v4 `$ref`
// JSS syntax is not supported by MUI v5+'s emotion engine).
const useStyles = makeStyles()((theme, _params, classes) => ({
  item: {
    display: 'flex',
    paddingTop: 0,
    paddingBottom: 0
  },
  button: {
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
    justifyContent: 'flex-start',
    letterSpacing: 0,
    padding: '10px 8px',
    textTransform: 'none',
    width: '100%',
    '&.active': {
      color: theme.palette.primary.main,
      [`& .${classes.title}`]: {
        fontWeight: theme.typography.fontWeightMedium
      },
      [`& .${classes.icon}`]: {
        color: theme.palette.primary.main
      }
    }
  },
  icon: {
    marginRight: theme.spacing(1)
  },
  title: {
    marginRight: 'auto'
  }
}));

const NavItem = ({
  className,
  href,
  icon: Icon,
  title,
  ...rest
}) => {
  const { classes } = useStyles();

  return (
    <ListItem
      className={clsx(classes.item, className)}
      disableGutters
      {...rest}
    >
      <Button
        className={classes.button}
        component={RouterLink}
        to={href}
      >
        {Icon && (
          <Icon
            className={classes.icon}
            size="20"
          />
        )}
        <span className={classes.title}>
          {title}
        </span>
      </Button>
    </ListItem>
  );
};

NavItem.propTypes = {
  className: PropTypes.string,
  href: PropTypes.string,
  icon: PropTypes.elementType,
  title: PropTypes.string
};

export default NavItem;
