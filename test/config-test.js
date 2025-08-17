#!/usr/bin/env node

import { strict as assert } from 'assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试用的临时目录
const TEST_DIR = path.join(os.tmpdir(), 'claude-router-test');
const TEST_CONFIG_DIR = path.join(TEST_DIR, '.claudex');
const TEST_CLAUDE_DIR = path.join(TEST_DIR, '.claude');

class ConfigTester {
  async setup() {
    // 清理并创建测试目录
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_CONFIG_DIR);
    await fs.ensureDir(TEST_CLAUDE_DIR);
    
    // 创建测试用的 providers.json
    const testProvidersConfig = {
      "moonshot": {
        "name": "月之暗面",
        "base_url": "https://api.moonshot.cn/v1",
        "api_key": "test-moonshot-key",
        "auth_token": "test-moonshot-token"
      },
      "zhipu": {
        "name": "智谱",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "api_key": "test-zhipu-key",
        "auth_token": ""
      },
      "claude": {
        "name": "Claude",
        "base_url": "https://api.anthropic.com",
        "api_key": "test-claude-key",
        "auth_token": "test-claude-token"
      }
    };
    
    await fs.writeJson(path.join(TEST_CONFIG_DIR, 'providers.json'), testProvidersConfig, { spaces: 2 });
  }

  async cleanup() {
    await fs.remove(TEST_DIR);
  }

  // 模拟 ModelProviderLauncher 的关键方法进行直接测试
  async testLoadProviderConfig() {
    const providersConfigPath = path.join(TEST_CONFIG_DIR, 'providers.json');
    
    if (await fs.pathExists(providersConfigPath)) {
      const providersConfig = await fs.readJson(providersConfigPath);
      return providersConfig;
    }
    return null;
  }

  async testBackupClaudeSettings(config) {
    const claudeSettingsPath = path.join(TEST_CLAUDE_DIR, 'settings.json');
    const claudeBackupPath = path.join(TEST_CLAUDE_DIR, 'settings.backup.json');
    
    try {
      // 确保.claude目录存在
      await fs.ensureDir(path.dirname(claudeSettingsPath));
      
      // 备份原始配置文件（如果存在）
      if (await fs.pathExists(claudeSettingsPath)) {
        await fs.copy(claudeSettingsPath, claudeBackupPath);
      }
      
      // 读取现有配置（如果存在）
      let existingConfig = {
        env: {},
        permissions: {
          allow: ["WebFetch"]
        }
      };
      
      if (await fs.pathExists(claudeSettingsPath)) {
        try {
          existingConfig = await fs.readJson(claudeSettingsPath);
        } catch (error) {
          // 使用默认配置
        }
      }
      
      // 更新环境变量 - 只保留providers.json中存在且有值的字段
      if (!existingConfig.env) {
        existingConfig.env = {};
      }
      
      // 清理旧的Anthropic相关环境变量
      delete existingConfig.env.ANTHROPIC_BASE_URL;
      delete existingConfig.env.ANTHROPIC_AUTH_TOKEN;
      
      // 只设置providers.json中存在且有值的字段
      if (config.baseUrl && config.baseUrl.trim() !== '') {
        existingConfig.env.ANTHROPIC_BASE_URL = config.baseUrl;
      }
      
      // 优先使用 auth_token，如果不存在或为空则使用 apiKey
      let authToken = '';
      if (config.auth_token && config.auth_token.trim() !== '') {
        authToken = config.auth_token;
      } else if (config.apiKey && config.apiKey.trim() !== '') {
        authToken = config.apiKey;
      }
      
      if (authToken) {
        existingConfig.env.ANTHROPIC_AUTH_TOKEN = authToken;
      }
      
      // 写入更新后的配置
      await fs.writeJson(claudeSettingsPath, existingConfig, { spaces: 2 });
      
      return true;
    } catch (error) {
      console.error('备份Claude配置文件失败:', error);
      return false;
    }
  }
}

