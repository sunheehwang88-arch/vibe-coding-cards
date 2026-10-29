import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import Container from '../components/layout/Container.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import TermCard from '../components/TermCard.jsx'
import stages from '../data/stages.json'
import confusionBundles from '../data/confusionBundles.json'
import { useLearning } from '../state/learningContext.js'

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'essential', label: '필수 보완 6선' },
  { id: 'mark-confused', label: '헷갈림 표시' },
  { id: 'mark-unsure', label: '애매함 표시' },
  { id: 'mark-mastered', label: '완벽 이해' },
  { id: 'seen', label: '배운 카드' },
  { id: '1', label: 'Lv1' },
  { id: '2', label: 'Lv2' },
  { id: '3', label: 'Lv3' },
  { id: '4', label: 'Lv4' },
  { id: '5', label: 'Lv5' },
  { id: 'mastered', label: '마스터' },
  { id: 'confident', label: '확신 오답' },
  { id: 'wrong', label: '최근 오답' },
]

function matches(filter, cardState, card, lastWrong, selfMark) {
  if (filter === 'all') return true
  if (filter === 'essential') return Boolean(card.isEssentialUpdate)
  if (filter === 'mark-confused') return selfMark === 'confused'
  if (filter === 'mark-unsure') return selfMark === 'unsure'
  if (filter === 'mark-mastered') return selfMark === 'mastered'
  if (!cardState) return false
  if (filter === 'seen') return true
  if (filter === 'mastered') return cardState.mastered
  if (filter === 'confident') return cardState.confidentMiss
  if (filter === 'wrong') return lastWrong.includes(card.id)
  return !cardState.mastered && cardState.level === Number(filter)
}

function matchesBundle(bundle, card) {
  if (!bundle || bundle === 'all') return true
  if (bundle === 'essential-6') return Boolean(card.isEssentialUpdate)
  return card.confusionGroups?.includes(bundle) ?? false
}

