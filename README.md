# Yuwen Lu - Personal Website

A personal personal website built with React 18, TypeScript, Vite, and Tailwind CSS.

## Features

- React 18 with TypeScript for type safety
- Vite for fast development and optimized builds
- Tailwind CSS for styling
- Framer Motion for animations
- React Router v6 for client-side routing
- Responsive design
- GitHub Pages deployment
- ESLint and testing setup

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Animations**: Framer Motion, AOS
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **Effects**: Canvas Confetti
- **Testing**: Vitest, React Testing Library
- **Linting**: ESLint
- **Deployment**: GitHub Pages

## Prerequisites

- Node.js 16+
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yuwen-lu/yuwen-lu.github.io.git
   cd yuwen-lu.github.io
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

## Deployment

Deployed at [yuwen.io](http://yuwen.io) via GitHub Pages.

To deploy changes:
```bash
npm run deploy
```

This builds the project and pushes the `dist` folder to the `gh-pages` branch.

## Project Structure

```
src/
├── components/          # Reusable components
│   └── Navigation.tsx
├── pages/              # Page components
│   ├── Home.tsx
│   ├── Projects.tsx
│   ├── CV.tsx
│   └── Life.tsx
├── resources/          # Static assets
├── App.tsx             # Main app with routing
├── main.tsx            # Entry point
├── index.css           # Global styles
└── vite-env.d.ts       # Vite types
```

## Configuration

### Styling
- Colors and theme: `tailwind.config.js`
- Typography: Inter font (configurable in Tailwind)

### Build
- Output directory: `dist`
- Source maps enabled for production
- Code splitting configured for vendor and router chunks

## Development

### Hot Reload
Vite provides fast hot module replacement during development.

### Testing
```bash
npm run test
```
Uses Vitest with React Testing Library.

### Linting
```bash
npm run lint
```
ESLint configuration extends React app defaults.

## Browser Support

Modern browsers supporting ES2015+. See `browserslist` in `package.json` for details.

## License

MIT License

## Contact

- Email: ylu5@nd.edu
- Website: yuwen.io
- GitHub: yuwen-lu 