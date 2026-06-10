/* World Cup 2026 Predictor — data layer */
(function () {
  const APP_NOW = new Date('2026-06-20T18:00:00Z');

  const groupsRaw = {
    A: [['Mexico','mx'],['Croatia','hr'],['Egypt','eg'],['Saudi Arabia','sa']],
    B: [['Canada','ca'],['Uruguay','uy'],['Nigeria','ng'],['Qatar','qa']],
    C: [['USA','us'],['Colombia','co'],['Ivory Coast','ci'],['Uzbekistan','uz']],
    D: [['Argentina','ar'],['Morocco','ma'],['Tunisia','tn'],['Jordan','jo']],
    E: [['France','fr'],['Japan','jp'],['Norway','no'],['Panama','pa']],
    F: [['Brazil','br'],['Senegal','sn'],['Sweden','se'],['Costa Rica','cr']],
    G: [['England','gb-eng'],['Switzerland','ch'],['Ghana','gh'],['New Zealand','nz']],
    H: [['Spain','es'],['Denmark','dk'],['Serbia','rs'],['Cape Verde','cv']],
    I: [['Portugal','pt'],['South Korea','kr'],['Poland','pl'],['Jamaica','jm']],
    J: [['Netherlands','nl'],['Iran','ir'],['Austria','at'],['Curaçao','cw']],
    K: [['Germany','de'],['Australia','au'],['Ukraine','ua'],['Paraguay','py']],
    L: [['Belgium','be'],['Ecuador','ec'],['Peru','pe'],['Algeria','dz']],
  };

  const teams = {};
  Object.entries(groupsRaw).forEach(([g, arr]) => {
    arr.forEach(([name, code]) => {
      teams[name] = { name, code, group: g, flag: `https://flagcdn.com/w160/${code}.png` };
    });
  });

  const cities = [
    { city: 'Mexico City', venue: 'Estadio Azteca', country: 'MEX' },
    { city: 'Guadalajara', venue: 'Estadio Akron', country: 'MEX' },
    { city: 'Monterrey', venue: 'Estadio BBVA', country: 'MEX' },
    { city: 'Toronto', venue: 'BMO Field', country: 'CAN' },
    { city: 'Vancouver', venue: 'BC Place', country: 'CAN' },
    { city: 'Atlanta', venue: 'Mercedes-Benz Stadium', country: 'USA' },
    { city: 'Boston', venue: 'Gillette Stadium', country: 'USA' },
    { city: 'Dallas', venue: 'AT&T Stadium', country: 'USA' },
    { city: 'Houston', venue: 'NRG Stadium', country: 'USA' },
    { city: 'Kansas City', venue: 'Arrowhead Stadium', country: 'USA' },
    { city: 'Los Angeles', venue: 'SoFi Stadium', country: 'USA' },
    { city: 'Miami', venue: 'Hard Rock Stadium', country: 'USA' },
    { city: 'New York / NJ', venue: 'MetLife Stadium', country: 'USA' },
    { city: 'Philadelphia', venue: 'Lincoln Financial Field', country: 'USA' },
    { city: 'San Francisco', venue: "Levi's Stadium", country: 'USA' },
    { city: 'Seattle', venue: 'Lumen Field', country: 'USA' },
  ];

  function rng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 6; i++) next();
    return next;
  }

  const matches = [];
  let mid = 0;
  const rr = [[0,1],[2,3],[0,2],[3,1],[0,3],[1,2]];
  const groupLetters = Object.keys(groupsRaw);

  groupLetters.forEach((g, gi) => {
    const arr = groupsRaw[g].map(([name]) => name);
    rr.forEach((pair, ri) => {
      const r = rng((gi + 1) * 100 + ri + 7);
      const md = Math.floor(ri / 2);
      const dayOffset = gi % 4 + md * 6;
      const d = new Date('2026-06-11T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + dayOffset);
      const hour = [16, 19, 22, 1][ri % 4];
      d.setUTCHours(hour, 0, 0, 0);
      const venue = cities[(mid) % cities.length];
      const m = {
        id: 'm' + (++mid),
        stage: 'Group Stage',
        group: g,
        teamA: arr[pair[0]],
        teamB: arr[pair[1]],
        kickoff: d.toISOString(),
        city: venue.city,
        venue: venue.venue,
        country: venue.country,
      };
      const kt = new Date(m.kickoff);
      if (kt.getTime() < APP_NOW.getTime() - 2 * 3600 * 1000) {
        m.status = 'finished';
        m.scoreA = Math.floor(r() * 4);
        m.scoreB = Math.floor(r() * 4);
      } else if (kt.getTime() < APP_NOW.getTime() + 2 * 3600 * 1000) {
        m.status = 'live';
        m.scoreA = Math.floor(r() * 3);
        m.scoreB = Math.floor(r() * 3);
        m.minute = 63;
      } else {
        m.status = 'scheduled';
      }
      matches.push(m);
    });
  });

  const knockout = [
    { stage: 'Round of 32', n: 16, start: '2026-06-28', cities: [11,7,5,12] },
    { stage: 'Round of 16', n: 8, start: '2026-07-04', cities: [13,10,3,8] },
    { stage: 'Quarter-finals', n: 4, start: '2026-07-09', cities: [12,5,0,4] },
    { stage: 'Semi-finals', n: 2, start: '2026-07-14', cities: [8,12] },
    { stage: 'Third-place', n: 1, start: '2026-07-18', cities: [11] },
    { stage: 'Final', n: 1, start: '2026-07-19', cities: [12] },
  ];
  knockout.forEach((ko) => {
    for (let i = 0; i < ko.n; i++) {
      const d = new Date(ko.start + 'T20:00:00Z');
      d.setUTCDate(d.getUTCDate() + Math.floor(i / 2));
      const venue = cities[ko.cities[i % ko.cities.length]];
      matches.push({
        id: 'm' + (++mid),
        stage: ko.stage,
        group: null,
        teamA: null,
        teamB: null,
        slotA: ko.stage === 'Round of 32' ? `Winner ${groupLetters[(i*2) % 12]}` : 'TBD',
        slotB: ko.stage === 'Round of 32' ? `Runner-up ${groupLetters[(i*2+1) % 12]}` : 'TBD',
        kickoff: d.toISOString(),
        city: venue.city,
        venue: venue.venue,
        country: venue.country,
        status: 'scheduled',
      });
    }
  });

  const scoring = {
    exactGroup: 3, outcomeGroup: 1,
    exactKnockout: 5, outcomeKnockout: 1,
    describe: 'Exact score 3 pts · Right result 1 pt · Knockout exact 5 pts',
  };

  function isKnockout(stage) { return stage && stage !== 'Group Stage'; }
  function pointsFor(pred, m) {
    if (!pred || m.scoreA == null) return 0;
    const exact = pred.a === m.scoreA && pred.b === m.scoreB;
    const sign = (x, y) => (x > y ? 1 : x < y ? -1 : 0);
    const right = sign(pred.a, pred.b) === sign(m.scoreA, m.scoreB);
    const ko = isKnockout(m.stage);
    if (exact) return ko ? scoring.exactKnockout : scoring.exactGroup;
    if (right) return ko ? scoring.outcomeKnockout : scoring.outcomeGroup;
    return 0;
  }

  // Group standings calculator
  function calcGroupStandings(groupLetter, predictions) {
    const groupTeams = groupsRaw[groupLetter].map(([name]) => name);
    const groupMatches = matches.filter(m => m.group === groupLetter && m.status === 'finished');
    const table = {};
    groupTeams.forEach(t => { table[t] = { team: t, p:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 }; });
    groupMatches.forEach(m => {
      const a = table[m.teamA], b = table[m.teamB];
      if (!a || !b) return;
      a.p++; b.p++;
      a.gf += m.scoreA; a.ga += m.scoreB;
      b.gf += m.scoreB; b.ga += m.scoreA;
      a.gd = a.gf - a.ga; b.gd = b.gf - b.ga;
      if (m.scoreA > m.scoreB) { a.w++; a.pts+=3; b.l++; }
      else if (m.scoreA < m.scoreB) { b.w++; b.pts+=3; a.l++; }
      else { a.d++; a.pts++; b.d++; b.pts++; }
    });
    return Object.values(table).sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
  }

  const me = {
    uid: 'me', displayName: 'Sofia Marquez', email: 'sofia.marquez@gmail.com',
    photo: 'https://i.pravatar.cc/160?img=47', favTeam: 'Argentina',
  };
  const myPredictions = {};
  matches.forEach((m, idx) => {
    const r = rng(idx * 13 + 3);
    if (m.status === 'live') {
      myPredictions[m.id] = { a: Math.floor(r() * 4), b: Math.floor(r() * 4) };
    } else if (m.status === 'finished' && r() > 0.3) {
      myPredictions[m.id] = { a: Math.floor(r() * 4), b: Math.floor(r() * 4) };
    } else if (m.status === 'scheduled' && m.stage === 'Group Stage' && r() > 0.45) {
      myPredictions[m.id] = { a: Math.floor(r() * 4), b: Math.floor(r() * 4) };
    }
  });
  ['m1','m13','m25','m37','m49','m61','m7','m19'].forEach((id) => {
    const m = matches.find((x) => x.id === id);
    if (m && m.scoreA != null) myPredictions[id] = { a: m.scoreA, b: m.scoreB };
  });

  function myPoints() {
    let total = 0, exact = 0, correct = 0, played = 0;
    Object.entries(myPredictions).forEach(([id, p]) => {
      const m = matches.find((x) => x.id === id);
      if (m && m.scoreA != null && m.status === 'finished') {
        played++;
        const pts = pointsFor(p, m);
        total += pts;
        if (pts >= 3) exact++; else if (pts >= 1) correct++;
      }
    });
    return { total, exact, correct, played };
  }

  const names = ['Diego Fuentes','Amara Okafor','Liam Chen','Yuki Tanaka','Noah Smith','Emma Rossi','Mateo Silva','Aisha Khan','Lucas Müller','Olivia Brown','Hugo Lefebvre','Sven Johansson','Carlos Vega','Priya Nair','Tomás Núñez','Fatima Zahra','Kwame Mensah','Ji-woo Park','Nina Petrova','Leo Andersson','Marco De Luca','Zara Ali','Felix Wagner','Camila Torres','Omar Haddad','Ingrid Berg','Rafael Costa','Mei Lin','Daniel Cohen','Sara Lind'];
  const users = names.map((n, i) => {
    const r = rng(i * 29 + 11);
    const code = ['ar','br','fr','jp','us','it','mx','ng','de','ca','pt','se','es','in','uy','ma','gh','kr','rs','dk','it','pk','at','co','dz','no','br','cn','il','fi'][i] || 'br';
    return {
      uid: 'u' + i, displayName: n,
      photo: `https://i.pravatar.cc/120?img=${(i % 60) + 1}`,
      favCode: code,
      points: Math.round(44 - i * 1.05 + r() * 6),
      exact: Math.max(0, Math.round(9 - i * 0.28 + r() * 2)),
      played: 30 + Math.round(r() * 8),
    };
  });
  const mine = myPoints();
  users.push({ uid: 'me', displayName: me.displayName, photo: me.photo, favCode: 'ar', points: mine.total, exact: mine.exact, played: mine.played, isMe: true });
  users.sort((a, b) => b.points - a.points || b.exact - a.exact);
  users.forEach((u, i) => { u.rank = i + 1; });

  window.WC = {
    APP_NOW, teams, groupsRaw, groupLetters, cities, matches, knockout,
    scoring, me, myPredictions, users, isKnockout, pointsFor, myPoints, calcGroupStandings,
    stages: ['Group Stage','Round of 32','Round of 16','Quarter-finals','Semi-finals','Third-place','Final'],
  };
})();
