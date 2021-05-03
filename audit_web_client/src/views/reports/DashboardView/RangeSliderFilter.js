import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

const useStyles = makeStyles({
  root: {
    width: 380,
  },
});

function valuetext(value) {
  // for accessibility
  return `${value} revisions`;
}

const marks = [
    {
      value: 0,
      label: '1',
    },
    {
      value: 1,
      label: '2',
    },
    {
      value: 2,
      label: '3',
    },
    {
      value: 3,
      label: '5',
    },
    {
      value: 4,
      label: '10',
    },
    {
      value: 5,
      label: '100+',
    },
  ];
  

function valueLabelFormat(value) {
  return marks.findIndex((mark) => mark.value === value) + 1;
}

function getFilterSummary(low_value, high_value) {
  if (low_value === high_value) {
    if (high_value === 5) {
      return "100 or more revisions"
    } else {
      const label = marks[marks.findIndex((mark) => mark.value === low_value)].label;
      if (label === '1') {
        return "exactly " + label + " revision";
      } else {
        return "exactly " + label + " revisions";
      }
    }
  } else {
    const low_label = marks[marks.findIndex((mark) => mark.value === low_value)].label;
    const high_label = marks[marks.findIndex((mark) => mark.value === high_value)].label;
    if (high_value === 5 & low_value === 0) {
      return "any number of revisions"
    } else if (high_value === 5) {
      return low_label + " or more revisions";
    } else if (low_value === 0) {
      return "no more than " + high_value + " revisions";
    } else {
      return "between " + low_label + " and " + high_label + " revisions";
    }
  }
  
}

export default function RangeSlider() {
  const classes = useStyles();
  // this is the value for the slider, from low-value to high-value
  const [value, setValue] = React.useState([2, 5]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <Typography id="range-slider" gutterBottom>
        Page activity: include pages with {getFilterSummary(value[0], value[1])} in 2019
      </Typography>
      <Slider
        value={value}
        onChange={handleChange}
        valueLabelFormat={valueLabelFormat}
        getAriaValueText={valuetext}
        step={null}
        marks={marks}
        min={0}
        max={5}
      />
    </div>
  );
}
