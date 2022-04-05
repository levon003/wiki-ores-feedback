import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Card,
  Grid,
  Link,
  Divider,
  Typography,
  makeStyles,
  Accordion,
  AccordionDetails,
  AccordionSummary
} from '@material-ui/core';
import Page from 'src/components/Page';
import ExpandMoreIcon from '@material-ui/icons/KeyboardArrowDown';

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
      <Card 
        style={{marginLeft:"10%", marginRight:"10%"}}
      >
        <Box>
          <Box className='box'>
          <Typography
              variant="h2"
              style={{marginBottom:"10px", color:"black"}}
              >
              What is ORES-Inspect?
            </Typography>
            <Box style={{color:"black"}}>
         
                  This is an experimental tool hosted on <a>Toolforge</a>. 
                  <br/>
                  For this tool to function, we have to store your username alongside any revision labels or notes you provide, 
                  in accordance with the Cloud Services <a href="https://wikitech.wikimedia.org/wiki/Wikitech:Cloud_Services_Terms_of_use">Terms of Use</a>. 
                  See the FAQ for more info on what we collect and why.
                  <br/><br/>

                  ORES-Inspect is a tool for looking at the predictions made by the <a href="https://www.mediawiki.org/wiki/ORES">ORES machine learning system</a>.  
                  The ORES edit quality model tries to determine if edits to Wikipedia are damaging or not. 
                  I made ORES-Inspect to understand if ORES is functioning correctly.
                  <br/><br/>
                  Thanks for trying ORES-Inspect! 
                  This tool is still under active development, 
                  and we'd love to get your thoughts <a href="https://www.mediawiki.org/wiki/ORES">on our talk page</a>.
                  <br/><br/>
                  To start using ORES-Inspect, 
                  login with your English Wikipedia account credentials using the button at the bottom of this page. 
                  By logging in, you agree to share your English Wikipedia username with us, 
                  along with information related to your usage of ORES Inspect (see What We Collect below).
     

                <Accordion
                  style={{marginTop:"15px", color:"black"}}
                >
                  <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                  >
                      <Typography>More Info and FAQ</Typography>
                  </AccordionSummary>
                  <AccordionDetails>

                  <Box margin="0 auto">
                  <Box>

                  <Box style={{marginBottom:"10px"}}>&#9726; What personal data is stored by this tool?</Box>
                  We store your username in a <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies">cookie</a> so that you can stay logged in; this cookie is deleted when you log out.  
                  The revision labels and notes you make while using the tool are stored 
                  in a <a href="https://wikitech.wikimedia.org/wiki/Help:Toolforge/Database#User_databases">Toolforge database </a> 
                  accessible only to maintainers of this project.

                  Per the Wikimedia Cloud Services Terms of Use, it is important that you understand the following:
                  By using this project, you agree that any private information you give to this project may be made publicly available and not be treated as confidential.
                  <br/><br/>
                  By using this project, you agree that the volunteer administrators of this project will have access to any data you submit. This can include your IP address, your username/password combination for accounts created in Cloud Services services, and any other information that you send. The volunteer administrators of this project are bound by the Wikimedia Cloud Services Terms of Use, and are not allowed to share this information or use it in any non-approved way.
                  <br/><br/>
                  Since access to this information is fundamental to the operation of Wikimedia Cloud Services, these terms regarding use of your data expressly override the Wikimedia Foundation's Privacy Policy as it relates to the use and access of your personal information.
                  <br/><br/>

                  <Box style={{marginBottom:"10px"}}>&#9726; Who can access my data?</Box>
                  Your data will only be accessible to <a href="https://toolsadmin.wikimedia.org/tools/id/ores-inspect">maintainers of the ORES-Inspect tool</a>.
                  We'd like to make it easy to export (or even to save directly to) a public enwiki page in the future: if that's something that interests you, please let us know.
                  <br/><br/>

                  <Box style={{marginBottom:"10px"}}>&#9726; When will my data be deleted?</Box>
                  As the data you provide while using the tool is critical for its functionality, we will only remove data at your request.


                  I want to know more implementation details.
                  You can view (and fork!) the 
                  <a href="https://github.com/levon003/wiki-ores-feedback/tree/master/audit_web_client"> Source code</a>,
                  which is fully available for reuse under the 
                  <a href="https://github.com/levon003/wiki-ores-feedback/blob/master/LICENSE"> MIT License</a>.

                        </Box>
                      </Box>
                  </AccordionDetails>
                </Accordion>

                <Typography
                color="textPrimary"
                variant="h3"
                style={{marginTop:"20px", color:"black"}}
                >
                  Start Inspecting:
                </Typography>
                <Button 
                  style={{marginTop:"10px", color:"black"}}
                  href="/auth/login" 
                  variant="outlined"
                >
                Login with your English Wikipedia account
                </Button>
                
            </Box>
          </Box>
        </Box>
      </Card>
    </Page>
    
  );
};

export default LoginView;
