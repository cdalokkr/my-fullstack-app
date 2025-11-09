// ============================================
// lib/data/data-hydration-manager.ts
// Smart Data Hydration/Dehydration System
// ============================================

import { smartCacheManager } from '@/lib/cache/smart-cache-manager'

export interface HydrationConfig {
  enableDeepHydration: boolean
  enablePartialHydration: boolean
  enableCompression: boolean
  enableEncryption: boolean
  maxHydrationDepth: number
  batchSize: number
  timeout: number
}

export interface HydrationMetadata {
  version: string
  timestamp: number
  source: 'cache' | 'server' | 'hybrid'
  size: number
  depth: number
  compressed: boolean
  encrypted: boolean
  checksum: string
  [key: string]: unknown
}

export interface DehydrationOptions {
  includeMetadata: boolean
  compressLargePayloads: boolean
  preserveReferences: boolean
  optimizeForStorage: boolean
}

export interface HydrationContext {
  dataType: string
  userId?: string
  sessionId?: string
  priority: 'critical' | 'important' | 'normal' | 'low'
  deviceCapabilities: {
    memory: 'low' | 'medium' | 'high'
    storage: 'limited' | 'normal' | 'unlimited'
    processing: 'low' | 'medium' | 'high'
  }
  networkQuality: 'slow' | 'medium' | 'fast'
}

export interface HydrationResult<T = unknown> {
  data: T
  metadata: HydrationMetadata
  hydrationTime: number
  size: number
  cacheHit: boolean
}

class DataHydrationManager {
  private static instance: DataHydrationManager
  private config: HydrationConfig
  private hydrationCache: Map<string, {
    data: unknown
    metadata: HydrationMetadata
    timestamp: number
  }> = new Map()

  private constructor(config: Partial<HydrationConfig> = {}) {
    this.config = {
      enableDeepHydration: true,
      enablePartialHydration: true,
      enableCompression: true,
      enableEncryption: false, // Future enhancement
      maxHydrationDepth: 10,
      batchSize: 100,
      timeout: 5000,
      ...config
    }
  }

  static getInstance(config?: Partial<HydrationConfig>): DataHydrationManager {
    if (!DataHydrationManager.instance) {
      DataHydrationManager.instance = new DataHydrationManager(config)
    }
    return DataHydrationManager.instance
  }

  /**
   * Hydrate data with intelligent optimization based on context
   */
  async hydrate<T>(
    key: string,
    context: HydrationContext,
    options: Partial<DehydrationOptions> = {}
  ): Promise<HydrationResult<T>> {
    const startTime = Date.now()
    
    try {
      // Try cache first
      const cachedResult = await this.getFromCache(key, context)
      if (cachedResult) {
        return {
          ...cachedResult,
          cacheHit: true,
          hydrationTime: Date.now() - startTime
        }
      }

      // Fallback to server or hybrid hydration
      const hydrationResult = await this.performHydration<T>(key, context, options)
      hydrationResult.hydrationTime = Date.now() - startTime
      
      // Cache the result for future use
      await this.cacheResult(key, hydrationResult, context)
      
      return {
        ...hydrationResult,
        cacheHit: false
      }
    } catch (error) {
      console.error(`Hydration failed for key ${key}:`, error)
      throw new Error(`Data hydration failed: ${error}`)
    }
  }

  /**
   * Dehydrate data for storage with smart optimization
   */
  async dehydrate<T>(
    data: T,
    context: HydrationContext,
    options: Partial<DehydrationOptions> = {}
  ): Promise<{
    dehydratedData: string
    metadata: HydrationMetadata
    originalSize: number
    compressedSize: number
    compressionRatio: number
  }> {
    const startTime = Date.now()
    
    // Create metadata
    const metadata: HydrationMetadata = {
      version: '1.0.0',
      timestamp: Date.now(),
      source: 'server',
      size: this.calculateSize(data),
      depth: this.calculateDepth(data),
      compressed: false,
      encrypted: false,
      checksum: this.generateChecksum(data)
    }

    // Optimize data structure based on device capabilities
    const optimizedData = this.optimizeForDeviceCapabilities(data, context.deviceCapabilities)
    
    // Serialize and compress if needed
    const serialized = JSON.stringify({
      data: optimizedData,
      metadata: options.includeMetadata ? { ...metadata } : undefined
    })

    let compressedSize = serialized.length
    let compressed = false
    let finalData = serialized

    // Apply compression if beneficial
    if (this.config.enableCompression && 
        serialized.length > 1024 && // Only compress large payloads
        options.compressLargePayloads !== false) {
      
      const compressionResult = await this.compressData(serialized)
      compressed = compressionResult.compressed
      compressedSize = compressionResult.size
      finalData = compressionResult.data
    }

    metadata.size = optimizedData ? this.calculateSize(optimizedData) : this.calculateSize(data)
    metadata.compressed = compressed
    metadata.depth = this.calculateDepth(optimizedData || data)

    return {
      dehydratedData: finalData,
      metadata,
      originalSize: serialized.length,
      compressedSize,
      compressionRatio: compressed ? serialized.length / compressedSize : 1
    }
  }

