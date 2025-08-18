(function () {
  'use strict';

  if (!window.React || !window.ReactDOM) {
    return;
  }

  var rootEl = document.getElementById('react-root');
  if (!rootEl) {
    return;
  }

  function App() {
    return React.createElement('div', null,
      React.createElement('div', { style: { marginBottom: '12px' } }, 'Hello from React!'),
      React.createElement('button', {
        onClick: function () { alert('React is wired up.'); }
      }, 'Test React')
    );
  }

  if (window.ReactDOM.createRoot) {
    var root = window.ReactDOM.createRoot(rootEl);
    root.render(React.createElement(App));
  } else {
    window.ReactDOM.render(React.createElement(App), rootEl);
  }
})();


