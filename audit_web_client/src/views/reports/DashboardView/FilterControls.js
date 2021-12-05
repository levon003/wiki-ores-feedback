import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  Chip,
  Popover,
  makeStyles,
  IconButton,
  Typography,
} from '@material-ui/core';

import RevisionFilterControls from './RevisionFilterControls';
import PageFilterControls from './PageFilterControls';
import UserFilterControls from './UserFilterControls';

import HelpIcon from '@material-ui/icons/Help'

// const userTypeOptions = [
//   { key: 'all', desc: 'All users', },
//   { key: 'unregistered', desc: 'Unregistered users', },
//   { key: 'registered', desc: 'Registered users', },
//   { key: 'newcomers', desc: 'Newcomers', },
//   { key: 'learners', desc: 'Learners', },
//   { key: 'experienced', desc: "Experienced users", },
//   { key: 'bots', desc: 'Bots', },
// ];

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  nestedList: {
    paddingLeft: theme.spacing(4),
  },

}));

const UserFilterChip = ({ className, onChange, userTypeFilter, setUserTypeFilter, filteredUsernames, setFilteredUsernames, userTypeAnchorEl, setUserTypeAnchorEl,...rest }) => {

  return <UserFilterControls userTypeFilter={userTypeFilter} setUserTypeFilter={setUserTypeFilter} filteredUsernames={filteredUsernames} setFilteredUsernames={setFilteredUsernames} userTypeAnchorEl={userTypeAnchorEl} setUserTypeAnchorEl={setUserTypeAnchorEl} useStyles={useStyles} />

};

const PageFilterChip = ({className, onChange, pageValues, setPageValues, namespaceSelected, setNameSpaceSelected, linkedToValues, setLinkedToValues, linkedFromValues, setLinkedFromValues, pageAnchorEl, setPageAnchorEl, ...rest }) => {

  return <PageFilterControls pageValues={pageValues} setPageValues={setPageValues} namespaceSelected={namespaceSelected} setNameSpaceSelected={setNameSpaceSelected} linkedToValues={linkedToValues} setLinkedToValues={setLinkedToValues} linkedFromValues={linkedFromValues} setLinkedFromValues={setLinkedFromValues} pageAnchorEl={pageAnchorEl} setPageAnchorEl={setPageAnchorEl} />

};

