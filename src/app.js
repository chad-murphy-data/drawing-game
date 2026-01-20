// Shape Tracer - Main Application
import { shapes, getAllShapes, getShapeById, pointsToSvgPath } from './shapes/definitions.js';
import { calculateScore, TOLERANCE } from './shapes/scoring.js';
import { getPlayer, updatePlayerName, saveScore, getLeaderboard, getScoreRank } from './utils/storage.js';

// Game State
const state = {
  currentScreen: 'home-screen',
  selectedMode: 'standard',
  selectedShape: null,
  isDrawing: false,
  drawnPoints: [],
  idealPath: [],
  canvasSize: 0,
  startTime: null,
  elapsedTime: 0,
  timerInterval: null,
  gameStarted: false,
  memoryPhase: false,
  lastScore: null
};

// DOM Elements
const elements = {
  screens: {},
  canvas: null,
  ctx: null,
  resultsCanvas: null,
  resultsCtx: null
};

// Initialize the application
function init() {
  // Cache screen elements
  document.querySelectorAll('.screen').forEach(screen => {
    elements.screens[screen.id] = screen;
  });

  // Cache canvas
  elements.canvas = document.getElementById('game-canvas');
  elements.ctx = elements.canvas.getContext('2d');
  elements.resultsCanvas = document.getElementById('results-canvas');
  elements.resultsCtx = elements.resultsCanvas.getContext('2d');

  // Load player name
  const player = getPlayer();
  document.getElementById('player-name').value = player.name;

  // Setup event listeners
  setupEventListeners();

  // Populate shape grid
  populateShapeGrid();

  // Populate shape filter in leaderboard
  populateShapeFilter();

  // Resize canvas
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

// Setup all event listeners
function setupEventListeners() {
  // Player name input
  document.getElementById('player-name').addEventListener('change', (e) => {
    updatePlayerName(e.target.value);
  });

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedMode = btn.dataset.mode;
    });
  });

  // Play button
  document.getElementById('play-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    if (!nameInput.value.trim()) {
      nameInput.focus();
      nameInput.style.borderColor = '#ff2e63';
      setTimeout(() => nameInput.style.borderColor = '', 1000);
      return;
    }
    updatePlayerName(nameInput.value);
    navigateTo('shape-screen');
  });

  // Leaderboard button
  document.getElementById('leaderboard-btn').addEventListener('click', () => {
    navigateTo('leaderboard-screen');
    updateLeaderboard();
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (state.gameStarted && target === 'shape-screen') {
        resetGame();
      }
      navigateTo(target);
    });
  });

  // Difficulty tabs
  document.querySelectorAll('.difficulty-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.difficulty-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterShapes(btn.dataset.difficulty);
    });
  });

  // Game controls
  document.getElementById('restart-btn').addEventListener('click', restartGame);
  document.getElementById('give-up-btn').addEventListener('click', endGame);

  // Results buttons
  document.getElementById('try-again-btn').addEventListener('click', () => {
    navigateTo('game-screen');
    setTimeout(() => startGame(), 50);
  });
  document.getElementById('new-shape-btn').addEventListener('click', () => {
    navigateTo('shape-screen');
  });
  document.getElementById('results-leaderboard-btn').addEventListener('click', () => {
    navigateTo('leaderboard-screen');
    updateLeaderboard();
  });

  // Leaderboard tabs
  document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateLeaderboard();
    });
  });

  // Leaderboard filters
  document.getElementById('shape-filter').addEventListener('change', updateLeaderboard);
  document.getElementById('mode-filter').addEventListener('change', updateLeaderboard);

  // Canvas events
  setupCanvasEvents();
}

// Setup canvas drawing events
function setupCanvasEvents() {
  const canvas = elements.canvas;

  // Mouse events
  canvas.addEventListener('mousedown', handleDrawStart);
  canvas.addEventListener('mousemove', handleDrawMove);
  canvas.addEventListener('mouseup', handleDrawEnd);
  canvas.addEventListener('mouseleave', handleDrawEnd);

  // Touch events
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleDrawEnd);
  canvas.addEventListener('touchcancel', handleDrawEnd);
}

function handleDrawStart(e) {
  if (!state.gameStarted || state.memoryPhase) return;

  state.isDrawing = true;
  const pos = getCanvasPosition(e);
  state.drawnPoints = [pos];

  // Start timer for speed mode
  if (state.selectedMode === 'speed' && !state.startTime) {
    state.startTime = Date.now();
    startTimer();
  }

  drawUserPath();
}

