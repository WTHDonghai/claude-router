# Claude Router

🚀 多供应商AI模型启动脚本 - 支持Claude、Moonshot、智谱AI等多个供应商的快速配置和启动工具

[![Version](https://img.shields.io/badge/version-2.0.5-blue.svg)](https://github.com/your-username/claude-router)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

## ✨ 特性

- 🔄 **多供应商支持**: 支持 Moonshot、智谱AI、Claude、OpenAI 等多个AI供应商
- ⚡ **快速切换**: 一键切换不同的AI模型供应商
- 🛡️ **配置管理**: 智能管理Claude Code配置，自动备份和恢复
- 🔧 **灵活配置**: 支持从配置文件或命令行参数进行配置
- 🐛 **调试模式**: 内置详细的调试功能，便于问题排查
- 🧪 **完整测试**: 包含单元测试和集成测试
- 📝 **环境变量清理**: 精确管理环境变量，只保留实际需要的配置

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/your-username/claude-router.git
cd claude-router

# 安装依赖
npm install

# 构建项目
npm run build

# 全局链接
npm link
```

### 基本使用

```bash
# 查看帮助
claudex --help

# 查看支持的供应商
claudex providers

# 使用月之暗面 (Moonshot)
claudex -p moonshot

# 使用智谱AI
claudex -p zhipu

# 手动指定参数
claudex -k your-api-key -u https://api.example.com

# 启用调试模式
claudex -p moonshot --debug
```

## 📁 配置文件

### 供应商配置 (`~/.claudex/providers.json`)

```json
{
  "moonshot": {
    "name": "月之暗面",
    "base_url": "https://api.moonshot.cn/v1",
    "api_key": "your-moonshot-key"
  },
  "zhipu": {
    "name": "智谱AI",
    "base_url": "https://open.bigmodel.cn/api/paas/v4",
    "api_key": "your-zhipu-key"
  }
}
```

### 支持的配置字段

| 字段 | 描述 | 必需 |
|------|------|------|
| `name` | 供应商显示名称 | ✅ |
| `base_url` | API基础URL | ✅ |
| `api_key` | API密钥 | ⭐ |
| `auth_token` | 认证令牌（优先于api_key） | ⭐ |
| `model` | 默认模型名称 | ❌ |

> ⭐ `api_key` 和 `auth_token` 至少需要提供一个

## 🔧 命令行选项

```bash
claudex [options] [project-path]

选项:
  -V, --version              显示版本号
  -k, --api-key <key>        API密钥
  -u, --base-url <url>       API基础URL
  -p, --provider <name>      供应商名称 (moonshot, zhipu, claude, openai)
  -d, --debug                启用调试模式
  -h, --help                 显示帮助信息

命令:
  providers                  显示支持的模型供应商列表
  config [options]           配置管理命令
```

## 📋 使用示例

### 基本用法

```bash
# 使用预配置的供应商
claudex -p moonshot

# 指定项目路径
claudex -p zhipu /path/to/project

# 手动指定所有参数
claudex -k sk-xxx -u https://api.custom.com /path/to/project
```

### 配置管理

```bash
# 显示当前配置
claudex config --show

# 恢复备份配置
claudex config --restore
```

### 调试模式

```bash
# 启用调试模式查看详细日志
claudex -p moonshot --debug

# 使用环境变量启用调试
export CLAUDEX_DEBUG=true
claudex -p moonshot
```

## 🐛 调试功能

### 启用调试模式

```bash
# 方法1: 命令行参数
claudex --debug

# 方法2: 环境变量
export CLAUDEX_DEBUG=true
# 或
export DEBUG=true
```

### 调试工具

```bash
# 运行调试工具
npm run debug

# 测试供应商配置
npm run debug:providers

# 测试配置映射
npm run debug:mapping
```

### 调试输出示例

```
[DEBUG] Loading provider config for: moonshot
[DEBUG] Available providers: moonshot, zhipu, claude
[DEBUG] Setting ANTHROPIC_BASE_URL to: https://api.moonshot.cn/v1
[DEBUG] Using auth_token for ANTHROPIC_AUTH_TOKEN: sk-xxx
```

## 🧪 测试

```bash
# 运行所有测试
npm run test:all

# 运行基础功能测试
npm run test

# 运行配置功能测试
npm run test:config
```

## 📂 项目结构

```
claude-router/
├── src/                    # 源代码
│   └── index.ts           # 主程序
├── test/                   # 测试文件
│   ├── basic-test.js      # 基础功能测试
│   └── config-test.js     # 配置功能测试
├── debug/                  # 调试工具
│   ├── debug.js           # 调试脚本
│   └── debug-config.json  # 调试配置
├── config/                 # 默认配置
│   └── providers.json     # 默认供应商配置
├── dist/                   # 编译输出
├── DEBUG.md               # 调试指南
├── README.md              # 项目文档
├── package.json           # 项目配置
└── tsconfig.json          # TypeScript配置
```

## 🔄 工作原理

1. **配置加载**: 从 `~/.claudex/providers.json` 加载供应商配置
2. **参数验证**: 验证必需的配置参数
3. **环境配置**: 精确管理 Claude Code 的环境变量
4. **备份管理**: 自动备份和恢复配置文件
5. **启动服务**: 启动 Claude Code 或执行相应操作

### 环境变量映射

| 配置字段 | 环境变量 | 优先级 |
|----------|----------|--------|
| `base_url` | `ANTHROPIC_BASE_URL` | - |
| `auth_token` | `ANTHROPIC_AUTH_TOKEN` | 高 |
| `api_key` | `ANTHROPIC_AUTH_TOKEN` | 低 |

> 注意: `auth_token` 优先于 `api_key`，只有非空值才会被设置

## 🛠️ 开发

### 开发环境设置

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建项目
npm run build

# 监听文件变化
npm run dev -- --watch
```

### 添加新供应商

1. 在 `config/providers.json` 中添加供应商配置
2. 确保包含必需的字段 (`name`, `base_url`, `api_key` 或 `auth_token`)
3. 运行测试验证配置

### 调试新功能

```bash
# 使用调试配置测试
npm run debug:providers

# 查看详细日志
CLAUDEX_DEBUG=true claudex -p your-provider
```

## 📋 常见问题

### Q: 如何添加新的供应商？

A: 编辑 `~/.claudex/providers.json` 文件，添加新的供应商配置：

```json
{
  "my-provider": {
    "name": "我的供应商",
    "base_url": "https://api.myprovider.com",
    "api_key": "your-api-key"
  }
}
```

### Q: 如何查看当前配置？

A: 使用 `claudex config --show` 或启用调试模式查看详细配置信息。

### Q: 配置文件在哪里？

A: 
- 供应商配置: `~/.claudex/providers.json`
- 主配置: `~/.claudex/settings.json`
- Claude配置: `~/.claude/settings.json`

### Q: 如何恢复配置？

A: 使用 `claudex config --restore` 恢复备份的配置。

### Q: 支持哪些供应商？

A: 目前支持 Moonshot、智谱AI、Claude、OpenAI 等，可以通过配置文件添加更多供应商。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🎯 路线图

- [ ] 支持更多AI供应商
- [ ] 图形化配置界面
- [ ] 配置文件加密
- [ ] 使用统计和分析
- [ ] 插件系统
- [ ] Docker 支持

## 📞 支持

如果你遇到问题或有建议，请：

1. 查看 [调试指南](DEBUG.md)
2. 搜索现有的 [Issues](https://github.com/your-username/claude-router/issues)
3. 创建新的 Issue

---

⭐ 如果这个项目对你有帮助，请给它一个星标！