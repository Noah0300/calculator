# React TypeScript Hello World App - Copilot Instructions

This is a basic React application with TypeScript, set up with Vite for fast development and optimized production builds.

## Project Overview

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Package Manager**: npm

## Key Files and Directories

- `src/App.tsx` - Main React component displaying "Hello, World!"
- `src/main.tsx` - Application entry point
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts

## Common Tasks

### Running the Development Server
```bash
npm run dev
```
This will start the Vite dev server at http://localhost:5173 with Hot Module Replacement enabled.

### Building for Production
```bash
npm run build
```
Creates an optimized production build in the `dist/` folder.

### Linting Code
```bash
npm run lint
```
Checks code quality using ESLint.

## Development Workflow

1. Edit files in the `src/` directory
2. Changes will be instantly reflected in the browser with HMR
3. Use TypeScript for type safety
4. Run `npm run lint` to check code quality
5. Build with `npm run build` when ready to deploy

## Project Structure

```
src/
├── App.tsx          - Main component
├── App.css          - Component styles
├── main.tsx         - Entry point
├── index.css        - Global styles
└── assets/          - Static assets
```

## Notes

- This is a minimal setup focused on the "Hello, World!" example
- The ESLint configuration can be extended for production applications
- Dependencies are already installed; run `npm install` if needed after cloning
