import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const previewDir = join(root, 'output', 'resume')
const pdfDir = join(root, 'output', 'pdf')
const pdfPath = join(pdfDir, 'resume-yuwen-lu.pdf')
const previewOnly = process.argv.includes('--preview-only')
const publish = process.argv.includes('--publish')
const unknownArgs = process.argv.slice(2).filter(arg => !['--preview-only', '--publish'].includes(arg))
if (unknownArgs.length || (previewOnly && publish)) {
  throw new Error('Usage: npm run resume:pdf [-- --preview-only | --publish]')
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

// Content supports only **bold** and [links](https://...). All text is escaped.
function inline(value = '') {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g
  let result = ''
  let cursor = 0
  for (const match of value.matchAll(pattern)) {
    result += escapeHtml(value.slice(cursor, match.index))
    result += match[1]
      ? `<a href="${escapeHtml(match[2])}">${inline(match[1])}</a>`
      : `<strong>${escapeHtml(match[3])}</strong>`
    cursor = match.index + match[0].length
  }
  return result + escapeHtml(value.slice(cursor))
}

const icons = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z"/>',
  twitter: '<path d="M22 5.9a8 8 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.3 8.3 0 0 1-2.6 1 4.1 4.1 0 0 0-7 3.7 11.7 11.7 0 0 1-8.5-4.3 4.1 4.1 0 0 0 1.3 5.5 4.1 4.1 0 0 1-1.9-.5 4.1 4.1 0 0 0 3.3 4.1 4.2 4.2 0 0 1-1.9.1 4.1 4.1 0 0 0 3.8 2.9A8.3 8.3 0 0 1 2 18.5a11.7 11.7 0 0 0 18-9.9v-.5a8 8 0 0 0 2-2.2Z"/>',
  graduation: '<path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v6c4 3 8 3 12 0v-6M22 9v7"/>',
}

function contact(item) {
  if (!icons[item.icon] || !/^(https?:|mailto:|tel:)/.test(item.href)) {
    throw new Error(`Invalid contact: ${item.label}`)
  }
  return `<li><svg viewBox="0 0 24 24" aria-hidden="true">${icons[item.icon]}</svg><a class="${item.underline === false ? 'plain-link' : ''}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`
}

function education(item) {
  return `<article class="record"><p class="record-date">${inline(item.dates)}</p><h3>${inline(item.degree)}</h3><p>${inline(item.school)}</p>${item.detail ? `<p>${inline(item.detail)}</p>` : ''}</article>`
}

function highlight(item) {
  return `<article class="record"><div class="record-date">${inline(item.dates)}</div><h3>${inline(item.title)}</h3>${item.description.map(text => `<p>${inline(text)}</p>`).join('')}</article>`
}

function entry(item) {
  const heading = item.organization
    ? `<h3 class="entry-heading"><span class="entry-company">${inline(item.organization)}</span><span class="entry-role">${inline(item.role)}</span></h3>`
    : `<h3>${inline(item.title)}</h3><p class="project-role">${inline(item.role)}</p>`
  return `<article class="entry">${heading}<div class="entry-meta"><span>${inline(item.dates)}</span>${item.location || item.note ? `<span class="${item.note ? 'entry-note' : ''}">${inline(item.location || item.note)}</span>` : ''}</div>${item.summary ? `<p>${inline(item.summary)}</p>` : ''}${item.bullets ? `<ul role="list">${item.bullets.map(text => `<li>${inline(text)}</li>`).join('')}</ul>` : ''}</article>`
}

const [source, template, styles, font, monoFont] = await Promise.all([
  readFile(join(root, 'resume', 'content.json'), 'utf8'),
  readFile(join(root, 'resume', 'template.html'), 'utf8'),
  readFile(join(root, 'resume', 'styles.css'), 'utf8'),
  readFile(require.resolve('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')),
  readFile(require.resolve('@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')),
])
const content = JSON.parse(source)
const replacements = {
  NAME: escapeHtml(content.name),
  LANGUAGE: escapeHtml(content.language),
  STYLES: styles.replace('{{GEIST_FONT}}', font.toString('base64')).replace('{{GEIST_MONO_FONT}}', monoFont.toString('base64')),
  CONTACT: content.contact.map(contact).join('\n'),
  EDUCATION: content.education.map(education).join('\n'),
  HIGHLIGHTS: content.highlights.map(highlight).join('\n'),
  EXPERIENCE: content.experience.map(entry).join('\n'),
  PROJECTS_SECTION: content.showProjects !== false && content.projects?.length
    ? `<section class="projects" aria-labelledby="projects-heading"><h2 id="projects-heading">Projects</h2>${content.projects.map(entry).join('\n')}</section>`
    : '',
}
const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
  if (!(key in replacements)) throw new Error(`Unknown template field: ${key}`)
  return replacements[key]
})

await mkdir(previewDir, { recursive: true })
await writeFile(join(previewDir, 'preview.html'), html)
console.log('HTML preview: output/resume/preview.html')

if (!previewOnly) {
  // Use Playwright's pinned Chromium when installed, otherwise local Chrome.
  const bundledBrowserExists = await access(chromium.executablePath()).then(() => true, () => false)
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.RESUME_BROWSER_CHANNEL
      ? { channel: process.env.RESUME_BROWSER_CHANNEL }
      : bundledBrowserExists ? {} : { channel: 'chrome' }),
  })
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 })
    await page.emulateMedia({ media: 'print', colorScheme: 'light', reducedMotion: 'reduce' })
    await page.setContent(html, { waitUntil: 'load' })
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all([...document.images].map(image => image.decode()))
    })
    const layout = await page.evaluate(() => {
      const sheet = document.querySelector('.resume')
      const bounds = sheet.getBoundingClientRect()
      const padding = parseFloat(getComputedStyle(sheet).paddingBottom)
      const overflow = [...sheet.querySelectorAll('h1,h2,h3,p,li,a,.entry-meta')].filter(element => {
        const rect = element.getBoundingClientRect()
        return rect.bottom > bounds.bottom - padding + 1 || rect.right > bounds.right + 1 || element.scrollWidth > element.clientWidth + 1
      }).map(element => element.textContent.trim().slice(0, 100))
      return { fontsLoaded: document.fonts.check('16px Geist') && document.fonts.check('16px "Geist Mono"'), overflow }
    })
    if (!layout.fontsLoaded) throw new Error('Geist or Geist Mono did not load; refusing to export with a fallback font.')
    if (layout.overflow.length) {
      throw new Error(`Resume exceeds its page or column. Edit the content instead of shrinking the font:\n${layout.overflow.join('\n')}`)
    }
    await mkdir(pdfDir, { recursive: true })
    await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true, tagged: true })
    await page.locator('.resume').screenshot({ path: join(previewDir, 'preview.png') })
    console.log('PDF: output/pdf/resume-yuwen-lu.pdf')
    console.log('Preview image: output/resume/preview.png')
    console.log('Checked: local Geist and Geist Mono loaded; all content fits inside one A4 sheet.')
    if (publish) {
      await copyFile(pdfPath, join(root, 'public', 'files', 'resume-yuwen-lu.pdf'))
      console.log('Updated website download: public/files/resume-yuwen-lu.pdf')
    }
  } finally {
    await browser.close()
  }
}
