#!/usr/bin/env node
/**
 * Extracts only the Solar icons used in docs-front into a small subset
 * JSON file for offline use. Scans src/ for all solar:xxx references.
 *
 * Run:   node scripts/build-icon-subset.mjs
 * Output: src/assets/solar-icons-subset.json
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const solarPattern = /solar:([\w-]+)/g

function extractSolarNames(source) {
  const names = new Set()
  let m
  while ((m = solarPattern.exec(source)) !== null) names.add(m[1])
  solarPattern.lastIndex = 0
  return names
}

function walk(dir) {
  const files = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...walk(full))
      } else if (['.vue', '.ts', '.tsx', '.astro', '.jsx'].includes(extname(entry.name))) {
        files.push(full)
      }
    }
  } catch { /* skip */ }
  return files
}

// Scan src/ for all solar: references
const usedIconNames = new Set()
for (const file of walk(resolve(root, 'src'))) {
  for (const name of extractSolarNames(readFileSync(file, 'utf-8'))) {
    usedIconNames.add(name)
  }
}
usedIconNames.add('document-linear') // fallback

console.log(`Found ${usedIconNames.size} unique Solar icons across codebase`)

// Read full collection
const fullCollection = JSON.parse(
  readFileSync(resolve(root, 'node_modules/@iconify-json/solar/icons.json'), 'utf-8')
)

// Build subset
const subset = { prefix: fullCollection.prefix, icons: {} }
let found = 0, missing = 0

for (const name of usedIconNames) {
  if (fullCollection.icons[name]) {
    subset.icons[name] = fullCollection.icons[name]
    found++
  } else if (fullCollection.aliases?.[name]) {
    if (!subset.aliases) subset.aliases = {}
    subset.aliases[name] = fullCollection.aliases[name]
    const parent = fullCollection.aliases[name].parent
    if (parent && fullCollection.icons[parent]) subset.icons[parent] = fullCollection.icons[parent]
    found++
  } else {
    missing++
    console.warn(`  ⚠ Not found: ${name}`)
  }
}

if (fullCollection.width) subset.width = fullCollection.width
if (fullCollection.height) subset.height = fullCollection.height

mkdirSync(resolve(root, 'src/assets'), { recursive: true })
const json = JSON.stringify(subset)
writeFileSync(resolve(root, 'src/assets/solar-icons-subset.json'), json)
console.log(`Subset: ${found} icons (${missing} not found) → ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`)
