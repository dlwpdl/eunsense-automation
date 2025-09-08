/**
 * 📊 모니터링 대시보드 시스템
 * 실행 통계, 성능 메트릭, 시스템 상태를 Google Sheets에 실시간 추적
 */

const MONITORING_SHEET_TABS = {
  METRICS: 'Metrics',
  ERRORS: 'Errors', 
  PERFORMANCE: 'Performance',
  AI_USAGE: 'AI_Usage',
  CACHE_STATS: 'Cache_Stats'
};

/**
 * 메트릭 추적 클래스
 */
class MetricsTracker {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5 * 60 * 1000, // 5분
      retentionDays: config.retentionDays || 30
    };
    
    this.metrics = [];
    this.startTime = Date.now();
  }
  
  /**
   * 메트릭 기록
   */
  track(operation, duration, success, metadata = {}) {
    if (!this.config.enabled) return;
    
    const metric = {
      timestamp: new Date().toISOString(),
      operation: operation,
      duration: duration,
      success: success,
      environment: getEnhancedConfig().ENVIRONMENT,
      metadata: metadata
    };
    
    this.metrics.push(metric);
    
    // 배치가 찰 경우 즉시 플러시
    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }
  
  /**
   * 누적된 메트릭을 Google Sheets에 저장
   */
  flush() {
    if (!this.config.enabled || this.metrics.length === 0) return;
    
    try {
      const config = getEnhancedConfig();
      if (!config.MONITORING_SHEET_ID) {
        Logger.log("⚠️ MONITORING_SHEET_ID가 설정되지 않음. 메트릭 저장 건너뛰기");
        return;
      }
      
      const ss = SpreadsheetApp.openById(config.MONITORING_SHEET_ID);
      const metricsSheet = this._getOrCreateSheet(ss, MONITORING_SHEET_TABS.METRICS, [
        'Timestamp', 'Operation', 'Duration(ms)', 'Success', 'Environment', 'Metadata'
      ]);
      
      // 메트릭을 행 데이터로 변환
      const rows = this.metrics.map(metric => [
        metric.timestamp,
        metric.operation,
        metric.duration,
        metric.success,
        metric.environment,
        JSON.stringify(metric.metadata)
      ]);
      
      // 시트에 추가
      if (rows.length > 0) {
        metricsSheet.getRange(metricsSheet.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
        Logger.log(`📊 메트릭 ${rows.length}개 기록됨`);
      }
      
      // 메트릭 버퍼 클리어
      this.metrics = [];
      
    } catch (error) {
      Logger.log(`❌ 메트릭 플러시 실패: ${error.message}`);
      // 실패해도 메트릭은 유지 (다음 시도에서 재시도)
    }
  }
  
  /**
   * 성능 통계 생성
   */
  generatePerformanceReport() {
    try {
      const config = getEnhancedConfig();
      if (!config.MONITORING_SHEET_ID) return;
      
      const ss = SpreadsheetApp.openById(config.MONITORING_SHEET_ID);
      const metricsSheet = ss.getSheetByName(MONITORING_SHEET_TABS.METRICS);
      const performanceSheet = this._getOrCreateSheet(ss, MONITORING_SHEET_TABS.PERFORMANCE, [
        'Date', 'Operation', 'Avg_Duration', 'Success_Rate', 'Total_Executions', 'Failures'
      ]);
      
      if (!metricsSheet || metricsSheet.getLastRow() <= 1) {
        Logger.log("📊 메트릭 데이터 부족, 성능 리포트 건너뛰기");
        return;
      }
      
      // 최근 24시간 데이터 분석
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const data = metricsSheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      // 데이터 필터링 및 그룹화
      const recentData = rows.filter(row => {
        const timestamp = new Date(row[0]);
        return timestamp > oneDayAgo;
      });
      
      const grouped = {};
      recentData.forEach(row => {
        const operation = row[1];
        const duration = row[2];
        const success = row[3];
        
        if (!grouped[operation]) {
          grouped[operation] = { 
            durations: [], 
            successes: 0, 
            failures: 0, 
            total: 0 
          };
        }
        
        grouped[operation].durations.push(duration);
        grouped[operation].total++;
        
        if (success) {
          grouped[operation].successes++;
        } else {
          grouped[operation].failures++;
        }
      });
      
      // 성능 통계 계산
      const today = new Date().toISOString().split('T')[0];
      const performanceRows = Object.entries(grouped).map(([operation, stats]) => {
        const avgDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length;
        const successRate = (stats.successes / stats.total) * 100;
        
        return [
          today,
          operation,
          Math.round(avgDuration),
          Math.round(successRate * 100) / 100,
          stats.total,
          stats.failures
        ];
      });
      
      // 기존 오늘 데이터 삭제 후 새 데이터 추가
      this._replaceDataForDate(performanceSheet, today, performanceRows);
      
      Logger.log(`📈 성능 리포트 업데이트: ${performanceRows.length}개 연산 분석`);
      
    } catch (error) {
      Logger.log(`❌ 성능 리포트 생성 실패: ${error.message}`);
    }
  }
  
  /**
   * AI 사용량 통계
   */
  generateAIUsageReport() {
    try {
      const config = getEnhancedConfig();
      if (!config.MONITORING_SHEET_ID) return;
      
      const ss = SpreadsheetApp.openById(config.MONITORING_SHEET_ID);
      const aiSheet = this._getOrCreateSheet(ss, MONITORING_SHEET_TABS.AI_USAGE, [
        'Date', 'AI_Provider', 'Model', 'Requests', 'Successes', 'Avg_Duration', 'Token_Usage'
      ]);
      
      // AI 호출 메트릭만 필터링
      const metricsSheet = ss.getSheetByName(MONITORING_SHEET_TABS.METRICS);
      if (!metricsSheet || metricsSheet.getLastRow() <= 1) return;
      
      const data = metricsSheet.getDataRange().getValues();
      const rows = data.slice(1);
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const aiData = rows.filter(row => {
        const timestamp = new Date(row[0]);
        const operation = row[1];
        return timestamp > oneDayAgo && operation.includes('AI');
      });
      
      // AI 제공업체별 통계
      const aiStats = {};
      aiData.forEach(row => {
        const metadata = JSON.parse(row[5] || '{}');
        const provider = metadata.aiProvider || 'unknown';
        const model = metadata.aiModel || 'unknown';
        const duration = row[2];
        const success = row[3];
        const tokens = metadata.tokenUsage || 0;
        
        const key = `${provider}_${model}`;
        if (!aiStats[key]) {
          aiStats[key] = {
            provider,
            model,
            requests: 0,
            successes: 0,
            durations: [],
            tokens: 0
          };
        }
        
        aiStats[key].requests++;
        aiStats[key].durations.push(duration);
        aiStats[key].tokens += tokens;
        
        if (success) {
          aiStats[key].successes++;
        }
      });
      
      // AI 통계 행 생성
      const today = new Date().toISOString().split('T')[0];
      const aiRows = Object.values(aiStats).map(stats => {
        const avgDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length;
        
        return [
          today,
          stats.provider,
          stats.model,
          stats.requests,
          stats.successes,
          Math.round(avgDuration),
          stats.tokens
        ];
      });
      
      this._replaceDataForDate(aiSheet, today, aiRows);
      Logger.log(`🤖 AI 사용량 리포트 업데이트: ${aiRows.length}개 AI 모델`);
      
    } catch (error) {
      Logger.log(`❌ AI 사용량 리포트 실패: ${error.message}`);
    }
  }
  
  /**
   * 캐시 통계 리포트
   */
  generateCacheReport() {
    try {
      const config = getEnhancedConfig();
      if (!config.MONITORING_SHEET_ID) return;
      
      const cacheStats = getCacheStats();
      if (!cacheStats) return;
      
      const ss = SpreadsheetApp.openById(config.MONITORING_SHEET_ID);
      const cacheSheet = this._getOrCreateSheet(ss, MONITORING_SHEET_TABS.CACHE_STATS, [
        'Date', 'Category', 'Entries', 'Size_MB', 'Hit_Rate', 'Expired_Entries'
      ]);
      
      const today = new Date().toISOString().split('T')[0];
      const cacheRows = Object.entries(cacheStats.byCategory).map(([category, count]) => [
        today,
        category,
        count,
        Math.round((cacheStats.totalSizeMB / cacheStats.totalEntries * count) * 100) / 100,
        'N/A', // Hit rate는 별도 추적 필요
        category === 'EXPIRED' ? count : 0
      ]);
      
      this._replaceDataForDate(cacheSheet, today, cacheRows);
      Logger.log(`💾 캐시 통계 리포트 업데이트: ${cacheRows.length}개 카테고리`);
      
    } catch (error) {
      Logger.log(`❌ 캐시 리포트 실패: ${error.message}`);
    }
  }
  
  // Private methods
  _getOrCreateSheet(spreadsheet, name, headers) {
    let sheet = spreadsheet.getSheetByName(name);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(name);
      if (headers) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      }
    }
    
    return sheet;
  }
  
  _replaceDataForDate(sheet, date, newRows) {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // 해당 날짜 데이터 제거
    const filteredRows = rows.filter(row => row[0] !== date);
    
    // 새 데이터 추가
    const allRows = [headers, ...filteredRows, ...newRows];
    
    // 시트 클리어 후 전체 데이터 재설정
    sheet.clear();
    if (allRows.length > 0) {
      sheet.getRange(1, 1, allRows.length, allRows[0].length).setValues(allRows);
      sheet.getRange(1, 1, 1, allRows[0].length).setFontWeight('bold');
    }
  }
}

