/**
 * 💾 고급 캐싱 시스템
 * AI 응답, 이미지 URL, 트렌드 데이터 캐싱으로 API 호출 최적화
 */

const CACHE_KEYS = {
  AI_RESPONSES: 'AI_CACHE_',
  IMAGE_URLS: 'IMG_CACHE_',
  TRENDS_DATA: 'TRENDS_CACHE_',
  CONFIG_DATA: 'CONFIG_CACHE_',
  WP_CATEGORIES: 'WP_CAT_CACHE_',
  WP_TAGS: 'WP_TAG_CACHE_'
};

const DEFAULT_CACHE_DURATION = {
  AI_RESPONSES: 7 * 24 * 60 * 60 * 1000, // 7일
  IMAGE_URLS: 30 * 24 * 60 * 60 * 1000, // 30일
  TRENDS_DATA: 6 * 60 * 60 * 1000, // 6시간
  CONFIG_DATA: 60 * 60 * 1000, // 1시간
  WP_METADATA: 24 * 60 * 60 * 1000 // 24시간
};

/**
 * 통합 캐시 관리자
 */
class CacheManager {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      defaultDuration: config.defaultDuration || 24 * 60 * 60 * 1000,
      maxEntries: config.maxEntries || 1000,
      compressionEnabled: config.compressionEnabled !== false
    };
    
    this.cache = CacheService.getScriptCache();
    this.properties = PropertiesService.getScriptProperties();
  }
  
  /**
   * 캐시에서 데이터 조회
   */
  get(key, options = {}) {
    if (!this.config.enabled) return null;
    
    try {
      const cacheKey = this._buildKey(key);
      let cachedData = this.cache.get(cacheKey);
      
      if (!cachedData) {
        // CacheService에 없으면 Properties에서 시도 (더 긴 보관)
        cachedData = this.properties.getProperty(cacheKey);
      }
      
      if (!cachedData) return null;
      
      const parsedData = JSON.parse(cachedData);
      
      // 만료 시간 확인
      if (this._isExpired(parsedData)) {
        this.delete(key);
        return null;
      }
      
      // 압축 해제
      const data = this.config.compressionEnabled ? 
        this._decompress(parsedData.data) : parsedData.data;
      
      Logger.log(`💾 캐시 히트: ${key}`);
      return data;
      
    } catch (error) {
      Logger.log(`❌ 캐시 조회 실패: ${key} - ${error.message}`);
      return null;
    }
  }
  
  /**
   * 캐시에 데이터 저장
   */
  set(key, data, duration = null) {
    if (!this.config.enabled) return false;
    
    try {
      const cacheKey = this._buildKey(key);
      const expiresAt = Date.now() + (duration || this.config.defaultDuration);
      
      // 압축 적용
      const compressedData = this.config.compressionEnabled ? 
        this._compress(data) : data;
      
      const cacheEntry = {
        data: compressedData,
        createdAt: Date.now(),
        expiresAt: expiresAt,
        key: key
      };
      
      const serialized = JSON.stringify(cacheEntry);
      
      // 크기가 큰 경우 Properties에 저장, 작은 경우 CacheService 사용
      const sizeMB = new Blob([serialized]).size / (1024 * 1024);
      
      if (sizeMB > 0.1) { // 100KB 이상
        this.properties.setProperty(cacheKey, serialized);
        Logger.log(`💾 대용량 캐시 저장 (Properties): ${key} (${sizeMB.toFixed(2)}MB)`);
      } else {
        // CacheService는 최대 21600초 (6시간)
        const cacheSeconds = Math.min(Math.floor(duration / 1000), 21600);
        this.cache.put(cacheKey, serialized, cacheSeconds);
        Logger.log(`💾 캐시 저장: ${key} (${sizeMB.toFixed(2)}MB, ${cacheSeconds}초)`);
      }
      
      return true;
      
    } catch (error) {
      Logger.log(`❌ 캐시 저장 실패: ${key} - ${error.message}`);
      return false;
    }
  }
  
  /**
   * 캐시에서 데이터 삭제
   */
  delete(key) {
    try {
      const cacheKey = this._buildKey(key);
      this.cache.remove(cacheKey);
      this.properties.deleteProperty(cacheKey);
      Logger.log(`🗑️ 캐시 삭제: ${key}`);
      return true;
    } catch (error) {
      Logger.log(`❌ 캐시 삭제 실패: ${key} - ${error.message}`);
      return false;
    }
  }
  
  /**
   * 특정 접두사로 시작하는 모든 캐시 삭제
   */
  deleteByPrefix(prefix) {
    try {
      const properties = this.properties.getProperties();
      let deletedCount = 0;
      
      Object.keys(properties).forEach(key => {
        if (key.startsWith(this._buildKey(prefix))) {
          this.properties.deleteProperty(key);
          deletedCount++;
        }
      });
      
      Logger.log(`🗑️ 접두사 캐시 삭제: ${prefix} (${deletedCount}개)`);
      return deletedCount;
      
    } catch (error) {
      Logger.log(`❌ 접두사 캐시 삭제 실패: ${prefix} - ${error.message}`);
      return 0;
    }
  }
  
  /**
   * 만료된 캐시 정리
   */
  cleanup() {
    try {
      const properties = this.properties.getProperties();
      let cleanedCount = 0;
      
      Object.entries(properties).forEach(([key, value]) => {
        if (key.startsWith('CACHE_')) {
          try {
            const parsedData = JSON.parse(value);
            if (this._isExpired(parsedData)) {
              this.properties.deleteProperty(key);
              cleanedCount++;
            }
          } catch (parseError) {
            // 잘못된 캐시 데이터 삭제
            this.properties.deleteProperty(key);
            cleanedCount++;
          }
        }
      });
      
      Logger.log(`🧹 만료된 캐시 정리: ${cleanedCount}개 삭제`);
      return cleanedCount;
      
    } catch (error) {
      Logger.log(`❌ 캐시 정리 실패: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * 캐시 통계 조회
   */
  getStats() {
    try {
      const properties = this.properties.getProperties();
      const stats = {
        totalEntries: 0,
        byCategory: {},
        totalSizeMB: 0,
        expired: 0,
        oldestEntry: null,
        newestEntry: null
      };
      
      Object.entries(properties).forEach(([key, value]) => {
        if (key.startsWith('CACHE_')) {
          stats.totalEntries++;
          stats.totalSizeMB += new Blob([value]).size / (1024 * 1024);
          
          try {
            const parsedData = JSON.parse(value);
            
            if (this._isExpired(parsedData)) {
              stats.expired++;
            }
            
            // 카테고리별 분류
            const category = key.split('_')[1] || 'UNKNOWN';
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            
            // 최신/최오래된 항목
            if (!stats.oldestEntry || parsedData.createdAt < stats.oldestEntry) {
              stats.oldestEntry = parsedData.createdAt;
            }
            if (!stats.newestEntry || parsedData.createdAt > stats.newestEntry) {
              stats.newestEntry = parsedData.createdAt;
            }
            
          } catch (parseError) {
            // 파싱 실패한 항목도 집계
            stats.byCategory.CORRUPTED = (stats.byCategory.CORRUPTED || 0) + 1;
          }
        }
      });
      
      Logger.log(`📊 캐시 통계: ${stats.totalEntries}개 항목, ${stats.totalSizeMB.toFixed(2)}MB`);
      return stats;
      
    } catch (error) {
      Logger.log(`❌ 캐시 통계 조회 실패: ${error.message}`);
      return null;
    }
  }
  
  // Private methods
  _buildKey(key) {
    return `CACHE_${key}`;
  }
  
  _isExpired(cacheEntry) {
    return Date.now() > cacheEntry.expiresAt;
  }
  
  _compress(data) {
    // 간단한 압축: JSON 문자열 최소화
    return JSON.stringify(data);
  }
  
  _decompress(compressedData) {
    return JSON.parse(compressedData);
  }
}

// 전역 캐시 매니저 인스턴스
const cacheManager = new CacheManager();

/**
 * AI 응답 캐싱 래퍼
 */
function getCachedAIResponse(topic, language, aiFunction) {
  const cacheKey = `${CACHE_KEYS.AI_RESPONSES}${topic}_${language}`;
  
  // 캐시에서 조회
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    Logger.log(`💾 AI 캐시 사용: ${topic}`);
    return cached;
  }
  
  // 캐시 미스 - 새로 생성
  Logger.log(`🤖 AI 새로 생성: ${topic}`);
  const result = aiFunction();
  
  // 성공한 경우만 캐시에 저장
  if (result && result.title && result.html) {
    cacheManager.set(cacheKey, result, DEFAULT_CACHE_DURATION.AI_RESPONSES);
  }
  
  return result;
}

/**
 * 이미지 URL 캐싱 래퍼
 */
function getCachedImage(query, imageFunction) {
  const cacheKey = `${CACHE_KEYS.IMAGE_URLS}${query}`;
  
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    Logger.log(`💾 이미지 캐시 사용: ${query}`);
    return cached;
  }
  
  Logger.log(`🖼️ 이미지 새로 검색: ${query}`);
  const result = imageFunction();
  
  // 성공한 경우만 캐시에 저장
  if (result && result.url) {
    cacheManager.set(cacheKey, result, DEFAULT_CACHE_DURATION.IMAGE_URLS);
  }
  
  return result;
}

/**
 * 트렌드 데이터 캐싱 래퍼
 */
function getCachedTrends(region, category, trendsFunction) {
  const cacheKey = `${CACHE_KEYS.TRENDS_DATA}${region}_${category}`;
  
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    Logger.log(`💾 트렌드 캐시 사용: ${region}_${category}`);
    return cached;
  }
  
  Logger.log(`📈 트렌드 새로 수집: ${region}_${category}`);
  const result = trendsFunction();
  
  // 성공한 경우만 캐시에 저장
  if (result && result.length > 0) {
    cacheManager.set(cacheKey, result, DEFAULT_CACHE_DURATION.TRENDS_DATA);
  }
  
  return result;
}

/**
 * WordPress 카테고리/태그 캐싱
 */
function getCachedWordPressMetadata(type, value, wpFunction) {
  const cacheKey = `${type === 'category' ? CACHE_KEYS.WP_CATEGORIES : CACHE_KEYS.WP_TAGS}${value}`;
  
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    Logger.log(`💾 WordPress ${type} 캐시 사용: ${value}`);
    return cached;
  }
  
  Logger.log(`📝 WordPress ${type} 새로 생성: ${value}`);
  const result = wpFunction();
  
  if (result) {
    cacheManager.set(cacheKey, result, DEFAULT_CACHE_DURATION.WP_METADATA);
  }
  
  return result;
}

/**
 * 캐시 관리 함수들 (Google Apps Script에서 직접 호출 가능)
 */
function clearAllCache() {
  Logger.log("🗑️ 모든 캐시 삭제 시작");
  
  const stats = cacheManager.getStats();
  Logger.log(`삭제 전 통계: ${JSON.stringify(stats, null, 2)}`);
  
  // 각 카테고리별로 삭제
  Object.values(CACHE_KEYS).forEach(prefix => {
    cacheManager.deleteByPrefix(prefix);
  });
  
  Logger.log("✅ 모든 캐시 삭제 완료");
}

function clearExpiredCache() {
  Logger.log("🧹 만료된 캐시 정리 시작");
  const cleaned = cacheManager.cleanup();
  Logger.log(`✅ 만료된 캐시 정리 완료: ${cleaned}개 삭제`);
  return cleaned;
}

function getCacheStats() {
  Logger.log("📊 캐시 통계 조회");
  const stats = cacheManager.getStats();
  
  if (stats) {
    Logger.log("=== 캐시 통계 ===");
    Logger.log(`총 캐시 항목: ${stats.totalEntries}개`);
    Logger.log(`총 용량: ${stats.totalSizeMB.toFixed(2)}MB`);
    Logger.log(`만료된 항목: ${stats.expired}개`);
    Logger.log("카테고리별 분포:");
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      Logger.log(`  ${category}: ${count}개`);
    });
    
    if (stats.oldestEntry && stats.newestEntry) {
      Logger.log(`가장 오래된 항목: ${new Date(stats.oldestEntry)}`);
      Logger.log(`가장 최신 항목: ${new Date(stats.newestEntry)}`);
    }
  }
  
  return stats;
}

function optimizeCache() {
  Logger.log("⚡ 캐시 최적화 시작");
  
  const beforeStats = cacheManager.getStats();
  const cleaned = clearExpiredCache();
  const afterStats = cacheManager.getStats();
  
  const optimization = {
    beforeEntries: beforeStats.totalEntries,
    afterEntries: afterStats.totalEntries,
    deletedEntries: cleaned,
    sizeDifference: beforeStats.totalSizeMB - afterStats.totalSizeMB
  };
  
  Logger.log("=== 캐시 최적화 결과 ===");
  Logger.log(`삭제된 항목: ${optimization.deletedEntries}개`);
  Logger.log(`용량 절약: ${optimization.sizeDifference.toFixed(2)}MB`);
  Logger.log(`최적화 후 항목: ${optimization.afterEntries}개`);
  
  return optimization;
}

/**
 * 캐시 워밍업 (자주 사용되는 데이터 미리 로드)
 */
function warmupCache() {
  Logger.log("🔥 캐시 워밍업 시작");
  
  try {
    const config = getEnhancedConfig();
    
    // 기본 트렌드 데이터 워밍업
    Logger.log("📈 트렌드 데이터 워밍업");
    getCachedTrends(config.TRENDS_REGION, config.TRENDS_CATEGORY, () => {
      return fetchTrendingTopics();
    });
    
    // 기본 이미지들 워밍업
    Logger.log("🖼️ 기본 이미지 워밍업");
    const commonQueries = ["AI technology", "WordPress blog", "SEO optimization"];
    commonQueries.forEach(query => {
      getCachedImage(query, () => {
        return findFeaturedImageForProduct(query, `Warmup ${query}`);
      });
    });
    
    Logger.log("✅ 캐시 워밍업 완료");
    
  } catch (error) {
    Logger.log(`❌ 캐시 워밍업 실패: ${error.message}`);
  }
}