declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOM;
  }
}

declare namespace React {
  function createElement(
    type: string | Function,
    props?: any,
    ...children: any[]
  ): any;
}

declare namespace ReactDOM {
  function render(element: any, container: Element): void;
  function createRoot(container: Element): {
    render(element: any): void;
  };
}

declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {};
