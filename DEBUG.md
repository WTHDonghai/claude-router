# Claude Router 调试指南

## 调试方法

### 1. 启用调试模式

有几种方式启用调试模式：

#### 方法1: 命令行参数
```bash
claudex -p moonshot --debug
```

#### 方法2: 环境变量
```bash
export CLAUDEX_DEBUG=true
claudex -p moonshot
```

#### 方法3: DEBUG 环境变量 
```bash
export DEBUG=true
claudex -p moonshot
```

### 2. 调试输出

启用调试模式后，你会看到灰色的调试信息，例如：
```
[DEBUG] Loading provider config for: moonshot
[DEBUG] Providers config path: /Users/xxx/.claudex/providers.json
[DEBUG] Available providers: moonshot, zhipu, claude
[DEBUG] Provider config for moonshot: { "name": "月之暗面", ... }
```

### 3. 使用调试工具

#### 基本调试命令
```bash
# 构建并启动交互式调试
npm run debug

# 测试供应商配置功能
npm run debug:providers

# 测试配置映射功能
npm run debug:mapping
```

#### 手动调试步骤
```bash
# 1. 设置调试环境
node debug/debug.js setup

# 2. 显示当前文件状态
node debug/debug.js show

# 3. 运行特定命令
node debug/debug.js run providers

# 4. 清理调试环境
node debug/debug.js cleanup
```

## 调试场景

### 1. 配置文件读取问题

如果配置文件读取有问题，检查以下内容：

```bash
# 启用调试模式查看详细日志
claudex providers --debug

# 检查配置文件是否存在
ls ~/.claudex/providers.json

# 检查配置文件格式
cat ~/.claudex/providers.json | jq .
```

### 2. Claude 设置映射问题

如果配置没有正确映射到 Claude 设置：

```bash
# 查看映射过程
claudex -p moonshot --debug

# 检查生成的 Claude 配置
cat ~/.claude/settings.json

# 检查备份文件
cat ~/.claude/settings.backup.json
```

### 3. 权限问题

如果遇到权限错误：

```bash
# 检查目录权限
ls -la ~/.claudex/
ls -la ~/.claude/

# 手动创建目录（如果需要）
mkdir -p ~/.claudex ~/.claude
```

## 调试输出解读

### 供应商配置加载
```
[DEBUG] Loading provider config for: moonshot
[DEBUG] Providers config path: /Users/xxx/.claudex/providers.json
[DEBUG] Available providers: moonshot, zhipu, claude
[DEBUG] Provider config for moonshot: {
  "name": "月之暗面",
  "base_url": "https://api.moonshot.cn/v1",
  "api_key": "your-key",
  "auth_token": "your-token"
}
```

### Claude 设置备份和更新
```
[DEBUG] Backing up Claude settings
[DEBUG] Claude settings path: /Users/xxx/.claude/settings.json
[DEBUG] Claude backup path: /Users/xxx/.claude/settings.backup.json
[DEBUG] Input config: { baseUrl: "...", auth_token: "..." }
[DEBUG] Loaded existing Claude config: { env: {...}, permissions: {...} }
[DEBUG] Setting ANTHROPIC_BASE_URL to: https://api.moonshot.cn/v1
[DEBUG] Setting ANTHROPIC_AUTH_TOKEN from auth_token: your-token
[DEBUG] Final Claude config: { env: {...}, permissions: {...} }
[DEBUG] Claude settings written successfully
```

## 常见问题

### 1. 配置文件不存在
**问题**: `⚠️ 供应商配置文件不存在`
**解决**: 
```bash
# 初始化配置文件
claudex providers
# 或手动创建
mkdir -p ~/.claudex
cp config/providers.json ~/.claudex/
```

### 2. API 密钥验证失败
**问题**: `❌ 配置验证失败: • 缺少API密钥`
**解决**: 检查 providers.json 中的 api_key 或 auth_token 字段

### 3. Claude Code 未安装
**问题**: `❌ Claude Code未安装或不在PATH中`
**解决**: 
```bash
# 检查 Claude Code 安装
which claude
claude --version

# 如果未安装，访问 https://claude.ai/code
```

## 测试配置

使用测试模式验证配置：

```bash
# 运行所有测试
npm run test:all

# 只运行配置测试
npm run test:config

# 使用调试配置测试
npm run debug:providers
```

## 文件位置

- **配置文件**: `~/.claudex/providers.json`
- **Claude 设置**: `~/.claude/settings.json`
- **备份文件**: `~/.claude/settings.backup.json`
- **调试配置**: `debug/debug-config.json`
- **调试脚本**: `debug/debug.js`

## 进阶调试

### 使用 Node.js 调试器

```bash
# 使用 Node.js 内置调试器
node --inspect-brk dist/index.js -p moonshot --debug

# 在浏览器中访问 chrome://inspect
```

### 自定义调试级别

你可以修改 `debug()` 方法来支持不同的调试级别：

```typescript
private debug(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  if (this.debugMode) {
    const color = level === 'error' ? 'red' : level === 'warn' ? 'yellow' : 'gray';
    console.log(chalk[color](`[DEBUG:${level.toUpperCase()}] ${message}`));
    if (data !== undefined) {
      console.log(chalk[color](JSON.stringify(data, null, 2)));
    }
  }
}
```