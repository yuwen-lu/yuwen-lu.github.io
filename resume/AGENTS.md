# Resume updates

Read `README.md` in this directory before changing the resume. Its editable
content is `content.json`; its design is `template.html` and `styles.css`.

Use `npm run resume:pdf` from the repository root to generate a sample. Inspect
the PDF and its rendered page before delivering it. Preserve the owner's Geist
typeface and one-page layout; never invent facts or silently shrink the text to
fit. Resolve overflow by editing content with the owner.

After every change, check both the side-browser HTML preview and the rendered
PDF for orphan text (a final line containing just one word), including headings,
education, highlights, and experience descriptions. Visually confirm the result
before delivering; browser engines can wrap the same text differently. Prefer balanced
wrapping or concise factual wording over smaller fonts or forced line breaks.

Use `--publish` only when the owner asks to replace the site's local downloadable
resume. Do not change or deploy the public PDF while preparing a sample.
