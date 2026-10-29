import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Trash2, X } from 'lucide-react'
import Container from '../components/layout/Container.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import Divider from '../components/ui/Divider.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Button from '../components/ui/Button.jsx'
import { buttonClass } from '../components/ui/buttonClass.js'
import TermCard from '../components/TermCard.jsx'
import scenarioQuizzes from '../data/scenarioQuizzes.json'
import { useLearning } from '../state/learningContext.js'

export default function WeaknessReview() {
  const { state, cards, update } = useLearning()
  const [flipped, setFlipped] = useState(() => new Set())
  const [retrySelection, setRetrySelection] = useState({})

  const selfMarks = state.selfMarks ?? {}
  const wrongQuizIds = state.scenarioQuiz?.wrongIds ?? []
  const lastWrongCardIds = state.lastSummary?.wrongIds ?? []

  // 1) 내가 '헷갈림 🔴' 표시한 카드 + 라이트너 확신 오답/최근 오답 카드
  const weakCards = cards.filter(
    (c) =>
      selfMarks[c.id] === 'confused' ||
      state.cards[c.id]?.confidentMiss ||
      lastWrongCardIds.includes(c.id),
  )

  // 2) 실전 업무 상황 퀴즈에서 틀린 문제
  const wrongQuizzes = scenarioQuizzes.filter((q) => wrongQuizIds.includes(q.id))

  function toggleFlip(id) {
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

  function removeWrongQuiz(qId) {
    update((prev) => {
      const prevQuiz = prev.scenarioQuiz ?? { answers: {}, wrongIds: [] }
      return {
        ...prev,
        scenarioQuiz: {
          ...prevQuiz,
          wrongIds: (prevQuiz.wrongIds ?? []).filter((id) => id !== qId),
        },
      }
    })
  }

  function clearAllWeaknesses() {
    update((prev) => {
      const nextMarks = { ...(prev.selfMarks ?? {}) }
      for (const k of Object.keys(nextMarks)) {
        if (nextMarks[k] === 'confused') delete nextMarks[k]
      }
      return {
        ...prev,
        selfMarks: nextMarks,
        scenarioQuiz: {
          ...(prev.scenarioQuiz ?? {}),
          wrongIds: [],
        },
      }
    })
    setRetrySelection({})
  }

  const totalWeakItems = weakCards.length + wrongQuizzes.length

  return (
    <Container className="pb-16">
      <PageHeader
        title="오답 노트 & 약점 복습"
        description="실전 퀴즈에서 틀린 문제와 도감에서 '헷갈림' 표시한 카드, 그리고 학습 세션의 확신 오답 카드를 자동으로 모아 집중 복습하는 공간이에요. 모든 기록은 브라우저 LocalStorage에 자동 저장돼요."
      />

      <dl className="grid grid-cols-3 border-y border-border">
        <div className="flex flex-col gap-1 py-4 pr-4">
          <dt className="font-mono text-label text-fg-muted">헷갈림 · 오답 카드</dt>
          <dd className="font-mono text-h2 font-medium text-red tabular">
            {weakCards.length}
            <span className="ml-1 text-small text-fg-muted">장</span>
          </dd>
        </div>
        <div className="flex flex-col gap-1 border-l border-border py-4 px-4">
          <dt className="font-mono text-label text-fg-muted">틀린 실전 상황 퀴즈</dt>
          <dd className="font-mono text-h2 font-medium text-amber tabular">
            {wrongQuizzes.length}
            <span className="ml-1 text-small text-fg-muted">문항</span>
          </dd>
        </div>
        <div className="flex flex-col gap-1 border-l border-border py-4 pl-4">
          <dt className="font-mono text-label text-fg-muted">완벽 이해 달성</dt>
          <dd className="font-mono text-h2 font-medium text-green tabular">
            {Object.values(selfMarks).filter((v) => v === 'mastered').length}
            <span className="ml-1 text-small text-fg-muted">장</span>
          </dd>
        </div>
      </dl>

      {totalWeakItems === 0 ? (
        <div className="mt-12">
          <EmptyState
            title="현재 복습할 오답이나 헷갈림 카드가 없어요"
            description="개념 카드 도감에서 '헷갈림'을 체크하거나, 실전 업무 상황 퀴즈에서 틀린 문제가 생기면 여기에 자동으로 모여요."
            action={
              <div className="flex flex-wrap gap-2">
                <Link to="/collection" className={buttonClass({ variant: 'secondary' })}>
                  도감 보러 가기
                </Link>
                <Link to="/quiz" className={buttonClass({ variant: 'primary' })}>
                  실전 퀴즈 풀러 가기
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" size="sm" onClick={clearAllWeaknesses}>
              <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
              오답 노트 · 헷갈림 일괄 비우기
            </Button>
          </div>

          {/* 1. 실전 퀴즈 오답 다시 풀기 */}
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-h3 font-semibold">
                틀린 실전 상황 퀴즈 다시 풀기{' '}
                <span className="font-mono text-body font-normal text-fg-muted tabular">
                  {wrongQuizzes.length}
                </span>
              </h2>
            </div>
            <p className="mt-1 text-small text-fg-muted">
              다시 풀어 정답을 맞히면 [오답 노트에서 졸업] 버튼으로 목록에서 지울 수 있어요.
            </p>
            <Divider className="mt-4" />

            {wrongQuizzes.length === 0 ? (
              <p className="py-6 text-small text-fg-muted">틀린 실전 상황 퀴즈가 없어요.</p>
            ) : (
              <ol className="mt-6 space-y-6">
                {wrongQuizzes.map((q) => {
                  const selectedIdx = retrySelection[q.id]
                  const isAnswered = selectedIdx !== undefined
                  const chosenOpt = isAnswered ? q.options[selectedIdx] : null
                  const correctOpt = q.options.find((o) => o.isCorrect)

                  return (
                    <li key={q.id} className="rounded-md border border-border bg-surface p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-label text-red">
                          오답 복습 · {q.categoryTag}
                        </span>
                        <Button variant="secondary" size="sm" onClick={() => removeWrongQuiz(q.id)}>
                          <Check size={14} strokeWidth={1.5} />이 문제 졸업 (오답 노트에서 제거)
                        </Button>
                      </div>

                      <p className="mt-3 text-body-lg font-medium break-keep">{q.situation}</p>

                      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, oIdx) => {
                          let style =
                            'border-border bg-surface hover:border-border-strong hover:bg-bg-hover'
                          if (isAnswered) {
                            if (opt.isCorrect) style = 'border-green bg-surface'
                            else if (selectedIdx === oIdx) style = 'border-red bg-surface'
                            else style = 'border-border bg-surface text-fg-subtle'
                          }

                          return (
                            <li key={oIdx}>
                              <button
                                type="button"
                                onClick={() =>
                                  setRetrySelection((prev) => ({ ...prev, [q.id]: oIdx }))
                                }
                                className={`flex min-h-14 w-full items-start gap-3 rounded border px-4 py-3 text-left transition-colors duration-150 ${style}`}
                              >
                                <span className="mt-0.5 w-4 shrink-0 font-mono text-label text-fg-subtle tabular">
                                  {oIdx + 1}
                                </span>
                                <span className="flex-1 text-small break-keep">{opt.text}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ol>

                      {isAnswered && chosenOpt && (
                        <div className="mt-4 rounded border border-border bg-bg p-4">
                          <p
                            className={`inline-flex items-center gap-1.5 text-small font-semibold ${
                              chosenOpt.isCorrect ? 'text-green' : 'text-red'
                            }`}
                          >
                            {chosenOpt.isCorrect ? (
                              <>
                                <Check size={16} strokeWidth={2} /> 복습 성공! 완벽히 이해하셨어요.
                              </>
                            ) : (
                              <>
                                <X size={16} strokeWidth={2} /> 다시 한번 왜 틀렸는지 확인해 보세요.
                              </>
                            )}
                          </p>
                          <p className="mt-2 text-small text-fg-muted break-keep">
                            {chosenOpt.feedback}
                          </p>
                          {!chosenOpt.isCorrect && correctOpt && (
                            <p className="mt-2 border-t border-border pt-2 text-small text-fg break-keep">
                              <span className="font-mono text-label text-green">정답 해설 · </span>
                              {correctOpt.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          {/* 2. 헷갈림 표시 & 오답 개념 카드 집중 복습 */}
          <section className="mt-14">
            <div className="flex items-baseline justify-between">
              <h2 className="text-h3 font-semibold">
                헷갈림 표시 & 오답 개념 카드{' '}
                <span className="font-mono text-body font-normal text-fg-muted tabular">
                  {weakCards.length}
                </span>
              </h2>
            </div>
            <p className="mt-1 text-small text-fg-muted">
              카드를 눌러 뒷면의 한 줄 비유와 VS 차이를 복습한 뒤, 하단에서 [완벽 이해]로 상태를
              바꾸면 약점 목록에서 졸업해요.
            </p>
            <Divider className="mt-4" />

            {weakCards.length === 0 ? (
              <p className="py-6 text-small text-fg-muted">현재 헷갈림으로 표시된 카드가 없어요.</p>
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {weakCards.map((card) => (
                  <li key={card.id}>
                    <TermCard
                      card={card}
                      cardState={state.cards[card.id]}
                      locked={false}
                      flipped={flipped.has(card.id)}
                      onFlip={() => toggleFlip(card.id)}
                      selfMark={selfMarks[card.id] ?? null}
                      onMark={(status) => setSelfMark(card.id, status)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Container>
  )
}
