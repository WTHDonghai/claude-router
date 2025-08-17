#!/usr/bin/env node

/**
 * 调试工具脚本
 * 用于测试和调试 claude-router 的各项功能
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 调试配置
const DEBUG_DIR = path.join(os.tmpdir(), 'claudex-debug');
const DEBUG_CONFIG_DIR = path.join(DEBUG_DIR, '.claudex');
const DEBUG_CLAUDE_DIR = path.join(DEBUG_DIR, '.claude');

class DebugHelper {
  constructor() {
    this.originalHome = os.homedir();
    this.scriptPath = path.join(__dirname, '..', 'dist', 'index.js');
  }

  async setup() {
    console.log('🔧 设置调试环境...');
    
    // 清理并创建调试目录
    await fs.remove(DEBUG_DIR);
    await fs.ensureDir(DEBUG_CONFIG_DIR);
    await fs.ensureDir(DEBUG_CLAUDE_DIR);
    
    // 复制调试配置
    const debugConfigPath = path.join(__dirname, 'debug-config.json');
    const targetConfigPath = path.join(DEBUG_CONFIG_DIR, 'providers.json');
    await fs.copy(debugConfigPath, targetConfigPath);
    
    console.log(`✅ 调试环境已设置: ${DEBUG_DIR}`);
    console.log(`📂 配置目录: ${DEBUG_CONFIG_DIR}`);
    console.log(`📂 Claude目录: ${DEBUG_CLAUDE_DIR}`);
  }

  async cleanup() {
    console.log('🧹 清理调试环境...');
    await fs.remove(DEBUG_DIR);
    console.log('✅ 调试环境已清理');
  }

  async runCommand(args, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`\n🚀 运行命令: claudex ${args.join(' ')}`);
      
      const env = {
        ...process.env,
        HOME: DEBUG_DIR,  // 重定向到调试目录
        USERPROFILE: DEBUG_DIR, // Windows 兼容
        CLAUDEX_DEBUG: 'true',
        ...options.env
      };

      const child = spawn('node', [this.scriptPath, ...args], {
        stdio: options.silent ? 'pipe' : 'inherit',
        env,
        shell: true
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      child.on('error', reject);
    });
  }

  async showFiles() {
    console.log('\n📁 当前调试文件状态:');
    
    // 显示 providers.json
    const providersPath = path.join(DEBUG_CONFIG_DIR, 'providers.json');
    if (await fs.pathExists(providersPath)) {
      console.log('\n📄 providers.json:');
      const providers = await fs.readJson(providersPath);
      console.log(JSON.stringify(providers, null, 2));
    }

    // 显示 Claude settings.json
    const claudeSettingsPath = path.join(DEBUG_CLAUDE_DIR, 'settings.json');
    if (await fs.pathExists(claudeSettingsPath)) {
      console.log('\n📄 .claude/settings.json:');
      const claudeSettings = await fs.readJson(claudeSettingsPath);
      console.log(JSON.stringify(claudeSettings, null, 2));
    } else {
      console.log('\n📄 .claude/settings.json: 不存在');
    }

    // 显示备份文件
    const backupPath = path.join(DEBUG_CLAUDE_DIR, 'settings.backup.json');
    if (await fs.pathExists(backupPath)) {
      console.log('\n📄 .claude/settings.backup.json:');
      const backup = await fs.readJson(backupPath);
      console.log(JSON.stringify(backup, null, 2));
    }
  }

  async testProviderConfig() {
    console.log('\n🧪 测试供应商配置功能...');
    
    await this.setup();
    
    try {
      // 测试显示供应商列表
      console.log('\n1. 测试显示供应商列表:');
      await this.runCommand(['providers']);
      
      // 测试使用 moonshot 配置
      console.log('\n2. 测试使用 moonshot 配置 (模拟，不实际启动):');
      await this.runCommand(['-p', 'moonshot', '--debug'], { 
        env: { MOCK_CLAUDE_CHECK: 'true' }
      });
      
      await this.showFiles();
      
    } finally {
      await this.cleanup();
    }
  }

  async testConfigMapping() {
    console.log('\n🧪 测试配置映射功能...');
    
    await this.setup();
    
    try {
      // 创建一个现有的 Claude 配置
      const existingConfig = {
        env: {
          EXISTING_VAR: 'existing-value'
        },
        permissions: {
          allow: ['WebFetch', 'ExistingTool']
        },
        customField: 'custom-value'
      };
      
      const claudeSettingsPath = path.join(DEBUG_CLAUDE_DIR, 'settings.json');
      await fs.writeJson(claudeSettingsPath, existingConfig, { spaces: 2 });
      
      console.log('\n创建了现有 Claude 配置:');
      await this.showFiles();
      
      // 测试配置映射
      console.log('\n执行配置映射 (使用 test-provider):');
      await this.runCommand(['-p', 'test-provider', '--debug'], {
        env: { MOCK_CLAUDE_CHECK: 'true' }
      });
      
      console.log('\n配置映射后的文件状态:');
      await this.showFiles();
      
    } finally {
      await this.cleanup();
    }
  }

  async interactiveDebug() {
    console.log('\n🔍 交互式调试模式');
    console.log('可用命令:');
    console.log('  setup - 设置调试环境');
    console.log('  cleanup - 清理调试环境');
    console.log('  show - 显示文件状态');
    console.log('  test-providers - 测试供应商配置');
    console.log('  test-mapping - 测试配置映射');
    console.log('  run [args] - 运行 claudex 命令');
    console.log('  exit - 退出');
    
    // 这里可以添加交互式命令行接口
    console.log('\n💡 提示: 直接运行具体测试方法或使用 npm run debug');
  }
}

// 命令行处理
const debugHelper = new DebugHelper();
const command = process.argv[2];

switch (command) {
  case 'setup':
    await debugHelper.setup();
    break;
  case 'cleanup':
    await debugHelper.cleanup();
    break;
  case 'show':
    await debugHelper.showFiles();
    break;
  case 'test-providers':
    await debugHelper.testProviderConfig();
    break;
  case 'test-mapping':
    await debugHelper.testConfigMapping();
    break;
  case 'run':
    await debugHelper.setup();
    await debugHelper.runCommand(process.argv.slice(3));
    await debugHelper.showFiles();
    await debugHelper.cleanup();
    break;
  default:
    await debugHelper.interactiveDebug();
}