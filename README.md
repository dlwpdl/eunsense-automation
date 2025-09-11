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

### 🇰🇷 한국어 언어 처리 개선 ⭐ NEW!

시트의 **Language 컬럼**에 다음과 같이 입력하면 자동으로 한국어 블로그 포스트가 생성됩니다:

#### 지원하는 한국어 설정 값:
- `KO`, `ko` ✅
- `KR`, `kr` ✅  
- `한국어` ✅
- `korean` ✅

#### 사용 예시:
```
Google Sheets의 Language 컬럼에 "KO" 입력
→ 🇰🇷 한국어 모드 활성화
→ 제목, 내용, 태그, 카테고리 모두 한국어로 생성
→ 한국 독자를 위한 자연스러운 표현 사용
→ 한국어 SEO 최적화 적용
```

#### 강화된 언어 감지 기능:
- **대소문자 무관**: `ko`, `KO`, `Kr` 모두 인식
- **공백 처리**: 앞뒤 공백 자동 제거
- **다양한 형태**: 영어/한글 표기 모두 지원
- **디버깅 로그**: 언어 감지 과정을 로그로 확인 가능

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

// GPT-5로 전환: 최신 고품질 모델 (OpenAI 최신)
switchToGPT5()

// GPT-5 Mini로 전환: 비용 효율적인 최신 모델 (가성비 최고)
switchToGPT5Mini()

// GPT-4o로 전환: AI_PROVIDER=openai, AI_MODEL=gpt-4o로 설정 (균형잡힌 성능)
switchToGPT4o()

// GPT-4 Turbo로 전환: 비용 절약용 설정 (품질은 유지하면서 가격 절약)
switchToGPT4Turbo()
```

#### 🔧 AI 모델 진단 및 문제 해결 함수 ⭐ NEW!
```javascript
// === 종합 AI 품질 진단 ===
// 현재 AI 설정 상세 분석, 실제 API 테스트, 품질 평가 및 권장사항 (최우선 실행 권장)
diagnoseContentQuality()

// 현재 사용 중인 AI 모델 상세 정보 및 성능 지표 확인
checkCurrentAIDetailed()

// 실제 AI API 호출 테스트 (응답 시간, 콘텐츠 품질 측정)
testActualAPICall()

// === 품질별 모델 자동 전환 ===
// 최고 품질 모델로 자동 전환 (Claude 4 Sonnet → GPT-5 순)
switchToHighestQuality()

// 비용 효율적인 고품질 모델로 전환 (GPT-5 Mini 최우선)
switchToCostEffectiveQuality()

// 한국어 특화 모델로 전환 (Claude 4 Sonnet 최우선)
switchToKoreanOptimized()

// === Claude 문제 해결 도구 ===
// Claude API 키 상태 상세 진단 (키 형식, 길이, 유효성 검사)
debugClaudeKey()

// Claude API 실제 연결 테스트 (인증, 응답 확인)
testClaudeAPI()

// Claude 종합 문제 해결사 (진단 → 테스트 → 대안 제시)
fixClaudeIssues()

// Claude 설정 가이드 출력 (API 키 발급부터 설정까지)
showClaudeSetupGuide()

// Claude 문제시 대안 AI로 즉시 전환 (GPT-5 → Gemini 순)
switchToAlternativeAI()

// === Claude API 제한사항 분석 ===
// Claude API가 안되는 원인들을 상세 분석 (지역제한, 크레딧, 권한 등)
analyzeClaudeRestrictions()

// Claude 계정 상태 확인 (여러 모델로 테스트하여 계정 상태 추정)
checkClaudeAccountStatus()
```

## 🚨 Claude API 문제 해결 가이드

### Claude API가 안될 때 주요 원인들

#### 1. 🔑 API 키 문제
```javascript
// API 키 상태 진단
debugClaudeKey()

