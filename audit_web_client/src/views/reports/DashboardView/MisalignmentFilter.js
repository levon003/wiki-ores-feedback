import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import "../DashboardView/styles.css";
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { Tooltip as TT } from "react-svg-tooltip";

import {
  Button,
  Box,
  Tooltip,
  makeStyles
} from '@material-ui/core';
// function getWindowDimensions() {
//   const { innerWidth: width, innerHeight: height } = window;
//   return {
//     width,
//     height
//   };
// }

// function useWindowDimensions() {
//   const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
//   useEffect(() => {
//     function handleResize() {
//       setWindowDimensions(getWindowDimensions());
//     }
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);
//   return windowDimensions;
// }

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
  textField: { //used for the search bar
    width: '98%',
    margin: theme.spacing(1),
  },
  table: {
    minWidth: 80,
  },
  nodeText: {
    fontSize: 6,
    fontFamily: "Georgia",
    fill: 'black',
  },
  bigbox: {
    width: 77.146,
    height: "12%",
    stroke: "rgb(0,0,0)",
    strokeWidth: "0.7",
    display: "inline",
    ry: 1.875
  },
  middleNodeText: {
    fontSize: 4.5,
    fontFamily: "Georgia",
    fill: 'black'
  },
  edge: {
    fillRule: "evenodd",
    className: "bar",
    pointerEvents: "all",
    strokeLinecap: "butt",
    strokeWidth: 12
  },
  edgetooltip: {
    x: -3,
    y : -3,
    width : 180,
    height : 15,
    rx : 0.5, 
    ry : 0.5, 
    fill : "#F2F4F2",
    stroke : "#727372",
    strokeWidth : 0.1
  }
}));

