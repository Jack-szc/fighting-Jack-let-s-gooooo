import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { getNoteInfo, getUserOtherInfo, searchSomeNote } from '../src/apis/pc.ts'
import { handleNoteInfo, type NoteInfo } from '../src/utils/data.ts'
import { cookieFilePath } from '../src/utils/xhs-paths.ts'
import {
  loadMaterialIndex,
  rememberRow,
  saveMaterialIndex,
} from './xhs_cache.ts'

interface SourceRow {
  category: string
  count?: number
  queries?: string[]
  keywords?: string[]
  must_any?: string[]
  prefer_any?: string[]
  reject_any?: string[]
  min_score?: number
  min_followers?: number
  max_followers?: number
}

interface CategoryConfig {
  category: string
  count: number
  queries: string[]
  keywords: string[]
  mustAny: string[]
  preferAny: string[]
  rejectAny: string[]
  minScore: number
  minFollowers: number
  maxFollowers: number
}

interface OutputRow {
  品类信息: string
  笔记链接地址: string
  笔记作者名称: string
  内容概述: string
  标签信息: string
  粉丝量: string
  点赞量: string | number
  笔记ID: string
  合作风险?: string
}

interface SearchNoteItem {
  id: string
  xsec_token: string
  model_type: unknown
  note_card?: {
    display_title?: string
    title?: string
    user?: {
      nickname?: string
    }
  }
}

const MATERIAL_INDEX_PATH = 'outputs/xhs_material_index/material_index.json'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '美食教程-西餐教程': ['西餐', '食谱', '教程', '意面', '牛排', '披萨', '汉堡', '沙拉', '烘焙'],
  '穿搭风格-夏季穿搭': ['夏季', '夏天', '穿搭', 'ootd', '搭配', '通勤', '小个子', '显瘦'],
  '动物其他-萌宠': ['萌宠', '宠物', '猫', '狗', '小狗', '小猫', '可爱', '搞笑'],
  '护肤记录-护肤技巧': ['护肤', '护肤技巧', '护肤教程', '皮肤', '精华', '防晒', '清洁'],
  '生活科普-生活小妙招': ['生活小妙招', '生活技巧', '收纳', '清洁', '家务', '实用', '省钱'],
  '彩妆-整体妆容': ['彩妆', '妆容', '化妆', '教程', '底妆', '眼妆', '口红'],
  '搞笑其他-搞笑视频': ['搞笑', '搞笑视频', '段子', '日常', '离谱', '真实', '笑死'],
  '舞蹈-舞蹈教程': ['舞蹈', '舞蹈教程', '分解', '教学', '编舞', '动作', '练习'],
  '两性-情感故事': ['情侣', '恋爱', '情侣日常', '情侣互动', '约会', '恋爱日常', '情侣vlog', '相处'],
  '音乐-音乐方向': ['音乐', '唱歌', '吉他', '钢琴', '教学', '教程', '练习', '翻唱'],
  '家庭用品-生活好物': ['家居好物', '生活好物', '家庭用品', '收纳', '厨房好物', '清洁好物'],
  '美食教程-美食教程': ['美食', '教程', '做法', '食谱', '家常菜', '简单', '自制'],
  '穿搭风格-汉服穿搭': ['汉服', '国风', '新中式', '古风', '马面裙', '宋制', '明制', '簪花', '旗袍', '穿搭'],
  '美食展示-AI美食小众美食': ['ai美食', 'ai做饭', 'ai食谱', '小众美食', '美食展示', '探店', '地方美食', '隐藏吃法', '特色小吃', '美食'],
  '兴趣爱好其他-兴趣爱好其他': ['手工', 'diy', '手作', '自制', '教程', '钩织', '黏土', '串珠', '改造'],
  '语言教育-语言教育': ['语言学习', '英语', '口语', '发音', '学习方法', '单词', '语法'],
}

