# Yuwen Lu — Personal Website

Personal portfolio for [yuwen.io](https://yuwen.io), built with React, TypeScript, Vite, and Tailwind CSS.

## Local development

Requires Node.js 20.19 or newer and npm.

```bash
npm install
npm run dev
```

The development server runs at [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the Vite development server
- `npm run build` — type-check and create the production build
- `npm run lint` — run ESLint with React and TypeScript rules
- `npm run preview` — preview the production build locally

## Project structure

```text
public/                 Static assets, social preview, and downloadable PDFs
src/
├── components/         Shared navigation, footer, background, and cards
├── pages/              Home, résumé, and events routes
├── resources/          Publication images and files bundled by Vite
├── App.tsx             Routes and page shell
├── index.css           Tailwind entry point and global styles
└── main.tsx            React application entry point
```

## Deployment

The site is deployed on Vercel. `vercel.json` preserves the single-page application routes and redirects.

## /calligraphy

`public/calligraphy/` is a static copy of the calligraphy pages from [p5-brush](https://github.com/yuwen-lu/p5-brush), outside the React app and not linked from the navigation. Don't edit it here: change p5-brush, then run `node tools/export-yuwen.js ../yuwen-lu.github.io/public/calligraphy` from that repository. `vercel.json` serves the pages at `/calligraphy` and `/calligraphy/how-it-works`.

## Contact

- Email: yuwen.lu@contra.com
- Website: [yuwen.io](https://yuwen.io)
- GitHub: [yuwen-lu](https://github.com/yuwen-lu)