const MisalignmentFilter = ({ data, onChange, className, ...rest }) => {
  const [activeFilters, setActiveFilters] = useState({
    'prediction_filter': null,
    'revert_filter': null,
  });
  const [strokecolor, setStrokeColor] = useState({
    'vlhp_box': "#eeeeee",
    'itm_box': "#eeeeee",
    'lg_box': "#eeeeee",
    'nr_box': "#eeeeee",
    'r_box': "#eeeeee",
    'vlhp_nr_box': "white",
    'vlhp_r_box': "white",
    'itm_nr_box': "white",
    'itm_r_box': "white",
    'lg_nr_box': "white",
    'lg_r_box': "white",
    'vlhp_edge_nr': "#ea9999",
    'vlhp_edge_r': "#ea9999",
    'itm_edge_nr': "#f9cb9c",
    'itm_edge_r': "#f9cb9c",
    'lg_edge_nr': "#b6d7a8",
    'lg_edge_r': "#b6d7a8"
  });

  function handleClick(prediction_filter, revert_filter) {
    // Based on the click event, set prediction filter and revert filter
    // If a prediction box was checked, then set prediction_filter to be the name of the box
    // e.g. prediction_filter = 'vlb';
    // If an edge was checked, need to set both,
    // e.g. prediction_filter = 'vlb'; AND revert_filter = 'reverted';
    let new_filter_value = {
      'prediction_filter': null,
      'revert_filter': null,
    };

    let new_colors = {
      'vlhp_box': "#eeeeee",
      'itm_box': "#eeeeee",
      'lg_box': "#eeeeee",
      'nr_box': "#eeeeee",
      'r_box': "#eeeeee",
      'vlhp_nr_box': "white",
      'vlhp_r_box': "white",
      'itm_nr_box': "white",
      'itm_r_box': "white",
      'lg_nr_box': "white",
      'lg_r_box': "white",
      'vlhp_edge_nr': "#ea9999",
      'vlhp_edge_r': "#ea9999",
      'itm_edge_nr': "#f9cb9c",
      'itm_edge_r': "#f9cb9c",
      'lg_edge_nr': "#b6d7a8",
      'lg_edge_r': "#b6d7a8"
    };

    if (activeFilters.revert_filter !== revert_filter || activeFilters.prediction_filter !== prediction_filter) {
      new_filter_value = {
        'prediction_filter': prediction_filter,
        'revert_filter': revert_filter,
      };
      console.log(revert_filter + "_" + prediction_filter)
      console.log(activeFilters.revert_filter)
      console.log("shi")
      var i;
      var rs = ["r", "nr"]
      var ps = ["vlhp", "itm", "lg"];
      if(new_filter_value.revert_filter === "both"){ // If clicks on one of the right boxes (reverted, not reverted)
        for (i = 0; i < rs.length; i++){
          let edgeboxr = prediction_filter + "_" + rs[i] + "_box";
          let edger = prediction_filter + "_edge_" + rs[i];
          let rboxr = rs[i] + "_box";
          new_colors[edgeboxr] = "#FFFBCC"
          new_colors[edger] = "#169eec"  
          new_colors[rboxr] = "#FFFBCC"
        }
        let box = prediction_filter + "_box";
        new_colors[box] = "#FFFBCC"
      } else if (new_filter_value.prediction_filter === "all"){ // If clicks on one of the left boxes (likely good, in the middle, etc)
        let rboxr = revert_filter + "_box";
        new_colors[rboxr] = "#FFFBCC"
        for (i = 0; i < ps.length; i++){
          let box = ps[i] + "_box";
          let edgeboxr = ps[i] + "_" + revert_filter + "_box";
          let edger = ps[i] + "_edge_" + revert_filter;
          new_colors[box] = "#FFFBCC"
          new_colors[edgeboxr] = "#FFFBCC"
          new_colors[edger] = "#169eec"  
        }
        let box = prediction_filter + "_box";
        new_colors[box] = "#FFFBCC"
      } else { // If clicks on an edge, or a box on the edge
        let box = prediction_filter + "_box";
        let edgebox = prediction_filter + "_" + revert_filter + "_box";
        let edge = prediction_filter + "_edge_" + revert_filter;
        let rbox = revert_filter + "_box";
        new_colors[box] = "#FFFBCC"
        new_colors[edgebox] = "#FFFBCC"
        new_colors[edge] = "#169eec"  
        new_colors[rbox] = "#FFFBCC"
      }
    }
    setActiveFilters(new_filter_value);
    setStrokeColor(new_colors);
    onChange(new_filter_value);
  }

  function FlowchartSummarySVG(props) {
    const classes = useStyles();

    let total_R = props.data["confrevs_r"] + props.data["vlg_r"] + props.data["vlhp_r"];
    let total_nr = props.data["confrevs_nr"] + props.data["vlg_nr"] + props.data["vlhp_nr"];
    let total = total_R + total_nr;
    const myRef = useRef();

    let svg = <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="120mm"
      version="1.1"
      viewBox="0 0 297 210"
    aspectratio="1.0"
    >
      <g>
        <g
          fill="none"
          stroke="none"
          strokeLinecap="square"
          strokeMiterlimit="10"
          transform="matrix(.31656 0 0 .35138 -9.827 14.741)"
        >
          <g clipPath="url(#gbca5694407_1_37.0)">
            <path fill="#fff" fillRule="evenodd" d="M0 0h960v540H0z"></path>
            <path
              className={clsx(classes.root, "bar", classes.edge)}
              stroke={strokecolor.vlhp_edge_r}
              ref={myRef}
              onClick={() => handleClick("vlhp", "r")}
              d="M303.165 88.732c97.057 0 145.587 86.874 194.114 173.748 24.264 43.437 48.528 86.874 78.857 119.452 15.164 16.289 31.845 29.863 50.8 39.365a140.772 140.772 0 0014.656 6.341 137.801 137.801 0 008.645 2.849l.41.118 M650.647 430.606l-15.213 11.523 38.574-8.3-34.884-18.437z"
            ></path>
            <TT triggerRef={myRef}>
              <rect
                className={clsx(classes.root, classes.edgetooltip)}
              />
              <text x={5} y={5} fontSize={6} fill="black">
                Of {props.data["vlhp_r"]+props.data["vlhp_nr"]} very likely have problems revisions, {props.data["vlhp_r"]} were reverted. 
              </text>
            </TT>
            <path
              className={clsx(classes.root, "bar", classes.edge)}
              stroke={strokecolor.itm_edge_nr} 
              ref={myRef} 
              onClick={() => handleClick("itm", "nr")}
              d="M303.157 262.48c99.205 0 148.808-43.433 198.41-86.866 24.801-21.716 49.602-43.433 80.604-59.72 15.5-8.144 32.551-14.93 51.927-19.68a242.697 242.697 0 0114.98-3.171 255.716 255.716 0 019.838-1.566l.026-.004 M658.942 91.473l-12.571 14.36 36.101-15.922-37.89-11.009z"
            ></path>
            <TT triggerRef={myRef}>
              <rect
                width={100}
                className={clsx(classes.root, classes.edgetooltip)}
                
              />
              <text x={5} y={5} fontSize={6} fill="black">
                Of {props.data["confrevs_r"]+props.data["confrevs_nr"]} confusing revisions, {props.data["confrevs_nr"]} were not reverted. 
              </text>
            </TT>
            <path
              className={clsx(classes.root, "bar", classes.edge)}
              stroke={strokecolor.lg_edge_r}
              ref={myRef}
              onClick={() => handleClick("lg", "r")}
              d="M303.165 436.228c97.057 0 145.587.016 194.114.032a535009.633 535009.633 0 00129.658.028l23.324.001 M650.26 436.29l-13.495 13.494 37.078-13.493-37.077-13.497z"
            ></path>
             <TT triggerRef={myRef}>
              <rect
                className={clsx(classes.root, classes.edgetooltip)}
              />
              <text x={5} y={5} fontSize={6} fill="black">
                Of {props.data["vlg_r"]+props.data["vlg_nr"]} likely good revisions, {props.data["vlg_r"]} were reverted. 
              </text>
            </TT>
            <path
              className={clsx(classes.root, "bar", classes.edge)}
              stroke={strokecolor.lg_edge_nr}
              ref={myRef}
              onClick={() => handleClick("lg", "nr")}
              d="M303.165 436.228c99.203 0 148.803-86.874 198.406-173.748 24.801-43.437 49.603-86.874 80.605-119.451 15.501-16.29 32.552-29.863 51.929-39.365a145.597 145.597 0 0114.98-6.342 143.098 143.098 0 019.838-3.131l.29-.08 M659.212 94.11l-11.614 15.145 34.994-18.228-38.524-8.53z"
            ></path>
             <TT triggerRef={myRef}>
              <rect
                className={clsx(classes.root, classes.edgetooltip)}
              />
              <text x={5} y={5} fontSize={6} fill="black">
                Of {props.data["vlg_r"]+props.data["vlg_nr"]} likely good revisions, {props.data["vlg_nr"]} were not reverted. 
              </text>
            </TT>
            <path
              className={clsx(classes.root, "bar", classes.edge)}
              stroke={strokecolor.vlhp_edge_nr}
              ref={myRef}
              onClick={() => handleClick("vlhp", "nr")}
              d="M303.165 88.732c99.203 0 148.803.016 198.406.032a588863.83 588863.83 0 00132.534.029h24.754 M658.86 88.794l-13.496 13.494 37.077-13.493-37.076-13.497z"
            ></path>
            <TT triggerRef={myRef}>
              <rect
                className={clsx(classes.root, classes.edgetooltip)}
              />
              <text x={5} y={5} fontSize={6} fill="black">
                Of {props.data["vlhp_r"]+props.data["vlhp_nr"]} very likely have problems revisions, {props.data["vlhp_nr"]} were not reverted. 
              </text>
            </TT>
            <path
              className={clsx(classes.root, "bar", classes.edge)}
              stroke={strokecolor.itm_edge_r}
              ref={myRef}
              onClick={() => handleClick("itm", "r")}
              d="M303.157 262.48c97.06 0 145.587 43.441 194.119 86.882 24.265 21.72 48.532 43.441 78.866 59.732 15.167 8.145 31.85 14.932 50.809 19.684a233.002 233.002 0 0014.657 3.17c2.518.462 5.074.889 7.67 1.28l1.106.162 M650.384 433.39l-14.4 12.526 37.925-10.89-36.051-16.035z"
            ></path>
            <TT triggerRef={myRef}>
              <rect
                className={clsx(classes.root, classes.edgetooltip)}
              />
              <text x={5} y={5} fontSize={6} fill="black">
                Of {props.data["confrevs_r"]+props.data["confrevs_nr"]} confusing revisions, {props.data["confrevs_r"]} were reverted. 
              </text>
            </TT>
          </g>
        </g>
      </g>
      <g fill="#00f" fillRule="evenodd">
        <rect
          className = {clsx(classes.root,  classes.bigbox)}
          fill={strokecolor.vlhp_box}
          x="3.326%"
          y="16%"
          ref={myRef}
          onClick={() => handleClick("vlhp", "both")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="5.5%" y="21%"> Very likely have problems </text>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="5.5%" y="25%">Score {'>'} 0.9</text>
        <rect
          fill={strokecolor.r_box}
          x="70.45%"
          y="74%"
          className={clsx(classes.root, classes.bigbox)}
          onClick={() => handleClick("all", "r")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="72.8%" y="79%" > Reverted </text>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="72.8%" y="83%" fontFamily="Georgia" fontSize="6" fill="black"> {total_R} revisions ({Math.round(total_R / total * 10000) / 100} %)</text>

        <rect
          className = {clsx(classes.root,  classes.bigbox)}
          onClick={() => handleClick("all", "nr")}
          x="70.6%"
          y="16%"
          fill={strokecolor.nr_box}
          ref={myRef}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="72.8%" y="21%" fontFamily="Georgia" fontSize="6" fill="black"> Not Reverted </text>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="72.8%" y="25%" fontFamily="Georgia" fontSize="6" fill="black"> {total_nr} revisions ({Math.round(total_nr / total * 10000) / 100} %)</text>
        <rect
          fill={strokecolor.itm_box}
          // onClick={handleClick}
          x="3.326%"
          y="45%"
          className = {clsx(classes.root,  classes.bigbox)}
          onClick={() => handleClick("itm", "both")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="5.5%" y="50%" fontFamily="Georgia" fontSize="6" fill="black">In the middle  </text>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="5.5%" y="54%" fontFamily="Georgia" fontSize="6" fill="black">(0.9 - 0.05) </text>
        <rect
          className = {clsx(classes.root,  classes.bigbox)}
          fill={strokecolor.lg_box}
          x="3.326%"
          y="74%"
          onClick={() => handleClick("lg", "both")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="5.5%" y="79%" fontFamily="Georgia" fontSize="6" fill="black"> Likely good </text>
        <text className={clsx(classes.root, "svgText", classes.nodeText)} x="5.5%" y="83%" fontFamily="Georgia" fontSize="6" fill="black">(0.9 - 0.05) </text>
        <rect
          fill={strokecolor.vlhp_nr_box}
          stroke="rgb(0,0,0)"
          width="57"
          height="8.8%"
          x="38.8%"
          y="15.2%"
          strokeWidth="0.7"
          text="hello"
          display="inline"
          ry="0"
          className="box"
          onClick={() => handleClick("vlhp", "nr")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.middleNodeText)} x="39.8%" y="19.2%"> {props.data["vlhp_nr"]} revisions  </text>
        <text className={clsx(classes.root, "svgText", classes.middleNodeText)} x="39.8%" y="22.2%"> {Math.round(props.data["vlhp_nr"] / total_nr * 10000) / 100} % of not reverted </text>
        <rect
          fill={strokecolor.lg_r_box}
          stroke="rgb(0,0,0)"
          // onClick={handleClick}
          width="57"
          height="9%"
          x="38.8%"
          y="77.8%"
          strokeWidth="0.7"
          text="hello"
          display="inline"
          ry="0"
          className="box"
          onClick={() => handleClick("lg", "r")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.middleNodeText)} x="39.8%" y="81.8%" > {props.data["vlg_r"]} misaligned revisions  </text>
        <text className={clsx(classes.root, "svgText", classes.middleNodeText)} x="39.8%" y="84.8%" > {Math.round(props.data["vlg_r"] / total_R * 10000) / 100} % of reverted </text>

        <rect 
          fill={strokecolor.vlhp_r_box}
          stroke="rgb(0,0,0)"
          // onClick={handleClick}
          width="20"
          height="6%"
          x="38.8%"
          y="25.8%"
          strokeWidth="0.7"
          text="hello"
          display="inline"
          ry="0"
          className="box"
          onClick={() => handleClick("vlhp", "r")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.middleNodeText)} x="39.8%" y="29.8%" > {props.data["vlhp_r"]} </text>

        <rect 
          fill={strokecolor.itm_nr_box}
          stroke="rgb(0,0,0)"
          // onClick={handleClick}
          width="20"
          height="6%"
          x="38.8%"
          y="43%"
          strokeWidth="0.7"
          text="hello"
          display="inline"
          ry="0"
          className="box"
          onClick={() => handleClick("itm", "nr")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.middleNodeText)} x="39.8%" y="47%" > {props.data["confrevs_nr"]} </text>
        <rect data-name="haha"
          fill={strokecolor.itm_r_box}
          stroke="rgb(0,0,0)"
          // onClick={handleClick}
          width="20"
          height="6%"
          x="38.8%"
          y="53%"
          strokeWidth="0.7"
          text="hello"
          display="inline"
          ry="0"
          className="box"
          onClick={() => handleClick("itm", "r")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.middleNodeText)} x="39.8%" y="57%"> {props.data["confrevs_r"]} </text>
        <rect data-name="haha"
          fill={strokecolor.lg_nr_box}
          stroke="rgb(0,0,0)"
          // onClick={handleClick}
          width="20"
          height="6%"
          x="38.8%"
          y="68.7%"
          strokeWidth="0.7"
          text="hello"
          display="inline"
          ry="0"
          className="box"
          onClick={() => handleClick("lg", "nr")}
        ></rect>
        <text className={clsx(classes.root, "svgText", classes.middleNodeText)} x="39.8%" y="72.5%"> {props.data["vlg_nr"]} </text>

      </g>
    </svg>;
    return svg;

  }



  function SelectionButtonGrid(props) {
    const total_R = props.data["confrevs_r"] + props.data["vlg_r"] + props.data["vlhp_r"];
    return <Grid container justify="center">
      <Grid item>
        <HtmlTooltip
          title={
            <React.Fragment>
              <Typography color="inherit"> Non-reverted revisions that ORES thinks are very likely to have problems (damaging/vandalism) </Typography>
              {/* <em>{}</em> <b>{'some'}</b> <u>{props.data["vlg_r"]  +" revs (" + Math.round(props.data["vlg_r"]/total_R * 10000) / 100  }</u>.{' '} */}
              {props.data["vlhp_r"] + " revs (" + Math.round(props.data["vlhp_r"] / total_R * 10000) / 100 + "% of all non-reverted revs)"}
            </React.Fragment>
          }
        >
          <Button variant='outlined'>Investigate unexpected consensus</Button>
        </HtmlTooltip>
        <HtmlTooltip
          title={
            <React.Fragment>
              <Typography color="inherit"> Reverted revisions that ORES thinks are very likely good (non-damaging) </Typography>
              {/* <em>{}</em> <b>{'some'}</b> <u>{props.data["vlg_r"]  +" revs (" + Math.round(props.data["vlg_r"]/total_R * 10000) / 100  }</u>.{' '} */}
              {props.data["vlg_r"] + " revs (" + Math.round(props.data["vlg_r"] / total_R * 10000) / 100 + "% of all reverted revs)"}
            </React.Fragment>
          }
        >
          <Button variant='outlined'>Investigate unexpected reverts</Button>
        </HtmlTooltip>
        <HtmlTooltip
          title={
            <React.Fragment>
              <Typography color="inherit"> Revisions that ORES wasn’t sure about  </Typography>
              {/* <em>{}</em> <b>{'some'}</b> <u>{props.data["vlg_r"]  +" revs (" + Math.round(props.data["vlg_r"]/total_R * 10000) / 100  }</u>.{' '} */}
              {props.data["confrevs_r"] + " revs (" + Math.round(props.data["confrevs_r"] / total_R * 10000) / 100 + "% of all revs) (0.301 < ORES score < 0.944)"}
            </React.Fragment>
          }
        >
          <Button variant='outlined'>Investigate confusing revisions</Button>
        </HtmlTooltip>
      </Grid>
    </Grid>
  }
  // const { height, width } = useWindowDimensions();
  // const originalWidth = 519;
  // const originalHeight = 260;
  // const aspectRatio = originalWidth / originalHeight;
  // const windowWidth = width;
  // const windowHeight = height;
  const HtmlTooltip = withStyles((theme) => ({
    tooltip: {
      backgroundColor: '#f5f5f9',
      color: 'rgba(0, 0, 0, 0.87)',
      maxWidth: 220,
      fontSize: theme.typography.pxToRem(12),
      border: '1px solid #dadde9',
    },
  }))(Tooltip);

  return (
  <Box>
    <Box 
      width='100%'
      position='relative'
      display='flex'
      alignItems='center'
      justifyContent='center'
    >
      <FlowchartSummarySVG data={data} />
    </Box>
    <SelectionButtonGrid data={data} />
  </Box>
  );
};

MisalignmentFilter.propTypes = {
  className: PropTypes.string
};

export default MisalignmentFilter;
