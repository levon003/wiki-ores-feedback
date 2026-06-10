import { createTheme, colors, adaptV4Theme } from '@mui/material';
import shadows from './shadows';
import typography from './typography';

const theme = createTheme(adaptV4Theme({
  palette: {
    background: {
      dark: '#F4F6F8',
      default: colors.common.white,
      paper: colors.common.white
    },
    primary: {
      main: colors.indigo[500]
    },
    secondary: {
      main: colors.indigo[500]
    },
    text: {
      primary: colors.blueGrey[900],
      secondary: colors.blueGrey[600]
    }
  },
  shadows,
  typography
}));

export default theme;
