import React, { useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  Typography,
  Toolbar,
  makeStyles,
  IconButton,
  Link
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import PersonIcon from '@material-ui/icons/Person';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import { DrawerContext } from 'src/App';
// import NotificationsIcon from '@material-ui/icons/NotificationsOutlined';
// import InputIcon from '@material-ui/icons/Input';
// import Logo from 'src/components/Logo';


const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
  title: {
    flexGrow: 1,
  },
  hide: {
    display: 'none',
  },
}));

const TopBar = ({
  className,
  onMobileNavOpen,
  ...rest
}) => {
  const classes = useStyles();
  const {drawerOpen, setDrawerOpen} = useContext(DrawerContext)
  const location = useLocation();

  const username = document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1")
  const loggedIn = username !== ""

  // a bit hacky: only display the drawer button in the DashboardView
  const displayDrawerButton = location.pathname === "/app/dashboard";

  const handleDrawerOpen = () => {
    setDrawerOpen(true)
  }
  return (
    <AppBar
      position="fixed"
      className={clsx(classes.appBar, {
        [classes.appBarShift]: drawerOpen,
      })}
    >
      <Toolbar>
        <RouterLink to="/" style={{ color: 'white' }}>
          <Typography variant="h1" className={classes.title}>ORES-Inspect</Typography>
          {/*Could replace text with a logo per the example like so: <Logo />*/}
        </RouterLink>
        <Box flexGrow={1} />
        {loggedIn
          ? <Box
          display="flex"
          alignItems= "center"
          justifyContent= "center"
          >
            <PersonIcon/>Logged in as {username}
            <Link 
              href="/auth/logout"
              style={{ color: 'white' }}
            >
              <Box
                display="flex"
                alignItems= "center"
                marginLeft= "10px"
              >
                <ExitToAppIcon/><Typography>Logout</Typography>
              </Box>
              
            </Link>
          </Box>

          : <Box
          display="flex"
          alignItems= "center"
          justifyContent= "center"
          >
            <Link 
              href="/auth/login" 
              style={{ color: 'white' }}
            >
              <Box
                display="flex"
                alignItems= "center"
              >
                <PersonIcon/>
                <Typography>Login</Typography>
              </Box>
            </Link>
            
          </Box>
        }
        {displayDrawerButton ?
        <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            className={clsx(drawerOpen && classes.hide)}
          >
            <MenuIcon />
          </IconButton>
          : null }
      </Toolbar>
    </AppBar>
  );
};

TopBar.propTypes = {
  className: PropTypes.string,
  onMobileNavOpen: PropTypes.func
};

export default TopBar;
