import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const projectRoot = process.cwd()
const sourceRoots = ['app', 'components']
const sourceExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx'])
const semanticTokens = ['caption', 'label', 'body', 'title-sm', 'title', 'headline', 'display']

const violations = []

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)))
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }

  return files
}

function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

function addMatches(file, source, pattern, message) {
  for (const match of source.matchAll(pattern)) {
    const line = source.slice(0, match.index).split('\n').length
    violations.push({ file: path.relative(projectRoot, file), line, message, value: match[0] })
  }
}

const files = (
  await Promise.all(sourceRoots.map((root) => collectSourceFiles(path.join(projectRoot, root))))
).flat()

for (const file of files) {
  const source = withoutComments(await readFile(file, 'utf8'))

  addMatches(
    file,
    source,
    /\btext-\[(?:\d*\.)?\d+(?:px|rem|em)\]/g,
    'Use a semantic text token instead of an arbitrary font size.',
  )
  addMatches(
    file,
    source,
    /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g,
    'Use one of the dedicated app semantic text tokens.',
  )
  addMatches(
    file,
    source,
    /\bfontSize\s*:/g,
    'Inline font sizes are not allowed.',
  )

  if (path.extname(file) === '.css') {
    for (const match of source.matchAll(/font-size\s*:\s*([^;]+);/g)) {
      if (!match[1].trim().startsWith('var(--text-')) {
        const line = source.slice(0, match.index).split('\n').length
        violations.push({
          file: path.relative(projectRoot, file),
          line,
          message: 'CSS font sizes must reference a semantic --text-* token.',
          value: match[0],
        })
      }
    }
  }
}

const globals = await readFile(path.join(projectRoot, 'app', 'globals.css'), 'utf8')
for (const token of semanticTokens) {
  if (!globals.includes(`--text-${token}:`) || !globals.includes(`--text-${token}--line-height:`)) {
    violations.push({
      file: path.join('app', 'globals.css'),
      line: 1,
      message: `Typography token --text-${token} must define both size and line-height.`,
      value: token,
    })
  }
}

if (violations.length > 0) {
  console.error('Typography policy violations found:\n')
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line} ${violation.message} (${violation.value})`)
  }
  process.exit(1)
}

console.log(`Typography policy passed: ${files.length} source files use the seven semantic text tokens.`)
