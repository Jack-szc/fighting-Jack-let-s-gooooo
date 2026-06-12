import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export interface CachedOutputRow {
  品类信息?: string
  笔记链接地址?: string
  笔记作者名称?: string
  '语言信息（标题/正文/标签/作者名）'?: string
  内容概述?: string
  标签信息?: string
  粉丝量?: string
  点赞量?: string | number
  IP地址?: string
  笔记ID?: string
}

export interface MaterialIndex {
  seen_note_ids: string[]
  rows_by_note_id: Record<string, CachedOutputRow>
  follower_by_user_id: Record<string, string>
  resolved_link_by_short_link: Record<string, string>
  updated_at: string
}

const DEFAULT_INDEX: MaterialIndex = {
  seen_note_ids: [],
  rows_by_note_id: {},
  follower_by_user_id: {},
  resolved_link_by_short_link: {},
  updated_at: '',
}

export async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

export async function loadMaterialIndex(path: string): Promise<MaterialIndex> {
  const loaded = await readJsonFile<Partial<MaterialIndex>>(path, DEFAULT_INDEX)
  return {
    seen_note_ids: loaded.seen_note_ids ?? [],
    rows_by_note_id: loaded.rows_by_note_id ?? {},
    follower_by_user_id: loaded.follower_by_user_id ?? {},
    resolved_link_by_short_link: loaded.resolved_link_by_short_link ?? {},
    updated_at: loaded.updated_at ?? '',
  }
}

export async function saveMaterialIndex(path: string, index: MaterialIndex): Promise<void> {
  const ids = new Set(index.seen_note_ids)
  for (const id of Object.keys(index.rows_by_note_id)) {
    if (id) ids.add(id)
  }
  index.seen_note_ids = [...ids].sort()
  index.updated_at = new Date().toISOString()
  await writeJsonFile(path, index)
}

export function rememberRow(index: MaterialIndex, row: CachedOutputRow): void {
  const noteId = String(row.笔记ID ?? '').trim()
  if (!noteId) return
  index.rows_by_note_id[noteId] = row
  if (!index.seen_note_ids.includes(noteId)) index.seen_note_ids.push(noteId)
}
