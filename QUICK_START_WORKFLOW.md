# ⚡ 빠른 시작 워크플로우

## 🎯 가장 중요한 함수들 (우선순위별)

### 🥇 필수 함수 (이것만 알면 됨)
```javascript
switchToKeywordSet('tech')    // 키워드 변경
collectTrends()               // 토픽 수집
publishPosts()                // 블로그 발행
```

### 🥈 유용한 함수
```javascript
listSeedKeywords()            // 현재 키워드 확인
testTopicMiningOnly()         // 안전한 테스트
validateConfig()              // 설정 확인
```

---

## 📍 함수 실행 위치

### Google Apps Script 편집기에서:
1. **Google Apps Script** 편집기 열기
2. **실행** 메뉴 → **함수 선택**
3. **드롭다운에서 함수명 선택**
4. **실행** 버튼 클릭

### 모든 함수는 여기 있음:
📁 **`src/blog-automation/main.js`** ← 99% 여기에 있음

---

## 🚀 실제 사용 순서

### 매번 하는 루틴:

#### 1️⃣ 주제 선택 (5초)
```javascript
switchToKeywordSet('vpn')      // VPN 주제
switchToKeywordSet('tech')     // 기술 주제
switchToKeywordSet('finance')  // 금융 주제
switchToKeywordSet('lifestyle') // 라이프스타일
switchToKeywordSet('business') // 비즈니스
switchToKeywordSet('gaming')   // 게임 주제
```

#### 2️⃣ 토픽 수집 (30초)
```javascript
collectTrends()               // Google Sheets에 토픽 저장
```

#### 3️⃣ 블로그 발행 (2-5분)
```javascript
publishPosts()                // 수집된 토픽으로 블로그 발행
```

**끝!** 이게 전부입니다. 🎉

---

## 📋 사용 가능한 키워드 세트

| 세트명 | 키워드들 | 용도 |
|--------|----------|------|
| `'vpn'` | VPN, NordVPN, ExpressVPN... | VPN 리뷰/비교 |
| `'tech'` | AI art, WordPress speed... | 기술 관련 |
| `'finance'` | cryptocurrency, investment... | 금융/투자 |
| `'lifestyle'` | fitness apps, meal planning... | 생활/건강 |
| `'business'` | remote work, project management... | 비즈니스 |
| `'gaming'` | gaming laptops, mobile games... | 게임 관련 |

---

## 🔄 실제 작업 예시

### 예시 1: VPN 주제로 블로그 포스트 만들기
```javascript
// 1. VPN 키워드로 변경
switchToKeywordSet('vpn')

// 2. 토픽 수집 (AI가 VPN 관련 토픽들 생성)
collectTrends()

// 3. 블로그 발행 (AI가 글 작성 후 WordPress에 발행)
publishPosts()
```

**결과**: VPN 비교, 리뷰 관련 블로그 포스트들이 자동으로 생성되어 발행됨

### 예시 2: 기술 주제로 전환
```javascript
// 1. 기술 키워드로 변경  
switchToKeywordSet('tech')

// 2. 토픽 수집
collectTrends()

// 3. 발행
publishPosts()
```

**결과**: AI 아트, WordPress 최적화, SEO 관련 포스트들이 생성됨

---

## ⚠️ 주의사항 및 팁

### 처음 사용할 때:
1. **설정 먼저**: `setupScriptProperties()` 실행
2. **테스트 먼저**: `testTopicMiningOnly()` 실행
3. **실제 사용**: `collectTrends()` → `publishPosts()`

### 문제 발생 시:
```javascript
validateConfig()              // 설정 확인
listSeedKeywords()           // 현재 키워드 확인
testTopicMiningOnly()        // 안전한 테스트
```

### 효율적인 사용:
- **주간 계획**: 월요일 VPN, 수요일 Tech, 금요일 Finance
- **키워드 로테이션**: 매번 다른 세트 사용
- **결과 모니터링**: Google Sheets에서 생성된 토픽들 확인

---

## 🎪 고급 사용법 (선택사항)

### 커스텀 키워드 사용:
```javascript
setSeedKeywords(['drone photography', 'aerial cinematography'])
collectTrends()
```

### 키워드 추가/제거:
```javascript
addSeedKeywords(['new keyword'])       // 추가
removeSeedKeywords(['old keyword'])    // 제거
```

### 전체 자동화 (수집+발행):
```javascript
runBlogAutomation()                    // 한 번에 모든 과정
```

---

## 📱 모바일에서도 가능

Google Apps Script는 모바일 브라우저에서도 실행 가능하므로, 외출 중에도 함수를 실행할 수 있습니다!

**이제 복잡하게 생각하지 마세요. 3개 함수만 기억하면 됩니다:**
1. `switchToKeywordSet('주제')`
2. `collectTrends()`  
3. `publishPosts()`

끝! 🚀