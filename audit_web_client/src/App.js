import 'react-perfect-scrollbar/dist/css/styles.css';
import React, { useState, createContext, useMemo } from 'react';
import { useRoutes } from 'react-router-dom';
import { ThemeProvider } from '@material-ui/core';
import GlobalStyles from 'src/components/GlobalStyles';
import 'src/mixins/chartjs';
import theme from 'src/theme';
import routes from 'src/routes';

export const LoadingContext = createContext({
  loading: false,
  success: null,
  setLoading: () => {}
})

const App = () => {
  const routing = useRoutes(routes);
  const [loading, setLoading] = useState(false);
  const value = useMemo(
    () => ({ loading, setLoading }), 
    [loading]
  );

  return (
    <LoadingContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        {routing}
      </ThemeProvider>
    </LoadingContext.Provider>
  );
};

export default App;
