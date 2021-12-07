import { createStyles, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => createStyles({
  '@global': {
    '*': {
      boxSizing: 'border-box',
      margin: 0,
      padding: 0,
      fontFamily: 'Roboto'
    },
    html: {
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale',
      height: '100%',
      width: '100%'
    },
    body: {
      backgroundColor: '#f4f6f8',
      height: '100%',
      width: '100%'
    },
    a: {
      textDecoration: 'none'
    },
    '#root': {
      height: '100%',
      width: '100%'
    },
    /* todo change to not be pixels? */
    // these two should be the same
    '.box': {
      margin: '25px 30px 30px 30px',
    },
    '.title': {
      marginBottom: '10px'
    },
    '.subtitle': {
      marginBottom: '8px'
    },
    // x0.5 size of button margin
    // these two have the same margin
    '.tooltip-margin': {
      marginRight: '6px',
      marginLeft: '6px'
    },
    '.tooltip-margin-last': {
      marginLeft: '6px'
    },
    '.text-h2': {
      fontWeight: '500',
      fontSize: '20px',
      color: 'black',
    },
    '.text-h3': {
      fontWeight: '500',
      fontSize: '14px',
      color: 'black',
    }
  }
}));

const GlobalStyles = () => {
  useStyles();

  return null;
};

export default GlobalStyles;
