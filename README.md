# XHS Chinese Material Workflow

这是一个安全版脚本版本仓库，用来保存和回滚中文小红书素材搜索工作流中的核心文件。

## 保存内容

- `scripts/search_xhs_chinese_candidates.ts`
  - 中文素材搜索、品类配置、粉丝过滤、避重、高风险标记。
- `scripts/write_xhs_chinese_note_table.py`
  - 将 `rows.json` 导出为 Excel，并把高风险素材放入复核 sheet。
- `scripts/xhs_cache.ts`
  - 素材历史库读写与笔记 ID 去重工具。
- `scripts/build_xhs_material_index.ts`
  - 从历史素材输出构建/补充避重索引。
- `config/examples/source_rows.example.json`
  - 品类配置示例。

## 不保存内容

这些内容故意不放进 GitHub：

- cookie、登录态、token。
- 搜索输出、Excel、历史素材库。
- `node_modules`、虚拟环境、缓存。
- 第三方平台静态签名/打包代码。

## 用途

当本地脚本被改坏时，可以从这个仓库回滚核心搜索和导出逻辑。具体恢复方式见 `RESTORE.md`。

## 推荐版本名

- `xhs-cn-stable-20260612`
  - 优化前的稳定版本，适合在新改动不满意时回滚。
- `xhs-cn-rate-limit-safe-20260613`
  - 降低风控触发概率的版本，默认降低并发、增加随机等待，并限制每个品类详情请求量。

在 GitHub 网页上，这两个名字是分支；在本地干净仓库和运行仓库里，这两个名字也是标签。

## 风控安全参数

中文搜索脚本支持用环境变量微调请求节奏：

- `XHS_CHINESE_QUERY_CONCURRENCY`
  - 搜索词并发数，默认 `1`。
- `XHS_CHINESE_CANDIDATE_CONCURRENCY`
  - 详情/粉丝候选并发数，默认 `2`。
- `XHS_CHINESE_REQUEST_SLEEP_MIN_MS`
  - 每批详情请求后的最短随机等待，默认 `1500`。
- `XHS_CHINESE_REQUEST_SLEEP_MAX_MS`
  - 每批详情请求后的最长随机等待，默认 `4000`。
- `XHS_CHINESE_SEARCH_SLEEP_MIN_MS`
  - 每批搜索词后的最短随机等待，默认 `1200`。
- `XHS_CHINESE_SEARCH_SLEEP_MAX_MS`
  - 每批搜索词后的最长随机等待，默认 `3500`。
- `XHS_CHINESE_MAX_DETAIL_PER_CATEGORY`
  - 单个品类最多进入详情页校验的候选数。
- `XHS_CHINESE_MAX_DETAIL_MULTIPLIER`
  - 未设置详情上限时，用 `目标条数 * 倍数` 计算默认上限，默认 `10`。
