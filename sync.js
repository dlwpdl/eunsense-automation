#!/usr/bin/env node

/**
 * 로컬 파일 ↔ Google Apps Script 동기화 도구
 * 
 * 기능:
 * 1. 로컬 src/main.js → Google Apps Script 자동 업로드
 * 2. 파일 변경 감지 후 자동 푸시
 * 3. Google Apps Script에서 변경사항 가져오기
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { google } = require('googleapis');
const readline = require('readline');

// .env 파일 로드
require('dotenv').config();

// 설정
const CONFIG = {
  // Google Apps Script 프로젝트 ID (Apps Script URL에서 확인)
  SCRIPT_ID: process.env.GAS_SCRIPT_ID || '',
  
  // 로컬 파일 경로
  LOCAL_FILES: {
    'manifest': './appsscript.json',
    'main': './src/main.js',
    'config': './src/shared/config.js',
    'wordpress-client': './src/shared/wordpress-client.js',
    'blog-main': './src/blog-automation/main.js',
    'ai-service': './src/blog-automation/ai-service.js',
    'trends-service': './src/blog-automation/trends-service.js',
    'image-service': './src/blog-automation/image-service.js',
    'seo-utils': './src/blog-automation/seo-utils.js'
  },
  
  // Google Apps Script 파일명 매핑
  GAS_FILES: {
    'manifest': 'appsscript',
    'main': 'Code',
    'config': 'Config',
    'wordpress-client': 'WordPressClient',
    'blog-main': 'BlogAutomation',
    'ai-service': 'AIService',
    'trends-service': 'TrendsService',
    'image-service': 'ImageService',
    'seo-utils': 'SEOUtils'
  },
  
  // 인증 파일 경로
  CREDENTIALS_PATH: './credentials.json',
  TOKEN_PATH: './token.json',
  
  // OAuth2 스코프
  SCOPES: ['https://www.googleapis.com/auth/script.projects']
};

class GASSync {
  constructor() {
    this.auth = null;
    this.script = null;
  }

  /**
   * 초기화 및 인증
   */
  async initialize() {
    try {
      console.log('🔐 Google Apps Script 인증 중...');
      this.auth = await this.authorize();
      this.script = google.script({ version: 'v1', auth: this.auth });
      console.log('✅ 인증 완료');
      return true;
    } catch (error) {
      console.error('❌ 초기화 실패:', error.message);
      return false;
    }
  }

  /**
   * Google OAuth2 인증
   */
  async authorize() {
    const credentials = JSON.parse(fs.readFileSync(CONFIG.CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // 기존 토큰 확인
    if (fs.existsSync(CONFIG.TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(CONFIG.TOKEN_PATH));
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    }

    // 새 토큰 획득
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: CONFIG.SCOPES,
    });

    console.log('브라우저에서 다음 URL로 인증하세요:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise((resolve) => {
      rl.question('인증 코드를 입력하세요: ', (code) => {
        rl.close();
        resolve(code);
      });
    });

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // 토큰 저장
    fs.writeFileSync(CONFIG.TOKEN_PATH, JSON.stringify(tokens));
    console.log('토큰이 저장되었습니다:', CONFIG.TOKEN_PATH);

    return oAuth2Client;
  }

  /**
   * 로컬 파일을 Google Apps Script에 업로드
   */
  async pushToGAS(fileKey) {
    try {
      const localPath = CONFIG.LOCAL_FILES[fileKey];
      const gasFileName = CONFIG.GAS_FILES[fileKey];

      if (!fs.existsSync(localPath)) {
        console.log(`⚠️  파일이 존재하지 않음: ${localPath}`);
        return false;
      }

      const content = fs.readFileSync(localPath, 'utf8');
      
      // 현재 프로젝트 정보 가져오기
      const project = await this.script.projects.get({
        scriptId: CONFIG.SCRIPT_ID
      });

      const files = project.data.files || [];
      const existingFile = files.find(f => f.name === gasFileName);

      if (existingFile) {
        // 기존 파일 업데이트
        existingFile.source = content;
      } else {
        // 새 파일 추가
        const fileType = gasFileName === 'appsscript' ? 'JSON' : 'SERVER_JS';
        files.push({
          name: gasFileName,
          type: fileType,
          source: content
        });
      }

      // 프로젝트 업데이트
      await this.script.projects.updateContent({
        scriptId: CONFIG.SCRIPT_ID,
        requestBody: {
          files: files
        }
      });

      console.log(`📤 업로드 완료: ${localPath} → ${gasFileName}`);
      return true;
    } catch (error) {
      console.error(`❌ 업로드 실패 (${fileKey}):`, error.message);
      return false;
    }
  }

  /**
   * Google Apps Script에서 로컬로 다운로드
   */
  async pullFromGAS(fileKey) {
    try {
      const localPath = CONFIG.LOCAL_FILES[fileKey];
      const gasFileName = CONFIG.GAS_FILES[fileKey];

      const project = await this.script.projects.get({
        scriptId: CONFIG.SCRIPT_ID
      });

      const files = project.data.files || [];
      const gasFile = files.find(f => f.name === gasFileName);

      if (!gasFile) {
        console.log(`⚠️  GAS 파일이 존재하지 않음: ${gasFileName}`);
        return false;
      }

      // 로컬 파일에 저장
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(localPath, gasFile.source);
      console.log(`📥 다운로드 완료: ${gasFileName} → ${localPath}`);
      return true;
    } catch (error) {
      console.error(`❌ 다운로드 실패 (${fileKey}):`, error.message);
      return false;
    }
  }

  /**
   * 모든 파일 업로드
   */
  async pushAll() {
    try {
      console.log('📤 모든 파일 업로드 중...');
      
      // 현재 프로젝트 정보 가져오기
      const project = await this.script.projects.get({
        scriptId: CONFIG.SCRIPT_ID
      });

      const files = [];
      let successCount = 0;

      // 모든 로컬 파일을 읽어서 files 배열에 추가
      for (const [fileKey, localPath] of Object.entries(CONFIG.LOCAL_FILES)) {
        try {
          if (!fs.existsSync(localPath)) {
            console.log(`⚠️  파일이 존재하지 않음: ${localPath}`);
            continue;
          }

          const content = fs.readFileSync(localPath, 'utf8');
          const gasFileName = CONFIG.GAS_FILES[fileKey];
          const fileType = gasFileName === 'appsscript' ? 'JSON' : 'SERVER_JS';

          files.push({
            name: gasFileName,
            type: fileType,
            source: content
          });

          successCount++;
          console.log(`📄 준비 완료: ${localPath} → ${gasFileName}`);
        } catch (error) {
          console.error(`❌ 파일 읽기 실패 (${fileKey}):`, error.message);
        }
      }

      // 모든 파일을 한 번에 업로드
      await this.script.projects.updateContent({
        scriptId: CONFIG.SCRIPT_ID,
        requestBody: {
          files: files
        }
      });

      console.log(`✅ ${successCount}/${Object.keys(CONFIG.LOCAL_FILES).length} 파일 업로드 완료`);
    } catch (error) {
      console.error('❌ 전체 업로드 실패:', error.message);
    }
  }

  /**
   * 모든 파일 다운로드
   */
  async pullAll() {
    console.log('📥 모든 파일 다운로드 중...');
    let successCount = 0;
    
    for (const fileKey of Object.keys(CONFIG.LOCAL_FILES)) {
      if (await this.pullFromGAS(fileKey)) {
        successCount++;
      }
    }
    
    console.log(`✅ ${successCount}/${Object.keys(CONFIG.LOCAL_FILES).length} 파일 다운로드 완료`);
  }

  /**
   * 파일 변경 감지 및 자동 업로드
   */
  startWatching() {
    const watchPaths = Object.values(CONFIG.LOCAL_FILES);
    console.log('👀 파일 변경 감지 시작:', watchPaths);

    const watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath) => {
      console.log(`📝 파일 변경 감지: ${filePath}`);
      
      // 어떤 파일이 변경되었는지 찾기
      const fileKey = Object.keys(CONFIG.LOCAL_FILES).find(
        key => CONFIG.LOCAL_FILES[key] === filePath
      );

      if (fileKey) {
        // 딜레이 후 업로드 (연속 변경 방지)
        setTimeout(async () => {
          await this.pushToGAS(fileKey);
        }, 1000);
      }
    });

    watcher.on('error', error => {
      console.error('❌ 파일 감시 오류:', error);
    });

    console.log('🚀 자동 동기화 활성화! Ctrl+C로 종료하세요.');
  }

  /**
   * 프로젝트 정보 표시
   */
  async showProjectInfo() {
    try {
      const project = await this.script.projects.get({
        scriptId: CONFIG.SCRIPT_ID
      });

      console.log('\n📋 Google Apps Script 프로젝트 정보:');
      console.log(`- 제목: ${project.data.title}`);
      console.log(`- Script ID: ${CONFIG.SCRIPT_ID}`);
      console.log(`- 파일 수: ${project.data.files?.length || 0}`);
      console.log('- 파일 목록:');
      
      project.data.files?.forEach(file => {
        console.log(`  • ${file.name} (${file.type})`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ 프로젝트 정보 가져오기 실패:', error.message);
    }
  }
}

// CLI 처리
async function main() {
  const sync = new GASSync();
  
  // 설정 확인
  if (!CONFIG.SCRIPT_ID) {
    console.error('❌ GAS_SCRIPT_ID 환경변수를 설정하세요.');
    console.log('예: export GAS_SCRIPT_ID="your_script_id_here"');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.CREDENTIALS_PATH)) {
    console.error(`❌ 인증 파일이 없습니다: ${CONFIG.CREDENTIALS_PATH}`);
    console.log('Google Cloud Console에서 OAuth2 인증정보를 다운로드하세요.');
    process.exit(1);
  }

  // 초기화
  const initialized = await sync.initialize();
  if (!initialized) {
    process.exit(1);
  }

  // 명령어 처리
  const command = process.argv[2];
  
  switch (command) {
    case 'push':
      await sync.pushAll();
      break;
      
    case 'pull':
      await sync.pullAll();
      break;
      
    case 'watch':
      await sync.startWatching();
      break;
      
    case 'info':
      await sync.showProjectInfo();
      break;
      
    default:
      console.log(`
🔄 Google Apps Script 동기화 도구

사용법:
  node sync.js push    - 로컬 파일을 GAS에 업로드
  node sync.js pull    - GAS 파일을 로컬에 다운로드  
  node sync.js watch   - 파일 변경 감지 및 자동 업로드
  node sync.js info    - 프로젝트 정보 표시

설정:
  export GAS_SCRIPT_ID="your_script_id_here"
  
인증:
  credentials.json 파일이 필요합니다.
      `);
  }
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = GASSync;