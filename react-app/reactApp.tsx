interface AppProps { }

interface AppState { }

function App(props: AppProps): any {
  const handleClick = (): void => {
    alert('React is wired up with TypeScript!');
  };

  return window.React.createElement('div', null,
    window.React.createElement('div', { style: { marginBottom: '12px' } }, 'Hello from React with TypeScript!'),
    window.React.createElement('button', {
      onClick: handleClick
    }, 'Test React + TypeScript')
  );
}

// Initialize React app when DOM is ready
(function () {
  'use strict';

  if (!window.React || !window.ReactDOM) {
    console.warn('React or ReactDOM not available');
    return;
  }

  const rootEl = document.getElementById('react-root');
  if (!rootEl) {
    console.warn('React root element not found');
    return;
  }

  if (window.ReactDOM.createRoot) {
    const root = window.ReactDOM.createRoot(rootEl);
    root.render(window.React.createElement(App));
  } else {
    window.ReactDOM.render(window.React.createElement(App), rootEl);
  }
})();
