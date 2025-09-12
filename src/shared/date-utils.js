/**
 * 날짜 및 시간 유틸리티 모듈
 * 모든 날짜 관련 로직을 중앙화하여 동적 처리
 */

/**
 * 현재 날짜와 시간 정보 반환
 */
function getCurrentDateInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  const quarter = Math.ceil(month / 3);
  const season = getSeason(month);
  
  return {
    year,
    month,
    day,
    quarter,
    season,
    yearMonth: `${year}-${String(month).padStart(2, '0')}`,
    fullDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    timestamp: now.getTime(),
    isoString: now.toISOString(),
    
    // SEO 및 콘텐츠에 사용할 텍스트
    yearText: year.toString(),
    monthText: getMonthName(month),
    seasonText: season,
    quarterText: `Q${quarter}`
  };
}

/**
 * 계절 반환 (북반구 기준)
 */
function getSeason(month) {
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

/**
 * 월 이름 반환
 */
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

/**
 * 콘텐츠용 시의성 키워드 생성
 */
function getTimelinessKeywords() {
  const dateInfo = getCurrentDateInfo();
  
  return {
    // 기본 시의성 키워드
    current: [
      `${dateInfo.yearText}`,
      `latest ${dateInfo.yearText}`,
      `updated ${dateInfo.yearText}`,
      `current ${dateInfo.yearText}`
    ],
    
    // 계절성 키워드
    seasonal: [
      `${dateInfo.seasonText} ${dateInfo.yearText}`,
      `${dateInfo.monthText} ${dateInfo.yearText}`,
      `${dateInfo.quarterText} ${dateInfo.yearText}`
    ],
    
    // 트렌드성 키워드
    trending: [
      `trending ${dateInfo.yearText}`,
      `hot ${dateInfo.yearText}`,
      `popular ${dateInfo.yearText}`,
      `best ${dateInfo.yearText}`
    ]
  };
}

/**
 * 프롬프트에 사용할 날짜 컨텍스트 생성
 */
function getDateContextForPrompt() {
  const dateInfo = getCurrentDateInfo();
  const keywords = getTimelinessKeywords();
  
  return {
    context: `Current Date: ${dateInfo.fullDate} (${dateInfo.monthText} ${dateInfo.yearText})`,
    freshness: `Write content that is relevant and fresh for ${dateInfo.yearText}`,
    seasonality: `Consider ${dateInfo.seasonText} ${dateInfo.yearText} context when relevant`,
    timeliness: keywords.current.concat(keywords.seasonal).slice(0, 5)
  };
}

/**
 * SEO 제목용 연도 삽입 최적화
 */
function optimizeTitleWithYear(title) {
  const dateInfo = getCurrentDateInfo();
  const year = dateInfo.yearText;
  
  // 이미 연도가 포함된 경우 업데이트
  const yearPattern = /\b(20[0-9]{2})\b/g;
  if (yearPattern.test(title)) {
    return title.replace(yearPattern, year);
  }
  
  // 연도가 없는 경우 자연스럽게 추가
  const patterns = [
    { regex: /\b(best|top|guide|tips|trends)\b/i, template: `$1 ${year}` },
    { regex: /^(.+)$/i, template: `$1 (${year} Guide)` }
  ];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(title)) {
      return title.replace(pattern.regex, pattern.template);
    }
  }
  
  return `${title} ${year}`;
}

/**
 * 과거 날짜 검증 (너무 오래된 정보 방지)
 */
function isContentDateValid(contentYear) {
  const currentYear = getCurrentDateInfo().year;
  const maxAgeYears = 2; // 2년 이상 된 정보는 경고
  
  return {
    isValid: (currentYear - contentYear) <= maxAgeYears,
    age: currentYear - contentYear,
    warning: (currentYear - contentYear) > 1 ? `Content is ${currentYear - contentYear} years old` : null
  };
}