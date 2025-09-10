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
새 Google Sheets 생성 후 다음 헤더를 첫 번째 행에 입력:
```
Topic | Status | PostedURL | PostedAt | Category | TagsCsv | Cluster | Intent | SourceKeywords | AffiliateLinks
```

**헤더 설명:**
- **Topic**: 포스트 주제 (필수)
- **Status**: 발행 상태 (자동 업데이트)
- **PostedURL**: 발행된 포스트 URL (자동)
- **PostedAt**: 발행 일시 (자동)
- **Category**: 포스트 카테고리 (AI 자동 생성 또는 수동 입력)
- **TagsCsv**: 태그들 (쉼표 구분, AI 자동 생성 또는 수동 입력)
- **Cluster**: 키워드 클러스터 (AI 자동 생성)
- **Intent**: 검색 의도 (AI 자동 생성)
- **SourceKeywords**: 핵심 키워드들 (AI 자동 생성)
- **AffiliateLinks**: 어필리에이트 링크 (`제품명|링크` 형식)

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

#### 🔗 어필리에이트 링크 설정 (NEW!)
| 키 | 값 | 설명 |
|---|---|---|
| `AFFILIATE_ENABLED` | `true` | 어필리에이트 기능 활성화 여부 |
| `AFFILIATE_DISCLAIMER` | `이 포스트에는 제휴 링크가 포함되어 있습니다.` | 어필리에이트 고지 문구 |
| `MAX_AFFILIATE_LINKS_PER_POST` | `3` | 포스트당 최대 어필리에이트 링크 수 |

### ⚡ 자동 설정 스크립트 실행

Google Apps Script 편집기에서 다음 함수를 실행하여 기본값을 자동 설정할 수 있습니다:

```javascript
// 실행 > 함수 선택 > setupScriptProperties 선택 후 실행
setupScriptProperties()
```

이 함수는 기본값들을 설정하고 필수 설정 가이드를 로그에 출력합니다.

## 🔑 API 키 발급 가이드

### 🤖 AI API 키 발급 (필수 - 최소 1개)

