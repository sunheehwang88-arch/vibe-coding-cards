import { describe, expect, it } from 'vitest'
import * as icons from 'lucide-react'
import cards from '../src/data/cards.json'
import flows from '../src/data/flows.json'
import stages from '../src/data/stages.json'

const ids = new Set(cards.map((c) => c.id))
const REQUIRED = [
  'id',
  'term',
  'stage',
  'icon',
  'chip',
  'definition',
  'analogy',
  'example',
  'vibeTip',
  'source',
]

describe('cards.json', () => {
  it('276장 (기본 77 + AI_TERMS 신규 199), id 중복 없음', () => {
    expect(cards).toHaveLength(276)
    expect(ids.size).toBe(276)
  })

  it('필수 보완 4개 및 백링크 분리(SEO vs 옵시디언)가 포함되어 있다', () => {
    expect(ids.has('t221')).toBe(true) // REA
    expect(ids.has('t222')).toBe(true) // 인블로그
    expect(ids.has('t223')).toBe(true) // Ahrefs
    expect(ids.has('t224')).toBe(true) // 모델 증류
    expect(ids.has('t225')).toBe(true) // SEO 백링크
    expect(ids.has('t103')).toBe(true) // 옵시디언 백링크
  })

  it('필수 필드가 모두 채워져 있다 (spec 10장 ⑤)', () => {
    for (const c of cards) {
      for (const key of REQUIRED) expect(c[key], `${c.id}.${key}`).toBeTruthy()
    }
  })

  it('아이콘이 lucide-react에 존재한다', () => {
    for (const c of cards) expect(icons[c.icon], `${c.id}: ${c.icon}`).toBeTruthy()
  })

  it('헷갈리는 짝은 존재하는 id이고 양방향이며 contrast가 있다', () => {
    for (const c of cards) {
      for (const other of c.confusableWith) {
        expect(ids.has(other), `${c.id} → ${other}`).toBe(true)
        expect(cards.find((x) => x.id === other).confusableWith, `${other} ↔ ${c.id}`).toContain(
          c.id,
        )
      }
      if (c.confusableWith.length) expect(c.contrast, c.id).toBeTruthy()
    }
  })

  it('헷갈리는 짝이 20쌍 이상 존재한다', () => {
    const pairs = new Set()
    for (const c of cards) for (const o of c.confusableWith) pairs.add([c.id, o].sort().join('|'))
    expect(pairs.size).toBeGreaterThanOrEqual(22)
  })

  it('상황 카드(Q4)는 정답 1개 + 오답 3개', () => {
    for (const c of cards.filter((x) => x.situation)) {
      expect(c.situation.aiSays, c.id).toBeTruthy()
      expect(c.situation.answer, c.id).toBeTruthy()
      expect(c.situation.distractors, c.id).toHaveLength(3)
    }
  })

  it('단계별 카드 수가 stages.json과 같고, 단계마다 4장 이상 (Q2 보기 확보)', () => {
    for (const s of stages) {
      const n = cards.filter((c) => c.stage === s.id).length
      expect(n, s.name).toBe(s.cardCount)
      expect(n).toBeGreaterThanOrEqual(4)
    }
  })

  it('정의에 용어 이름이 그대로 들어가지 않는다 (Q3 정답 노출 방지)', () => {
    for (const c of cards) {
      expect(c.definition.includes(c.term), c.id).toBe(false)
      expect(c.analogy.includes(c.term), c.id).toBe(false)
    }
  })
})

describe('flows.json', () => {
  it('6개, requiredCards가 모두 존재', () => {
    expect(flows).toHaveLength(6)
    for (const f of flows)
      for (const id of f.requiredCards) expect(ids.has(id), `${f.id}: ${id}`).toBe(true)
  })
})
