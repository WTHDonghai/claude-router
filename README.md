# Claude Router - 多供应商AI模型启动脚本

一个支持多个AI模型供应商的Claude Code启动脚本，可以通过命令行参数动态切换不同供应商的模型配置，替代硬编码在`~/.claude/settings.json`中的配置方式。支持月之暗面、智谱AI、Claude官方、OpenAI等多个供应商。

## 🚀 功能特性

- ✅ **多供应商支持**：支持月之暗面、智谱AI、Claude官方、OpenAI等多个供应商
- ✅ **动态配置切换**：通过命令行参数快速切换不同供应商和模型
- ✅ **简化配置结构**：采用扁平化配置，易于理解和维护
- ✅ **配置管理**：自动备份原始配置，支持一键恢复
- ✅ **友好界面**：彩色终端输出，清晰的状态提示和帮助信息
- ✅ **自动初始化**：首次运行自动创建配置文件
- ✅ **跨平台兼容**：支持Windows、macOS、Linux
- ✅ **终端内运行**：在当前终端中直接运行Claude Code，而不是作为独立进程启动

## 🚀 快速开始

### 首次使用设置

首次运行时，程序会自动创建配置目录和配置文件，无需手动设置：

```bash
# 首次运行任意供应商命令会自动初始化配置
node dist/index.js -p moonshot

# 程序会自动创建配置文件，编辑并替换示例API密钥
# Windows: notepad %USERPROFILE%\.claudex\providers.json
# macOS/Linux: nano ~/.claudex/providers.json

# 编辑完成后，再次运行即可正常使用
node dist/index.js -p moonshot
```

### 使用预配置供应商（推荐）

```bash
# 使用月之暗面
node dist/index.js -p moonshot

# 使用智谱AI
node dist/index.js -p zhipu

# 使用Claude官方
node dist/index.js -p claude

# 使用OpenAI
node dist/index.js -p openai

# 指定项目路径
node dist/index.js -p moonshot /path/to/your/project
```

## 📦 安装

### 本地安装

```bash
# 克隆项目
git clone <repository-url>
cd claude-router

# 安装依赖
npm install

# 构建项目
npm run build

# 全局链接（可选）
npm link
```

### 全局安装（可选）

```bash
npm install -g claude-router
# 安装后可直接使用 claude-router 命令
```

## 🎯 使用方法

### 基本命令

```bash
# 显示帮助信息
node dist/index.js --help

# 显示支持的供应商列表
node dist/index.js providers

# 查看当前配置
node dist/index.js config --show

# 恢复备份配置
node dist/index.js config --restore
```

### 启动Claude Code

```bash
# 使用预配置供应商启动（推荐）
node dist/index.js -p moonshot

# 使用自定义参数启动
node dist/index.js -m claude-3-5-sonnet-20241022 -k your-api-key

# 完整配置启动
node dist/index.js \
  -m claude-3-5-sonnet-20241022 \
  -k your-api-key \
  -u https://api.anthropic.com \
  -t 4000 \
  --temperature 0.7 \
  /path/to/your/project
```

## 📋 命令参数

### 主要参数

| 参数 | 简写 | 描述 | 示例 |
|------|------|------|------|
| `--provider` | `-p` | 指定供应商 | `moonshot`, `zhipu`, `claude`, `openai` |
| `--model` | `-m` | 指定模型 | `claude-3-5-sonnet-20241022` |
| `--api-key` | `-k` | 设置API密钥 | `sk-ant-api03-...` |
| `--base-url` | `-u` | 设置API基础URL | `https://api.anthropic.com` |
| `--max-tokens` | `-t` | 设置最大token数 | `4000` |
| `--temperature` | | 设置温度参数 | `0.7` |

### config 命令

| 参数 | 描述 |
|------|------|
| `--show` | 显示当前配置 |
| `--restore` | 恢复备份配置 |

## 🤖 支持的供应商

### 月之暗面 (moonshot)
- 默认模型: `moonshot-v1-8k`
- API地址: `https://api.moonshot.cn/v1`

### 智谱AI (zhipu)
- 默认模型: `glm-4`
- API地址: `https://open.bigmodel.cn/api/paas/v4`

### Anthropic Claude (claude)
- 默认模型: `claude-3-5-sonnet-20241022`
- API地址: `https://api.anthropic.com`

### OpenAI (openai)
- 默认模型: `gpt-4o`
- API地址: `https://api.openai.com/v1`

## 📁 配置文件位置

- **Claude配置文件**: `~/.claude/settings.json`
- **备份文件**: `~/.claude/settings.backup.json`
- **供应商配置文件**: `~/.claudex/providers.json`

## 📝 配置文件格式

