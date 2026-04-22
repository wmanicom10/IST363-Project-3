const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'
const ESPN_BASE_V2 = 'https://site.api.espn.com/apis/v2/sports'

export const LEAGUES = {
    NFL:   { sport: 'football',    league: 'nfl'            },
    NBA:   { sport: 'basketball',  league: 'nba'            },
    MLB:   { sport: 'baseball',    league: 'mlb'            },
    NHL:   { sport: 'hockey',      league: 'nhl'            },
    MLS:   { sport: 'soccer',      league: 'usa.1'          },
}

export async function getScoreboard(leagueKey) {
    const { sport, league } = LEAGUES[leagueKey]
    const res = await fetch(`${ESPN_BASE}/${sport}/${league}/scoreboard`)
    const data = await res.json()
    return data.events || []
}

export async function getStandings(leagueKey) {
    const { sport, league } = LEAGUES[leagueKey]
    const res = await fetch(`${ESPN_BASE_V2}/${sport}/${league}/standings`)
    const data = await res.json()
    return data.children || []
}

export async function searchTeams(query) {
    const results = []
    for (const key of Object.keys(LEAGUES)) {
        const { sport, league } = LEAGUES[key]
        try {
            const res = await fetch(`${ESPN_BASE}/${sport}/${league}/teams`)
            const data = await res.json()
            const teams = data.sports?.[0]?.leagues?.[0]?.teams || []
            const matches = teams
                .map(t => t.team)
                .filter(t => t.displayName.toLowerCase().includes(query.toLowerCase()))
                .map(t => ({
                    id: t.id,
                    name: t.displayName,
                    abbreviation: t.abbreviation,
                    logo: t.logos?.[0]?.href || '',
                    league: key,
                    sport: sport,
                    leagueSlug: league,
                }))
            results.push(...matches)
        } catch (e) {
            console.error(`Failed to search ${key}:`, e)
        }
    }
    return results
}

export async function getTeam(sport, league, teamId) {
    const res = await fetch(`${ESPN_BASE}/${sport}/${league}/teams/${teamId}`)
    const data = await res.json()
    return data.team || null
}

export async function getTeamResults(sport, league, teamId) {
    const dates = []
    for (let i = 1; i <= 14; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString().slice(0, 10).replace(/-/g, ''))
    }

    const responses = await Promise.all(
        dates.map(d => fetch(`${ESPN_BASE}/${sport}/${league}/scoreboard?dates=${d}`).then(r => r.json()))
    )

    const allEvents = responses.flatMap(data => data.events || [])

    const teamEvents = allEvents.filter(event => {
        const competitors = event.competitions?.[0]?.competitors || []
        const isTeam = competitors.some(c => c.team?.id === teamId || c.team?.id === String(teamId))
        const isCompleted = event.competitions?.[0]?.status?.type?.completed === true
        return isTeam && isCompleted
    })

    teamEvents.sort((a, b) => new Date(b.date) - new Date(a.date))

    return teamEvents.slice(0, 6)
}

export async function getTeamUpcoming(sport, league, teamId) {
    const dates = []
    for (let i = 1; i <= 14; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        dates.push(date.toISOString().slice(0, 10).replace(/-/g, ''))
    }

    const responses = await Promise.all(
        dates.map(d => fetch(`${ESPN_BASE}/${sport}/${league}/scoreboard?dates=${d}`).then(r => r.json()))
    )

    const allEvents = responses.flatMap(data => data.events || [])

    const teamEvents = allEvents.filter(event => {
        const competitors = event.competitions?.[0]?.competitors || []
        return competitors.some(c => c.team?.id === teamId || c.team?.id === String(teamId))
    })

    return teamEvents.slice(0, 6)
}

export async function getLeagueSchedule(leagueKey) {
    const { sport, league } = LEAGUES[leagueKey]
    
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 14)

    const startStr = start.toISOString().slice(0, 10).replace(/-/g, '')
    const endStr = end.toISOString().slice(0, 10).replace(/-/g, '')

    const res = await fetch(`${ESPN_BASE}/${sport}/${league}/scoreboard?dates=${startStr}-${endStr}`)
    const data = await res.json()
    return data.events || []
}