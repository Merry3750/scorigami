# TypeScript Setup for Scorigami

This project now supports TypeScript for client-side React components while maintaining the existing Express server structure.

## Project Structure

```
src/                    # TypeScript source files
├── reactApp.tsx       # Main React app entry point
├── components/        # React components
│   └── ScoreDisplay.tsx
└── types.d.ts         # TypeScript declarations

js/Client/             # Compiled JavaScript (auto-generated)
├── reactApp.js        # Compiled from reactApp.tsx
├── components/        # Compiled components
└── ...                # Other existing JS files

tsconfig.json          # TypeScript configuration
```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch for changes and recompile automatically
- `npm start` - Start the Express server (unchanged)

## How to Use

1. **Write TypeScript React components** in the `src/` directory
2. **Compile to JavaScript** using `npm run build`
3. **The compiled files** automatically go to `js/Client/` where your HTML expects them

## Example Component

```typescript
// src/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
  count: number;
}

function MyComponent(props: MyComponentProps): any {
  return window.React.createElement('div', null,
    window.React.createElement('h2', null, props.title),
    window.React.createElement('p', null, `Count: ${props.count}`)
  );
}

export { MyComponent };
```

## Important Notes

- **No JSX**: Since we're using CDN React, we use `React.createElement()` instead of JSX
- **Global React**: Access React via `window.React` and `window.ReactDOM`
- **Type Safety**: Full TypeScript support with interfaces and type checking
- **Backward Compatible**: Existing JavaScript files in `js/Client/` remain unchanged

## Development Workflow

1. Edit TypeScript files in `src/`
2. Run `npm run build:watch` in a terminal
3. Start your server with `npm start`
4. Changes to TypeScript files will automatically recompile

## Adding New Components

1. Create `.tsx` file in `src/components/`
2. Export your component
3. Import and use in `src/reactApp.tsx`
4. Compile with `npm run build`

The TypeScript setup provides type safety and better development experience while maintaining compatibility with your existing Express server and CDN-based React setup.
