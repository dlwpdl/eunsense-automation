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
    // 객체나 배열은 JSON 문자열로 변환하여 저장
    const valueToCache = typeof result === 'object' ? JSON.stringify(result) : result;
    cache.put(key, valueToCache, durationSeconds);
  }
  
  return result;
}
