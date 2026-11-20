# mechatsvip.github.io

个人博客主页，通过 GitHub Issues 管理文章内容。

## 发布文章

在本仓库新建一个 Issue：Issue 标题作为文章标题，Issue 正文作为文章内容（支持常见 Markdown 格式）。保存后，主页会自动从 GitHub Issues API 加载并展示文章；无需修改代码或重新部署。文章按创建时间倒序排列，关闭的 Issue 也会保留在博客中。

GitHub Pages 从 `main` 分支根目录发布 `index.html`。页面样式和文章展示逻辑位于根目录的 `index.html`。