// 전역 메트릭 트래커
const metricsTracker = new MetricsTracker();

/**
 * 실행 통계 추적 래퍼 함수
 */
function trackExecutionMetrics(operation, fn, metadata = {}) {
  const startTime = Date.now();
  
  try {
    const result = fn();
    const duration = Date.now() - startTime;
    
    metricsTracker.track(operation, duration, true, metadata);
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    metricsTracker.track(operation, duration, false, { 
      ...metadata, 
      error: error.message 
    });
    
    throw error;
  }
}

/**
 * Google Apps Script에서 직접 호출 가능한 함수들
 */
function generateDailyReports() {
  Logger.log("📊 일일 리포트 생성 시작");
  
  try {
    // 누적된 메트릭 플러시
    metricsTracker.flush();
    
    // 각종 리포트 생성
    metricsTracker.generatePerformanceReport();
    metricsTracker.generateAIUsageReport();
    metricsTracker.generateCacheReport();
    
    Logger.log("✅ 일일 리포트 생성 완료");
    
  } catch (error) {
    Logger.log(`❌ 일일 리포트 생성 실패: ${error.message}`);
  }
}

function initializeMonitoringSheets() {
  Logger.log("🔧 모니터링 시트 초기화");
  
  try {
    const config = getEnhancedConfig();
    if (!config.MONITORING_SHEET_ID) {
      Logger.log("❌ MONITORING_SHEET_ID 설정 필요");
      return;
    }
    
    const ss = SpreadsheetApp.openById(config.MONITORING_SHEET_ID);
    
    // 각 탭 초기화
    Object.values(MONITORING_SHEET_TABS).forEach(tabName => {
      let headers = [];
      
      switch (tabName) {
        case MONITORING_SHEET_TABS.METRICS:
          headers = ['Timestamp', 'Operation', 'Duration(ms)', 'Success', 'Environment', 'Metadata'];
          break;
        case MONITORING_SHEET_TABS.PERFORMANCE:
          headers = ['Date', 'Operation', 'Avg_Duration', 'Success_Rate', 'Total_Executions', 'Failures'];
          break;
        case MONITORING_SHEET_TABS.AI_USAGE:
          headers = ['Date', 'AI_Provider', 'Model', 'Requests', 'Successes', 'Avg_Duration', 'Token_Usage'];
          break;
        case MONITORING_SHEET_TABS.CACHE_STATS:
          headers = ['Date', 'Category', 'Entries', 'Size_MB', 'Hit_Rate', 'Expired_Entries'];
          break;
        case MONITORING_SHEET_TABS.ERRORS:
          headers = ['Timestamp', 'Error_Type', 'Severity', 'Message', 'Context'];
          break;
      }
      
      metricsTracker._getOrCreateSheet(ss, tabName, headers);
      Logger.log(`✅ ${tabName} 탭 초기화 완료`);
    });
    
    Logger.log("✅ 모든 모니터링 시트 초기화 완료");
    
  } catch (error) {
    Logger.log(`❌ 모니터링 시트 초기화 실패: ${error.message}`);
  }
}

