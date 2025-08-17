# 🤖 Eunsense 블로그 자동화 시스템

Google Trends에서 자동으로 트렌딩 주제를 수집하고, AI가 글을 작성하여 WordPress에 자동 발행하는 완전 자동화 블로그 시스템입니다.

## 🎯 주요 기능

### ✨ 완전 자동화 워크플로우
1. **Google Trends 데이터 마이닝** - 실시간 트렌딩 키워드 자동 수집
2. **Google Sheets 연동** - 수집된 주제를 시트에 자동 추가
3. **AI 글 작성** - OpenAI, Gemini, Claude, Grok 등 멀티 AI 모델 지원
4. **SEO 최적화** - 자동 제목, 메타 설명, 태그 생성
5. **이미지 자동 삽입** - Pexels/Unsplash API로 관련 이미지 자동 추가
6. **WordPress 자동 발행** - REST API를 통한 무인 발행

### 🔄 동기화 시스템
- **로컬 ↔ Google Apps Script** 실시간 동기화
- 파일 변경 감지 및 자동 업로드
- 버전 관리 및 백업 지원

## 🚀 빠른 시작

### 1. 프로젝트 설정
```bash
# 프로젝트 클론
git clone [repository-url]
cd eunsense-automation

# 의존성 설치
npm install

# 기본 설정
npm run setup
```

### 2. Google Apps Script 설정

#### 2.1 새 프로젝트 생성
1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. 프로젝트 ID 복사 (URL에서 확인 가능)

#### 2.2 환경변수 설정
```bash
# Google Apps Script 프로젝트 ID 설정
export GAS_SCRIPT_ID="your_script_id_here"
```

#### 2.3 OAuth2 인증 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. API 및 서비스 > 사용자 인증 정보
3. OAuth 2.0 클라이언트 ID 생성 (데스크톱 애플리케이션)
4. `credentials.json` 파일을 프로젝트 루트에 저장

### 3. Google Sheets 설정

#### 3.1 스프레드시트 생성
새 Google Sheets 생성 후 다음 헤더를 A1:F1에 입력:
```
Topic | Status | PostedURL | PostedAt | Category | TagsCsv
```

#### 3.2 시트 ID 확인
스프레드시트 URL에서 ID 부분을 복사하여 Script Properties에 설정

### 4. WordPress 설정

#### 4.1 애플리케이션 비밀번호 생성
1. WordPress 관리자 > 사용자 > 프로필
2. 애플리케이션 비밀번호 > 새로 추가
3. 생성된 비밀번호 복사

### 5. Script Properties 설정

Google Apps Script 편집기에서 다음 값들을 설정:

#### 필수 설정
```javascript
// WordPress 연동
WP_BASE: "https://yoursite.com"
WP_USER: "your_username"  
WP_APP_PASS: "your_app_password"

// AI API 키 (최소 1개 필요)
OPENAI_API_KEY: "sk-..."
GEMINI_API_KEY: "..."
ANTHROPIC_API_KEY: "..."
XAI_API_KEY: "..."

// Google Sheets ID (선택사항)
SHEET_ID: "your_sheet_id"
```

#### 선택적 설정
```javascript
// AI 모델 우선순위
AI_PROVIDER_ORDER: "openai,gemini,anthropic,xai"

// 트렌드 설정
TRENDS_REGION: "KR"
TRENDS_CATEGORY: "0"

// 이미지 설정  
IMAGE_PROVIDER: "pexels"
PEXELS_API_KEY: "your_pexels_key"
SERP_API_KEY: "your_serpapi_key"
```

## 💻 사용법

### 로컬 개발 및 동기화

```bash
# 로컬 파일을 Google Apps Script에 업로드
npm run sync:push

# Google Apps Script에서 로컬로 다운로드
npm run sync:pull

# 파일 변경 감지 및 자동 동기화 시작
npm run sync:watch

# 프로젝트 정보 확인
npm run sync:info
```

### Google Apps Script 함수들

#### 기본 함수
```javascript
// 완전 자동화 실행 (트렌드 수집 + 글 발행)
fullAutomation()

// 트렌딩 주제만 수집
addTrendsToSheet()

// 기존 주제로 글 발행
main()

// 선택한 주제 테스트 발행
testPublishOneReal()
```

#### 설정 및 관리
```javascript
// 시스템 설정 초기화
setupScriptProperties()

// 자동화 트리거 설정 (매일 2회)
setupAutomationTriggers()

// 시간별 발행 트리거 설정 (3시간마다)
setupHourlyTriggers()

// 전체 시스템 테스트
testFullSystem()

// 트리거 목록 확인
listAllTriggers()

// 모든 트리거 삭제
deleteAllTriggers()
```