const RevisionFilterChip = ({className, onChange, revisionFilter, setRevisionFilter, minorFilter, setMinorFilter, revisionAnchorEl, setRevisionAnchorEl, ...rest}) => {
  
  const revisionFilterPrettyNames = {
    largeAdditions: "large additions",
    smallAdditions: "small additions",
    neutral: "near zero changes",
    smallRemovals: "small removals",
    largeRemovals: "large removals"
  }

  const open = Boolean(revisionAnchorEl);
  const id = open ? 'simple-popover' : undefined;

  const handleRevisionChipClick = (event) => {
    setRevisionAnchorEl(event.currentTarget);
  };
    
  const handleRevisionPopoverClose = (event) => {
    setRevisionAnchorEl(null);
  };

  const [pageHelpPopup, setPageHelpPopup] = useState();

  const pageHelpOpen = Boolean(pageHelpPopup);
  const helpID = pageHelpOpen ? 'simple-popover' : undefined;

  const handleIconClick = (event) => {
    setPageHelpPopup(event.currentTarget)
  }

  const handleIconClickClose = () => {
    setPageHelpPopup(null)
  }

  const getRevisionFilterSummary = () => {
    const total_checked = revisionFilter.largeAdditions + revisionFilter.smallAdditions + revisionFilter.neutral + revisionFilter.smallRemovals + revisionFilter.largeRemovals
    let summaryString = "Revision Filters"
    if (total_checked === 0) {
      summaryString = "No revisions selected"
    } else if (total_checked === 1 || total_checked === 2 || total_checked === 3) {
      if (revisionFilter.largeAdditions && revisionFilter.largeRemovals && total_checked === 2) {
        summaryString = "Only large changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.smallRemovals && total_checked === 2) {
        summaryString = "Only small changes"
      } else if (revisionFilter.smallAdditions && revisionFilter.largeAdditions && total_checked === 2) {
        summaryString = "Only additions"
      } else if (revisionFilter.largeRemovals && revisionFilter.smallRemovals && total_checked === 2) {
        summaryString = "Only removals"
      } else if (total_checked === 1 || total_checked === 2) {
        summaryString = "Only "
        let count = 0;
        for (let k in revisionFilter) {
          if (revisionFilter[k]) {
            if (count > 0) {
              summaryString += "and " + revisionFilterPrettyNames[k] + " "
            } else {
              summaryString += revisionFilterPrettyNames[k] + " "
            }
            count++
          }
        }
      } else if (total_checked === 3) {
        summaryString = "Everything except "
        let count = 0;
        for (let k in revisionFilter) {
          if (!revisionFilter[k]) {
            if (count > 0) {
              summaryString += "and " + revisionFilterPrettyNames[k] + " "
            } else {
              summaryString += revisionFilterPrettyNames[k] + " "
            }
            count++
          }
        }
      }
    } else if (total_checked === 4) {
      if (!revisionFilter.largeAdditions) {
        summaryString = "Everything except large additions"
      } else if (!revisionFilter.smallAdditions) {
        summaryString = "Everything except small additions"
      } else if (!revisionFilter.neutral) {
        summaryString = "Everything except near zero changes"
      } else if (!revisionFilter.smallRemovals) {
        summaryString = "Everything except small removals"
      } else if (!revisionFilter.largeRemovals) {
        summaryString = "Everything except large removals"
      }
    }
    if (minorFilter.isMinor && !minorFilter.isMajor && summaryString !== "Revision Filters") {
      if (total_checked === 1 || total_checked === 2) {
        summaryString = summaryString.slice(0, 5) + "minor " + summaryString.slice(5)
      } else {
        summaryString = summaryString.slice(0, 18) + "minor " + summaryString.slice(17)
      }
    } else if (!minorFilter.isMinor && minorFilter.isMajor && summaryString !== "Revision Filters") {
      if (total_checked === 1 || total_checked === 2) {
        summaryString = summaryString.slice(0, 5) + "major " + summaryString.slice(5)
      } else {
        summaryString = summaryString.slice(0, 18) + "major " + summaryString.slice(17)
      }
    }
    return summaryString
  }

  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="nowrap"
    >
      <Chip clickable onClick={handleRevisionChipClick} label={getRevisionFilterSummary()} />
      <IconButton color="primary" size="small" onClick={handleIconClick}>
      <HelpIcon/>
      </IconButton>
      <Popover
        id={helpID}
        open={pageHelpOpen}
        anchorEl={pageHelpPopup}
          onClose={handleIconClickClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}>
          <p style={{margin: 5, fontSize: 12}}><a href="https://en.wikipedia.org/wiki/Help:Minor_edit" target="_blank" rel="noopener noreferrer">Minor Edit Definition</a></p>
          {/* TODO: add something here */}
      </Popover>
      <Popover
        id={id}
        open={open}
        anchorEl={revisionAnchorEl}
        onClose={handleRevisionPopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >

        <RevisionFilterControls onChange={onChange} revisionFilter={revisionFilter} setRevisionFilter={setRevisionFilter} minorFilter={minorFilter} setMinorFilter={setMinorFilter}/>
      </Popover>
    </Box>
  );
};

