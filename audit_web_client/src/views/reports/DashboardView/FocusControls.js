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


const FocusButton1 = ({style, setFocusSelected}) => {
    const onClick = () => {
        //todo: add later?
        setFocusSelected(1)
    }
    return (
      <Button className="text-h3" variant="outlined" onClick={onClick} style={style}>UNEXPECTED REVERTS</Button>
    )
}
const FocusButton2 = ({style, setFocusSelected}) => {
    const onClick = () => {
        //todo: add later?
        setFocusSelected(2)
    }
    return (
      <Button className="text-h3" variant="outlined" onClick={onClick} style={style}>UNEXPECTED CONSENSUS</Button>
    )
}
const FocusButton3 = ({style, setFocusSelected}) => {
    const onClick = () => {
        //todo: add later?
        setFocusSelected(3)
    }
    return (
      <Button className="text-h3" variant="outlined" onClick={onClick} style={style}>CONFUSING REVISIONS</Button>
    )
}

const FocusControls = ({className, data, onChange, focusSelected, setFocusSelected, ...rest}) => {
    const theme = useTheme()

    // all margins should be the same
    const focusButton1Style = focusSelected === 1 ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: '12px'} : {marginRight: '12px'}
    const focusButton2Style = focusSelected === 2 ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: '12px'} : {marginRight: '12px'}
    const focusButton3Style = focusSelected === 3 ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: '12px'} : {marginRight: '12px'}

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
                        <FocusButton1 setFocusSelected={setFocusSelected} style={focusButton1Style}></FocusButton1>
                        <FocusButton2 setFocusSelected={setFocusSelected} style={focusButton2Style}></FocusButton2>
                        <FocusButton3 setFocusSelected={setFocusSelected} style={focusButton3Style}></FocusButton3>
                    </Box>
                </Box>

            </Box>
                <Accordion style={{marginTop: "10px"}}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                        >
                        <Typography>Misalignment Graph</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box margin="0 auto">
                        <MisalignmentFilter data={data} onChange={onChange}/>
                        </Box>
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