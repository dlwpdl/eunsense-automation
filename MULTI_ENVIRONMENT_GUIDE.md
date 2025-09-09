# 💻 다중 환경 사용 가이드

## ✅ 문제 해결 완료!

이제 **개인 랩탑과 회사 랩탑 사이**를 자유롭게 전환하며 작업할 수 있습니다!

## 🔧 해결된 사항

### 1. 자동 경로 설정
- **상대 경로 사용**: `"rootDir": "./src"` 
- **어떤 컴퓨터든 동일하게 작동**

### 2. 스마트 동기화 스크립트
- **자동 환경 감지**: 현재 사용자와 운영체제 자동 인식
- **경로 자동 설정**: `.clasp.json` 자동 업데이트
- **크로스 플랫폼 지원**: Windows, Mac, Linux 모두 지원

## 🚀 이제 이렇게 사용하세요

### 어떤 랩탑에서든 똑같이:

```bash
# 코드 업로드 (로컬 → Google Apps Script)
npm run sync:push

# 코드 다운로드 (Google Apps Script → 로컬)  
npm run sync:pull

# 실시간 동기화 (파일 변경 감지)
npm run sync:watch

# 프로젝트 정보 확인
npm run sync:info

# Google Apps Script 편집기 열기
npm run sync:open

# 실행 로그 확인
npm run sync:logs
```

## 📋 다중 환경 작업 워크플로우

### 개인 랩탑에서 작업:
```bash
# 1. 최신 코드 다운로드
npm run sync:pull

# 2. 코드 수정 작업

# 3. 업로드
npm run sync:push
```

### 회사 랩탑으로 전환:
```bash
# 1. 최신 코드 다운로드 (개인 랩탑에서 작업한 내용)
npm run sync:pull

# 2. 코드 수정 작업

# 3. 업로드
npm run sync:push
```

### 실시간 동기화 (권장):
```bash
# 파일 변경 감지 및 자동 업로드
npm run sync:watch
```

## 🎯 환경별 자동 설정

### 개인 랩탑 (예시):
```
📊 환경 정보:
  운영체제: darwin
  사용자: eliot
  홈 디렉토리: /Users/eliot
  작업 디렉토리: /Users/eliot/Desktop/유/eunsense-automation
```

### 회사 랩탑 (예시):
```
📊 환경 정보:
  운영체제: win32
  사용자: corporate-user
  홈 디렉토리: C:\Users\corporate-user
  작업 디렉토리: C:\work\eunsense-automation
```

**→ 두 환경 모두 동일한 명령어로 작동!**

## 💡 추가 기능

### Git과 함께 사용:
```bash
# 1. Git에서 최신 코드 받기
git pull

# 2. Google Apps Script에서도 최신 코드 받기
npm run sync:pull

# 3. 작업 후 두 곳 모두에 업로드
git add .
git commit -m "작업 내용"
git push

npm run sync:push
```

### 백업 및 복구:
```bash
# Google Apps Script에서 로컬로 백업
npm run sync:pull

# 로컬에서 Google Apps Script로 복구
npm run sync:push
```

## 🔒 로그인 관리

### 각 랩탑에서 최초 1회만:
```bash
# Google 계정으로 로그인
clasp login
```

이후로는 자동으로 동기화됩니다!

## 🎉 이제 걱정 없이:

- ✅ **개인 랩탑에서 작업** → `npm run sync:push`
- ✅ **회사 랩탑으로 이동** → `npm run sync:pull`
- ✅ **회사에서 작업** → `npm run sync:push`  
- ✅ **집에서 작업** → `npm run sync:pull`

**매번 경로를 바꿀 필요가 전혀 없습니다!** 🚀