const CATEGORY_QUERIES: Record<string, string[]> = {
  '美食教程-西餐教程': ['美食教程-西餐教程', '西餐教程', '西餐食谱'],
  '穿搭风格-夏季穿搭': ['穿搭风格-夏季穿搭', '夏季穿搭', '夏天穿搭'],
  '动物其他-萌宠': ['动物其他-萌宠', '萌宠', '宠物日常'],
  '护肤记录-护肤技巧': ['护肤记录-护肤技巧', '护肤技巧', '护肤教程'],
  '生活科普-生活小妙招': ['生活科普-生活小妙招', '生活小妙招', '实用生活技巧'],
  '彩妆-整体妆容': ['彩妆-整体妆容', '妆容教程', '日常妆容'],
  '搞笑其他-搞笑视频': ['搞笑其他-搞笑视频', '搞笑视频', '搞笑日常'],
  '舞蹈-舞蹈教程': ['舞蹈-舞蹈教程', '舞蹈教程', '舞蹈分解教学'],
  '两性-情感故事': ['情侣日常', '情侣互动', '恋爱日常', '情侣vlog'],
  '音乐-音乐方向': ['音乐-音乐方向', '音乐教程', '唱歌教学'],
  '家庭用品-生活好物': ['家庭用品-生活好物', '家居好物', '生活好物'],
  '美食教程-美食教程': ['美食教程-美食教程', '美食教程', '家常菜教程'],
  '穿搭风格-汉服穿搭': ['汉服穿搭', '国风穿搭', '新中式穿搭', '马面裙穿搭', '汉服日常穿搭', '簪花汉服'],
  '美食展示-AI美食小众美食': ['AI美食', 'AI做饭', 'AI食谱', '小众美食', '小众美食展示', '地方小众美食', '特色小吃展示', '隐藏吃法'],
  '兴趣爱好其他-兴趣爱好其他': ['手工diy教程', '手工教程', '手作教程', 'diy手工'],
  '语言教育-语言教育': ['语言教育-语言教育', '语言学习', '英语学习技巧'],
}

