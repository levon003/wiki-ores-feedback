import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme
  // makeStyles
} from '@material-ui/core';
import DefaultFilters from './DefaultFilters';

// const useStyles = makeStyles((theme) => ({
//   root: {},
//   actions: {
//     justifyContent: 'flex-end'
//   },
//   nestedList: {
//     paddingLeft: theme.spacing(4),
//   },

// }));

const RevisionFilterControls = ({ revisionFilter, setRevisionFilter, minorFilter, setMinorFilter, className, onChange, ...rest }) => {

  const handleRevisionToggle = (value) => () => {  
    var newState = { ...revisionFilter, [value]: !revisionFilter[value]};
    setRevisionFilter(newState);
  };

  const handleMinorToggle = (value) => () => {
    const newState = {...minorFilter, [value]: !minorFilter[value]}
    setMinorFilter(newState)
  }

  return (
    <Paper variant='elevation'>
      <List
        component="nav"
        aria-labelledby="revision-filter-list-subheader"
        subheader={
          <ListItem>
            <ListItemText component="div" id="revision-filter-list-subheader">
              Filter by Edit Size
            </ListItemText>
          </ListItem>
        }
      >
        <ListItem key="largeAdditions" dense button onClick={handleRevisionToggle("largeAdditions")}> 
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.largeAdditions}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-large-additions' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-large-additions' primary="Large additions" secondary="(>= 1000 bytes)"/>
        </ListItem>
        <ListItem key="smallAdditions" dense button onClick={handleRevisionToggle("smallAdditions")}>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.smallAdditions}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-small-addition' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-small-addition' primary="Small additions" secondary="(>20 bytes)"/>
        </ListItem>
        <ListItem key="neutral" dense button onClick={handleRevisionToggle("neutral")}>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.neutral}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-size-0' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-size-0' primary="Near zero change" secondary="(between -20 and 20 bytes)"/>
        </ListItem>
        <ListItem key="smallRemovals" dense button onClick={handleRevisionToggle("smallRemovals")}>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.smallRemovals}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-small-removal' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-small-removal' primary="Small removals" secondary="(< -20 bytes)"/>
        </ListItem>
        <ListItem key="largeRemovals" dense button onClick={handleRevisionToggle("largeRemovals")}>
          <ListItemIcon>
            <Checkbox 
            edge="start"
            checked={revisionFilter.largeRemovals}
            tabIndex={-1}
            inputprops={{ 'aria-labelledby': 'revision-large-removal' }}
            />
          </ListItemIcon>
          <ListItemText id='revision-size-0' primary="Large removals" secondary="(<= -1000 bytes)"/>
        </ListItem>
        <ListItem>
          <ListItemText>
            Is Minor
          </ListItemText>
        </ListItem>
        <ListItem key="isMinor" dense button onClick={handleMinorToggle("isMinor")}>
          <ListItemIcon>
            <Checkbox
            edge="start"
            checked={minorFilter.isMinor}
            tabIndex={-1}
            inputprops={{'aria-labelledby': 'is-minor'}}
            />
          </ListItemIcon>
          <ListItemText id='is-minor' primary="Minor edit"/>
        </ListItem>
        <ListItem key="isMajor" dense button onClick={handleMinorToggle("isMajor")}>
          <ListItemIcon>
            <Checkbox
            edge="start"
            checked={minorFilter.isMajor}
            tabIndex={-1}
            inputprops={{'aria-labelledby': 'is-major'}}
            />
          </ListItemIcon>
          <ListItemText id='is-major' primary="Major edit"/>
        </ListItem>

      </List>
      <Button
        onClick={ () => {
          setRevisionFilter (DefaultFilters.defaultRevisionFilters)  
          setMinorFilter(DefaultFilters.defaultMinorFilters)
        }
        }
      >
      Reset to default
      </Button>
    </Paper>
  );
};

RevisionFilterControls.propTypes = {
  className: PropTypes.string
};

export default RevisionFilterControls;
