const { useState, useEffect, useRef, useCallback, useMemo } = React;

// The published website (GitHub Pages) sets window.FL_STATIC: it reads a copy of the league
// from league.json next to the page, is always read-only, and never saves.
const IS_STATIC_SITE = !!window.FL_STATIC;

// Local-file storage: the Python launcher (app.pyw) saves the league to data/league.json.
const localStore = {
  async load() {
    const res = await fetch(IS_STATIC_SITE ? 'league.json' : '/api/data', { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`load failed: ${res.status}`);
    return res.json();
  },
  async save(league) {
    if (IS_STATIC_SITE) return;
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(league),
    });
    if (!res.ok) throw new Error(`save failed: ${res.status}`);
  },
  saveOnExit(league) {
    if (IS_STATIC_SITE) return;
    navigator.sendBeacon('/api/data', new Blob([JSON.stringify(league)], { type: 'application/json' }));
  },
};

function makeIcon(paths) {
  return function Icon({ size = 16, style, className }) {
    return (
      <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={style} className={className} aria-hidden="true"
      >
        {paths.map((d) => <path key={d} d={d} />)}
      </svg>
    );
  };
}
const Plus = makeIcon(['M5 12h14', 'M12 5v14']);
const Trash2 = makeIcon(['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'M10 11v6', 'M14 11v6']);
const Trophy = makeIcon(['M6 9H4.5a2.5 2.5 0 0 1 0-5H6', 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18', 'M4 22h16', 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22', 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22', 'M18 2H6v7a6 6 0 0 0 12 0V2Z']);
const Loader2 = makeIcon(['M21 12a9 9 0 1 1-6.219-8.56']);

const FONT_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Libre+Franklin:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&family=IBM+Plex+Mono:wght@500;600;700&display=swap');

.fl-root {
  --bg: #F1ECDF;
  --panel: #FBF8F0;
  --panel-raised: #FFFFFF;
  --ink: #1B2430;
  --ink-soft: #5B6472;
  --ink-faint: #8B8D7F;
  --turf: #3F6B3B;
  --turf-dark: #2E4F2B;
  --gold: #B8873A;
  --gold-bg: #F2E4C6;
  --rust: #A63E28;
  --divider: #D9D0BC;
  font-family: 'Libre Franklin', sans-serif;
  color: var(--ink);
  background: var(--bg);
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
}
.fl-root *, .fl-root *::before, .fl-root *::after { box-sizing: border-box; }
.fl-display { font-family: 'Anton', sans-serif; font-weight: 400; letter-spacing: 0.02em; text-transform: uppercase; }
.fl-mono { font-family: 'IBM Plex Mono', monospace; }
.fl-root input, .fl-root select, .fl-root button { font-family: inherit; }
.fl-root ::selection { background: var(--gold-bg); }

.fl-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; border: 1.5px solid var(--ink); color: var(--ink);
  padding: 7px 13px; border-radius: 3px; font-size: 12.5px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, transform 0.05s ease;
}
.fl-btn:hover { background: var(--ink); color: var(--panel); }
.fl-btn:active { transform: scale(0.97); }
.fl-btn:focus-visible { outline: 2px solid var(--turf); outline-offset: 2px; }
.fl-btn-turf { border-color: var(--turf-dark); color: var(--turf-dark); }
.fl-btn-turf:hover { background: var(--turf-dark); color: #fff; }
.fl-btn-ghost { border: none; padding: 6px 8px; color: var(--ink-soft); }
.fl-btn-ghost:hover { background: var(--divider); color: var(--ink); }
.fl-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 3px; border: none;
  background: transparent; color: var(--ink-faint); cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.fl-icon-btn:hover { background: #F3DAD0; color: var(--rust); }
.fl-icon-btn:focus-visible { outline: 2px solid var(--turf); outline-offset: 1px; }

.fl-field {
  background: transparent; border: none; border-bottom: 1.5px solid transparent;
  color: var(--ink); font-size: 13.5px; padding: 3px 2px; width: 100%;
  border-radius: 0; min-width: 0;
}
.fl-field:hover { border-bottom-color: var(--divider); }
.fl-field:focus { outline: none; border-bottom-color: var(--turf); background: var(--gold-bg); }
.fl-field-num { text-align: center; font-family: 'IBM Plex Mono', monospace; font-weight: 600; }
.fl-field-name { font-weight: 600; }

.fl-panel {
  background: var(--panel); border: 1px solid var(--divider); border-radius: 4px;
}
.fl-panel-raised { background: var(--panel-raised); }

.fl-table { width: 100%; border-collapse: collapse; }
.fl-table th {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--ink-soft); text-align: center; padding: 8px 6px; border-bottom: 2px solid var(--ink);
  white-space: nowrap;
}
.fl-table th.fl-th-left { text-align: left; }
.fl-table td { padding: 6px 6px; border-bottom: 1px solid var(--divider); vertical-align: middle; }
.fl-table tr:last-child td { border-bottom: none; }
.fl-table tr:hover td { background: rgba(63,107,59,0.05); }

.fl-rank-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--ink);
  font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 11.5px;
  color: var(--ink);
}
.fl-rank-badge.gold { background: var(--gold); border-color: var(--gold); color: #fff; }

.fl-subtab {
  background: transparent; border: none; border-bottom: 3px solid transparent;
  padding: 10px 4px; font-size: 13px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--ink-faint); cursor: pointer; margin-right: 24px;
}
.fl-subtab:hover { color: var(--ink); }
.fl-subtab.active { color: var(--ink); border-bottom-color: var(--turf); }

.fl-matchup {
  background: var(--panel-raised); border: 1px solid var(--divider); border-radius: 4px;
  padding: 8px 10px; margin-bottom: 10px;
}
.fl-matchup-row { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
.fl-matchup-row.winner .fl-field-name { color: var(--turf-dark); font-weight: 800; }
.fl-matchup-score { width: 40px; flex: 0 0 auto; }
.fl-round-col { flex: 1 1 220px; min-width: 220px; }

.fl-trade-card { background: var(--panel-raised); border: 1px solid var(--divider); border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; }
.fl-trade-parties { display: flex; flex-wrap: wrap; gap: 8px; }
.fl-trade-party { border: 1px solid var(--divider); border-radius: 4px; padding: 7px 9px; margin-top: 8px; background: var(--panel); flex: 1 1 230px; min-width: 210px; }
.fl-asset-row { display: flex; align-items: center; gap: 4px; padding: 2px 0; flex-wrap: wrap; }
.fl-asset-tag { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); width: 78px; flex: 0 0 78px; }

.fl-empty {
  border: 1.5px dashed var(--divider); border-radius: 4px; padding: 28px 16px;
  text-align: center; color: var(--ink-faint); font-size: 13px;
}

.fl-scroll-x { overflow-x: auto; }
.fl-view-mode input:not(.fl-keep-in-view),
.fl-view-mode select:not(.fl-keep-in-view),
.fl-view-mode textarea:not(.fl-keep-in-view) {
  pointer-events: none; border: none !important; background: transparent !important;
  -webkit-appearance: none; appearance: none; cursor: default !important;
}
.fl-view-mode input[type="date"]::-webkit-calendar-picker-indicator { display: none; }
.fl-view-mode button:not(.fl-keep-in-view):not(.fl-subtab) { display: none !important; }
.fl-view-mode .fl-tiebreaker-row { display: none !important; }
.fl-bracket-scroll { overflow-x: auto; overflow-y: hidden; padding-bottom: 8px; }
.fl-bracket-header { display: flex; align-items: flex-end; }
.fl-bracket-round-label {
  width: 232px; flex: 0 0 232px; font-family: 'Anton', sans-serif; font-size: 14px;
  color: var(--ink-soft); padding-bottom: 8px;
}
.fl-bracket-round-label + .fl-bracket-round-label { margin-left: 36px; }
.fl-bracket-body { display: flex; align-items: stretch; min-height: 200px; }
.fl-bracket-round { display: flex; flex-direction: column; justify-content: space-around; width: 232px; flex: 0 0 232px; }
.fl-bracket-round + .fl-bracket-round { margin-left: 36px; }
.fl-bracket-match-wrap { position: relative; padding: 6px 0; }
.fl-bracket-round:not(:first-child) .fl-bracket-match-wrap::before,
.fl-bracket-round:not(:first-child) .fl-bracket-match-wrap::after {
  content: ''; position: absolute; right: 100%; width: 18px; border: 0 solid var(--ink-faint);
}
.fl-bracket-round:not(:first-child) .fl-bracket-match-wrap::before { top: 6px; height: 50%; border-top-width: 1.5px; border-right-width: 1.5px; }
.fl-bracket-round:not(:first-child) .fl-bracket-match-wrap::after { bottom: 6px; height: 50%; border-bottom-width: 1.5px; border-right-width: 1.5px; }
.fl-bmatch { background: var(--panel-raised); border: 1px solid var(--divider); border-radius: 4px; padding: 8px 10px; min-height: 62px; }
.fl-bmatch-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 3px 0; }
.fl-bmatch-row.winner .fl-bmatch-name { color: var(--turf-dark); font-weight: 800; }
.fl-bmatch-name { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fl-bmatch-name.tbd { color: var(--ink-faint); font-weight: 500; font-style: italic; }
.fl-bmatch-divider { border-top: 1px solid var(--divider); margin: 2px 0; }
.fl-bmatch-bye { text-align: center; font-family: 'Anton', sans-serif; font-size: 15px; color: var(--ink-faint); letter-spacing: 0.08em; padding: 6px 0; }
@media (max-width: 640px) {
  .fl-hide-mobile { display: none; }
}
.fl-range { position: relative; height: 28px; margin: 4px 8px 0; }
.fl-range-track, .fl-range-fill { position: absolute; top: 12px; height: 4px; border-radius: 2px; pointer-events: none; }
.fl-range-track { left: 0; right: 0; background: var(--divider); }
.fl-range-fill { background: var(--turf); }
.fl-range input[type="range"] {
  position: absolute; left: -8px; width: calc(100% + 16px); top: 0; height: 28px; margin: 0;
  background: transparent; -webkit-appearance: none; appearance: none; pointer-events: none;
}
.fl-range input[type="range"]::-webkit-slider-runnable-track { background: transparent; height: 28px; }
.fl-range input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; pointer-events: auto; cursor: pointer;
  width: 16px; height: 16px; margin-top: 6px; border-radius: 50%;
  background: var(--turf-dark); border: 2px solid #fff; box-shadow: 0 0 0 1.5px var(--turf-dark);
}
.fl-range input[type="range"]:focus-visible { outline: none; }
.fl-range input[type="range"]:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--gold); }
`;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function defaultLeague() {
  return { leagueName: "Squidney's Paradise", years: [] };
}

function emptyYear(yearNum) {
  return {
    id: uid(),
    year: yearNum,
    divisions: [],
    weeks: [],
    playoffBracket: null,
    tiebreaker: 'points',
    trades: [],
  };
}

function emptyDivision(n) {
  return { id: uid(), name: `Division ${n}`, teams: [] };
}

function generateDivisions(numDivisions, teamsPerDivision) {
  return Array.from({ length: numDivisions }, (_, i) => {
    const div = emptyDivision(i + 1);
    div.teams = Array.from({ length: teamsPerDivision }, () => emptyTeam());
    return div;
  });
}

function emptyTeam() {
  return { id: uid(), name: '' };
}

function emptyWeek(weekNum) {
  return { id: uid(), weekNum, games: [] };
}

function emptyGame() {
  return { id: uid(), teamA: '', scoreA: 0, teamB: '', scoreB: 0 };
}

function emptyAsset() {
  return { id: uid(), kind: 'player', player: '', position: '', nflTeam: '', amount: 0 };
}

function emptyParty() {
  return { id: uid(), team: '', receives: [], sends: [] };
}

function emptyTrade() {
  return { id: uid(), date: '', parties: [emptyParty(), emptyParty()] };
}

function migrateYear(y) {
  if (!y.weeks) {
    const weeksMap = {};
    (y.games || []).forEach((g) => {
      const wn = Number(g.week) || 1;
      if (!weeksMap[wn]) weeksMap[wn] = emptyWeek(wn);
      weeksMap[wn].games.push({ id: g.id || uid(), teamA: g.awayTeam || '', scoreA: g.awayScore || 0, teamB: g.homeTeam || '', scoreB: g.homeScore || 0 });
    });
    y.weeks = Object.values(weeksMap).sort((a, b) => a.weekNum - b.weekNum);
  }
  y.weeks.forEach((w) => {
    w.games = w.games.map((g) => {
      if ('teamA' in g) return g;
      return { id: g.id || uid(), teamA: g.awayTeam || '', scoreA: g.awayScore || 0, teamB: g.homeTeam || '', scoreB: g.homeScore || 0 };
    });
  });
  delete y.games;
  if (!y.tiebreaker) y.tiebreaker = 'points';
  if (y.playoffBracket === undefined) y.playoffBracket = null;
  if (!y.trades) y.trades = [];
  return y;
}

function emptyDraft(numTeams, numRounds) {
  return {
    numTeams,
    numRounds,
    teamNames: Array.from({ length: numTeams }, () => ''),
    picks: {},
  };
}

function pickKey(round, col) {
  return `${round}-${col}`;
}

function pickNumber(round, col, numTeams) {
  const pickInRound = round % 2 === 1 ? col : numTeams - col + 1;
  return (round - 1) * numTeams + pickInRound;
}

// "3.04 (28)": round.pick-in-round, then the overall pick, following the snake order.
function pickLabel(round, col, numTeams) {
  const overall = pickNumber(round, col, numTeams);
  const inRound = overall - (round - 1) * numTeams;
  return `${round}.${String(inRound).padStart(2, '0')} (${overall})`;
}

function pickLocationForOverall(overallPick, numTeams) {
  const round = Math.floor((overallPick - 1) / numTeams) + 1;
  const posInRound = overallPick - (round - 1) * numTeams;
  const col = round % 2 === 1 ? posInRound : numTeams - posInRound + 1;
  return { round, col };
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
const POSITION_COLORS = {
  QB: '#BF5E85',
  RB: '#72C3A6',
  WR: '#45A2CA',
  TE: '#CB8C4A',
  K: '#9295D0',
  DEF: '#995F4E',
};

const FANTASY_TEAMS = [
  'Anthony', 'Austin', 'Cade', 'Caleb', 'Chance', 'Dylan', 'John',
  'Kyle', 'Marty', 'Peyton', 'Presley', 'Robbie', 'Santino', 'Zach',
];

const NFL_TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
  'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA',
  'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS',
];

// A game counts once both teams are set and a score has been entered. A 0-0 game is a
// matchup that hasn't been played yet, not a tie, so standings and stats skip it.
function isPlayedGame(g) {
  return !!(g.teamA && g.teamB && ((Number(g.scoreA) || 0) !== 0 || (Number(g.scoreB) || 0) !== 0));
}

function getAllGames(year) {
  const games = [];
  year.weeks.forEach((w) => w.games.forEach((g) => { if (isPlayedGame(g)) games.push(g); }));
  return games;
}

// Weeks (as numbers, in order) that have at least one played game.
function getPlayedWeeks(year) {
  return Array.from(new Set(
    year.weeks.filter((w) => w.games.some(isPlayedGame)).map((w) => Number(w.weekNum) || 0),
  )).sort((a, b) => a - b);
}

function computeTeamSchedule(year, teamName) {
  const rows = [];
  [...year.weeks]
    .sort((a, b) => (Number(a.weekNum) || 0) - (Number(b.weekNum) || 0))
    .forEach((w) => {
      w.games.forEach((g) => {
        if ((g.teamA === teamName || g.teamB === teamName) && !isPlayedGame(g)) {
          const opponent = g.teamA === teamName ? g.teamB : g.teamA;
          rows.push({ weekLabel: `Week ${w.weekNum}`, opponent, own: null, opp: null, result: '—', isBye: false, isPlayoff: false, isUpcoming: true });
        } else if (g.teamA === teamName) {
          const own = Number(g.scoreA) || 0;
          const opp = Number(g.scoreB) || 0;
          rows.push({ weekLabel: `Week ${w.weekNum}`, opponent: g.teamB, own, opp, result: own > opp ? 'W' : own < opp ? 'L' : 'T', isBye: false, isPlayoff: false });
        } else if (g.teamB === teamName) {
          const own = Number(g.scoreB) || 0;
          const opp = Number(g.scoreA) || 0;
          rows.push({ weekLabel: `Week ${w.weekNum}`, opponent: g.teamA, own, opp, result: own > opp ? 'W' : own < opp ? 'L' : 'T', isBye: false, isPlayoff: false });
        }
      });
    });
  return rows;
}

function computeTeamPlayoffSchedule(year, teamName) {
  if (!year.playoffBracket) return [];
  const rounds = computeBracketRounds(year, year.playoffBracket);
  const totalRounds = rounds.length;
  const rows = [];
  rounds.forEach((matchups, ri) => {
    matchups.forEach((m) => {
      const isA = m.teamA && m.teamA.name === teamName;
      const isB = m.teamB && m.teamB.name === teamName;
      if (!isA && !isB) return;
      const weekLabel = playoffRoundLabel(ri, totalRounds);
      const gotBye = (isA && m.isByeB) || (isB && m.isByeA);
      if (gotBye) {
        rows.push({ weekLabel, opponent: null, own: null, opp: null, result: 'BYE', isBye: true, isPlayoff: true });
        return;
      }
      const own = isA ? Number(m.scoreA) || 0 : Number(m.scoreB) || 0;
      const opp = isA ? Number(m.scoreB) || 0 : Number(m.scoreA) || 0;
      const oppTeam = isA ? m.teamB : m.teamA;
      const upcoming = own === 0 && opp === 0;
      const result = upcoming ? '—' : own > opp ? 'W' : own < opp ? 'L' : 'T';
      rows.push({ weekLabel, opponent: oppTeam ? oppTeam.name : 'TBD', own, opp, result, isBye: false, isPlayoff: true, isUpcoming: upcoming });
    });
  });
  return rows;
}

function computeTeamStats(year) {
  const games = getAllGames(year);
  const stats = {};
  const ensure = (name) => {
    if (!stats[name]) stats[name] = { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
    return stats[name];
  };
  games.forEach((g) => {
    if (!g.teamA || !g.teamB) return;
    const a = Number(g.scoreA) || 0;
    const b = Number(g.scoreB) || 0;
    const sa = ensure(g.teamA);
    const sb = ensure(g.teamB);
    sa.pf += a; sa.pa += b;
    sb.pf += b; sb.pa += a;
    if (a > b) { sa.wins += 1; sb.losses += 1; }
    else if (b > a) { sb.wins += 1; sa.losses += 1; }
    else { sa.ties += 1; sb.ties += 1; }
  });
  return stats;
}

function resolveTieGroup(group, stageFactories) {
  if (group.length <= 1 || stageFactories.length === 0) return group;
  const [factory, ...restStages] = stageFactories;
  const metricFor = factory(group);
  const sorted = [...group].sort((a, b) => metricFor(b) - metricFor(a));
  const result = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && metricFor(sorted[j + 1]) === metricFor(sorted[i])) j += 1;
    result.push(...resolveTieGroup(sorted.slice(i, j + 1), restStages));
    i = j + 1;
  }
  return result;
}

function rankNames(names, stageFactories) {
  return resolveTieGroup(names, stageFactories);
}

function computeRanks(year, tiebreaker) {
  const games = getAllGames(year);
  const stats = computeTeamStats(year);
  const emptyStat = { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
  const statFor = (name) => stats[name] || emptyStat;
  const winPctFor = (name) => {
    const s = statFor(name);
    const gp = s.wins + s.losses + s.ties;
    return gp > 0 ? (s.wins + s.ties * 0.5) / gp : 0;
  };

  const nameToDivMates = {};
  year.divisions.forEach((div) => {
    const namesInDiv = div.teams.map((t) => t.name).filter(Boolean);
    namesInDiv.forEach((n) => { nameToDivMates[n] = namesInDiv; });
  });
  const divisionalWinPct = (name) => {
    const mates = (nameToDivMates[name] || []).filter((n) => n !== name);
    let w = 0; let l = 0; let t = 0;
    games.forEach((g) => {
      if (!g.teamA || !g.teamB) return;
      const a = Number(g.scoreA) || 0;
      const b = Number(g.scoreB) || 0;
      if (g.teamA === name && mates.includes(g.teamB)) {
        if (a > b) w += 1; else if (b > a) l += 1; else t += 1;
      } else if (g.teamB === name && mates.includes(g.teamA)) {
        if (b > a) w += 1; else if (a > b) l += 1; else t += 1;
      }
    });
    const gp = w + l + t;
    return gp > 0 ? (w + t * 0.5) / gp : 0;
  };

  // Combined ("round-robin") record of `name` against every other member of `group`,
  // rather than a single opponent at a time.
  const groupHeadToHeadPct = (name, group) => {
    let w = 0; let l = 0; let t = 0;
    games.forEach((g) => {
      if (!g.teamA || !g.teamB) return;
      const a = Number(g.scoreA) || 0;
      const b = Number(g.scoreB) || 0;
      if (g.teamA === name && g.teamB !== name && group.includes(g.teamB)) {
        if (a > b) w += 1; else if (b > a) l += 1; else t += 1;
      } else if (g.teamB === name && g.teamA !== name && group.includes(g.teamA)) {
        if (b > a) w += 1; else if (a > b) l += 1; else t += 1;
      }
    });
    const gp = w + l + t;
    return gp > 0 ? (w + t * 0.5) / gp : 0.5;
  };

  const winPctStage = () => winPctFor;
  const groupH2hStage = (group) => (name) => groupHeadToHeadPct(name, group);
  const divisionalStage = () => divisionalWinPct;
  const pointsStage = () => (name) => statFor(name).pf;

  let stages;
  if (tiebreaker === 'h2h_nfl') {
    stages = [winPctStage, groupH2hStage, divisionalStage, pointsStage];
  } else if (tiebreaker === 'h2h') {
    stages = [winPctStage, groupH2hStage, pointsStage];
  } else {
    stages = [winPctStage, pointsStage];
  }

  const allTeams = [];
  year.divisions.forEach((div) => {
    div.teams.forEach((t) => allTeams.push({ id: t.id, name: t.name, divId: div.id }));
  });

  const leagueRank = {};
  const leagueNames = Array.from(new Set(allTeams.map((t) => t.name)));
  const leagueOrder = rankNames(leagueNames, stages);
  const leagueNameRank = {};
  leagueOrder.forEach((n, i) => { leagueNameRank[n] = i + 1; });
  allTeams.forEach((t) => { leagueRank[t.id] = leagueNameRank[t.name]; });

  const divRank = {};
  year.divisions.forEach((div) => {
    const divNames = Array.from(new Set(div.teams.map((t) => t.name)));
    const divOrder = rankNames(divNames, stages);
    const divNameRank = {};
    divOrder.forEach((n, i) => { divNameRank[n] = i + 1; });
    div.teams.forEach((t) => { divRank[t.id] = divNameRank[t.name]; });
  });

  return { leagueRank, divRank, statFor, winPctFor };
}

function computeSeeds(year, numTeams, useDivisionWinners) {
  const tiebreaker = year.tiebreaker || 'points';
  const { leagueRank, divRank } = computeRanks(year, tiebreaker);
  const allTeams = [];
  year.divisions.forEach((div) => {
    div.teams.forEach((t) => { if (t.name) allTeams.push({ id: t.id, name: t.name, divId: div.id }); });
  });
  allTeams.sort((a, b) => (leagueRank[a.id] || 999) - (leagueRank[b.id] || 999));

  if (useDivisionWinners) {
    const winners = [];
    year.divisions.forEach((div) => {
      const w = allTeams.find((t) => t.divId === div.id && divRank[t.id] === 1);
      if (w) winners.push(w);
    });
    winners.sort((a, b) => (leagueRank[a.id] || 999) - (leagueRank[b.id] || 999));
    const winnerIds = new Set(winners.map((w) => w.id));
    const others = allTeams.filter((t) => !winnerIds.has(t.id));
    return [...winners, ...others].slice(0, numTeams).map((t) => t.name);
  }
  return allTeams.slice(0, numTeams).map((t) => t.name);
}

function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function seedSlotOrder(bracketSize) {
  let order = [1];
  let size = 1;
  while (size < bracketSize) {
    size *= 2;
    const newOrder = [];
    order.forEach((s) => { newOrder.push(s); newOrder.push(size + 1 - s); });
    order = newOrder;
  }
  return order;
}

function computeBracketRounds(year, bracket) {
  const seedList = computeSeeds(year, bracket.numTeams, bracket.useDivisionWinners);
  const bracketSize = nextPowerOfTwo(bracket.numTeams);
  const slotOrder = seedSlotOrder(bracketSize);
  const numRounds = Math.log2(bracketSize);

  let currentSlots = slotOrder.map((seed) => (
    seed <= bracket.numTeams ? { seed, name: seedList[seed - 1] || null } : null
  ));

  const rounds = [];
  for (let r = 0; r < numRounds; r += 1) {
    const matchups = [];
    const nextSlots = [];
    for (let i = 0; i < currentSlots.length; i += 2) {
      const left = currentSlots[i];
      const right = currentSlots[i + 1];
      const isByeA = !left;
      const isByeB = !right;
      let winner = null;
      let scoreA = 0;
      let scoreB = 0;
      if (isByeA && !isByeB) {
        winner = right;
      } else if (isByeB && !isByeA) {
        winner = left;
      } else if (left && right) {
        const key = `${r}-${matchups.length}`;
        const sc = bracket.scores[key] || { scoreA: 0, scoreB: 0 };
        scoreA = sc.scoreA;
        scoreB = sc.scoreB;
        const a = Number(scoreA) || 0;
        const b = Number(scoreB) || 0;
        if (a > b) winner = left;
        else if (b > a) winner = right;
      }
      matchups.push({
        index: matchups.length, teamA: left, teamB: right, scoreA, scoreB, winner, isByeA, isByeB,
      });
      nextSlots.push(winner);
    }
    rounds.push(matchups);
    currentSlots = nextSlots;
  }
  return rounds;
}

function computeSeasonStats(year) {
  const stats = computeTeamStats(year);
  const tiebreaker = year.tiebreaker || 'points';
  const { leagueRank } = computeRanks(year, tiebreaker);

  let lastPlace = null;
  let worstRank = -1;
  year.divisions.forEach((div) => div.teams.forEach((t) => {
    if (!t.name) return;
    const r = leagueRank[t.id];
    if (r && r > worstRank) { worstRank = r; lastPlace = t.name; }
  }));

  let highScorer = null;
  let highScorerPf = -Infinity;
  let lowScorer = null;
  let lowScorerPf = Infinity;
  Object.entries(stats).forEach(([name, s]) => {
    if (!name) return;
    if (s.pf > highScorerPf) { highScorerPf = s.pf; highScorer = name; }
    if (s.pf < lowScorerPf) { lowScorerPf = s.pf; lowScorer = name; }
  });

  const bracketRounds = year.playoffBracket ? computeBracketRounds(year, year.playoffBracket) : [];
  const totalPlayoffRounds = bracketRounds.length;

  let highGame = null;
  let lowGame = null;
  const considerGame = (name, score, label) => {
    if (!highGame || score > highGame.score) highGame = { name, score, label };
    if (!lowGame || score < lowGame.score) lowGame = { name, score, label };
  };
  year.weeks.forEach((w) => {
    w.games.forEach((g) => {
      if (!isPlayedGame(g)) return;
      considerGame(g.teamA, Number(g.scoreA) || 0, `Week ${w.weekNum}`);
      considerGame(g.teamB, Number(g.scoreB) || 0, `Week ${w.weekNum}`);
    });
  });
  bracketRounds.forEach((matchups, roundIdx) => {
    const label = playoffRoundLabel(roundIdx, totalPlayoffRounds);
    matchups.forEach((m) => {
      if (m.isByeA || m.isByeB) return;
      if (!(Number(m.scoreA) || 0) && !(Number(m.scoreB) || 0)) return;
      if (m.teamA) considerGame(m.teamA.name, Number(m.scoreA) || 0, label);
      if (m.teamB) considerGame(m.teamB.name, Number(m.scoreB) || 0, label);
    });
  });

  let champion = null;
  let runnerUp = null;
  if (year.playoffBracket) {
    const final = bracketRounds[bracketRounds.length - 1];
    if (final && final[0] && final[0].winner) {
      const m = final[0];
      champion = m.winner.name;
      const loser = (m.teamA && m.teamA.name === champion) ? m.teamB : m.teamA;
      runnerUp = loser ? loser.name : null;
    }
  }

  return { champion, runnerUp, highScorer, highScorerPf, lowScorer, lowScorerPf, lastPlace, highGame, lowGame };
}

function playoffRoundLabel(roundIndex, totalRounds) {
  const remaining = totalRounds - roundIndex;
  if (remaining === 1) return 'Championship';
  if (remaining === 2) return 'Semifinals';
  if (remaining === 3) return 'Quarterfinals';
  return `Round ${roundIndex + 1}`;
}

function getYearTeamNames(year) {
  const names = [];
  year.divisions.forEach((d) => d.teams.forEach((t) => { if (t.name) names.push(t.name); }));
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}

function fmtPct(p) {
  if (!isFinite(p)) return '.000';
  return p.toFixed(3).replace(/^0/, '');
}

function formatScore(v) {
  return (Number(v) || 0).toFixed(2);
}

function ScoreInput({ value, onCommit, highlight, width }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  return (
    <input
      type="text"
      inputMode="decimal"
      className="fl-field fl-field-num"
      style={{ flex: '0 0 auto', width: width || undefined, ...(highlight ? { color: 'var(--turf-dark)', fontWeight: 800 } : {}) }}
      value={editing ? draft : formatScore(value)}
      onFocus={() => { setEditing(true); setDraft(value ? String(value) : ''); }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); onCommit(draft); }}
    />
  );
}

function generateExportHTML(league) {
  const esc = escapeHtml;
  const seasons = [...league.years].sort((a, b) => a.year - b.year);

  const seasonBlocks = seasons.map((year) => {
    const tiebreaker = year.tiebreaker || 'points';
    const { leagueRank, divRank, statFor, winPctFor } = computeRanks(year, tiebreaker);

    const standingsHtml = year.divisions.length === 0
      ? '<p class="ex-empty">No standings entered.</p>'
      : year.divisions.map((div) => {
        const rows = [...div.teams]
          .sort((a, b) => (divRank[a.id] || 999) - (divRank[b.id] || 999))
          .map((t) => {
            const s = statFor(t.name);
            return `<tr>
              <td>${divRank[t.id] || '-'}</td>
              <td>${leagueRank[t.id] || '-'}</td>
              <td class="ex-left">${esc(t.name) || '&mdash;'}</td>
              <td>${s.wins}</td><td>${s.losses}</td><td>${s.ties}</td>
              <td>${fmtPct(winPctFor(t.name))}</td>
              <td>${formatScore(s.pf)}</td><td>${formatScore(s.pa)}</td>
            </tr>`;
          }).join('');
        return `<div class="ex-panel">
          <div class="ex-panel-title">${esc(div.name)}</div>
          <table class="ex-table"><thead><tr>
            <th>Div rk</th><th>Lg rk</th><th class="ex-th-left">Team</th>
            <th>W</th><th>L</th><th>T</th><th>Win%</th><th>PF</th><th>PA</th>
          </tr></thead><tbody>${rows}</tbody></table>
        </div>`;
      }).join('');

    const gamesHtml = year.weeks.length === 0
      ? '<p class="ex-empty">No games logged.</p>'
      : [...year.weeks].sort((a, b) => (Number(a.weekNum) || 0) - (Number(b.weekNum) || 0)).map((w) => {
        if (w.games.length === 0) return '';
        const rows = w.games.map((g) => {
          const a = Number(g.scoreA) || 0;
          const b = Number(g.scoreB) || 0;
          return `<tr>
            <td class="ex-left${a > b ? ' ex-winner' : ''}">${esc(g.teamA) || '&mdash;'}</td>
            <td>${formatScore(g.scoreA)}</td>
            <td>${formatScore(g.scoreB)}</td>
            <td class="ex-left${b > a ? ' ex-winner' : ''}">${esc(g.teamB) || '&mdash;'}</td>
          </tr>`;
        }).join('');
        return `<div class="ex-panel">
          <div class="ex-panel-title">Week ${esc(w.weekNum)}</div>
          <table class="ex-table"><thead><tr><th class="ex-th-left">Team</th><th>Score</th><th>Score</th><th class="ex-th-left">Team</th></tr></thead>
          <tbody>${rows}</tbody></table>
        </div>`;
      }).join('');

    let draftHtml = '<p class="ex-empty">No draft board entered.</p>';
    if (year.draft) {
      const d = year.draft;
      const cols = Array.from({ length: d.numTeams }, (_, i) => i + 1);
      const rounds = Array.from({ length: d.numRounds }, (_, i) => i + 1);
      const header = cols.map((c) => `<th>${esc(d.teamNames[c - 1]) || `Slot ${c}`}</th>`).join('');
      const rows = rounds.map((r) => {
        const cells = cols.map((c) => {
          const pick = d.picks[pickKey(r, c)] || { player: '', position: '', team: '' };
          const color = POSITION_COLORS[pick.position];
          const style = color ? ` style="background:${color};color:#fff;"` : '';
          const label = pick.player ? `${esc(pick.player)}${pick.position ? ` (${pick.position}${pick.team ? ` - ${pick.team}` : ''})` : ''}` : '&nbsp;';
          return `<td${style}>${label}</td>`;
        }).join('');
        return `<tr><td class="ex-round-num">${r}</td>${cells}</tr>`;
      }).join('');
      draftHtml = `<div class="ex-panel"><div class="ex-scroll"><table class="ex-table ex-draft">
        <thead><tr><th></th>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div></div>`;
    }

    let playoffsHtml = '<p class="ex-empty">No playoff bracket set up.</p>';
    if (year.playoffBracket) {
      const rounds = computeBracketRounds(year, year.playoffBracket);
      const totalRounds = rounds.length;
      playoffsHtml = `<div class="ex-bracket">${rounds.map((matchups, ri) => {
        const label = playoffRoundLabel(ri, totalRounds);
        const items = matchups.map((m) => {
          if (m.isByeA || m.isByeB) {
            const present = m.isByeB ? m.teamA : m.teamB;
            return `<div class="ex-matchup"><div class="ex-mrow ex-winner">${present ? `(${present.seed}) ${esc(present.name) || 'TBD'}` : 'TBD'}</div><div class="ex-bye">Bye</div></div>`;
          }
          const aWin = m.winner && m.teamA && m.winner.name === m.teamA.name;
          const bWin = m.winner && m.teamB && m.winner.name === m.teamB.name;
          return `<div class="ex-matchup">
            <div class="ex-mrow${aWin ? ' ex-winner' : ''}">${m.teamA ? `(${m.teamA.seed}) ${esc(m.teamA.name) || 'TBD'}` : 'TBD'} <span class="ex-score">${formatScore(m.scoreA)}</span></div>
            <div class="ex-mrow${bWin ? ' ex-winner' : ''}">${m.teamB ? `(${m.teamB.seed}) ${esc(m.teamB.name) || 'TBD'}` : 'TBD'} <span class="ex-score">${formatScore(m.scoreB)}</span></div>
          </div>`;
        }).join('');
        return `<div class="ex-round"><div class="ex-round-label">${label}</div>${items}</div>`;
      }).join('')}</div>`;
    }

    const s = computeSeasonStats(year);
    const statsHtml = `<div class="ex-panel"><table class="ex-stat-table">
      <tr><td>Champion</td><td>${esc(s.champion) || 'Not yet determined'}</td></tr>
      <tr><td>Runner-up</td><td>${esc(s.runnerUp) || 'Not yet determined'}</td></tr>
      <tr><td>Highest season scorer</td><td>${s.highScorer ? `${esc(s.highScorer)} (${formatScore(s.highScorerPf)} pts)` : 'Not yet determined'}</td></tr>
      <tr><td>Highest single game score</td><td>${s.highGame ? `${esc(s.highGame.name)} — ${formatScore(s.highGame.score)} pts (${s.highGame.label})` : 'Not yet determined'}</td></tr>
      <tr><td>Last place finisher</td><td>${esc(s.lastPlace) || 'Not yet determined'}</td></tr>
      <tr><td>Lowest season scorer</td><td>${s.lowScorer ? `${esc(s.lowScorer)} (${formatScore(s.lowScorerPf)} pts)` : 'Not yet determined'}</td></tr>
      <tr><td>Lowest single game score</td><td>${s.lowGame ? `${esc(s.lowGame.name)} — ${formatScore(s.lowGame.score)} pts (${s.lowGame.label})` : 'Not yet determined'}</td></tr>
    </table></div>`;

    const tradesHtml = (year.trades || []).length === 0
      ? '<p class="ex-empty">No trades logged.</p>'
      : [...year.trades].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999')).map((trade) => {
        const parties = trade.parties.map((p) => {
          const fmtAssets = (list) => (list.length === 0 ? '&mdash;' : list.map((a) => (
            a.kind === 'waiver' ? `$${formatScore(a.amount)} waiver` : `${esc(a.player) || 'Unnamed player'}${a.position ? ` (${a.position}${a.nflTeam ? ` - ${a.nflTeam}` : ''})` : ''}`
          )).join(', '));
          return `<div class="ex-trade-party">
            <div class="ex-panel-title" style="font-size:13px;">${esc(p.team) || 'Unselected team'}</div>
            <div class="ex-trade-line"><span>Received:</span> ${fmtAssets(p.receives)}</div>
            <div class="ex-trade-line"><span>Sent:</span> ${fmtAssets(p.sends)}</div>
          </div>`;
        }).join('');
        return `<div class="ex-panel"><div class="ex-panel-title">${trade.date ? esc(trade.date) : 'Undated trade'}</div><div class="ex-trade-parties">${parties}</div></div>`;
      }).join('');

    return `<section class="ex-season" data-year="${year.year}">
      <h2 class="ex-year-heading">${year.year}</h2>
      <div class="ex-subtabs">
        <button class="ex-subtab active" onclick="flShowSubtab(this,'standings')">Standings</button>
        <button class="ex-subtab" onclick="flShowSubtab(this,'games')">Game Log</button>
        <button class="ex-subtab" onclick="flShowSubtab(this,'draft')">Draft</button>
        <button class="ex-subtab" onclick="flShowSubtab(this,'playoffs')">Playoffs</button>
        <button class="ex-subtab" onclick="flShowSubtab(this,'stats')">Stats</button>
        <button class="ex-subtab" onclick="flShowSubtab(this,'trades')">Trades</button>
      </div>
      <div class="ex-subpanel active" data-tab="standings">${standingsHtml}</div>
      <div class="ex-subpanel" data-tab="games">${gamesHtml}</div>
      <div class="ex-subpanel" data-tab="draft">${draftHtml}</div>
      <div class="ex-subpanel" data-tab="playoffs">${playoffsHtml}</div>
      <div class="ex-subpanel" data-tab="stats">${statsHtml}</div>
      <div class="ex-subpanel" data-tab="trades">${tradesHtml}</div>
    </section>`;
  }).join('');

  const navButtons = seasons.map((y, i) => `<button class="ex-year-btn${i === seasons.length - 1 ? ' active' : ''}" onclick="flShowSeason('${y.year}', this)">${y.year}</button>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${esc(league.leagueName)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Libre+Franklin:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
:root {
  --bg:#F1ECDF; --panel:#FBF8F0; --panel-raised:#FFFFFF; --ink:#1B2430; --ink-soft:#5B6472;
  --ink-faint:#8B8D7F; --turf-dark:#2E4F2B; --gold:#B8873A; --divider:#D9D0BC;
}
* { box-sizing: border-box; }
body { font-family:'Libre Franklin',sans-serif; background:var(--bg); color:var(--ink); margin:0; padding:24px 16px 60px; }
h1 { font-family:'Anton',sans-serif; font-size:32px; margin:0 0 4px; }
.ex-subtitle { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-faint); margin-bottom:16px; }
.ex-year-nav { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
.ex-year-btn { font-family:'Anton',sans-serif; font-size:16px; padding:8px 16px; border:1.5px solid var(--ink); border-radius:3px; background:var(--panel-raised); color:var(--ink); cursor:pointer; }
.ex-year-btn.active { background:var(--ink); color:var(--gold); }
.ex-season { display:none; }
.ex-season.active { display:block; }
.ex-year-heading { font-family:'Anton',sans-serif; font-size:26px; border-bottom:2px solid var(--ink); padding-bottom:6px; margin-top:0; }
.ex-subtabs { display:flex; gap:0; border-bottom:1.5px solid var(--divider); margin-bottom:16px; flex-wrap:wrap; }
.ex-subtab { font-family:'Libre Franklin',sans-serif; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; background:transparent; border:none; border-bottom:3px solid transparent; color:var(--ink-faint); padding:10px 14px 8px; cursor:pointer; }
.ex-subtab:hover { color:var(--ink); }
.ex-subtab.active { color:var(--ink); border-bottom-color:var(--turf-dark); }
.ex-subpanel { display:none; }
.ex-subpanel.active { display:block; }
.ex-panel { background:var(--panel-raised); border:1px solid var(--divider); border-radius:4px; padding:12px 14px; margin-bottom:12px; }
.ex-panel-title { font-family:'Anton',sans-serif; font-size:15px; margin-bottom:8px; }
.ex-scroll { overflow-x:auto; }
.ex-table { width:100%; border-collapse:collapse; font-size:13px; }
.ex-table th { font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); border-bottom:2px solid var(--ink); padding:6px 5px; text-align:center; }
.ex-table td { padding:5px 5px; border-bottom:1px solid var(--divider); text-align:center; font-family:'IBM Plex Mono',monospace; }
.ex-th-left, .ex-left { text-align:left !important; font-family:'Libre Franklin',sans-serif !important; font-weight:600; }
.ex-winner { color:var(--turf-dark); font-weight:800; }
.ex-empty { color:var(--ink-faint); font-size:13px; font-style:italic; }
.ex-draft td { white-space:nowrap; font-size:11px; padding:4px; }
.ex-round-num { font-family:'Anton',sans-serif; font-weight:400; }
.ex-bracket { display:flex; gap:20px; flex-wrap:wrap; }
.ex-round { min-width:200px; }
.ex-round-label { font-family:'Anton',sans-serif; font-size:13px; color:var(--ink-soft); margin-bottom:8px; }
.ex-matchup { background:var(--panel-raised); border:1px solid var(--divider); border-radius:4px; padding:8px 10px; margin-bottom:10px; font-size:12.5px; }
.ex-mrow { display:flex; justify-content:space-between; padding:2px 0; }
.ex-score { font-family:'IBM Plex Mono',monospace; }
.ex-bye { text-align:center; font-family:'Anton',sans-serif; color:var(--ink-faint); padding:4px 0; border-top:1px solid var(--divider); margin-top:4px; }
.ex-stat-table { width:100%; border-collapse:collapse; font-size:13px; }
.ex-stat-table td { padding:6px 4px; border-bottom:1px solid var(--divider); }
.ex-stat-table td:first-child { color:var(--ink-faint); text-transform:uppercase; font-size:10px; letter-spacing:0.05em; width:220px; }
.ex-trade-parties { display:flex; gap:10px; flex-wrap:wrap; }
.ex-trade-party { flex:1 1 200px; border:1px solid var(--divider); border-radius:4px; padding:8px 10px; background:var(--panel); }
.ex-trade-line { font-size:12px; margin-top:2px; }
.ex-trade-line span { color:var(--ink-faint); text-transform:uppercase; font-size:9.5px; letter-spacing:0.05em; }
.ex-footer { margin-top:40px; font-size:11px; color:var(--ink-faint); }
</style>
</head>
<body>
  <h1>${esc(league.leagueName)}</h1>
  <div class="ex-subtitle">League record book — exported ${esc(new Date().toLocaleDateString())}</div>
  <div class="ex-year-nav">${navButtons}</div>
  ${seasonBlocks}
  <div class="ex-footer">This is a static, read-only export. Reopen the tracker to make changes.</div>
  <script>
    function flShowSeason(year, btn) {
      document.querySelectorAll('.ex-season').forEach(function(s) { s.classList.toggle('active', s.dataset.year === year); });
      document.querySelectorAll('.ex-year-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    }
    function flShowSubtab(btn, tab) {
      var season = btn.closest('.ex-season');
      season.querySelectorAll('.ex-subpanel').forEach(function(p) { p.classList.toggle('active', p.dataset.tab === tab); });
      season.querySelectorAll('.ex-subtab').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    }
    document.addEventListener('DOMContentLoaded', function() {
      var last = document.querySelector('.ex-season:last-of-type');
      if (last) last.classList.add('active');
    });
  </script>
</body>
</html>`;
}

// "Josh Allen (QB - BUF)" -> { player, position, nflTeam }, the inverse of the export's label format.
function parsePlayerLabel(label) {
  const m = label.match(/^(.*) \(([A-Z]+)(?: - ([^()]+))?\)$/);
  if (m && POSITIONS.includes(m[2])) return { player: m[1], position: m[2], nflTeam: m[3] || '' };
  return { player: label, position: '', nflTeam: '' };
}

function parseTradeAssets(line) {
  if (!line || line === '—') return [];
  return line.split(', ').map((part) => {
    const waiver = part.match(/^\$([\d.]+) waiver$/);
    if (waiver) return { ...emptyAsset(), kind: 'waiver', amount: Number(waiver[1]) };
    const p = parsePlayerLabel(part);
    return { ...emptyAsset(), player: p.player === 'Unnamed player' ? '' : p.player, position: p.position, nflTeam: p.nflTeam };
  });
}

// Rebuilds league data from a file made by the Export button. The export only shows
// results, so the tiebreaker and playoff seeding rule are worked out by finding the
// settings that reproduce the ranks and seeds shown in the file.
function parseExportHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections = [...doc.querySelectorAll('section.ex-season')];
  if (sections.length === 0) throw new Error("that file doesn't look like a league export.");

  const text = (el) => (el ? el.textContent.replace(/ /g, ' ').trim() : '');
  const blank = (s) => (s === '—' ? '' : s);
  const num = (s) => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;
  const notes = [];
  const league = { leagueName: text(doc.querySelector('h1')) || defaultLeague().leagueName, years: [] };

  sections.forEach((sec) => {
    const year = emptyYear(Number(sec.dataset.year));
    const panel = (tab) => sec.querySelector(`.ex-subpanel[data-tab="${tab}"]`);

    const shownRanks = [];
    panel('standings').querySelectorAll(':scope > .ex-panel').forEach((p) => {
      const div = emptyDivision(year.divisions.length + 1);
      div.name = text(p.querySelector('.ex-panel-title'));
      p.querySelectorAll('tbody tr').forEach((tr) => {
        const tds = tr.querySelectorAll('td');
        const team = { ...emptyTeam(), name: blank(text(tds[2])) };
        div.teams.push(team);
        shownRanks.push({ id: team.id, divRk: text(tds[0]), lgRk: text(tds[1]) });
      });
      year.divisions.push(div);
    });

    panel('games').querySelectorAll(':scope > .ex-panel').forEach((p) => {
      const week = emptyWeek(num(text(p.querySelector('.ex-panel-title'))));
      p.querySelectorAll('tbody tr').forEach((tr) => {
        const tds = tr.querySelectorAll('td');
        week.games.push({
          id: uid(), teamA: blank(text(tds[0])), scoreA: num(text(tds[1])), teamB: blank(text(tds[3])), scoreB: num(text(tds[2])),
        });
      });
      year.weeks.push(week);
    });

    const matching = ['points', 'h2h', 'h2h_nfl'].filter((tb) => {
      const { leagueRank, divRank } = computeRanks(year, tb);
      return shownRanks.every((r) => String(divRank[r.id] || '-') === r.divRk && String(leagueRank[r.id] || '-') === r.lgRk);
    });
    year.tiebreaker = matching[0] || 'points';
    if (matching.length === 0 && shownRanks.length) {
      notes.push(`${year.year}: couldn't tell which tiebreaker was used, so it's set to Total points. Check the standings.`);
    }

    const draftTable = panel('draft').querySelector('table.ex-draft');
    if (draftTable) {
      const teamNames = [...draftTable.querySelectorAll('thead th')].slice(1).map((th) => {
        const n = text(th);
        return /^Slot \d+$/.test(n) ? '' : n;
      });
      const rows = [...draftTable.querySelectorAll('tbody tr')];
      const draft = emptyDraft(teamNames.length, rows.length);
      draft.teamNames = teamNames;
      rows.forEach((tr, ri) => {
        [...tr.querySelectorAll('td')].slice(1).forEach((td, ci) => {
          const label = text(td);
          if (!label) return;
          const p = parsePlayerLabel(label);
          draft.picks[pickKey(ri + 1, ci + 1)] = { player: p.player, position: p.position, team: p.nflTeam };
        });
      });
      year.draft = draft;
    }

    const bracketEl = panel('playoffs').querySelector('.ex-bracket');
    if (bracketEl) {
      const shownSeeds = {};
      const scores = {};
      bracketEl.querySelectorAll('.ex-round').forEach((roundEl, r) => {
        roundEl.querySelectorAll('.ex-matchup').forEach((mEl, i) => {
          const rows = [...mEl.querySelectorAll('.ex-mrow')];
          rows.forEach((row) => {
            const m = text(row.firstChild).match(/^\((\d+)\) (.*)$/);
            if (m) shownSeeds[m[1]] = m[2] === 'TBD' ? null : m[2];
          });
          if (!mEl.querySelector('.ex-bye') && rows.length === 2) {
            scores[`${r}-${i}`] = {
              scoreA: num(text(rows[0].querySelector('.ex-score'))),
              scoreB: num(text(rows[1].querySelector('.ex-score'))),
            };
          }
        });
      });
      const numTeams = Math.max(2, ...Object.keys(shownSeeds).map(Number));
      const seedingMatches = (useDiv) => {
        const seeds = computeSeeds(year, numTeams, useDiv);
        return Object.entries(shownSeeds).every(([s, name]) => (seeds[s - 1] || null) === name);
      };
      let useDivisionWinners = false;
      if (!seedingMatches(false)) {
        if (year.divisions.length >= 2 && seedingMatches(true)) useDivisionWinners = true;
        else notes.push(`${year.year}: the playoff seeds didn't match the standings exactly. Check the bracket.`);
      }
      year.playoffBracket = { numTeams, useDivisionWinners, scores };
    }

    panel('trades').querySelectorAll(':scope > .ex-panel').forEach((p) => {
      const date = text(p.querySelector(':scope > .ex-panel-title'));
      const trade = { id: uid(), date: date === 'Undated trade' ? '' : date, parties: [] };
      p.querySelectorAll('.ex-trade-party').forEach((pp) => {
        const team = text(pp.querySelector('.ex-panel-title'));
        const [recv, sent] = [...pp.querySelectorAll('.ex-trade-line')].map((l) => text(l).replace(/^(Received|Sent):\s*/, ''));
        trade.parties.push({
          ...emptyParty(),
          team: team === 'Unselected team' ? '' : team,
          receives: parseTradeAssets(recv),
          sends: parseTradeAssets(sent),
        });
      });
      year.trades.push(trade);
    });

    league.years.push(year);
  });

  return { league, notes };
}

