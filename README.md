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

## Contact

- Email: yuwen.lu@contra.com
- Website: [yuwen.io](https://yuwen.io)
- GitHub: [yuwen-lu](https://github.com/yuwen-lu)