// 실제 API 연결 테스트
testClaudeAPI()
```

**확인사항:**
- API 키 형식: `sk-ant-api03-` (최신) vs `sk-ant-api02-` (구버전)
- 키 길이: 80-150자 범위
- 키 만료: console.anthropic.com에서 확인

#### 2. 💳 계정/크레딧 문제
```javascript
// 계정 상태 상세 분석
checkClaudeAccountStatus()
```

**확인사항:**
- 크레딧 잔액 (무료 크레딧 소진 가능성)
- 결제 방법 등록 여부
- 계정 정지/제한 여부

#### 3. 🌐 네트워크/접근 문제
```javascript
// 제한사항 종합 분석
analyzeClaudeRestrictions()
```

**확인사항:**
- 회사/학교 방화벽에서 Anthropic 도메인 차단
- ISP 레벨 일시적 차단
- 프록시/VPN 문제

#### 4. 🆕 모델 접근 권한
**Claude-4 모델 문제:**
- `claude-4-sonnet-20250514`: 베타/얼리액세스 전용
- `claude-4`: 일부 계정만 접근 가능
- `claude-3-5-sonnet-20241022`: 일반적으로 사용 가능

#### 5. ⚡ 일시적 문제
- Rate Limit 초과 (분당 요청 수)
- Anthropic 서버 이슈
- API 엔드포인트 변경

### 🔧 단계별 해결 방법

#### Step 1: 기본 진단
```javascript
// 종합 Claude 문제 해결사 실행
fixClaudeIssues()
```

#### Step 2: 새 API 키 발급
1. [console.anthropic.com](https://console.anthropic.com) 접속
2. API Keys → Create Key
3. Script Properties에서 `CLAUDE_API_KEY` 업데이트

#### Step 3: 모델 변경
```javascript
// 안전한 Claude 모델로 변경
setClaude4Model("claude-3-5-sonnet-20241022")

// 또는 확실히 작동하는 모델 찾기
findBestClaude4Model()
```

#### Step 4: 대안 AI 사용
```javascript
// GPT-5로 임시 전환
switchToGPT5()

// 또는 최고 품질 모델로 자동 전환
switchToHighestQuality()
```

### 🆘 응급 해결책

**Claude가 계속 안될 때:**
```javascript
// 1. 대안 AI로 즉시 전환
switchToAlternativeAI()

// 2. 또는 GPT-5 강제 전환
switchToGPT5()

// 3. 설정 완전 초기화
resetClaudeSetup()
```

**이전에 작동했다면 주로 이런 원인:**
- 무료 크레딧 소진 → 결제 필요
- API 키 만료 → 새 키 발급
- 모델명 변경 → 올바른 모델명 사용
- 일시적 서버 문제 → 시간 두고 재시도

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

### 🔧 AI 모델 품질 문제 해결 ⭐ 최우선

#### Claude API 인증 오류 (`Invalid bearer token`)
```javascript
// 1. Claude 키 상태 진단 (src/debug-claude-key.js)
debugClaudeKey()

// 2. Claude API 실제 테스트 (src/debug-claude-key.js)
testClaudeAPI()

// 3. 종합 문제 해결사 (src/debug-claude-key.js)
fixClaudeIssues()

// 4. 대안 AI로 즉시 전환 (src/debug-claude-key.js)
switchToAlternativeAI()
```

#### AI 글 품질이 떨어지는 경우
```javascript
// 1. 현재 AI 모델 상태 진단 (src/check-ai-model.js)
diagnoseContentQuality()

// 2. 최고 품질 모델로 전환 (src/check-ai-model.js)
switchToHighestQuality()

// 3. 한국어 특화 모델로 전환 (src/check-ai-model.js)
switchToKoreanOptimized()

// 4. 실제 API 테스트 (src/check-ai-model.js)
testActualAPICall()
```

#### 언어 처리 문제 (영어로 나오는 경우)
```javascript
// Google Sheets Language 컬럼에 올바른 값 설정:
// "KO", "ko", "KR", "kr", "한국어", "korean" 중 하나