// Spelling-insensitive key, so "Amon Ra St. Brown" and "Amon-Ra St. Brown" count as one player.
function playerKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Every player entered on any draft board or in any trade, used to suggest names while typing.
// Each key keeps its most-used spelling, plus the position and NFL team from each season.
function buildPlayerIndex(league) {
  const byKey = new Map();
  const add = (name, position, team, yearNum) => {
    const clean = (name || '').trim();
    const key = playerKey(clean);
    if (!key) return;
    if (!byKey.has(key)) byKey.set(key, { spellings: new Map(), seasons: new Map() });
    const e = byKey.get(key);
    e.spellings.set(clean, (e.spellings.get(clean) || 0) + 1);
    const s = e.seasons.get(yearNum) || { position: '', team: '' };
    if (position) s.position = position;
    if (team) s.team = team;
    e.seasons.set(yearNum, s);
  };
  league.years.forEach((y) => {
    Object.values((y.draft && y.draft.picks) || {}).forEach((p) => add(p.player, p.position, p.team, y.year));
    (y.trades || []).forEach((t) => t.parties.forEach((party) => [...party.receives, ...party.sends].forEach((a) => {
      if (a.kind === 'player') add(a.player, a.position, a.nflTeam, y.year);
    })));
  });

  const players = new Map();
  byKey.forEach((e, key) => {
    const name = [...e.spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    const seasons = [...e.seasons.entries()].sort((a, b) => b[0] - a[0]);
    const latest = (field) => (seasons.find(([, s]) => s[field]) || [null, {}])[1][field] || '';
    players.set(key, { name, seasons: new Map(seasons), position: latest('position'), team: latest('team') });
  });
  const list = [...players.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    list,
    find: (name) => players.get(playerKey(name)) || null,
    // Position and team to prefill: that season's entry if the player already appears in it,
    // otherwise the most recent season they were entered.
    detailsFor(name, yearNum) {
      const p = players.get(playerKey(name));
      if (!p) return null;
      const same = p.seasons.get(yearNum);
      return {
        position: (same && same.position) || p.position,
        team: (same && same.team) || p.team,
      };
    },
  };
}

const PlayerIndexContext = React.createContext(null);
const PLAYER_LIST_ID = 'fl-player-names';

// Name box with suggestions from the player list. Picking or typing a known name fills in an
// empty position/team; on leaving the box, a known player typed with different spelling or
// capitalization is corrected to the usual spelling.
function PlayerNameInput({ value, yearNum, onName, onDetails, style, className, placeholder }) {
  const index = React.useContext(PlayerIndexContext);
  const fillDetails = (name) => {
    const d = index && index.detailsFor(name, yearNum);
    if (d) onDetails(d);
  };
  return (
    <input
      className={className}
      style={style}
      placeholder={placeholder}
      list={PLAYER_LIST_ID}
      autoComplete="off"
      value={value}
      onChange={(e) => {
        const name = e.target.value;
        onName(name);
        const known = index && index.find(name);
        if (known && known.name === name) fillDetails(name);
      }}
      onBlur={(e) => {
        const known = index && index.find(e.target.value);
        if (known && known.name !== e.target.value) {
          onName(known.name);
          fillDetails(known.name);
        }
      }}
    />
  );
}

function FantasyLeagueTracker() {
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [activeYearId, setActiveYearId] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');
  // The tracker opens read-only; the Edit mode button unlocks editing.
  const [viewMode, setViewMode] = useState(true);
  const [globalView, setGlobalView] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const saveTimer = useRef(null);
  const firstLoad = useRef(true);
  const pendingSave = useRef(null);

  // The player list is rebuilt when a box loses focus rather than on every keystroke,
  // so half-typed names never show up as suggestions.
  const [indexedLeague, setIndexedLeague] = useState(null);
  const leagueRef = useRef(null);
  leagueRef.current = league;
  const playerIndex = useMemo(() => (indexedLeague ? buildPlayerIndex(indexedLeague) : null), [indexedLeague]);
  const refreshPlayerIndex = () => setTimeout(() => setIndexedLeague(leagueRef.current), 0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let data = null;
      try {
        data = await localStore.load();
      } catch (e) {
        // Never start from a blank league when the file exists but couldn't be read,
        // or the next autosave would overwrite it.
        if (mounted) { setLoadError(String(e.message || e)); setLoading(false); }
        return;
      }
      if (!mounted) return;
      const finalData = data || defaultLeague();
      finalData.years.forEach((y) => migrateYear(y));
      setLeague(finalData);
      setIndexedLeague(finalData);
      if (finalData.years.length > 0) {
        setActiveYearId(finalData.years[finalData.years.length - 1].id);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (loading || league === null) return;
    if (firstLoad.current) { firstLoad.current = false; return; }
    setSaveStatus('saving');
    pendingSave.current = league;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      pendingSave.current = null;
      try {
        await localStore.save(league);
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('error');
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [league, loading]);

  // Closing the window within the autosave delay would otherwise drop the last edit.
  useEffect(() => {
    const flush = () => {
      if (pendingSave.current) {
        localStore.saveOnExit(pendingSave.current);
        pendingSave.current = null;
      }
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  // Tells the launcher the window is still open, so it knows when to shut down.
  useEffect(() => {
    if (IS_STATIC_SITE) return undefined;
    const ping = () => fetch('/api/ping', { method: 'POST' }).catch(() => {});
    ping();
    const t = setInterval(ping, 5000);
    return () => clearInterval(t);
  }, []);

  const updateLeague = useCallback((fn) => {
    setLeague((prev) => {
      const next = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  }, []);

  const findYear = (l, yearId) => l.years.find((y) => y.id === yearId);

  const [newYearInput, setNewYearInput] = useState('');

  const addYear = () => {
    const num = parseInt(newYearInput, 10);
    if (!num || num < 1900 || num > 2200) return;
    if (league.years.some((y) => y.year === num)) return;
    const newYear = emptyYear(num);
    updateLeague((l) => { l.years.push(newYear); });
    setActiveYearId(newYear.id);
    setActiveTab('standings');
    setNewYearInput('');
  };

  const removeYear = (yearId) => {
    updateLeague((l) => { l.years = l.years.filter((y) => y.id !== yearId); });
    if (activeYearId === yearId) {
      const remaining = league.years.filter((y) => y.id !== yearId);
      setActiveYearId(remaining.length ? remaining[remaining.length - 1].id : null);
    }
  };

  const exportLeague = () => {
    const html = generateExportHTML(league);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'squidneys_paradise_history.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importInput = useRef(null);
  const [importNote, setImportNote] = useState('');

  const importLeagueFile = async (file) => {
    if (!file) return;
    let imported;
    let notes = [];
    try {
      const text = await file.text();
      if (/\.json$/i.test(file.name)) {
        imported = JSON.parse(text);
        if (!imported || !Array.isArray(imported.years)) throw new Error('That JSON file is not a league save.');
      } else {
        ({ league: imported, notes } = parseExportHTML(text));
      }
    } catch (e) {
      window.alert(`Couldn't import ${file.name}: ${e.message || e}`);
      return;
    }
    const seasons = imported.years.map((y) => y.year).sort((a, b) => a - b);
    const ok = window.confirm(
      `Import ${seasons.length} season${seasons.length === 1 ? '' : 's'} (${seasons.join(', ')}) from ${file.name}?\n\n`
      + 'This replaces everything currently in the tracker. A backup of the current data is kept in the app\'s data\\backups folder.',
    );
    if (!ok) return;
    imported.years.forEach((y) => migrateYear(y));
    setLeague(imported);
    setIndexedLeague(imported);
    setActiveYearId(imported.years.length ? [...imported.years].sort((a, b) => a.year - b.year).pop().id : null);
    setGlobalView(null);
    setActiveTab('standings');
    setImportNote(notes.length ? notes.join(' ') : `Imported ${seasons.length} seasons.`);
  };

  if (loadError) {
    return (
      <div className="fl-root" style={{ padding: '60px 16px' }}>
        <style>{FONT_STYLES}</style>
        <div className="fl-empty" style={{ color: 'var(--rust)' }}>
          Couldn't read your league file ({loadError}). Nothing has been changed.
          Close this window and reopen the app. If it keeps happening, your latest backups are in the data\backups folder.
        </div>
      </div>
    );
  }

  if (loading || league === null) {
    return (
      <div className="fl-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' }}>
        <style>{FONT_STYLES}</style>
        <Loader2 size={20} className="fl-mono" style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        <span style={{ fontSize: 13, color: '#5B6472' }}>Loading your league...</span>
      </div>
    );
  }

  const sortedYears = [...league.years].sort((a, b) => a.year - b.year);
  const activeYear = league.years.find((y) => y.id === activeYearId) || null;

  return (
    <PlayerIndexContext.Provider value={playerIndex}>
    <div className={`fl-root${viewMode ? ' fl-view-mode' : ''}`} style={{ padding: '20px 16px 60px' }} onBlur={refreshPlayerIndex}>
      <style>{FONT_STYLES}</style>
      <datalist id={PLAYER_LIST_ID}>
        {(playerIndex ? playerIndex.list : []).map((p) => (
          <option key={p.name} value={p.name}>{[p.position, p.team].filter(Boolean).join(' - ')}</option>
        ))}
      </datalist>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 2 }}>League record book</div>
          <input
            className="fl-field fl-display"
            style={{ fontSize: 30, padding: 0, borderBottomColor: 'transparent' }}
            value={league.leagueName}
            onChange={(e) => updateLeague((l) => { l.leagueName = e.target.value; })}
            aria-label="League name"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="fl-btn" onClick={() => importInput.current && importInput.current.click()}>
            Import
          </button>
          <input
            ref={importInput}
            type="file"
            accept=".html,.htm,.json"
            style={{ display: 'none' }}
            onChange={(e) => { importLeagueFile(e.target.files[0]); e.target.value = ''; }}
          />
          <button className="fl-btn fl-keep-in-view" onClick={exportLeague}>
            Export
          </button>
          <button
            className="fl-btn fl-keep-in-view"
            onClick={() => setGlobalView((v) => (v === 'career' ? null : 'career'))}
          >
            {globalView === 'career' ? 'Back to season' : 'Career stats'}
          </button>
          {!IS_STATIC_SITE && (
            <button
              className="fl-btn fl-keep-in-view"
              style={viewMode ? undefined : { background: 'var(--ink)', color: 'var(--panel)' }}
              onClick={() => setViewMode((v) => !v)}
            >
              {viewMode ? 'Edit mode' : 'Exit edit mode'}
            </button>
          )}
          <div className="fl-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', minWidth: 70, textAlign: 'right' }}>
            {IS_STATIC_SITE && window.FL_PUBLISHED && `updated ${window.FL_PUBLISHED}`}
            {saveStatus === 'saving' && 'saving...'}
            {saveStatus === 'saved' && 'all changes saved'}
            {saveStatus === 'error' && <span style={{ color: 'var(--rust)' }}>save failed</span>}
          </div>
        </div>
      </div>

      {importNote && (
        <div className="fl-panel" style={{ padding: '8px 12px', marginBottom: 16, fontSize: 12.5, color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <span>{importNote}</span>
          <button className="fl-btn fl-btn-ghost" style={{ fontSize: 11 }} onClick={() => setImportNote('')}>Dismiss</button>
        </div>
      )}

      {!globalView && (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Season</span>
          <select
            className="fl-display fl-keep-in-view"
            value={activeYearId || ''}
            onChange={(e) => setActiveYearId(e.target.value)}
            style={{
              fontSize: 20, padding: '8px 12px', border: '1.5px solid var(--ink)', borderRadius: 3,
              background: 'var(--panel-raised)', color: 'var(--ink)', cursor: sortedYears.length ? 'pointer' : 'default',
            }}
            disabled={sortedYears.length === 0}
          >
            {sortedYears.length === 0 && <option value="">No seasons yet</option>}
            {sortedYears.map((y) => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
        </div>
        {!viewMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            className="fl-field fl-mono"
            placeholder="Year"
            value={newYearInput}
            onChange={(e) => setNewYearInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addYear(); }}
            style={{
              width: 76, textAlign: 'center', border: '1.5px solid var(--divider)',
              borderRadius: 3, padding: '9px 6px', background: 'var(--panel)',
            }}
            aria-label="Year to add"
          />
          <button className="fl-btn fl-btn-turf" onClick={addYear} disabled={!newYearInput}>
            <Plus size={14} /> Add year
          </button>
        </div>
        )}
      </div>
      )}

      {globalView === 'career' ? (
        <CareerStatsTab league={league} />
      ) : (
        <>
      {!activeYear && (
        <div className="fl-empty">
          <Trophy size={22} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div>No seasons yet. Add a year to start building your league's history.</div>
        </div>
      )}

      {activeYear && (
        <YearView
          year={activeYear}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          updateLeague={updateLeague}
          onRemoveYear={() => removeYear(activeYear.id)}
          readOnly={viewMode}
        />
      )}
        </>
      )}
    </div>
    </PlayerIndexContext.Provider>
  );
}

function YearView({ year, activeTab, setActiveTab, updateLeague, onRemoveYear, readOnly }) {
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef(null);

  useEffect(() => {
    setConfirming(false);
  }, [year.id]);

  const handleDeleteClick = () => {
    if (confirming) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirming(false);
      onRemoveYear();
    } else {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--divider)', marginBottom: 18 }}>
        <div style={{ display: 'flex' }}>
          <button className={`fl-subtab${activeTab === 'standings' ? ' active' : ''}`} onClick={() => setActiveTab('standings')}>Standings</button>
          <button className={`fl-subtab${activeTab === 'games' ? ' active' : ''}`} onClick={() => setActiveTab('games')}>Game log</button>
          <button className={`fl-subtab${activeTab === 'draft' ? ' active' : ''}`} onClick={() => setActiveTab('draft')}>Draft</button>
          <button className={`fl-subtab${activeTab === 'playoffs' ? ' active' : ''}`} onClick={() => setActiveTab('playoffs')}>Playoffs</button>
          <button className={`fl-subtab${activeTab === 'stats' ? ' active' : ''}`} onClick={() => setActiveTab('stats')}>Stats</button>
          <button className={`fl-subtab${activeTab === 'trades' ? ' active' : ''}`} onClick={() => setActiveTab('trades')}>Trades</button>
          <button className={`fl-subtab${activeTab === 'teams' ? ' active' : ''}`} onClick={() => setActiveTab('teams')}>Teams</button>
        </div>
        <button
          className="fl-btn-ghost fl-btn"
          style={{
            border: confirming ? '1.5px solid var(--rust)' : 'none',
            color: 'var(--rust)',
            fontSize: 11,
            background: confirming ? '#F3DAD0' : 'transparent',
          }}
          onClick={handleDeleteClick}
        >
          <Trash2 size={13} /> {confirming ? 'Click again to confirm' : 'Delete season'}
        </button>
      </div>

      {activeTab === 'standings' && <StandingsTab year={year} updateLeague={updateLeague} readOnly={readOnly} />}
      {activeTab === 'games' && <GamesTab year={year} updateLeague={updateLeague} />}
      {activeTab === 'draft' && <DraftTab year={year} updateLeague={updateLeague} />}
      {activeTab === 'playoffs' && <PlayoffsTab year={year} updateLeague={updateLeague} />}
      {activeTab === 'stats' && <StatsTab year={year} />}
      {activeTab === 'trades' && <TradesTab year={year} updateLeague={updateLeague} />}
      {activeTab === 'teams' && <TeamsTab year={year} />}
    </div>
  );
}

// Highlight colors for picked teams (first three categorical slots of the reference
// data-viz palette, which stay distinguishable for color-blind readers). A team keeps its
// color until it's un-picked.
const CHART_HIGHLIGHTS = ['#2a78d6', '#eb6834', '#1baf7a'];

// League rank of every team after each week, for the standings movement chart.
function computeWeeklyRanks(year, weeks) {
  const tiebreaker = year.tiebreaker || 'points';
  const names = getYearTeamNames(year);
  const idByName = {};
  year.divisions.forEach((d) => d.teams.forEach((t) => { if (t.name && !(t.name in idByName)) idByName[t.name] = t.id; }));
  const byWeek = weeks.map((wk) => {
    const partial = { ...year, weeks: year.weeks.filter((w) => (Number(w.weekNum) || 0) <= wk) };
    const { leagueRank, statFor } = computeRanks(partial, tiebreaker);
    const order = [...names].sort((a, b) => (leagueRank[idByName[a]] || 999) - (leagueRank[idByName[b]] || 999));
    const ranks = {};
    const records = {};
    const pointsFor = {};
    order.forEach((n, i) => {
      ranks[n] = i + 1;
      const s = statFor(n);
      records[n] = `${s.wins}-${s.losses}${s.ties ? `-${s.ties}` : ''}`;
      pointsFor[n] = s.pf;
    });
    return { ranks, records, pointsFor, order };
  });
  return { names, byWeek };
}

function StandingsChart({ year, weeks, markWeek }) {
  const [pins, setPins] = useState([]); // [{ name, color }]
  const [hoverTeam, setHoverTeam] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const svgRef = useRef(null);
  const { names, byWeek } = useMemo(() => computeWeeklyRanks(year, weeks), [year, weeks.join(',')]);

  const last = byWeek[byWeek.length - 1];
  const byFinish = [...names].sort((a, b) => last.ranks[a] - last.ranks[b]);
  const pinColor = (name) => (pins.find((p) => p.name === name) || {}).color;
  const togglePin = (name) => setPins((cur) => {
    if (cur.some((p) => p.name === name)) return cur.filter((p) => p.name !== name);
    const kept = cur.length >= CHART_HIGHLIGHTS.length ? cur.slice(1) : cur;
    const free = CHART_HIGHLIGHTS.find((c) => !kept.some((p) => p.color === c));
    return [...kept, { name, color: free }];
  });

  const n = names.length;
  const W = 900;
  const ROW = 26;
  const TOP = 14;
  const BOTTOM = 34;
  const LEFT = 34;
  const RIGHT = 118;
  const H = TOP + (n - 1) * ROW + BOTTOM;
  const x = (i) => LEFT + (weeks.length === 1 ? 0 : (i * (W - LEFT - RIGHT)) / (weeks.length - 1));
  const y = (rank) => TOP + (rank - 1) * ROW;
  const pathFor = (name) => byWeek.map((wk, i) => `${i ? 'L' : 'M'}${x(i)},${y(wk.ranks[name])}`).join(' ');
  const emphasized = (name) => hoverTeam === name || !!pinColor(name);
  const anyEmphasis = pins.length > 0 || hoverTeam;
  const lineColor = (name) => pinColor(name) || (hoverTeam === name ? 'var(--ink)' : '#BDB6A6');

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    weeks.forEach((_, i) => { if (Math.abs(x(i) - sx) < Math.abs(x(best) - sx)) best = i; });
    setHoverIdx(sx >= LEFT - 12 && sx <= W - RIGHT + 12 ? best : null);
  };
  const tipLeftPct = hoverIdx === null ? 0 : (x(hoverIdx) / W) * 100;
  const markIdx = weeks.indexOf(markWeek);

  const chip = (name) => {
    const color = pinColor(name);
    return (
      <button
        key={name}
        className="fl-keep-in-view"
        onClick={() => togglePin(name)}
        onMouseEnter={() => setHoverTeam(name)}
        onMouseLeave={() => setHoverTeam(null)}
        aria-pressed={!!color}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
          fontSize: 11.5, fontWeight: color ? 800 : 600, padding: '3px 8px', borderRadius: 3,
          border: `1.5px solid ${color || 'var(--divider)'}`, background: 'var(--panel-raised)', color: 'var(--ink)',
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: color || '#BDB6A6' }} />
        {name}
      </button>
    );
  };

  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div>
          <div className="fl-display" style={{ fontSize: 16 }}>League rank by week</div>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            1 = top of the league. Hover the chart to see a week; click teams to highlight them (up to 3).
          </div>
        </div>
        <button className="fl-btn fl-keep-in-view" style={{ fontSize: 10.5, padding: '4px 9px' }} onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'Show chart' : 'Show as table'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {byFinish.map(chip)}
        {pins.length > 0 && (
          <button className="fl-btn fl-btn-ghost fl-keep-in-view" style={{ fontSize: 10.5 }} onClick={() => setPins([])}>Clear</button>
        )}
      </div>

      {showTable ? (
        <div className="fl-scroll-x">
          <table className="fl-table" style={{ minWidth: 120 + weeks.length * 44 }}>
            <thead>
              <tr>
                <th className="fl-th-left">Team</th>
                {weeks.map((w) => <th key={w}>Wk {w}</th>)}
              </tr>
            </thead>
            <tbody>
              {byFinish.map((name) => (
                <tr key={name}>
                  <td style={{ fontSize: 13, fontWeight: 600, padding: '6px 4px' }}>{name}</td>
                  {byWeek.map((wk, i) => (
                    <td key={weeks[i]} className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5 }} title={wk.records[name]}>
                      {wk.ranks[name]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            role="img"
            aria-label={`League rank of each team after each week of ${year.year}`}
            style={{ display: 'block', overflow: 'visible' }}
            onMouseMove={onMove}
            onMouseLeave={() => { setHoverIdx(null); setHoverTeam(null); }}
          >
            {names.map((_, i) => (
              <g key={i}>
                <line x1={LEFT} x2={W - RIGHT} y1={y(i + 1)} y2={y(i + 1)} stroke="#EEE9DD" strokeWidth="1" />
                <text x={LEFT - 12} y={y(i + 1) + 4} textAnchor="end" fontSize="11" fill="#8B8D7F" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{i + 1}</text>
              </g>
            ))}
            {weeks.map((w, i) => (
              <text key={w} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#8B8D7F" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {`W${w}`}
              </text>
            ))}
            {markIdx >= 0 && markIdx < weeks.length - 1 && (
              <line x1={x(markIdx)} x2={x(markIdx)} y1={TOP - 8} y2={y(n) + 8} stroke="var(--turf)" strokeWidth="1.5" />
            )}
            {hoverIdx !== null && (
              <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={TOP - 8} y2={y(n) + 8} stroke="#8B8D7F" strokeWidth="1" />
            )}

            {[...names].sort((a, b) => Number(emphasized(a)) - Number(emphasized(b))).map((name) => {
              const on = emphasized(name);
              const color = lineColor(name);
              return (
                <g key={name} style={{ cursor: 'pointer' }} onClick={() => togglePin(name)} onMouseEnter={() => setHoverTeam(name)}>
                  <path
                    d={pathFor(name)}
                    fill="none"
                    stroke={color}
                    strokeWidth={on ? 3 : 2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={anyEmphasis && !on ? 0.45 : 1}
                  />
                  <path d={pathFor(name)} fill="none" stroke="transparent" strokeWidth="14" />
                  {on && byWeek.map((wk, i) => (
                    <circle key={i} cx={x(i)} cy={y(wk.ranks[name])} r="4" fill={color} stroke="#FFFFFF" strokeWidth="2" />
                  ))}
                  <text
                    x={W - RIGHT + 12}
                    y={y(last.ranks[name]) + 4}
                    fontSize="12"
                    fontWeight={on ? 800 : 600}
                    fill="var(--ink)"
                    opacity={anyEmphasis && !on ? 0.55 : 1}
                  >
                    {`${last.ranks[name]}. ${name}`}
                  </text>
                </g>
              );
            })}
          </svg>

          {hoverIdx !== null && (
            <div
              style={{
                position: 'absolute', top: 0, pointerEvents: 'none', zIndex: 2,
                left: tipLeftPct > 60 ? undefined : `calc(${tipLeftPct}% + 14px)`,
                right: tipLeftPct > 60 ? `calc(${100 - tipLeftPct}% + 14px)` : undefined,
                background: 'var(--panel-raised)', border: '1px solid var(--divider)', borderRadius: 4,
                boxShadow: '0 4px 14px rgba(27,36,48,0.12)', padding: '8px 10px', minWidth: 150,
              }}
            >
              <div className="fl-display" style={{ fontSize: 13, marginBottom: 4 }}>After week {weeks[hoverIdx]}</div>
              {byWeek[hoverIdx].order.map((name) => {
                const prev = hoverIdx > 0 ? byWeek[hoverIdx - 1].ranks[name] : null;
                const now = byWeek[hoverIdx].ranks[name];
                const move = prev === null ? '' : prev > now ? `▲${prev - now}` : prev < now ? `▼${now - prev}` : '';
                const color = pinColor(name) || (hoverTeam === name ? 'var(--ink)' : null);
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, lineHeight: 1.55, fontWeight: color ? 800 : 500, color: 'var(--ink)' }}>
                    <span className="fl-mono" style={{ width: 18, textAlign: 'right', color: 'var(--ink-soft)' }}>{now}</span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color || 'transparent', flex: '0 0 8px' }} />
                    <span style={{ flex: 1 }}>{name}</span>
                    <span className="fl-mono" style={{ color: 'var(--ink-soft)' }}>{byWeek[hoverIdx].records[name]}</span>
                    <span className="fl-mono" style={{ width: 26, textAlign: 'right', color: 'var(--ink-faint)', fontSize: 10.5 }}>{move}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StandingsTab({ year, updateLeague, readOnly }) {
  const [setupDivisions, setSetupDivisions] = useState('2');
  const [setupTeamsPerDiv, setSetupTeamsPerDiv] = useState('5');
  const [viewMode, setViewMode] = useState('division');
  // Week the standings are shown through in View mode; remembered per season, null = latest week.
  const [weekPick, setWeekPick] = useState({ yearId: null, week: null });
  const [leagueSort, setLeagueSort] = useState({ field: 'rank', dir: 'asc' });
  const [showChart, setShowChart] = useState(false);
  const sortLeagueBy = (field) => setLeagueSort((cur) => (
    cur.field === field
      ? { field, dir: cur.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'rank' || field === 'name' ? 'asc' : 'desc' }
  ));

  const createStandings = () => {
    const numDivisions = Math.max(1, Math.min(20, parseInt(setupDivisions, 10) || 0));
    const teamsPerDivision = Math.max(1, Math.min(20, parseInt(setupTeamsPerDiv, 10) || 0));
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.divisions = generateDivisions(numDivisions, teamsPerDivision);
    });
  };
  const resetStandings = () => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.divisions = [];
    });
  };
  const addDivision = () => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.divisions.push(emptyDivision(y.divisions.length + 1));
    });
  };
  const removeDivision = (divId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.divisions = y.divisions.filter((d) => d.id !== divId);
    });
  };
  const renameDivision = (divId, name) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.divisions.find((d) => d.id === divId).name = name;
    });
  };
  const addTeam = (divId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.divisions.find((d) => d.id === divId).teams.push(emptyTeam());
    });
  };
  const updateTeamName = (divId, teamId, name) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const d = y.divisions.find((dd) => dd.id === divId);
      d.teams.find((tt) => tt.id === teamId).name = name;
    });
  };
  const removeTeam = (divId, teamId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const d = y.divisions.find((dd) => dd.id === divId);
      d.teams = d.teams.filter((t) => t.id !== teamId);
    });
  };
  const setTiebreaker = (mode) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.tiebreaker = mode;
    });
  };

  if (year.divisions.length === 0) {
    return (
      <div className="fl-empty" style={{ textAlign: 'left', padding: 20 }}>
        <div style={{ marginBottom: 12, textAlign: 'center' }}>Set up the {year.year} standings.</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 14 }}>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
            Number of divisions
            <input
              type="number"
              className="fl-mono"
              value={setupDivisions}
              onChange={(e) => setSetupDivisions(e.target.value)}
              style={{ display: 'block', width: 110, marginTop: 4, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '8px 6px', background: 'var(--panel-raised)' }}
            />
          </label>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
            Teams per division
            <input
              type="number"
              className="fl-mono"
              value={setupTeamsPerDiv}
              onChange={(e) => setSetupTeamsPerDiv(e.target.value)}
              style={{ display: 'block', width: 110, marginTop: 4, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '8px 6px', background: 'var(--panel-raised)' }}
            />
          </label>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="fl-btn fl-btn-turf" onClick={createStandings}><Plus size={14} /> Create standings</button>
        </div>
      </div>
    );
  }

  const tiebreaker = year.tiebreaker || 'points';

  // Weeks with at least one played game; future and not-yet-scored weeks aren't offered.
  const playedWeeks = getPlayedWeeks(year);
  const lastWeek = playedWeeks.length ? playedWeeks[playedWeeks.length - 1] : null;
  const pickedWeek = weekPick.yearId === year.id && playedWeeks.includes(weekPick.week) ? weekPick.week : lastWeek;
  const showWeekSlider = readOnly && playedWeeks.length > 1;
  const throughWeek = showWeekSlider ? pickedWeek : lastWeek;
  const standingsYear = throughWeek === lastWeek
    ? year
    : { ...year, weeks: year.weeks.filter((w) => (Number(w.weekNum) || 0) <= throughWeek) };
  const { leagueRank, divRank, statFor, winPctFor } = computeRanks(standingsYear, tiebreaker);

  return (
    <div>
      {showWeekSlider && (
        <div className="fl-panel" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 14px', marginBottom: 14 }}>
          <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Standings after</span>
          <span className="fl-display" style={{ fontSize: 18, minWidth: 78 }}>Week {pickedWeek}</span>
          <input
            type="range"
            className="fl-keep-in-view"
            aria-label="Show standings after week"
            min={0}
            max={playedWeeks.length - 1}
            step={1}
            value={playedWeeks.indexOf(pickedWeek)}
            onChange={(e) => setWeekPick({ yearId: year.id, week: playedWeeks[Number(e.target.value)] })}
            style={{ flex: '1 1 220px', accentColor: 'var(--turf)', cursor: 'pointer' }}
          />
          <span className="fl-mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)', minWidth: 90 }}>
            {pickedWeek === lastWeek ? 'latest week' : `of ${lastWeek} weeks`}
          </span>
        </div>
      )}
      <div className="fl-tiebreaker-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Tiebreaker</span>
          <div style={{ display: 'inline-flex', border: '1.5px solid var(--ink)', borderRadius: 3, overflow: 'hidden' }}>
            <button
              onClick={() => setTiebreaker('points')}
              style={{
                border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 10px',
                background: tiebreaker === 'points' ? 'var(--ink)' : 'transparent',
                color: tiebreaker === 'points' ? 'var(--panel)' : 'var(--ink)',
              }}
            >
              Total points
            </button>
            <button
              onClick={() => setTiebreaker('h2h')}
              style={{
                border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 10px',
                background: tiebreaker === 'h2h' ? 'var(--ink)' : 'transparent',
                color: tiebreaker === 'h2h' ? 'var(--panel)' : 'var(--ink)',
                borderLeft: '1.5px solid var(--ink)',
              }}
            >
              Head-to-head
            </button>
            <button
              onClick={() => setTiebreaker('h2h_nfl')}
              style={{
                border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 10px',
                background: tiebreaker === 'h2h_nfl' ? 'var(--ink)' : 'transparent',
                color: tiebreaker === 'h2h_nfl' ? 'var(--panel)' : 'var(--ink)',
                borderLeft: '1.5px solid var(--ink)',
              }}
            >
              Head-to-head (NFL)
            </button>
          </div>
        </div>
        <button className="fl-btn-ghost fl-btn" style={{ border: 'none', color: 'var(--rust)', fontSize: 11 }} onClick={resetStandings}>
          <Trash2 size={13} /> Reset standings
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>View</span>
        <div style={{ display: 'inline-flex', border: '1.5px solid var(--ink)', borderRadius: 3, overflow: 'hidden' }}>
          <button
            className="fl-keep-in-view"
            onClick={() => setViewMode('division')}
            style={{
              border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 10px',
              background: viewMode === 'division' ? 'var(--ink)' : 'transparent',
              color: viewMode === 'division' ? 'var(--panel)' : 'var(--ink)',
            }}
          >
            By division
          </button>
          <button
            className="fl-keep-in-view"
            onClick={() => setViewMode('league')}
            style={{
              border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 10px',
              background: viewMode === 'league' ? 'var(--ink)' : 'transparent',
              color: viewMode === 'league' ? 'var(--panel)' : 'var(--ink)',
              borderLeft: '1.5px solid var(--ink)',
            }}
          >
            League-wide
          </button>
        </div>
        {playedWeeks.length > 1 && (
          <button
            className="fl-btn fl-keep-in-view"
            style={{ fontSize: 11, padding: '5px 10px', marginLeft: 'auto', ...(showChart ? { background: 'var(--ink)', color: 'var(--panel)' } : {}) }}
            onClick={() => setShowChart((v) => !v)}
          >
            {showChart ? 'Hide standings chart' : 'Show standings chart'}
          </button>
        )}
      </div>
      {showChart && playedWeeks.length > 1 && (
        <StandingsChart year={year} weeks={playedWeeks} markWeek={throughWeek} />
      )}
      {viewMode === 'league' ? (
        <div className="fl-panel fl-panel-raised" style={{ padding: '14px 14px 8px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }}>Click a column header to sort.</div>
          <div className="fl-scroll-x">
            <table className="fl-table" style={{ tableLayout: 'fixed', minWidth: 560 }}>
              <colgroup>
                <col style={{ width: 52 }} />
                <col style={{ width: 92 }} />
                <col style={{ width: 40 }} />
                <col style={{ width: 40 }} />
                <col style={{ width: 40 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 96 }} />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr>
                  {[['Lg rk', 'rank'], ['Team', 'name'], ['W', 'wins'], ['L', 'losses'], ['T', 'ties'], ['Win%', 'winPct'], ['PF', 'pf'], ['PA', 'pa']].map(([label, field]) => (
                    <SortableTh
                      key={field}
                      label={label}
                      field={field}
                      sortField={leagueSort.field}
                      sortDir={leagueSort.dir}
                      onSort={sortLeagueBy}
                      alignLeft={field === 'name'}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {year.divisions
                  .flatMap((div) => div.teams.map((t) => ({ t, divId: div.id })))
                  .sort((a, b) => {
                    const rankA = leagueRank[a.t.id] || 999;
                    const rankB = leagueRank[b.t.id] || 999;
                    const value = (t) => {
                      if (leagueSort.field === 'winPct') return winPctFor(t.name);
                      return statFor(t.name)[leagueSort.field];
                    };
                    let cmp;
                    if (leagueSort.field === 'rank') cmp = rankA - rankB;
                    else if (leagueSort.field === 'name') cmp = (a.t.name || '').localeCompare(b.t.name || '');
                    else cmp = value(a.t) - value(b.t);
                    if (leagueSort.dir === 'desc') cmp = -cmp;
                    // Equal values keep league-rank order.
                    return cmp || rankA - rankB;
                  })
                  .map(({ t }) => {
                    const s = statFor(t.name);
                    const lRank = t.name ? leagueRank[t.id] : null;
                    return (
                      <tr key={t.id}>
                        <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: lRank === 1 ? 'var(--gold)' : 'var(--ink)' }}>
                          {lRank || '-'}
                        </td>
                        <td className="fl-field-name" style={{ fontSize: 13, fontWeight: 600, padding: '6px 4px' }}>{t.name || '—'}</td>
                        <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{s.wins}</td>
                        <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{s.losses}</td>
                        <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{s.ties}</td>
                        <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{fmtPct(winPctFor(t.name))}</td>
                        <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{formatScore(s.pf)}</td>
                        <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{formatScore(s.pa)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
      {year.divisions.map((div) => (
        <div key={div.id} className="fl-panel fl-panel-raised" style={{ padding: '14px 14px 8px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <input
              className="fl-field fl-display"
              style={{ fontSize: 17, maxWidth: 320, borderBottomColor: 'transparent' }}
              value={div.name}
              onChange={(e) => renameDivision(div.id, e.target.value)}
              aria-label="Division name"
            />
            <button className="fl-icon-btn" onClick={() => removeDivision(div.id)} aria-label="Delete division">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="fl-scroll-x">
            <table className="fl-table" style={{ tableLayout: 'fixed', minWidth: 620 }}>
              <colgroup>
                <col style={{ width: 52 }} />
                <col style={{ width: 52 }} />
                <col style={{ width: 92 }} />
                <col style={{ width: 40 }} />
                <col style={{ width: 40 }} />
                <col style={{ width: 40 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 96 }} />
                <col style={{ width: 96 }} />
                <col style={{ width: 32 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Div rk</th>
                  <th>Lg rk</th>
                  <th className="fl-th-left">Team</th>
                  <th>W</th>
                  <th>L</th>
                  <th>T</th>
                  <th>Win%</th>
                  <th>PF</th>
                  <th>PA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...div.teams].sort((a, b) => (divRank[a.id] || 999) - (divRank[b.id] || 999)).map((t) => {
                  const s = statFor(t.name);
                  const dRank = t.name ? divRank[t.id] : null;
                  const lRank = t.name ? leagueRank[t.id] : null;
                  return (
                    <tr key={t.id}>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: dRank === 1 ? 'var(--gold)' : 'var(--ink)' }}>
                        {dRank || '-'}
                      </td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: lRank === 1 ? 'var(--gold)' : 'var(--ink)' }}>
                        {lRank || '-'}
                      </td>
                      <td style={{ minWidth: 92, width: 92 }}>
                        <select
                          className="fl-field fl-field-name"
                          style={{ cursor: 'pointer' }}
                          value={t.name}
                          onChange={(e) => updateTeamName(div.id, t.id, e.target.value)}
                        >
                          <option value="">Select team</option>
                          {FANTASY_TEAMS.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{s.wins}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{s.losses}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{s.ties}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{fmtPct(winPctFor(t.name))}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{formatScore(s.pf)}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{formatScore(s.pa)}</td>
                      <td><button className="fl-icon-btn" onClick={() => removeTeam(div.id, t.id)} aria-label="Delete team"><Trash2 size={13} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {div.teams.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '10px 4px' }}>No teams in this division yet.</div>}
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <button className="fl-btn" style={{ fontSize: 11.5, padding: '5px 10px' }} onClick={() => addTeam(div.id)}><Plus size={12} /> Add team</button>
          </div>
        </div>
      ))}
      <button className="fl-btn fl-btn-turf" onClick={addDivision}><Plus size={14} /> Add division</button>
        </>
      )}
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
        Record, win%, points for, points against, and ranks are calculated automatically from the game log.
      </div>
    </div>
  );
}

function GamesTab({ year, updateLeague }) {
  const teamNames = getYearTeamNames(year);
  const [setupWeeks, setSetupWeeks] = useState('13');
  const [setupGamesPerWeek, setSetupGamesPerWeek] = useState('5');

  const createWeeks = () => {
    const numWeeks = Math.max(1, Math.min(30, parseInt(setupWeeks, 10) || 0));
    const gamesPerWeek = Math.max(1, Math.min(20, parseInt(setupGamesPerWeek, 10) || 0));
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.weeks = Array.from({ length: numWeeks }, (_, i) => {
        const w = emptyWeek(i + 1);
        w.games = Array.from({ length: gamesPerWeek }, () => emptyGame());
        return w;
      });
    });
  };

  const addWeek = () => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const lastWeek = y.weeks.length ? Math.max(...y.weeks.map((w) => Number(w.weekNum) || 0)) : 0;
      y.weeks.push(emptyWeek(lastWeek + 1 || 1));
    });
  };
  const renameWeek = (weekId, weekNum) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.weeks.find((w) => w.id === weekId).weekNum = weekNum === '' ? '' : Number(weekNum);
    });
  };
  const removeWeek = (weekId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.weeks = y.weeks.filter((w) => w.id !== weekId);
    });
  };
  const addGame = (weekId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.weeks.find((w) => w.id === weekId).games.push(emptyGame());
    });
  };
  const updateGame = (weekId, gameId, field, value) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const w = y.weeks.find((ww) => ww.id === weekId);
      const g = w.games.find((gg) => gg.id === gameId);
      g[field] = (field === 'teamA' || field === 'teamB') ? value : (value === '' ? 0 : Number(value));
    });
  };
  const removeGame = (weekId, gameId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const w = y.weeks.find((ww) => ww.id === weekId);
      w.games = w.games.filter((g) => g.id !== gameId);
    });
  };

  const sortedWeeks = [...year.weeks].sort((a, b) => (Number(a.weekNum) || 0) - (Number(b.weekNum) || 0));

  if (teamNames.length === 0) {
    return <div className="fl-empty" style={{ marginBottom: 14 }}>Add teams in the Standings tab first, then come back to log games.</div>;
  }

  return (
    <div>
      {year.weeks.length === 0 ? (
        <div className="fl-empty" style={{ textAlign: 'left', padding: 20 }}>
          <div style={{ marginBottom: 12, textAlign: 'center' }}>Set up the {year.year} game log.</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 14 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
              Number of weeks
              <input
                type="number"
                className="fl-mono"
                value={setupWeeks}
                onChange={(e) => setSetupWeeks(e.target.value)}
                style={{ display: 'block', width: 110, marginTop: 4, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '8px 6px', background: 'var(--panel-raised)' }}
              />
            </label>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
              Games per week
              <input
                type="number"
                className="fl-mono"
                value={setupGamesPerWeek}
                onChange={(e) => setSetupGamesPerWeek(e.target.value)}
                style={{ display: 'block', width: 110, marginTop: 4, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '8px 6px', background: 'var(--panel-raised)' }}
              />
            </label>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button className="fl-btn fl-btn-turf" onClick={createWeeks}><Plus size={14} /> Create weeks</button>
          </div>
        </div>
      ) : (
        sortedWeeks.map((week) => (
          <div key={week.id} className="fl-panel fl-panel-raised" style={{ padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="fl-display" style={{ fontSize: 14, color: 'var(--ink-faint)' }}>Week</span>
                <input
                  type="number"
                  className="fl-field fl-display"
                  style={{ fontSize: 18, width: 48, borderBottomColor: 'transparent' }}
                  value={week.weekNum}
                  onChange={(e) => renameWeek(week.id, e.target.value)}
                  aria-label="Week number"
                />
              </div>
              <button className="fl-icon-btn" onClick={() => removeWeek(week.id)} aria-label="Delete week">
                <Trash2 size={14} />
              </button>
            </div>
            {week.games.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '4px 4px 10px' }}>No games logged for this week yet.</div>
            ) : (
              <div className="fl-scroll-x">
                <table className="fl-table" style={{ tableLayout: 'fixed', minWidth: 380 }}>
                  <colgroup>
                    <col style={{ width: 130 }} />
                    <col style={{ width: 60 }} />
                    <col style={{ width: 60 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 32 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="fl-th-left">Team</th>
                      <th>Score</th>
                      <th>Score</th>
                      <th className="fl-th-left">Team</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {week.games.map((g) => {
                      const scoreA = Number(g.scoreA) || 0;
                      const scoreB = Number(g.scoreB) || 0;
                      const aWin = scoreA > scoreB;
                      const bWin = scoreB > scoreA;
                      const usedInWeek = new Set();
                      week.games.forEach((g2) => {
                        if (g2.id === g.id) return;
                        if (g2.teamA) usedInWeek.add(g2.teamA);
                        if (g2.teamB) usedInWeek.add(g2.teamB);
                      });
                      const optionsForA = teamNames.filter((n) => n === g.teamA || (!usedInWeek.has(n) && n !== g.teamB));
                      const optionsForB = teamNames.filter((n) => n === g.teamB || (!usedInWeek.has(n) && n !== g.teamA));
                      return (
                        <tr key={g.id}>
                          <td style={{ minWidth: 110 }}>
                            <select
                              className="fl-field fl-field-name"
                              style={{ cursor: 'pointer', ...(aWin ? { color: 'var(--turf-dark)', fontWeight: 800 } : {}) }}
                              value={g.teamA}
                              onChange={(e) => updateGame(week.id, g.id, 'teamA', e.target.value)}
                            >
                              <option value="">Team</option>
                              {optionsForA.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </td>
                          <td><ScoreInput value={g.scoreA} onCommit={(v) => updateGame(week.id, g.id, 'scoreA', v)} /></td>
                          <td><ScoreInput value={g.scoreB} onCommit={(v) => updateGame(week.id, g.id, 'scoreB', v)} /></td>
                          <td style={{ minWidth: 110 }}>
                            <select
                              className="fl-field fl-field-name"
                              style={{ cursor: 'pointer', ...(bWin ? { color: 'var(--turf-dark)', fontWeight: 800 } : {}) }}
                              value={g.teamB}
                              onChange={(e) => updateGame(week.id, g.id, 'teamB', e.target.value)}
                            >
                              <option value="">Team</option>
                              {optionsForB.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </td>
                          <td><button className="fl-icon-btn" onClick={() => removeGame(week.id, g.id)} aria-label="Delete game"><Trash2 size={13} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              <button className="fl-btn" style={{ fontSize: 11.5, padding: '5px 10px' }} onClick={() => addGame(week.id)}><Plus size={12} /> Add game</button>
            </div>
          </div>
        ))
      )}
      <button className="fl-btn fl-btn-turf" onClick={addWeek}><Plus size={14} /> Add week</button>
    </div>
  );
}

function DraftTab({ year, updateLeague }) {
  const [setupTeams, setSetupTeams] = useState('10');
  const [setupRounds, setSetupRounds] = useState('15');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const standingsTeamNames = getYearTeamNames(year);

  const createDraft = () => {
    const numTeams = Math.max(2, Math.min(30, parseInt(setupTeams, 10) || 0));
    const numRounds = Math.max(1, Math.min(40, parseInt(setupRounds, 10) || 0));
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.draft = emptyDraft(numTeams, numRounds);
    });
  };

  const resizeDraft = (numTeams, numRounds) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const d = y.draft;
      const newTeamNames = Array.from({ length: numTeams }, (_, i) => d.teamNames[i] || '');
      d.numTeams = numTeams;
      d.numRounds = numRounds;
      d.teamNames = newTeamNames;
    });
  };

  const renameDraftTeam = (col, name) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.draft.teamNames[col - 1] = name;
    });
  };

  const updatePick = (round, col, field, value) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const key = pickKey(round, col);
      if (!y.draft.picks[key]) y.draft.picks[key] = { player: '', position: '', team: '' };
      y.draft.picks[key][field] = value;
    });
  };

  // Only fills blanks, so a position or team already chosen for this pick is never replaced.
  const fillPickDetails = (round, col, { position, team }) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const pick = y.draft.picks[pickKey(round, col)];
      if (!pick) return;
      if (!pick.position && position) pick.position = position;
      if (!pick.team && team) pick.team = team;
    });
  };

  const playerIndex = React.useContext(PlayerIndexContext);

  const resetDraft = () => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      delete y.draft;
    });
  };

  const parseImportText = (text, numTeams, numRounds) => {
    const totalSlots = numTeams * numRounds;
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const picks = [];
    let skipped = 0;
    lines.forEach((line, idx) => {
      if (idx >= totalSlots) { skipped++; return; }
      const tokens = line.split(/\s+/);
      if (tokens.length < 3) { skipped++; return; }
      const team = tokens[tokens.length - 1].toUpperCase();
      const position = tokens[tokens.length - 2].toUpperCase();
      const typed = tokens.slice(0, tokens.length - 2).join(' ');
      const known = playerIndex && playerIndex.find(typed);
      const name = known ? known.name : typed;
      if (!name || !POSITIONS.includes(position) || !NFL_TEAMS.includes(team)) { skipped++; return; }
      picks.push({ overallPick: idx + 1, player: name, position, team });
    });
    return { picks, skipped };
  };

  const handleImport = () => {
    if (!year.draft) return;
    const { picks, skipped } = parseImportText(importText, year.draft.numTeams, year.draft.numRounds);
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const d = y.draft;
      picks.forEach(({ overallPick, player, position, team }) => {
        const { round, col } = pickLocationForOverall(overallPick, d.numTeams);
        d.picks[pickKey(round, col)] = { player, position, team };
      });
    });
    setImportMsg(
      `Imported ${picks.length} pick${picks.length === 1 ? '' : 's'}.`
      + (skipped ? ` Skipped ${skipped} line${skipped === 1 ? '' : 's'} (couldn't read a name, position, and team, or ran past the last slot).` : '')
    );
    setImportText('');
    setImportOpen(false);
  };

  const draft = year.draft;

  if (!draft) {
    return (
      <div className="fl-empty" style={{ textAlign: 'left', padding: 20 }}>
        <div style={{ marginBottom: 12, textAlign: 'center' }}>Set up the {year.year} draft board.</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 14 }}>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
            Number of teams
            <input
              type="number"
              className="fl-mono"
              value={setupTeams}
              onChange={(e) => setSetupTeams(e.target.value)}
              style={{ display: 'block', width: 90, marginTop: 4, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '8px 6px', background: 'var(--panel-raised)' }}
            />
          </label>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
            Number of rounds
            <input
              type="number"
              className="fl-mono"
              value={setupRounds}
              onChange={(e) => setSetupRounds(e.target.value)}
              style={{ display: 'block', width: 90, marginTop: 4, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '8px 6px', background: 'var(--panel-raised)' }}
            />
          </label>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="fl-btn fl-btn-turf" onClick={createDraft}><Plus size={14} /> Create draft board</button>
        </div>
      </div>
    );
  }

  const rounds = Array.from({ length: draft.numRounds }, (_, i) => i + 1);
  const cols = Array.from({ length: draft.numTeams }, (_, i) => i + 1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
            Teams
            <input
              type="number"
              className="fl-mono"
              value={draft.numTeams}
              onChange={(e) => resizeDraft(Math.max(2, Math.min(30, parseInt(e.target.value, 10) || draft.numTeams)), draft.numRounds)}
              style={{ display: 'block', width: 64, marginTop: 3, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '5px 4px', background: 'var(--panel-raised)' }}
            />
          </label>
          <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
            Rounds
            <input
              type="number"
              className="fl-mono"
              value={draft.numRounds}
              onChange={(e) => resizeDraft(draft.numTeams, Math.max(1, Math.min(40, parseInt(e.target.value, 10) || draft.numRounds)))}
              style={{ display: 'block', width: 64, marginTop: 3, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '5px 4px', background: 'var(--panel-raised)' }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="fl-btn" style={{ fontSize: 11.5, padding: '6px 11px' }} onClick={() => { setImportOpen((v) => !v); setImportMsg(''); }}>
            Import players
          </button>
          <button className="fl-btn-ghost fl-btn" style={{ border: 'none', color: 'var(--rust)', fontSize: 11 }} onClick={resetDraft}>
            <Trash2 size={13} /> Reset board
          </button>
        </div>
      </div>

      {importOpen && (
        <div className="fl-panel fl-panel-raised" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
            Paste one pick per line, in draft order. Each line ends with position then team, e.g. <span className="fl-mono">Josh Allen QB BUF</span>. Positions must be one of: {POSITIONS.join(', ')}. Team must be a valid NFL team abbreviation.
          </div>
          <textarea
            className="fl-field"
            style={{
              width: '100%', minHeight: 140, border: '1.5px solid var(--divider)', borderRadius: 3,
              padding: 8, fontSize: 12.5, background: 'var(--panel)', resize: 'vertical',
            }}
            placeholder={'Josh Allen QB BUF\nChristian McCaffrey RB SF\nJustin Jefferson WR MIN'}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="fl-btn fl-btn-turf" onClick={handleImport} disabled={!importText.trim()}>Import</button>
            <button className="fl-btn" onClick={() => { setImportOpen(false); setImportText(''); }}>Cancel</button>
          </div>
        </div>
      )}
      {importMsg && (
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 12 }}>{importMsg}</div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        {POSITIONS.map((p) => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 2, background: POSITION_COLORS[p], display: 'inline-block' }} />
            <span className="fl-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{p}</span>
          </div>
        ))}
      </div>

      <div className="fl-scroll-x">
        <table className="fl-table" style={{ tableLayout: 'fixed', minWidth: cols.length * 150 }}>
          <colgroup>
            <col style={{ width: 56 }} />
            {cols.map((c) => <col key={c} style={{ width: 150 }} />)}
          </colgroup>
          <thead>
            <tr>
              <th></th>
              {cols.map((c) => {
                const currentValue = draft.teamNames[c - 1] || '';
                const usedElsewhere = new Set(
                  draft.teamNames.filter((n, idx) => n && idx !== c - 1)
                );
                const availableOptions = standingsTeamNames.filter(
                  (n) => n === currentValue || !usedElsewhere.has(n)
                );
                return (
                  <th key={c} style={{ padding: '6px 4px' }}>
                    <select
                      className="fl-field fl-field-name"
                      style={{ textAlign: 'center', fontSize: 12, cursor: 'pointer' }}
                      value={currentValue}
                      onChange={(e) => renameDraftTeam(c, e.target.value)}
                    >
                      <option value="">Select team</option>
                      {availableOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r}>
                <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: 10 }}>
                  <div className="fl-display" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{r}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{r % 2 === 1 ? '\u2192' : '\u2190'}</div>
                </td>
                {cols.map((c) => {
                  const key = pickKey(r, c);
                  const pick = draft.picks[key] || { player: '', position: '', team: '' };
                  const posColor = POSITION_COLORS[pick.position];
                  const textStyle = posColor ? { color: '#fff' } : undefined;
                  const fieldBorderStyle = posColor ? { borderBottomColor: 'rgba(255,255,255,0.4)' } : undefined;
                  return (
                    <td key={c} style={{ verticalAlign: 'top', padding: '4px' }}>
                      <div
                        className="fl-panel"
                        style={{
                          padding: '6px 8px',
                          background: posColor || 'var(--panel-raised)',
                          borderColor: posColor || 'var(--divider)',
                          transition: 'background 0.12s ease',
                        }}
                      >
                        <div className="fl-mono" style={{ fontSize: 9.5, color: posColor ? 'rgba(255,255,255,0.75)' : 'var(--ink-faint)', marginBottom: 3 }}>
                          {pickLabel(r, c, draft.numTeams)}
                        </div>
                        <PlayerNameInput
                          className="fl-field fl-field-name"
                          style={{ fontSize: 12.5, padding: '2px 1px', ...textStyle, ...fieldBorderStyle }}
                          placeholder="Player"
                          value={pick.player}
                          yearNum={year.year}
                          onName={(name) => updatePick(r, c, 'player', name)}
                          onDetails={(details) => fillPickDetails(r, c, details)}
                        />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <select
                            className="fl-field fl-mono"
                            style={{ fontSize: 11, padding: '2px 1px', cursor: 'pointer', ...textStyle, ...fieldBorderStyle }}
                            value={pick.position}
                            onChange={(e) => updatePick(r, c, 'position', e.target.value)}
                          >
                            <option value="" style={{ color: '#000' }}>Pos</option>
                            {POSITIONS.map((p) => <option key={p} value={p} style={{ color: '#000' }}>{p}</option>)}
                          </select>
                          <select
                            className="fl-field fl-mono"
                            style={{ fontSize: 11, padding: '2px 1px', cursor: 'pointer', ...textStyle, ...fieldBorderStyle }}
                            value={pick.team}
                            onChange={(e) => updatePick(r, c, 'team', e.target.value)}
                          >
                            <option value="" style={{ color: '#000' }}>Tm</option>
                            {NFL_TEAMS.map((n) => <option key={n} value={n} style={{ color: '#000' }}>{n}</option>)}
                          </select>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayoffsTab({ year, updateLeague }) {
  const [setupTeams, setSetupTeams] = useState('4');
  const [setupUseDivWinners, setSetupUseDivWinners] = useState(false);

  const numDivisions = year.divisions.length;

  const createBracket = () => {
    const numTeams = Math.max(2, Math.min(32, parseInt(setupTeams, 10) || 0));
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.playoffBracket = { numTeams, useDivisionWinners: setupUseDivWinners && numDivisions >= 2, scores: {} };
    });
  };
  const resetBracket = () => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.playoffBracket = null;
    });
  };
  const updateScore = (roundIdx, matchupIdx, field, value) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const key = `${roundIdx}-${matchupIdx}`;
      if (!y.playoffBracket.scores[key]) y.playoffBracket.scores[key] = { scoreA: 0, scoreB: 0 };
      y.playoffBracket.scores[key][field] = value === '' ? 0 : Number(value);
    });
  };

  const bracket = year.playoffBracket;

  if (!bracket) {
    return (
      <div className="fl-empty" style={{ textAlign: 'left', padding: 20 }}>
        <div style={{ marginBottom: 12, textAlign: 'center' }}>Set up the {year.year} playoff bracket.</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 14 }}>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>
            Number of playoff teams
            <input
              type="number"
              className="fl-mono"
              value={setupTeams}
              onChange={(e) => setSetupTeams(e.target.value)}
              style={{ display: 'block', width: 130, marginTop: 4, textAlign: 'center', border: '1.5px solid var(--divider)', borderRadius: 3, padding: '8px 6px', background: 'var(--panel-raised)' }}
            />
          </label>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)', marginBottom: 6 }}>
            Give division winners the top seeds?
          </div>
          <div style={{ display: 'inline-flex', border: '1.5px solid var(--ink)', borderRadius: 3, overflow: 'hidden' }}>
            <button
              onClick={() => setSetupUseDivWinners(true)}
              disabled={numDivisions < 2}
              style={{
                border: 'none', cursor: numDivisions < 2 ? 'not-allowed' : 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 12px',
                background: setupUseDivWinners ? 'var(--ink)' : 'transparent',
                color: setupUseDivWinners ? 'var(--panel)' : 'var(--ink)',
                opacity: numDivisions < 2 ? 0.4 : 1,
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setSetupUseDivWinners(false)}
              style={{
                border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 12px',
                background: !setupUseDivWinners ? 'var(--ink)' : 'transparent',
                color: !setupUseDivWinners ? 'var(--panel)' : 'var(--ink)',
                borderLeft: '1.5px solid var(--ink)',
              }}
            >
              No, straight by league rank
            </button>
          </div>
          {numDivisions < 2 && (
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6 }}>
              Needs at least 2 divisions in Standings to seed division winners first.
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="fl-btn fl-btn-turf" onClick={createBracket}><Plus size={14} /> Generate bracket</button>
        </div>
      </div>
    );
  }

  const rounds = computeBracketRounds(year, bracket);
  const totalRounds = rounds.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div className="fl-mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
          {bracket.numTeams}-team bracket, seeded by {bracket.useDivisionWinners ? 'division winners then league rank' : 'league rank'}
        </div>
        <button className="fl-btn-ghost fl-btn" style={{ border: 'none', color: 'var(--rust)', fontSize: 11 }} onClick={resetBracket}>
          <Trash2 size={13} /> Reset bracket
        </button>
      </div>

      <div className="fl-bracket-scroll">
        <div className="fl-bracket-header">
          {rounds.map((_, roundIdx) => (
            <div key={roundIdx} className="fl-bracket-round-label">
              {playoffRoundLabel(roundIdx, totalRounds)}
            </div>
          ))}
        </div>
        <div className="fl-bracket-body">
          {rounds.map((matchups, roundIdx) => {
            const isQuarterfinals = playoffRoundLabel(roundIdx, totalRounds) === 'Quarterfinals';
            const displayMatchups = (isQuarterfinals && matchups.length >= 4)
              ? [matchups[0], matchups[1], matchups[3], matchups[2], ...matchups.slice(4)]
              : matchups;
            return (
            <div key={roundIdx} className="fl-bracket-round">
              {displayMatchups.map((m) => {
                const flip = playoffRoundLabel(roundIdx, totalRounds) === 'Semifinals' && m.index === 1;
                const topTeam = flip ? m.teamB : m.teamA;
                const bottomTeam = flip ? m.teamA : m.teamB;
                const topScore = flip ? m.scoreB : m.scoreA;
                const bottomScore = flip ? m.scoreA : m.scoreB;
                const topField = flip ? 'scoreB' : 'scoreA';
                const bottomField = flip ? 'scoreA' : 'scoreB';
                const topIsBye = flip ? m.isByeB : m.isByeA;
                const bottomIsBye = flip ? m.isByeA : m.isByeB;
                const topWin = m.winner && topTeam && m.winner.name === topTeam.name;
                const bottomWin = m.winner && bottomTeam && m.winner.name === bottomTeam.name;
                const canScore = m.teamA && m.teamB && !m.isByeA && !m.isByeB;
                const isBye = m.isByeA || m.isByeB;
                const presentTeam = topIsBye ? bottomTeam : topTeam;
                return (
                  <div key={m.index} className="fl-bracket-match-wrap">
                    <div className="fl-bmatch">
                      {isBye ? (
                        <>
                          <div className={'fl-bmatch-row winner'}>
                            <span className="fl-bmatch-name">
                              {presentTeam ? `(${presentTeam.seed}) ${presentTeam.name || 'TBD'}` : 'TBD'}
                            </span>
                          </div>
                          <div className="fl-bmatch-divider" />
                          <div className="fl-bmatch-bye">Bye</div>
                        </>
                      ) : (
                        <>
                          <div className={`fl-bmatch-row${topWin ? ' winner' : ''}`}>
                            <span className={`fl-bmatch-name${topTeam ? '' : ' tbd'}`}>
                              {topTeam ? `(${topTeam.seed}) ${topTeam.name || 'TBD'}` : 'TBD'}
                            </span>
                            {canScore && <ScoreInput value={topScore} onCommit={(v) => updateScore(roundIdx, m.index, topField, v)} width={56} />}
                          </div>
                          <div className="fl-bmatch-divider" />
                          <div className={`fl-bmatch-row${bottomWin ? ' winner' : ''}`}>
                            <span className={`fl-bmatch-name${bottomTeam ? '' : ' tbd'}`}>
                              {bottomTeam ? `(${bottomTeam.seed}) ${bottomTeam.name || 'TBD'}` : 'TBD'}
                            </span>
                            {canScore && <ScoreInput value={bottomScore} onCommit={(v) => updateScore(roundIdx, m.index, bottomField, v)} width={56} />}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-faint)', marginBottom: 6 }}>
        {label}
      </div>
      <div className="fl-display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>
        {value || 'Not yet determined'}
      </div>
      {detail && (
        <div className="fl-mono" style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
          {detail}
        </div>
      )}
    </div>
  );
}

function StatsTab({ year }) {
  const s = computeSeasonStats(year);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 420,
      }}
    >
      <StatCard
        label="Champion"
        value={s.champion}
        detail={s.champion ? 'League champion' : year.playoffBracket ? 'Playoffs in progress' : 'Set up the playoff bracket'}
      />
      <StatCard label="Runner-up" value={s.runnerUp} />
      <StatCard
        label="Highest season scorer"
        value={s.highScorer}
        detail={s.highScorer ? `${formatScore(s.highScorerPf)} pts` : null}
      />
      <StatCard
        label="Highest single game score"
        value={s.highGame ? s.highGame.name : null}
        detail={s.highGame ? `${formatScore(s.highGame.score)} pts (${s.highGame.label})` : null}
      />
      <StatCard label="Last place finisher" value={s.lastPlace} />
      <StatCard
        label="Lowest season scorer"
        value={s.lowScorer}
        detail={s.lowScorer ? `${formatScore(s.lowScorerPf)} pts` : null}
      />
      <StatCard
        label="Lowest single game score"
        value={s.lowGame ? s.lowGame.name : null}
        detail={s.lowGame ? `${formatScore(s.lowGame.score)} pts (${s.lowGame.label})` : null}
      />
    </div>
  );
}

function AssetRow({ asset, yearNum, onUpdate, onFillDetails, onRemove }) {
  return (
    <div className="fl-asset-row">
      <select
        className="fl-field fl-mono"
        style={{ width: 64, flex: '0 0 64px', cursor: 'pointer', fontSize: 11 }}
        value={asset.kind}
        onChange={(e) => onUpdate('kind', e.target.value)}
      >
        <option value="player">Plyr</option>
        <option value="waiver">$</option>
      </select>
      {asset.kind === 'player' ? (
        <>
          <PlayerNameInput
            className="fl-field fl-field-name"
            style={{ flex: '1 1 90px', minWidth: 70, fontSize: 12 }}
            placeholder="Player"
            value={asset.player}
            yearNum={yearNum}
            onName={(name) => onUpdate('player', name)}
            onDetails={onFillDetails}
          />
          <select
            className="fl-field fl-mono"
            style={{ width: 44, flex: '0 0 44px', cursor: 'pointer', fontSize: 11 }}
            value={asset.position}
            onChange={(e) => onUpdate('position', e.target.value)}
          >
            <option value="">Pos</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            className="fl-field fl-mono"
            style={{ width: 46, flex: '0 0 46px', fontSize: 11, cursor: 'pointer' }}
            value={asset.nflTeam}
            onChange={(e) => onUpdate('nflTeam', e.target.value)}
          >
            <option value="">Tm</option>
            {NFL_TEAMS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </>
      ) : (
        <input
          type="text"
          inputMode="decimal"
          className="fl-field fl-mono"
          style={{ width: 90, flex: '0 0 90px', fontSize: 12 }}
          placeholder="Amount ($)"
          value={asset.amount}
          onChange={(e) => onUpdate('amount', e.target.value)}
        />
      )}
      <button className="fl-icon-btn" style={{ width: 20, height: 20 }} onClick={onRemove} aria-label="Remove asset"><Trash2 size={11} /></button>
    </div>
  );
}

function TradesTab({ year, updateLeague }) {
  const teamNames = getYearTeamNames(year);

  const addTrade = () => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.trades.push(emptyTrade());
    });
  };
  const removeTrade = (tradeId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.trades = y.trades.filter((tr) => tr.id !== tradeId);
    });
  };
  const updateTradeDate = (tradeId, date) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.trades.find((tr) => tr.id === tradeId).date = date;
    });
  };
  const addParty = (tradeId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      y.trades.find((tr) => tr.id === tradeId).parties.push(emptyParty());
    });
  };
  const removeParty = (tradeId, partyId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const tr = y.trades.find((t) => t.id === tradeId);
      if (tr.parties.length <= 2) return;
      tr.parties = tr.parties.filter((p) => p.id !== partyId);
    });
  };
  const updatePartyTeam = (tradeId, partyId, team) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const tr = y.trades.find((t) => t.id === tradeId);
      tr.parties.find((p) => p.id === partyId).team = team;
    });
  };
  const addAsset = (tradeId, partyId, listKey) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const tr = y.trades.find((t) => t.id === tradeId);
      const party = tr.parties.find((p) => p.id === partyId);
      party[listKey].push(emptyAsset());
    });
  };
  const updateAsset = (tradeId, partyId, listKey, assetId, field, value) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const tr = y.trades.find((t) => t.id === tradeId);
      const party = tr.parties.find((p) => p.id === partyId);
      const asset = party[listKey].find((a) => a.id === assetId);
      asset[field] = field === 'amount' ? (value === '' ? 0 : Number(value)) : value;
    });
  };
  const fillAssetDetails = (tradeId, partyId, listKey, assetId, { position, team }) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const tr = y.trades.find((t) => t.id === tradeId);
      const party = tr.parties.find((p) => p.id === partyId);
      const asset = party[listKey].find((a) => a.id === assetId);
      if (!asset.position && position) asset.position = position;
      if (!asset.nflTeam && team) asset.nflTeam = team;
    });
  };
  const removeAsset = (tradeId, partyId, listKey, assetId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const tr = y.trades.find((t) => t.id === tradeId);
      const party = tr.parties.find((p) => p.id === partyId);
      party[listKey] = party[listKey].filter((a) => a.id !== assetId);
    });
  };
  const autofillFromOtherTeam = (tradeId, partyId) => {
    updateLeague((l) => {
      const y = l.years.find((yy) => yy.id === year.id);
      const tr = y.trades.find((t) => t.id === tradeId);
      if (tr.parties.length !== 2) return;
      const party = tr.parties.find((p) => p.id === partyId);
      const other = tr.parties.find((p) => p.id !== partyId);
      party.receives = other.sends.map((a) => ({ ...a, id: uid() }));
      party.sends = other.receives.map((a) => ({ ...a, id: uid() }));
    });
  };

  const sortedTrades = [...year.trades].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });

  return (
    <div>
      {year.trades.length === 0 ? (
        <div className="fl-empty" style={{ marginBottom: 14 }}>No trades logged for {year.year} yet.</div>
      ) : (
        sortedTrades.map((trade) => (
          <div key={trade.id} className="fl-trade-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Date</span>
                <input
                  type="date"
                  className="fl-mono"
                  value={trade.date}
                  onChange={(e) => updateTradeDate(trade.id, e.target.value)}
                  style={{ border: '1.5px solid var(--divider)', borderRadius: 3, padding: '3px 6px', fontSize: 12.5, background: 'var(--panel)' }}
                />
              </label>
              <button className="fl-icon-btn" style={{ width: 22, height: 22 }} onClick={() => removeTrade(trade.id)} aria-label="Delete trade"><Trash2 size={13} /></button>
            </div>

            <div className="fl-trade-parties">
              {trade.parties.map((party) => (
                <div key={party.id} className="fl-trade-party">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <select
                      className="fl-field fl-field-name"
                      style={{ maxWidth: 130, fontSize: 12.5, cursor: 'pointer' }}
                      value={party.team}
                      onChange={(e) => updatePartyTeam(trade.id, party.id, e.target.value)}
                    >
                      <option value="">Select team</option>
                      {teamNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {trade.parties.length === 2 && (
                        <button
                          className="fl-btn"
                          style={{ fontSize: 9.5, padding: '3px 6px' }}
                          onClick={() => autofillFromOtherTeam(trade.id, party.id)}
                        >
                          Autofill
                        </button>
                      )}
                      {trade.parties.length > 2 && (
                        <button className="fl-icon-btn" style={{ width: 20, height: 20 }} onClick={() => removeParty(trade.id, party.id)} aria-label="Remove team from trade">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <div className="fl-asset-tag" style={{ width: 'auto', marginBottom: 2 }}>Traded for</div>
                    {party.receives.map((asset) => (
                      <AssetRow
                        key={asset.id}
                        asset={asset}
                        yearNum={year.year}
                        onUpdate={(f, v) => updateAsset(trade.id, party.id, 'receives', asset.id, f, v)}
                        onFillDetails={(d) => fillAssetDetails(trade.id, party.id, 'receives', asset.id, d)}
                        onRemove={() => removeAsset(trade.id, party.id, 'receives', asset.id)}
                      />
                    ))}
                    <button className="fl-btn" style={{ fontSize: 9.5, padding: '2px 6px', marginTop: 1 }} onClick={() => addAsset(trade.id, party.id, 'receives')}>
                      <Plus size={10} /> Add
                    </button>
                  </div>

                  <div>
                    <div className="fl-asset-tag" style={{ width: 'auto', marginBottom: 2 }}>Traded away</div>
                    {party.sends.map((asset) => (
                      <AssetRow
                        key={asset.id}
                        asset={asset}
                        yearNum={year.year}
                        onUpdate={(f, v) => updateAsset(trade.id, party.id, 'sends', asset.id, f, v)}
                        onFillDetails={(d) => fillAssetDetails(trade.id, party.id, 'sends', asset.id, d)}
                        onRemove={() => removeAsset(trade.id, party.id, 'sends', asset.id)}
                      />
                    ))}
                    <button className="fl-btn" style={{ fontSize: 9.5, padding: '2px 6px', marginTop: 1 }} onClick={() => addAsset(trade.id, party.id, 'sends')}>
                      <Plus size={10} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 6 }}>
              <button className="fl-btn" style={{ fontSize: 10.5, padding: '4px 8px' }} onClick={() => addParty(trade.id)}>
                <Plus size={11} /> Add team to trade
              </button>
            </div>
          </div>
        ))
      )}
      <button className="fl-btn fl-btn-turf" onClick={addTrade}><Plus size={14} /> Add trade</button>
    </div>
  );
}

function computeTeamTrades(year, teamName) {
  return (year.trades || [])
    .filter((trade) => trade.parties.some((p) => p.team === teamName))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
}

function formatTradeAssetList(list) {
  if (!list || list.length === 0) return '—';
  return list.map((a) => (
    a.kind === 'waiver'
      ? `$${formatScore(a.amount)} waiver`
      : `${a.player || 'Unnamed player'}${a.position ? ` (${a.position}${a.nflTeam ? ` - ${a.nflTeam}` : ''})` : ''}`
  )).join(', ');
}

function TeamsTab({ year }) {
  const teamNames = getYearTeamNames(year);
  const [selected, setSelected] = useState('');
  const [showTrades, setShowTrades] = useState(false);
  const effectiveSelected = (selected && teamNames.includes(selected)) ? selected : (teamNames[0] || '');

  if (teamNames.length === 0) {
    return <div className="fl-empty">Add teams in the Standings tab first, then come back to view team pages.</div>;
  }

  const tiebreaker = year.tiebreaker || 'points';
  const { leagueRank, divRank, statFor, winPctFor } = computeRanks(year, tiebreaker);
  const teamEntry = year.divisions.flatMap((d) => d.teams).find((t) => t.name === effectiveSelected);
  const s = statFor(effectiveSelected);
  const dRank = teamEntry ? divRank[teamEntry.id] : null;
  const lRank = teamEntry ? leagueRank[teamEntry.id] : null;
  const schedule = [...computeTeamSchedule(year, effectiveSelected), ...computeTeamPlayoffSchedule(year, effectiveSelected)];
  const teamTrades = computeTeamTrades(year, effectiveSelected);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select
          className="fl-display fl-keep-in-view"
          value={effectiveSelected}
          onChange={(e) => { setSelected(e.target.value); setShowTrades(false); }}
          style={{
            fontSize: 20, padding: '8px 12px', border: '1.5px solid var(--ink)', borderRadius: 3,
            background: 'var(--panel-raised)', color: 'var(--ink)', cursor: 'pointer',
          }}
        >
          {teamNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <button
          className="fl-btn fl-keep-in-view"
          style={{ fontSize: 11, padding: '5px 10px' }}
          onClick={() => setShowTrades((v) => !v)}
          disabled={teamTrades.length === 0}
        >
          {showTrades ? 'Hide trades' : `View trades${teamTrades.length ? ` (${teamTrades.length})` : ''}`}
        </button>
      </div>

      <div className="fl-panel fl-panel-raised" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Record</div>
            <div className="fl-mono" style={{ fontSize: 16, fontWeight: 700 }}>{s.wins}-{s.losses}{s.ties ? `-${s.ties}` : ''}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Win%</div>
            <div className="fl-mono" style={{ fontSize: 16, fontWeight: 700 }}>{fmtPct(winPctFor(effectiveSelected))}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>PF</div>
            <div className="fl-mono" style={{ fontSize: 16, fontWeight: 700 }}>{formatScore(s.pf)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>PA</div>
            <div className="fl-mono" style={{ fontSize: 16, fontWeight: 700 }}>{formatScore(s.pa)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Div rank</div>
            <div className="fl-mono" style={{ fontSize: 16, fontWeight: 700, color: dRank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{dRank || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>League rank</div>
            <div className="fl-mono" style={{ fontSize: 16, fontWeight: 700, color: lRank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{lRank || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Trades</div>
            <div className="fl-mono" style={{ fontSize: 16, fontWeight: 700 }}>{teamTrades.length}</div>
          </div>
        </div>
      </div>

      {showTrades && (
        <div style={{ marginBottom: 16 }}>
          {teamTrades.map((trade) => (
            <div key={trade.id} className="fl-panel fl-panel-raised" style={{ padding: '10px 12px', marginBottom: 8 }}>
              <div className="fl-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 4 }}>
                {trade.date || 'Undated trade'} — with {trade.parties.filter((p) => p.team !== effectiveSelected).map((p) => p.team || 'Unselected team').join(', ') || '—'}
              </div>
              {trade.parties.filter((p) => p.team === effectiveSelected).map((p) => (
                <div key={p.id} style={{ fontSize: 12.5 }}>
                  <div><span style={{ color: 'var(--ink-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Received:</span> {formatTradeAssetList(p.receives)}</div>
                  <div><span style={{ color: 'var(--ink-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent:</span> {formatTradeAssetList(p.sends)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
        {schedule.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>No games logged for this team yet.</div>
        ) : (
          <div className="fl-scroll-x">
            <table className="fl-table" style={{ tableLayout: 'fixed', minWidth: 400 }}>
              <colgroup>
                <col style={{ width: 96 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 60 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Week</th>
                  <th className="fl-th-left">Opponent</th>
                  <th>Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, i) => (
                  <tr key={i} style={row.isPlayoff ? { background: 'var(--gold-bg)' } : undefined}>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5 }}>{row.weekLabel}</td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{row.isBye ? '—' : (row.opponent || '—')}</td>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5 }}>
                      {row.isBye || row.isUpcoming ? '—' : `${formatScore(row.own)} - ${formatScore(row.opp)}`}
                    </td>
                    <td
                      className="fl-mono"
                      style={{
                        textAlign: 'center', fontSize: 12.5, fontWeight: 800,
                        color: row.result === 'W' ? 'var(--turf-dark)' : row.result === 'L' ? 'var(--rust)' : row.result === 'BYE' ? 'var(--gold)' : 'var(--ink-soft)',
                      }}
                    >
                      {row.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Playoff games from a season's bracket. Byes aren't games, and a matchup where both
// scores are still 0 hasn't been played yet, so neither counts.
function computePlayoffStats(year) {
  const stats = {};
  const teams = new Set();
  if (!year.playoffBracket) return { stats, teams };
  const ensure = (name) => {
    if (!stats[name]) stats[name] = { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
    return stats[name];
  };
  computeBracketRounds(year, year.playoffBracket).forEach((matchups) => matchups.forEach((m) => {
    [m.teamA, m.teamB].forEach((t) => { if (t && t.name) teams.add(t.name); });
    if (m.isByeA || m.isByeB || !m.teamA || !m.teamB || !m.teamA.name || !m.teamB.name) return;
    const a = Number(m.scoreA) || 0;
    const b = Number(m.scoreB) || 0;
    if (a === 0 && b === 0) return;
    const sa = ensure(m.teamA.name);
    const sb = ensure(m.teamB.name);
    sa.pf += a; sa.pa += b;
    sb.pf += b; sb.pa += a;
    if (a > b) { sa.wins += 1; sb.losses += 1; } else if (b > a) { sb.wins += 1; sa.losses += 1; } else { sa.ties += 1; sb.ties += 1; }
  }));
  return { stats, teams };
}

// mode: 'combined' (regular season + playoffs), 'regular', or 'playoffs'.
// In playoffs mode, "seasons" counts playoff appearances (a first-round bye counts).
function computeAllTimeStandings(league, mode = 'regular') {
  const map = {};
  const addStats = (name, s) => {
    map[name].wins += s.wins;
    map[name].losses += s.losses;
    map[name].ties += s.ties;
    map[name].pf += s.pf;
    map[name].pa += s.pa;
  };
  league.years.forEach((y) => {
    const regular = computeTeamStats(y);
    const playoffs = mode === 'regular' ? null : computePlayoffStats(y);
    const namesInSeason = mode === 'playoffs' ? [...playoffs.teams] : getYearTeamNames(y);
    namesInSeason.forEach((name) => {
      if (!map[name]) map[name] = { seasons: new Set(), wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
      map[name].seasons.add(y.year);
      if (mode !== 'playoffs' && regular[name]) addStats(name, regular[name]);
      if (mode !== 'regular' && playoffs.stats[name]) addStats(name, playoffs.stats[name]);
    });
  });
  return Object.entries(map).map(([name, d]) => {
    const gp = d.wins + d.losses + d.ties;
    const winPct = gp > 0 ? (d.wins + d.ties * 0.5) / gp : 0;
    return { name, seasons: d.seasons.size, wins: d.wins, losses: d.losses, ties: d.ties, winPct, pf: d.pf, pa: d.pa };
  });
}

function computeTeamDraftStats(league) {
  const map = {};
  league.years.forEach((y) => {
    if (!y.draft || !y.draft.picks) return;
    Object.entries(y.draft.picks).forEach(([key, pick]) => {
      const player = (pick.player || '').trim();
      if (!player) return;
      const col = parseInt(key.split('-')[1], 10);
      const teamName = y.draft.teamNames[col - 1];
      if (!teamName) return;
      if (!map[teamName]) map[teamName] = {};
      map[teamName][player] = (map[teamName][player] || 0) + 1;
    });
  });
  return FANTASY_TEAMS.map((teamName) => {
    const players = map[teamName] || {};
    const entries = Object.entries(players);
    if (entries.length === 0) return { teamName, topPlayers: [], count: 0 };
    const maxCount = Math.max(...entries.map(([, c]) => c));
    const topPlayers = entries.filter(([, c]) => c === maxCount).map(([p]) => p).sort((a, b) => a.localeCompare(b));
    return { teamName, topPlayers, count: maxCount };
  });
}

function SortableTh({ label, field, sortField, sortDir, onSort, alignLeft }) {
  const active = sortField === field;
  return (
    <th
      className={alignLeft ? 'fl-th-left' : undefined}
      style={{ cursor: 'pointer', color: active ? 'var(--ink)' : undefined }}
      onClick={() => onSort(field)}
    >
      {label}{active ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : ''}
    </th>
  );
}

// Every season's Stats-tab superlatives side by side, one row per season.
function SeasonSuperlatives({ league }) {
  const seasons = [...league.years].sort((a, b) => a.year - b.year);
  if (seasons.length === 0) return <div className="fl-empty">No seasons yet.</div>;

  const columns = [
    ['Champion', (s) => [s.champion]],
    ['Runner-up', (s) => [s.runnerUp]],
    ['Highest season scorer', (s) => [s.highScorer, s.highScorer && `${formatScore(s.highScorerPf)} pts`]],
    ['Highest single game', (s) => [s.highGame && s.highGame.name, s.highGame && `${formatScore(s.highGame.score)} pts (${s.highGame.label})`]],
    ['Last place', (s) => [s.lastPlace]],
    ['Lowest season scorer', (s) => [s.lowScorer, s.lowScorer && `${formatScore(s.lowScorerPf)} pts`]],
    ['Lowest single game', (s) => [s.lowGame && s.lowGame.name, s.lowGame && `${formatScore(s.lowGame.score)} pts (${s.lowGame.label})`]],
  ];

  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }}>
        The same superlatives shown on each season's Stats tab. A dash means it isn't decided yet.
      </div>
      <div className="fl-scroll-x">
        <table className="fl-table" style={{ minWidth: 1040 }}>
          <thead>
            <tr>
              <th className="fl-th-left">Season</th>
              {columns.map(([label]) => <th key={label} className="fl-th-left">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {seasons.map((y) => {
              const s = computeSeasonStats(y);
              return (
                <tr key={y.id}>
                  <td className="fl-display" style={{ fontSize: 15, padding: '8px 4px', verticalAlign: 'top' }}>{y.year}</td>
                  {columns.map(([label, get]) => {
                    const [name, detail] = get(s);
                    return (
                      <td key={label} style={{ padding: '8px 6px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: name ? 'var(--ink)' : 'var(--ink-faint)' }}>{name || '—'}</div>
                        {detail && <div className="fl-mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{detail}</div>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Top `n` by value, ranked 1, 2, 2, 4... so equal values share a rank; anything tied with
// the last place shown is included too. `tolerance` is how close two values must be to count
// as equal: scores are compared to the hundredth, win percentages exactly.
function topRanked(items, dir, n = 10, tolerance = 0.005) {
  const sorted = [...items].sort((a, b) => (dir === 'desc' ? b.value - a.value : a.value - b.value));
  const out = [];
  let rank = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    if (i === 0 || Math.abs(sorted[i].value - sorted[i - 1].value) >= tolerance) rank = i + 1;
    if (rank > n) break;
    out.push({ ...sorted[i], rank });
  }
  return out;
}

// Win percentages are fractions of whole games, so only identical ones are ties (5-2 and 10-4
// are; .846 and .842 are not). The tiny margin just absorbs floating-point noise.
const WIN_PCT_TOLERANCE = 1e-9;

// The same top-10 list for each game set the Record Book switch offers.
function rankedByMode(items, dir) {
  return {
    combined: topRanked(items, dir),
    regular: topRanked(items.filter((i) => !i.playoff), dir),
    playoffs: topRanked(items.filter((i) => i.playoff), dir),
  };
}

// Season totals are regular-season points for each finished season (one with a champion);
// single games include playoff games but skip byes and matchups not played yet (0-0).
function computeAllTimeRecords(league) {
  const seasons = [];
  const seasonRecords = [];
  const games = [];
  const matchups = [];
  league.years.forEach((y) => {
    const finished = !!computeSeasonStats(y).champion;
    if (finished) {
      const stats = computeTeamStats(y);
      getYearTeamNames(y).forEach((name) => {
        if (!stats[name]) return;
        const s = stats[name];
        seasons.push({ team: name, year: y.year, value: s.pf });
        const gp = s.wins + s.losses + s.ties;
        if (gp) seasonRecords.push({ team: name, year: y.year, wins: s.wins, losses: s.losses, ties: s.ties, value: (s.wins + s.ties * 0.5) / gp });
      });
    }
    const addGame = (team, pts, opp, oppPts, label, playoff = false) => {
      if (team) games.push({ team, year: y.year, value: pts, opp, oppPts, label, playoff });
    };
    y.weeks.forEach((w) => w.games.forEach((g) => {
      const a = Number(g.scoreA) || 0;
      const b = Number(g.scoreB) || 0;
      if (!g.teamA || !g.teamB || (a === 0 && b === 0)) return;
      addGame(g.teamA, a, g.teamB, b, `Week ${w.weekNum}`);
      matchups.push({ team: g.teamA, pts: a, opp: g.teamB, oppPts: b, year: y.year, label: `Week ${w.weekNum}`, value: a + b });
      addGame(g.teamB, b, g.teamA, a, `Week ${w.weekNum}`);
    }));
    if (y.playoffBracket) {
      const rounds = computeBracketRounds(y, y.playoffBracket);
      rounds.forEach((roundMatchups, ri) => roundMatchups.forEach((m) => {
        if (m.isByeA || m.isByeB || !m.teamA || !m.teamB || !m.teamA.name || !m.teamB.name) return;
        const a = Number(m.scoreA) || 0;
        const b = Number(m.scoreB) || 0;
        if (a === 0 && b === 0) return;
        const label = playoffRoundLabel(ri, rounds.length);
        addGame(m.teamA.name, a, m.teamB.name, b, label, true);
        matchups.push({ team: m.teamA.name, pts: a, opp: m.teamB.name, oppPts: b, year: y.year, label, value: a + b, playoff: true });
        addGame(m.teamB.name, b, m.teamA.name, a, label, true);
      }));
    }
  });
  const margins = matchups
    .filter((m) => Math.abs(m.pts - m.oppPts) >= 0.005)
    .map((m) => ({ ...m, value: Math.abs(m.pts - m.oppPts) }));

  const all = computeStreaks(matchups);
  const regular = computeStreaks(matchups.filter((m) => !m.playoff));
  const playoffs = computeStreaks(matchups.filter((m) => m.playoff));
  return {
    highSeasons: topRanked(seasons, 'desc'),
    lowSeasons: topRanked(seasons, 'asc'),
    // Equal win% lists more wins first (best) or more losses first (worst).
    bestSeasonRecords: topRanked([...seasonRecords].sort((a, b) => b.wins - a.wins), 'desc', 10, WIN_PCT_TOLERANCE),
    worstSeasonRecords: topRanked([...seasonRecords].sort((a, b) => b.losses - a.losses), 'asc', 10, WIN_PCT_TOLERANCE),
    highGames: rankedByMode(games, 'desc'),
    lowGames: rankedByMode(games, 'asc'),
    highMatchups: rankedByMode(matchups, 'desc'),
    lowMatchups: rankedByMode(matchups, 'asc'),
    // Margin of victory; tied games had no winner, so they're left out of both lists.
    blowouts: rankedByMode(margins, 'desc'),
    closest: rankedByMode(margins, 'asc'),
    winStreaks: {
      combined: topRanked(all.wins, 'desc'),
      regular: topRanked(regular.wins, 'desc'),
      playoffs: topRanked(playoffs.wins, 'desc'),
    },
    lossStreaks: {
      combined: topRanked(all.losses, 'desc'),
      regular: topRanked(regular.losses, 'desc'),
      playoffs: topRanked(playoffs.losses, 'desc'),
    },
  };
}

// Streaks over the given matchups: every team's games in order (seasons oldest first,
// regular-season weeks, then playoff rounds), carrying over from one season to the next.
// A tie ends a streak. A streak is "active" if it runs through the team's latest game and
// that game is in the most recent season these matchups cover.
function computeStreaks(matchups) {
  const timeline = {};
  const played = (team, result, year, label) => {
    if (!timeline[team]) timeline[team] = [];
    timeline[team].push({ result, year, label });
  };
  const weekOrder = (m) => (m.playoff ? 1000 : Number(m.label.slice(5)) || 0);
  matchups
    .map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.year - b.m.year || weekOrder(a.m) - weekOrder(b.m) || a.i - b.i)
    .forEach(({ m }) => {
      const r = m.pts > m.oppPts ? 'W' : m.pts < m.oppPts ? 'L' : 'T';
      played(m.team, r, m.year, m.label);
      played(m.opp, r === 'W' ? 'L' : r === 'L' ? 'W' : 'T', m.year, m.label);
    });
  const wins = [];
  const losses = [];
  const latestYear = Math.max(0, ...matchups.map((m) => m.year));
  Object.entries(timeline).forEach(([team, games]) => {
    let start = 0;
    for (let i = 1; i <= games.length; i += 1) {
      if (i < games.length && games[i].result === games[start].result) continue;
      const result = games[start].result;
      if (result !== 'T') {
        (result === 'W' ? wins : losses).push({
          team,
          value: i - start,
          from: `${games[start].year} ${games[start].label}`,
          to: `${games[i - 1].year} ${games[i - 1].label}`,
          active: i === games.length && games[i - 1].year === latestYear,
        });
      }
      start = i;
    }
  });
  return { wins, losses };
}

function RecordList({ title, rows: fixedRows, rowsByMode, isGame }) {
  const { rows, visible, switcher, foldRows } = useModeAndTieFold(rowsByMode, fixedRows);
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 6 }}>{title}</div>
      {switcher}
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>Nothing to show yet.</div>
      ) : (
        <table className="fl-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Rk</th>
              <th className="fl-th-left">Team</th>
              <th>Pts</th>
              <th className="fl-th-left">{isGame ? 'When' : 'Season'}</th>
              {isGame && <th className="fl-th-left">Opponent</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.rank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{r.rank}</td>
                <td style={{ fontSize: 13, fontWeight: 700 }}>{r.team}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600 }}>{formatScore(r.value)}</td>
                <td className="fl-mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{isGame ? `${r.year} ${r.label}` : r.year}</td>
                {isGame && (
                  <td style={{ fontSize: 12.5 }}>
                    {r.opp} <span className="fl-mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>({formatScore(r.oppPts)})</span>
                  </td>
                )}
              </tr>
            ))}
            {foldRows(isGame ? 5 : 4, (r) => formatScore(r.value), isGame ? 'games' : 'seasons')}
          </tbody>
        </table>
      )}
    </div>
  );
}

// How many regular-season weeks each team spent 1st and last in the league-wide standings,
// and with the most and fewest season-to-date points, across every season (including the
// current one so far). Uses the same weekly ranks as the standings chart, so each season's
// tiebreaker applies. Teams exactly tied for most or fewest points each get the week.
function computeWeeksAtTopAndBottom(league) {
  const top = {};
  const bottom = {};
  const mostPts = {};
  const fewestPts = {};
  const weekHigh = {};
  const weekLow = {};
  computeAllTimeStandings(league, 'combined').forEach((s) => {
    if (!s.name) return;
    [top, bottom, mostPts, fewestPts, weekHigh, weekLow].forEach((map) => { map[s.name] = { team: s.name, value: 0, byYear: {} }; });
  });
  const bump = (map, team, year) => {
    if (!map[team]) map[team] = { team, value: 0, byYear: {} };
    map[team].value += 1;
    map[team].byYear[year] = (map[team].byYear[year] || 0) + 1;
  };
  [...league.years].sort((a, b) => a.year - b.year).forEach((y) => {
    const weeks = getPlayedWeeks(y);
    if (!weeks.length) return;
    computeWeeklyRanks(y, weeks).byWeek.forEach(({ order, pointsFor }) => {
      if (!order.length) return;
      bump(top, order[0], y.year);
      bump(bottom, order[order.length - 1], y.year);
      const pts = order.map((n) => pointsFor[n]);
      const max = Math.max(...pts);
      const min = Math.min(...pts);
      order.forEach((n) => {
        if (Math.abs(pointsFor[n] - max) < 0.005) bump(mostPts, n, y.year);
        if (Math.abs(pointsFor[n] - min) < 0.005) bump(fewestPts, n, y.year);
      });
    });
    // That week's own scores (not season totals); unplayed 0-0 games are skipped.
    weeks.forEach((wk) => {
      const scores = [];
      y.weeks.filter((w) => (Number(w.weekNum) || 0) === wk).forEach((w) => w.games.forEach((g) => {
        const a = Number(g.scoreA) || 0;
        const b = Number(g.scoreB) || 0;
        if (!g.teamA || !g.teamB || (a === 0 && b === 0)) return;
        scores.push([g.teamA, a], [g.teamB, b]);
      }));
      if (!scores.length) return;
      const hi = Math.max(...scores.map((s) => s[1]));
      const lo = Math.min(...scores.map((s) => s[1]));
      scores.forEach(([team, pts]) => {
        if (Math.abs(pts - hi) < 0.005) bump(weekHigh, team, y.year);
        if (Math.abs(pts - lo) < 0.005) bump(weekLow, team, y.year);
      });
    });
  });
  const rank = (map) => topRanked(Object.values(map), 'desc', Infinity);
  return {
    top: rank(top),
    bottom: rank(bottom),
    mostPts: rank(mostPts),
    fewestPts: rank(fewestPts),
    weekHigh: rank(weekHigh),
    weekLow: rank(weekLow),
  };
}

function WeeksAtRankList({ title, rows }) {
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 6 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>Nothing to show yet.</div>
      ) : (
        <table className="fl-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Rk</th>
              <th className="fl-th-left">Team</th>
              <th>Weeks</th>
              <th className="fl-th-left">By season</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.team}>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.rank === 1 && r.value ? 'var(--gold)' : 'var(--ink)' }}>{r.rank}</td>
                <td style={{ fontSize: 13, fontWeight: 700 }}>{r.team}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.value ? 'var(--ink)' : 'var(--ink-faint)' }}>{r.value}</td>
                <td className="fl-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  {Object.entries(r.byYear).map(([yr, n]) => `${yr} (${n})`).join(', ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SeasonRecordList({ title, rows: fixedRows }) {
  const { rows, visible, foldRows } = useModeAndTieFold(null, fixedRows);
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 6 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>Nothing to show yet.</div>
      ) : (
        <table className="fl-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Rk</th>
              <th className="fl-th-left">Team</th>
              <th>Record</th>
              <th>Win%</th>
              <th className="fl-th-left">Season</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.rank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{r.rank}</td>
                <td style={{ fontSize: 13, fontWeight: 700 }}>{r.team}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600 }}>{`${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ''}`}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{fmtPct(r.value)}</td>
                <td className="fl-mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{r.year}</td>
              </tr>
            ))}
            {foldRows(5, (r) => fmtPct(r.value), 'seasons')}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MatchupRecordList({ title, rowsByMode, valueLabel = 'Total' }) {
  const { rows, visible, switcher, foldRows } = useModeAndTieFold(rowsByMode);
  const side = (name, pts, won) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span style={{ fontWeight: won ? 800 : 600, color: won ? 'var(--turf-dark)' : 'var(--ink)' }}>{name}</span>
      {' '}<span className="fl-mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{formatScore(pts)}</span>
    </span>
  );
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 6 }}>{title}</div>
      {switcher}
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>Nothing to show yet.</div>
      ) : (
        <table className="fl-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Rk</th>
              <th className="fl-th-left">Matchup</th>
              <th>{valueLabel}</th>
              <th className="fl-th-left">When</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.rank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{r.rank}</td>
                <td style={{ fontSize: 13 }}>
                  {side(r.team, r.pts, r.pts > r.oppPts)}
                  <span style={{ color: 'var(--ink-faint)' }}>{' vs '}</span>
                  {side(r.opp, r.oppPts, r.oppPts > r.pts)}
                </td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{formatScore(r.value)}</td>
                <td className="fl-mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{`${r.year} ${r.label}`}</td>
              </tr>
            ))}
            {foldRows(4, (r) => formatScore(r.value), 'matchups')}
          </tbody>
        </table>
      )}
    </div>
  );
}

const STREAK_MODES = [['combined', 'Regular + playoffs'], ['regular', 'Regular season'], ['playoffs', 'Playoffs']];

// Shared by the record lists that switch between game sets ({ combined, regular, playoffs })
// and fold a big tie for last place into one expandable line.
function useModeAndTieFold(rowsByMode, fixedRows) {
  const [mode, setMode] = useState('combined');
  const [showAllTied, setShowAllTied] = useState(false);
  const rows = rowsByMode ? rowsByMode[mode] : fixedRows;
  const lastRank = rows.length ? rows[rows.length - 1].rank : 0;
  const tiedAtEnd = rows.filter((r) => r.rank === lastRank);
  const fold = rows.length > 10 && tiedAtEnd.length > 2 && lastRank > 1 && !showAllTied;
  const visible = fold ? rows.filter((r) => r.rank !== lastRank) : rows;

  const switcher = rowsByMode && (
    <div style={{ display: 'inline-flex', border: '1.5px solid var(--ink)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
      {STREAK_MODES.map(([key, label], i) => (
        <button
          key={key}
          className="fl-keep-in-view"
          onClick={() => { setMode(key); setShowAllTied(false); }}
          style={{
            border: 'none', cursor: 'pointer', fontSize: 10.5, fontWeight: 700, padding: '4px 8px',
            background: mode === key ? 'var(--ink)' : 'transparent',
            color: mode === key ? 'var(--panel)' : 'var(--ink)',
            borderLeft: i ? '1.5px solid var(--ink)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  // describe(row) says what the tied rows share, e.g. "5 games" or "1-1".
  const foldRows = (columns, describe, noun) => (
    <>
      {fold && (
        <tr>
          <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{lastRank}</td>
          <td colSpan={columns - 1} style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {tiedAtEnd.length} {noun} tied at {describe(tiedAtEnd[0])}{' '}
            <button className="fl-btn fl-keep-in-view" style={{ fontSize: 9.5, padding: '2px 7px', marginLeft: 4 }} onClick={() => setShowAllTied(true)}>
              Show all
            </button>
          </td>
        </tr>
      )}
      {showAllTied && (
        <tr>
          <td colSpan={columns} style={{ textAlign: 'center' }}>
            <button className="fl-btn fl-keep-in-view" style={{ fontSize: 9.5, padding: '2px 7px' }} onClick={() => setShowAllTied(false)}>
              Show fewer
            </button>
          </td>
        </tr>
      )}
    </>
  );

  return { mode, rows, visible, switcher, foldRows };
}

function StreakRecordList({ title, rows: fixedRows, rowsByMode }) {
  const { rows, visible, switcher, foldRows } = useModeAndTieFold(rowsByMode, fixedRows);
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 6 }}>{title}</div>
      {switcher}
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>Nothing to show yet.</div>
      ) : (
        <table className="fl-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Rk</th>
              <th className="fl-th-left">Team</th>
              <th>Games</th>
              <th className="fl-th-left">From – to</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.rank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{r.rank}</td>
                <td style={{ fontSize: 13, fontWeight: 700 }}>{r.team}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{r.value}</td>
                <td className="fl-mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
                  {r.from} – {r.to}
                  {r.active && (
                    <span style={{ marginLeft: 6, fontFamily: "'Libre Franklin', sans-serif", fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--turf-dark)', border: '1px solid var(--turf)', borderRadius: 3, padding: '0 4px' }}>
                      active
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {foldRows(4, (r) => gamesText(r.value), 'streaks')}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Games two teams need against each other to make the head-to-head record lists, so a
// tiny sample like 2-0 can't top them. Playoff matchups are rarer, so that view needs fewer.
const HEAD_TO_HEAD_MIN_GAMES = { combined: 4, regular: 4, playoffs: 2 };

// Best and worst records of one team against a single opponent, for each game set.
// Ranked by win%; equal win% puts more wins first (best) or more losses first (worst).
function computeHeadToHeadRecords(league) {
  const teams = computeAllTimeStandings(league, 'combined').map((s) => s.name).filter(Boolean);
  const best = {};
  const worst = {};
  const mostCommon = {};
  Object.keys(HEAD_TO_HEAD_MIN_GAMES).forEach((mode) => {
    const pairs = [];
    const meetings = new Map(); // one entry per pair of teams, with the series leader listed first
    teams.forEach((team) => computeHeadToHead(league, team, mode).forEach((h) => {
      const key = [team, h.name].sort().join('|');
      const leaderFirst = h.wins > h.losses || (h.wins === h.losses && team.localeCompare(h.name) < 0);
      if (leaderFirst && !meetings.has(key)) {
        meetings.set(key, { team, opp: h.name, wins: h.wins, losses: h.losses, ties: h.ties, value: h.games });
      }
      if (h.games < HEAD_TO_HEAD_MIN_GAMES[mode]) return;
      pairs.push({ team, opp: h.name, wins: h.wins, losses: h.losses, ties: h.ties, games: h.games, value: h.winPct });
    }));
    best[mode] = topRanked([...pairs].sort((a, b) => b.wins - a.wins), 'desc', 10, WIN_PCT_TOLERANCE);
    worst[mode] = topRanked([...pairs].sort((a, b) => b.losses - a.losses), 'asc', 10, WIN_PCT_TOLERANCE);
    mostCommon[mode] = topRanked([...meetings.values()], 'desc');
  });
  return { best, worst, mostCommon };
}

function HeadToHeadRecordList({ title, rowsByMode }) {
  const { mode, rows, visible, switcher, foldRows } = useModeAndTieFold(rowsByMode);
  const record = (r) => `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ''}`;
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 6 }}>{title}</div>
      {switcher}
      <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginBottom: 4 }}>
        At least {HEAD_TO_HEAD_MIN_GAMES[mode]} games against each other.
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>Nothing to show yet.</div>
      ) : (
        <table className="fl-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Rk</th>
              <th className="fl-th-left">Team</th>
              <th className="fl-th-left">Vs.</th>
              <th>Record</th>
              <th>Win%</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.rank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{r.rank}</td>
                <td style={{ fontSize: 13, fontWeight: 700 }}>{r.team}</td>
                <td style={{ fontSize: 13 }}>{r.opp}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600 }}>{record(r)}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{fmtPct(r.value)}</td>
              </tr>
            ))}
            {foldRows(5, (r) => fmtPct(r.value), 'records')}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Longest runs of one team beating (or losing to) the same opponent, meeting after meeting in
// date order across seasons. A tie ends a run. A run is "active" if it includes the pair's most
// recent meeting and both teams are in the latest season.
function computeHeadToHeadStreaks(league) {
  const all = collectPlayedGames(league);
  const latest = [...league.years].sort((a, b) => b.year - a.year)[0];
  const current = new Set(latest ? getYearTeamNames(latest) : []);
  const wins = {};
  const losses = {};
  Object.entries(MODE_FILTERS).forEach(([mode, keep]) => {
    const byPair = new Map();
    all.filter(keep).forEach((g) => {
      const key = [g.teamA, g.teamB].sort().join('|');
      if (!byPair.has(key)) byPair.set(key, []);
      byPair.get(key).push(g);
    });
    const w = [];
    const l = [];
    byPair.forEach((games) => {
      games.sort((x, y) => x.year - y.year || x.order - y.order);
      const winnerOf = (g) => (g.a > g.b ? g.teamA : g.b > g.a ? g.teamB : null);
      let start = 0;
      for (let i = 1; i <= games.length; i += 1) {
        if (i < games.length && winnerOf(games[i]) === winnerOf(games[start])) continue;
        const winner = winnerOf(games[start]);
        if (winner) {
          const first = games[start];
          const last = games[i - 1];
          const loser = first.teamA === winner ? first.teamB : first.teamA;
          const run = {
            value: i - start,
            from: `${first.year} ${first.label}`,
            to: `${last.year} ${last.label}`,
            active: i === games.length && current.has(winner) && current.has(loser),
          };
          w.push({ ...run, team: winner, opp: loser });
          l.push({ ...run, team: loser, opp: winner });
        }
        start = i;
      }
    });
    wins[mode] = topRanked(w, 'desc');
    losses[mode] = topRanked(l, 'desc');
  });
  return { wins, losses };
}

const MODE_FILTERS = {
  combined: () => true,
  regular: (g) => !g.playoff,
  playoffs: (g) => g.playoff,
};

function HeadToHeadStreakList({ title, rowsByMode, verb }) {
  const { rows, visible, switcher, foldRows } = useModeAndTieFold(rowsByMode);
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 6 }}>{title}</div>
      {switcher}
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>Nothing to show yet.</div>
      ) : (
        <table className="fl-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Rk</th>
              <th className="fl-th-left">Team</th>
              <th className="fl-th-left">{verb}</th>
              <th>Games</th>
              <th className="fl-th-left">From – to</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.rank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{r.rank}</td>
                <td style={{ fontSize: 13, fontWeight: 700 }}>{r.team}</td>
                <td style={{ fontSize: 13 }}>{r.opp}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{r.value}</td>
                <td className="fl-mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
                  {r.from} – {r.to}
                  {r.active && (
                    <span style={{ marginLeft: 6, fontFamily: "'Libre Franklin', sans-serif", fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--turf-dark)', border: '1px solid var(--turf)', borderRadius: 3, padding: '0 4px' }}>
                      active
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {foldRows(5, (r) => gamesText(r.value), 'streaks')}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CommonMatchupList({ title, rowsByMode }) {
  const { rows, visible, switcher, foldRows } = useModeAndTieFold(rowsByMode);
  const series = (r) => {
    const score = `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ''}`;
    return r.wins === r.losses ? `Tied ${score}` : `${r.team} leads ${score}`;
  };
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 6 }}>{title}</div>
      {switcher}
      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>Nothing to show yet.</div>
      ) : (
        <table className="fl-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Rk</th>
              <th className="fl-th-left">Matchup</th>
              <th>Games</th>
              <th className="fl-th-left">Series</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: r.rank === 1 ? 'var(--gold)' : 'var(--ink)' }}>{r.rank}</td>
                <td style={{ fontSize: 13, fontWeight: 700 }}>{r.team} vs {r.opp}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{r.value}</td>
                <td className="fl-mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{series(r)}</td>
              </tr>
            ))}
            {foldRows(4, (r) => gamesText(r.value), 'matchups')}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AllTimeRecords({ league }) {
  const r = computeAllTimeRecords(league);
  const h2h = computeHeadToHeadRecords(league);
  const weeksAtRank = computeWeeksAtTopAndBottom(league);
  const h2hStreaks = computeHeadToHeadStreaks(league);
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 10 }}>
        Season totals and season records are regular season only and count finished seasons (ones with a champion).
        Weeks in 1st/last place and as top/lowest scorer look at the standings and season-to-date points after every
        regular-season week, including this season so far; highest/lowest score of the week counts each week's own scores.
        The other lists can show regular season + playoffs, just the regular season, or just the playoffs.
        A matchup total is both teams' scores added together, and a margin is the winner's score minus the loser's
        (tied games aren't counted). Streaks carry over from one season into the next and end on a tie. Records vs.
        one team need a minimum number of games between the two teams (shown on each list). Equal values share a rank.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
        <SeasonRecordList title="Best regular season records" rows={r.bestSeasonRecords} />
        <SeasonRecordList title="Worst regular season records" rows={r.worstSeasonRecords} />
        <RecordList title="Highest scoring seasons" rows={r.highSeasons} />
        <RecordList title="Lowest scoring seasons" rows={r.lowSeasons} />
        <WeeksAtRankList title="Weeks in 1st place" rows={weeksAtRank.top} />
        <WeeksAtRankList title="Weeks in last place" rows={weeksAtRank.bottom} />
        <WeeksAtRankList title="Weeks as top scorer" rows={weeksAtRank.mostPts} />
        <WeeksAtRankList title="Weeks as lowest scorer" rows={weeksAtRank.fewestPts} />
        <WeeksAtRankList title="Highest score of the week" rows={weeksAtRank.weekHigh} />
        <WeeksAtRankList title="Lowest score of the week" rows={weeksAtRank.weekLow} />
        <RecordList title="Highest scoring games" rowsByMode={r.highGames} isGame />
        <RecordList title="Lowest scoring games" rowsByMode={r.lowGames} isGame />
        <MatchupRecordList title="Highest scoring matchups" rowsByMode={r.highMatchups} />
        <MatchupRecordList title="Lowest scoring matchups" rowsByMode={r.lowMatchups} />
        <MatchupRecordList title="Biggest blowouts" rowsByMode={r.blowouts} valueLabel="Margin" />
        <MatchupRecordList title="Closest games" rowsByMode={r.closest} valueLabel="Margin" />
        <StreakRecordList title="Longest winning streaks" rowsByMode={r.winStreaks} />
        <StreakRecordList title="Longest losing streaks" rowsByMode={r.lossStreaks} />
        <HeadToHeadRecordList title="Best records vs. one team" rowsByMode={h2h.best} />
        <HeadToHeadRecordList title="Worst records vs. one team" rowsByMode={h2h.worst} />
        <CommonMatchupList title="Most common matchups" rowsByMode={h2h.mostCommon} />
        <HeadToHeadStreakList title="Longest winning streaks vs. one team" rowsByMode={h2hStreaks.wins} verb="Over" />
        <HeadToHeadStreakList title="Longest losing streaks vs. one team" rowsByMode={h2hStreaks.losses} verb="To" />
      </div>
    </div>
  );
}

// Every played game in the league: regular-season games from the game logs plus playoff
// games from the brackets. Byes and matchups still at 0-0 (not played yet) are skipped.
function collectPlayedGames(league) {
  const out = [];
  league.years.forEach((y) => {
    y.weeks.forEach((w) => w.games.forEach((g) => {
      const a = Number(g.scoreA) || 0;
      const b = Number(g.scoreB) || 0;
      if (!g.teamA || !g.teamB || (a === 0 && b === 0)) return;
      out.push({ year: y.year, teamA: g.teamA, a, teamB: g.teamB, b, playoff: false, label: `Week ${w.weekNum}`, order: Number(w.weekNum) || 0 });
    }));
    if (y.playoffBracket) {
      const rounds = computeBracketRounds(y, y.playoffBracket);
      rounds.forEach((roundMatchups, ri) => roundMatchups.forEach((m) => {
        if (m.isByeA || m.isByeB || !m.teamA || !m.teamB || !m.teamA.name || !m.teamB.name) return;
        const a = Number(m.scoreA) || 0;
        const b = Number(m.scoreB) || 0;
        if (a === 0 && b === 0) return;
        out.push({ year: y.year, teamA: m.teamA.name, a, teamB: m.teamB.name, b, playoff: true, label: playoffRoundLabel(ri, rounds.length), order: 1000 + ri });
      }));
    }
  });
  return out;
}

// Every game between two teams, oldest first, from `team`'s side. mode as in computeHeadToHead.
function computeMatchupHistory(league, team, opponent, mode) {
  return collectPlayedGames(league)
    .filter((g) => (mode === 'regular' ? !g.playoff : mode === 'playoffs' ? g.playoff : true))
    .filter((g) => (g.teamA === team && g.teamB === opponent) || (g.teamB === team && g.teamA === opponent))
    .map((g) => {
      const own = g.teamA === team ? g.a : g.b;
      const opp = g.teamA === team ? g.b : g.a;
      return { year: g.year, label: g.label, order: g.order, playoff: g.playoff, own, opp, winner: own > opp ? team : opp > own ? opponent : null };
    })
    .sort((x, y) => x.year - y.year || x.order - y.order);
}

// One team's record against each opponent. mode: 'combined', 'regular', or 'playoffs'.
function computeHeadToHead(league, team, mode) {
  const vs = {};
  collectPlayedGames(league).forEach((g) => {
    if (mode === 'regular' && g.playoff) return;
    if (mode === 'playoffs' && !g.playoff) return;
    let own;
    let opp;
    let oppName;
    if (g.teamA === team) { own = g.a; opp = g.b; oppName = g.teamB; } else if (g.teamB === team) { own = g.b; opp = g.a; oppName = g.teamA; } else return;
    if (!vs[oppName]) vs[oppName] = { name: oppName, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
    const s = vs[oppName];
    s.pf += own;
    s.pa += opp;
    if (own > opp) s.wins += 1; else if (own < opp) s.losses += 1; else s.ties += 1;
  });
  return Object.values(vs).map((s) => {
    const gp = s.wins + s.losses + s.ties;
    return { ...s, games: gp, winPct: gp ? (s.wins + s.ties * 0.5) / gp : 0 };
  });
}

function gamesText(n) {
  return `${n} game${n === 1 ? '' : 's'}`;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// One row per season the team was in the league: regular-season record and finishes, plus how
// their playoffs went. Ranks use each season's own tiebreaker, as the Standings tab does.
function computeTeamSeasons(league, team) {
  return [...league.years].sort((a, b) => a.year - b.year).flatMap((y) => {
    const names = getYearTeamNames(y);
    if (!names.includes(team)) return [];
    const { leagueRank, divRank, statFor } = computeRanks(y, y.tiebreaker || 'points');
    let teamId = null;
    let division = null;
    y.divisions.forEach((d) => d.teams.forEach((t) => {
      if (t.name === team && !teamId) { teamId = t.id; division = d; }
    }));
    const s = statFor(team);
    const gp = s.wins + s.losses + s.ties;
    const stats = computeSeasonStats(y);

    let seed = null;
    let playoffs;
    if (!y.playoffBracket) {
      playoffs = stats.champion ? 'Missed playoffs' : 'Season in progress';
    } else {
      const rounds = computeBracketRounds(y, y.playoffBracket);
      let lostIn = null;
      rounds.forEach((matchups, ri) => matchups.forEach((m) => {
        const side = m.teamA && m.teamA.name === team ? 'A' : m.teamB && m.teamB.name === team ? 'B' : null;
        if (!side) return;
        if (seed === null) seed = (side === 'A' ? m.teamA : m.teamB).seed;
        if (m.winner && m.winner.name !== team) lostIn = playoffRoundLabel(ri, rounds.length);
      }));
      if (stats.champion === team) playoffs = 'Champion';
      else if (stats.runnerUp === team) playoffs = 'Runner-up';
      else if (lostIn) playoffs = `Lost in ${lostIn}`;
      else if (seed !== null) playoffs = 'Still alive';
      else playoffs = 'Missed playoffs';
    }
    const divTeams = division ? new Set(division.teams.map((t) => t.name).filter(Boolean)).size : 0;
    return [{
      year: y.year,
      wins: s.wins, losses: s.losses, ties: s.ties,
      winPct: gp ? (s.wins + s.ties * 0.5) / gp : 0,
      pf: s.pf, pa: s.pa,
      divName: division ? division.name : '',
      divRank: teamId ? divRank[teamId] : null, divTeams,
      leagueRank: teamId ? leagueRank[teamId] : null, leagueTeams: names.length,
      seed, playoffs,
    }];
  });
}

function TeamSeasonsTable({ seasons }) {
  const resultColor = (p) => (p === 'Champion' ? 'var(--gold)' : p === 'Runner-up' ? 'var(--turf-dark)' : p === 'Missed playoffs' ? 'var(--ink-faint)' : 'var(--ink)');
  return (
    <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px', marginBottom: 16 }}>
      <div className="fl-display" style={{ fontSize: 15, marginBottom: 2 }}>Season by season</div>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }}>
        Record, points and finishes are regular season; the last columns are the playoffs.
      </div>
      <div className="fl-scroll-x">
        <table className="fl-table" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th className="fl-th-left">Season</th>
              <th>Record</th>
              <th>Win%</th>
              <th>PF</th>
              <th>PA</th>
              <th>Division</th>
              <th>League</th>
              <th>Seed</th>
              <th className="fl-th-left">Playoffs</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((s) => (
              <tr key={s.year} style={s.playoffs === 'Champion' ? { background: 'var(--gold-bg)' } : undefined}>
                <td className="fl-display" style={{ fontSize: 14 }}>{s.year}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{`${s.wins}-${s.losses}${s.ties ? `-${s.ties}` : ''}`}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5 }}>{fmtPct(s.winPct)}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5 }}>{formatScore(s.pf)}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5 }}>{formatScore(s.pa)}</td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5 }} title={s.divName}>
                  {s.divRank ? `${ordinal(s.divRank)} of ${s.divTeams}` : '—'}
                </td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>
                  {s.leagueRank ? `${ordinal(s.leagueRank)} of ${s.leagueTeams}` : '—'}
                </td>
                <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12.5 }}>{s.seed || '—'}</td>
                <td style={{ fontSize: 12.5, fontWeight: 700, color: resultColor(s.playoffs) }}>{s.playoffs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchupHistory({ games, team, opponent }) {
  if (games.length === 0) {
    return <div style={{ fontSize: 12, color: 'var(--ink-faint)', padding: '6px 0' }}>No games in this view.</div>;
  }
  return (
    <table className="fl-table" style={{ maxWidth: 520 }}>
      <thead>
        <tr>
          <th className="fl-th-left">Season</th>
          <th className="fl-th-left">When</th>
          <th>Score</th>
          <th className="fl-th-left">Winner</th>
        </tr>
      </thead>
      <tbody>
        {games.map((g, i) => (
          <tr key={i} style={g.playoff ? { background: 'var(--gold-bg)' } : undefined}>
            <td className="fl-mono" style={{ fontSize: 12 }}>{g.year}</td>
            <td style={{ fontSize: 12 }}>{g.label}</td>
            <td className="fl-mono" style={{ textAlign: 'center', fontSize: 12 }}>
              {team} {formatScore(g.own)} – {formatScore(g.opp)} {opponent}
            </td>
            <td style={{ fontSize: 12, fontWeight: 800, color: g.winner === team ? 'var(--turf-dark)' : g.winner ? 'var(--rust)' : 'var(--ink-soft)' }}>
              {g.winner || 'Tie'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeamCareerStats({ league }) {
  const allTeams = computeAllTimeStandings(league, 'combined').map((r) => r.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
  const [selected, setSelected] = useState('');
  const [mode, setMode] = useState('combined');
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [openOpponent, setOpenOpponent] = useState(null);
  const team = selected && allTeams.includes(selected) ? selected : allTeams[0];

  if (!team) return <div className="fl-empty">No teams yet.</div>;

  const career = computeAllTimeStandings(league, mode).find((r) => r.name === team);
  const h2h = computeHeadToHead(league, team, mode);
  const seasonsPlayed = (computeAllTimeStandings(league, 'combined').find((r) => r.name === team) || { seasons: 0 }).seasons;
  const titleYears = [];
  const runnerUpYears = [];
  const playoffYears = [];
  [...league.years].sort((a, b) => a.year - b.year).forEach((y) => {
    if (computePlayoffStats(y).teams.has(team)) playoffYears.push(y.year);
    const s = computeSeasonStats(y);
    if (s.champion === team) titleYears.push(y.year);
    if (s.runnerUp === team) runnerUpYears.push(y.year);
  });
  const sortBy = (field) => setSort((cur) => (
    cur.field === field ? { field, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: field === 'name' ? 'asc' : 'desc' }
  ));
  const rows = [...h2h].sort((a, b) => {
    const cmp = sort.field === 'name' ? a.name.localeCompare(b.name) : a[sort.field] - b[sort.field];
    return (sort.dir === 'asc' ? cmp : -cmp) || a.name.localeCompare(b.name);
  });
  const stat = (label, value, color, detail) => (
    <div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>{label}</div>
      <div className="fl-mono" style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--ink)' }}>{value}</div>
      {detail && <div className="fl-mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 1 }}>{detail}</div>}
    </div>
  );
  const titles = (
    <>
      {stat('Playoff apps', playoffYears.length, undefined, playoffYears.join(', '))}
      {stat('Championships', titleYears.length, titleYears.length ? 'var(--gold)' : undefined, titleYears.join(', '))}
      {stat('Runner-ups', runnerUpYears.length, undefined, runnerUpYears.join(', '))}
    </>
  );
  const recordText = (s) => `${s.wins}-${s.losses}${s.ties ? `-${s.ties}` : ''}`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          className="fl-display fl-keep-in-view"
          value={team}
          onChange={(e) => { setSelected(e.target.value); setOpenOpponent(null); }}
          style={{ fontSize: 20, padding: '8px 12px', border: '1.5px solid var(--ink)', borderRadius: 3, background: 'var(--panel-raised)', color: 'var(--ink)', cursor: 'pointer' }}
        >
          {allTeams.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <div style={{ display: 'inline-flex', border: '1.5px solid var(--ink)', borderRadius: 3, overflow: 'hidden' }}>
          {STREAK_MODES.map(([key, label], i) => (
            <button
              key={key}
              className="fl-keep-in-view"
              onClick={() => setMode(key)}
              style={{
                border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 10px',
                background: mode === key ? 'var(--ink)' : 'transparent',
                color: mode === key ? 'var(--panel)' : 'var(--ink)',
                borderLeft: i ? '1.5px solid var(--ink)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="fl-panel fl-panel-raised" style={{ padding: '12px 16px', marginBottom: 16 }}>
        {career ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {stat('Seasons', seasonsPlayed)}
            {stat('Record', recordText(career))}
            {stat('Win%', fmtPct(career.winPct))}
            {stat('PF', formatScore(career.pf))}
            {stat('PA', formatScore(career.pa))}
            {titles}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            {stat('Seasons', seasonsPlayed)}
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', alignSelf: 'center' }}>
              {mode === 'playoffs' ? `${team} hasn't made the playoffs yet.` : `No games for ${team} yet.`}
            </div>
            {titles}
          </div>
        )}
      </div>

      <TeamSeasonsTable seasons={computeTeamSeasons(league, team)} />

      <div className="fl-panel fl-panel-raised" style={{ padding: '12px 14px' }}>
        <div className="fl-display" style={{ fontSize: 15, marginBottom: 2 }}>Record vs. each team</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }}>
          {mode === 'combined' ? 'Regular season and playoffs.' : mode === 'regular' ? 'Regular season only.' : 'Playoffs only.'}
          {' '}Click a column header to sort.
        </div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '6px 0' }}>No games in this view.</div>
        ) : (
          <div className="fl-scroll-x">
            <table className="fl-table" style={{ tableLayout: 'fixed', minWidth: 560 }}>
              <colgroup>
                <col style={{ width: 110 }} />
                <col style={{ width: 58 }} />
                <col style={{ width: 44 }} />
                <col style={{ width: 44 }} />
                <col style={{ width: 44 }} />
                <col style={{ width: 62 }} />
                <col style={{ width: 96 }} />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr>
                  {[['Opponent', 'name'], ['Games', 'games'], ['W', 'wins'], ['L', 'losses'], ['T', 'ties'], ['Win%', 'winPct'], ['PF', 'pf'], ['PA', 'pa']].map(([label, field]) => (
                    <SortableTh key={field} label={label} field={field} sortField={sort.field} sortDir={sort.dir} onSort={sortBy} alignLeft={field === 'name'} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <React.Fragment key={r.name}>
                  <tr
                    onClick={() => setOpenOpponent((cur) => (cur === r.name ? null : r.name))}
                    style={{ cursor: 'pointer', ...(openOpponent === r.name ? { background: 'var(--gold-bg)' } : {}) }}
                    title={`Show every game vs ${r.name}`}
                  >
                    <td style={{ fontSize: 13, fontWeight: 600, padding: '6px 4px' }}>
                      <span style={{ display: 'inline-block', width: 12, color: 'var(--ink-faint)', fontSize: 10 }}>{openOpponent === r.name ? '▾' : '▸'}</span>
                      {r.name}
                    </td>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{r.games}</td>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{r.wins}</td>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{r.losses}</td>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{r.ties}</td>
                    <td
                      className="fl-mono"
                      style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: r.winPct > 0.5 ? 'var(--turf-dark)' : r.winPct < 0.5 ? 'var(--rust)' : 'var(--ink-soft)' }}
                    >
                      {fmtPct(r.winPct)}
                    </td>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{formatScore(r.pf)}</td>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{formatScore(r.pa)}</td>
                  </tr>
                  {openOpponent === r.name && (
                    <tr>
                      <td colSpan={8} style={{ padding: '4px 8px 12px 22px', background: 'var(--panel)' }}>
                        <MatchupHistory games={computeMatchupHistory(league, team, r.name, mode)} team={team} opponent={r.name} />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Two-handle slider for picking a first and last season (they can be the same season).
function YearRangeSlider({ years, from, to, onChange }) {
  const last = years.length - 1;
  const fromIdx = years.indexOf(from);
  const toIdx = years.indexOf(to);
  const pct = (i) => (i / last) * 100;
  const isAll = fromIdx === 0 && toIdx === last;
  const count = toIdx - fromIdx + 1;
  return (
    <div className="fl-panel" style={{ padding: '10px 14px 6px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Seasons</span>
        <span className="fl-display" style={{ fontSize: 18 }}>{from === to ? from : `${from} – ${to}`}</span>
        <span className="fl-mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
          {isAll ? `all ${count} seasons` : `${count} season${count === 1 ? '' : 's'}`}
        </span>
        {!isAll && (
          <button className="fl-btn fl-btn-ghost fl-keep-in-view" style={{ fontSize: 10.5, marginLeft: 'auto' }} onClick={() => onChange(years[0], years[last])}>
            All seasons
          </button>
        )}
      </div>
      <div className="fl-range">
        <div className="fl-range-track" />
        <div className="fl-range-fill" style={{ left: `${pct(fromIdx)}%`, right: `${100 - pct(toIdx)}%` }} />
        {/* When both handles sit at the far right, the first-season one goes on top so it can still be dragged. */}
        <input
          type="range"
          className="fl-keep-in-view"
          aria-label="First season"
          min={0}
          max={last}
          step={1}
          value={fromIdx}
          onChange={(e) => {
            const v = Number(e.target.value);
            // Handles stacked on one season: dragging right moves the end of the range instead.
            if (v > toIdx) onChange(from, years[v]); else onChange(years[v], to);
          }}
          style={{ zIndex: fromIdx === last ? 3 : 2 }}
        />
        <input
          type="range"
          className="fl-keep-in-view"
          aria-label="Last season"
          min={0}
          max={last}
          step={1}
          value={toIdx}
          onChange={(e) => {
            const v = Number(e.target.value);
            // Handles stacked on one season: dragging left moves the start of the range instead.
            if (v < fromIdx) onChange(years[v], to); else onChange(from, years[v]);
          }}
          style={{ zIndex: 2 }}
        />
      </div>
      <div style={{ position: 'relative', height: 16 }}>
        {years.map((y, i) => (
          <span
            key={y}
            className="fl-mono"
            style={{
              position: 'absolute', left: `${pct(i)}%`, transform: 'translateX(-50%)', fontSize: 10,
              color: i >= fromIdx && i <= toIdx ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: i >= fromIdx && i <= toIdx ? 700 : 500,
            }}
          >
            {`'${String(y).slice(-2)}`}
          </span>
        ))}
      </div>
    </div>
  );
}

function CareerStatsTab({ league }) {
  const [subtab, setSubtab] = useState('standings');
  const [sortField, setSortField] = useState('winPct');
  const [sortDir, setSortDir] = useState('desc');
  const [standingsMode, setStandingsMode] = useState('combined');
  const [leagueSub, setLeagueSub] = useState('superlatives');
  // All-Time Standings season range; null means every season.
  const [yearRange, setYearRange] = useState(null);
  const seasonYears = Array.from(new Set(league.years.map((y) => y.year))).sort((a, b) => a - b);
  const fromYear = yearRange && seasonYears.includes(yearRange[0]) ? yearRange[0] : seasonYears[0];
  const toYear = yearRange && seasonYears.includes(yearRange[1]) ? yearRange[1] : seasonYears[seasonYears.length - 1];
  const leagueInRange = { ...league, years: league.years.filter((y) => y.year >= fromYear && y.year <= toYear) };
  const allTime = computeAllTimeStandings(leagueInRange, standingsMode);
  const draftStats = computeTeamDraftStats(league);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedAllTime = [...allTime].sort((a, b) => {
    let cmp;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name);
    else cmp = a[sortField] - b[sortField];
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--divider)', marginBottom: 18 }}>
        <button className={`fl-subtab${subtab === 'standings' ? ' active' : ''}`} onClick={() => setSubtab('standings')}>All-Time Standings</button>
        <button className={`fl-subtab${subtab === 'draft' ? ' active' : ''}`} onClick={() => setSubtab('draft')}>Draft Stats</button>
        <button className={`fl-subtab${subtab === 'league' ? ' active' : ''}`} onClick={() => setSubtab('league')}>League Stats</button>
        <button className={`fl-subtab${subtab === 'team' ? ' active' : ''}`} onClick={() => setSubtab('team')}>Team Stats</button>
      </div>

      {subtab === 'standings' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)' }}>Games</span>
          <div style={{ display: 'inline-flex', border: '1.5px solid var(--ink)', borderRadius: 3, overflow: 'hidden' }}>
            {[['combined', 'Regular season + playoffs'], ['regular', 'Regular season'], ['playoffs', 'Playoffs']].map(([mode, label], i) => (
              <button
                key={mode}
                className="fl-keep-in-view"
                onClick={() => setStandingsMode(mode)}
                style={{
                  border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 10px',
                  background: standingsMode === mode ? 'var(--ink)' : 'transparent',
                  color: standingsMode === mode ? 'var(--panel)' : 'var(--ink)',
                  borderLeft: i ? '1.5px solid var(--ink)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {subtab === 'standings' && seasonYears.length > 1 && (
        <YearRangeSlider
          years={seasonYears}
          from={fromYear}
          to={toYear}
          onChange={(f, t) => setYearRange(f === seasonYears[0] && t === seasonYears[seasonYears.length - 1] ? null : [f, t])}
        />
      )}

      {subtab === 'standings' && (
        allTime.length === 0 ? (
          <div className="fl-empty">{standingsMode === 'playoffs' ? 'No playoff games yet.' : 'No standings data yet.'}</div>
        ) : (
          <div className="fl-panel fl-panel-raised" style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }}>Click a column header to sort.</div>
            <div className="fl-scroll-x">
              <table className="fl-table" style={{ tableLayout: 'fixed', minWidth: 560 }}>
                <colgroup>
                  <col style={{ width: 100 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 40 }} />
                  <col style={{ width: 40 }} />
                  <col style={{ width: 40 }} />
                  <col style={{ width: 60 }} />
                  <col style={{ width: 96 }} />
                  <col style={{ width: 96 }} />
                </colgroup>
                <thead>
                  <tr>
                    <SortableTh label="Team" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} alignLeft />
                    <SortableTh label={standingsMode === 'playoffs' ? 'Playoff apps' : 'Seasons'} field="seasons" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="W" field="wins" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="L" field="losses" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="T" field="ties" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="Win%" field="winPct" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="PF" field="pf" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="PA" field="pa" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {sortedAllTime.map((r) => (
                    <tr key={r.name}>
                      <td style={{ fontSize: 13, fontWeight: 600, padding: '6px 4px' }}>{r.name}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{r.seasons}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{r.wins}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{r.losses}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{r.ties}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{fmtPct(r.winPct)}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{formatScore(r.pf)}</td>
                      <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{formatScore(r.pa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {subtab === 'draft' && (
        <div className="fl-panel fl-panel-raised" style={{ padding: '10px 14px' }}>
          <div className="fl-scroll-x">
            <table className="fl-table" style={{ tableLayout: 'fixed', minWidth: 480 }}>
              <colgroup>
                <col style={{ width: 100 }} />
                <col />
                <col style={{ width: 70 }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="fl-th-left">Team</th>
                  <th className="fl-th-left">Most drafted player(s)</th>
                  <th>Times</th>
                </tr>
              </thead>
              <tbody>
                {draftStats.map((r) => (
                  <tr key={r.teamName}>
                    <td style={{ fontSize: 13, fontWeight: 600, padding: '6px 4px' }}>{r.teamName}</td>
                    <td style={{ fontSize: 12.5, padding: '6px 4px' }}>{r.topPlayers.length ? r.topPlayers.join(', ') : '—'}</td>
                    <td className="fl-mono" style={{ textAlign: 'center', fontSize: 13 }}>{r.count || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subtab === 'league' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'inline-flex', border: '1.5px solid var(--ink)', borderRadius: 3, overflow: 'hidden' }}>
              {[['superlatives', 'Season Superlatives'], ['records', 'Record Book']].map(([key, label], i) => (
                <button
                  key={key}
                  className="fl-keep-in-view"
                  onClick={() => setLeagueSub(key)}
                  style={{
                    border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '6px 10px',
                    background: leagueSub === key ? 'var(--ink)' : 'transparent',
                    color: leagueSub === key ? 'var(--panel)' : 'var(--ink)',
                    borderLeft: i ? '1.5px solid var(--ink)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {leagueSub === 'superlatives' ? <SeasonSuperlatives league={league} /> : <AllTimeRecords league={league} />}
        </div>
      )}

      {subtab === 'team' && <TeamCareerStats league={league} />}
    </div>
  );
}

window.__fl = { parseExportHTML, generateExportHTML };

ReactDOM.createRoot(document.getElementById('root')).render(<FantasyLeagueTracker />);
