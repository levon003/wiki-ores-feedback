import React from "react"

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
    useTheme,
    Accordion,
    AccordionDetails,
    AccordionSummary
  } from '@material-ui/core';
  import ExpandMoreIcon from '@material-ui/icons/KeyboardArrowDown';
  import MisalignmentFilter from "./MisalignmentFilter";

const useStyles = makeStyles((theme) => ({
    root: {},
    actions: {
        justifyContent: 'flex-end'
    },
    nestedList: {
        paddingLeft: theme.spacing(4),
    },
}));


const FocusButton = ({buttonText, style}) => {
    const onClick = () => {
        // todo: add
    }
    return (
      <Button className="text-h3" variant="outlined" onClick={onClick} style={style}>{buttonText}</Button>
    )
}
// all margins should be the same
const focusButton1Style = {marginRight: '10px'}
const focusButton2Style = {marginRight: '10px'}
const focusButton3Style = {}

const FocusControls = ({className, data, onChange, ...rest}) => {

    const classes = useStyles();

 
    return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
        <Box>
            <Box className='box'>
                <Box className="title text-h2">
                    Focus
                </Box>

                <Box style= {{ overflow: "auto"}}>
                    <Box
                        display="flex"
                        flexDirection="column"
                        style= {{ display: "inline-flex", float: "left"}}
                    >
                    <Box className="text-h3 subtitle">
                        Investigate
                    </Box>

                    <Box
                        display="flex"
                        flexDirection="row"
                        style= {{ display: "inline-flex"}}
                    >
                        {/* add tooltips here */}
                        <FocusButton buttonText="UNEXPECTED REVERTS" style={focusButton1Style}></FocusButton>
                        <FocusButton buttonText="UNEXPECTED CONSENSUS" style={focusButton2Style}></FocusButton>
                        <FocusButton buttonText="CONFUSING REVISIONS" style={focusButton3Style}></FocusButton>
                    </Box>
                </Box>

            </Box>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                        >
                        <Typography>Misalignment Graph</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <MisalignmentFilter data={data} onChange={onChange}/>
                    </AccordionDetails>
                </Accordion>
        </Box>

      </Box>
    </Card>
    )
}

FocusControls.propTypes = {
    className: PropTypes.string
};

export default FocusControls