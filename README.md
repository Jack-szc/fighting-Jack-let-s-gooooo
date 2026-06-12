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
