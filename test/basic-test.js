#!/usr/bin/env node

// 基本功能测试脚本
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.join(__dirname, '..', 'dist', 'index.js');

function runCommand(args) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', [scriptPath, ...args], {
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    process.on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 开始基本功能测试...');
  console.log('================================');
  
  const tests = [
    {
      name: '帮助命令测试',
      args: ['--help'],
      expectCode: 0
    },
    {
      name: '版本命令测试',
      args: ['--version'],
      expectCode: 0
    },
    {
      name: '模型列表测试',
      args: ['models'],
      expectCode: 0
    },
    {
      name: 'launch帮助测试',
      args: ['launch', '--help'],
      expectCode: 0
    },
    {
      name: 'config帮助测试',
      args: ['config', '--help'],
      expectCode: 0
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 测试: ${test.name}`);
      const result = await runCommand(test.args);
      
      if (result.code === test.expectCode) {
        console.log(`✅ 通过 (退出码: ${result.code})`);
        passed++;
      } else {
        console.log(`❌ 失败 (期望退出码: ${test.expectCode}, 实际: ${result.code})`);
        if (result.stderr) {
          console.log(`错误输出: ${result.stderr}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`❌ 失败 (异常: ${error.message})`);
      failed++;
    }
  }
  
  console.log('\n================================');
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('🎉 所有基本功能测试通过!');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查问题');
    process.exit(1);
  }
}

runTests().catch(console.error);