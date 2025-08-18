import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import FAQ from './components/FAQ';
import { createTheme, MantineProvider } from '@mantine/core'

function App(): React.ReactElement {

  const theme = createTheme({
    fontFamily: 'Open Sans, sans-serif',
    primaryColor: 'green',
  });

  return <MantineProvider theme={theme}>
    <FAQ />
  </MantineProvider>;
}

(function mount() {
  const domNode = document.getElementById('react-root');
  if (!domNode) return;
  const root = ReactDOM.createRoot(domNode);
  root.render(<App />);
})();
