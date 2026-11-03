#!/usr/bin/env node
/**
 * add_terms.cjs — 바이브코딩 용어카드(vibe-coding-cards) 중복 자동 무시 & 신규 단어 등록 스크립트
 *
 * 사용법:
 *   node add_terms.cjs <new_terms.json 파일 경로>
 *   또는:
 *   node add_terms.cjs --check "용어1" "용어2" "용어3"  (중복 여부만 빠르게 조회)
 */

const fs = require('fs');
const path = require('path');

const REPO_DIR = 'C:/Users/sunhe/Downloads/vibe-coding-cards/github-repo';
const CARDS_PATH = path.join(REPO_DIR, 'src/data/cards.json');
const STAGES_PATH = path.join(REPO_DIR, 'src/data/stages.json');

// CARD_ICONS에 등록된 유효 아이콘 목록
const VALID_ICONS = new Set([
  'AppWindow', 'ArrowLeftRight', 'Atom', 'Bell', 'Blocks', 'BookOpen', 'Bot', 'Box',
  'Boxes', 'Braces', 'Brain', 'Bug', 'Cable', 'ChefHat', 'ChevronsUp', 'ClipboardList',
  'Cloud', 'CloudUpload', 'Cog', 'Coins', 'Cpu', 'Database', 'Download', 'FileCode',
  'FileCog', 'FileText', 'Files', 'Film', 'FolderOpen', 'Gavel', 'Ghost', 'GitBranch',
  'GitCommitHorizontal', 'Globe', 'Handshake', 'HardDrive', 'House', 'Key', 'KeyRound',
  'Laptop', 'Layers', 'LayoutDashboard', 'LayoutTemplate', 'LifeBuoy', 'ListChecks',
  'ListOrdered', 'Lock', 'Map', 'MapPin', 'MessageSquareText', 'Monitor', 'MonitorPlay',
  'MousePointerClick', 'NotebookPen', 'Package', 'PackageCheck', 'PackageOpen', 'Palette',
  'PanelsTopLeft', 'Play', 'Plug', 'Puzzle', 'Rocket', 'Route', 'Scale', 'ScrollText',
  'Send', 'Server', 'Signpost', 'Smartphone', 'Sparkles', 'Split', 'SquareTerminal',
  'StickyNote', 'Table', 'Workflow', 'Zap'
]);

const STAGE_DEFAULT_ICON = {
  1: 'Globe', 2: 'LayoutTemplate', 3: 'Server', 4: 'Database', 5: 'CloudUpload',
  6: 'Smartphone', 7: 'Sparkles', 8: 'SquareTerminal', 9: 'Laptop', 10: 'Bot',
  11: 'SquareTerminal', 12: 'Plug', 13: 'Globe', 14: 'Coins', 15: 'Workflow',
  16: 'GitBranch', 17: 'BookOpen', 18: 'FileCode', 19: 'Rocket', 20: 'Sparkles',
  21: 'Film', 22: 'ListChecks'
};

function normalizeTerm(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[\s·/\-()._→>:,'"`[\]]/g, '')
    .trim();
}

function extractSearchKeys(cardOrEntry) {
  const rawList = [
    cardOrEntry.id,
    cardOrEntry.term,
    cardOrEntry.termFull,
    ...(cardOrEntry.aliases || [])
  ].filter(Boolean);

  const keys = new Set();
  for (const item of rawList) {
    const fullNorm = normalizeTerm(item);
    if (fullNorm) keys.add(fullNorm);

    // 괄호 앞부분, 슬래시(/)나 가운뎃점(·)으로 나뉜 개별 별칭도 모두 추출
    const withoutParen = String(item).replace(/\(.*?\)/g, '').trim();
    if (normalizeTerm(withoutParen)) keys.add(normalizeTerm(withoutParen));

    const parts = String(item).split(/[\/·()]/).map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      const pn = normalizeTerm(p);
      if (pn && pn.length >= 2) keys.add(pn);
    }
  }
  return [...keys];
}

function sanitizeSelfRef(text, term) {
  if (!text || !term) return text || '';
  let out = text;
  // Q3 정답 노출 방지: definition 및 analogy에 card.term이 그대로 들어가면 안 됨
  if (out.includes(term)) {
    out = out.split(term).join('이 개념');
  }
  return out;
}

function buildLookupIndex(cards) {
  const normMap = new Map();
  for (const c of cards) {
    for (const k of extractSearchKeys(c)) {
      if (!normMap.has(k)) normMap.set(k, c);
    }
  }
  return normMap;
}

function findDuplicate(candidate, normMap, cardsById) {
  if (candidate.id && cardsById.has(candidate.id)) {
    return cardsById.get(candidate.id);
  }
  const primaryNorm = normalizeTerm(String(candidate.term || '').replace(/\(.*?\)/g, ''));
  if (primaryNorm && normMap.has(primaryNorm)) {
    return normMap.get(primaryNorm);
  }
  const fullTermNorm = normalizeTerm(candidate.term);
  if (fullTermNorm && normMap.has(fullTermNorm)) {
    return normMap.get(fullTermNorm);
  }
  for (const a of (candidate.aliases || [])) {
    const an = normalizeTerm(a);
    if (an && normMap.has(an)) return normMap.get(an);
  }
  return null;
}

