import {
  BarChart3,
  BookmarkCheck,
  ClipboardCheck,
  Home,
  Layers,
  Scale,
  Workflow,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: '홈', icon: Home },
  { to: '/collection', label: '도감', icon: Layers },
  { to: '/vs', label: 'VS대결', icon: Scale },
  { to: '/quiz', label: '실전퀴즈', icon: ClipboardCheck },
  { to: '/review', label: '오답노트', icon: BookmarkCheck },
  { to: '/flow', label: '흐름', icon: Workflow, desktopOnly: true },
  { to: '/dashboard', label: '기록', icon: BarChart3, desktopOnly: true },
]