function matchesQuery(query, card) {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const hay = [
    card.term,
    card.termFull,
    card.chip,
    card.roleBadge,
    card.definition,
    card.analogy,
    card.whenToUse,
    card.vsDiff,
    card.example,
    ...(card.aliases ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

// 필터는 pill이 아니라 밑줄 탭 (DESIGN.md 0장 금지 목록)
function FilterTabs({ value, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        role="tablist"
        aria-label="레벨 및 상태 필터"
        className="flex gap-5 border-b border-border"
      >
        {FILTERS.map((f) => {
          const active = value === f.id
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(f.id)}
              className={`-mb-px h-10 shrink-0 border-b text-small font-medium whitespace-nowrap transition-colors duration-150 ${
                active ? 'border-fg text-fg' : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Collection() {
  const { state, cards, update } = useLearning()
  const [params, setParams] = useSearchParams()
  const [flipped, setFlipped] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const [unlockAllView, setUnlockAllView] = useState(true)

  const filter = params.get('filter') ?? 'all'
  const stage = Number(params.get('stage')) || 0
  const bundle = params.get('bundle') ?? 'all'
  const lastWrong = state.lastSummary?.wrongIds ?? []
  const selfMarks = state.selfMarks ?? {}

  function setParam(key, value, empty) {
    const next = new URLSearchParams(params)
    if (value === empty) next.delete(key)
    else next.set(key, String(value))
    setParams(next, { replace: true })
  }

  function toggle(id) {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function setSelfMark(cardId, status) {
    update((prev) => {
      const nextMarks = { ...(prev.selfMarks ?? {}) }
      if (!status) delete nextMarks[cardId]
      else nextMarks[cardId] = status
      return { ...prev, selfMarks: nextMarks }
    })
  }

  const visible = cards.filter(
    (c) =>
      (!stage || c.stage === stage) &&
      matchesBundle(bundle, c) &&
      matches(filter, state.cards[c.id], c, lastWrong, selfMarks[c.id]) &&
      matchesQuery(query, c),
  )

  function flipAllVisible() {
    setFlipped((prev) => {
      const allFlipped = visible.every((c) => prev.has(c.id))
      if (allFlipped) return new Set()
      return new Set(visible.map((c) => c.id))
    })
  }

  const seenCount = Object.keys(state.cards).length
  const confusedCount = Object.values(selfMarks).filter((v) => v === 'confused').length
  const unsureCount = Object.values(selfMarks).filter((v) => v === 'unsure').length
  const masteredMarkCount = Object.values(selfMarks).filter((v) => v === 'mastered').length

  return (
    <Container className="pb-16">
      <PageHeader
        title="개념 카드 & 도감"
        description={`전체 ${cards.length}장 · 학습 세션 진행 ${seenCount}장 · 헷갈림 표시 ${confusedCount}장 · 애매함 ${unsureCount}장 · 완벽 이해 ${masteredMarkCount}장. 카드를 누르면 뒷면(비유·언제 쓰는지·VS 결정적 차이)을 볼 수 있어요.`}
      />

      {/* 검색창 및 4대 헷갈리는 묶음 필터 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            strokeWidth={1.5}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="용어, 한 줄 비유, 언제 쓰는지, VS 차이 검색 (예: REA, 인블로그, Ahrefs, 증류, 백링크, VPS, MCP...)"
            aria-label="용어 검색"
            className="h-10 w-full rounded border border-border bg-surface pr-9 pl-10 text-small text-fg transition-colors duration-150 placeholder:text-fg-subtle hover:border-border-strong"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-fg-subtle hover:text-fg"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-small text-fg-muted">
          <span className="shrink-0 font-mono text-label">4대 혼동 묶음</span>
          <select
            value={bundle}
            onChange={(e) => setParam('bundle', e.target.value, 'all')}
            className="h-10 rounded border border-border bg-surface px-3 text-small text-fg transition-colors duration-150 hover:border-border-strong"
          >
            {confusionBundles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.short}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-small text-fg-muted">
          <span className="shrink-0 font-mono text-label">계층/단계</span>
          <select
            value={stage}
            onChange={(e) => setParam('stage', Number(e.target.value), 0)}
            className="h-10 rounded border border-border bg-surface px-3 text-small text-fg transition-colors duration-150 hover:border-border-strong"
          >
            <option value={0}>전체 단계 ({cards.length})</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {String(s.id).padStart(2, '0')} {s.name} ({s.cardCount})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 4대 헷갈리는 계층 빠른 탭 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {confusionBundles.map((b) => {
          const active = bundle === b.id
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setParam('bundle', b.id, 'all')}
              className={`h-8 rounded border px-3 text-caption font-medium transition-colors duration-150 ${
                active
                  ? 'border-fg bg-fg text-bg'
                  : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
              }`}
            >
              {b.short}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <FilterTabs value={filter} onChange={(v) => setParam('filter', v, 'all')} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={flipAllVisible}
            className="h-8 rounded border border-border bg-surface px-3 text-caption font-medium text-fg-muted transition-colors duration-150 hover:border-border-strong hover:text-fg"
          >
            현재 카드 모두 뒤집기
          </button>
          <button
            type="button"
            onClick={() => setUnlockAllView((v) => !v)}
            className="h-8 rounded border border-border bg-surface px-3 text-caption font-medium text-fg-muted transition-colors duration-150 hover:border-border-strong hover:text-fg"
          >
            {unlockAllView ? '미학습 카드 잠금 보기' : '전체 카드 열람 허용'}
          </button>
        </div>
      </div>

      <p className="mt-4 font-mono text-label text-fg-muted">
        검색 결과 {visible.length}장 · 카드를 클릭하면 앞/뒷면이 뒤집히고, 하단 버튼으로 [헷갈림 /
        애매함 / 완벽 이해] 상태를 기록할 수 있어요.
      </p>

      {visible.length ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((card) => {
            const cardState = state.cards[card.id]
            return (
              <li key={card.id}>
                <TermCard
                  card={card}
                  cardState={cardState}
                  locked={!unlockAllView && !cardState}
                  flipped={flipped.has(card.id)}
                  onFlip={() => toggle(card.id)}
                  selfMark={selfMarks[card.id] ?? null}
                  onMark={(status) => setSelfMark(card.id, status)}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="조건에 맞는 카드가 없어요"
            description="다른 필터나 검색어를 선택해 보세요."
          />
        </div>
      )}
    </Container>
  )
}
