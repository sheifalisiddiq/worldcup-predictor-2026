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

  function calcGroupStandings(groupLetter) {
    var groupTeams = (groupsRaw[groupLetter] || []).map(function(item) { return item[0]; });
    var allMatches = (window.WC && window.WC.matches) ? window.WC.matches : [];
    var groupMatches = allMatches.filter(function(m) { return m.group === groupLetter && m.status === 'finished'; });
    var table = {};
    groupTeams.forEach(function(t) { table[t] = { team: t, p:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 }; });
    groupMatches.forEach(function(m) {
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
    calcGroupStandings: calcGroupStandings,
    stages: ['Group Stage','Round of 32','Round of 16','Quarter-finals','Semi-finals','Third-place','Final'],
  };
})();