async function runConfigTests() {
  console.log('🧪 开始配置功能测试...');
  console.log('================================');
  
  const tester = new ConfigTester();
  await tester.setup();
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    {
      name: '测试 providers.json 配置读取',
      test: async () => {
        const providersConfig = await tester.testLoadProviderConfig();
        
        assert(providersConfig !== null, 'providers.json 应该存在');
        assert(providersConfig.moonshot, 'moonshot 配置应该存在');
        
        const moonshotConfig = providersConfig.moonshot;
        assert.equal(moonshotConfig.name, '月之暗面', 'moonshot 名称应该正确');
        assert.equal(moonshotConfig.base_url, 'https://api.moonshot.cn/v1', 'moonshot base_url 应该正确');
        assert.equal(moonshotConfig.api_key, 'test-moonshot-key', 'moonshot api_key 应该正确');
        assert.equal(moonshotConfig.auth_token, 'test-moonshot-token', 'moonshot auth_token 应该正确');
        
        // 测试 zhipu 配置
        const zhipuConfig = providersConfig.zhipu;
        assert(zhipuConfig, 'zhipu 配置应该存在');
        assert.equal(zhipuConfig.name, '智谱', 'zhipu 名称应该正确');
        assert.equal(zhipuConfig.auth_token, '', 'zhipu auth_token 应该为空字符串');
      }
    },
    
    {
      name: '测试 .claude/settings.json 生成 (使用 api_key)',
      test: async () => {
        const config = {
          baseUrl: 'https://api.test.com',
          apiKey: 'test-api-key'
        };
        
        const result = await tester.testBackupClaudeSettings(config);
        assert.equal(result, true, '配置生成应该成功');
        
        // 验证生成的配置文件
        const settingsPath = path.join(TEST_CLAUDE_DIR, 'settings.json');
        assert(await fs.pathExists(settingsPath), 'settings.json 应该存在');
        
        const settings = await fs.readJson(settingsPath);
        assert.equal(settings.env.ANTHROPIC_BASE_URL, 'https://api.test.com', 'ANTHROPIC_BASE_URL 应该正确');
        assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'test-api-key', 'ANTHROPIC_AUTH_TOKEN 应该正确');
        assert(Array.isArray(settings.permissions.allow), 'permissions.allow 应该是数组');
        assert(settings.permissions.allow.includes('WebFetch'), 'permissions 应该包含 WebFetch');
      }
    },
    
    {
      name: '测试 auth_token 优先级',
      test: async () => {
        const config = {
          baseUrl: 'https://api.test.com',
          apiKey: 'test-api-key',
          auth_token: 'test-auth-token'
        };
        
        const result = await tester.testBackupClaudeSettings(config);
        assert.equal(result, true, '配置生成应该成功');
        
        // 验证 auth_token 优先于 apiKey
        const settings = await fs.readJson(path.join(TEST_CLAUDE_DIR, 'settings.json'));
        assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'test-auth-token', 'auth_token 应该优先于 apiKey');
      }
    },
    
    {
      name: '测试空 auth_token 时使用 api_key',
      test: async () => {
        // 先清理之前的配置
        await fs.remove(path.join(TEST_CLAUDE_DIR, 'settings.json'));
        
        const config = {
          baseUrl: 'https://api.test.com',
          apiKey: 'test-api-key',
          auth_token: ''  // 空字符串
        };
        
        const result = await tester.testBackupClaudeSettings(config);
        assert.equal(result, true, '配置生成应该成功');
        
        // 验证空 auth_token 时使用 apiKey
        const settings = await fs.readJson(path.join(TEST_CLAUDE_DIR, 'settings.json'));
        assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'test-api-key', '空 auth_token 时应该使用 apiKey');
      }
    },
    
    {
      name: '测试保留现有配置',
      test: async () => {
        const claudeSettingsPath = path.join(TEST_CLAUDE_DIR, 'settings.json');
        
        // 先创建一个现有配置
        const existingConfig = {
          env: {
            SOME_OTHER_VAR: 'existing-value'
          },
          permissions: {
            allow: ["WebFetch", "SomeOtherTool"]
          },
          customField: 'custom-value'
        };
        await fs.writeJson(claudeSettingsPath, existingConfig, { spaces: 2 });
        
        // 更新配置
        const newConfig = {
          baseUrl: 'https://api.new.com',
          apiKey: 'new-api-key'
        };
        
        const result = await tester.testBackupClaudeSettings(newConfig);
        assert.equal(result, true, '配置更新应该成功');
        
        // 验证现有配置被保留
        const settings = await fs.readJson(claudeSettingsPath);
        assert.equal(settings.env.ANTHROPIC_BASE_URL, 'https://api.new.com', '新的 base_url 应该正确');
        assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'new-api-key', '新的 auth_token 应该正确');
        assert.equal(settings.env.SOME_OTHER_VAR, 'existing-value', '现有环境变量应该保留');
        assert(settings.permissions.allow.includes('WebFetch'), 'WebFetch 权限应该保留');
        assert(settings.permissions.allow.includes('SomeOtherTool'), '现有权限应该保留');
        assert.equal(settings.customField, 'custom-value', '自定义字段应该保留');
      }
    },
    
    {
      name: '测试备份功能',
      test: async () => {
        const claudeSettingsPath = path.join(TEST_CLAUDE_DIR, 'settings.json');
        const claudeBackupPath = path.join(TEST_CLAUDE_DIR, 'settings.backup.json');
        
        // 创建原始配置
        const originalConfig = {
          env: { ORIGINAL: 'value' },
          permissions: { allow: ["WebFetch"] }
        };
        await fs.writeJson(claudeSettingsPath, originalConfig, { spaces: 2 });
        
        // 更新配置（这应该创建备份）
        const newConfig = {
          baseUrl: 'https://api.test.com',
          apiKey: 'test-key'
        };
        
        await tester.testBackupClaudeSettings(newConfig);
        
        // 验证备份文件存在且内容正确
        assert(await fs.pathExists(claudeBackupPath), '备份文件应该存在');
        
        const backupContent = await fs.readJson(claudeBackupPath);
        assert.equal(backupContent.env.ORIGINAL, 'value', '备份文件应该包含原始内容');
      }
    },
    
    {
      name: '测试从 moonshot 配置映射到 Claude 设置',
      test: async () => {
        const providersConfig = await tester.testLoadProviderConfig();
        const moonshotConfig = providersConfig.moonshot;
        
        // 模拟使用 moonshot 配置生成 Claude 设置
        const claudeConfig = {
          baseUrl: moonshotConfig.base_url,
          apiKey: moonshotConfig.api_key,
          auth_token: moonshotConfig.auth_token
        };
        
        const result = await tester.testBackupClaudeSettings(claudeConfig);
        assert.equal(result, true, '从 moonshot 配置生成 Claude 设置应该成功');
        
        const settings = await fs.readJson(path.join(TEST_CLAUDE_DIR, 'settings.json'));
        assert.equal(settings.env.ANTHROPIC_BASE_URL, 'https://api.moonshot.cn/v1', 'base_url 映射应该正确');
        assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'test-moonshot-token', 'auth_token 映射应该正确');
      }
    },
    
    {
      name: '测试环境变量清理功能 - 只保留有值的字段',
      test: async () => {
        const claudeSettingsPath = path.join(TEST_CLAUDE_DIR, 'settings.json');
        
        // 创建一个包含多个Anthropic环境变量的现有配置
        const existingConfig = {
          env: {
            ANTHROPIC_BASE_URL: 'https://old-url.com',
            ANTHROPIC_AUTH_TOKEN: 'old-token',
            ANTHROPIC_API_KEY: 'old-api-key',
            OTHER_VAR: 'keep-this'
          },
          permissions: {
            allow: ['WebFetch']
          }
        };
        await fs.writeJson(claudeSettingsPath, existingConfig, { spaces: 2 });
        
        // 使用只有base_url的配置（模拟providers.json中只配置了base_url的情况）
        const config = {
          baseUrl: 'https://api.new.com'
          // 注意：没有 apiKey 或 auth_token
        };
        
        const result = await tester.testBackupClaudeSettings(config);
        assert.equal(result, true, '配置更新应该成功');
        
        const settings = await fs.readJson(claudeSettingsPath);
        
        // 验证只保留了有值的字段
        assert.equal(settings.env.ANTHROPIC_BASE_URL, 'https://api.new.com', '应该设置新的base_url');
        assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, undefined, '应该移除ANTHROPIC_AUTH_TOKEN');
        assert.equal(settings.env.ANTHROPIC_API_KEY, 'old-api-key', '应该保留其他非清理的API key');
        assert.equal(settings.env.OTHER_VAR, 'keep-this', '应该保留其他环境变量');
      }
    },
    
    {
      name: '测试空字符串字段的清理',
      test: async () => {
        const claudeSettingsPath = path.join(TEST_CLAUDE_DIR, 'settings.json');
        
        // 创建现有配置
        const existingConfig = {
          env: {
            ANTHROPIC_BASE_URL: 'https://old-url.com',
            ANTHROPIC_AUTH_TOKEN: 'old-token',
            OTHER_VAR: 'keep-this'
          },
          permissions: { allow: ['WebFetch'] }
        };
        await fs.writeJson(claudeSettingsPath, existingConfig, { spaces: 2 });
        
        // 使用空字符串配置
        const config = {
          baseUrl: '',  // 空字符串
          apiKey: '',   // 空字符串
          auth_token: '' // 空字符串
        };
        
        const result = await tester.testBackupClaudeSettings(config);
        assert.equal(result, true, '配置更新应该成功');
        
        const settings = await fs.readJson(claudeSettingsPath);
        
        // 验证空字符串字段被清理
        assert.equal(settings.env.ANTHROPIC_BASE_URL, undefined, '空的base_url应该被清理');
        assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, undefined, '空的auth_token应该被清理');
        assert.equal(settings.env.OTHER_VAR, 'keep-this', '其他环境变量应该保留');
      }
    },
    
    {
      name: '测试只有apiKey时的配置',
      test: async () => {
        const claudeSettingsPath = path.join(TEST_CLAUDE_DIR, 'settings.json');
        
        // 创建现有配置
        const existingConfig = {
          env: {
            ANTHROPIC_BASE_URL: 'https://old-url.com',
            ANTHROPIC_AUTH_TOKEN: 'old-token'
          },
          permissions: { allow: ['WebFetch'] }
        };
        await fs.writeJson(claudeSettingsPath, existingConfig, { spaces: 2 });
        
        // 模拟providers.json中只有api_key字段的情况
        const config = {
          apiKey: 'only-api-key'
          // 注意：没有 baseUrl 和 auth_token
        };
        
        const result = await tester.testBackupClaudeSettings(config);
        assert.equal(result, true, '配置更新应该成功');
        
        const settings = await fs.readJson(claudeSettingsPath);
        
        // 验证只设置了apiKey对应的AUTH_TOKEN
        assert.equal(settings.env.ANTHROPIC_BASE_URL, undefined, '没有提供base_url时应该被清理');
        assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'only-api-key', '应该使用apiKey设置AUTH_TOKEN');
      }
    }
  ];
  
  for (const testCase of tests) {
    try {
      console.log(`\n🔍 ${testCase.name}`);
      await testCase.test();
      console.log(`✅ 通过`);
      passed++;
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
      console.log(`   错误详情: ${error.stack}`);
      failed++;
    }
  }
  
  await tester.cleanup();
  
  console.log('\n================================');
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('🎉 所有配置功能测试通过!');
    return true;
  } else {
    console.log('⚠️  部分测试失败，请检查问题');
    return false;
  }
}

// 如果直接运行此文件
if (process.argv[1] && process.argv[1].endsWith('config-test.js')) {
  runConfigTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ 测试运行失败:', error);
      process.exit(1);
    });
}

export { runConfigTests };