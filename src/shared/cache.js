/**
 * Google Apps Script CacheService를 위한 유틸리티
 */

/**
 * 캐시를 사용하여 함수 결과를 가져옵니다.
 * 캐시에 유효한 데이터가 있으면 캐시에서 반환하고,
 * 없으면 콜백 함수를 실행하여 결과를 가져온 후 캐시에 저장하고 반환합니다.
 *
 * @param {string} key - 캐시에 사용할 고유 키
 * @param {number} durationSeconds - 캐시 유효 시간 (초 단위)
 * @param {function} callback - 캐시된 데이터가 없을 때 실행할 함수
 * @returns {*} 콜백 함수의 반환값
 */
function withCache(key, durationSeconds, callback) {
  const cache = CacheService.getScriptCache();
  const cachedValue = cache.get(key);

  if (cachedValue !== null) {
    Logger.log(`CACHE HIT: 키 '${key}'에 대한 데이터를 캐시에서 가져옵니다.`);
    try {
      return JSON.parse(cachedValue);
    } catch (e) {
      // JSON이 아닌 단순 문자열일 수 있음
      return cachedValue;
    }
  }

  Logger.log(`CACHE MISS: 키 '${key}'에 대한 데이터를 생성하고 캐시에 저장합니다 (유효시간: ${durationSeconds}초).`);
  const result = callback();
  
  // 결과가 null이나 undefined가 아닐 때만 캐시에 저장
  if (result !== null && result !== undefined) {
    try {
      // 객체나 배열은 JSON 문자열로 변환하여 저장
      let valueToCache = typeof result === 'object' ? JSON.stringify(result) : String(result);
      
      // 크기 계산 (안전)
      const sizeInBytes = valueToCache.length;
      const sizeInKB = Math.round(sizeInBytes / 1024);
      
      // WordPress API 응답의 경우 필수 정보만 캐시
      if (key.startsWith('wp_')) {
        valueToCache = compressWordPressResponse(result, key);
      }
      
      // Google Apps Script 캐시 크기 제한 체크 (90KB 미만으로 더 안전하게)
      if (valueToCache && valueToCache.length < 90000) {
        cache.put(key, valueToCache, durationSeconds);
        Logger.log(`✅ 캐시 저장 성공: ${key} (크기: ${Math.round(valueToCache.length/1024)}KB)`);
      } else {
        Logger.log(`⚠️ 캐시 크기 초과로 저장 생략: ${key} (크기: ${sizeInKB}KB)`);
        // 캐시하지 않더라도 결과는 반환
      }
    } catch (error) {
      Logger.log(`❌ 캐시 저장 실패 (${key}): ${error.message}`);
      // 캐시 실패해도 결과는 반환
    }
  }
  
  return result;
}

/**
 * WordPress API 응답을 압축하여 캐시 크기 줄이기
 */
function compressWordPressResponse(data, key) {
  try {
    if (key.includes('wp_cat_') || key.includes('wp_tag_')) {
      // 카테고리/태그의 경우 ID만 저장
      if (data && typeof data === 'object') {
        return JSON.stringify({ id: data.id, name: data.name });
      }
    }
    
    // 기타 WordPress 응답의 경우 필수 필드만 저장
    if (Array.isArray(data)) {
      return JSON.stringify(data.map(item => ({
        id: item.id,
        name: item.name || item.title?.rendered,
        slug: item.slug
      })));
    }
    
    if (data && typeof data === 'object' && data.id) {
      return JSON.stringify({
        id: data.id,
        name: data.name || data.title?.rendered,
        slug: data.slug
      });
    }
    
    // 압축할 수 없으면 원본 반환
    return JSON.stringify(data);
  } catch (error) {
    Logger.log(`캐시 압축 실패 (${key}): ${error.message}`);
    return null;
  }
}
