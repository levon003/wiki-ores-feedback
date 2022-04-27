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

export const LoggingContext = createContext()

const handleLogging = (change) => {
    fetch('/api/activity_log/', {
    method: 'POST', 
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      activity_type: 'test',
      new_state: change,
    })
  })
  .then(res => {
    if (res.ok) {
      console.log("Logged change.");
    } else {
      console.warn("Failed to log :(.");
    }
  });
}

const App = () => {
  const routing = useRoutes(routes);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const value = useMemo(
    () => ({ drawerOpen, setDrawerOpen }), 
    [drawerOpen]
  );

  return (
    <DrawerContext.Provider value={value}>
      <LoggingContext.Provider value={handleLogging}>
        <ThemeProvider theme={theme}>
          <GlobalStyles />
          {routing}
        </ThemeProvider>
      </LoggingContext.Provider>
    </DrawerContext.Provider>
  );
};

export default App;
