# React TypeScript Hello World App

A simple React application with TypeScript, built with Vite for fast development and optimized production builds.

## Project Setup

This project was scaffolded using Vite with the React TypeScript template. All dependencies are automatically installed.

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Folder Structure

```
test/
├── src/
│   ├── App.tsx          # Main React component (Hello World)
│   ├── main.tsx         # Application entry point
│   ├── index.css        # Global styles
│   ├── App.css          # Component styles
│   └── assets/          # Static assets
├── public/              # Static files served directly
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── eslint.config.js     # ESLint configuration
```

## Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in development mode with Hot Module Replacement (HMR).
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### `npm run build`
Builds the app for production to the `dist/` folder.

### `npm run preview`
Previews the production build locally.

### `npm run lint`
Runs ESLint to check code quality.

## Getting Started

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. The app will open at [http://localhost:5173](http://localhost:5173)

## Hello World Component

The main component is located in [src/App.tsx](src/App.tsx) and displays a simple "Hello, World!" message along with a status message indicating the React TypeScript setup is working correctly.

## Technologies Used

- **React 19** - A JavaScript library for building user interfaces
- **TypeScript** - Adds static type checking to JavaScript
- **Vite** - Next generation frontend tooling with instant HMR
- **ESLint** - JavaScript linter for code quality

## Development

The project uses:
- **Hot Module Replacement (HMR)**: Changes in your code are instantly reflected in the browser without full page reloads
- **TypeScript**: Provides type safety and better IDE support
- **ESLint**: Helps maintain code quality and consistency

## Building for Production

To create an optimized production build:

```bash
npm run build
```

The build output will be in the `dist/` folder, ready for deployment.

## Troubleshooting

If you encounter issues:

1. **Clear node_modules and reinstall**:
   ```bash
   rm -r node_modules package-lock.json
   npm install
   ```

2. **Clear Vite cache**:
   ```bash
   rm -r .vite
   npm run dev
   ```

## Learn More

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
