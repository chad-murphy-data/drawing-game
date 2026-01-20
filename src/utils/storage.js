// LocalStorage utilities for Shape Tracer

const STORAGE_KEY = 'shapetracer_scores';
const PLAYER_KEY = 'shapetracer_player';

/**
 * Generate a unique player ID
 */
function generatePlayerId() {
  return 'player_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Get or create player info
 */
export function getPlayer() {
  const stored = localStorage.getItem(PLAYER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing player data:', e);
    }
  }

  // Create new player
  const player = {
    id: generatePlayerId(),
    name: ''
  };
  savePlayer(player);
  return player;
}

/**
 * Save player info
 */
export function savePlayer(player) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
}

/**
 * Update player name
 */
export function updatePlayerName(name) {
  const player = getPlayer();
  player.name = name.trim();
  savePlayer(player);
  return player;
}

/**
 * Get all scores from storage
 */
export function getAllScores() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing scores:', e);
      return [];
    }
  }
  return [];
}

/**
 * Save a new score
 */
export function saveScore(scoreData) {
  const scores = getAllScores();
  const player = getPlayer();

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    playerId: player.id,
    playerName: player.name || 'Anonymous',
    shape: scoreData.shape,
    mode: scoreData.mode,
    score: scoreData.score,
    accuracy: scoreData.accuracy,
    coverage: scoreData.coverage,
    timeSeconds: scoreData.timeSeconds || null,
    timestamp: new Date().toISOString()
  };

  scores.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));

  return entry;
}

/**
 * Get leaderboard entries
 * @param {Object} options - Filter options
 * @param {string} options.view - 'today', 'alltime', or 'mine'
 * @param {string} options.shape - Shape filter ('all' or shape id)
 * @param {string} options.mode - Mode filter ('all' or mode name)
 * @param {number} options.limit - Max entries to return
 */
export function getLeaderboard(options = {}) {
  const {
    view = 'alltime',
    shape = 'all',
    mode = 'all',
    limit = 50
  } = options;

  let scores = getAllScores();
  const player = getPlayer();

  // Filter by view
  if (view === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scores = scores.filter(s => new Date(s.timestamp) >= today);
  } else if (view === 'mine') {
    scores = scores.filter(s => s.playerId === player.id);
  }

  // Filter by shape
  if (shape !== 'all') {
    scores = scores.filter(s => s.shape === shape);
  }

  // Filter by mode
  if (mode !== 'all') {
    scores = scores.filter(s => s.mode === mode);
  }

  // Sort by score (descending), then by timestamp (most recent first)
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  // Limit results
  scores = scores.slice(0, limit);

  // Add rank
  return scores.map((s, i) => ({
    ...s,
    rank: i + 1,
    isCurrentPlayer: s.playerId === player.id
  }));
}

/**
 * Get the rank of a specific score entry
 */
export function getScoreRank(scoreEntry) {
  const allScores = getAllScores()
    .filter(s => s.shape === scoreEntry.shape && s.mode === scoreEntry.mode)
    .sort((a, b) => b.score - a.score);

  const index = allScores.findIndex(s => s.id === scoreEntry.id);
  return index >= 0 ? index + 1 : null;
}

/**
 * Get best score for a specific shape/mode combination for current player
 */
export function getPersonalBest(shape, mode) {
  const player = getPlayer();
  const scores = getAllScores()
    .filter(s => s.playerId === player.id && s.shape === shape && s.mode === mode)
    .sort((a, b) => b.score - a.score);

  return scores[0] || null;
}

/**
 * Clear all scores (for testing)
 */
export function clearAllScores() {
  localStorage.removeItem(STORAGE_KEY);
}
