# 🚀 빠른 설정 가이드

## 1. 기본 설정

### 의존성 설치
```bash
npm install
```

### Google Apps Script ID 설정
1. `.env` 파일을 열어서
2. `your_script_id_here` 부분을 실제 Script ID로 변경:

```env
GAS_SCRIPT_ID=1BxKp9oJ8mE3nF2hG4qR5sT6uV7wX8yZ9A0bC1dE2fG3hI4j
```

## 2. Google Apps Script ID 찾기

1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 열기
3. URL에서 ID 부분 복사:
   ```
   https://script.google.com/home/projects/여기가_스크립트_ID/edit
   ```

## 3. Google OAuth2 인증 설정

### 3.1 Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. API 및 서비스 > 라이브러리
4. "Google Apps Script API" 검색 후 사용 설정
5. API 및 서비스 > 사용자 인증 정보
6. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"
7. 애플리케이션 유형: "데스크톱 애플리케이션"
8. 이름: "Eunsense Blog Automation"
9. 생성 후 JSON 파일 다운로드

### 3.2 인증 파일 설정
다운로드한 JSON 파일을 `credentials.json`으로 저장:
```bash
# 다운로드한 파일을 프로젝트 폴더에 복사
cp ~/Downloads/client_secret_*.json ./credentials.json
```

## 4. 첫 동기화 실행

```bash
# 로컬 파일을 Google Apps Script에 업로드
npm run sync:push
```

처음 실행 시 브라우저가 열리며 Google 계정 인증이 필요합니다.

## 5. Google Apps Script 설정

브라우저에서 Google Apps Script 편집기로 이동 후 다음 함수들을 실행:

```javascript
// 1. 기본 설정 초기화
setupScriptProperties()

// 2. 전체 시스템 테스트
testFullSystem()

// 3. 자동화 트리거 설정
setupAutomationTriggers()
```

## 6. Script Properties 설정

Google Apps Script 편집기에서:
1. 설정(⚙️) 클릭
2. "스크립트 속성" 탭
3. 다음 값들 추가:

### 필수 설정
```
WP_BASE = https://yoursite.com
WP_USER = your_username
WP_APP_PASS = your_app_password
```

### AI API 키 (최소 1개 필요)
```
OPENAI_API_KEY = sk-...
GEMINI_API_KEY = ...
ANTHROPIC_API_KEY = ...
XAI_API_KEY = ...
```

## 7. Google Sheets 설정

1. 새 Google Sheets 생성
2. A1:F1에 헤더 입력:
   ```
   Topic | Status | PostedURL | PostedAt | Category | TagsCsv
   ```
3. 시트 ID를 Script Properties에 추가:
   ```
   SHEET_ID = your_sheet_id
   ```

## 8. 자동 동기화 시작

```bash
# 파일 변경 감지 및 자동 업로드
npm run sync:watch
```

## ✅ 설정 완료 확인

모든 설정이 완료되면:
1. Google Apps Script에서 `testFullSystem()` 실행
2. "전체 시스템 테스트 완료!" 메시지 확인
3. `fullAutomation()` 실행하여 첫 글 발행 테스트

## 🎉 완료!

이제 매일 자동으로 트렌딩 주제를 수집하고 글을 발행하는 시스템이 준비되었습니다!