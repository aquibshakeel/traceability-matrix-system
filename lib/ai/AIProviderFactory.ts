/**
 * AI Provider Factory
 * 
 * Creates the appropriate AI provider based on configuration.
 * Defaults to Anthropic (Claude) for backwards compatibility.
 */

import { AIProvider } from './AIProvider';
import { ProviderConfig, AIConfig } from './types';
import { AnthropicProvider } from './providers/AnthropicProvider';

export class AIProviderFactory {
  /**
   * Create an AI provider based on configuration
   * @param config AI configuration
   * @param apiKey API key (for backwards compatibility)
   * @returns Initialized AI provider
   */
  static async create(config: AIConfig | string, apiKey?: string): Promise<AIProvider> {
    // Handle backwards compatibility: string input is just the API key
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

    // Modern config object
    const providerName = (config.provider || 'anthropic').toLowerCase();
    const providerApiKey = config.apiKey || apiKey || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!providerApiKey) {
      throw new Error(
        'AI Provider API key not found. ' +
        'Set CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable, ' +
        'or provide apiKey in configuration.'
      );
    }

    const providerConfig: ProviderConfig = {
      provider: providerName,
      apiKey: providerApiKey,
      model: config.model || 'auto',
      temperature: config.options?.temperature,
      maxTokens: config.options?.maxTokens,
      options: config.options
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
        throw new Error(
          'OpenAI provider not yet implemented. ' +
          'Please use "anthropic" provider for now. ' +
          'Future versions will support OpenAI.'
        );

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
    return ['anthropic', 'claude'];
  }

  /**
   * Get list of coming soon providers
   */
  static getComingSoonProviders(): string[] {
    return ['openai', 'gpt', 'google', 'gemini'];
  }

  /**
   * Check if a provider is supported
   */
  static isSupported(provider: string): boolean {
    return this.getSupportedProviders().includes(provider.toLowerCase());
  }
}
