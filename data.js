/* World Cup 2026 Predictor — data layer (real-data mode) */
(function () {
  var APP_NOW = new Date();

  var groupsRaw = {
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

  var teams = {};
  Object.entries(groupsRaw).forEach(function(entry) {
    var g = entry[0], arr = entry[1];
    arr.forEach(function(item) {
      var name = item[0], code = item[1];
      teams[name] = { name: name, code: code, group: g, flag: 'https://flagcdn.com/w160/' + code + '.png' };
    });
  });

  var groupLetters = Object.keys(groupsRaw);

  var scoring = {
    exactGroup: 3, outcomeGroup: 1,
    exactKnockout: 5, outcomeKnockout: 1,
    referral: 2,
    describe: 'Exact score 3 pts · Right result 1 pt · Knockout exact 5 pts',
  };

  function isKnockout(stage) { return stage && stage !== 'Group Stage'; }

  function pointsFor(pred, m) {
    if (!pred || m.scoreA == null) return 0;
    var exact = pred.a === m.scoreA && pred.b === m.scoreB;
    var sign = function(x, y) { return x > y ? 1 : x < y ? -1 : 0; };
    var right = sign(pred.a, pred.b) === sign(m.scoreA, m.scoreB);
    var ko = isKnockout(m.stage);
    if (exact) return ko ? scoring.exactKnockout : scoring.exactGroup;
    if (right) return ko ? scoring.outcomeKnockout : scoring.outcomeGroup;
    return 0;
  }

  // Single source of truth for a user's points. Both the Profile screen and the
  // Leaderboard derive scores from this — never from a stored counter — so the
  // two surfaces can never disagree, and totals self-heal from the raw picks.
  // preds: { matchId: { a, b } }  ·  matches: array of fixtures (WC.matches)
  function computeUserTotals(preds, matches, matchdaySet, referralCount) {
    var byId = {};
    (matches || []).forEach(function(m) { byId[m.id] = m; });
    var total = 0, exact = 0, result = 0, played = 0, picks = 0, matchdayPts = 0;
    var wagerNet = 0, wagerWins = 0, wagerLosses = 0;
    // Collect settled picks so we can also derive the current scoring streak,
    // which needs the picks in chronological order.
    var settled = [];
    Object.keys(preds || {}).forEach(function(id) {
      var p = preds[id];
      if (p && p.a != null && p.b != null) picks++;
      var m = byId[id];
      if (m && m.status === 'finished' && m.scoreA != null) {
        played++;
        var pts = pointsFor(p, m);
        total += pts;
        var exactThreshold = isKnockout(m.stage) ? scoring.exactKnockout : scoring.exactGroup;
        if (pts >= exactThreshold) exact++;
        else if (pts > 0) result++;
        if (matchdaySet && matchdaySet.has && matchdaySet.has(m.id)) matchdayPts += pts;
        // Wager outcome: correct prediction doubles the stake, wrong loses it.
        var stake = (p && p.stake) || 0;
        if (stake > 0) {
          if (pts > 0) { wagerNet += stake; wagerWins++; }
          else { wagerNet -= stake; wagerLosses++; }
        }
        settled.push({ kickoff: m.kickoff, pts: pts });
      }
    });
    // Current streak = consecutive most-recent settled picks that scored points.
    // Walk newest→oldest, stop at the first miss.
    settled.sort(function(a, b) { return new Date(b.kickoff) - new Date(a.kickoff); });
    var streak = 0;
    for (var i = 0; i < settled.length; i++) {
      if (settled[i].pts > 0) streak++; else break;
    }
    // Referral bonus: +3 pts per friend invited. Folded into the same single
    // source of truth so Profile and Leaderboard never disagree, and it self-
    // heals from the raw /referrals records (never a stored counter).
    var referralPts = scoring.referral * (referralCount || 0);
    total += referralPts + wagerNet;
    // Floor at 0 — losing wagers can't push a player into negative territory.
    total = Math.max(0, total);
    return { total: total, exact: exact, result: result, played: played,
             picks: picks, matchdayPts: matchdayPts, streak: streak,
             referrals: (referralCount || 0), referralPts: referralPts,
             wagerNet: wagerNet, wagerWins: wagerWins, wagerLosses: wagerLosses };
  }

  // The set of match ids belonging to the latest active "matchday" — used for the
  // Today/Matchday leaderboard. Groups fixtures by UTC calendar date of kickoff and
  // returns the ids of the most recent date that has any finished or live match.
  // Empty pre-tournament (nothing has kicked off yet).
  function currentMatchdaySet(matches) {
    var byDate = {}; // 'YYYY-MM-DD' -> [ids], plus a flag for any active match
    var activeDates = {};
    (matches || []).forEach(function(m) {
      if (!m.kickoff) return;
      var day = new Date(m.kickoff).toISOString().slice(0, 10);
      (byDate[day] = byDate[day] || []).push(m.id);
      if (m.status === 'finished' || m.status === 'live') activeDates[day] = true;
    });
    var days = Object.keys(activeDates).sort(); // ascending; last = latest active
    var set = new Set();
    if (days.length) {
      (byDate[days[days.length - 1]] || []).forEach(function(id) { set.add(id); });
    }
    return set;
  }

  // Derived achievements — single catalog drives both "did you earn it" (test) and
  // the "how to get it" description shown when a badge is tapped. Nothing is stored;
  // earned state is recomputed from metrics. `test(metrics, rank)` -> bool.
  // Sharpshooter/Deadeye are tiered (exact ranges) so only one shows at a time.
  var BADGE_CATALOG = [
    { key:'podium',      emoji:'🏆',  label:'Podium',
      how:'Finish in the top 3 of the overall leaderboard.',
      test:function(m, rank){ return rank >= 1 && rank <= 3; } },
    { key:'deadeye',     emoji:'🎯',  label:'Deadeye',
      how:'Nail 5 or more exact scorelines.',
      test:function(m){ return (m.exact || 0) >= 5; } },
    { key:'sharpshooter',emoji:'🎯',  label:'Sharpshooter',
      how:'Predict your first exact scoreline.',
      test:function(m){ return (m.exact || 0) >= 1 && (m.exact || 0) < 5; } },
    { key:'onfire',      emoji:'🔥',  label:'On Fire',
      how:'Score points in 3 matches in a row.',
      test:function(m){ return (m.streak || 0) >= 3; } },
    { key:'centurion',   emoji:'💯',  label:'Centurion',
      how:'Reach 100 total points.',
      test:function(m){ return (m.total || 0) >= 100; } },
    { key:'veteran',     emoji:'🎟️', label:'Veteran',
      how:'Predict 20 settled matches.',
      test:function(m){ return (m.played || 0) >= 20; } },
  ];

  // metrics: output of computeUserTotals · rank: overall rank (0/undefined if unknown).
  // Returns ordered list of earned { key, emoji, label, how }.
  function computeBadges(metrics, rank) {
    var m = metrics || {};
    var r = rank || 0;
    return BADGE_CATALOG.filter(function(b){ return b.test(m, r); });
  }

  function calcGroupStandings(groupLetter) {
    // Build the table from the LIVE fixtures, not the hardcoded groupsRaw roster.
    // The real draw + API team names (e.g. "United States", not "USA") don't
    // match the placeholder roster, so keying off groupsRaw left every team on
    // zero. Deriving teams from the group's own matches is correct for any draw.
    var allMatches = (window.WC && window.WC.matches) ? window.WC.matches : [];
    var groupMatches = allMatches.filter(function(m) { return m.group === groupLetter; });
    var table = {};
    function ensure(name) {
      if (name && !table[name]) table[name] = { team: name, p:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 };
    }
    // Seed every team that appears in the group (so upcoming teams show with 0s).
    groupMatches.forEach(function(m) { ensure(m.teamA); ensure(m.teamB); });
    // Accumulate only finished matches with real scores.
    groupMatches.forEach(function(m) {
      if (m.status !== 'finished' || m.scoreA == null || m.scoreB == null) return;
      var a = table[m.teamA], b = table[m.teamB];
      if (!a || !b) return;
      a.p++; b.p++;
      a.gf += m.scoreA; a.ga += m.scoreB;
      b.gf += m.scoreB; b.ga += m.scoreA;
      a.gd = a.gf - a.ga; b.gd = b.gf - b.ga;
      if (m.scoreA > m.scoreB) { a.w++; a.pts+=3; b.l++; }
      else if (m.scoreA < m.scoreB) { b.w++; b.pts+=3; a.l++; }
      else { a.d++; a.pts++; b.d++; b.pts++; }
    });
    return Object.values(table).sort(function(a, b) { return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf; });
  }

  window.WC = {
    APP_NOW: APP_NOW,
    teams: teams,
    groupsRaw: groupsRaw,
    groupLetters: groupLetters,
    matches: [],
    me: {},
    users: [],
    scoring: scoring,
    isKnockout: isKnockout,
    pointsFor: pointsFor,
    computeUserTotals: computeUserTotals,
    currentMatchdaySet: currentMatchdaySet,
    computeBadges: computeBadges,
    BADGE_CATALOG: BADGE_CATALOG,
    calcGroupStandings: calcGroupStandings,
    stages: ['Group Stage','Round of 32','Round of 16','Quarter-finals','Semi-finals','Third-place','Final'],
  };
})();
