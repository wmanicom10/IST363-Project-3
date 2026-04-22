import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Leagues from './pages/Leagues'
import MyTeams from './pages/MyTeams'
import Team from './pages/Team'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leagues" element={<Leagues />} />
        <Route path="/myteams" element={<MyTeams />} />
        <Route path="/team/:sport/:leagueSlug/:teamId" element={<Team />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App