function viewMonitoringDashboard() {
  Logger.log("📊 모니터링 대시보드 정보");
  
  const config = getEnhancedConfig();
  if (!config.MONITORING_SHEET_ID) {
    Logger.log("❌ MONITORING_SHEET_ID가 설정되지 않았습니다.");
    Logger.log("설정 방법:");
    Logger.log("1. Google Sheets에서 새 스프레드시트 생성");
    Logger.log("2. 스프레드시트 URL에서 ID 복사");
    Logger.log("3. Script Properties에 MONITORING_SHEET_ID 설정");
    return;
  }
  
  const dashboardUrl = `https://docs.google.com/spreadsheets/d/${config.MONITORING_SHEET_ID}`;
  Logger.log(`📊 모니터링 대시보드: ${dashboardUrl}`);
  
  try {
    const ss = SpreadsheetApp.openById(config.MONITORING_SHEET_ID);
    const sheets = ss.getSheets().map(sheet => sheet.getName());
    
    Logger.log("📋 사용 가능한 탭:");
    sheets.forEach(sheetName => {
      Logger.log(`  - ${sheetName}`);
    });
    
    // 최근 메트릭 요약
    const metricsSheet = ss.getSheetByName(MONITORING_SHEET_TABS.METRICS);
    if (metricsSheet && metricsSheet.getLastRow() > 1) {
      const lastRow = metricsSheet.getLastRow();
      const recentData = metricsSheet.getRange(Math.max(2, lastRow - 4), 1, Math.min(5, lastRow - 1), 6).getValues();
      
      Logger.log("📈 최근 메트릭 (최대 5개):");
      recentData.forEach(row => {
        Logger.log(`  ${row[0]} | ${row[1]} | ${row[2]}ms | ${row[3] ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    Logger.log(`❌ 대시보드 조회 실패: ${error.message}`);
  }
}

/**
 * 자동 모니터링 트리거 설정
 */
function setupMonitoringTriggers() {
  Logger.log("⏰ 모니터링 트리거 설정");
  
  // 기존 모니터링 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'generateDailyReports') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 매일 자정에 리포트 생성
  ScriptApp.newTrigger('generateDailyReports')
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .create();
    
  Logger.log("✅ 일일 리포트 트리거 설정 완료 (매일 자정)");
}

// 자동으로 메트릭 플러시 (주기적)
function autoFlushMetrics() {
  metricsTracker.flush();
}