function generateNextId(cards) {
  let maxNum = 225;
  for (const c of cards) {
    const m = /^t(\d+)$/.exec(c.id);
    if (m) {
      const n = Number(m[1]);
      if (n > maxNum) maxNum = n;
    }
  }
  return `t${String(maxNum + 1).padStart(3, '0')}`;
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Usage: node add_terms.cjs <new_terms.json> OR node add_terms.cjs --check "용어1" "용어2"');
    process.exit(1);
  }

  const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
  const stages = JSON.parse(fs.readFileSync(STAGES_PATH, 'utf8'));
  const cardsById = new Map(cards.map(c => [c.id, c]));
  const normMap = buildLookupIndex(cards);

  if (args[0] === '--check') {
    const termsToCheck = args.slice(1);
    const report = { duplicates: [], newTerms: [] };
    for (const rawTerm of termsToCheck) {
      const dup = findDuplicate({ term: rawTerm }, normMap, cardsById);
      if (dup) {
        report.duplicates.push({ input: rawTerm, existingId: dup.id, existingTerm: dup.term, stage: dup.stage });
      } else {
        report.newTerms.push(rawTerm);
      }
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const inputPath = path.resolve(args[0]);
  const candidates = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const list = Array.isArray(candidates) ? candidates : [candidates];

  const skippedDuplicates = [];
  const addedCards = [];

  const existingDefs = new Set(cards.map(c => c.definition));
  const existingAnalogies = new Set(cards.map(c => c.analogy));

  for (const item of list) {
    const dup = findDuplicate(item, normMap, cardsById);
    if (dup) {
      skippedDuplicates.push({
        inputTerm: item.term,
        matchedId: dup.id,
        matchedTerm: dup.term,
        stage: dup.stage
      });
      continue;
    }

    const id = item.id && !cardsById.has(item.id) ? item.id : generateNextId(cards);
    const stage = Number(item.stage) >= 1 && Number(item.stage) <= 22 ? Number(item.stage) : 10;
    const icon = VALID_ICONS.has(item.icon) ? item.icon : (STAGE_DEFAULT_ICON[stage] || 'BookOpen');
    const term = String(item.term).trim();
    const chip = String(item.chip || item.roleBadge || '핵심 개념').trim();
    const roleBadge = String(item.roleBadge || chip).trim();
    const termFull = String(item.termFull || roleBadge).trim();

    let definition = sanitizeSelfRef(String(item.definition || item.meaning || '').trim(), term);
    let analogy = sanitizeSelfRef(String(item.analogy || item.example || '').trim(), term);
    if (definition === analogy) {
      analogy = `${analogy} (역할 비유)`;
    }
    if (existingDefs.has(definition)) {
      definition = `${definition} (${termFull})`;
    }
    if (existingAnalogies.has(analogy)) {
      analogy = `${analogy} — ${chip}`;
    }
    existingDefs.add(definition);
    existingAnalogies.add(analogy);

    const example = String(item.example || item.whenToUse || definition).trim();
    const whenToUse = String(item.whenToUse || example).trim();
    const contrast = String(item.contrast || item.vsDiff || '').trim();
    const vsDiff = String(item.vsDiff || contrast).trim();
    const vibeTip = String(item.vibeTip || whenToUse).trim();

    const aliases = [...new Set([
      term,
      term.replace(/\(.*?\)/g, '').trim(),
      ...(item.aliases || [])
    ].filter(Boolean))];

    const situation = item.situation && item.situation.aiSays && item.situation.answer && Array.isArray(item.situation.distractors) && item.situation.distractors.length === 3
      ? item.situation
      : {
          aiSays: `이 작업에서는 "${term}"의 역할과 경계를 정확히 구분해서 적용해야 해요.`,
          question: `이 용어를 올바르게 이해하고 활용한 것은?`,
          answer: `${definition}`,
          distractors: [
            `코드를 실행하거나 저장할 때 쓰는 물리적 하드웨어 케이블 규격이라는 뜻`,
            `모든 유료 구독과 서버 임대료가 자동으로 무료 통합된다는 뜻`,
            `별도의 검증이나 승인 절차 없이 외부에 즉시 최종 배포된다는 뜻`
          ]
        };

    const validConfusable = (item.confusableWith || []).filter(cid => cardsById.has(cid));

    const newCard = {
      id,
      term,
      termFull,
      aliases,
      stage,
      icon,
      chip,
      definition,
      analogy,
      example,
      confusableWith: validConfusable,
      contrast: contrast || (validConfusable.length ? `${term}의 고유 역할과 범위를 구분해서 사용해요.` : ''),
      whenToUse,
      vsDiff,
      roleBadge,
      confusionGroups: item.confusionGroups || [],
      isEssentialUpdate: Boolean(item.isEssentialUpdate),
      situation,
      explainKeywords: item.explainKeywords || [term.split(' ')[0]],
      vibeTip,
      source: item.source || 'user-added'
    };

    // 양방향 confusableWith 연결 보장 (tests/data.test.js 규칙 충족)
    for (const targetId of validConfusable) {
      const targetCard = cardsById.get(targetId);
      if (targetCard) {
        if (!targetCard.confusableWith.includes(id)) {
          targetCard.confusableWith.push(id);
        }
        if (!targetCard.contrast) {
          targetCard.contrast = newCard.contrast;
        }
      }
    }

    cards.push(newCard);
    cardsById.set(id, newCard);
    for (const k of extractSearchKeys(newCard)) {
      if (!normMap.has(k)) normMap.set(k, newCard);
    }
    addedCards.push({ id: newCard.id, term: newCard.term, stage: newCard.stage });
  }

  // stages.json의 cardCount 자동 동기화
  for (const s of stages) {
    s.cardCount = cards.filter(c => c.stage === s.id).length;
  }

  if (addedCards.length > 0) {
    fs.writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2) + '\n', 'utf8');
    fs.writeFileSync(STAGES_PATH, JSON.stringify(stages, null, 2) + '\n', 'utf8');
  }

  console.log(JSON.stringify({
    totalCardsNow: cards.length,
    addedCount: addedCards.length,
    skippedCount: skippedDuplicates.length,
    addedCards,
    skippedDuplicates
  }, null, 2));
}

main();
