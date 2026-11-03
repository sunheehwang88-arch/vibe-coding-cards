---
name: vibe-cards-term-adder
description: >-
  Automatically deduplicates and registers new AI, development, and automation
  terms into the user's vibe-coding-cards learning game website
  (https://sunheehwang88-arch.github.io/vibe-coding-cards/). Use this skill
  whenever the user sends new terms, vocabulary lists, notes, or asks to add
  words to their card game site. It ignores any duplicate terms that already
  exist and registers only brand-new terms with full beginner-friendly analogies,
  VS comparisons, and quiz data.
---

# 바이브코딩 용어카드 신규 단어 자동 등록 스킬 (중복 무시)

사용자가 새로운 AI·개발·자동화 용어나 단어 목록(또는 대화·메모)을 보내며 카드게임에 등록해 달라고 요청할 때 사용하는 스킬이다.

## 핵심 원칙
1. **중복 단어는 무조건 건너뛴다 (Skip Duplicates)**:
   - 기존 `cards.json`에 이미 등록된 단어(`id`, `term`, `termFull`, `aliases` 대소문자·공백·특수문자 무시 비교)는 **절대 중복 등록하거나 덮어쓰지 않고 무시**한다.
   - 사용자에게 결과를 보고할 때 **"중복으로 제외된 단어 N개"**와 **"새로 등록된 단어 M개"**를 명확히 구분해 알려준다.
2. **새 단어만 초보자 맞춤형 카드로 풍부하게 생성한다**:
   - 단순 사전적 정의가 아니라 `[소속 단계(1~22)]`, `[초보자용 한 줄 비유(analogy)]`, `[쉬운 설명(definition)]`, `[언제 쓰는지(whenToUse)]`, `[헷갈리는 개념과의 결정적 차이(vsDiff / contrast)]`, `[AI에게 이렇게 말해보세요(vibeTip)]`, `[상황 퀴즈(situation)]`를 모두 채워서 생성한다.
   - ⚠️ **주의 (`tests/data.test.js` 규칙)**: Q3 문제 정답 노출 방지를 위해 `definition`과 `analogy` 문장 안에는 `term`(용어 이름 그대로)이 포함되지 않도록 작성한다(스크립트가 2차로 자동 치환함).
   - ⚠️ **주의**: 자주 바뀌는 세부 요금제 금액이나 일시적 스펙 수치를 단정해서 문제로 만들지 않는다.

---

## 작업 절차 (Step-by-Step)

### 1단계: 중복 단어 사전 조회 (`--check`)
사용자가 보낸 단어 목록을 먼저 스크립트로 조회해 어떤 단어가 중복이고 어떤 단어가 새 단어인지 확인한다.

```powershell
node "C:\Users\sunhe\.gemini\config\skills\vibe-cards-term-adder\scripts\add_terms.cjs" --check "단어1" "단어2" "단어3"
```

- 출력된 JSON의 `duplicates`에 있는 단어들은 건너뛰고, `newTerms`에 있는 단어들만 2단계에서 카드 데이터로 작성한다.
- 만약 모든 단어가 이미 존재한다면(`newTerms`가 비어 있다면), 파일 수정 없이 사용자에게 "보내주신 단어들은 이미 모두 카드게임(N단계)에 등록되어 있어 건너뛰었습니다"라고 안내하고 종료한다.

### 2단계: 새 단어 JSON 데이터 작성
`newTerms`에 해당하는 새 단어들만 골라 임시 JSON 파일(예: `<artifactDir>/scratch/new_terms_payload.json`)을 작성한다.

```json
[
  {
    "term": "용어 이름",
    "termFull": "영문 전체 이름 또는 한 줄 역할 요약",
    "aliases": ["별칭1", "영문약어"],
    "stage": 10,
    "icon": "Bot",
    "chip": "역할 배지 텍스트 (이모지 없이)",
    "roleBadge": "역할 배지 텍스트 (이모지 없이)",
    "definition": "초보자가 바로 이해할 수 있는 쉬운 설명 (용어 이름 직접 포함 금지)",
    "analogy": "초보자용 한 줄 비유 (이모지 및 용어 이름 직접 포함 금지)",
    "example": "실제 활용 예시 한 줄",
    "whenToUse": "실무에서 언제 이 도구/개념을 쓰는지 설명",
    "vsDiff": "VS 헷갈리는 개념: 두 개념의 결정적 역할 차이",
    "contrast": "헷갈리는 짝과의 한 줄 비교",
    "confusableWith": ["기존카드id"],
    "confusionGroups": ["g1-model-agent-app"],
    "vibeTip": "AI에게 지시할 때 바로 쓸 수 있는 프롬프트 팁"
  }
]
```

#### 단계(`stage`) 번호 기준표 (1~22단계)
- `1`: 웹 동작 원리 / `2`: 프론트엔드 / `3`: 백엔드·서버 / `4`: 데이터베이스·API / `5`: 인프라·배포 / `6`: 앱 개발 / `7`: AI·프롬프트 / `8`: 개발 도구·협업 / `9`: 파이썬 로컬앱
- `10`: AI 두뇌와 에이전트 제품 / `11`: 실행 위치와 터미널 (Local·VPS·원격) / `12`: 연결 규격·계정·권한 (API·MCP·BYOK) / `13`: 브라우저 제어와 웹 자동화 / `14`: 비용·속도·맥락 관리 / `15`: 워크플로 자동화와 연락 채널 / `16`: GitHub와 코드 버전 관리 심화 / `17`: 스킬·옵시디언·지식관리 (RAG) / `18`: 웹·앱 개발과 스키마 설계 / `19`: 배포·호스팅·백엔드 DB 실전 / `20`: 검색 노출(SEO·인블로그·Ahrefs·백링크) / `21`: 숏폼·콘텐츠 제작 자동화 공정 / `22`: 운영 기준·검수(QA)·최종 승인

#### 4대 혼동 계층(`confusionGroups`) 태그 (해당 시 추가)
- `"g1-model-agent-app"` (① 모델 vs 에이전트 vs 앱)
- `"g2-local-vps-remote"` (② 로컬 vs VPS vs 원격)
- `"g3-api-mcp-cli"` (③ API vs MCP vs CLI)
- `"g4-github-deploy-db"` (④ GitHub vs 배포 vs DB)
- `"g5-backlink-seo-obsidian"` (⑤ 백링크·SEO·스키마)

### 3단계: 등록 스크립트 실행 (`add_terms.cjs`)
작성한 JSON 파일을 스크립트에 전달해 `cards.json`과 `stages.json`을 안전하게 업데이트한다. (스크립트 내부에서도 한 번 더 중복 검사를 수행해 중복 단어는 자동으로 무시한다.)

```powershell
node "C:\Users\sunhe\.gemini\config\skills\vibe-cards-term-adder\scripts\add_terms.cjs" "<new_terms_payload.json 경로>"
```

### 4단계: 테스트 · 빌드 · GitHub 자동 반영
새 카드가 추가되었다면(`addedCount > 0`), 반드시 Vitest 테스트와 Lint, 단일 파일 빌드를 실행하고 GitHub에 푸시해 실서버까지 반영한다.

```powershell
Set-Location "C:\Users\sunhe\Downloads\vibe-coding-cards\github-repo"
npm test
npm run lint
npm run build
npm run build:share
Copy-Item "share/index.html" "C:\Users\sunhe\Downloads\vibe-coding-cards\vibe-coding-cards-v2.html" -Force
git add src/data/cards.json src/data/stages.json tests/data.test.js
git commit -m "[data] 신규 용어 카드 추가 (중복 제외)"
git push origin main
```
*(사용자가 로컬에서만 반영하길 원하거나 푸시하지 말라고 한 경우에만 `git push`를 생략한다.)*
