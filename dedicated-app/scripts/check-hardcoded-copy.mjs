import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const roots = ['app', 'components', 'features']
const visibleAttributes = new Set(['alt', 'aria-label', 'placeholder', 'title'])
const ignoredExact = new Set(['Messzen', 'English', 'বাংলা', 'En', 'বাং'])

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await filesIn(absolute))
    else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(absolute)
  }
  return files
}

function meaningful(value) {
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text || ignoredExact.has(text) || text.length <= 2) return false
  if (/^[A-Z0-9_./:+& -]+$/.test(text) && !text.includes(' ')) return false
  if (/^(https?:|mailto:|tel:|\/|#)/.test(text)) return false
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(text) || /^0?1[3-9]x+$/i.test(text)) return false
  return /[A-Za-z\u0980-\u09FF]/.test(text)
}

function position(source, node) {
  const point = source.getLineAndCharacterOfPosition(node.getStart(source))
  return `${path.relative(process.cwd(), source.fileName)}:${point.line + 1}`
}

function renderedLiterals(expression, output = []) {
  if (!expression) return output
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) output.push(expression)
  else if (ts.isTemplateExpression(expression)) {
    if (meaningful(expression.head.text)) output.push(expression.head)
    for (const span of expression.templateSpans) if (meaningful(span.literal.text)) output.push(span.literal)
  } else if (ts.isConditionalExpression(expression)) {
    renderedLiterals(expression.whenTrue, output)
    renderedLiterals(expression.whenFalse, output)
  } else if (ts.isParenthesizedExpression(expression)) renderedLiterals(expression.expression, output)
  else if (ts.isBinaryExpression(expression) && ['&&', '||', '??'].includes(expression.operatorToken.getText())) {
    renderedLiterals(expression.right, output)
  }
  return output
}

const violations = []
for (const root of roots) {
  for (const file of await filesIn(path.join(process.cwd(), root))) {
    if (path.relative(process.cwd(), file) === path.join('components', 'onboarding', 'onboarding-visual.tsx')) continue
    const contents = await readFile(file, 'utf8')
    const source = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    function visit(node) {
      if (ts.isJsxText(node) && meaningful(node.text)) {
        violations.push(`${position(source, node)} raw JSX text: ${node.text.replace(/\s+/g, ' ').trim()}`)
      }

      if (ts.isJsxAttribute(node) && visibleAttributes.has(node.name.text)) {
        if (node.initializer && ts.isStringLiteral(node.initializer) && meaningful(node.initializer.text)) {
          violations.push(`${position(source, node)} raw ${node.name.text}: ${node.initializer.text}`)
        }
      }

      if (
        ts.isJsxExpression(node) && node.expression &&
        (ts.isStringLiteral(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression)) &&
        meaningful(node.expression.text)
      ) {
        violations.push(`${position(source, node)} raw rendered string: ${node.expression.text}`)
      }
      if (
        ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent) &&
        !ts.isStringLiteral(node.expression) && !ts.isNoSubstitutionTemplateLiteral(node.expression)
      ) {
        for (const literal of renderedLiterals(node.expression)) {
          if (meaningful(literal.text)) violations.push(`${position(source, literal)} raw conditional/template copy: ${literal.text}`)
        }
      }

      if (ts.isJsxAttribute(node) && visibleAttributes.has(node.name.text) && ts.isJsxExpression(node.initializer)) {
        for (const literal of renderedLiterals(node.initializer.expression)) {
          if (meaningful(literal.text)) violations.push(`${position(source, literal)} raw ${node.name.text} expression: ${literal.text}`)
        }
      }

      ts.forEachChild(node, visit)
    }
    visit(source)
  }
}

if (violations.length) {
  console.error(`Hardcoded user-facing copy check failed with ${violations.length} violation(s):`)
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exit(1)
}

console.log('Hardcoded user-facing copy check passed for app, components and features.')
