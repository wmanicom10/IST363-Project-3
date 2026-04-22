import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getTeam, getTeamResults, getTeamUpcoming, LEAGUES } from '../api'
import Header from '../components/Header'

export default function Team() {
  const { sport, leagueSlug, teamId } = useParams()
  const [team, setTeam] = useState(null)
  const [recentResults, setRecentResults] = useState([])
  const [upcomingSchedule, setUpcomingSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    const fetchTeamData = async () => {
        setLoading(true)

        const [teamData, results, upcoming] = await Promise.all([
            getTeam(sport, leagueSlug, teamId),
            getTeamResults(sport, leagueSlug, teamId),
            getTeamUpcoming(sport, leagueSlug, teamId),
        ])

        const stored = localStorage.getItem('favTeams')
        const favTeams = stored ? JSON.parse(stored) : []
        const savedTeam = favTeams.find(t => t.id === teamId || t.id === parseInt(teamId))

        setTeam({ ...teamData, league: savedTeam?.league || leagueSlug.toUpperCase(), sport, leagueSlug })
        setRecentResults(results)
        setUpcomingSchedule(upcoming)
        setLoading(false)
    }
    fetchTeamData()
  }, [teamId])
  
  useEffect(() => {
      if (!team) return
      const stored = localStorage.getItem('favTeams')
      const favTeams = stored ? JSON.parse(stored) : []
      setIsFavorited(favTeams.some(t => t.id === teamId || t.id === parseInt(teamId)))
  }, [team, teamId])

  const toggleFavorite = () => {
      const stored = localStorage.getItem('favTeams')
      const favTeams = stored ? JSON.parse(stored) : []

      if (isFavorited) {
          const updated = favTeams.filter(t => t.id !== teamId && t.id !== parseInt(teamId))
          localStorage.setItem('favTeams', JSON.stringify(updated))
          setIsFavorited(false)
      } else {
          const newTeam = {
              id: team.id,
              name: team.displayName,
              league: team.league,
              logo: team.logos?.[0]?.href || '',
              sport: team.sport,
              leagueSlug: team.leagueSlug,
          }
          favTeams.push(newTeam)
          localStorage.setItem('favTeams', JSON.stringify(favTeams))
          setIsFavorited(true)
      }
  }

  if (loading) return (
    <div className="bg-[#0d0f14] min-h-screen font-['Barlow',sans-serif] text-[#f0f2f7]">
      <Header />
      <p className="px-[40px] pt-[40px] text-[#f0f2f7]">Loading...</p>
    </div>
  )

  if (!team) return (
    <div className="bg-[#0d0f14] min-h-screen font-['Barlow',sans-serif] text-[#f0f2f7]">
      <Header />
      <p className="px-[40px] pt-[40px] text-[#f0f2f7]">Team not found.</p>
    </div>
  )

  return (
    <div className="bg-[#0d0f14] font-['Barlow',sans-serif] text-[#f0f2f7] min-h-screen">
      <Header />

      <main className="py-[30px] px-[40px]">
        <div className="bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[24px] py-[15px] flex items-center justify-between mb-[20px] team-container">
          <div className="flex items-center gap-[20px]">
            <img src={team.logos?.[0]?.href} className="w-[64px] h-[64px] object-contain" />
            <div>
              <h2 className="text-[#f0f2f7] text-[1.4rem]">{team.displayName}</h2>
              <p className="text-[#f0f2f7] text-[18px]">{team.league}</p>
            </div>
          </div>
          <button onClick={toggleFavorite} className={`flex items-center gap-[8px] border px-[16px] py-[8px] rounded-[8px] fav-btn ${isFavorited ? 'border-[#3b82f6] text-[#3b82f6] bg-[rgba(59,130,246,0.12)]' : 'border-[rgba(255,255,255,0.07)] text-[#f0f2f7]'}`}>
              <span className="text-[18px]">{isFavorited ? '★' : '☆'}</span>
              <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
          </button>
        </div>

        <div className="flex gap-[16px] mb-[20px]">
          <div className="flex-1 bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[20px] py-[16px] text-center">
            <p className="text-[20px] font-bold text-[#f0f2f7]">{team.record?.items?.[0]?.summary || '—'}</p>
            <p className="text-[#f0f2f7] uppercase mt-[4px]">Record</p>
          </div>
          <div className="flex-1 bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[20px] py-[16px] text-center">
            <p className="text-[20px] font-bold text-[#f0f2f7]">{team.standingSummary || '—'}</p>
            <p className="text-[#f0f2f7] uppercase mt-[4px]">Standing</p>
          </div>
          <div className="flex-1 bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[20px] py-[16px] text-center">
            <p className="text-[20px] font-bold text-[#f0f2f7]">{(() => {
              const venue = team.venue || team.franchise?.venue
              return venue?.address?.city && venue?.address?.state ? `${venue.address.city}, ${venue.address.state}` : '—'})()}</p>
            <p className="text-[#f0f2f7] uppercase mt-[4px]">Location</p>
          </div>
        </div>

        <div className="flex gap-[20px] items-start">
          <div className="w-[50%] bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] overflow-hidden">
            <div className="px-[20px] py-[14px] border-b border-[rgba(255,255,255,0.07)]">
              <h3 className="text-[#f0f2f7]">Recent Results</h3>
            </div>
            <div>
              {recentResults.length === 0 && (<p className="text-[#f0f2f7] px-[20px] py-[12px]">No recent results.</p>)}
              {recentResults.map((event, index) => {
                const competition = event.competitions?.[0]
                const home = competition?.competitors?.find(c => c.homeAway === 'home')
                const away = competition?.competitors?.find(c => c.homeAway === 'away')
                const isHome = home?.team?.id === teamId
                const opponent = isHome ? away : home
                const us = isHome ? home : away
                const won = us?.winner
                return (
                  <div key={event.id} className={`flex items-center px-[20px] py-[12px] schedule-row ${index !== recentResults.length - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}>
                    <span className={`font-bold w-[20px] ${won ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{won ? 'W' : 'L'}</span>
                    <span className="text-[#f0f2f7] flex-1 ml-[20px]">{isHome ? 'vs' : '@'} {opponent?.team?.displayName}</span>
                    <span className="text-[#f0f2f7]">
                      {us?.score?.displayValue ?? us?.score} - {opponent?.score?.displayValue ?? opponent?.score}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="w-[50%] bg-[#151820] border border-[rgba(255,255,255,0.07)] rounded-[10px] overflow-hidden">
            <div className="px-[20px] py-[14px] border-b border-[rgba(255,255,255,0.07)]">
              <h3 className="text-[#f0f2f7]">Upcoming Schedule</h3>
            </div>
            <div>
              {upcomingSchedule.length === 0 && (<p className="text-[#f0f2f7] px-[20px] py-[12px]">No upcoming games.</p>)}
              {upcomingSchedule.map((event, index) => {
                const competition = event.competitions?.[0]
                const home = competition?.competitors?.find(c => c.homeAway === 'home')
                const away = competition?.competitors?.find(c => c.homeAway === 'away')
                const isHome = home?.team?.id === teamId
                const opponent = isHome ? away : home
                const date = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const time = new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                return (
                  <div key={event.id} className={`flex items-center justify-between px-[20px] py-[12px] schedule-row ${index !== upcomingSchedule.length - 1 ? 'border-b border-[rgba(255,255,255,0.07)]' : ''}`}>
                    <span className="text-[#f0f2f7]">{isHome ? 'vs' : '@'} {opponent?.team?.displayName}</span>
                    <span className="text-[#f0f2f7]">{date} · {time}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}