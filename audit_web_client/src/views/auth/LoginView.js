import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Link,
  Typography,
  makeStyles
} from '@material-ui/core';
import Page from 'src/components/Page';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    height: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const LoginView = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  // TODO consider not showing the login button if the user is already logged in

  return (
    <Page
      className={classes.root}
      title="Login"
    >
      <Box
        display="flex"
        flexDirection="column"
        height="100%"
        justifyContent="center"
      >
        <Container maxWidth="sm">
          <Typography
            color="textPrimary"
            variant="h2"
          >
            What is ORES-Inspect?
          </Typography>
          <Typography
            color="textPrimary"
          >
            Explanatory text.
          </Typography>

          <Typography
            color="textPrimary"
            variant="h3"
          >
            Start inspecting:
          </Typography>
          <Button 
            href="/auth/login" 
            variant="outlined"
          >
            Login with your English Wikipedia account
            </Button>
        </Container>
      </Box>
    </Page>
  );
};

export default LoginView;
