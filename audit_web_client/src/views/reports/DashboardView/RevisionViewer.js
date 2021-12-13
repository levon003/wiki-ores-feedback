import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  makeStyles,
  Divider
} from '@material-ui/core';
import RevisionView from './RevisionView';

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  statusDescription: {
    margin: theme.spacing(1),
  },
}));

const RevisionViewer = ({ className, revisions, ...rest }) => {
  const defaultPreloadMessage = "Loading and retrieving revision data. Please wait a moment."
  
  const classes = useStyles();
  const [displayLimit, /*setDisplayLimit*/] = useState(20);  // TODO Probably want to remember this as a user setting
  const [statusDescription, setStatusDescription] = useState(defaultPreloadMessage);

  // Want state to track total available at multiple levels. Probably want to store it one state dictionary, since each should change only "one at a time"...
  const [prefilteredTotal, /*setPrefilteredTotal*/] = useState(0);
    
  useEffect(() => {
    // TODO Actually retrieve a set of revisions here by querying the backend
    // JK, we're actually doing this in index and passing them in.  
    // Perhaps the expected behavior is to move loading status into the index, and just include a rev count in this component.
    setStatusDescription('Loaded revisions; change filters or use page controls to see more.')
  }, []);
    
  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >

      <Box>
        <Box className='box'>
            <Box className="title text-h2">
                Inspect
            </Box>

            {/* top text section */}
            <Box style= {{ overflow: "auto"}}>
                <Box
                    display="flex"
                    flexDirection="column"
                    style= {{ display: "inline-flex", float: "left"}}
                  >
                    <Box className="text-h3 subtitle">
                      {/* todo: add correct updating text line */}
                      [Inspecting 6.7 million revisions in namespace 0]
                    </Box>
                </Box>

                <Box
                  display="flex"
                  flexDirection="column"
                  style= {{ display: "inline-flex", float: "right"}}
                >
                    <Box className="text-h3 subtitle" style = {{ color: "#C7C7C7"}}>
                      [0 out of 10 damaging (00.00%)]
                    </Box>
                </Box>
            </Box>


            <Divider style={{marginTop: "14px", marginBottom: "22px"}}></Divider>


            {/* revisions section */}
            <Box
              display="flex"
              flexDirection="column"
              flexWrap="nowrap"
              alignItems="center"
            >
                {revisions.map((revision) => (
                    <Box key={revision.rev_id}>
                      <RevisionView 
                        key={revision.rev_id} 
                        revision={revision} 
                      />
                    </Box>
                ))}
            </Box>

        </Box>

      </Box>
    </Card>
  );
};

RevisionViewer.propTypes = {
  className: PropTypes.string
};

export default RevisionViewer;
