import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStandings, getLeagueSchedule, LEAGUES } from '../api'
import Header from '../components/Header'

export default function Leagues() {
  const leagueKeys = ['NFL', 'NBA', 'MLB', 'NHL', 'MLS']

  const navigate = useNavigate()
  const [activeLeague, setActiveLeague] = useState('NFL')
  const [standings, setStandings] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [standingsData, scheduleData] = await Promise.all([
        getStandings(activeLeague),
        getLeagueSchedule(activeLeague),
      ])

      const groups = standingsData.flatMap(group => group.children ? group.children : [group])
      const allEntries = groups.flatMap(g => g.standings?.entries || [])

      allEntries.sort((a, b) => {
        const getVal = (entry, ...names) => {
          for (const name of names) {
            const stat = entry.stats?.find(s => s.name === name)
            if (stat) return stat.value || 0
          }
          return 0
        }
        return getVal(b, 'winPercent', 'points') - getVal(a, 'winPercent', 'points')
      })

      setStandings(allEntries)

      const upcomingEvents = scheduleData.filter(e => {
          const status = e.competitions?.[0]?.status?.type
          const eventDate = new Date(e.date)
          const now = new Date()
          now.setHours(0, 0, 0, 0)
          return !status?.completed && eventDate >= now
      })
      setSchedule(upcomingEvents.slice(0, 10))
      setLoading(false)
    }
    fetchData()
  }, [activeLeague])

  const hasPct = !['NHL', 'MLS'].includes(activeLeague)

  return (
    <div className="bg-[#0d0f14] font-['Barlow',sans-serif] text-[#f0f2f7] min-h-screen">
      <Header />

      <main className="py-[30px] px-[40px]">
        <div className="flex gap-[12px] mb-[28px]">
          {leagueKeys.map(league => (
            <span key={league} onClick={() => setActiveLeague(league)} className={`px-[16px] py-[6px] rounded-[5px] border border-[rgba(255,255,255,0.07)] cursor-pointer league-selector ${
                activeLeague === league
                  ? 'text-[#3b82f6] bg-[rgba(59,130,246,0.12)]'
                  : 'text-[#f0f2f7] bg-[#151820]'
              }`}>
              {league}
            </span>
          ))}
        </div>

        {loading ? (<p className="text-[#f0f2f7]">Loading...</p>) : (
          <div className="flex gap-[25px] items-start">
            <div className="w-[50%] bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px]">
              <div className="px-[20px] py-[14px] border-b border-[rgba(255,255,255,0.07)]">
                <h3 className="text-[#f0f2f7] text-[18px]">League Standings</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 pl-5 text-left font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">Team</th>
                    <th className="p-2 text-center font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">W</th>
                    <th className="p-2 text-center font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">L</th>
                    <th className="p-2 pr-5 text-center font-semibold tracking-widest uppercase text-[#f0f2f7] border-b border-[rgba(255,255,255,0.07)]">{hasPct ? 'PCT' : 'PTS'}</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, index) => {
                    const wins = entry.stats?.find(s => s.name === 'wins')?.displayValue || '0'
                    const losses = entry.stats?.find(s => s.name === 'losses')?.displayValue || '0'
                    const pct = entry.stats?.find(s => s.name === 'winPercent')?.displayValue || entry.stats?.find(s => s.name === 'points')?.displayValue || '0'
                    return (
                      <tr key={entry.team?.id} className="standings-row cursor-pointer" onClick={() => navigate(`/team/${LEAGUES[activeLeague].sport}/${LEAGUES[activeLeague].league}/${entry.team?.id}`)}>
                        <td className={`p-2 pl-5 text-[#f0f2f7] ${index !== standings.length - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}>
                          {entry.team?.displayName}
                        </td>
                        <td className={`p-2 text-[#f0f2f7] text-center ${index !== standings.length - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}>{wins}</td>
                        <td className={`p-2 text-[#f0f2f7] text-center ${index !== standings.length - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}>{losses}</td>
                        <td className={`p-2 pr-5 text-[#f0f2f7] text-center ${index !== standings.length - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}>{pct}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="w-[50%] bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px]">
              <div className="px-[20px] py-[14px] border-b border-[rgba(255,255,255,0.07)]">
                <h3 className="text-[#f0f2f7] text-[18px]">Upcoming Schedule</h3>
              </div>
              <div>
                {schedule.length === 0 && (<p className="text-[#f0f2f7] px-[20px] py-[12px]">No upcoming games.</p>)}
                {schedule.map((event, index) => {
                  const comp = event.competitions?.[0]
                  const home = comp?.competitors?.find(c => c.homeAway === 'home')
                  const away = comp?.competitors?.find(c => c.homeAway === 'away')
                  const date = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  const time = new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  return (
                    <div key={event.id} className={`flex justify-between items-center px-[20px] py-[13px] schedule-row ${index !== schedule.length - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}>
                      <span className="text-[#f0f2f7]">{away?.team?.displayName} vs {home?.team?.displayName}</span>
                      <div className="flex gap-[16px]">
                        <span className="text-[#f0f2f7]">{date}</span>
                        <span className="text-[#f0f2f7]">{time}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}