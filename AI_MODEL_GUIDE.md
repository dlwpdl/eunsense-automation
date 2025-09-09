# 🤖 AI 모델 설정 가이드

## ✅ 답변 요약

### 1. 언어 로직 (이미 구현됨)
- **KO**: 한국어 프롬프트 → 한국어 블로그 글
- **EN**: 영어 프롬프트 → 영어 블로그 글
- Google Sheets의 `Language` 컬럼에서 자동 인식

### 2. Claude 지원 (새로 추가됨)
- **Claude API 지원 완료** ✅
- `CLAUDE_API_KEY` Script Properties에 설정 필요
- Anthropic API 직접 호출 가능

### 3. 모델 추천

## 🎯 블로그 글 품질별 모델 추천 (2025년 최신)

### 🏆 최고 품질 (New!) - Claude 4.0
```
AI_PROVIDER: anthropic
AI_MODEL: claude-4-sonnet-20250514
```
- **장점**: 차세대 AI, 탁월한 창의성, 뛰어난 추론 능력
- **단점**: 중상급 비용 (~$5/1M tokens 예상)
- **추천 용도**: 프리미엄 콘텐츠, 복잡한 분석글 ⭐ **신규 기본값**

### 균형잡힌 고품질
```
AI_PROVIDER: openai
AI_MODEL: gpt-4o
```
- **장점**: 우수한 품질, JSON 모드, 안정성
- **단점**: 중간 비용 ($2.5/1M tokens)
- **추천 용도**: 일반 블로그 자동화

### 비용 효율적
```
AI_PROVIDER: openai
AI_MODEL: gpt-4o-mini
```
- **장점**: 저렴한 비용 ($0.15/1M tokens), 빠른 속도
- **단점**: 상대적으로 짧고 단순한 글
- **추천 용도**: 대량 생산, 테스트

### Claude 3.5 (여전히 우수)
```
AI_PROVIDER: anthropic
AI_MODEL: claude-3-5-sonnet-20241022
```
- **장점**: 뛰어난 장문 작성, 창의성, 한국어 지원
- **단점**: 중간 비용 ($3/1M tokens), JSON 모드 없음
- **추천 용도**: 깊이 있는 분석글, 한국어 콘텐츠

## 🔧 설정 방법

### OpenAI 사용 (추천)
```
Script Properties:
- AI_PROVIDER: openai
- AI_MODEL: gpt-4o
- AI_API_KEY: sk-your-openai-key
```

### Claude 사용 (장문에 최적)
```
Script Properties:
- AI_PROVIDER: anthropic
- AI_MODEL: claude-3-5-sonnet-20241022
- CLAUDE_API_KEY: your-claude-key
```

## 💰 비용 비교 (1M tokens 기준)

| 모델 | 입력 비용 | 출력 비용 | 품질 | 속도 |
|------|----------|----------|------|------|
| gpt-4o-mini | $0.15 | $0.60 | ⭐⭐⭐ | ⚡⚡⚡ |
| gpt-4o | $2.50 | $10.00 | ⭐⭐⭐⭐ | ⚡⚡ |
| claude-3-5-haiku | $0.25 | $1.25 | ⭐⭐⭐ | ⚡⚡⚡ |
| claude-3-5-sonnet | $3.00 | $15.00 | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| claude-3-opus | $15.00 | $75.00 | ⭐⭐⭐⭐⭐ | ⚡ |

## 🚀 현재 설정에서 개선사항

### 문제점:
- **GPT-5-mini**: 존재하지 않는 모델 사용 중
- **글 품질**: mini 모델로는 고품질 블로그 한계

### 권장 변경:
```javascript
// Script Properties에서 변경
AI_MODEL: gpt-4o        // gpt-5-mini에서 변경
AI_PROVIDER: openai     // 그대로 유지

// 또는 Claude로 전환 (한국어 콘텐츠에 특히 좋음)
AI_PROVIDER: anthropic
AI_MODEL: claude-3-5-sonnet-20241022
CLAUDE_API_KEY: your-claude-api-key
```

## 🌍 언어별 최적 모델

### 한국어 콘텐츠
1. **claude-3-5-sonnet** (최고)
2. **gpt-4o** (우수)
3. **gpt-4o-mini** (경제적)

### 영어 콘텐츠
1. **gpt-4o** (최고)
2. **claude-3-5-sonnet** (우수)
3. **gpt-4o-mini** (경제적)

## 🎯 용도별 추천

### 대량 자동화 (일 10개 이상)
- **gpt-4o-mini**: 비용 절약
- **claude-3-5-haiku**: Claude 선호시

### 고품질 콘텐츠 (일 1-3개)
- **gpt-4o**: 균형잡힌 선택
- **claude-3-5-sonnet**: 창의성 중시

### 프리미엄 콘텐츠 (주 1-2개)
- **claude-3-opus**: 최고 품질
- **gpt-4-turbo**: OpenAI 최고급

이제 Claude API도 지원하므로 원하는 모델을 자유롭게 선택할 수 있습니다! 🎉