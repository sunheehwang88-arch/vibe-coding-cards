import { Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import Home from './pages/Home.jsx'
import Session from './pages/Session.jsx'
import Summary from './pages/Summary.jsx'
import Collection from './pages/Collection.jsx'
import VsBattle from './pages/VsBattle.jsx'
import ScenarioQuiz from './pages/ScenarioQuiz.jsx'
import WeaknessReview from './pages/WeaknessReview.jsx'
import Flow from './pages/Flow.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  return (
    <Routes>
      {/* 세션은 집중 화면이라 네비게이션 없이 단독 레이아웃 (DESIGN.md 9장) */}
      <Route path="/session" element={<Session />} />
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="summary" element={<Summary />} />
        <Route path="collection" element={<Collection />} />
        <Route path="vs" element={<VsBattle />} />
        <Route path="quiz" element={<ScenarioQuiz />} />
        <Route path="review" element={<WeaknessReview />} />
        <Route path="flow" element={<Flow />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
