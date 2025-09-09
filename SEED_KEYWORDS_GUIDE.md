# 🌱 씨앗 키워드 관리 가이드

## ✅ 문제 해결 완료!

로그에서 확인된 두 가지 문제를 해결했습니다:

### 1. 헤더 누락 문제 ✅
- **자동 헤더 추가**: 기존 시트에 누락된 헤더 자동 감지 및 추가
- **더 이상 수동 작업 불필요**: 시트를 다시 실행하면 자동으로 헤더가 업데이트됨

### 2. 씨앗 키워드 비효율성 ✅  
- **함수 기반 관리**: Script Properties 수동 변경 대신 함수로 간편 관리
- **미리 정의된 세트**: 주제별로 미리 준비된 키워드 세트 제공

## 🚀 개선된 씨앗 키워드 관리 방법

### 방법 1: 빠른 키워드 세트 전환 (추천 ⭐)

```javascript
// Google Apps Script에서 실행
switchToKeywordSet('tech')     // 기술 관련
switchToKeywordSet('vpn')      // VPN 관련  
switchToKeywordSet('finance')  // 금융 관련
switchToKeywordSet('lifestyle') // 라이프스타일
switchToKeywordSet('business') // 비즈니스
switchToKeywordSet('gaming')   // 게임 관련
```

### 방법 2: 개별 키워드 관리

```javascript
// 현재 키워드 확인
listSeedKeywords()

// 새 키워드 추가
addSeedKeywords(['camera gear', 'photography tips'])

// 키워드 제거
removeSeedKeywords(['old keyword'])

// 완전히 새로운 키워드 세트 설정
setSeedKeywords(['AI tools', 'machine learning', 'data science'])
```

## 🎯 미리 정의된 키워드 세트

### VPN 세트
```
VPN, Surfshark VPN, NordVPN, ExpressVPN, Which is the best vpn
```

### 기술 세트
```
AI art, WordPress speed, SEO strategies, productivity apps, tech reviews
```

### 금융 세트
```
cryptocurrency, investment apps, financial planning, trading platforms, budgeting tools
```

### 라이프스타일 세트
```
fitness apps, meal planning, sustainable living, travel tips, wellness trends
```

### 비즈니스 세트
```
remote work tools, project management, team collaboration, business automation, startup tips
```

### 게임 세트
```
gaming laptops, mobile games, streaming setup, game reviews, esports trends
```

## 📋 사용 워크플로우

### 새로운 주제로 전환하기:

1. **키워드 세트 전환**:
   ```javascript
   switchToKeywordSet('finance')  // 금융 주제로 전환
   ```

2. **토픽 마이닝 실행**:
   ```javascript
   testTopicMiningOnly()  // 테스트
   collectTrends()        // 실제 수집
   ```

3. **결과 확인**: Google Sheets에서 새로운 토픽들 확인

### 커스텀 키워드 사용하기:

```javascript
// 1. 새로운 키워드 세트 설정
setSeedKeywords(['drone photography', 'aerial cinematography', 'DJI drones', 'drone accessories'])

// 2. 토픽 마이닝 실행
collectTrends()
```

## 🔧 다음 실행 가이드

### 헤더 문제 해결 확인:
```javascript
// 다시 실행하면 헤더가 자동으로 추가됩니다
collectTrends()
```

### 다른 주제로 바로 전환:
```javascript
// 예: 기술 주제로 전환
switchToKeywordSet('tech')
collectTrends()
```

## 💡 팁

1. **주제별 콘텐츠 계획**: 각 세트별로 1-2주씩 운영
2. **키워드 조합**: 여러 세트의 키워드를 조합해서 사용
3. **성과 추적**: 각 키워드 세트별 토픽 성공률 모니터링

이제 Script Properties를 매번 수동으로 변경할 필요 없이, 함수 한 번으로 간편하게 키워드를 전환할 수 있습니다! 🎉