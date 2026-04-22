import { useState, useEffect } from 'react'
import { searchTeams } from '../api'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

const leagues = ['All', 'NFL', 'NBA', 'MLB', 'NHL', 'MLS']

export default function MyTeams() {
  const navigate = useNavigate()
  const [activeLeague, setActiveLeague] = useState('All')
  const [favTeams, setFavTeams] = useState(() => {
    const stored = localStorage.getItem('favTeams')
    return stored ? JSON.parse(stored) : []
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setHasSearched(true)
    const results = await searchTeams(searchQuery)
    setSearchResults(results)
    setSearching(false)
  }

  const addTeam = (team) => {
    const alreadyAdded = favTeams.some(t => t.id === team.id)
    if (alreadyAdded) return
    setFavTeams([...favTeams, team])
    setSearchResults([])
    setSearchQuery('')
  }

  useEffect(() => {
    localStorage.setItem('favTeams', JSON.stringify(favTeams))
  }, [favTeams])

  const filteredTeams = activeLeague === 'All'
    ? favTeams
    : favTeams.filter(team => team.league === activeLeague)

  const removeTeam = (id) => {
    setFavTeams(favTeams.filter(team => team.id !== id))
  }

  return (
    <div className="bg-[#0d0f14] font-['Barlow',sans-serif] text-[#f0f2f7] min-h-screen">
      <Header />
      <main className="py-[30px] px-[40px]">

        <div className="mb-[24px]">
          <h2 className="text-[#f0f2f7] text-[1.6rem]">My Teams</h2>
          <p className="text-[#f0f2f7] mt-[4px]">Manage what teams show up on the home page.</p>
        </div>

        <div className="flex gap-[12px] mb-[28px]">
          {leagues.map(league => (
            <span
              key={league}
              onClick={() => setActiveLeague(league)}
              className={`px-[16px] py-[6px] rounded-[5px] border border-[rgba(255,255,255,0.07)] cursor-pointer league-selector ${
                activeLeague === league
                  ? 'text-[#3b82f6] bg-[rgba(59,130,246,0.12)]'
                  : 'text-[#f0f2f7] bg-[#151820]'
              }`}
            >
              {league}
            </span>
          ))}
        </div>

        <p className="text-[#f0f2f7] mb-[12px]">Your Favorites ({filteredTeams.length})</p>
        <div className="grid grid-cols-3 gap-[12px] mb-[28px]">
          {filteredTeams.map(team => (
            <div key={team.id} className="bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[16px] py-[12px] flex items-center gap-[12px] fav-team-card cursor-pointer" onClick={() => navigate(`/team/${team.sport}/${team.leagueSlug}/${team.id}`)}>
              <img src={team.logo} className="w-[44px] h-[44px] object-contain flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[#f0f2f7] font-medium">{team.name}</p>
                <p className="text-[#f0f2f7]">{team.league}</p>
              </div>
              <button className="text-[#f0f2f7] remove-btn" onClick={(e) => {
                e.stopPropagation()
                removeTeam(team.id)
              }}>✕</button>
            </div>
          ))}
        </div>

        <div className="py-[28px] px-[20px] text-center">
          <p className="text-[#f0f2f7] mb-[6px]">Add more teams</p>
          <p className="text-[#f0f2f7] mb-[18px]">Search across all sports and leagues to find your teams.</p>
          <div className="flex justify-center gap-[8px] mb-[16px]">
              <input type="text" placeholder="Search teams..." value={searchQuery} onChange={(e) => {
                setSearchQuery(e.target.value)
                setHasSearched(false)
                setSearchResults([])
              }} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-[14px] py-[8px] text-[#f0f2f7] w-[280px] search-input"/>
              <button onClick={handleSearch} className="bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-[18px] py-[8px] text-[#f0f2f7] search-btn">{searching ? 'Searching...' : 'Search'}</button>
          </div>

          {searchResults.length > 0 && (
              <div className="mt-[30px] mx-[auto] text-left w-[60%] search-results">
                  {searchResults.map(team => (
                      <div key={`${team.league}-${team.id}`} className="flex items-center gap-[12px] px-[16px] py-[10px] border-b border-[rgba(255,255,255,0.07)] schedule-row cursor-pointer" onClick={() => addTeam(team)}>
                          <img src={team.logo} className="w-[32px] h-[32px] object-contain flex-shrink-0" />
                          <div className="flex-1">
                              <p className="text-[#f0f2f7] font-medium">{team.name}</p>
                              <p className="text-[#f0f2f7]">{team.league}</p>
                          </div>
                          <span className="text-[#3b82f6]">+ Add</span>
                      </div>
                  ))}
              </div>
          )}

          {searchResults.length === 0 && hasSearched && !searching && (<p className="text-[#f0f2f7] mt-[52px]">No teams found.</p>)}
        </div>
      </main>
    </div>
  )
}