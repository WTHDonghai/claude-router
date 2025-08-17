# 安装指南

## 🚀 快速安装

### 方法 1: 源码安装（推荐）

```bash
# 1. 进入项目目录
cd D:\workspace\xr\ai\lab\claude-router

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 全局链接
npm link
```

### 方法 2: 打包安装

```bash
# 1. 打包项目
npm pack

# 2. 全局安装
npm install -g model-router-2.0.5.tgz
```

### 方法 3: 本地使用（无需安装）

```bash
# 1. 构建项目
npm run build

# 2. 直接使用
node dist/index.js --help

# 3. 创建别名（Windows PowerShell）
Set-Alias claudex "node D:\workspace\xr\ai\lab\claude-router\dist\index.js"
```

## ✅ 验证安装

```bash
# 检查版本
claudex --version

# 查看帮助
claudex --help

# 查看供应商
claudex providers
```

## ⚙️ 初次配置

### 1. 创建配置文件

首次运行会自动创建配置目录：
```bash
claudex providers
```

### 2. 编辑供应商配置

编辑 `~/.claudex/providers.json`:

```json
{
  "moonshot": {
    "name": "月之暗面",
    "base_url": "https://api.moonshot.cn/v1",
    "api_key": "your-moonshot-api-key"
  },
  "zhipu": {
    "name": "智谱AI", 
    "base_url": "https://open.bigmodel.cn/api/paas/v4",
    "api_key": "your-zhipu-api-key"
  }
}
```

### 3. 测试配置

```bash
# 测试 moonshot 配置
claudex -p moonshot --debug

# 不启动 Claude Code，只测试配置
SKIP_CLAUDE_LAUNCH=true claudex -p moonshot --debug
```

## 🔧 配置文件位置

| 文件 | 位置 | 作用 |
|------|------|------|
| `providers.json` | `~/.claudex/` | 供应商配置 |
| `settings.json` | `~/.claudex/` | 主配置文件 |
| `settings.json` | `~/.claude/` | Claude Code 配置 |

## 🗑️ 卸载

```bash
# 取消全局链接
npm unlink -g claudex

# 或卸载全局包
npm uninstall -g model-router

# 清理配置文件（可选）
# Windows
rmdir /s %USERPROFILE%\.claudex

# macOS/Linux  
rm -rf ~/.claudex
```

## ❗ 常见问题

### 权限问题
```bash
# Windows: 以管理员身份运行
# macOS/Linux: 使用 sudo
sudo npm link
```

### 路径问题
确保 Node.js 和 npm 在系统 PATH 中：
```bash
node --version
npm --version
```

### 配置问题
使用调试模式查看详细信息：
```bash
claudex --debug
```

## 📞 获取帮助

- 查看完整文档: [README.md](README.md)
- 调试指南: [DEBUG.md](DEBUG.md)
- 提交问题: [GitHub Issues](https://github.com/your-username/claude-router/issues)