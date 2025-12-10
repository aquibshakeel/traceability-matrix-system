/**
 * Model Detector - Automatically detect best available Claude model
 * 
 * Queries Anthropic API to get user's available models
 * Selects the best Sonnet model automatically
 */

import Anthropic from '@anthropic-ai/sdk';

export class ModelDetector {
  private client: Anthropic;
  private apiKey: string;
  private cachedModel: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Detect the best available Claude model for the user
   * Uses the Models API to list available models and selects the best one
   */
  async detectBestModel(): Promise<string> {
    // Return cached model if already detected
    if (this.cachedModel) {
      return this.cachedModel;
    }

    console.log('🔍 Auto-detecting best available Claude model...');

    try {
      // Use the Models API to list available models
      const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      if (!response.ok) {
        throw new Error(`Models API failed: ${response.status}`);
      }

      const data: any = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No models returned from API');
      }

      // Models API returns models sorted by newest first
      // Claude 4.5 model IDs: claude-sonnet-4-5-..., claude-opus-4-5-..., claude-haiku-4-5-...
      // Claude 3.x model IDs: claude-sonnet-3-7-..., claude-sonnet-3-5-...
      
      // Filter by model family
      const claude4Models = data.data.filter((m: any) => 
        m.id.includes('-4-5-') || m.id.includes('-4-') 
      );
      const claude3Models = data.data.filter((m: any) => 
        m.id.includes('-3-7-') || m.id.includes('-3-5-') || m.id.includes('-3-')
      );
      
      // Per model selection matrix, prefer Sonnet 4.5 for coding/agents
      // Priority: Sonnet 4.5 > Opus 4.5 > Haiku 4.5 > Claude 3.x
      let selectedModel = null;
      
      if (claude4Models.length > 0) {
        // Prefer Sonnet (best for coding/agents), then Opus, then Haiku
        const sonnet = claude4Models.find((m: any) => m.id.includes('sonnet'));
        const opus = claude4Models.find((m: any) => m.id.includes('opus'));
        const haiku = claude4Models.find((m: any) => m.id.includes('haiku'));
        
        selectedModel = sonnet || opus || haiku || claude4Models[0];
      } else if (claude3Models.length > 0) {
        // Fallback to Claude 3.x (prefer Sonnet)
        const sonnet = claude3Models.find((m: any) => m.id.includes('sonnet'));
        selectedModel = sonnet || claude3Models[0];
      } else {
        // Ultimate fallback
        selectedModel = data.data[0];
      }
      
      console.log(`   ✓ Using: ${selectedModel.id} (${selectedModel.display_name})`);
      this.cachedModel = selectedModel.id;
      return selectedModel.id;

    } catch (error) {
      console.warn(`   ⚠️  Models API failed, trying fallback detection...`);
      
      // Fallback to trying models manually
      const modelsToTry = [
        'claude-4-5-20250929',
        'claude-4-5-sonnet-20250929',
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-sonnet-20240620',
      ];

      for (const model of modelsToTry) {
        if (await this.isModelAvailable(model)) {
          console.log(`   ✓ Using: ${model}`);
          this.cachedModel = model;
          return model;
        }
      }

      // Ultimate fallback
      const fallback = 'claude-3-5-sonnet-20240620';
      console.log(`   ⚠️  Using fallback model: ${fallback}`);
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
      // ANY error means model not available for this user
      // Including 404, auth errors, rate limits, etc.
      return false;
    }
  }

  /**
   * Clear cached model (for testing or forcing re-detection)
   */
  clearCache(): void {
    this.cachedModel = null;
  }
}
