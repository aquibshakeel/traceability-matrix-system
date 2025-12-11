/**
 * Smart Cache Manager with File Invalidation
 * 
 * CRITICAL: Ensures fresh data through modification time checking
 * - File cache: Invalidated when file is modified (mtime check)
 * - AI cache: Time-based expiration with hash-based keys
 * - Memory efficient: LRU-style eviction for large datasets
 */

import * as fs from 'fs';
import * as crypto from 'crypto';

interface FileCacheEntry {
  content: any;
  mtime: number;
  size: number;
}

interface AICacheEntry {
  response: any;
  timestamp: number;
  promptHash: string;
}

export class CacheManager {
  private fileCache = new Map<string, FileCacheEntry>();
  private aiCache = new Map<string, AICacheEntry>();
  
  // Configuration
  private readonly maxFileCacheSize = 100; // Max files to cache
  private readonly maxAICacheSize = 50; // Max AI responses to cache
  private readonly defaultAICacheMaxAge = 3600000; // 1 hour default
  
  // Statistics
  private stats = {
    fileHits: 0,
    fileMisses: 0,
    aiHits: 0,
    aiMisses: 0,
    fileInvalidations: 0,
    aiInvalidations: 0
  };

  /**
   * Get file content with smart cache invalidation
   * CRITICAL: Always checks file modification time to ensure fresh data
   */
  async getFile<T>(filePath: string, loader: () => Promise<T> | T): Promise<T> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        // File doesn't exist - remove from cache if present
        if (this.fileCache.has(filePath)) {
          this.fileCache.delete(filePath);
          this.stats.fileInvalidations++;
        }
        throw new Error(`File not found: ${filePath}`);
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const currentMtime = stats.mtimeMs;
      const currentSize = stats.size;

      // Check cache
      const cached = this.fileCache.get(filePath);

      // Cache hit: File hasn't been modified
      if (cached && cached.mtime === currentMtime && cached.size === currentSize) {
        this.stats.fileHits++;
        return cached.content as T;
      }

      // Cache miss or invalidation: Load fresh data
      if (cached) {
        this.stats.fileInvalidations++;
      } else {
        this.stats.fileMisses++;
      }

      const content = await loader();

      // Store in cache with metadata
      this.fileCache.set(filePath, {
        content,
        mtime: currentMtime,
        size: currentSize
      });

      // LRU eviction if cache is too large
      this.evictOldestFileEntries();

