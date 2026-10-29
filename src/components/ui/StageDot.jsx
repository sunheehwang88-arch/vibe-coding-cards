// 단계 색은 8px 점으로만 쓴다 (DESIGN.md 11장).
// Tailwind가 클래스를 찾을 수 있도록 전체 문자열로 둔다.
const STAGE_BG = {
  1: 'bg-stage-1',
  2: 'bg-stage-2',
  3: 'bg-stage-3',
  4: 'bg-stage-4',
  5: 'bg-stage-5',
  6: 'bg-stage-6',
  7: 'bg-stage-7',
  8: 'bg-stage-8',
  9: 'bg-stage-9',
  10: 'bg-stage-7',
  11: 'bg-stage-8',
  12: 'bg-stage-4',
  13: 'bg-stage-2',
  14: 'bg-stage-9',
  15: 'bg-stage-3',
  16: 'bg-stage-8',
  17: 'bg-stage-5',
  18: 'bg-stage-2',
  19: 'bg-stage-5',
  20: 'bg-stage-1',
  21: 'bg-stage-6',
  22: 'bg-stage-3',
}

export default function StageDot({ stage }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2 shrink-0 rounded-full ${STAGE_BG[stage] ?? 'bg-stage-7'}`}
    />
  )
}
