import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await filesIn(absolute))
    else if (/\.tsx?$/.test(entry.name)) files.push(absolute)
  }
  return files
}

function attribute(opening, name) {
  return opening.attributes.properties.find(
    (item) => ts.isJsxAttribute(item) && item.name.text === name,
  )
}

const violations = []
for (const root of ['app', 'components', 'features']) {
  for (const file of await filesIn(path.join(process.cwd(), root))) {
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const relative = path.relative(process.cwd(), file)
    let hasDialog = false
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const role = attribute(node, 'role')
        const roleValue = role?.initializer && ts.isStringLiteral(role.initializer) ? role.initializer.text : ''
        if (roleValue === 'dialog' || roleValue === 'alertdialog') {
          hasDialog = true
          if (!attribute(node, 'aria-modal')) violations.push(`${relative}: dialog is missing aria-modal`)
          if (!attribute(node, 'aria-labelledby') && !attribute(node, 'aria-label')) {
            violations.push(`${relative}: dialog is missing an accessible title`)
          }
        }
        const tabIndex = attribute(node, 'tabIndex')
        if (tabIndex?.initializer && /^\{?[1-9]\d*\}?$/.test(tabIndex.initializer.getText(source))) {
          violations.push(`${relative}: positive tabIndex changes the natural focus order`)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
    if (hasDialog && !source.text.includes('useDialogFocus') && !source.text.includes("event.key !== 'Tab'")) {
      violations.push(`${relative}: modal must use the shared focus trap or an equivalent Tab loop`)
    }
  }
}

const loading = await readFile(path.join(process.cwd(), 'components', 'loading-indicator.tsx'), 'utf8')
if (!loading.includes('sr-only') || !loading.includes('accessibleLabel')) {
  violations.push('components/loading-indicator.tsx: loading state must expose localized screen-reader copy')
}
const css = await readFile(path.join(process.cwd(), 'app', 'globals.css'), 'utf8')
if (!css.includes(':focus-visible')) violations.push('app/globals.css: global focus-visible styling is missing')
if (!css.includes('100dvh')) violations.push('app/globals.css: dynamic viewport support is missing')
if (!css.includes('safe-area-inset-bottom')) violations.push('app/globals.css: Android/iOS safe-area support is missing')

if (violations.length) {
  console.error(`Accessibility source check failed with ${violations.length} violation(s):`)
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exit(1)
}
console.log('Accessibility source check passed: dialogs, loading copy, focus order, viewport and safe areas.')
