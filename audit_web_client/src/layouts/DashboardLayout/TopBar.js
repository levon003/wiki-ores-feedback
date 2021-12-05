import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  Typography,
  Toolbar,
  makeStyles
} from '@material-ui/core';
// import MenuIcon from '@material-ui/icons/Menu';
// import NotificationsIcon from '@material-ui/icons/NotificationsOutlined';
// import InputIcon from '@material-ui/icons/Input';
// import Logo from 'src/components/Logo';
import { LoadingContext } from 'src/App';
import { Oval } from 'react-loading-icons'

const useStyles = makeStyles(() => ({
  root: {},
  avatar: {
    width: 60,
    height: 60
  }
}));

const Loading = ({ loading }) => {
  return loading ? <Oval/> : null
}

const TopBar = ({
  className,
  onMobileNavOpen,
  ...rest
}) => {
  const classes = useStyles();
  const loadingContext = useContext(LoadingContext)

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
        <Box flexGrow={1} />
        {/* Make this smaller, or move to bottom, or remove */}
        {/* change to more standard loading format */}
        {/* think about flickering loading icon, too distracting? */}
        <Loading loading={loadingContext.loading} />
      </Toolbar>
    </AppBar>
  );
};

TopBar.propTypes = {
  className: PropTypes.string,
  onMobileNavOpen: PropTypes.func
};

export default TopBar;
