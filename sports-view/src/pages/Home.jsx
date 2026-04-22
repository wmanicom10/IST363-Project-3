import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getScoreboard, getStandings, getTeamUpcoming, LEAGUES } from '../api'
import Header from '../components/Header'
import GameCard from '../components/GameCard'

export default function Home() {
    const navigate = useNavigate()

    const [favTeams, setFavTeams] = useState(() => {
      const stored = localStorage.getItem('favTeams')
      return stored ? JSON.parse(stored) : []
    })

    const [todaysGames, setTodaysGames] = useState([])
    const [upcomingGames, setUpcomingGames] = useState([])
    const [standings, setStandings] = useState([])
    const [standingsGroups, setStandingsGroups] = useState([])
    const [standingsIndex, setStandingsIndex] = useState(0)
    const [standingsTitle, setStandingsTitle] = useState('')

    useEffect(() => {
      const fetchData = async () => {

      if (favTeams.length === 0) {
          return
      }

      const uniqueLeagues = [...new Set(favTeams.map(t => t.league).filter(l => LEAGUES[l]))]
      const favTeamNames = favTeams.map(t => t.name.toLowerCase())

      const scoreboardPromises = uniqueLeagues.map(l => getScoreboard(l))
      const allScoreboards = await Promise.all(scoreboardPromises)
      const allEvents = allScoreboards.flat()

      const favEvents = allEvents.filter(event => {
          const comp = event.competitions?.[0]
          const home = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName?.toLowerCase()
          const away = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName?.toLowerCase()
          return favTeamNames.some(name => home?.includes(name) || away?.includes(name))
      })

      const todaysEvents = favEvents.filter(e => {
          const eventDate = new Date(e.date).toDateString()
          const today = new Date().toDateString()
          return eventDate === today
      })

      setTodaysGames(todaysEvents.slice(0, 4))

      const upcomingPromises = favTeams.filter(t => t.sport && t.leagueSlug).map(t => getTeamUpcoming(t.sport, t.leagueSlug, t.id))

      const allUpcoming = await Promise.all(upcomingPromises)
      const flatUpcoming = allUpcoming.flat()

      const tomorrow = new Date()
      tomorrow.setHours(0, 0, 0, 0)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const seen = new Set()
      const dedupedUpcoming = flatUpcoming.filter(e => {
          if (seen.has(e.id)) return false
          seen.add(e.id)
          const eventDate = new Date(e.date)
          return eventDate >= tomorrow
      })

      dedupedUpcoming.sort((a, b) => new Date(a.date) - new Date(b.date))
      setUpcomingGames(dedupedUpcoming.slice(0, 4))

      const standingsPromises = uniqueLeagues.map(l => getStandings(l).then(groups => 
          groups.map(g => ({ ...g, leagueKey: l }))
      ))
      const allStandingsData = await Promise.all(standingsPromises)
      const flatStandingsData = allStandingsData.flat()

      const relevantGroups = flatStandingsData.filter(group => {
          const entries = group.standings?.entries || []
          return entries.some(e =>
          favTeamNames.some(name => e.team?.displayName?.toLowerCase().includes(name))
          )
      })

      let startIndex = 0
      let found = false
      relevantGroups.forEach((group, i) => {
          if (found) return
          const entries = group.standings?.entries || []
          const hasFavTeam = entries.some(e =>
          favTeamNames.some(name => e.team?.displayName?.toLowerCase().includes(name))
          )
          if (hasFavTeam) {
          startIndex = i
          found = true
          }
      })

      setStandingsGroups(relevantGroups)
      setStandingsIndex(startIndex)
      }
      fetchData()
    }, [])

    useEffect(() => {
      if (standingsGroups.length === 0) return
      const group = standingsGroups[standingsIndex]
      let entries = group?.standings?.entries || []

      entries = [...entries].sort((a, b) => {
          const getVal = (entry, ...names) => {
              for (const name of names) {
                  const stat = entry.stats?.find(s => s.name === name)
                  if (stat) return stat.value || 0
              }
              return 0
          }
          const aVal = getVal(a, 'winPercent', 'points')
          const bVal = getVal(b, 'winPercent', 'points')
          return bVal - aVal
      })

      setStandings(entries)
      setStandingsTitle(`${group.leagueKey} ${group?.name}` || 'Standings')
    }, [standingsGroups, standingsIndex])

    const getStatus = (event) => {
      const status = event.competitions?.[0]?.status?.type
      if (status?.name === 'STATUS_IN_PROGRESS') return 'live'
      if (status?.completed) return 'final'
      return 'upcoming'
    }

    const getTime = (event) => {
      const status = event.competitions?.[0]?.status
      const statusName = status?.type?.name

      if (status?.type?.completed) return 'Final'

      if (statusName === 'STATUS_IN_PROGRESS') {
          const detail = status?.type?.detail || status?.detail || ''
          if (detail && !detail.includes('0:00')) return detail
          return 'Live'
      }

      const date = new Date(event.date)
      const today = new Date().toDateString()
      const eventDate = date.toDateString()
      if (eventDate === today) {
          return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }

    return (
      <div className="bg-[#0d0f14] font-['Barlow',sans-serif] text-[#f0f2f7] min-h-screen">
        <Header />

        <div className="flex">
          <section className="w-[24%] border-r border-[rgba(255,255,255,0.07)] bg-[#151820] px-[40px] pt-[30px] pb-[20px]">
            <h4 className="text-[#f0f2f7]">My Teams</h4>
            <div className="mt-[10px] mb-[20px] border-b border-[rgba(255,255,255,0.07)]">
              {favTeams.length === 0 ? (<p className="text-[#f0f2f7] py-[8px] px-[5px] mb-[10px]">No teams added yet.</p>) : (
                favTeams.map(team => (
                  <div key={team.id} className="flex mb-[10px] py-[8px] px-[5px] rounded-[8px] fav-team cursor-pointer" onClick={() => navigate(`/team/${team.sport}/${team.leagueSlug}/${team.id}`)}>
                    <img src={team.logo || '/images/placeholder.png'} className="w-[40px] mr-[15px] object-contain" />
                    <div>
                      <h3 className="text-[#f0f2f7]">{team.name}</h3>
                      <h4 className="text-[#f0f2f7]">{team.league}</h4>
                    </div>
                  </div>
                ))
              )}
            </div>
            <span id="add-team-button" className="text-[#3b82f6] mt-[20px] py-[8px] px-[10px] rounded-[5px] cursor-pointer" onClick={() => navigate('/myteams')}>+ Add a team</span>
          </section>

          <main className="w-[76%]">

              <section className="px-[40px] pt-[30px] pb-[20px]">
                <h2 className="text-[#f0f2f7] text-[1.4rem]">Today's Games</h2>
                <div className="flex gap-[20px] justify-start flex-wrap mt-[20px]">
                  {todaysGames.length === 0 ? (<p className="text-[#f0f2f7]">No games today. Add teams to see today's games.</p>) : (
                    todaysGames.map(event => {
                      const comp = event.competitions?.[0]
                      const home = comp?.competitors?.find(c => c.homeAway === 'home')
                      const away = comp?.competitors?.find(c => c.homeAway === 'away')
                      return (
                        <GameCard
                          key={event.id}
                          status={getStatus(event)}
                          time={getTime(event)}
                          homeTeam={home?.team?.displayName}
                          awayTeam={away?.team?.displayName}
                          homeScore={home?.score?.displayValue ?? home?.score}
                          awayScore={away?.score?.displayValue ?? away?.score}
                        />
                      )
                    })
                  )}
                </div>
              </section>

              <section className="px-[40px] pt-[10px] pb-[20px]">
                <h2 className="text-[#f0f2f7] text-[1.4rem]">Upcoming Games</h2>
                <div className="flex gap-x-[20px] justify-start flex-wrap mt-[20px]">
                  {upcomingGames.length === 0 ? (<p className="text-[#f0f2f7]">No upcoming games. Add teams to see upcoming games.</p>) : (
                    upcomingGames.map(event => {
                      const comp = event.competitions?.[0]
                      const home = comp?.competitors?.find(c => c.homeAway === 'home')
                      const away = comp?.competitors?.find(c => c.homeAway === 'away')
                      return (
                        <GameCard
                          key={event.id}
                          status={getStatus(event)}
                          time={getTime(event)}
                          homeTeam={home?.team?.displayName}
                          awayTeam={away?.team?.displayName}
                        />
                      )
                    })
                  )}
                </div>
              </section>

              {standings.length > 0 && (
                <section className="px-[40px] pt-[10px] pb-[40px]">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[#f0f2f7] text-[1.4rem]">{standingsTitle || 'Standings'}</h2>
                    <div className="flex">
                      <div className="mx-[5px] border border-[rgba(255,255,255,0.07)] rounded-[5px] px-[10px] standings-nav cursor-pointer" onClick={() => setStandingsIndex(i => Math.max(0, i - 1))}>&lt;</div>
                      <div className="mx-[5px] border border-[rgba(255,255,255,0.07)] rounded-[5px] px-[10px] standings-nav cursor-pointer" onClick={() => setStandingsIndex(i => Math.min(standingsGroups.length - 1, i + 1))}>&gt;</div>
                    </div>
                  </div>
                  <div className="w-full bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] mt-[20px]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 pl-5 text-left font-['Barlow_Condensed',_sans-serif] font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">#</th>
                          <th className="p-2 pl-5 text-left font-['Barlow_Condensed',_sans-serif] font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">Team</th>
                          <th className="p-2 text-center font-['Barlow_Condensed',_sans-serif] font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">W</th>
                          <th className="p-2 text-center font-['Barlow_Condensed',_sans-serif] font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">L</th>
                          <th className="p-2 pr-4 text-center font-['Barlow_Condensed',_sans-serif] font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">
                              {['NHL', 'MLS'].includes(standingsGroups[standingsIndex]?.leagueKey) ? 'PTS' : 'PCT'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((entry, index) => {
                          const isUserTeam = favTeams.some(t =>
                            entry.team?.displayName?.toLowerCase().includes(t.name.toLowerCase())
                          )
                          const wins = entry.stats?.find(s => s.name === 'wins')?.displayValue || '0'
                          const losses = entry.stats?.find(s => s.name === 'losses')?.displayValue || '0'
                          const pct = entry.stats?.find(s => s.name === 'winPercent')?.displayValue || entry.stats?.find(s => s.name === 'points')?.displayValue || '0'
                          return (
                            <tr key={entry.team?.id} className={`standings-row ${isUserTeam ? 'bg-[rgba(59,130,246,0.12)]' : ''}`}>
                              <td className="rank-cell p-2 pl-5 font-['Barlow_Condensed',_sans-serif] font-semibold text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)] w-7">{index + 1}</td>
                              <td className={`p-2 pl-5 text-[15px] border-b border-[rgba(255,255,255,0.07)] ${isUserTeam ? 'text-[#3b82f6]' : 'text-[#f0f2f7]'}`}>{entry.team?.displayName}</td>
                              <td className="p-2 text-[15px] text-[#f0f2f7] text-center border-b border-[rgba(255,255,255,0.07)]">{wins}</td>
                              <td className="p-2 text-[15px] text-[#f0f2f7] text-center border-b border-[rgba(255,255,255,0.07)]">{losses}</td>
                              <td className="p-2 pr-4 text-[15px] text-[#f0f2f7] text-center border-b border-[rgba(255,255,255,0.07)]">{pct}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
          </main>
        </div>
      </div>
    )
}