// Scoring Algorithm for Shape Tracer

// Tolerance zones in pixels
export const TOLERANCE = {
  GREEN: 15,   // Perfect - full points
  YELLOW: 30,  // Acceptable - partial points
  RED: 45      // Miss - no points but tracked
};

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find the nearest point on the ideal path to a given point
 * Returns { point, distance, index }
 */
export function findNearestPointOnPath(point, idealPath) {
  let minDist = Infinity;
  let nearestPoint = null;
  let nearestIndex = 0;

  for (let i = 0; i < idealPath.length; i++) {
    const dist = distance(point, idealPath[i]);
    if (dist < minDist) {
      minDist = dist;
      nearestPoint = idealPath[i];
      nearestIndex = i;
    }
  }

  return { point: nearestPoint, distance: minDist, index: nearestIndex };
}

/**
 * Calculate path coverage - how much of the ideal path was traced
 * Returns a ratio from 0 to 1
 */
export function calculatePathCoverage(drawnPoints, idealPath, tolerance = TOLERANCE.YELLOW) {
  if (drawnPoints.length < 2) return 0;

  // Track which segments of the ideal path were covered
  const covered = new Array(idealPath.length).fill(false);

  for (const drawnPoint of drawnPoints) {
    for (let i = 0; i < idealPath.length; i++) {
      if (!covered[i] && distance(drawnPoint, idealPath[i]) <= tolerance) {
        covered[i] = true;
      }
    }
  }

  const coveredCount = covered.filter(Boolean).length;
  return coveredCount / idealPath.length;
}

/**
 * Calculate smoothness of the drawn path
 * Lower jitter = smoother = better
 * Returns a bonus from 0 to 5
 */
export function calculateSmoothnessBonus(drawnPoints) {
  if (drawnPoints.length < 3) return 0;

  let totalAngleChange = 0;
  let validSegments = 0;

  for (let i = 1; i < drawnPoints.length - 1; i++) {
    const prev = drawnPoints[i - 1];
    const curr = drawnPoints[i];
    const next = drawnPoints[i + 1];

    // Calculate angle change
    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);

    let angleDiff = Math.abs(angle2 - angle1);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    totalAngleChange += angleDiff;
    validSegments++;
  }

  if (validSegments === 0) return 0;

  const avgAngleChange = totalAngleChange / validSegments;
  // Lower angle change = smoother
  // Map to 0-5 bonus (0.3 radians avg change = 0 bonus, 0 = 5 bonus)
  const smoothness = Math.max(0, 1 - avgAngleChange / 0.3);
  return Math.round(smoothness * 5);
}

/**
 * Calculate speed bonus for Speed Mode
 * Returns a bonus from 0 to 10 based on completion time
 */
export function calculateSpeedBonus(timeSeconds, expectedTime = 5) {
  if (timeSeconds <= 0) return 0;

  // If completed faster than expected time, get bonus
  // Max bonus at half expected time, no bonus at expected time
  if (timeSeconds >= expectedTime) return 0;

  const speedRatio = 1 - (timeSeconds / expectedTime);
  return Math.round(speedRatio * 10);
}

/**
 * Main scoring function
 * Returns detailed score breakdown
 */
export function calculateScore(drawnPoints, idealPath, options = {}) {
  const { mode = 'standard', timeSeconds = 0 } = options;

  // Minimum points check
  if (drawnPoints.length < 5) {
    return {
      score: 0,
      accuracy: 0,
      inZoneCount: 0,
      totalPoints: drawnPoints.length,
      coverage: 0,
      completionBonus: 0,
      smoothnessBonus: 0,
      speedBonus: 0,
      tier: 'oof',
      message: 'Not enough points drawn'
    };
  }

  // Calculate accuracy
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;

  const pointDetails = [];

  for (const point of drawnPoints) {
    const nearest = findNearestPointOnPath(point, idealPath);

    if (nearest.distance <= TOLERANCE.GREEN) {
      greenCount++;
      pointDetails.push({ ...point, zone: 'green', distance: nearest.distance });
    } else if (nearest.distance <= TOLERANCE.YELLOW) {
      yellowCount++;
      pointDetails.push({ ...point, zone: 'yellow', distance: nearest.distance });
    } else {
      redCount++;
      pointDetails.push({ ...point, zone: 'red', distance: nearest.distance });
    }
  }

  // Base accuracy: green = 100%, yellow = 50%, red = 0%
  const accuracyPoints = greenCount * 1 + yellowCount * 0.5;
  const accuracy = (accuracyPoints / drawnPoints.length) * 100;

  // Calculate coverage
  const coverage = calculatePathCoverage(drawnPoints, idealPath);

  // Completion bonus (+5% if >90% coverage)
  const completionBonus = coverage > 0.9 ? 5 : 0;

  // Smoothness bonus (0-5%)
  const smoothnessBonus = calculateSmoothnessBonus(drawnPoints);

  // Speed bonus (Speed Mode only, 0-10%)
  const speedBonus = mode === 'speed' ? calculateSpeedBonus(timeSeconds) : 0;

  // Calculate final score
  let score = accuracy + completionBonus + smoothnessBonus + speedBonus;

  // Memory mode penalty for incomplete shapes
  if (mode === 'memory' && coverage < 0.5) {
    score *= coverage * 2; // Scale down score if less than half completed
  }

  // Cap at 100
  score = Math.min(100, Math.round(score));

  // Determine tier
  let tier, message;
  if (score >= 95) {
    tier = 'perfect';
    message = 'PERFECT!';
  } else if (score >= 85) {
    tier = 'great';
    message = 'Great!';
  } else if (score >= 70) {
    tier = 'good';
    message = 'Good!';
  } else if (score >= 50) {
    tier = 'practice';
    message = 'Keep practicing!';
  } else {
    tier = 'oof';
    message = 'Oof...';
  }

  return {
    score,
    accuracy: Math.round(accuracy),
    inZoneCount: greenCount + yellowCount,
    totalPoints: drawnPoints.length,
    greenCount,
    yellowCount,
    redCount,
    coverage: Math.round(coverage * 100),
    completionBonus,
    smoothnessBonus,
    speedBonus,
    tier,
    message,
    pointDetails
  };
}

/**
 * Get score tier info for UI styling
 */
export function getScoreTierInfo(score) {
  if (score >= 95) {
    return { tier: 'perfect', label: 'PERFECT!', color: '#f9ed69' };
  } else if (score >= 85) {
    return { tier: 'great', label: 'Great!', color: '#6ef970' };
  } else if (score >= 70) {
    return { tier: 'good', label: 'Good!', color: '#08d9d6' };
  } else if (score >= 50) {
    return { tier: 'practice', label: 'Keep practicing!', color: '#8892a8' };
  } else {
    return { tier: 'oof', label: 'Oof...', color: '#ef4444' };
  }
}
