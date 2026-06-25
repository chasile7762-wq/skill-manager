# Codex Skill 管理器

这是一个本地桌面管理工具，用来统一查看和管理以下三类 Codex skill：

- 全局 skill：`~/.codex/skills/*`
- 系统预装 skill：`~/.codex/skills/.system/*`
- 项目级 skill：`<project>/.agents/skills/*`

## 当前能力

- 统一扫描与展示全局、系统预装、项目级 skill
- 按名称、来源、状态、项目筛选
- 查看 skill 详情、路径、frontmatter 预览
- 手动添加项目，并自动合并 Codex 已信任项目
- 从本地目录或 GitHub tree URL 安装 skill
- 删除非只读 skill
- 保存本地筛选偏好和安装历史

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm install` | 安装前端依赖 |
| `npm run test` | 运行前端测试 |
| `npm run build` | 生成前端发布文件到 `dist/` |
| `npm run preview` | 本地静态预览构建结果 |
| `npm run desktop:dev` | 启动 Tauri 开发模式 |
| `npm run desktop:build` | 打包 Windows 桌面版 |
| `powershell -ExecutionPolicy Bypass -File .\scripts\build-desktop.ps1` | 一键完成依赖安装、前端构建和桌面打包 |

## 目录结构

- `src/`：React 前端界面
- `src-tauri/`：Tauri Rust 后端、扫描逻辑、安装删除逻辑
- `dist/`：前端构建产物
- `scripts/`：辅助脚本
- `docs/`：用户说明和交付文档

## 打包说明

打包 `.exe` 需要先具备以下环境：

- Node.js
- Rust toolchain（`cargo`、`rustc`）
- Tauri CLI
- Windows C++ 编译工具链

当前仓库已经补好 Tauri 配置；如果本机环境齐全，执行：

```powershell
npm run desktop:build
```

生成的安装包或可执行文件通常会出现在：

```text
src-tauri/target/release/bundle/
```

## 说明手册

详细使用说明见：

- [docs/用户使用手册.md](</C:/Users/shanj/Documents/skills manager/docs/用户使用手册.md>)
- [docs/打包交付说明.md](</C:/Users/shanj/Documents/skills manager/docs/打包交付说明.md>)
