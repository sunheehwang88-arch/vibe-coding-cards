// 학습 상태 저장 — localStorage 키 `vcc:v1` (spec 5.3)
// 모든 접근은 try/catch. 실패하면 ok:false를 돌려주고 앱은 메모리 상태로 계속 동작한다.

export const STORAGE_KEY = 'vcc:v1'
export const DAILY_NEW_OPTIONS = [3, 5, 8, 15]

export function createEmptyState() {
  return {
    version: 1,
    settings: { dailyNew: 5, focusStage: null },
    cards: {},
    selfMarks: {}, // { [cardId]: 'confused' | 'unsure' | 'mastered' }
    scenarioQuiz: {
      answers: {}, // { [qId]: { selectedIdx, isCorrect, timestamp } }
      wrongIds: [], // string[]
    },
    vsBattle: {
      answers: {}, // { [qId]: selectedIdx }
    },
    daily: { day: null, newIds: [] },
    streak: { count: 0, lastDay: null, freezeLeft: 1 },
    session: null,
    lastSummary: null,
    stats: { sessions: 0, totalMinutes: 0 },
  }
}

function getStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

// 저장된 값에 빠진 필드가 있어도 기본값으로 채운다 (스키마가 늘어날 때 대비).
function migrate(raw) {
  const base = createEmptyState()
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    settings: { ...base.settings, ...raw.settings },
    daily: { ...base.daily, ...raw.daily },
    streak: { ...base.streak, ...raw.streak },
    stats: { ...base.stats, ...raw.stats },
    cards: raw.cards ?? {},
    selfMarks: raw.selfMarks ?? {},
    scenarioQuiz: {
      ...base.scenarioQuiz,
      ...(raw.scenarioQuiz ?? {}),
      answers: raw.scenarioQuiz?.answers ?? {},
      wrongIds: raw.scenarioQuiz?.wrongIds ?? [],
    },
    vsBattle: {
      ...base.vsBattle,
      ...(raw.vsBattle ?? {}),
      answers: raw.vsBattle?.answers ?? {},
    },
  }
}

export function loadState() {
  const storage = getStorage()
  if (!storage) return { state: createEmptyState(), ok: false }
  try {
    const text = storage.getItem(STORAGE_KEY)
    return { state: migrate(text ? JSON.parse(text) : null), ok: true }
  } catch {
    return { state: createEmptyState(), ok: false }
  }
}

export function saveState(state) {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState() {
  const storage = getStorage()
  try {
    storage?.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
