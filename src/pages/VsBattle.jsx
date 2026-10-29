import { useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import Container from '../components/layout/Container.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import Divider from '../components/ui/Divider.jsx'
import Button from '../components/ui/Button.jsx'
import vsBattles from '../data/vsBattles.json'
import { useLearning } from '../state/learningContext.js'

export default function VsBattle() {
  const { state, update } = useLearning()
  const [activeId, setActiveId] = useState('all')
  const answers = state.vsBattle?.answers ?? {}

  function selectOption(qId, optIdx) {
    update((prev) => ({
      ...prev,
      vsBattle: {
        ...(prev.vsBattle ?? {}),
        answers: {
          ...(prev.vsBattle?.answers ?? {}),
          [qId]: optIdx,
        },
      },
    }))
  }

  function resetBattleAnswers() {
    update((prev) => ({
      ...prev,
      vsBattle: { ...(prev.vsBattle ?? {}), answers: {} },
    }))
  }

  const battles = activeId === 'all' ? vsBattles : vsBattles.filter((b) => b.id === activeId)
  const totalQuestions = vsBattles.reduce((acc, b) => acc + b.questions.length, 0)
  const answeredCount = Object.keys(answers).length

  return (
    <Container className="pb-16">
      <PageHeader
        title="헷갈리는 개념 VS 대결"
        description="4대 핵심 혼동 계층(모델 vs 에이전트 vs 앱 / 로컬 vs VPS vs 원격 / API vs MCP vs CLI / GitHub vs 배포 vs DB)과 SEO 백링크 vs 옵시디언 백링크를 1:1 · 1:1:1 비교 문제로 풀고 즉시 비교표로 정리해요."
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div role="tablist" aria-label="VS 대결 주제 선택" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeId === 'all'}
            onClick={() => setActiveId('all')}
            className={`h-9 rounded border px-3 text-small font-medium transition-colors duration-150 ${
              activeId === 'all'
                ? 'border-fg bg-fg text-bg'
                : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
            }`}
          >
            전체 대결 ({vsBattles.length})
          </button>
          {vsBattles.map((b) => {
            const active = activeId === b.id
            return (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveId(b.id)}
                className={`h-9 rounded border px-3 text-small font-medium transition-colors duration-150 ${
                  active
                    ? 'border-fg bg-fg text-bg'
                    : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                }`}
              >
                {b.groupTag}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-label text-fg-muted tabular">
            완료 {answeredCount} / {totalQuestions}문항
          </span>
          {answeredCount > 0 && (
            <Button variant="secondary" size="sm" onClick={resetBattleAnswers}>
              <RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />
              다시 풀기
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-12">
        {battles.map((battle) => (
          <section key={battle.id} className="rounded-md border border-border bg-surface p-6">
            <p className="font-mono text-label text-fg-muted">{battle.badge}</p>
            <h2 className="mt-2 text-h2 font-semibold break-keep">{battle.title}</h2>
            <p className="mt-2 text-small text-fg-muted break-keep">{battle.subtitle}</p>

            {/* 대결 후보 카드 요약 */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {battle.contenders.map((c) => (
                <div key={c.name} className="rounded border border-border bg-bg p-4">
                  <p className="font-mono text-label text-fg-muted">{c.metaphor}</p>
                  <h3 className="mt-1 text-h3 font-semibold break-keep">{c.name}</h3>
                  <p className="mt-2 text-small text-fg-muted break-keep">{c.role}</p>
                  <p className="mt-3 font-mono text-caption text-fg-subtle">예: {c.examples}</p>
                </div>
              ))}
            </div>

            <Divider className="my-6" />

            {/* 1:1 / 1:1:1 실전 비교 문제 */}
            <div className="space-y-6">
              {battle.questions.map((q, qIdx) => {
                const selectedIdx = answers[q.qId]
                const isAnswered = selectedIdx !== undefined
                const chosenOpt = isAnswered ? q.options[selectedIdx] : null

                return (
                  <div key={q.qId} className="rounded border border-border p-5">
                    <p className="font-mono text-label text-fg-muted">비교 대결 Q{qIdx + 1}</p>
                    <p className="mt-2 text-body-lg font-medium break-keep">{q.prompt}</p>

                    <ol className="mt-4 space-y-2">
                      {q.options.map((opt, oIdx) => {
                        let stateStyle =
                          'border-border bg-surface hover:border-border-strong hover:bg-bg-hover'
                        if (isAnswered) {
                          if (opt.isCorrect) stateStyle = 'border-green bg-surface'
                          else if (selectedIdx === oIdx) stateStyle = 'border-red bg-surface'
                          else stateStyle = 'border-border bg-surface text-fg-subtle'
                        }

                        return (
                          <li key={oIdx}>
                            <button
                              type="button"
                              onClick={() => selectOption(q.qId, oIdx)}
                              className={`flex min-h-12 w-full items-start gap-3 rounded border px-4 py-3 text-left transition-colors duration-150 ${stateStyle}`}
                            >
                              <span className="mt-0.5 w-4 shrink-0 font-mono text-label text-fg-subtle tabular">
                                {oIdx + 1}
                              </span>
                              <span className="flex-1 text-small break-keep">{opt.label}</span>
                              {isAnswered && opt.isCorrect && (
                                <span className="inline-flex shrink-0 items-center gap-1 font-mono text-label text-green">
                                  <Check size={14} strokeWidth={2} />
                                  정답
                                </span>
                              )}
                              {isAnswered && !opt.isCorrect && selectedIdx === oIdx && (
                                <span className="inline-flex shrink-0 items-center gap-1 font-mono text-label text-red">
                                  <X size={14} strokeWidth={2} />내 선택
                                </span>
                              )}
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
                            <Check size={16} strokeWidth={2} />
                          ) : (
                            <X size={16} strokeWidth={2} />
                          )}
                          {chosenOpt.isCorrect
                            ? '정확하게 구분했어요!'
                            : '왜 이 보기를 고르면 안 되는지 비교해 보세요'}
                        </p>
                        <p className="mt-2 text-small text-fg-muted break-keep">
                          {chosenOpt.isCorrect ? chosenOpt.whyRight : chosenOpt.whyNot}
                        </p>
                        {!chosenOpt.isCorrect && (
                          <p className="mt-2 border-t border-border pt-2 text-small text-fg break-keep">
                            <span className="font-mono text-label text-green">정답 해설 · </span>
                            {q.options.find((o) => o.isCorrect)?.whyRight}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 핵심 비교표 (문제 선택 즉시 강조 표시 + 상시 열람 가능) */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-label text-fg-muted">핵심 비교표 — {battle.title}</h3>
                {battle.questions.some((q) => answers[q.qId] !== undefined) && (
                  <span className="font-mono text-label text-green">비교 분석 완료</span>
                )}
              </div>
              <div className="mt-3 overflow-x-auto rounded border border-border">
                <table className="w-full border-collapse text-left text-small">
                  <thead>
                    <tr className="border-b border-border bg-bg">
                      {battle.comparisonTable.headers.map((h, i) => (
                        <th key={i} className="px-4 py-3 font-semibold text-fg">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {battle.comparisonTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-border last:border-b-0">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-4 py-3 align-top break-keep ${
                              cIdx === 0 ? 'font-mono text-label text-fg-muted' : 'text-fg'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}
      </div>
    </Container>
  )
}
