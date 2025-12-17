/**
 * AI Provider Factory
 * 
 * Creates the appropriate AI provider based on configuration.
 * Defaults to Anthropic (Claude) for backwards compatibility.
 */

import * as fs from 'fs';
import * as path from 'path';
import { AIProvider } from './AIProvider';
import { ProviderConfig, AIConfig } from './types';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { EnvConfig } from '../utils/EnvConfig';

export class AIProviderFactory {
  /**
   * Load AI config from config.json file
   */
  static loadConfigFromFile(): AIConfig | null {
    try {
      const configPath = path.join(process.cwd(), '.traceability', 'config.json');
      if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return configData.ai || null;
      }
    } catch (error) {
      console.warn('⚠️  Could not load config from file, using defaults');
    }
    return null;
  }

  /**
   * Create an AI provider based on configuration
   * @param config AI configuration (or just API key for backwards compatibility)
   * @param apiKey API key (for backwards compatibility)
   * @returns Initialized AI provider
   */
  static async create(config?: AIConfig | string, apiKey?: string): Promise<AIProvider> {
    // Handle backwards compatibility FIRST: string input is just the API key
    if (typeof config === 'string') {
      const providerConfig: ProviderConfig = {
        provider: 'anthropic',
        apiKey: config,
        model: 'auto'
      };
      
      const provider = new AnthropicProvider();
      await provider.initialize(providerConfig);
      return provider;
    }
    
    // Resolve config: use provided, load from file, or use defaults
    let resolvedConfig: AIConfig;
    if (config) {
      resolvedConfig = config;
    } else {
      const fileConfig = this.loadConfigFromFile();
      resolvedConfig = fileConfig || {
        provider: 'anthropic',
        model: 'auto'
      };
    }

    // Apply environment variable overrides (priority: ENV > config > default)
    const envOverrides = EnvConfig.getAIOverrides();
    if (Object.keys(envOverrides).length > 0) {
      EnvConfig.logOverrides();
      resolvedConfig = {
        ...resolvedConfig,
        ...envOverrides,
        options: {
          ...resolvedConfig.options,
          temperature: envOverrides.temperature ?? resolvedConfig.options?.temperature,
          maxTokens: envOverrides.maxTokens ?? resolvedConfig.options?.maxTokens
        }
      };
    }

    // Modern config object
    const providerName = (resolvedConfig.provider || 'anthropic').toLowerCase();
    
    // Get API key based on provider
    let providerApiKey = resolvedConfig.apiKey || apiKey;
    if (!providerApiKey) {
      switch (providerName) {
        case 'openai':
        case 'gpt':
          providerApiKey = process.env.OPENAI_API_KEY;
          break;
        case 'anthropic':
        case 'claude':
        default:
          providerApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
          break;
      }
    }

    if (!providerApiKey) {
      const envVarName = (providerName === 'openai' || providerName === 'gpt') 
        ? 'OPENAI_API_KEY' 
        : 'CLAUDE_API_KEY or ANTHROPIC_API_KEY';
      throw new Error(
        `AI Provider API key not found for ${providerName}. ` +
        `Set ${envVarName} environment variable, ` +
        `or provide apiKey in configuration.`
      );
    }

    const providerConfig: ProviderConfig = {
      provider: providerName,
      apiKey: providerApiKey,
      model: resolvedConfig.model || 'auto',
      temperature: resolvedConfig.options?.temperature,
      maxTokens: resolvedConfig.options?.maxTokens,
      options: resolvedConfig.options
    };

    // Create provider based on name
    let provider: AIProvider;

    switch (providerName) {
      case 'anthropic':
      case 'claude':
        provider = new AnthropicProvider();
        break;

      case 'openai':
      case 'gpt':
        provider = new OpenAIProvider();
        break;

      case 'google':
      case 'gemini':
        throw new Error(
          'Google Gemini provider not yet implemented. ' +
          'Please use "anthropic" provider for now. ' +
          'Future versions will support Gemini.'
        );

      default:
        throw new Error(
          `Unsupported AI provider: "${providerName}"\n` +
          `Supported providers: anthropic (claude)\n` +
          `Coming soon: openai (gpt), google (gemini)`
        );
    }

    // Initialize and return
    await provider.initialize(providerConfig);
    
    console.log(`✓ AI Provider: ${provider.name} (${provider.modelId})`);
    
    return provider;
  }

  /**
   * Get list of supported providers
   */
  static getSupportedProviders(): string[] {
    return ['anthropic', 'claude', 'openai', 'gpt'];
  }

  /**
   * Get list of coming soon providers
   */
  static getComingSoonProviders(): string[] {
    return ['google', 'gemini'];
  }

  /**
   * Check if a provider is supported
   */
  static isSupported(provider: string): boolean {
    return this.getSupportedProviders().includes(provider.toLowerCase());
  }
}
