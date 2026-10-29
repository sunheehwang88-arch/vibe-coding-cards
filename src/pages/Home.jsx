import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import Container from '../components/layout/Container.jsx'
import Divider from '../components/ui/Divider.jsx'
import StageDot from '../components/ui/StageDot.jsx'
import Button from '../components/ui/Button.jsx'
import { buttonClass } from '../components/ui/buttonClass.js'
import stages from '../data/stages.json'
import confusionBundles from '../data/confusionBundles.json'
import { useLearning } from '../state/learningContext.js'
import { activeSession, isSessionFinished, planToday, startSession } from '../lib/session.js'
import { countDueTomorrow, countMastered, retentionRate, seenCountByStage } from '../lib/stats.js'
import { currentStreak } from '../lib/streak.js'

const CORE_MODES = [
  {
    to: '/collection',
    step: 'MODE 01',
    title: '개념 카드 & 도감 모드',
    desc: '검색, 계층·4대 혼동 묶음 필터, 한 줄 비유·VS 차이 확인 및 [헷갈림/애매함/완벽 이해] 체크',
  },
  {
    to: '/vs',
    step: 'MODE 02',
    title: '헷갈리는 개념 VS 대결 모드',
    desc: '4대 혼동 계층과 SEO 백링크 vs 옵시디언 백링크를 1:1 · 1:1:1 문제와 비교표로 격파',
  },
  {
    to: '/quiz',
    step: 'MODE 03',
    title: '실전 업무 상황 퀴즈 모드',
    desc: '실무 상황에서 알맞은 도구를 고르는 4지선다 퀴즈와 오답 시 구체적인 비교 해설 제공',
  },
  {
    to: '/review',
    step: 'MODE 04',
    title: '오답 노트 & 약점 복습 모드',
    desc: '퀴즈에서 틀린 문제와 내가 헷갈림 표시한 카드만 자동으로 모아 다시 풀기 (LocalStorage 저장)',
  },
]

// 등급 칭호 — 마스터 카드 수 기준 (PRD 5.3)
function rankTitle(mastered, total) {
  if (mastered >= total) return '시스템 구조 마스터'
  if (mastered >= 30) return '개발자와 대화 가능'
  if (mastered >= 10) return 'AI 말귀가 트이는 중'
  return null
}

// 통계는 카드가 아니라 구분선으로 나눈 칸 (DESIGN.md 16장)
function statCellClass(i) {
  return [
    'border-border py-6',
    i % 2 ? 'border-l pl-4' : 'pr-4',
    i < 2 ? 'border-b lg:border-b-0' : '',
    i > 0 ? 'lg:border-l lg:pl-6' : '',
  ].join(' ')
}

function Stat({ index, label, value, unit }) {
  return (
    <div className={`flex flex-col gap-2 ${statCellClass(index)}`}>
      <dt className="font-mono text-label text-fg-muted">{label}</dt>
      <dd className="font-mono text-stat font-medium tabular">
        {value}
        {unit && <span className="ml-1 text-body text-fg-muted">{unit}</span>}
      </dd>
    </div>
  )
}

function Count({ children }) {
  return <span className="font-mono text-fg tabular">{children}</span>
}