const FilterControls = ({ className, onChange, revisionFilter, setRevisionFilter, minorFilter, 
  setMinorFilter, userTypeFilter, setUserTypeFilter, filteredUsernames, setFilteredUsernames, pageValues, setPageValues, namespaceSelected, setNameSpaceSelected, linkedToValues, setLinkedToValues, linkedFromValues, setLinkedFromValues, ...rest }) => {

  const classes = useStyles();

  const [revisionAnchorEl, setRevisionAnchorEl] = useState();
  const [userTypeAnchorEl, setUserTypeAnchorEl] = useState();
  const [pageAnchorEl, setPageAnchorEl] = useState();

  const WarningMessage = () => {
    if (((!revisionFilter.largeAdditions) && (!revisionFilter.smallAdditions) && (!revisionFilter.neutral) && (!revisionFilter.smallRemovals) && (!revisionFilter.largeRemovals)) || ((!minorFilter.isMinor) && (!minorFilter.isMajor))) {
      return <Box style={{color: 'red', paddingTop: 0, textAlign: 'center'}}>
        Warning: Current revision filter selection will not yield any results.
          <Button
            onClick={ () => {
              setRevisionFilter ({
                largeAdditions: true,
                smallAdditions: true,
                neutral: true,
                smallRemovals: true,
                largeRemovals: true,
              }  
              )  
              setMinorFilter({
                isMinor: true,
                isMajor: true
              }) 
            }
            }
            >
            Reset to default
          </Button>
        </Box>
    }
    else if ((!userTypeFilter.unregistered) && (!userTypeFilter.registered) && (!userTypeFilter.newcomers) && (!userTypeFilter.learners) && (!userTypeFilter.experienced) && (!userTypeFilter.bots)) {
      return <Box style={{color: 'red', paddingTop: 0, textAlign: 'center'}}>
      Warning: No User Filters Selected
        <Button
          onClick={ () => {
            setFilteredUsernames([]);
            setUserTypeFilter({
                unregistered: true,
                registered: false,
                newcomers: true,
                learners: true,
                experienced: true,
                bots: false,
            });
          }
          }
          >
          Reset to default
        </Button>
      </Box>
      
    }
    else if (namespaceSelected.length === 0) {
      return <Box style={{color: 'red', paddingTop: 0, textAlign: 'center'}}>
      Warning: No Page Filters Selected
        <Button
          onClick={ () => {
          setNameSpaceSelected([{namespace: "Main/Article - 0"}]); 
          }
          }
          >
          Reset to default
        </Button>
      </Box>  
    }
    else {
      return null
    }
  }

  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
      <Box
        height="20vh"
        // display="flex"
        // flexDirection="column"
        // flexWrap="nowrap"
      >

        <Box
          display="flex"
          flexDirection="column"
          style= {{ backgroundColor: "blue", display: "inline-flex"}}
        >
          <Typography variant="h3" className="subtitle">
            Custom
          </Typography>

          <Box
            display="flex"
            flexDirection="row"
            style= {{ backgroundColor: "red", display: "inline-flex"}}
          >
            <PageFilterChip onChange={onChange} 
                pageValues={pageValues}
                setPageValues={setPageValues}
                namespaceSelected={namespaceSelected}
                setNameSpaceSelected={setNameSpaceSelected}
                linkedToValues={linkedToValues}
                setLinkedToValues={setLinkedToValues}
                linkedFromValues={linkedFromValues}
                setLinkedFromValues={setLinkedFromValues}
                pageAnchorEl={pageAnchorEl}
                setPageAnchorEl={setPageAnchorEl}
            />
            <RevisionFilterChip onChange={onChange} 
              revisionFilter={revisionFilter} 
              setRevisionFilter={setRevisionFilter} 
              minorFilter={minorFilter} 
              setMinorFilter={setMinorFilter} 
              revisionAnchorEl={revisionAnchorEl} 
              setRevisionAnchorEl={setRevisionAnchorEl}
            />

            <UserFilterChip 
              onChange={onChange} 
              userTypeFilter={userTypeFilter} 
              setUserTypeFilter={setUserTypeFilter} 
              filteredUsernames={filteredUsernames} 
              setFilteredUsernames={setFilteredUsernames}
              userTypeAnchorEl={userTypeAnchorEl}
              setUserTypeAnchorEl={setUserTypeAnchorEl}
            />
          </Box>
        </Box>

        {/* probably need to fix warning message */}
        <WarningMessage />
      </Box>
    </Card>
  );
};

FilterControls.propTypes = {
  className: PropTypes.string
};

export default FilterControls;

// highlight box if that box is selected etc
// click twice --> unclick, click another that is selected 
// 1. set the values
// 2. show the visual effects 
// 3. 