## 🔧 구성 옵션

### AI 모델 설정
- **OpenAI GPT**: 가장 안정적, JSON 모드 지원
- **Google Gemini**: 빠른 응답, 한국어 최적화
- **Anthropic Claude**: 고품질 장문 작성
- **xAI Grok**: 최신 트렌드 반영

### 트렌드 소스
1. **Google Trends RSS** (기본) - 무료, 지역별 트렌드
2. **SerpAPI** (폴백) - 유료, 더 정확한 데이터
3. **기본 주제** (최종 폴백) - 미리 정의된 안전한 주제

### 이미지 소스
1. **Pexels API** (기본) - 고품질 무료 이미지
2. **Unsplash** (폴백) - 다양한 이미지

## 📊 자동화 스케줄

### 기본 스케줄
- **매일 09:00**: 완전 자동화 (트렌드 수집 + 글 발행)
- **매일 18:00**: 추가 트렌드 주제 수집

### 고빈도 스케줄 (선택사항)
- **3시간마다**: 글 자동 발행 (하루 8회)

### 발행 제한
- **일일 발행 제한**: 3건 (DAILY_LIMIT)
- **트렌드 수집**: 10개 주제 (TRENDS_DAILY_LIMIT)

## 🛠️ 고급 설정

### 커스텀 프롬프트
AI 모델별 프롬프트는 `buildStructuredPrompt()` 함수에서 수정 가능:
```javascript
// 글 스타일, 길이, 구조 등 커스터마이징
function buildStructuredPrompt(topic) {
  return `
    Write a ${CUSTOM_STYLE} blog post about: ${topic}
    // 프롬프트 내용 수정
  `;
}
```

### SEO 최적화
- **자동 슬러그 생성**: 한국어 → URL 친화적 변환
- **메타 설명**: 155자 제한, 키워드 포함
- **구조화된 헤딩**: H1-H3 자동 구성
- **내부/외부 링크**: 자동 삽입

### 이미지 최적화
- **섹션별 이미지**: 각 H2/H3마다 관련 이미지 자동 삽입
- **Alt 텍스트**: SEO 최적화된 대체 텍스트
- **이미지 크기**: 1280x720 (16:9 비율)

## 🔍 모니터링 및 디버깅

### 로그 확인
```javascript
// Google Apps Script 편집기에서
// 실행 > 로그 보기

// 또는 clasp 명령어로
npm run clasp:logs
```

### 상태 확인
- **발행 상태**: Google Sheets B열에서 확인
- **에러 로그**: Apps Script 실행 로그
- **트리거 상태**: `listAllTriggers()` 함수로 확인

## 🚨 문제 해결

### 일반적인 문제

#### 1. 인증 오류
```bash
# 토큰 재생성
rm token.json
node sync.js push
```

#### 2. API 할당량 초과
- AI API 키 순환 사용 (AI_PROVIDER_ORDER 설정)
- 발행 빈도 조절 (DAILY_LIMIT 감소)

#### 3. WordPress 연결 실패
- WP_BASE URL 확인 (trailing slash 제거)
- 애플리케이션 비밀번호 재생성
- SSL 인증서 확인

#### 4. 트렌드 수집 실패
- SERP_API_KEY 설정으로 폴백 활성화
- 지역 설정 확인 (TRENDS_REGION)

### 테스트 함수
```javascript
// 단계별 테스트
testFullSystem()        // 전체 시스템
debugSheets()          // 시트 연결
testPublishOneReal()   // 실제 발행 테스트
```

## 📁 파일 구조

```
eunsense-automation/
├── src/
│   └── main.js          # 메인 Google Apps Script 코드
├── sync.js              # 로컬 ↔ GAS 동기화 도구
├── package.json         # Node.js 의존성 및 스크립트
├── credentials.json     # Google OAuth2 인증 정보
├── token.json          # 인증 토큰 (자동 생성)
├── .clasp.json         # clasp 설정 (선택사항)
└── README.md           # 이 파일
```

## 🔒 보안 주의사항

- **API 키**: Script Properties에만 저장, 코드에 하드코딩 금지
- **인증 파일**: credentials.json과 token.json은 .gitignore에 추가
- **WordPress 비밀번호**: 애플리케이션 비밀번호만 사용, 실제 비밀번호 사용 금지
- **권한**: 최소 필요 권한만 부여

## 📄 라이선스

MIT License - 상업적 사용 가능

## 🤝 기여하기

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch  
5. Create Pull Request

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 모든 API 키가 올바르게 설정되었는지
2. Google Sheets 권한이 있는지
3. WordPress REST API가 활성화되었는지
4. 할당량이 남아있는지

---

**Happy Automated Blogging! 🎉**