// 언어 감지 로그 확인:
// 🇰🇷 한국어 모드 활성화 메시지가 나타나는지 확인
// src/blog-automation/ai-service.js와 src/blog-automation/main.js에서 처리
```

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
│   ├── AIService.js         # AI 글 생성 서비스 ⭐
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
- **AIService.js** ⭐ - 멀티 AI 모델 통합 및 글 생성 (AI 기능의 핵심)
- **sync.js** - 로컬 개발환경과 Google Apps Script 동기화

## 🤖 AIService.js 세부 함수 가이드

### 📝 토픽 및 콘텐츠 분석 함수

#### `analyzeTopicsWithAI(discoveredTopics)`
**기능**: 여러 토픽을 AI가 클러스터링하고 전략 분석  
**파라미터**: 
- `discoveredTopics` - discoverNicheTopics에서 발굴한 토픽 배열  
**사용 모델**: GPT-4o-mini (분석 최적화)  
**리턴**: `{clusters: [{cluster_name, representative_title, user_intent, keywords, product_names}]}` 또는 null  

```javascript
// 사용 예시
const topics = [
  {topic: "AI 글쓰기 도구", source: "trend"},
  {topic: "ChatGPT 활용법", source: "trend"}
];
const analysis = analyzeTopicsWithAI(topics);
// → AI가 클러스터링하여 블로그 전략 제안
```

#### `generateReoptimizedPost(originalTitle, originalHtml)`
**기능**: 기존 포스트를 AI로 재최적화하여 SEO 및 품질 향상  
**파라미터**: 
- `originalTitle` - 원본 포스트 제목  
- `originalHtml` - 원본 포스트 HTML 콘텐츠  
**사용 모델**: GPT-4o (고품질 편집)  
**리턴**: `{newTitle, newHtml}` 또는 null  

```javascript
// 사용 예시
const improved = generateReoptimizedPost(
  "오래된 제목", 
  "<h2>기존 내용</h2><p>구식 정보...</p>"
);
// → AI가 최신 정보로 업데이트하고 SEO 최적화
```

### 🔌 AI API 호출 및 관리 함수

#### `callAiProvider(prompt, config, model)`
**기능**: 범용 AI 호출 함수 (모든 AI 모델 통합 지원)  
**지원 제공자**: OpenAI, Anthropic (Claude), Google Gemini  
**파라미터**: 
- `prompt` - AI에게 전달할 프롬프트  
- `config` - 설정 객체 (API 키 포함)  
- `model` - 사용할 AI 모델명  
**리턴**: AI 응답 텍스트  

#### `callOpenAI(prompt, config, model, profile)`
**기능**: OpenAI API 전용 호출 함수  
**특징**: JSON 모드 지원, 구조화된 응답  
**지원 모델**: gpt-5, gpt-4o, gpt-4o-mini, gpt-4-turbo  

#### `callClaude(prompt, config, model, profile)`
**기능**: Anthropic Claude API 전용 호출 함수  
**특징**: 장문 작성에 최적화, 한국어 품질 우수  
**지원 모델**: claude-4-sonnet, claude-3-5-sonnet, claude-3-5-haiku  
**특별 처리**: JSON 응답을 위한 프롬프트 후처리  

### 📄 프롬프트 생성 함수

#### `buildTopicClusterPrompt(discoveredTopics)`
**기능**: 토픽 클러스터링 및 전략 분석용 프롬프트 생성  
**프롬프트 내용**: 
- 토픽들을 3-5개 클러스터로 그룹화  
- 각 클러스터의 사용자 의도 파악  
- SEO 최적화된 대표 제목 생성  
- 제품/브랜드명 추출 (어필리에이트용)  

#### `buildReoptimizationPrompt(originalTitle, originalHtml)`
**기능**: 콘텐츠 재활용 및 개선용 프롬프트 생성  
**개선 영역**: 
- 정보 업데이트 (통계, 예시)  
- 가독성 및 구조 개선  
- SEO 키워드 최적화  
- 참여도 향상 (인트로, 결론 강화)  

#### `buildStructuredPromptWithLanguage(topic, targetLanguage, relatedTopics)`
**기능**: 언어별 맞춤형 구조화 프롬프트 생성  
**언어 지원**: 
- 한국어 (KO, KR, "한국어") - 친근한 대화체, 한국 독자 특화  
- 영어 (EN, 기본값) - 글로벌 SEO 최적화  
**특징**: 
- 관련 주제 자동 통합  
- 2025년 최신성 강조  
- 독창적 인사이트 요구  

### 🎛️ 모델 관리 및 설정 함수

#### `getModelProfile(model)`
**기능**: AI 모델별 상세 프로파일 정보 제공  
**포함 정보**: 
- **제공자** (OpenAI/Anthropic/Google)  
- **파라미터** (maxTokens, temperature 등)  
- **성능 지표** (JSON 신뢰성, 비용 효율성, 글쓰기 품질)  
- **전략 설정** (재시도 횟수, 폴백 동작)  

**지원 모델 목록**:
```javascript
// OpenAI (권장 순서)
'gpt-5', 'gpt-5-mini', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'

