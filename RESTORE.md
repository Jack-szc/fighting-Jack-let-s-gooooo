# 恢复说明

这个仓库保存的是“核心工作流脚本”，不是完整运行环境。

## 本地运行环境位置

当前运行环境在：

```text
/Users/jkos/Documents/New project/xhs-content-runner
```

## 回滚单个脚本

如果某个脚本改坏了，可以从本仓库复制对应文件覆盖本地运行环境。

例如恢复中文搜索脚本：

```bash
cp scripts/search_xhs_chinese_candidates.ts "/Users/jkos/Documents/New project/xhs-content-runner/scripts/search_xhs_chinese_candidates.ts"
```

恢复 Excel 导出脚本：

```bash
cp scripts/write_xhs_chinese_note_table.py "/Users/jkos/Documents/New project/xhs-content-runner/scripts/write_xhs_chinese_note_table.py"
```

## 回滚到某个历史版本

查看提交历史：

```bash
git log --oneline
```

切回某个提交查看文件：

```bash
git checkout <commit_id>
```

回到最新版：

```bash
git checkout main
```

## 重要边界

本仓库可以回滚：

- 中文素材搜索逻辑。
- 品类配置字段。
- 粉丝范围过滤。
- 高风险标记规则。
- Excel 导出格式。
- 历史库/笔记 ID 避重逻辑。

本仓库不回滚：

- cookie 或登录态。
- 小红书底层请求签名静态代码。
- 输出 Excel、素材结果、历史库数据。
- 依赖包目录。

这些内容保留在本地运行环境中，不上传到 GitHub。