供应商配置文件 (`~/.claudex/providers.json`) 采用简化的扁平结构：

```json
{
  "moonshot": {
    "name": "月之暗面",
    "baseUrl": "https://api.moonshot.cn/v1",
    "apiKey": "your-moonshot-api-key",
    "model": "moonshot-v1-8k"
  },
  "zhipu": {
    "name": "智谱AI",
    "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
    "apiKey": "your-zhipu-api-key",
    "model": "glm-4"
  }
}
```

## 🔧 开发

```bash
# 开发模式运行
npm run dev

# 构建项目
npm run build

# 运行构建后的版本
npm start
```

## 📝 使用示例

### 查看支持的供应商

```bash
# 显示所有支持的供应商
node dist/index.js providers
```

### 月之暗面 (Moonshot)

```bash
# 使用预配置启动（推荐）
node dist/index.js -p moonshot

# 自定义API密钥启动
node dist/index.js -p moonshot -k your-moonshot-api-key

# 指定项目路径
node dist/index.js -p moonshot /path/to/your/project
```

### 智谱AI (Zhipu)

```bash
# 使用预配置启动
node dist/index.js -p zhipu

# 自定义模型
node dist/index.js -p zhipu -m glm-4-plus
```

### Anthropic Claude

```bash
# 使用预配置启动
node dist/index.js -p claude

# 指定特定模型
node dist/index.js -p claude -m claude-3-5-haiku-20241022
```

### OpenAI

```bash
# 使用预配置启动
node dist/index.js -p openai

# 使用GPT-4模型
node dist/index.js -p openai -m gpt-4
```

### 自定义配置

```bash
# 完全自定义配置
node dist/index.js \
  -m claude-3-5-sonnet-20241022 \
  -k your-api-key \
  -u https://api.anthropic.com \
  -t 4000 \
  --temperature 0.7
```

### 配置管理

```bash
# 查看当前配置
node dist/index.js config --show

# 恢复备份配置
node dist/index.js config --restore

# 查看支持的供应商
node dist/index.js providers
```

## 📖 命令参考

### `node dist/index.js providers`

显示支持的模型供应商列表，包括每个供应商的详细信息和API密钥配置状态。

### `node dist/index.js [options] [project-path]`

启动Claude Code并应用指定的模型供应商配置。

**主要参数：**
- `-p, --provider <provider>` - 指定供应商 (moonshot|zhipu|claude|openai)
- `-m, --model <model>` - 指定模型名称
- `-k, --api-key <key>` - 设置API密钥
- `-u, --base-url <url>` - 设置API基础URL
- `-t, --max-tokens <number>` - 设置最大token数
- `--temperature <number>` - 设置温度参数
- `[project-path]` - 指定项目路径（位置参数）

### `node dist/index.js config`

配置管理命令。

**参数：**
- `--show` - 显示当前配置
- `--restore` - 恢复备份配置

## 🛠️ 故障排除

### Claude Code未找到

```
❌ Claude Code未安装或不在PATH中
💡 请先安装Claude Code: https://claude.ai/code
```

**解决方案**: 确保Claude Code已正确安装并添加到系统PATH中。

### 配置文件权限问题

```
❌ 生成配置文件失败: EACCES: permission denied
```

**解决方案**: 检查`~/.claude/`目录的读写权限。

### API密钥无效

确保提供的API密钥格式正确且有效：
- **Claude**: `sk-ant-api03-...` (来源: https://console.anthropic.com/)
- **月之暗面**: `sk-...` (来源: https://platform.moonshot.cn/)
- **智谱AI**: 获取方式请参考智谱AI官方文档
- **OpenAI**: `sk-...` (来源: https://platform.openai.com/)

### 配置文件问题

如果配置文件损坏或格式错误，可以删除配置文件重新初始化：

```bash
# Windows
del %USERPROFILE%\.claudex\providers.json

# macOS/Linux
rm ~/.claudex/providers.json

# 重新运行程序会自动创建新的配置文件
node dist/index.js providers
```

## 📄 版本信息

当前版本: **v2.0.4**

### 更新日志

**v2.0.4** - 配置结构简化
- 简化 ProviderConfig 接口，移除冗余属性
- 修正配置路径为 `~/.claudex/`
- 简化验证逻辑，移除过时命令
- 采用扁平化配置结构，易于理解和维护

**v2.0.3** - 终端集成优化
- 优化终端集成和用户体验

## 📄 许可证

ISC License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如果遇到问题，请：
1. 查看本README的故障排除部分
2. 提交Issue并附上详细的错误信息
3. 使用`node dist/index.js config --show`检查当前配置状态
4. 使用`node dist/index.js providers`查看供应商配置