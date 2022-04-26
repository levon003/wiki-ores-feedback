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
            {/* https://stackoverflow.com/a/34162696
            small devices detected at 991 pixels by bootstrap */}
            {window.innerWidth < 991 && (
            <Typography style={{marginBottom: 10}}>Thanks for checking out ORES-Inspect! ORES-Inspect is best viewed on larger screens.</Typography>
          )}
          <Typography
              variant="h2"
              style={{marginBottom:"10px", color:"black"}}
              >
              What is ORES-Inspect?
            </Typography>
            <Box style={{color:"black"}}>
                  ORES-Inspect is an experimental tool for looking at the predictions made by the <a href="https://www.mediawiki.org/wiki/ORES">ORES machine learning system</a>.  
                  ORES tries to determine if edits to Wikipedia are damaging or not.  
                  ORES-Inspect makes it easy to verify if ORES is working well.
                  <br/><br/>
                  
                  Thanks for trying ORES-Inspect! 
                  This tool is still under active development, 
                  and we'd love to get your thoughts <a href="https://meta.wikimedia.org/w/index.php?title=Research_talk:ORES_Inspect:_A_technology_probe_for_machine_learning_audits_on_enwiki&action=edit">on our talk page</a>.
                  <br/><br/>
                  To start using ORES-Inspect, 
                  login with your English Wikipedia account credentials using the button at the bottom of this page. 
                  By logging in, you agree to share your English Wikipedia username with us, 
                  along with information related to your usage of ORES-Inspect.
                  We store this data in accordance with the Cloud Services <a href="https://wikitech.wikimedia.org/wiki/Wikitech:Cloud_Services_Terms_of_use">Terms of Use</a>, as it is necessary for the tool to function. 
                  See the FAQ for more info on what we collect and why.
                  <br/><br/>
     

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

                  <Box style={{marginBottom:"10px"}}>&#9726; What is ORES-Inspect?</Box>
                  ORES-Inspect is a web application hosted on <a href="https://wikitech.wikimedia.org/wiki/Portal:Toolforge/About_Toolforge">Toolforge</a>.
                  Researchers at the University of Minnesota developed ORES-Inspect to better understand how well machine learning is working on Wikipedia.
                  <br /><br />

                  
                  <Box style={{marginBottom:"10px"}}>&#9726; Is ORES-Inspect a research project?</Box>
                  Yes, and by using it you are participating in our attempts to understand how to inspect and test the machine learning models used on Wikipedia. 
                  Read more detail on <a href="https://meta.wikimedia.org/wiki/Research:ORES_Inspect:_A_technology_probe_for_machine_learning_audits_on_enwiki">our research page</a>.
                  
                  Viewing revisions in ORES-Inspect carries no risks beyond looking at <a href="https://en.wikipedia.org/wiki/Special:RecentChanges">Special:RecentChanges</a>. 
                  There is no compensation for using ORES-Inspect, but we hope you find the tool useful!  
                  If you want to be notified of any research findings that result from this work, 
                  sign-up with your username on <a href="https://meta.wikimedia.org/wiki/Research:ORES_Inspect:_A_technology_probe_for_machine_learning_audits_on_enwiki">our research page</a> and we'll keep you updated.
                  <br /><br />

                  <Box style={{marginBottom:"10px"}}>&#9726; Who can I contact with feedback about ORES-Inspect?</Box>

                  The first place you should go with questions or comments is <a href="https://meta.wikimedia.org/wiki/Research_talk:ORES_Inspect:_A_technology_probe_for_machine_learning_audits_on_enwiki">the Talk page for this research project</a>.

                  If you have questions, comments, or concerns to share directly with the researchers, please contact either of the Co-Investigators of this project:
                  <Box style={{marginLeft: "10px"}}>&#8594; Zachary Levonian, PhD Candidate, University of Minnesota Twin Cities, Department of Computer Science, levon003@umn.edu, <a href="https://en.wikipedia.org/wiki/User_talk:Suriname0">enwiki Talk page</a></Box>
                  <Box style={{marginLeft: "10px"}}>&#8594; Loren Terveen, Professor, University of Minnesota Twin Cities, Department of Computer Science, terveen@umn.edu</Box>
                  <br />

                  This research has been reviewed and approved by an Institutional Review Board (IRB) within the Human Research Protections Program (HRPP). 
                  To share feedback privately with the HRPP about your research experience, call the Research Participants' Advocate Line at 612.624.4490 or go to <a href="https://www.irb.umn.edu/report.html">www.irb.umn.edu/report.html</a>. 
                  You are encouraged to contact the HRPP if:<br/>
                  &#62; Your questions, concerns, or complaints are not being answered by the research team<br/>
                  &#62; You cannot reach the research team<br/>
                  &#62; You want to talk to someone besides the research team<br/>
                  &#62; You have questions about your rights as a research subject<br/>
                  &#62; You want to get information or provide input about this research<br/>
                  <br/>

                  <Box style={{marginBottom:"10px"}}>&#9726; What personal data is stored by this tool?</Box>
                  We store your username (and a <a href="https://en.wikipedia.org/wiki/JSON_Web_Token">JWT</a>) in a <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies">cookie</a> so that you can stay logged in; this cookie is deleted when you log out.  
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
                  <br/><br/>

                  <Box style={{marginBottom:"10px"}}>&#9726; I want to know more implementation details.</Box>
                  You can view (and fork!) the source code <a href="https://github.com/levon003/wiki-ores-feedback/tree/master/audit_web_client">on GitHub</a>,
                  which is fully available for reuse under the <a href="https://github.com/levon003/wiki-ores-feedback/blob/master/LICENSE">MIT License</a>.

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
