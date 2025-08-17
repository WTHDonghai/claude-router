#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCleanup() {
  console.log('🧪 测试环境变量清理功能...');
  
  const testDir = path.join(os.tmpdir(), 'claudex-cleanup-test');
  const claudeDir = path.join(testDir, '.claude');
  const claudexDir = path.join(testDir, '.claudex');
  
  try {
    // 设置测试环境
    await fs.remove(testDir);
    await fs.ensureDir(claudeDir);
    await fs.ensureDir(claudexDir);
    
    // 复制部分配置测试文件
    await fs.copy(
      path.join(__dirname, 'test-partial-config.json'),
      path.join(claudexDir, 'providers.json')
    );
    
    // 创建一个包含多个Anthropic环境变量的现有Claude配置
    const existingClaudeConfig = {
      env: {
        ANTHROPIC_BASE_URL: 'https://old-url.com',
        ANTHROPIC_AUTH_TOKEN: 'old-token',
        ANTHROPIC_API_KEY: 'should-keep-this',
        OTHER_VAR: 'should-also-keep-this'
      },
      permissions: {
        allow: ['WebFetch', 'OtherTool']
      },
      customField: 'custom-value'
    };
    
    await fs.writeJson(path.join(claudeDir, 'settings.json'), existingClaudeConfig, { spaces: 2 });
    
    console.log('\n📄 现有Claude配置:');
    console.log(JSON.stringify(existingClaudeConfig, null, 2));
    
    // 运行claude路由器命令
    console.log('\n🚀 运行claudex命令 (使用partial-provider，只有base_url)...');
    
    const { spawn } = await import('child_process');
    const scriptPath = path.join(__dirname, '..', 'dist', 'index.js');
    
    const result = await new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath, '-p', 'partial-provider', '--debug'], {
        env: {
          ...process.env,
          HOME: testDir,
          USERPROFILE: testDir,
          CLAUDEX_DEBUG: 'true',
          SKIP_CLAUDE_CHECK: 'true',
          SKIP_CLAUDE_LAUNCH: 'true'
        },
        stdio: 'pipe',
        shell: true
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      
      child.on('error', reject);
    });
    
    console.log('\n📋 命令输出:');
    console.log(result.stdout);
    
    if (result.stderr) {
      console.log('\n❌ 错误输出:');
      console.log(result.stderr);
    }
    
    // 检查最终配置
    const finalConfig = await fs.readJson(path.join(claudeDir, 'settings.json'));
    console.log('\n📄 最终Claude配置:');
    console.log(JSON.stringify(finalConfig, null, 2));
    
    // 验证清理效果
    console.log('\n✅ 验证结果:');
    console.log(`ANTHROPIC_BASE_URL: ${finalConfig.env.ANTHROPIC_BASE_URL || '(未设置)'}`);
    console.log(`ANTHROPIC_AUTH_TOKEN: ${finalConfig.env.ANTHROPIC_AUTH_TOKEN || '(未设置)'}`);
    console.log(`ANTHROPIC_API_KEY: ${finalConfig.env.ANTHROPIC_API_KEY || '(未设置)'}`);
    console.log(`OTHER_VAR: ${finalConfig.env.OTHER_VAR || '(未设置)'}`);
    console.log(`customField: ${finalConfig.customField || '(未设置)'}`);
    
    // 验证清理是否正确
    const isCorrect = 
      finalConfig.env.ANTHROPIC_BASE_URL === 'https://api.partial.test' && // 应该设置
      !finalConfig.env.ANTHROPIC_AUTH_TOKEN && // 应该被清理（因为providers.json中没有api_key或auth_token）
      finalConfig.env.ANTHROPIC_API_KEY === 'should-keep-this' && // 应该保留
      finalConfig.env.OTHER_VAR === 'should-also-keep-this' && // 应该保留
      finalConfig.customField === 'custom-value'; // 应该保留
    
    if (isCorrect) {
      console.log('\n🎉 清理功能工作正常！');
      console.log('✅ 只设置了providers.json中存在的字段');
      console.log('✅ 清理了providers.json中不存在的Anthropic字段');
      console.log('✅ 保留了其他非Anthropic字段');
    } else {
      console.log('\n❌ 清理功能存在问题');
    }
    
  } finally {
    // 清理测试环境
    await fs.remove(testDir);
  }
}

testCleanup().catch(console.error);