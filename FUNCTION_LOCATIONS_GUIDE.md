# 📍 함수 위치 및 사용법 가이드

## 🗂️ 함수들의 위치

### 📁 `src/blog-automation/main.js` (메인 함수들)

#### 🌱 씨앗 키워드 관리 (새로 추가됨)
```javascript
switchToKeywordSet('vpn')           // 키워드 세트 빠른 전환
listSeedKeywords()                  // 현재 키워드 목록 보기
setSeedKeywords(['키워드1', '키워드2']) // 새 키워드 설정
addSeedKeywords(['추가할키워드'])     // 키워드 추가
removeSeedKeywords(['제거할키워드'])  // 키워드 제거
```

#### 🎯 핵심 자동화 함수들
```javascript
collectTrends()                     // 토픽 수집만 (안전)
publishPosts()                      // 발행만 실행
runBlogAutomation()                 // 전체 자동화 (수집+발행)
```

#### 🧪 테스트 함수들
```javascript
testTopicMiningOnly()               // 토픽 마이닝만 테스트
testFullSystem()                    // 전체 시스템 테스트
```

#### ⚙️ 설정 함수들
```javascript
setupAutomationTriggers()           // 자동화 트리거 설정
setupScriptProperties()             // 기본 설정값 초기화
validateConfig()                    // 설정 검증
```

---

### 📁 `src/shared/config.js` (설정 관리)
```javascript
getConfig()                         // 모든 설정값 가져오기
setupScriptProperties()             // 기본값 설정
validateConfig()                    // 필수 설정 검증
```

### 📁 `src/blog-automation/trends-service.js` (토픽 발굴)
```javascript
discoverNicheTopics()               // AI 기반 토픽 발굴
```

### 📁 `src/blog-automation/ai-service.js` (AI 글 생성)
```javascript
generateHtmlWithLanguage()          // AI 글 생성 (언어 지원)
analyzeTopicsWithAI()              // AI 토픽 분석
```

---

## 🚀 순서대로 사용하는 방법

### 1단계: 초기 설정 (한 번만)

```javascript
// Google Apps Script 편집기에서 실행
setupScriptProperties()
```

**Script Properties에서 설정해야 할 것들**:
- `SERP_API_KEY`: SerpAPI 키
- `AI_API_KEY`: OpenAI 또는 Claude API 키
- `WP_BASE`: WordPress 사이트 URL
- `WP_USER`: WordPress 사용자명
- `WP_APP_PASS`: WordPress 앱 비밀번호

### 2단계: 키워드 설정

```javascript
// 방법 1: 미리 정의된 세트 사용 (추천)
switchToKeywordSet('tech')

// 방법 2: 수동으로 설정
setSeedKeywords(['drone photography', 'aerial video', 'DJI mavic'])

// 현재 키워드 확인
listSeedKeywords()
```

### 3단계: 토픽 마이닝 테스트

```javascript
// 안전한 테스트 (실제 저장하지 않음)
testTopicMiningOnly()
```

### 4단계: 실제 토픽 수집

```javascript
// Google Sheets에 실제로 저장
collectTrends()
```

### 5단계: 블로그 발행 (선택사항)

```javascript
// 방법 1: 발행만 실행
publishPosts()

// 방법 2: 전체 자동화 (수집+발행)
runBlogAutomation()
```

---

## 📱 Google Apps Script에서 실행하는 방법

### 함수 실행 위치:
1. **Google Apps Script 편집기** 열기
2. **상단 메뉴** → `실행` → `함수 선택`
3. **드롭다운에서 함수 선택**
4. **실행 버튼** 클릭

### 실행 가능한 함수 목록:
```
- switchToKeywordSet
- listSeedKeywords  
- testTopicMiningOnly
- collectTrends
- publishPosts
- runBlogAutomation
- setupScriptProperties
- validateConfig
```

---

## 🎯 주요 사용 시나리오

### 시나리오 1: 새로운 주제로 토픽 수집
```javascript
// 1. 키워드 변경
switchToKeywordSet('finance')

// 2. 토픽 수집
collectTrends()
```

### 시나리오 2: 커스텀 키워드로 토픽 수집
```javascript
// 1. 새 키워드 설정
setSeedKeywords(['camera gear', 'photography tips', 'lens reviews'])

// 2. 토픽 수집
collectTrends()
```

### 시나리오 3: 전체 블로그 자동화
```javascript
// 1. 키워드 설정
switchToKeywordSet('tech')

// 2. 수집 + 발행까지 자동화
runBlogAutomation()
```

### 시나리오 4: 문제 해결/테스트
```javascript
// 1. 설정 검증
validateConfig()

// 2. 안전한 테스트
testTopicMiningOnly()

// 3. 전체 시스템 테스트
testFullSystem()
```

---

## 🔍 함수별 실행 결과

### `switchToKeywordSet('tech')` 실행 시:
```
✅ 'tech' 키워드 세트로 전환 완료
현재 씨앗 키워드 (5개):
  1. AI art
  2. WordPress speed
  3. SEO strategies
  4. productivity apps
  5. tech reviews
```

### `collectTrends()` 실행 시:
```
🔍 씨앗 키워드 기반 토픽 발굴 시작
✅ 총 5개의 전략적 토픽 발굴 완료
✅ AI가 분석한 새로운 토픽 5개를 시트에 저장했습니다
```

### `publishPosts()` 실행 시:
```
=== 미발행 주제로 포스트 발행 시작 ===
✅ 발행 완료: AI Art Generation Tools → https://yoursite.com/post-url
발행 완료: 1건
```

이제 어떤 함수를 어디서 실행해야 하는지 명확하죠! 🎉