#### OpenAI API 키
1. [OpenAI Platform](https://platform.openai.com) 접속
2. 계정 생성/로그인 → API Keys 메뉴
3. "Create new secret key" 클릭
4. 키 복사하여 `OPENAI_API_KEY`에 설정
5. **모델**: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`

#### Anthropic Claude API 키  
1. [Anthropic Console](https://console.anthropic.com) 접속
2. 계정 생성 → API Keys 생성
3. 키 복사하여 `CLAUDE_API_KEY`에 설정
4. **모델**: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`

#### Google Gemini API 키
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. 키 복사하여 `GEMINI_API_KEY`에 설정  
4. **모델**: `gemini-1.5-pro`, `gemini-1.5-flash`

### 🖼️ 이미지 API 키 발급 (선택사항)

#### Pexels API 키 (무료)
1. [Pexels API](https://www.pexels.com/api/) 접속
2. 계정 생성 → API Key 발급
3. 키 복사하여 `PEXELS_API_KEY`에 설정

#### Google Custom Search API 키
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. API 및 서비스 → 라이브러리 → "Custom Search API" 활성화
3. 사용자 인증 정보 → API 키 생성
4. 키 복사하여 `GOOGLE_API_KEY`에 설정
5. [Custom Search Engine](https://cse.google.com) 에서 검색엔진 ID 생성

### 📈 트렌드 API 키 발급 (선택사항)

#### SerpAPI 키 (Google Trends 폴백용)
1. [SerpAPI](https://serpapi.com) 접속
2. 계정 생성 → API Key 확인
3. 키 복사하여 `SERP_API_KEY`에 설정
4. **무료 할당량**: 월 100회 검색

## 💻 사용법

### 📝 수동 토픽 관리 워크플로우 (NEW!)

#### 1단계: 토픽 입력
Google Sheets에 다음과 같이 입력:
```
Topic 컬럼: "Best AI Tools for Content Creation 2024"
AffiliateLinks 컬럼: "ChatGPT Plus|https://affiliate-link1.com,Notion AI|https://affiliate-link2.com"
Status 컬럼: (비워둠)
```

#### 2단계: SEO 메타데이터 자동 보강
```javascript
enhanceExistingTopics()  // Google Apps Script에서 실행
```

#### 3단계: 결과 확인
AI가 자동으로 다음 컬럼들을 채움:
- **Category**: "Technology"  
- **TagsCsv**: "AI,tools,content,creation,productivity"
- **Cluster**: "AI Content Tools"
- **Intent**: "commercial"
- **SourceKeywords**: "AI tools, content creation, best AI"

#### 4단계: 포스트 발행
```javascript
publishPosts()  // 준비된 토픽들 자동 발행
```

### 🔗 어필리에이트 링크 사용법

Google Sheets의 "AffiliateLinks" 컬럼에 다음 형식으로 입력:

**기본 형식:**
```
제품명1|링크1,제품명2|링크2
```

**예시:**
```
맥북 프로|https://amzn.to/abc123,아이폰 15|https://amzn.to/def456
```

**결과:** 포스트에 자동으로 예쁜 박스 형태로 삽입되며, nofollow 링크와 어필리에이트 고지가 추가됩니다.

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
// 완전 자동화: 트렌드 수집 → AI 글 작성 → WordPress 자동 발행 (하루 최대 3건)
runBlogAutomation()

// 트렌드 기반 토픽 수집: Google Trends에서 인기 키워드 수집하여 Google Sheets에 저장
collectTrends()

// 시트의 미발행 토픽들을 AI가 글 작성 후 WordPress에 자동 발행
publishPosts()

// 시트에 있는 토픽들의 SEO 메타데이터 자동 생성 ⭐ NEW!
// Status가 비어있는 토픽 → Category, Tags, Cluster, Intent, SourceKeywords 자동 채우기
enhanceExistingTopics()
```

#### 🎯 수동 토픽 관리 함수 (NEW!)
```javascript
// 수동 입력한 토픽들의 SEO 최적화: 시트에 Topic만 입력하고 이 함수를 실행하면
// AI가 자동으로 Category, Tags, Cluster, Intent, SourceKeywords 컬럼을 채워줌
enhanceExistingTopics()

// 단일 토픽 테스트: "Best AI Tools for Content Creation 2024" 토픽으로 
// SEO 메타데이터 생성이 제대로 작동하는지 테스트
enhanceSingleTopic()
```

#### ⚙️ 설정 및 관리 함수
```javascript
// 초기 설정: Script Properties에 기본값들 자동 설정하고 필수 입력 가이드 출력
// AI_PROVIDER=anthropic, AI_MODEL=claude-4-sonnet 등 기본값 설정
setupScriptProperties()

// 현재 설정 검증: WP_BASE, WP_USER, WP_APP_PASS, AI_API_KEY 등 필수값 확인
validateConfig()

// 자동화 스케줄 설정: 매일 오전 9시, 오후 6시에 runBlogAutomation() 자동 실행
setupAutomationTriggers()

// 설정된 트리거 확인: 현재 활성화된 자동 실행 스케줄 목록 출력
listAllTriggers()

// 모든 자동화 중지: 설정된 트리거들 완전 삭제
deleteAllTriggers()
```

#### 🧪 테스트 함수들
```javascript
// 시스템 전체 검사: 설정→트렌드→AI→이미지→WordPress→통합 순으로 모든 기능 테스트
runAllTests()

// 핵심 기능만 빠른 검사: 설정, AI, WordPress 연결만 확인 (3분)
runQuickTests()

// 테스트 가이드 출력: 어떤 테스트가 무엇을 하는지 설명
showTestGuide()

// === 개별 기능 테스트 ===
// 설정 확인: API 키들, WordPress 정보 등 필수 설정 검증
testConfigOnly()

// 트렌드 수집: Google Trends에서 키워드 수집하여 AI 토픽 생성 테스트
testTrendsOnly()

// AI 글 작성: 설정된 AI 모델로 실제 블로그 글 생성 테스트
testAIOnly()

// 이미지 검색: Pexels/Google Images에서 관련 이미지 검색 테스트
testImagesOnly()

// WordPress 연결: 사이트 접속, 카테고리/태그 생성, 포스트 발행 테스트
testWordPressOnly()

// 전체 워크플로우: 트렌드 수집→AI 글 생성→이미지 삽입→WordPress 발행 통합 테스트
testIntegrationOnly()
```

#### 🛠️ 유틸리티 함수
```javascript
// WordPress 사이트 현황 확인: 플러그인, 테마, 카테고리, 최근 포스트 등 정보 출력
getWordPressDashboard()

// 시트 구조 디버깅: Google Sheets의 헤더, 데이터 개수, 컬럼 매핑 상태 확인
debugSheetData()

// 최근 에러 확인: 실행 중 발생한 오류들 상세 로그 출력
viewErrorLogs()

// === 어필리에이트 링크 관련 ===
// 어필리에이트 입력법 가이드: "제품명|링크,제품명2|링크2" 형식 설명 출력
showAffiliateGuide()

// 어필리에이트 테스트: 샘플 데이터로 링크 파싱 및 HTML 박스 생성 테스트
testSheetBasedAffiliateLinks()

// === AI 모델 빠른 전환 ===
// Claude 4.0으로 전환: AI_PROVIDER=anthropic, AI_MODEL=claude-4-sonnet로 자동 설정
switchToClaude4()

// GPT-4o로 전환: AI_PROVIDER=openai, AI_MODEL=gpt-4o로 설정 (균형잡힌 성능)
switchToGPT4o()

// GPT-4 Turbo로 전환: 비용 절약용 설정 (품질은 유지하면서 가격 절약)
switchToGPT4Turbo()
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

## ⚡ 빠른 시작 체크리스트

### 필수 설정 (5분)
- [ ] Google Apps Script 프로젝트 생성
- [ ] AI API 키 1개 이상 발급 (OpenAI/Claude/Gemini 중 선택)
- [ ] WordPress 애플리케이션 비밀번호 생성
- [ ] Script Properties에 `WP_BASE`, `WP_USER`, `WP_APP_PASS`, `AI_API_KEY` 설정

### 선택 설정 (10분)
- [ ] Google Sheets 생성 및 헤더 설정
- [ ] 이미지 API 키 발급 (Pexels 권장)
- [ ] 어필리에이트 기능 활성화
- [ ] 자동화 트리거 설정

### 테스트 및 확인 (5분)
```javascript
// Google Apps Script에서 실행
setupScriptProperties()  // 기본 설정
runQuickTests()         // 핵심 기능 테스트
enhanceExistingTopics() // 수동 토픽이 있다면
runBlogAutomation()     // 전체 자동화 실행
```

## 🔄 일반적인 워크플로우

### 완전 자동화 모드
```javascript
runBlogAutomation()  // 트렌드 수집 → AI 글 생성 → 자동 발행
```

### 수동 토픽 관리 모드
1. Google Sheets에 토픽 + 어필리에이트 링크 입력
2. `enhanceExistingTopics()` 실행 → SEO 최적화
3. `publishPosts()` 실행 → 자동 발행

### 혼합 모드 (권장)
- **자동화**: 매일 트렌드 기반 포스트 자동 생성
- **수동**: 특별한 토픽이나 어필리에이트 포스트 수동 추가

---

**Happy Automated Blogging! 🎉**