      return content;
    } catch (error) {
      // If file read fails, remove from cache
      this.fileCache.delete(filePath);
      throw error;
    }
  }

  /**
   * Get AI response with time-based cache expiration
   * Uses prompt hash to detect exact matches
   */
  async getAIResponse<T>(
    prompt: string,
    apiCall: () => Promise<T>,
    maxAge: number = this.defaultAICacheMaxAge
  ): Promise<T> {
    // Generate hash of prompt
    const promptHash = this.hashPrompt(prompt);

    // Check cache
    const cached = this.aiCache.get(promptHash);
    const now = Date.now();

    // Cache hit: Response is still fresh
    if (cached && (now - cached.timestamp) < maxAge) {
      this.stats.aiHits++;
      return cached.response as T;
    }

    // Cache miss or expired
    if (cached) {
      this.stats.aiInvalidations++;
    } else {
      this.stats.aiMisses++;
    }

    // Make fresh API call
    const response = await apiCall();

    // Store in cache with timestamp
    this.aiCache.set(promptHash, {
      response,
      timestamp: now,
      promptHash
    });

    // LRU eviction if cache is too large
    this.evictOldestAIEntries();

    return response;
  }

  /**
   * Manually invalidate file cache entry
   */
  invalidateFile(filePath: string): void {
    if (this.fileCache.has(filePath)) {
      this.fileCache.delete(filePath);
      this.stats.fileInvalidations++;
    }
  }

  /**
   * Manually invalidate AI cache entry by prompt
   */
  invalidateAIPrompt(prompt: string): void {
    const hash = this.hashPrompt(prompt);
    if (this.aiCache.has(hash)) {
      this.aiCache.delete(hash);
      this.stats.aiInvalidations++;
    }
  }

  /**
   * Clear all file caches
   */
  clearFileCache(): void {
    const count = this.fileCache.size;
    this.fileCache.clear();
    this.stats.fileInvalidations += count;
  }

  /**
   * Clear all AI caches
   */
  clearAICache(): void {
    const count = this.aiCache.size;
    this.aiCache.clear();
    this.stats.aiInvalidations += count;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.clearFileCache();
    this.clearAICache();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const fileHitRate = this.stats.fileHits + this.stats.fileMisses > 0
      ? (this.stats.fileHits / (this.stats.fileHits + this.stats.fileMisses) * 100).toFixed(1)
      : '0.0';
    
    const aiHitRate = this.stats.aiHits + this.stats.aiMisses > 0
      ? (this.stats.aiHits / (this.stats.aiHits + this.stats.aiMisses) * 100).toFixed(1)
      : '0.0';

    return {
      file: {
        hits: this.stats.fileHits,
        misses: this.stats.fileMisses,
        invalidations: this.stats.fileInvalidations,
        hitRate: `${fileHitRate}%`,
        cacheSize: this.fileCache.size
      },
      ai: {
        hits: this.stats.aiHits,
        misses: this.stats.aiMisses,
        invalidations: this.stats.aiInvalidations,
        hitRate: `${aiHitRate}%`,
        cacheSize: this.aiCache.size
      }
    };
  }

  /**
   * Print cache statistics
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('\n📊 Cache Statistics:');
    console.log(`   File Cache: ${stats.file.hitRate} hit rate (${stats.file.hits} hits, ${stats.file.misses} misses, ${stats.file.cacheSize} cached)`);
    console.log(`   AI Cache: ${stats.ai.hitRate} hit rate (${stats.ai.hits} hits, ${stats.ai.misses} misses, ${stats.ai.cacheSize} cached)`);
  }

  /**
   * Reset statistics (useful for testing)
   */
  resetStats(): void {
    this.stats = {
      fileHits: 0,
      fileMisses: 0,
      aiHits: 0,
      aiMisses: 0,
      fileInvalidations: 0,
      aiInvalidations: 0
    };
  }

  /**
   * Hash prompt for cache key
   */
  private hashPrompt(prompt: string): string {
    return crypto
      .createHash('sha256')
      .update(prompt)
      .digest('hex');
  }

  /**
   * Evict oldest file cache entries (LRU-style)
   */
  private evictOldestFileEntries(): void {
    if (this.fileCache.size <= this.maxFileCacheSize) {
      return;
    }

    // Convert to array and keep only newest entries
    const entries = Array.from(this.fileCache.entries());
    entries.sort((a, b) => b[1].mtime - a[1].mtime);
    
    this.fileCache.clear();
    entries.slice(0, this.maxFileCacheSize).forEach(([key, value]) => {
      this.fileCache.set(key, value);
    });
  }

  /**
   * Evict oldest AI cache entries (LRU-style)
   */
  private evictOldestAIEntries(): void {
    if (this.aiCache.size <= this.maxAICacheSize) {
      return;
    }

    // Convert to array and keep only newest entries
    const entries = Array.from(this.aiCache.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    this.aiCache.clear();
    entries.slice(0, this.maxAICacheSize).forEach(([key, value]) => {
      this.aiCache.set(key, value);
    });
  }

  /**
   * Check if file has been modified since last cache
   * Useful for external checks
   */
  hasFileChanged(filePath: string): boolean {
    if (!fs.existsSync(filePath)) {
      return true;
    }

    const cached = this.fileCache.get(filePath);
    if (!cached) {
      return true;
    }

    const stats = fs.statSync(filePath);
    return stats.mtimeMs !== cached.mtime || stats.size !== cached.size;
  }
}
