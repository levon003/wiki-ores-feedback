import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  Typography,
  Toolbar,
  makeStyles,
  IconButton
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
// import NotificationsIcon from '@material-ui/icons/NotificationsOutlined';
// import InputIcon from '@material-ui/icons/Input';
// import Logo from 'src/components/Logo';

const useStyles = makeStyles(() => ({
  root: {},
  avatar: {
    width: 60,
    height: 60
  }
}));

const TopBar = ({
  className,
  onMobileNavOpen,
  ...rest
}) => {
  const classes = useStyles();

  return (
    <AppBar
      className={clsx(classes.root, className)}
      elevation={0}
      {...rest}
    >
      <Toolbar>
        <RouterLink to="/" style={{ color: 'white' }}>
          <Typography variant="h1">ORES-Inspect</Typography>
          {/*Could replace text with a logo per the example like so: <Logo />*/}
        </RouterLink>
        <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            // onClick={handleDrawerOpen}
            // sx={{ ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
        <Box flexGrow={1} />
      </Toolbar>
    </AppBar>
  );
};

TopBar.propTypes = {
  className: PropTypes.string,
  onMobileNavOpen: PropTypes.func
};

export default TopBar;
