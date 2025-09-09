#!/usr/bin/env node

/**
 * 크로스 플랫폼 Google Apps Script 동기화 도구
 * 개인/회사 랩탑 상관없이 자동으로 경로 설정
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLASP_CONFIG_FILE = '.clasp.json';
const SCRIPT_ID = '1eNyGQAjddY49gumdxyqFOHQ6Wk3oj5OdgYfI3gNEQ9cav3JvVBwAxHpI';

/**
 * .clasp.json 파일을 현재 환경에 맞게 설정
 */
function setupClaspConfig() {
  const currentDir = process.cwd();
  const srcDir = path.join(currentDir, 'src');
  
  // src 디렉토리가 존재하는지 확인
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src 디렉토리를 찾을 수 없습니다.');
    process.exit(1);
  }

  const claspConfig = {
    scriptId: SCRIPT_ID,
    rootDir: './src'  // 상대 경로 사용
  };

  fs.writeFileSync(CLASP_CONFIG_FILE, JSON.stringify(claspConfig, null, 2));
  console.log(`✅ .clasp.json 설정 완료 (rootDir: ./src)`);
  console.log(`📁 현재 작업 디렉토리: ${currentDir}`);
}

/**
 * clasp 명령어 실행
 */
function runClaspCommand(command) {
  try {
    console.log(`🚀 실행 중: clasp ${command}`);
    const result = execSync(`clasp ${command}`, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log(`✅ 완료: clasp ${command}`);
    return result;
  } catch (error) {
    console.error(`❌ 실패: clasp ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * 현재 환경 정보 출력
 */
function showEnvironmentInfo() {
  console.log('\n📊 환경 정보:');
  console.log(`  운영체제: ${process.platform}`);
  console.log(`  사용자: ${process.env.USER || process.env.USERNAME}`);
  console.log(`  홈 디렉토리: ${process.env.HOME || process.env.USERPROFILE}`);
  console.log(`  작업 디렉토리: ${process.cwd()}`);
  console.log('');
}

/**
 * 메인 함수
 */
function main() {
  const command = process.argv[2];
  
  console.log('🔄 유선스 자동화 동기화 도구');
  showEnvironmentInfo();
  
  // 항상 .clasp.json 설정을 확인하고 업데이트
  setupClaspConfig();
  
  switch (command) {
    case 'push':
      runClaspCommand('push');
      break;
      
    case 'pull':
      runClaspCommand('pull');
      break;
      
    case 'watch':
      console.log('👁️  파일 변경 감지 모드 시작...');
      runClaspCommand('push --watch');
      break;
      
    case 'info':
      runClaspCommand('list');
      runClaspCommand('status');
      break;
      
    case 'open':
      runClaspCommand('open');
      break;
      
    case 'logs':
      runClaspCommand('logs');
      break;
      
    default:
      console.log('\n📖 사용법:');
      console.log('  npm run sync:push    # 로컬 → Google Apps Script');
      console.log('  npm run sync:pull    # Google Apps Script → 로컬');
      console.log('  npm run sync:watch   # 파일 변경 감지 및 자동 업로드');
      console.log('  npm run sync:info    # 프로젝트 정보 확인');
      console.log('  npm run sync:open    # Google Apps Script 편집기 열기');
      console.log('  npm run sync:logs    # 실행 로그 확인');
      console.log('');
      console.log('🔧 또는 직접 명령어:');
      console.log('  node sync.js push');
      console.log('  node sync.js pull');
      console.log('  node sync.js watch');
      break;
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { setupClaspConfig, runClaspCommand };