import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, RotateCcw, X } from 'lucide-react'
import Container from '../components/layout/Container.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import { buttonClass } from '../components/ui/buttonClass.js'
import scenarioQuizzes from '../data/scenarioQuizzes.json'
import { useLearning } from '../state/learningContext.js'

const CATEGORIES = [
  'all',
  '① 모델 vs 에이전트 vs 앱',
  '② 로컬 vs VPS vs 원격',
  '③ API vs MCP vs CLI',
  '④ GitHub vs 배포(Deploy) vs DB',
  '⑤ SEO 백링크 vs 옵시디언 백링크',
]

export default function ScenarioQuiz() {
  const { state, update } = useLearning()
  const [catFilter, setCatFilter] = useState('all')
  const quizState = state.scenarioQuiz ?? { answers: {}, wrongIds: [] }
  const answers = quizState.answers ?? {}
  const wrongIds = quizState.wrongIds ?? []

  function selectAnswer(q, optIdx) {
    const opt = q.options[optIdx]
    const isCorrect = opt.isCorrect

    update((prev) => {
      const prevQuiz = prev.scenarioQuiz ?? { answers: {}, wrongIds: [] }
      const nextAnswers = {
        ...(prevQuiz.answers ?? {}),
        [q.id]: { selectedIdx: optIdx, isCorrect },
      }
      const prevWrong = new Set(prevQuiz.wrongIds ?? [])
      const nextSelfMarks = { ...(prev.selfMarks ?? {}) }

      if (!isCorrect) {
        prevWrong.add(q.id)
        // 틀린 문제의 대표 연관 용어를 '헷갈림' 상태로 자동 표시해 약점 복습에 모이도록 함
        if (q.relatedTermIds?.[0] && !nextSelfMarks[q.relatedTermIds[0]]) {
          nextSelfMarks[q.relatedTermIds[0]] = 'confused'
        }
      }

      return {
        ...prev,
        selfMarks: nextSelfMarks,
        scenarioQuiz: {
          ...prevQuiz,
          answers: nextAnswers,
          wrongIds: [...prevWrong],
        },
      }
    })
  }

  function resetAllQuizzes() {
    update((prev) => ({
      ...prev,
      scenarioQuiz: {
        ...(prev.scenarioQuiz ?? {}),
        answers: {},
      },
    }))
  }

  const visible =
    catFilter === 'all'
      ? scenarioQuizzes
      : scenarioQuizzes.filter((q) => q.categoryTag === catFilter)

  const totalAnswered = Object.keys(answers).length
  const totalCorrect = Object.values(answers).filter((a) => a.isCorrect).length

  return (
    <Container className="pb-16">
      <PageHeader
        title="실전 업무 상황 퀴즈"
        description="실제 개발·자동화·마케팅 상황에서 어떤 도구를 써야 하는지 고르는 4지선다 훈련이에요. 오답을 고르면 '왜 내가 고른 도구를 이 상황에 쓰면 안 되는지' 구체적인 비교 해설을 즉시 보여드려요."
      />

      {/* 상단 통계 바 */}
      <dl className="grid grid-cols-3 border-y border-border">
        <div className="flex flex-col gap-1 py-4 pr-4">
          <dt className="font-mono text-label text-fg-muted">진행 문항</dt>
          <dd className="font-mono text-h2 font-medium tabular">
            {totalAnswered}
            <span className="ml-1 text-small text-fg-muted">/ {scenarioQuizzes.length}</span>
          </dd>
        </div>
        <div className="flex flex-col gap-1 border-l border-border py-4 px-4">
          <dt className="font-mono text-label text-fg-muted">정답 수</dt>
          <dd className="font-mono text-h2 font-medium text-green tabular">{totalCorrect}</dd>
        </div>
        <div className="flex flex-col gap-1 border-l border-border py-4 pl-4">
          <dt className="font-mono text-label text-fg-muted">오답 노트 누적</dt>
          <dd className="flex items-baseline justify-between gap-2 font-mono text-h2 font-medium text-red tabular">
            <span>{wrongIds.length}</span>
            {wrongIds.length > 0 && (
              <Link to="/review" className="font-sans text-caption font-medium text-fg underline">
                오답 복습하기
              </Link>
            )}
          </dd>
        </div>
      </dl>

      {/* 카테고리 필터 및 리셋 버튼 */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="상황 퀴즈 계층 필터" className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = catFilter === cat
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCatFilter(cat)}
                className={`h-9 rounded border px-3 text-small font-medium transition-colors duration-150 ${
                  active
                    ? 'border-fg bg-fg text-bg'
                    : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                }`}
              >
                {cat === 'all' ? `전체 (${scenarioQuizzes.length})` : cat}
              </button>
            )
          })}
        </div>

        {totalAnswered > 0 && (
          <Button variant="secondary" size="sm" onClick={resetAllQuizzes}>
            <RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />
            선택 기록 초기화
          </Button>
        )}
      </div>

      {/* 퀴즈 목록 */}
      <ol className="mt-8 space-y-6">
        {visible.map((q, idx) => {
          const ans = answers[q.id]
          const isAnswered = ans !== undefined
          const selectedIdx = ans?.selectedIdx
          const chosenOpt = isAnswered ? q.options[selectedIdx] : null
          const correctOpt = q.options.find((o) => o.isCorrect)

          return (
            <li key={q.id} className="rounded-md border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-label text-fg-muted">
                  상황 {String(idx + 1).padStart(2, '0')} · {q.categoryTag}
                </span>
                {isAnswered && (
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-label font-medium ${
                      ans.isCorrect ? 'text-green' : 'text-red'
                    }`}
                  >
                    {ans.isCorrect ? (
                      <>
                        <Check size={14} strokeWidth={2} /> 정답
                      </>
                    ) : (
                      <>
                        <X size={14} strokeWidth={2} /> 오답 (오답 노트에 추가됨)
                      </>
                    )}
                  </span>
                )}
              </div>

              <p className="mt-3 text-body-lg font-medium break-keep">{q.situation}</p>

              <ol className="mt-5 grid gap-2 sm:grid-cols-2">
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
                        onClick={() => selectAnswer(q, oIdx)}
                        className={`flex min-h-14 w-full items-start gap-3 rounded border px-4 py-3 text-left transition-colors duration-150 ${style}`}
                      >
                        <span className="mt-0.5 w-4 shrink-0 font-mono text-label text-fg-subtle tabular">
                          {oIdx + 1}
                        </span>
                        <span className="flex-1 text-small break-keep">{opt.text}</span>
                        {isAnswered && opt.isCorrect && (
                          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 font-mono text-label text-green">
                            <Check size={14} strokeWidth={2} />
                            정답
                          </span>
                        )}
                        {isAnswered && !opt.isCorrect && selectedIdx === oIdx && (
                          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 font-mono text-label text-red">
                            <X size={14} strokeWidth={2} />내 답
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ol>

              {/* 즉시 비교 해설 박스 */}
              {isAnswered && chosenOpt && (
                <div className="mt-5 rounded border border-border bg-bg p-5">
                  {chosenOpt.isCorrect ? (
                    <div>
                      <p className="inline-flex items-center gap-1.5 text-small font-semibold text-green">
                        <Check size={16} strokeWidth={2} />
                        정확한 도구 선택이에요!
                      </p>
                      <p className="mt-2 text-small text-fg-muted break-keep">
                        {chosenOpt.feedback}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-small font-semibold text-red">
                          <X size={16} strokeWidth={2} />왜 내가 고른 도구를 이 상황에 쓰면 안
                          될까요?
                        </p>
                        <p className="mt-1.5 text-small text-fg break-keep">{chosenOpt.feedback}</p>
                      </div>
                      {correctOpt && (
                        <div className="border-t border-border pt-3">
                          <p className="inline-flex items-center gap-1.5 text-small font-semibold text-green">
                            <Check size={16} strokeWidth={2} />이 상황의 정답 도구:{' '}
                            {correctOpt.text}
                          </p>
                          <p className="mt-1.5 text-small text-fg-muted break-keep">
                            {correctOpt.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {q.summaryCompare && (
                    <p className="mt-4 border-t border-border pt-3 text-caption text-fg-muted break-keep">
                      <span className="font-mono text-label text-fg">핵심 한 줄 비교 · </span>
                      {q.summaryCompare}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {wrongIds.length > 0 && (
        <div className="mt-10 flex justify-center">
          <Link to="/review" className={buttonClass({ size: 'lg' })}>
            오답 노트 & 약점 복습하러 가기 ({wrongIds.length}문항)
          </Link>
        </div>
      )}
    </Container>
  )
}
