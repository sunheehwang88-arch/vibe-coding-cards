import { Lock } from 'lucide-react'
import { CARD_ICONS } from './cardIcons.js'
import LevelDots from './LevelDots.jsx'
import StageLabel from './ui/StageLabel.jsx'
import Divider from './ui/Divider.jsx'

const SELF_MARK_OPTIONS = [
  { id: 'confused', label: '헷갈림', dotClass: 'bg-red', activeClass: 'border-red text-red' },
  { id: 'unsure', label: '애매함', dotClass: 'bg-amber', activeClass: 'border-amber text-amber' },
  {
    id: 'mastered',
    label: '완벽 이해',
    dotClass: 'bg-green',
    activeClass: 'border-green text-green',
  },
]

function CardHeader({ card, cardState }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <StageLabel stage={card.stage} />
      <div className="flex items-center gap-2">
        {card.isEssentialUpdate && (
          <span className="rounded-sm border border-border-strong px-1.5 py-0.5 font-mono text-label text-fg">
            필수보완
          </span>
        )}
        {cardState && <LevelDots level={cardState.level} mastered={cardState.mastered} />}
      </div>
    </div>
  )
}

function SelfMarkBar({ selfMark, onMark }) {
  if (!onMark) return null
  return (
    <div
      className="mt-4 grid grid-cols-3 gap-1.5 border-t border-border pt-3"
      onClick={(e) => e.stopPropagation()}
    >
      {SELF_MARK_OPTIONS.map((opt) => {
        const active = selfMark === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={(e) => {
              e.stopPropagation()
              onMark(active ? null : opt.id)
            }}
            className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-sm border text-caption font-medium transition-colors duration-150 ${
              active
                ? `${opt.activeClass} bg-bg-hover`
                : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
            }`}
          >
            <span aria-hidden="true" className={`size-2 rounded-full ${opt.dotClass}`} />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Front({ card, cardState, locked, selfMark, onMark }) {
  const Icon = CARD_ICONS[card.icon]
  return (
    <div className="flex h-full flex-col">
      <CardHeader card={card} cardState={locked ? null : cardState} />
      <div className="mt-6 flex items-start gap-3">
        {locked ? (
          <Lock
            size={20}
            strokeWidth={1.5}
            className="mt-1.5 shrink-0 text-fg-subtle"
            aria-hidden="true"
          />
        ) : (
          Icon && (
            <Icon
              size={20}
              strokeWidth={1.5}
              className="mt-1.5 shrink-0 text-fg-muted"
              aria-hidden="true"
            />
          )
        )}
        <div className="min-w-0">
          <h3 className={`text-h2 font-semibold break-keep ${locked ? 'text-fg-subtle' : ''}`}>
            {card.term}
          </h3>
          {card.termFull && <p className="mt-1 text-caption text-fg-subtle">{card.termFull}</p>}
        </div>
      </div>

      {!locked && card.analogy && (
        <p className="mt-4 text-small text-fg-muted break-keep">{card.analogy}</p>
      )}

      <p className="mt-auto pt-6 font-mono text-label text-fg-muted">
        {locked ? '아직 배우지 않은 카드예요' : card.roleBadge || card.chip}
      </p>
      {!locked && <SelfMarkBar selfMark={selfMark} onMark={onMark} />}
    </div>
  )
}

function Row({ label, children, highlight = false }) {
  if (!children) return null
  return (
    <div className="flex gap-3 py-2">
      <dt
        className={`w-16 shrink-0 pt-0.5 font-mono text-label ${
          highlight ? 'text-fg' : 'text-fg-subtle'
        }`}
      >
        {label}
      </dt>
      <dd className={`text-small break-keep ${highlight ? 'text-fg' : 'text-fg-muted'}`}>
        {children}
      </dd>
    </div>
  )
}

function Back({ card, cardState, selfMark, onMark }) {
  return (
    <div className="flex h-full flex-col">
      <CardHeader card={card} cardState={cardState} />
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-h3 font-semibold">{card.term}</h3>
        <span className="font-mono text-label text-fg-subtle">{card.roleBadge || card.chip}</span>
      </div>
      <p className="mt-2 text-body-lg break-keep">{card.definition}</p>
      <Divider className="mt-4" />
      <dl className="mt-2 flex-1">
        <Row label="한줄 비유" highlight>
          {card.analogy}
        </Row>
        <Row label="언제 쓰나">{card.whenToUse || card.example}</Row>
        {(card.vsDiff || card.contrast) && (
          <Row label="VS 차이" highlight>
            {card.vsDiff || card.contrast}
          </Row>
        )}
        <Row label="AI에게">{card.vibeTip}</Row>
      </dl>
      <SelfMarkBar selfMark={selfMark} onMark={onMark} />
    </div>
  )
}

/**
 * 용어 카드 (DESIGN.md 8장) — 1px border, 모서리 8, 그림자 없음.
 * onFlip을 주면 카드 전체가 뒤집기 버튼이 된다. locked면 용어만 보이고 뒤집히지 않는다.
 */
export default function TermCard({
  card,
  cardState,
  flipped = false,
  onFlip,
  locked = false,
  selfMark = null,
  onMark = null,
}) {
  const interactive = Boolean(onFlip) && !locked
  const borderTone =
    selfMark === 'confused'
      ? 'border-red'
      : selfMark === 'unsure'
        ? 'border-amber'
        : selfMark === 'mastered'
          ? 'border-green'
          : 'border-border'

  const faceClass = `col-start-1 row-start-1 rounded-md border ${borderTone} bg-surface p-6 backface-hidden transition-colors duration-150 ${
    interactive ? 'group-hover:border-border-strong' : ''
  }`

  const body = (
    <div
      className={`grid transform-3d transition-transform duration-300 ease-standard ${
        flipped ? 'rotate-y-180' : ''
      }`}
    >
      <div className={faceClass} aria-hidden={flipped}>
        <Front
          card={card}
          cardState={cardState}
          locked={locked}
          selfMark={selfMark}
          onMark={onMark}
        />
      </div>
      <div className={`${faceClass} rotate-y-180`} aria-hidden={!flipped}>
        {!locked && <Back card={card} cardState={cardState} selfMark={selfMark} onMark={onMark} />}
      </div>
    </div>
  )

  if (!interactive) return <div className="perspective-distant">{body}</div>

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFlip()
        }
      }}
      aria-label={flipped ? `${card.term} 앞면 보기` : `${card.term} 뒷면 보기`}
      className="group block w-full cursor-pointer rounded-md text-left perspective-distant"
    >
      {body}
    </div>
  )
}