function isSearchNoteItem(n: unknown): n is SearchNoteItem {
  if (!n || typeof n !== 'object') return false
  const o = n as Record<string, unknown>
  return o.model_type === 'note' && typeof o.id === 'string' && typeof o.xsec_token === 'string'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} 超时`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function readCookie(): Promise<string> {
  const text = await readFile(cookieFilePath(), 'utf8')
  const first = text.split('\n').find((line) => line.trim())
  if (!first) throw new Error(`Cookie 文件为空: ${cookieFilePath()}`)
  return first.trim()
}

function compact(text: string, max = 90): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max)
}

function uniq(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function textForNote(note: NoteInfo): string {
  return `${note.title} ${note.desc} ${note.tags.join(' ')}`.toLowerCase()
}

function previewTextForHit(hit: SearchNoteItem): string {
  return [
    hit.note_card?.display_title,
    hit.note_card?.title,
    hit.note_card?.user?.nickname,
  ].filter(Boolean).join(' ').toLowerCase()
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

function passesSearchPreview(config: CategoryConfig, hit: SearchNoteItem): boolean {
  const text = previewTextForHit(hit)
  if (!text) return true
  if (config.rejectAny.length && hasAny(text, config.rejectAny)) return false
  if (config.mustAny.length && hasAny(text, config.mustAny)) return true
  if (config.preferAny.length && hasAny(text, config.preferAny)) return true
  return config.mustAny.length === 0
}

function defaultQueriesForCategory(category: string): string[] {
  const parts = category.split(/[-/｜|_]/).map((part) => part.trim()).filter(Boolean)
  return uniq([category, ...parts, parts.slice(-1)[0] ?? category])
}

function normalizeConfigs(sourceRows: SourceRow[], defaultCount: number): CategoryConfig[] {
  const byCategory = new Map<string, SourceRow[]>()
  for (const row of sourceRows) {
    if (!row.category) continue
    byCategory.set(row.category, [...(byCategory.get(row.category) ?? []), row])
  }

  return [...byCategory.entries()].map(([category, rows]) => {
    const count = rows.find((row) => Number.isFinite(row.count))?.count ?? defaultCount
    const configuredQueries = uniq(rows.flatMap((row) => row.queries ?? []))
    const queries = configuredQueries.length
      ? configuredQueries
      : CATEGORY_QUERIES[category] ?? defaultQueriesForCategory(category)
    const keywords = uniq([
      ...(CATEGORY_KEYWORDS[category] ?? [category, ...defaultQueriesForCategory(category)]),
      ...rows.flatMap((row) => row.keywords ?? []),
    ])
    const mustAny = uniq(rows.flatMap((row) => row.must_any ?? []))
    const preferAny = uniq(rows.flatMap((row) => row.prefer_any ?? []))
    const rejectAny = uniq(rows.flatMap((row) => row.reject_any ?? []))
    const minScore = rows.find((row) => Number.isFinite(row.min_score))?.min_score ?? 8
    const minFollowers = rows.find((row) => Number.isFinite(row.min_followers))?.min_followers ?? 800
    const maxFollowers = rows.find((row) => Number.isFinite(row.max_followers))?.max_followers ?? 180000

    return {
      category,
      count,
      queries,
      keywords,
      mustAny,
      preferAny,
      rejectAny,
      minScore,
      minFollowers,
      maxFollowers,
    }
  })
}

function findFollowerCount(value: unknown): string {
  const keys = new Set(['fans', 'fans_count', 'fansCount', 'fans_num', 'fansNum', 'followers', 'followers_count', 'follower_count', 'followerCount'])
  const stack: unknown[] = [value]
  while (stack.length) {
    const cur = stack.pop()
    if (!cur || typeof cur !== 'object') continue
    if (Array.isArray(cur)) {
      stack.push(...cur)
      continue
    }
    for (const [key, val] of Object.entries(cur)) {
      if (key === 'type' && val === 'fans' && ('i18n_count' in cur || 'count' in cur)) {
        const count = cur.i18n_count ?? cur.count
        if (count !== undefined && count !== null && String(count) !== '') return String(count)
      }
      if (keys.has(key) && val !== undefined && val !== null && String(val) !== '') return String(val)
      if (val && typeof val === 'object') stack.push(val)
    }
  }
  return '未返回'
}

function countToNumber(count: string): number | null {
  const text = count.trim().toLowerCase()
  if (!text || text === '未返回') return null
  if (text.endsWith('k')) return Number(text.slice(0, -1)) * 1000
  if (text.endsWith('w')) return Number(text.slice(0, -1)) * 10000
  if (text.includes('万')) return Number(text.replace(/[万+]/g, '')) * 10000
  const n = Number(text.replace(/[,+]/g, ''))
  return Number.isFinite(n) ? n : null
}

async function getFollowerCountForUser(userId: string, cookies: string, cache: Map<string, string>): Promise<string> {
  if (!userId) return '未返回'
  const cached = cache.get(userId)
  if (cached !== undefined) return cached
  const res = await getUserOtherInfo(userId, cookies)
  const count = res.success ? findFollowerCount(res.data) : '未返回'
  cache.set(userId, count)
  return count
}

function scoreNote(config: CategoryConfig, note: NoteInfo): number | null {
  const text = textForNote(note)
  if (config.rejectAny.length && hasAny(text, config.rejectAny)) return null
  if (config.mustAny.length && !hasAny(text, config.mustAny)) return null

  let score = note.note_type === '视频' ? 5 : 0
  for (const keyword of config.keywords) {
    if (text.includes(keyword.toLowerCase())) score += 3
  }
  for (const keyword of config.preferAny) {
    if (text.includes(keyword.toLowerCase())) score += 2
  }
  if (/教程|做法|食谱|步骤|简单|自制|分解|教学|技巧|方法|日常|记录|分享/.test(text)) score += 4
  if (/西餐|意面|披萨|牛排|汉堡|沙拉|三明治|烩饭|浓汤|焗饭/.test(text)) score += 4
  return score
}

function cooperationRisk(note: NoteInfo): string {
  const text = [
    note.nickname,
    note.title,
    note.desc,
    note.tags.join(' '),
  ].join(' ').toLowerCase()
  const highRiskPatterns = [
    /搬运/,
    /转载/,
    /合集/,
    /外网/,
    /侵删/,
    /原作者/,
    /授权/,
    /水印/,
    /tiktok/,
    /instagram/,
    /\bins\b/,
    /youtube/,
    /reels?/,
    /shorts?/,
    /douyin/,
    /抖音/,
    /戈登拉姆齐/,
    /gordon\s+ramsay/,
    /\bcr[:：]/,
    /\bcredit\b/,
    /\bsource\b/,
    /\brepost\b/,
    /\bvia\b/,
  ]
  return highRiskPatterns.some((pattern) => pattern.test(text))
    ? '高风险（疑似搬运/外部来源，需人工复核）'
    : ''
}

function riskFromRow(row: OutputRow): string {
  if (row.合作风险) return row.合作风险
  const text = [
    row.笔记作者名称,
    row.内容概述,
    row.标签信息,
  ].join(' ').toLowerCase()
  if (/搬运|转载|合集|外网|侵删|原作者|授权|水印|tiktok|instagram|\bins\b|youtube|reels?|shorts?|douyin|抖音|戈登拉姆齐|gordon\s+ramsay|\bcr[:：]|\bcredit\b|\bsource\b|\brepost\b|\bvia\b/.test(text)) {
    return '高风险（疑似搬运/外部来源，需人工复核）'
  }
  return ''
}

function isHighRisk(row: OutputRow): boolean {
  return riskFromRow(row).startsWith('高风险')
}

function buildOutput(category: string, note: NoteInfo, followerCount: string, url: string): OutputRow {
  return {
    品类信息: category,
    笔记链接地址: url,
    笔记作者名称: note.nickname,
    内容概述: compact(note.title !== '无标题' ? note.title : note.desc) || '主题不明确',
    标签信息: note.tags.join('、'),
    粉丝量: followerCount,
    点赞量: note.liked_count,
    笔记ID: note.note_id,
    合作风险: cooperationRisk(note),
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

async function saveMaterialIndexIfAllowed(): Promise<void> {
  try {
    await saveMaterialIndex(MATERIAL_INDEX_PATH, materialIndexForSave)
  } catch (error) {
    console.warn(`[warn] 共用历史库未写回: ${error instanceof Error ? error.message : String(error)}`)
  }
}

let materialIndexForSave: Awaited<ReturnType<typeof loadMaterialIndex>>

async function main(): Promise<void> {
  const [, , sourceRowsPath, outputPath, perCategoryRaw] = process.argv
  const defaultCount = Number(perCategoryRaw ?? 3)
  if (!sourceRowsPath || !outputPath || !Number.isFinite(defaultCount)) {
    throw new Error('usage: search_xhs_chinese_candidates.ts source_rows.json output.json per_category')
  }

  const cookies = await readCookie()
  const sourceRows = JSON.parse(await readFile(sourceRowsPath, 'utf8')) as SourceRow[]
  const configs = normalizeConfigs(sourceRows, defaultCount)
  const materialIndex = await loadMaterialIndex(MATERIAL_INDEX_PATH)
  materialIndexForSave = materialIndex
  const output: OutputRow[] = existsSync(outputPath)
    ? JSON.parse(await readFile(outputPath, 'utf8')) as OutputRow[]
    : []
  for (const row of output) {
    row.合作风险 = riskFromRow(row)
  }
  const seenIds = new Set<string>(materialIndex.seen_note_ids)
  for (const row of output) {
    if (row.笔记ID) seenIds.add(row.笔记ID)
  }
  const followerCache = new Map<string, string>(Object.entries(materialIndex.follower_by_user_id))
  const queryConcurrency = envNumber('XHS_CHINESE_QUERY_CONCURRENCY', 2)
  const candidateConcurrency = envNumber('XHS_CHINESE_CANDIDATE_CONCURRENCY', 3)
  const searchPageSize = envNumber('XHS_CHINESE_SEARCH_PAGE_SIZE', 10)
  const detailTimeout = envNumber('XHS_CHINESE_DETAIL_TIMEOUT_MS', 30_000)
  const followerTimeout = envNumber('XHS_CHINESE_FOLLOWER_TIMEOUT_MS', 30_000)
  const requestSleep = envNumber('XHS_CHINESE_REQUEST_SLEEP_MS', 800)

  for (const config of configs) {
    const existingCount = output.filter((row) => row.品类信息 === config.category && !isHighRisk(row)).length
    if (existingCount >= config.count) continue
    const candidates: Array<{ score: number; row: OutputRow }> = []
    const searched = new Set<string>()
    console.info(`[category] ${config.category} 需要补 ${config.count - existingCount} 条，粉丝范围 ${config.minFollowers}-${config.maxFollowers - 1}`)

    for (let queryIndex = 0; queryIndex < config.queries.length; queryIndex += queryConcurrency) {
      const queryBatch = config.queries.slice(queryIndex, queryIndex + queryConcurrency)
      const searchResults = await Promise.all(queryBatch.map(async (query) => {
        console.info(`[search] ${config.category} :: ${query}`)
        const res = await searchSomeNote(query, searchPageSize, cookies, { noteType: 1, sortTypeChoice: 0 }, 2)
        if (!res.success) return []
        return (res.data ?? []).filter(isSearchNoteItem)
      }))
      const pendingHits = searchResults.flat().filter((hit) => {
        if (seenIds.has(hit.id) || searched.has(hit.id)) return false
        searched.add(hit.id)
        if (!passesSearchPreview(config, hit)) {
          console.info(`[prefilter] ${hit.id} 搜索预筛跳过: ${compact(previewTextForHit(hit), 50)}`)
          return false
        }
        return true
      })

      for (let i = 0; i < pendingHits.length; i += candidateConcurrency) {
        const batch = pendingHits.slice(i, i + candidateConcurrency)
        const results = await Promise.all(batch.map(async (hit) => {
          const url = `https://www.xiaohongshu.com/explore/${hit.id}?xsec_token=${hit.xsec_token}`
          const detail = await withTimeout(
            getNoteInfo(url, cookies),
            detailTimeout,
            `getNoteInfo ${hit.id}`,
          ).catch((error: unknown) => {
            console.warn(`[skip] ${hit.id} ${error instanceof Error ? error.message : String(error)}`)
            return null
          })
          if (!detail?.success) return null
          const item = (detail.data as { data?: { items?: Array<Record<string, unknown>> } } | null)?.data?.items?.[0]
          if (!item) return null
          item.url = url
          const note = handleNoteInfo(item)
          if (note.note_type !== '视频' || seenIds.has(note.note_id)) return null
          const followerCount = await withTimeout(
            getFollowerCountForUser(note.user_id, cookies, followerCache),
            followerTimeout,
            `getFollowerCount ${note.user_id}`,
          ).catch((error: unknown) => {
            console.warn(`[skip] ${note.note_id} ${error instanceof Error ? error.message : String(error)}`)
            return null
          })
          if (followerCount === null) return null
          const followerNumber = countToNumber(followerCount)
          if (followerNumber === null || followerNumber < config.minFollowers || followerNumber >= config.maxFollowers) {
            console.info(`[skip] ${note.note_id} 粉丝量不符合: ${followerCount}`)
            return null
          }
          const score = scoreNote(config, note)
          if (score === null || score < config.minScore) return null
          return { score, row: buildOutput(config.category, note, followerCount, url) }
        }))
        for (const result of results) {
          if (!result) continue
          if (isHighRisk(result.row)) {
            console.info(`[risk] ${result.row.笔记ID} ${result.row.合作风险}`)
            output.push(result.row)
            seenIds.add(result.row.笔记ID)
            rememberRow(materialIndex, result.row)
            await writeJson(outputPath, output)
            continue
          }
          candidates.push(result)
        }
        await sleep(requestSleep)
        if (candidates.length >= config.count - existingCount) break
      }
      if (candidates.length >= config.count - existingCount) break
    }

    for (const item of candidates.sort((a, b) => b.score - a.score).slice(0, config.count - existingCount)) {
      seenIds.add(item.row.笔记ID)
      rememberRow(materialIndex, item.row)
      output.push(item.row)
    }
    materialIndex.follower_by_user_id = Object.fromEntries(followerCache)
    await writeJson(outputPath, output)
    await saveMaterialIndexIfAllowed()
    if (candidates.length < config.count - existingCount) {
      console.warn(`[warn] ${config.category} 只找到 ${candidates.length}/${config.count - existingCount} 条`)
    }
  }
}

await main()