function handleDrawMove(e) {
  if (!state.isDrawing || !state.gameStarted) return;

  const pos = getCanvasPosition(e);

  // Only add point if it's far enough from the last point (reduces noise)
  const lastPoint = state.drawnPoints[state.drawnPoints.length - 1];
  if (distance(pos, lastPoint) > 2) {
    state.drawnPoints.push(pos);
    drawUserPath();
  }
}

function handleDrawEnd() {
  if (!state.isDrawing) return;

  state.isDrawing = false;

  // If we have enough points, end the game
  if (state.drawnPoints.length >= 5) {
    endGame();
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    handleDrawStart(e.touches[0]);
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    handleDrawMove(e.touches[0]);
  }
}

function getCanvasPosition(e) {
  const rect = elements.canvas.getBoundingClientRect();
  const scaleX = elements.canvas.width / rect.width;
  const scaleY = elements.canvas.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Resize canvas to maintain square aspect ratio
function resizeCanvas() {
  const container = document.querySelector('.canvas-container');
  if (!container) return;

  // Get actual dimensions - use offsetWidth/Height as fallback
  let width = container.clientWidth || container.offsetWidth;
  let height = container.clientHeight || container.offsetHeight;

  // If still 0, try computing from parent or use default
  if (width === 0 || height === 0) {
    const rect = container.getBoundingClientRect();
    width = rect.width || 400;
    height = rect.height || 400;
  }

  const size = Math.min(width, height, 600);

  // Don't resize if size is too small (screen probably hidden)
  if (size < 100) return;

  state.canvasSize = size;

  // Set canvas dimensions
  elements.canvas.width = size;
  elements.canvas.height = size;

  // Also resize results canvas
  const resultsContainer = document.querySelector('.results-canvas-container');
  if (resultsContainer) {
    const resultsSize = Math.min(resultsContainer.clientWidth, 300);
    elements.resultsCanvas.width = resultsSize;
    elements.resultsCanvas.height = resultsSize;
  }

  // Redraw if in game
  if (state.gameStarted && state.idealPath.length > 0) {
    drawGhostShape();
    drawUserPath();
  }
}

// Navigation
function navigateTo(screenId) {
  Object.values(elements.screens).forEach(screen => {
    screen.classList.remove('active');
  });
  elements.screens[screenId].classList.add('active');
  state.currentScreen = screenId;

  // Resize canvas when game screen becomes visible
  if (screenId === 'game-screen') {
    // Use setTimeout to ensure the screen is rendered before measuring
    setTimeout(() => resizeCanvas(), 10);
  }
}

// Populate shape selection grid
function populateShapeGrid() {
  const grid = document.getElementById('shape-grid');
  const allShapes = getAllShapes();

  grid.innerHTML = allShapes.map(shape => `
    <div class="shape-card" data-shape="${shape.id}" data-difficulty="${shape.difficulty}">
      <div class="shape-preview">
        <svg viewBox="0 0 100 100">
          <path
            d="${getShapePreviewPath(shape)}"
            fill="none"
            stroke="#08d9d6"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <span class="shape-name">${shape.name}</span>
      <span class="difficulty-badge ${shape.difficulty}">${shape.difficulty}</span>
    </div>
  `).join('');

  // Add click handlers
  grid.querySelectorAll('.shape-card').forEach(card => {
    card.addEventListener('click', () => {
      state.selectedShape = card.dataset.shape;
      navigateTo('game-screen');
      // Delay startGame to ensure canvas is rendered and sized
      setTimeout(() => startGame(), 50);
    });
  });
}

// Get SVG path for shape preview (scaled to 100x100)
function getShapePreviewPath(shape) {
  const points = shape.generate(100);
  return pointsToSvgPath(points);
}

// Filter shapes by difficulty
function filterShapes(difficulty) {
  const cards = document.querySelectorAll('.shape-card');
  cards.forEach(card => {
    if (difficulty === 'all' || card.dataset.difficulty === difficulty) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

// Populate shape filter dropdown
function populateShapeFilter() {
  const select = document.getElementById('shape-filter');
  const allShapes = getAllShapes();

  select.innerHTML = '<option value="all">All Shapes</option>' +
    allShapes.map(shape => `<option value="${shape.id}">${shape.name}</option>`).join('');
}

// Start the game
function startGame() {
  resetGame();

  const shape = getShapeById(state.selectedShape);
  if (!shape) return;

  // Update UI
  document.getElementById('current-shape-name').textContent = shape.name;
  document.getElementById('current-mode-badge').textContent =
    state.selectedMode.charAt(0).toUpperCase() + state.selectedMode.slice(1);

  // Ensure canvas is properly sized before generating path
  resizeCanvas();

  // Generate ideal path (use default size if canvas still not ready)
  const pathSize = state.canvasSize || 400;
  state.idealPath = shape.generate(pathSize);

  // Show/hide timer
  const timerEl = document.getElementById('game-timer');
  if (state.selectedMode === 'speed') {
    timerEl.classList.remove('hidden');
    timerEl.textContent = '0.0s';
  } else {
    timerEl.classList.add('hidden');
  }

  // Handle different modes
  if (state.selectedMode === 'memory') {
    startMemoryMode();
  } else {
    startCountdown();
  }
}

// Start countdown before game
function startCountdown() {
  const overlay = document.getElementById('countdown-overlay');
  const numberEl = overlay.querySelector('.countdown-number');
  overlay.classList.remove('hidden');

  let count = 3;
  numberEl.textContent = count;

  // Draw ghost shape behind countdown
  drawGhostShape();

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      numberEl.textContent = count;
    } else if (count === 0) {
      numberEl.textContent = 'GO!';
      numberEl.style.color = '#6ef970';
    } else {
      clearInterval(interval);
      overlay.classList.add('hidden');
      numberEl.style.color = '';
      state.gameStarted = true;
    }
  }, 800);
}

// Start memory mode
function startMemoryMode() {
  const memoryOverlay = document.getElementById('memory-overlay');
  const timerEl = memoryOverlay.querySelector('.memory-timer');

  state.memoryPhase = true;

  // Draw the shape
  drawGhostShape();

  // Show memory overlay
  memoryOverlay.classList.remove('hidden');

  let count = 3;
  timerEl.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      timerEl.textContent = count;
    } else {
      clearInterval(interval);
      memoryOverlay.classList.add('hidden');

      // Clear canvas and start game
      clearCanvas();
      state.memoryPhase = false;
      state.gameStarted = true;
    }
  }, 1000);
}

