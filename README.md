# 🚀 WordPress 자동화 시스템

통합 WordPress 자동화 및 관리 시스템입니다. Google Trends에서 트렌딩 키워드를 수집하여 AI가 글을 작성하고 WordPress에 자동 발행하는 완전 자동화 솔루션입니다.

## 🎯 주요 기능

### ✨ 완전 자동화 워크플로우
1. **Google Trends 데이터 마이닝** - 실시간 트렌딩 키워드 자동 수집
2. **Google Sheets 연동** - 수집된 주제를 시트에 자동 추가 및 상태 관리
3. **AI 글 작성** - OpenAI GPT, Google Gemini, Claude, xAI Grok 등 멀티 AI 모델 지원
4. **SEO 최적화** - 자동 제목, 메타 설명, 태그, 슬러그 생성
5. **이미지 자동 삽입** - Pexels/Google Images API로 관련 이미지 자동 추가
6. **WordPress 자동 발행** - REST API를 통한 무인 발행

### 🔄 동기화 시스템
- **로컬 ↔ Google Apps Script** 실시간 동기화
- 파일 변경 감지 및 자동 업로드
- 버전 관리 및 백업 지원

### 🧪 통합 테스트 시스템
- **AllTests.js** - 모든 테스트를 한 곳에서 실행
- **개별 테스트** - 각 기능별 독립적 테스트 가능
- **성능 모니터링** - 실행 시간 및 성공률 추적

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

### 5. Google Apps Script Properties 설정

Google Apps Script 편집기에서 **설정 > Script Properties** 탭을 클릭하여 다음 값들을 설정하세요:

#### 📋 필수 설정 (반드시 입력)
| 키 | 값 | 설명 |
|---|---|---|
| `WP_BASE` | `https://yoursite.com` | WordPress 사이트 URL (끝에 / 없이) |
| `WP_USER` | `your_username` | WordPress 사용자명 |
| `WP_APP_PASS` | `xxxx xxxx xxxx xxxx` | WordPress 애플리케이션 비밀번호 |

#### 🤖 AI 설정 (최소 1개 필요)
| 키 | 값 | 설명 |
|---|---|---|
| `AI_PROVIDER` | `openai` | 기본 AI 모델 (openai/gemini/anthropic/xai) |
| `AI_API_KEY` | `sk-...` | 선택한 AI 모델의 API 키 |
| `AI_MODEL` | `gpt-4o` | 사용할 AI 모델명 |

**지원하는 AI 모델:**
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`
- **Google Gemini**: `gemini-pro`, `gemini-pro-vision`
- **Anthropic Claude**: `claude-3-sonnet`, `claude-3-haiku`
- **xAI Grok**: `grok-beta`

#### 🖼️ 이미지 설정 (선택사항)
| 키 | 값 | 설명 |
|---|---|---|
| `IMAGE_PROVIDER` | `pexels` | 이미지 소스 (pexels/google) |
| `PEXELS_API_KEY` | `your_pexels_key` | Pexels API 키 |
| `GOOGLE_API_KEY` | `your_google_key` | Google Custom Search API 키 |
| `GOOGLE_SEARCH_ENGINE_ID` | `your_engine_id` | Google 검색 엔진 ID |

#### 📈 트렌드 설정 (선택사항)
| 키 | 값 | 설명 |
|---|---|---|
| `TRENDS_REGION` | `KR` | 트렌드 지역 (US/KR/JP 등) |
| `TRENDS_CATEGORY` | `0` | 트렌드 카테고리 (0=전체) |
| `SERP_API_KEY` | `your_serpapi_key` | SerpAPI 키 (폴백용) |

#### 📊 Google Sheets 연동 (선택사항)
| 키 | 값 | 설명 |
|---|---|---|
| `SHEET_ID` | `your_sheet_id` | Google Sheets ID |

### ⚡ 자동 설정 스크립트 실행

Google Apps Script 편집기에서 다음 함수를 실행하여 기본값을 자동 설정할 수 있습니다:

```javascript
// 실행 > 함수 선택 > setupScriptProperties 선택 후 실행
setupScriptProperties()
```

이 함수는 기본값들을 설정하고 필수 설정 가이드를 로그에 출력합니다.

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

#### 🚀 자동화 실행 함수
```javascript
// 블로그 자동화 실행 (트렌드 수집 + AI 글 작성 + 발행)
runBlogAutomation()

// 트렌딩 주제만 수집
collectTrends()

// 기존 주제로 포스트 발행
publishPosts()
```

#### ⚙️ 설정 및 관리 함수
```javascript
// 시스템 설정 초기화
setupScriptProperties()

// 설정 검증
validateConfig()

// 자동화 트리거 설정 (매일 2회)
setupAutomationTriggers()

