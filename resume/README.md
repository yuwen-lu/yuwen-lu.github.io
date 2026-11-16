# Resume source

This reproduces the existing Figma resume with a reusable HTML/CSS template and
locally embedded Geist. The current version prioritizes professional experience,
education, and selected highlights, with more readable type and spacing.

## Update and export

1. Edit `resume/content.json`. Text supports `**bold**` and `[label](https://url)`.
   Keep factual changes limited to information the owner provides.
   `showProjects` is currently `false` to keep the one-page resume focused.
   Project details remain in the JSON for future targeted versions; setting it
   to `true` restores that section, subject to the same page-fit checks.
2. Run `npm run resume:pdf`. Dependencies come from the repository's `npm install`.
   The exporter uses Playwright's Chromium if installed, or local Google Chrome.
   To install the pinned Chromium renderer, run `npx playwright install chromium`.
3. Inspect `output/pdf/resume-yuwen-lu.pdf` and `output/resume/preview.png`.
   With Vite running, open `/output/resume/preview.html` for an HTML preview.
4. To replace the website's downloadable resume after reviewing it, run
   `npm run resume:pdf -- --publish`. This only updates the local PDF file;
   committing and deploying the website are separate steps.

The generator embeds the Latin variable Geist and Geist Mono fonts from
`@fontsource-variable/geist` and `@fontsource-variable/geist-mono` (OFL-1.1, see
the packages' `LICENSE` files). Company names appear first in semibold Geist,
followed by smaller Geist Mono job titles on the same line. Dates and locations
appear below them. The current template uses no company logos or separator dots.
Contact details sit directly below the name, without a separate heading.
Experience descriptions use a small gap between items instead of bullet dots or
indentation. The right page padding is 132 source units (about 72.8 CSS pixels),
roughly 5.5 pixels less than the original padding, to give descriptions more room.
Education titles and short highlight descriptions use balanced wrapping to avoid
isolated final words.
The top page padding is 210 source units (about 116 CSS pixels), increased from
the original 90 source units to move the content lower without stretching gaps.
Experience entries use slightly more separation to align the two column bottoms:
55 source units on screen and 56 in print, accounting for font-rendering differences.
The generator makes no network requests during export.
Font files are embedded in the preview HTML and PDF; no font CDN is needed.

`npm run resume:preview` regenerates just the self-contained HTML, without a browser.
`RESUME_BROWSER_CHANNEL=chrome npm run resume:pdf` explicitly selects Google Chrome.

## Layout and quality rules

- `template.html` controls structure; `styles.css` controls the design.
- The paper is A4, with the original Figma frame's proportions scaled to print.
  `--u` converts the original 1440-wide frame's units to physical lengths.
- Preserve the two columns, typography, section hierarchy, and underlined links.
- Content flows naturally within each column. Do not position individual entries
  with absolute coordinates or insert manual line breaks to force a fit.
- Export fails if text exceeds the usable page or its column. Shorten or prioritize
  content with the owner instead of silently shrinking the text or clipping it.
- After changing content or styling, inspect the rendered PDF. Confirm one page,
  embedded Geist, selectable text, working link annotations, and no overlaps.
- After every change, scan both the HTML preview and PDF for one-word final lines
  in headings, education, highlights, and descriptions. Inspect the side browser
  as well because its engine can wrap differently.
- Keep the original download until the generated replacement has been reviewed.

For future requests, update the JSON, regenerate, inspect the PDF, and summarize
the factual edits. Do not invent new dates, roles, accomplishments, or metrics.