// Anthropic (장문 작성 최적)  
'claude-4-sonnet-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'

// Google Gemini
'gemini-1.5-flash', 'gemini-1.5-pro'
```

### 🏗️ 콘텐츠 생성 및 검증 함수

#### `generateHtmlWithLanguage(topic, targetLanguage, relatedTopics)`
**기능**: 완전한 블로그 포스트 HTML 생성 (메인 함수)  
**처리 과정**: 
1. 언어별 프롬프트 생성  
2. AI API 호출 (재시도 메커니즘)  
3. 응답 검증 및 정리  
4. 폴백 구조 제공 (실패 시)  

**리턴 구조**:
```javascript
{
  title: "SEO 최적화된 제목",
  seoDescription: "메타 설명 (155자 이내)",
  categories: ["카테고리1", "카테고리2"],
  tags: ["태그1", "태그2", "태그3"],
  subtopics: ["소제목1", "소제목2"],
  html: "<h2>구조화된 HTML 콘텐츠</h2>"
}
```

#### `validateAndCleanResult(result, topic, modelProfile)`
**기능**: AI 응답 검증 및 정리  
**검증 항목**: 
- 제목 존재 여부  
- HTML 콘텐츠 최소 길이 (50자)  
- 필수 필드 검증  

#### `createFallbackStructure(topic, originalResponse)`
**기능**: AI 실패 시 기본 구조 생성  
**용도**: 시스템 안정성 보장, 서비스 중단 방지  

## 🚀 AI 서비스 사용 방법

### 기본 설정 (Script Properties)
```javascript
AI_PROVIDER = "openai"        // 또는 "anthropic", "gemini"
AI_MODEL = "gpt-4o"          // 사용할 모델명
AI_API_KEY = "your_api_key"   // 해당 제공자의 API 키
CLAUDE_API_KEY = "claude_key" // Claude 전용 키 (선택)
```

### 자주 사용하는 조합

#### 고품질 + 비용 효율적
```javascript
// GPT-4o Mini - 일반적인 블로그 포스트
AI_PROVIDER = "openai"
AI_MODEL = "gpt-4o-mini"
```

#### 최고 품질 장문
```javascript
// Claude 4 Sonnet - 심층 분석, 장문 아티클
AI_PROVIDER = "anthropic" 
AI_MODEL = "claude-4-sonnet-20250514"
```

#### 한국어 최적화
```javascript
// GPT-4o - 한국어 자연성과 SEO 균형
AI_PROVIDER = "openai"
AI_MODEL = "gpt-4o"
```

### 실제 사용 예시

```javascript
// 1. 단일 토픽으로 포스트 생성
const topic = "2025년 최신 AI 도구 비교";
const result = generateHtmlWithLanguage(topic, "KO");

// 2. 관련 주제를 포함한 심화 포스트
const relatedTopics = ["ChatGPT", "Claude", "Gemini", "AI 윤리"];
const richResult = generateHtmlWithLanguage(topic, "KO", relatedTopics);

// 3. 기존 포스트 업그레이드
const improved = generateReoptimizedPost(
  "구식 제목", 
  "기존 HTML 내용"
);
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