function TodayPanel() {
  const { state, today, cards, update } = useLearning()
  const navigate = useNavigate()
  const session = activeSession(state, today)
  const inProgress = session && !isSessionFinished(session)
  const plan = planToday(state, cards, today)
  const todo = plan.reviews.length + plan.fresh.length
  const seenAll = Object.keys(state.cards).length >= cards.length

  function start() {
    if (!inProgress) update((s) => startSession(s, cards, today))
    navigate('/session')
  }

  if (inProgress) {
    return (
      <>
        <h1 className="mt-3 text-display-sm font-semibold md:text-display">하던 학습이 있어요.</h1>
        <p className="mt-3 text-body text-fg-muted">
          남은 문제 <Count>{session.items.length - session.index}</Count>개
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="lg" onClick={start}>
            이어하기
          </Button>
          <Link to="/collection" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
            전체 도감 바로 보기
          </Link>
        </div>
      </>
    )
  }

  if (!todo) {
    return (
      <>
        <h1 className="mt-3 text-display-sm font-semibold md:text-display">
          {state.streak.lastDay === today ? '오늘 학습 끝.' : '오늘은 쉬어도 돼요.'}
        </h1>
        <p className="mt-3 text-body text-fg-muted">
          {seenAll ? '모든 카드를 만났어요. ' : ''}내일 복습{' '}
          <Count>{countDueTomorrow(state, today)}</Count>장이 기다려요.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/collection" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
            도감에서 다시 보기
          </Link>
          <Link to="/quiz" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
            실전 업무 상황 퀴즈
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="mt-3 text-display-sm font-semibold md:text-display">
        {Object.keys(state.cards).length ? '오늘도 5분이면 충분해요.' : '첫 카드부터 시작해요.'}
      </h1>
      <p className="mt-3 text-body text-fg-muted">
        복습 <Count>{plan.reviews.length}</Count>장 · 새 카드 <Count>{plan.fresh.length}</Count>장
        {plan.dueTotal > plan.reviews.length && (
          <> · 나머지 {plan.dueTotal - plan.reviews.length}장은 내일로</>
        )}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="lg" onClick={start}>
          오늘의 학습 시작
        </Button>
        <Link to="/collection" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          개념 카드 도감 ({cards.length}장)
        </Link>
      </div>
    </>
  )
}

export default function Home() {
  const { state, storageOk, today, cards } = useLearning()
  const mastered = countMastered(state)
  const retention = retentionRate(state)
  const streak = currentStreak(state.streak, today)
  const seen = seenCountByStage(state, cards)
  const plan = planToday(state, cards, today)
  const rank = rankTitle(mastered, cards.length)

  return (
    <Container>
      {!storageOk && (
        <p className="mt-6 flex items-center gap-2 rounded border border-border bg-surface px-4 py-3 text-small text-amber">
          <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />이 브라우저에서는 기록이
          저장되지 않아요. 창을 닫으면 진행 상황이 사라져요.
        </p>
      )}

      <section className="pt-12 pb-12 md:pt-16">
        <p className="font-mono text-label text-fg-muted">
          {rank ?? '오늘의 학습 · 간격 반복 + 4대 실전 훈련'}
        </p>
        <TodayPanel />
      </section>

      <dl className="grid grid-cols-2 border-y border-border lg:grid-cols-4">
        <Stat index={0} label="마스터" value={mastered} unit={`/ ${cards.length}`} />
        <Stat index={1} label="오늘 복습" value={plan.reviews.length} unit="장" />
        <Stat
          index={2}
          label="7일 유지율"
          value={retention ?? '—'}
          unit={retention == null ? '' : '%'}
        />
        <Stat index={3} label="연속 학습" value={streak} unit="일" />
      </dl>

      {/* 4대 핵심 학습 모드 바로가기 */}
      <section className="pt-12">
        <h2 className="text-h3 font-semibold">4대 실전 훈련 모드</h2>
        <p className="mt-2 text-small text-fg-muted">
          도감 탐색부터 헷갈리는 개념 VS 대결, 실전 업무 상황 4지선다 퀴즈, 오답 노트 복습까지 바로
          이동할 수 있어요.
        </p>
        <Divider className="mt-4" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {CORE_MODES.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="group flex flex-col justify-between rounded-md border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong hover:bg-bg-hover"
            >
              <div>
                <p className="font-mono text-label text-fg-subtle">{m.step}</p>
                <h3 className="mt-1 flex items-center justify-between text-h3 font-semibold text-fg">
                  <span>{m.title}</span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.5}
                    className="text-fg-subtle transition-colors group-hover:text-fg"
                  />
                </h3>
                <p className="mt-2 text-small text-fg-muted break-keep">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4대 헷갈리는 계층 & 필수 보완 바로가기 */}
      <section className="pt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3 font-semibold">4대 혼동 계층 & 필수 보완 묶음</h2>
          <Link
            to="/vs"
            className="rounded-sm text-small font-medium text-fg-muted transition-colors duration-150 hover:text-fg"
          >
            VS 대결 모드로 보기
          </Link>
        </div>
        <p className="mt-2 text-small text-fg-muted">
          REA, 인블로그, Ahrefs, 모델 증류, 백링크 분리(SEO vs 옵시디언) 및 4대 혼동 계층을 묶음별로
          모아 볼 수 있어요.
        </p>
        <Divider className="mt-4" />
        <ul className="divide-y divide-border border-b border-border">
          {confusionBundles
            .filter((b) => b.id !== 'all')
            .map((b) => (
              <li key={b.id}>
                <Link
                  to={`/collection?bundle=${b.id}`}
                  className="-mx-2 flex min-h-12 items-center justify-between gap-3 rounded-sm px-2 py-2 transition-colors duration-150 hover:bg-bg-hover"
                >
                  <span className="text-body font-medium break-keep">{b.label}</span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.5}
                    className="shrink-0 text-fg-subtle"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <section className="pt-12 pb-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3 font-semibold">
            학습 단계 ({stages.length}단계 · 총 {cards.length}장)
          </h2>
          <Link
            to="/collection"
            className="rounded-sm text-small font-medium text-fg-muted transition-colors duration-150 hover:text-fg"
          >
            도감 보기
          </Link>
        </div>
        <p className="mt-2 text-small text-fg-muted">
          새 카드는 이 순서대로 나와요. 복습은 단계를 섞어서 나와요.
        </p>
        <Divider className="mt-6" />
        <ol>
          {stages.map((stage) => (
            <li key={stage.id} className="border-b border-border">
              <Link
                to={`/collection?stage=${stage.id}`}
                className="-mx-2 flex h-12 items-center gap-3 rounded-sm px-2 transition-colors duration-150 hover:bg-bg-hover"
              >
                <StageDot stage={stage.id} />
                <span className="w-6 font-mono text-label text-fg-subtle tabular">
                  {String(stage.id).padStart(2, '0')}
                </span>
                <span className="flex-1 text-body">{stage.name}</span>
                <span className="font-mono text-small text-fg-muted tabular">
                  {seen[stage.id] ?? 0} / {stage.cardCount}
                </span>
                <ChevronRight
                  size={16}
                  strokeWidth={1.5}
                  className="text-fg-subtle"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </Container>
  )
}