// 트리거 목록 확인
listAllTriggers()

// 모든 트리거 삭제
deleteAllTriggers()
```

#### 🧪 테스트 함수들
```javascript
// 📋 전체 테스트 실행
runAllTests()           // 모든 테스트 실행 (약 5-10분)
runQuickTests()         // 핵심 테스트만 (약 3분)
showTestGuide()         // 테스트 사용법 출력

// 🎯 개별 테스트 함수
testConfigOnly()        // 설정 검증
testTrendsOnly()        // 트렌드 수집 테스트
testAIOnly()            // AI 글 생성 테스트
testImagesOnly()        // 이미지 검색 테스트
testWordPressOnly()     // WordPress 연결 테스트
testIntegrationOnly()   // 통합 워크플로우 테스트
```

#### 🛠️ 유틸리티 함수
```javascript
// WordPress 대시보드 정보 조회
getWordPressDashboard()

// Google Sheets 데이터 디버깅
debugSheetData()

// 에러 로그 확인
viewErrorLogs()
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
├── 📋 핵심 파일
│   ├── Code.js              # 메인 진입점
│   ├── BlogAutomation.js    # 자동화 오케스트레이터
│   ├── AIService.js         # AI 글 생성 서비스
│   ├── TrendsService.js     # Google Trends 수집
│   ├── ImageService.js      # 이미지 검색 서비스
│   ├── WordPressClient.js   # WordPress 연동
│   ├── Config.js            # 설정 관리
│   └── ErrorHandler.js      # 에러 처리
├── 🧪 테스트 파일
│   ├── AllTests.js          # 통합 테스트 시스템 ⭐
│   ├── AITests.js           # AI 기능 테스트
│   ├── ImageTests.js        # 이미지 기능 테스트
│   ├── TrendsTests.js       # 트렌드 수집 테스트
│   ├── WordPressTests.js    # WordPress 연동 테스트
│   └── TestFunctions.js     # 기존 테스트 함수들
├── 🛠️ 유틸리티
│   ├── SEOUtils.js          # SEO 최적화 도구
│   ├── PerformanceConfig.js # 성능 설정
│   └── sync.js              # 로컬 ↔ GAS 동기화
├── ⚙️ 설정 파일
│   ├── package.json         # Node.js 의존성
│   ├── credentials.json     # Google OAuth2 인증
│   ├── token.json          # 인증 토큰 (자동 생성)
│   └── .clasp.json         # clasp 설정
└── 📚 문서
    ├── README.md           # 이 파일
    ├── setup.md            # 설정 가이드
    └── UPGRADE_PLAN.md     # 업그레이드 계획
```

### 🎯 주요 파일 설명

- **AllTests.js** ⭐ - 새로 추가된 통합 테스트 시스템
- **Code.js** - 모든 함수의 진입점, Google Apps Script에서 실행
- **BlogAutomation.js** - 전체 자동화 워크플로우 관리
- **AIService.js** - 멀티 AI 모델 통합 및 글 생성
- **sync.js** - 로컬 개발환경과 Google Apps Script 동기화

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

## 🧪 테스트 실행 가이드

### 시스템 상태 확인

1. **전체 시스템 테스트 (권장)**
   ```javascript
   runAllTests()  // 모든 기능 테스트 (5-10분)
   ```

2. **빠른 핵심 테스트**
   ```javascript
   runQuickTests()  // 핵심 기능만 (3분)
   ```

3. **개별 기능 테스트**
   ```javascript
   testConfigOnly()     // 설정 검증
   testTrendsOnly()     // 트렌드 수집
   testAIOnly()         // AI 글 생성
   testWordPressOnly()  // WordPress 연결
   ```

### 테스트 결과 해석

- ✅ **성공**: 기능이 정상 작동
- ❌ **실패**: 설정 또는 API 키 확인 필요
- ⚡ **성공률 70% 이상**: 시스템 정상 운영 가능

### 문제 해결 순서

1. **설정 검증 실행**: `testConfigOnly()`
2. **개별 기능 테스트**: 실패한 기능만 개별 테스트
3. **API 키 확인**: Script Properties에서 키 값 재확인
4. **권한 확인**: Google Sheets/WordPress 접근 권한
5. **할당량 확인**: AI API 및 기타 서비스 사용량

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. `showTestGuide()` 실행하여 테스트 가이드 확인
2. `runAllTests()` 실행하여 전체 시스템 상태 확인
3. 실패한 테스트의 에러 메시지 확인
4. Script Properties에서 모든 API 키가 올바르게 설정되었는지 확인
5. Google Sheets 권한 및 WordPress REST API 활성화 상태 확인

---

**Happy Automated Blogging! 🎉**