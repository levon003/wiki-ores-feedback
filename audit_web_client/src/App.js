import 'react-perfect-scrollbar/dist/css/styles.css';
import React, { useState, createContext, useMemo } from 'react';
import { useRoutes } from 'react-router-dom';
import { ThemeProvider } from '@material-ui/core';
import GlobalStyles from 'src/components/GlobalStyles';
import 'src/mixins/chartjs';
import theme from 'src/theme';
import routes from 'src/routes';

export const DrawerContext = createContext({
  drawerOpen: false,
  setDrawerOpen: () => {}
})

const App = () => {
  const routing = useRoutes(routes);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const value = useMemo(
    () => ({ drawerOpen, setDrawerOpen }), 
    [drawerOpen]
  );

  return (
    <DrawerContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        {routing}
      </ThemeProvider>
    </DrawerContext.Provider>
  );
};

export default App;
