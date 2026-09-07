import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const messagesDirectory = path.join(process.cwd(), 'lib', 'i18n', 'messages')
const readMessages = async (locale) => JSON.parse(await readFile(path.join(messagesDirectory, `${locale}.json`), 'utf8'))

function flatten(value, prefix = '', output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const pathKey = prefix ? `${prefix}.${key}` : key
    if (typeof child === 'string') output.set(pathKey, child)
    else if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, pathKey, output)
    else throw new Error(`${pathKey} must be a string or translation object`)
  }
  return output
}

const placeholders = (message) => [...message.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((match) => match[1]).sort()
const [english, bangla] = await Promise.all([readMessages('en'), readMessages('bn')])
const en = flatten(english)
const bn = flatten(bangla)
const violations = []

for (const key of en.keys()) if (!bn.has(key)) violations.push(`Missing Bangla key: ${key}`)
for (const key of bn.keys()) if (!en.has(key)) violations.push(`Unexpected Bangla key: ${key}`)
for (const [key, englishMessage] of en) {
  const banglaMessage = bn.get(key)
  if (!englishMessage.trim()) violations.push(`Empty English value: ${key}`)
  if (banglaMessage !== undefined && !banglaMessage.trim()) violations.push(`Empty Bangla value: ${key}`)
  if (banglaMessage !== undefined && JSON.stringify(placeholders(englishMessage)) !== JSON.stringify(placeholders(banglaMessage))) {
    violations.push(`Placeholder mismatch: ${key}`)
  }
}

if (violations.length) {
  console.error(`Translation parity failed with ${violations.length} violation(s):`)
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}
console.log(`Translation parity passed: ${en.size} keys across ${Object.keys(english).length} namespaces.`)
