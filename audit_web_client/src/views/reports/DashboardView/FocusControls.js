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
    useTheme,
    Accordion,
    AccordionDetails,
    AccordionSummary
  } from '@material-ui/core';
  import ExpandMoreIcon from '@material-ui/icons/KeyboardArrowDown';
  import MisalignmentFilter from "./MisalignmentFilter";
  import HelpIcon from '@material-ui/icons/Help';

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
        setFocusSelected({
            'prediction_filter': 'very_likely_good',
            'revert_filter': 'reverted',
          })
    }
    return (
      <Button className="text-h3" variant="outlined" onClick={onClick} style={style}>UNEXPECTED REVERTS</Button>
    )
}
const FocusButton2 = ({style, setFocusSelected}) => {
    const onClick = () => {
        //todo: add later?
        setFocusSelected({
            'prediction_filter': 'very_likely_bad',
            'revert_filter': 'nonreverted',
          })
    }
    return (
      <Button className="text-h3" variant="outlined" onClick={onClick} style={style}>UNEXPECTED CONSENSUS</Button>
    )
}
const FocusButton3 = ({style, setFocusSelected}) => {
    const onClick = () => {
        //todo: add later?
        setFocusSelected({
            'prediction_filter': 'confusing',
            'revert_filter': 'any',
          })
    }
    return (
      <Button className="text-h3" variant="outlined" onClick={onClick} style={style}>CONFUSING Edits</Button>
    )
}

const FocusControls = ({className, data, counts, focusSelected, setFocusSelected, ...rest}) => {
    const theme = useTheme()

    const selectedStyle = {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: '12px'}
    const unselectedStyle = {marginRight: '12px'}

    // all margins should be the same
    const focusButton1Style = (focusSelected.prediction_filter === 'very_likely_good' & focusSelected.revert_filter === 'reverted') ? 
        selectedStyle : 
        unselectedStyle
    const focusButton2Style = (focusSelected.prediction_filter === 'very_likely_bad' & focusSelected.revert_filter === 'nonreverted') ? 
        selectedStyle : 
        unselectedStyle
    const focusButton3Style = (focusSelected.prediction_filter === 'confusing' & focusSelected.revert_filter === 'any') ? 
        selectedStyle : 
        unselectedStyle
    //const focusButton2Style = focusSelected === 2 ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: '12px'} : {marginRight: '12px'}
    //const focusButton3Style = focusSelected === 3 ? {backgroundColor: theme.palette.primary.main, color: 'white', marginRight: '12px'} : {marginRight: '12px'}

    const classes = useStyles();


    const [focusControlsPopup, setFocusControlsPopup] = useState();

    const focusControlsOpen = Boolean(focusControlsPopup);
    const focusID = focusControlsOpen ? 'simple-popover' : undefined;

    const handleIconClick = (event) => {
        setFocusControlsPopup(event.currentTarget)
    }

    const handleIconClickClose = () => {
        setFocusControlsPopup(null)
    }

 
    return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
        <Box>
            <Box className='box'>
                <Box className="title text-h2">
                    Focus
                    <IconButton className="tooltip-margin" style={{color:"#717281", height:"24px", width:"24px"}} size="small" onClick={handleIconClick}>
                        <HelpIcon style={{height:"20px"}}/>
                    </IconButton>
                    <Popover
                        id={focusID}
                        open={focusControlsOpen}
                        anchorEl={focusControlsPopup}
                        onClose={handleIconClickClose}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        >
                        <p style={{margin: 5, fontSize: 12}}>
                            Focus Popover Placeholder Text
                        </p>
                    </Popover>
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
                        <FocusButton1 setFocusSelected={setFocusSelected} style={focusButton1Style}></FocusButton1>
                        <FocusButton2 setFocusSelected={setFocusSelected} style={focusButton2Style}></FocusButton2>
                        <FocusButton3 setFocusSelected={setFocusSelected} style={focusButton3Style}></FocusButton3>
                    </Box>
                </Box>

            </Box>
                <Accordion style={{marginTop: "10px", color: "black"}}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                        >
                        <Typography style={{color:"black"}}>Misalignment Graph</Typography>
                    </AccordionSummary>
                    <AccordionDetails>

                        <Box margin="0 auto">
                        <Box>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec semper dolor. Vivamus nec leo interdum, placerat libero nec, tempus diam. Nunc eu neque pulvinar, pulvinar orci ut, fermentum massa. Integer aliquet ante ex, ut maximus nisi hendrerit sed. Aliquam enim quam, aliquet ac dolor venenatis, pretium imperdiet augue. Aliquam blandit vel tortor maximus dapibus. Vivamus sollicitudin ex ac sapien malesuada, id eleifend augue gravida. Proin eleifend, dui non ullamcorper viverra, purus odio pharetra eros, et volutpat nisi risus nec mauris. Suspendisse non urna vel quam eleifend dictum vitae at arcu. Sed at ante vel erat dictum finibus. Vivamus convallis porta aliquam. Curabitur id nibh elit. Integer egestas risus nisi. Aliquam id odio sem.</Box>
                        <MisalignmentFilter counts={counts} data={data} focusSelected={focusSelected} setFocusSelected={setFocusSelected}/>
                        <Box>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec semper dolor. Vivamus nec leo interdum, placerat libero nec, tempus diam. Nunc eu neque pulvinar, pulvinar orci ut, fermentum massa. Integer aliquet ante ex, ut maximus nisi hendrerit sed. Aliquam enim quam, aliquet ac dolor venenatis, pretium imperdiet augue. Aliquam blandit vel tortor maximus dapibus. Vivamus sollicitudin ex ac sapien malesuada, id eleifend augue gravida. Proin eleifend, dui non ullamcorper viverra, purus odio pharetra eros, et volutpat nisi risus nec mauris. Suspendisse non urna vel quam eleifend dictum vitae at arcu. Sed at ante vel erat dictum finibus. Vivamus convallis porta aliquam. Curabitur id nibh elit. Integer egestas risus nisi. Aliquam id odio sem.</Box>
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