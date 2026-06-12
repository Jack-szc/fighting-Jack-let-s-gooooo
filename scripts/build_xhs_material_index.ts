import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import {
  type CachedOutputRow,
  loadMaterialIndex,
  rememberRow,
  saveMaterialIndex,
  readJsonFile,
} from './xhs_cache.ts'

async function collectJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const files: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectJsonFiles(path))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(path)
    }
  }
  return files
}

function isOutputRow(value: unknown): value is CachedOutputRow {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return typeof row['笔记ID'] === 'string' && typeof row['笔记链接地址'] === 'string'
}

const indexPath = process.argv[2] ?? 'outputs/xhs_material_index/material_index.json'
const scanDir = process.argv[3] ?? 'outputs'
const index = await loadMaterialIndex(indexPath)
const files = await collectJsonFiles(scanDir)

let rows = 0
for (const file of files) {
  const value = await readJsonFile<unknown>(file, null)
  if (!Array.isArray(value)) continue
  for (const item of value) {
    if (isOutputRow(item)) {
      rememberRow(index, item)
      rows += 1
    }
  }
}

await saveMaterialIndex(indexPath, index)
console.info(`indexed_rows=${rows}`)
console.info(`seen_note_ids=${index.seen_note_ids.length}`)