// Reset game state
function resetGame() {
  state.isDrawing = false;
  state.drawnPoints = [];
  state.startTime = null;
  state.elapsedTime = 0;
  state.gameStarted = false;
  state.memoryPhase = false;

  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  clearCanvas();
}

// Restart current game
function restartGame() {
  startGame();
}

// Clear canvas
function clearCanvas() {
  elements.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
}

// Draw the ghost shape
function drawGhostShape(ctx = elements.ctx, canvas = elements.canvas, path = state.idealPath) {
  if (path.length < 2) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw tolerance zone (subtle)
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.strokeStyle = 'rgba(8, 217, 214, 0.1)';
  ctx.lineWidth = TOLERANCE.YELLOW * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw ghost shape (dotted line)
  ctx.beginPath();
  ctx.setLineDash([8, 8]);
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.strokeStyle = 'rgba(8, 217, 214, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw start indicator
  ctx.beginPath();
  ctx.arc(path[0].x, path[0].y, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#6ef970';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Draw user's path
function drawUserPath() {
  if (state.drawnPoints.length === 0) return;

  // Redraw ghost shape first
  if (state.selectedMode !== 'memory' || state.memoryPhase) {
    drawGhostShape();
  } else {
    clearCanvas();
  }

  const ctx = elements.ctx;

  // If only one point, draw a dot
  if (state.drawnPoints.length === 1) {
    ctx.beginPath();
    ctx.arc(state.drawnPoints[0].x, state.drawnPoints[0].y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2e63';
    ctx.fill();
    return;
  }

  // Draw user path
  ctx.beginPath();
  ctx.moveTo(state.drawnPoints[0].x, state.drawnPoints[0].y);

  for (let i = 1; i < state.drawnPoints.length; i++) {
    ctx.lineTo(state.drawnPoints[i].x, state.drawnPoints[i].y);
  }

  ctx.strokeStyle = '#ff2e63';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Start the timer
function startTimer() {
  const timerEl = document.getElementById('game-timer');
  state.timerInterval = setInterval(() => {
    state.elapsedTime = (Date.now() - state.startTime) / 1000;
    timerEl.textContent = state.elapsedTime.toFixed(1) + 's';
  }, 100);
}

// End the game and show results
function endGame() {
  state.gameStarted = false;

  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  // Calculate final time
  if (state.startTime) {
    state.elapsedTime = (Date.now() - state.startTime) / 1000;
  }

  // Calculate score
  const scoreResult = calculateScore(state.drawnPoints, state.idealPath, {
    mode: state.selectedMode,
    timeSeconds: state.elapsedTime
  });

  state.lastScore = scoreResult;

  // Save score
  const savedEntry = saveScore({
    shape: state.selectedShape,
    mode: state.selectedMode,
    score: scoreResult.score,
    accuracy: scoreResult.accuracy,
    coverage: scoreResult.coverage,
    timeSeconds: state.elapsedTime
  });

  // Get rank
  const rank = getScoreRank(savedEntry);

  // Show results
  showResults(scoreResult, rank);
}

// Show results screen
function showResults(scoreResult, rank) {
  navigateTo('results-screen');

  // Update tier label
  const tierEl = document.getElementById('score-tier');
  tierEl.textContent = scoreResult.message;
  tierEl.className = 'score-tier ' + scoreResult.tier;

  // Animate score
  animateScore(scoreResult.score);

  // Show details
  const detailsEl = document.getElementById('score-details');
  let details = `Accuracy: ${scoreResult.accuracy}% | Coverage: ${scoreResult.coverage}%`;
  if (state.selectedMode === 'speed') {
    details += ` | Time: ${state.elapsedTime.toFixed(1)}s`;
  }
  detailsEl.textContent = details;

  // Show rank
  const rankEl = document.getElementById('rank-display');
  if (rank) {
    rankEl.classList.remove('hidden');
    document.getElementById('rank-value').textContent = '#' + rank;
  } else {
    rankEl.classList.add('hidden');
  }

  // Draw comparison
  drawResultsComparison(scoreResult);

  // Show confetti for high scores
  if (scoreResult.score >= 90) {
    createConfetti();
  }
}

// Animate score counting up
function animateScore(targetScore) {
  const scoreEl = document.getElementById('score-value');
  let current = 0;
  const duration = 1000;
  const start = Date.now();

  function update() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(eased * targetScore);

    scoreEl.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  update();
}

// Draw comparison on results canvas
function drawResultsComparison(scoreResult) {
  const ctx = elements.resultsCtx;
  const canvas = elements.resultsCanvas;
  const scale = canvas.width / state.canvasSize;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Scale the paths
  const scaledIdeal = state.idealPath.map(p => ({ x: p.x * scale, y: p.y * scale }));
  const scaledDrawn = state.drawnPoints.map(p => ({ x: p.x * scale, y: p.y * scale }));

  // Draw ideal path
  if (scaledIdeal.length > 1) {
    ctx.beginPath();
    ctx.moveTo(scaledIdeal[0].x, scaledIdeal[0].y);
    for (let i = 1; i < scaledIdeal.length; i++) {
      ctx.lineTo(scaledIdeal[i].x, scaledIdeal[i].y);
    }
    ctx.strokeStyle = 'rgba(8, 217, 214, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw user path
  if (scaledDrawn.length > 1) {
    ctx.beginPath();
    ctx.moveTo(scaledDrawn[0].x, scaledDrawn[0].y);
    for (let i = 1; i < scaledDrawn.length; i++) {
      ctx.lineTo(scaledDrawn[i].x, scaledDrawn[i].y);
    }
    ctx.strokeStyle = '#ff2e63';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// Create confetti animation
function createConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';

  const colors = ['#ff2e63', '#08d9d6', '#f9ed69', '#6ef970', '#a855f7'];
  const count = 50;

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';

    // Random shapes
    if (Math.random() > 0.5) {
      confetti.style.borderRadius = '50%';
    }

    container.appendChild(confetti);
  }

  // Clean up after animation
  setTimeout(() => {
    container.innerHTML = '';
  }, 4000);
}

// Update leaderboard display
function updateLeaderboard() {
  const view = document.querySelector('.leaderboard-tabs .tab-btn.active')?.dataset.view || 'alltime';
  const shape = document.getElementById('shape-filter').value;
  const mode = document.getElementById('mode-filter').value;

  const entries = getLeaderboard({ view, shape, mode });

  const listEl = document.getElementById('leaderboard-list');

  if (entries.length === 0) {
    listEl.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first!</div>';
    return;
  }

  listEl.innerHTML = entries.map((entry, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const highlight = entry.isCurrentPlayer ? 'highlight' : '';
    const shape = getShapeById(entry.shape);
    const time = entry.timeSeconds ? ` • ${entry.timeSeconds.toFixed(1)}s` : '';

    return `
      <div class="leaderboard-entry ${highlight}" style="animation-delay: ${i * 0.05}s">
        <span class="entry-rank ${rankClass}">#${entry.rank}</span>
        <div class="entry-info">
          <div class="entry-name">${escapeHtml(entry.playerName)}</div>
          <div class="entry-meta">${shape?.name || entry.shape} • ${entry.mode}${time}</div>
        </div>
        <span class="entry-score">${entry.score}%</span>
      </div>
    `;
  }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
