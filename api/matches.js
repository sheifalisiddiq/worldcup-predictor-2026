/* Vercel serverless function — proxies football-data.org to hide the API key.
   Requires FOOTBALL_API_KEY environment variable set in Vercel project settings. */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'FOOTBALL_API_KEY not configured' });
    return;
  }

  try {
    const r = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': apiKey } }
    );
    if (!r.ok) {
      const body = await r.text();
      res.status(r.status).json({ error: 'Upstream API error', detail: body });
      return;
    }

    const data = await r.json();
    const matches = (data.matches || []).map(normalizeMatch);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    res.json({ matches });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function normalizeMatch(m) {
  return {
    id:      String(m.id),
    stage:   normalizeStage(m.stage),
    group:   normalizeGroup(m.group),
    teamA:   m.homeTeam.name || m.homeTeam.shortName || null,
    teamB:   m.awayTeam.name || m.awayTeam.shortName || null,
    slotA:   (!m.homeTeam.name && !m.homeTeam.shortName) ? 'TBD' : null,
    slotB:   (!m.awayTeam.name && !m.awayTeam.shortName) ? 'TBD' : null,
    kickoff: m.utcDate,
    status:  normalizeStatus(m.status),
    scoreA:  m.score && m.score.fullTime ? m.score.fullTime.home : null,
    scoreB:  m.score && m.score.fullTime ? m.score.fullTime.away : null,
    minute:  m.minute || null,
    city:    m.venue || '',
    venue:   m.venue || '',
    country: '',
  };
}

function normalizeStage(s) {
  var map = {
    GROUP_STAGE:    'Group Stage',
    LAST_32:        'Round of 32',
    LAST_16:        'Round of 16',
    QUARTER_FINALS: 'Quarter-finals',
    SEMI_FINALS:    'Semi-finals',
    THIRD_PLACE:    'Third-place',
    FINAL:          'Final',
  };
  return map[s] || s || 'Group Stage';
}

function normalizeGroup(g) {
  if (!g) return null;
  return g.replace('GROUP_', '');
}

function normalizeStatus(s) {
  if (s === 'FINISHED' || s === 'AWARDED') return 'finished';
  if (s === 'IN_PLAY' || s === 'PAUSED')   return 'live';
  return 'scheduled';
}
