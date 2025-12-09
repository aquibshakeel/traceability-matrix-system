/**
 * Model Detector - Automatically detect best available Claude model
 * 
 * Queries Anthropic API to get user's available models
 * Selects the best Sonnet model automatically
 */

import Anthropic from '@anthropic-ai/sdk';

export class ModelDetector {
  private client: Anthropic;
  private cachedModel: string | null = null;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Detect the best available Claude model for the user
   * Prefers latest Sonnet models in this order:
   * 1. Claude 4.5 Sonnet (if available)
   * 2. Claude 3.7 Sonnet (if available)
   * 3. Claude 3.5 Sonnet (fallback)
   */
  async detectBestModel(): Promise<string> {
    // Return cached model if already detected
    if (this.cachedModel) {
      return this.cachedModel;
    }

    try {
      // Try to list available models (if API supports it)
      // Note: Anthropic doesn't have a public list models endpoint yet,
      // so we'll try models in order of preference
      
      const modelsToTry = [
        'claude-4-5-sonnet-20250929',
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-sonnet-20240620',
        'claude-3-sonnet-20240229',
      ];

      console.log('🔍 Auto-detecting best available Claude model...');

      for (const model of modelsToTry) {
        if (await this.isModelAvailable(model)) {
          console.log(`   ✓ Using: ${model}`);
          this.cachedModel = model;
          return model;
        }
      }

      // Fallback to a safe default
      const fallback = 'claude-3-5-sonnet-20240620';
      console.log(`   ⚠️  Using fallback model: ${fallback}`);
      this.cachedModel = fallback;
      return fallback;

    } catch (error) {
      // If detection fails, use safe default
      const fallback = 'claude-3-5-sonnet-20240620';
      console.log(`   ⚠️  Model detection failed, using: ${fallback}`);
      this.cachedModel = fallback;
      return fallback;
    }
  }

  /**
   * Check if a specific model is available for the user
   */
  private async isModelAvailable(model: string): Promise<boolean> {
    try {
      // Try a minimal API call with this model
      // If it works, the model is available
      await this.client.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch (error: any) {
      // If error is "not_found_error", model doesn't exist for this user
      if (error?.error?.type === 'not_found_error') {
        return false;
      }
      // Other errors (rate limit, etc.) mean model exists but call failed
      // We'll assume it's available
      return true;
    }
  }

  /**
   * Clear cached model (for testing or forcing re-detection)
   */
  clearCache(): void {
    this.cachedModel = null;
  }
}
