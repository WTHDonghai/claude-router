#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import pkg from '../package.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  authToken?: string;
  model?: string;
  smallFastModel?: string;
}

interface ModelConfig extends Omit<ProviderConfig, 'name'> {
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  organizationId?: string; // for OpenAI
  projectId?: string; // for Google
  deploymentName?: string; // for Azure
  [key: string]: any;
}

export class ModelProviderLauncher {
  private configPath: string;
  private backupPath: string;
  private providers: Map<string, ProviderConfig>;
  private providersConfigPath: string;
  public debugMode: boolean;

  constructor() {
    this.configPath = path.join(os.homedir(), '.claudex', 'settings.json');
    this.backupPath = path.join(os.homedir(), '.claudex', 'settings.backup.json');
    this.providersConfigPath = path.join(os.homedir(), '.claudex', 'providers.json');
    this.providers = new Map();
    this.debugMode = process.env.DEBUG === 'true' || process.env.CLAUDEX_DEBUG === 'true';
    this.initializeProviders();
  }

  /**
   * 调试日志输出
   */
  private debug(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
      if (data !== undefined) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  /**
   * 初始化支持的模型供应商
   */
  private initializeProviders(): void {
    // 这个方法现在为空，因为供应商配置从外部文件加载
  }

  /**
   * 显示当前配置
   */
  async showCurrentConfig(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const config = await fs.readJson(this.configPath);
        console.log(chalk.blue('\n📋 当前Claude配置:'));
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.log(chalk.yellow('⚠️  配置文件不存在'));
      }
    } catch (error) {
      console.error(chalk.red('❌ 读取配置文件失败:'), error);
    }
  }

  /**
   * 备份当前配置
   */
  async backupConfig(): Promise<boolean> {
    try {
      if (await fs.pathExists(this.configPath)) {
        await fs.copy(this.configPath, this.backupPath);
        console.log(chalk.green('✅ 配置文件已备份'));
        return true;
      }
      return false;
    } catch (error) {
      console.error(chalk.red('❌ 备份配置文件失败:'), error);
      return false;
    }
  }

  /**
   * 恢复配置
   */
  async restoreConfig(): Promise<boolean> {
    try {
      if (await fs.pathExists(this.backupPath)) {
        await fs.copy(this.backupPath, this.configPath);
        console.log(chalk.green('✅ 配置文件已恢复'));
        return true;
      } else {
        console.log(chalk.yellow('⚠️  备份文件不存在'));
        return false;
      }
    } catch (error) {
      console.error(chalk.red('❌ 恢复配置文件失败:'), error);
      return false;
    }
  }

  /**
   * 备份原始的.claude/settings.json配置文件，并更新环境变量
   */
  async backupClaudeSettings(config: ModelConfig): Promise<boolean> {
    try {
      const claudeSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
      const claudeBackupPath = path.join(os.homedir(), '.claude', 'settings.backup.json');

      this.debug(`Backing up Claude settings`);
      this.debug(`Claude settings path: ${claudeSettingsPath}`);
      this.debug(`Claude backup path: ${claudeBackupPath}`);
      this.debug(`Input config:`, config);

      // 确保.claude目录存在
      await fs.ensureDir(path.dirname(claudeSettingsPath));

      // 备份原始配置文件（如果存在）
      if (await fs.pathExists(claudeSettingsPath)) {
        await fs.copy(claudeSettingsPath, claudeBackupPath);
        this.debug(`Backed up existing Claude settings`);
      }

      // 读取现有配置（如果存在）
      let existingConfig: any = {
        env: {},
        permissions: {
          allow: ["WebFetch"]
        }
      };

      if (await fs.pathExists(claudeSettingsPath)) {
        try {
          existingConfig = await fs.readJson(claudeSettingsPath);
          this.debug(`Loaded existing Claude config:`, existingConfig);
        } catch (error) {
          this.debug(`Error reading existing Claude config:`, error);
          console.log(chalk.yellow('⚠️  现有Claude配置文件格式有误，将使用默认配置'));
        }
      }

      // 更新环境变量 - 只保留providers.json中存在且有值的字段
      if (!existingConfig.env) {
        existingConfig.env = {};
      }

      // 定义当前供应商支持的环境变量
      const supportedEnvVars: string[] = [];

      // 根据配置添加支持的环境变量
      if (config.baseUrl !== undefined) {
        supportedEnvVars.push('ANTHROPIC_BASE_URL');
      }

      if (config.authToken !== undefined) {
        supportedEnvVars.push('ANTHROPIC_AUTH_TOKEN');
      }

      if (config.apiKey !== undefined) {
        supportedEnvVars.push('ANTHROPIC_API_KEY');
      }

      if (config.smallFastModel !== undefined) {
        supportedEnvVars.push('ANTHROPIC_SMALL_FAST_MODEL');
      }

      if (config.model !== undefined) {
        supportedEnvVars.push('ANTHROPIC_MODEL');
      }

      // 清理不在支持列表中的环境变量
      this.debug(`Cleaning environment variables, keeping only: ${supportedEnvVars.join(', ')}`);
      Object.keys(existingConfig.env).forEach(key => {
        if (!supportedEnvVars.includes(key)) {
          this.debug(`Removing unsupported environment variable: ${key}`);
          delete existingConfig.env[key];
        }
      });

      // 只设置providers.json中存在且有值的字段
      if (config.baseUrl && config.baseUrl.trim() !== '') {
        this.debug(`Setting ANTHROPIC_BASE_URL to: ${config.baseUrl}`);
        existingConfig.env.ANTHROPIC_BASE_URL = config.baseUrl;
      } else {
        this.debug(`Skipping ANTHROPIC_BASE_URL (not provided or empty)`);
      }

      // 设置 authToken（即使为空字符串也要设置）
      if (config.authToken !== undefined) {
        existingConfig.env.ANTHROPIC_AUTH_TOKEN = config.authToken;
        this.debug(`Setting ANTHROPIC_AUTH_TOKEN to: ${config.authToken}`);
      }

      // 设置 apiKey（即使为空字符串也要设置）
      if (config.apiKey !== undefined) {
        existingConfig.env.ANTHROPIC_API_KEY = config.apiKey;
        this.debug(`Setting ANTHROPIC_API_KEY to: ${config.apiKey}`);
      }

      if (config.smallFastModel !== undefined) {
        existingConfig.env.ANTHROPIC_SMALL_FAST_MODEL = config.smallFastModel;
        this.debug(`Setting ANTHROPIC_SMALL_FAST_MODEL to: ${config.smallFastModel}`);
      }

      if (config.model !== undefined) {
        existingConfig.env.ANTHROPIC_MODEL = config.model;
        this.debug(`Setting ANTHROPIC_MODEL to: ${config.model}`);
      }

      this.debug(`Final Claude config:`, existingConfig);

      // 写入更新后的配置
      await fs.writeJson(claudeSettingsPath, existingConfig, { spaces: 2 });
      this.debug(`Claude settings written successfully`);

      return true;
    } catch (error) {
      this.debug(`Error in backupClaudeSettings:`, error);
      console.error(chalk.red('❌ 备份Claude配置文件失败:'), error);
      return false;
    }
  }

  /**
   * 获取支持的供应商列表
   */
  getProviders(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * 获取指定供应商的配置
   */
  getProvider(name: string): ProviderConfig | undefined {
    return this.providers.get(name);
  }

  /**
   * 初始化供应商配置文件
   */
  async initializeProvidersConfig(): Promise<void> {
    try {
      const configDir = path.dirname(this.providersConfigPath);

      // 确保配置目录存在
      if (!(await fs.pathExists(configDir))) {
        await fs.ensureDir(configDir);
        // console.log(chalk.blue(`📁 已创建配置目录: ${configDir}`));
      }

      // 如果配置文件不存在，从项目目录复制默认配置
      if (!(await fs.pathExists(this.providersConfigPath))) {
        const defaultConfigPath = path.join(__dirname, '..', 'config', 'providers.json');
        if (await fs.pathExists(defaultConfigPath)) {
          await fs.copy(defaultConfigPath, this.providersConfigPath);
          // console.log(chalk.green(`✅ 已创建默认供应商配置文件: ${this.providersConfigPath}`));
          // console.log(chalk.yellow('💡 请编辑配置文件，替换示例API密钥为真实密钥'));
          // console.log(chalk.cyan(`   配置文件位置: ${this.providersConfigPath}`));
        } else {
          console.log(chalk.yellow('⚠️  默认供应商配置文件不存在'));
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️  初始化配置文件失败: ${error}`));
    }
  }

  /**
   * 从配置文件读取供应商配置
   */
  async loadProviderConfig(providerName: string): Promise<any | null> {
    try {
      this.debug(`Loading provider config for: ${providerName}`);
      this.debug(`Providers config path: ${this.providersConfigPath}`);

      // 首先确保配置文件已初始化
      await this.initializeProvidersConfig();
      if (await fs.pathExists(this.providersConfigPath)) {
        const providersConfig = await fs.readJson(this.providersConfigPath);
        this.debug(`Available providers: ${Object.keys(providersConfig).join(', ')}`);

        const config = providersConfig[providerName] || null;
        this.debug(`Provider config for ${providerName}:`, config);
        return config;
      }
      this.debug(`Providers config file does not exist: ${this.providersConfigPath}`);
      return null;
    } catch (error) {
      this.debug(`Error loading provider config:`, error);
      console.log(chalk.yellow(`⚠️  无法读取供应商配置文件: ${error}`));
      return null;
    }
  }

  /**
   * 验证配置参数
   */
  validateConfig(config: ModelConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.apiKey) {
      errors.push('必须指定API密钥 (--api-key)');
    }

    if (!config.baseUrl) {
      errors.push('必须指定基础URL (--base-url)');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 生成新配置
   */
  async generateConfig(options: ModelConfig, skipValidation: boolean = false): Promise<void> {
    try {
      // 只有在非供应商模式下才进行Claude特定验证
      if (!skipValidation) {
        const validation = this.validateConfig(options);
        if (!validation.valid) {
          console.error(chalk.red('❌ 配置验证失败:'));
          validation.errors.forEach(error => {
            console.error(chalk.red(`  • ${error}`));
          });
          throw new Error('配置验证失败');
        }
      }

      // 确保配置目录存在
      await fs.ensureDir(path.dirname(this.configPath));

      // 读取现有配置（如果存在）
      let existingConfig: any = {
        env: {},
        permissions: {
          allow: ["WebFetch"]
        }
      };
      if (await fs.pathExists(this.configPath)) {
        try {
          existingConfig = await fs.readJson(this.configPath);
        } catch (error) {
          console.log(chalk.yellow('⚠️  现有配置文件格式有误，将使用默认配置'));
          // 使用默认配置，不抛出错误
        }
      }

      // 生成Claude Code格式的配置
      const claudeConfig: any = {
        env: {
          ANTHROPIC_AUTH_TOKEN: options.authToken,
          ANTHROPIC_API_KEY: options.apiKey,
          ANTHROPIC_BASE_URL: options.baseUrl
        },
        permissions: {
          allow: ["WebFetch"]
        }
      };

      // 如果存在其他非Claude相关的配置，保留它们
      if (existingConfig && typeof existingConfig === 'object') {
        Object.keys(existingConfig).forEach(key => {
          if (key !== 'env' && key !== 'permissions' && key !== 'provider' && key !== 'model' && key !== 'apiKey' && key !== 'baseUrl' && key !== 'authToken' && 'smallFastModel' !== key) {
            claudeConfig[key] = existingConfig[key];
          }
        });
      }

      // 写入新配置
      await fs.writeJson(this.configPath, claudeConfig, { spaces: 2 });
      console.log(chalk.green('✅ 配置文件已更新'));
      console.log(chalk.blue('📝 配置内容:'));
      console.log(JSON.stringify(claudeConfig, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ 生成配置文件失败:'), error);
      throw error;
    }
  }

  /**
   * 检查Claude Code是否已安装
   */
  async checkClaudeCodeInstallation(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn('claude', ['--version'], {
        stdio: 'pipe',
        shell: true  // Windows兼容性修复
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });

      process.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * 启动Claude Code
   */
  async launchClaudeCode(projectPath?: string): Promise<void> {
    try {
      console.log(chalk.blue('🚀 正在启动Claude Code...'));

      const args = projectPath ? [projectPath] : [];
      console.log(chalk.yellow('💡 Claude Code将在当前终端中启动...'));

      // [todo]: 添加对当前工作空间的支持
      // 使用spawnSync在当前终端中同步运行Claude Code
      const claudeProcess = spawnSync('claude', args, {
        stdio: 'inherit',
        shell: true  // Windows兼容性修复
      });

      if (claudeProcess.status !== 0) {
        console.error(chalk.red(`❌ Claude Code退出，状态码: ${claudeProcess.status}`));
      }
    } catch (error) {
      console.error(chalk.red('❌ 启动Claude Code失败:'), error);
      throw error;
    }
  }

  /**
   * 清空终端
   */
  private clearTerminal(): void {
    try {
      // Windows使用cls，Unix系统使用clear
      const clearCommand = process.platform === 'win32' ? 'cls' : 'clear';
      const { execSync } = require('child_process');
      execSync(clearCommand, { stdio: 'inherit' });
    } catch (error) {
      // 如果清空失败，静默忽略
      console.log('\n'.repeat(50)); // 备用方案：打印空行
    }
  }

  /**
   * 主要启动流程
   */
  async launch(options: ModelConfig & { projectPath?: string; providerName?: string }): Promise<void> {
    try {
      this.debug('Launch called with options:', options);

      console.log(chalk.blue('🔧 Claude Code 快速启动器'));
      console.log(chalk.gray('================================'));

      // 1. 处理供应商配置
      const { projectPath, providerName, ...configOptions } = options;
      let finalConfig = { ...configOptions };

      if (providerName) {
        console.log(chalk.blue(`🔍 加载供应商配置: ${providerName}...`));
        const providerConfig = await this.loadProviderConfig(providerName);
        if (providerConfig) {
          finalConfig = {
            provider: providerName,
            model: providerConfig.model,
            smallFastModel: providerConfig.smallFastModel,
            apiKey: providerConfig.apiKey,
            baseUrl: providerConfig.baseUrl,
            authToken: providerConfig.authToken
          };
          // 只有当命令行参数存在时才覆盖
          if (configOptions.apiKey) finalConfig.apiKey = configOptions.apiKey;
          if (configOptions.baseUrl) finalConfig.baseUrl = configOptions.baseUrl;
          if (configOptions.authToken) finalConfig.authToken = configOptions.authToken;
          if (configOptions.model) finalConfig.model = configOptions.model;
          if (configOptions.smallFastModel) finalConfig.smallFastModel = configOptions.smallFastModel;
          //  console.log(chalk.green(`✅ 已加载 ${providerConfig.name} 配置`));
        } else {
          console.error(chalk.red(`❌ 未找到供应商配置: ${providerName}`));
          process.exit(1);
        }
      }

      // 2. 验证配置参数
      if (Object.keys(finalConfig).length > 0) {
        console.log(chalk.blue('🔍 验证配置参数...'));

        // 如果使用供应商配置，只进行基本验证（允许只有部分字段）
        if (providerName) {
          if (!finalConfig.apiKey && !finalConfig.authToken && !finalConfig.baseUrl) {
            console.error(chalk.red('❌ 配置验证失败:'));
            console.error(chalk.red('  • 至少需要提供 API密钥、auth_token 或 base_url 中的一个'));
            process.exit(1);
          }
        } else {
          // 使用完整的Claude验证
          const validation = this.validateConfig(finalConfig);
          if (!validation.valid) {
            console.error(chalk.red('❌ 配置验证失败:'));
            validation.errors.forEach(error => {
              console.error(chalk.red(`  • ${error}`));
            });
            process.exit(1);
          }
        }
        console.log(chalk.green('✅ 配置参数验证通过'));
      }

      // 3. 检查Claude Code安装（跳过如果是测试模式）
      if (!process.env.SKIP_CLAUDE_CHECK) {
        console.log(chalk.blue('🔍 检查Claude Code安装状态...'));
        const isInstalled = await this.checkClaudeCodeInstallation();
        if (!isInstalled) {
          console.error(chalk.red('❌ Claude Code未安装或不在PATH中'));
          console.log(chalk.yellow('💡 请先安装Claude Code: https://claude.ai/code'));
          process.exit(1);
        }
        console.log(chalk.green('✅ Claude Code已安装'));
      } else {
        console.log(chalk.yellow('⏭️  跳过Claude Code安装检查 (测试模式)'));
      }

      // 4. 备份现有配置
      await this.backupConfig();

      // 5. 生成新配置
      if (Object.keys(finalConfig).length > 0) {
        console.log(chalk.blue('⚙️  正在更新配置...'));
        await this.generateConfig(finalConfig, !!providerName);
      }
      // 6. 备份原始的.claude\settings.json配置文件, 并把当前的配置的baseUrl写入到ANTHROPIC_BASE_URL字段， 把当前的配置的apiKey写入到ANTHROPIC_AUTH_TOKEN
      if (Object.keys(finalConfig).length > 0) {
        await this.backupClaudeSettings(finalConfig);
      }

      // 7. 启动Claude Code（跳过如果是测试模式）
      if (!process.env.SKIP_CLAUDE_LAUNCH) {
        // 清空终端日志
        this.clearTerminal();
        await this.launchClaudeCode(projectPath);
      } else {
        console.log(chalk.yellow('⏭️  跳过Claude Code启动 (测试模式)'));
        console.log(chalk.green('✅ 配置已成功更新'));
      }

    } catch (error) {
      console.error(chalk.red('❌ 启动过程中发生错误:'), error);

      // 尝试恢复配置
      console.log(chalk.blue('🔄 正在恢复原始配置...'));
      await this.restoreConfig();

      process.exit(1);
    }
  }
}

// 命令行界面
const program = new Command();
const launcher = new ModelProviderLauncher();

program
  .name('claudex')
  .description('Claude Code 快速启动器 - 支持多供应商配置')
  .version('2.0.7');

// 全局选项
program
  .option('-k, --api-key <key>', 'API密钥')
  .option('-u, --base-url <url>', 'API基础URL')
  .option('-p, --provider <name>', '供应商名称 (moonshot, zhipu, claude, openai)')
  .option('-d, --debug', '启用调试模式');

// 默认启动命令（简化版）
program
  .argument('[project-path]', '项目路径（可选）')
  .action(async (projectPath, options) => {
    // 设置调试模式
    if (options.debug) {
      process.env.CLAUDEX_DEBUG = 'true';
      launcher.debugMode = true;
    }

    // 如果指定了供应商，直接使用供应商配置
    if (options.provider) {
      await launcher.launch({
        providerName: options.provider,
        apiKey: options.apiKey, // 可选，用于覆盖配置文件中的值
        baseUrl: options.baseUrl, // 可选，用于覆盖配置文件中的值
        projectPath
      });
      return;
    }

    // 传统方式：需要手动指定API key
    if (!options.apiKey) {
      console.log(chalk.yellow('💡 使用方式:'));
      console.log(chalk.gray('  方式1 - 使用预配置供应商:'));
      console.log(chalk.gray('    claudex -p moonshot [project-path]'));
      console.log(chalk.gray('    claudex -p zhipu [project-path]'));
      console.log(chalk.gray('    claudex -p claude [project-path]'));
      console.log('');
      console.log(chalk.gray('  方式2 - 手动指定参数:'));
      console.log(chalk.gray('    claudex -k <your-api-key> [project-path]'));
      console.log(chalk.gray('    claudex -k <your-api-key> -u <base-url> [project-path]'));
      console.log('');
      console.log(chalk.yellow('📖 更多选项:'));
      console.log(chalk.gray('  claudex --help'));
      return;
    }

    // 默认使用Claude配置
    await launcher.launch({
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      projectPath
    });
  });

// 添加供应商列表命令
program
  .command('providers')
  .description('显示支持的模型供应商列表')
  .action(async () => {
    console.log(chalk.blue('\n🏢 支持的模型供应商:'));
    console.log(chalk.gray('================================'));

    try {
      await launcher.initializeProvidersConfig();
      const configPath = path.join(os.homedir(), '.claudex', 'providers.json');

      if (await fs.pathExists(configPath)) {
        const providersConfig = await fs.readJson(configPath);
        Object.keys(providersConfig).forEach(key => {
          const provider = providersConfig[key];
          console.log(chalk.green(`\n📍 ${provider.name} (${key})`));
          console.log(chalk.gray(`   基础URL: ${provider.baseUrl}`));
          // console.log(chalk.gray(`   API密钥: ${provider.api_key ? '已配置' : '未配置'}`));
        });
      } else {
        console.log(chalk.yellow('⚠️  供应商配置文件不存在'));
      }
    } catch (error) {
      console.error(chalk.red('❌ 读取供应商配置失败:'), error);
    }

    console.log(chalk.gray('\n使用示例:'));
    console.log(chalk.cyan('claudex -p moonshot'));
    console.log(chalk.cyan('claudex -k your-api-key'));
  });

// [todo]:未验证
program
  .command('config')
  .description('配置管理命令')
  .option('-s, --show', '显示当前配置')
  .option('-r, --restore', '恢复备份配置')
  .action(async (options) => {
    if (options.show) {
      await launcher.showCurrentConfig();
    } else if (options.restore) {
      await launcher.restoreConfig();
    } else {
      console.log(chalk.yellow('请指定配置操作: --show 或 --restore'));
    }
  });

// 解析命令行参数
program.parse();

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