  /**
   * Batch hydrate multiple keys for efficiency
   */
  async batchHydrate<T>(
    keys: string[],
    context: HydrationContext,
    options: Partial<DehydrationOptions> = {}
  ): Promise<Record<string, HydrationResult<T>>> {
    const results: Record<string, HydrationResult<T>> = {}
    const batchSize = Math.min(this.config.batchSize, keys.length)
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      const batchPromises = batch.map(key => this.hydrate<T>(key, context, options))
      
      try {
        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((result, index) => {
          const key = batch[index]
          if (result.status === 'fulfilled') {
            results[key] = result.value
          } else {
            console.warn(`Failed to hydrate key ${key}:`, result.reason)
            // Could add fallback or placeholder here
          }
        })
      } catch (error) {
        console.error('Batch hydration error:', error)
      }
    }

    return results
  }

  /**
   * Smart partial hydration for large datasets
   */
  async partialHydrate<T>(
    key: string,
    context: HydrationContext,
    fields: string[]
  ): Promise<HydrationResult<Partial<T>>> {
    const startTime = Date.now()
    
    // Get full data first (this could be optimized to fetch only needed fields)
    const fullResult = await this.hydrate<T>(key, context)
    
    // Extract only requested fields
    const partialData = this.extractFields(fullResult.data, fields) as Partial<T>
    
    return {
      data: partialData,
      metadata: fullResult.metadata,
      hydrationTime: Date.now() - startTime,
      size: this.calculateSize(partialData),
      cacheHit: fullResult.cacheHit
    }
  }

  /**
   * Get data from cache with smart validation
   */
  private async getFromCache<T>(
    key: string,
    context: HydrationContext
  ): Promise<HydrationResult<T> | null> {
    try {
      // Try smart cache manager first
      const cachedData = await smartCacheManager.get<T>(key, context.dataType)
      if (cachedData) {
        const cacheMetadata: HydrationMetadata = {
          version: '1.0.0',
          timestamp: Date.now(),
          source: 'cache',
          size: this.calculateSize(cachedData),
          depth: this.calculateDepth(cachedData),
          compressed: false,
          encrypted: false,
          checksum: this.generateChecksum(cachedData)
        }
        return {
          data: cachedData,
          metadata: cacheMetadata,
          hydrationTime: 0,
          size: this.calculateSize(cachedData),
          cacheHit: true
        }
      }

      // Check internal hydration cache
      const internalCached = this.hydrationCache.get(key)
      if (internalCached && this.isValidCache(internalCached, context)) {
        return {
          data: internalCached.data as T,
          metadata: internalCached.metadata,
          hydrationTime: 0,
          size: this.calculateSize(internalCached.data),
          cacheHit: true
        }
      }

      return null
    } catch (error) {
      console.warn(`Cache retrieval failed for ${key}:`, error)
      return null
    }
  }

  /**
   * Perform actual hydration from server
   */
  private async performHydration<T>(
    key: string,
    context: HydrationContext,
    options: Partial<DehydrationOptions>
  ): Promise<HydrationResult<T>> {
    // This would integrate with your existing data fetching
    // For now, using a placeholder implementation
    const serverData = await this.fetchFromServer(key, context)
    
    return {
      data: serverData as T,
      metadata: {
        version: '1.0.0',
        timestamp: Date.now(),
        source: 'server',
        size: this.calculateSize(serverData),
        depth: this.calculateDepth(serverData),
        compressed: false,
        encrypted: false,
        checksum: this.generateChecksum(serverData)
      },
      hydrationTime: 0,
      size: this.calculateSize(serverData),
      cacheHit: false
    }
  }

  /**
   * Fetch data from server with context-aware optimization
   */
  private async fetchFromServer(key: string, context: HydrationContext): Promise<unknown> {
    // This would integrate with your existing tRPC queries or API calls
    // For now, return a mock implementation
    const response = await fetch(`/api/data/${key}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Context': JSON.stringify(context)
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Cache result with smart TTL and optimization
   */
  private async cacheResult(
    key: string,
    result: HydrationResult,
    context: HydrationContext
  ): Promise<void> {
    try {
      // Store in smart cache manager
      await smartCacheManager.set(key, result.data, {
        namespace: context.dataType,
        dataType: context.dataType,
        context: {
          dataType: context.dataType,
          timeOfDay: new Date(),
          dayOfWeek: new Date().getDay(),
          systemLoad: 'medium',
          userProfile: {
            isActive: true,
            lastActivity: new Date(),
            role: 'admin'
          }
        },
        metadata: result.metadata
      })

      // Also store in internal cache for faster access
      this.hydrationCache.set(key, {
        data: result.data,
        metadata: result.metadata,
        timestamp: Date.now()
      })

      // Limit internal cache size
      if (this.hydrationCache.size > 1000) {
        const oldestKey = this.hydrationCache.keys().next().value
        if (oldestKey !== undefined) {
          this.hydrationCache.delete(oldestKey)
        }
      }
    } catch (error) {
      console.warn(`Failed to cache result for ${key}:`, error)
    }
  }

  /**
   * Optimize data based on device capabilities
   */
  private optimizeForDeviceCapabilities(data: unknown, capabilities: HydrationContext['deviceCapabilities']): unknown {
    if (!this.config.enableDeepHydration) {
      return data
    }

    // Reduce precision for low-end devices
    if (capabilities.processing === 'low') {
      return this.reducePrecision(data)
    }

    // Limit data size for limited storage
    if (capabilities.storage === 'limited') {
      return this.limitDataSize(data, 10000) // 10KB limit
    }

    return data
  }

  /**
   * Reduce numerical precision for optimization
   */
  private reducePrecision(data: unknown): unknown {
    if (typeof data === 'number') {
      return Math.round(data * 100) / 100 // Round to 2 decimal places
    }

    if (Array.isArray(data)) {
      return data.slice(0, 100) // Limit array size
    }

    if (typeof data === 'object' && data !== null) {
      const result: Record<string, unknown> = {}
      const keys = Object.keys(data).slice(0, 50) // Limit object properties
      
      for (const key of keys) {
        result[key] = this.reducePrecision((data as Record<string, unknown>)[key])
      }
      
      return result
    }

    return data
  }

  /**
   * Limit data size by removing least important fields
   */
  private limitDataSize(data: unknown, maxSize: number): unknown {
    if (this.calculateSize(data) <= maxSize) {
      return data
    }

    if (Array.isArray(data)) {
      return data.slice(0, Math.floor(data.length * 0.8)) // Remove 20%
    }

    if (typeof data === 'object' && data !== null) {
      const result: Record<string, unknown> = {}
      const entries = Object.entries(data)
      const sortedEntries = entries.sort(([, a], [, b]) => this.calculateSize(b) - this.calculateSize(a))
      
      let currentSize = 0
      for (const [key, value] of sortedEntries) {
        const valueSize = this.calculateSize(value)
        if (currentSize + valueSize <= maxSize * 0.8) {
          result[key] = value
          currentSize += valueSize
        } else {
          break
        }
      }
      
      return result
    }

    return data
  }

  /**
   * Extract specific fields from data
   */
  private extractFields(data: unknown, fields: string[]): unknown {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const result: Record<string, unknown> = {}
    const dataObj = data as Record<string, unknown>

    for (const field of fields) {
      if (field in dataObj) {
        result[field] = dataObj[field]
      }
    }

    return result
  }

  /**
   * Calculate data size in bytes
   */
  private calculateSize(data: unknown): number {
    return JSON.stringify(data).length
  }

  /**
   * Calculate data depth
   */
  private calculateDepth(data: unknown, currentDepth = 0): number {
    if (currentDepth >= this.config.maxHydrationDepth) {
      return currentDepth
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return currentDepth
      return Math.max(...data.map(item => this.calculateDepth(item, currentDepth + 1)))
    }

    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data)
      if (keys.length === 0) return currentDepth
      return Math.max(...keys.map(key => 
        this.calculateDepth((data as Record<string, unknown>)[key], currentDepth + 1)
      ))
    }

    return currentDepth
  }

  /**
   * Generate simple checksum
   */
  private generateChecksum(data: unknown): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Compress data if beneficial
   */
  private async compressData(data: string): Promise<{ compressed: boolean; data: string; size: number }> {
    try {
      // Simple compression - in production, use a proper compression library
      const compressed = this.simpleCompression(data)
      const size = compressed.length
      
      // Only use compression if it saves more than 10%
      if (size < data.length * 0.9) {
        return {
          compressed: true,
          data: compressed,
          size
        }
      }
      
      return {
        compressed: false,
        data,
        size: data.length
      }
    } catch (error) {
      console.warn('Compression failed:', error)
      return {
        compressed: false,
        data,
        size: data.length
      }
    }
  }

  /**
   * Simple compression algorithm
   */
  private simpleCompression(data: string): string {
    // Remove whitespace and newlines
    return data.replace(/\s+/g, ' ').trim()
  }

  /**
   * Check if cached data is still valid
   */
  private isValidCache(cached: { timestamp: number; metadata: HydrationMetadata }, context: HydrationContext): boolean {
    const maxAge = context.priority === 'critical' ? 30000 : // 30 seconds
                  context.priority === 'important' ? 60000 : // 1 minute
                  300000 // 5 minutes

    return (Date.now() - cached.timestamp) < maxAge
  }

  /**
   * Clean up old cache entries
   */
  cleanup(): void {
    this.hydrationCache.clear()
  }
}

export const dataHydrationManager = DataHydrationManager.getInstance()