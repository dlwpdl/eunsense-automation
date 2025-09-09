# 🔍 토픽 마이닝 테스트 가이드

## 문제 해결 완료 ✅

기존 문제점이었던 **Cluster, Intent, SourceKeywords → Topic, Category, TagsCsv, ProductNames** 매핑 문제를 해결했습니다.

### 수정된 사항:

1. **AI 프롬프트 개선** (`ai-service.js`)
   - `product_names` 추출 추가
   - `suggested_category` 추가
   - 더 정확한 제품/브랜드명 인식

2. **토픽 매핑 수정** (`main.js`)
   - `ProductNames` 필드 추가
   - `Category` 필드를 `suggested_category` 우선 사용
   - 모든 필수 필드 매핑 완료

3. **토픽 생성 로직 개선** (`trends-service.js`)
   - AI 분석 결과의 모든 필드 전달
   - 로깅 개선으로 디버깅 가능

## 🚀 테스트 실행 방법

### 1단계: Script Properties 설정 확인

Google Apps Script 편집기에서 **설정 > Script Properties**에 다음 값들이 설정되어 있는지 확인:

```
필수 설정:
- SERP_API_KEY: SerpAPI 키 (토픽 발굴용)
- AI_API_KEY: OpenAI API 키 (토픽 분석용)
- AI_PROVIDER: openai
- AI_MODEL: gpt-4o-mini (또는 gpt-4o)

선택 설정:
- BLOG_NICHE_KEYWORDS: AI art,WordPress speed,SEO strategies
- WP_BASE: 워드프레스 사이트 URL (발행 테스트용)
- WP_USER: 워드프레스 사용자명
- WP_APP_PASS: 워드프레스 앱 비밀번호
```

### 2단계: 토픽 마이닝 테스트 실행

Google Apps Script 편집기에서 다음 함수 실행:

```javascript
// 토픽 마이닝만 테스트 (안전)
testTopicMiningOnly()
```

### 3단계: 실제 토픽 수집 및 저장

테스트가 성공하면 실제로 Google Sheets에 저장:

```javascript
// Google Sheets에 토픽 저장
collectTrends()
```

### 4단계: 블로그 자동화 테스트 (선택사항)

WordPress 설정이 완료된 경우:

```javascript
// 전체 워크플로우 테스트
runBlogAutomation()

// 또는 발행만 테스트
publishPosts()
```

## 📊 결과 확인 방법

### 토픽 마이닝 결과 예시:
```
📝 토픽 1:
  제목: "Best AI Art Generators for Creative Professionals in 2025"
  카테고리: "Technology"
  의도: "Comparison/Review"
  키워드: AI art generators, creative professionals, digital art
  제품명: Midjourney, DALL-E, Stable Diffusion
  기회 점수: 75
```

### Google Sheets 저장 확인:
시트에 다음 컬럼들이 채워져야 함:
- **Topic**: AI가 생성한 매력적인 블로그 제목
- **Category**: AI가 제안한 적절한 카테고리
- **TagsCsv**: SEO 키워드들 (최대 5개)
- **ProductNames**: 언급된 제품/브랜드명들
- **Language**: EN (기본값)
- **Format**: standard (기본값)
- **Cluster**: 토픽 클러스터명
- **Intent**: 사용자 의도
- **SourceKeywords**: 원본 검색 키워드들
- **OpportunityScore**: SEO 기회 점수 (0-100)

## 🔧 문제 해결

### 자주 발생하는 오류들:

1. **"SERP_API_KEY가 설정되지 않았습니다"**
   - Script Properties에서 SERP_API_KEY 설정
   - [SerpAPI](https://serpapi.com)에서 무료 계정 생성

2. **"AI_API_KEY가 설정되지 않았습니다"**
   - Script Properties에서 AI_API_KEY 설정
   - [OpenAI](https://platform.openai.com)에서 API 키 발급

3. **"토픽 발굴 실패"**
   - BLOG_NICHE_KEYWORDS 설정 확인
   - 쉼표로 구분된 3-5개 키워드 추천

4. **"시트 헤더 누락"**
   - 기존 시트에 새 헤더가 없는 경우
   - 새 시트가 자동 생성되거나 수동으로 헤더 추가

## 🎯 최적화 팁

1. **씨앗 키워드 선택**:
   - 너무 일반적이지 않은 특정 키워드 선택
   - 예: "camera gear", "productivity apps", "sustainable fashion"

2. **API 비용 절약**:
   - `gpt-4o-mini` 모델 사용 권장
   - SERP API 무료 한도 고려

3. **품질 향상**:
   - 정기적으로 기회 점수가 높은 토픽들 확인
   - 제품명이 포함된 토픽들로 affiliate 콘텐츠 활용

## ✅ 성공 기준

테스트 성공 시 다음을 확인할 수 있어야 함:

- [ ] 3-5개의 고품질 토픽 생성
- [ ] 각 토픽에 적절한 카테고리 할당
- [ ] 관련 제품명 추출 (해당되는 경우)
- [ ] SEO 키워드 5개씩 생성
- [ ] Google Sheets에 모든 필드 정상 저장
- [ ] 후속 블로그 자동화에서 정상 인식

이제 안전하게 토픽 마이닝을 테스트하고, 생성된 토픽들로 블로그 자동화를 실행할 수 있습니다! 🎉