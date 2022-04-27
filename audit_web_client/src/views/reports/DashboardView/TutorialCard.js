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

const TutorialStep = ({stepHeader, stepNum, children}) => {
  return (
  <Box 
    border="2px solid" 
    borderColor="#5d5d61" 
    borderRadius="5px" 
    maxWidth="300px"
    padding="5px"
    margin="2px"
  >
    <Typography variant="h2" color="textPrimary" component="div">
      <strong>{stepNum}</strong> {stepHeader}
    </Typography>
    <Typography variant="body1" color="textPrimary" component="div">
      {children}
    </Typography>
  </Box>
  )
}

const TutorialCard = () => {

  const [tutorialVisible, setTutorialVisible] = useState(true)

  const handleClose = () => {
    setTutorialVisible(false)
  }

  const classes = useStyles();

  if (!tutorialVisible) {
    return (null)
  }

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
        <Typography variant="subtitle1" color="textPrimary" component="div">
          ORES is a machine learning model that gives every edit on Wikipedia 
          a score from 0 (least likely to be damaging) to 1 (most likely to be damaging).
          Score predictions are used to <a target="_blank" href="https://en.wikipedia.org/wiki/Special:RecentChanges?hidebots=1&hidecategorization=1&hideWikibase=1&hidelog=1&limit=50&days=7&enhanced=1&damaging__likelygood_color=c2&damaging__maybebad_color=c3&damaging__likelybad_color=c4&damaging__verylikelybad_color=c5&urlversion=2">
          highlight the Recent Changes feed</a> and 
          in other places to find and revert vandalism. <strong>ORES-Inspect 
          helps you <a target="_blank" href="https://simple.wikipedia.org/wiki/Audit">audit</a> ORES by looking at the scores that ORES predicts and 
           determining if its predictions are correct.</strong>
        </Typography>
        <br/>
        <Typography variant="h2" color="textPrimary" component="div">
          Audit ORES in 4 steps:
        </Typography>
        <br/>
        <Box 
          display="flex" 
          flexWrap="wrap"
          flexDirection="row" 
          justifyContent="space-evenly"
        >
          <TutorialStep 
            stepNum={1}
            stepHeader="Filter"
          >
            Choose which edits to look at. ORES-Inspect shows you all human edits on mainspace articles by default, 
            but you can filter down to look only at edits on particular pages (such as pages related to LGBT history)
            or from particular editors (such as newcomers).
            <br/><br/>
            Or, use the filter controls to choose something else entirely, like bot edits to Talk pages!
          </TutorialStep>
          <TutorialStep 
            stepNum={2}
            stepHeader="Focus"
          >
            When an edit is damaging, it is usually <a target="_blank" href="https://en.wikipedia.org/wiki/Wikipedia:Reverting">reverted</a> by
            the editor community. ORES-Inspect helps you focus on cases where the community behavior <i>disagrees</i> with the ORES prediction.
            <br/><br/>
            If you choose to look at <strong>Unexpected Reverts</strong>,
            you're looking at edits that ORES thinks are non-damaging...
            but that the community reverted anyway.
            <br/><br/>
            If you choose to look at <strong>Unexpected Consensus</strong>,
            you're looking at edits that ORES thinks are damaging...
            but that the community <i>didn't</i> revert.
            {/*<br/><br/>
            If you choose to look at Confusing Edits,
            you're looking at edits that give ORES the most trouble, 
            and helping to improve future versions of ORES. */}
          </TutorialStep>
          <TutorialStep 
            stepNum={3}
            stepHeader="Inspect"
          >
            Look at individual edits and label them as damaging ("I would revert this.") or not damaging.
            See if you can find a pattern of errors in ORES' predictions.
          </TutorialStep>
          <TutorialStep 
            stepNum={4}
            stepHeader="Discuss"
          >
            View a summary of your edit labels by clicking "View Annotation History". 
            How often did ORES misclassify the edits you looked at? 
            <br/><br/>
            You can <a target="_blank" href='https://www.mediawiki.org/wiki/Talk:ORES'>discuss your results with the ORES developers</a>.
            If you change the filters, you can compare two groups of edits to identify bias ("Are newcomers' edits misclassified more often than experienced editors'?")
          </TutorialStep>
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
