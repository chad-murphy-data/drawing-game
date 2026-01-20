// Shape Definitions for Shape Tracer
// Each shape has: name, difficulty, and a generator function that returns points

export const DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

/**
 * Generate points along a circle
 */
function generateCircle(centerX, centerY, radius, numPoints = 100) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2; // Start from top
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  return points;
}

/**
 * Generate points along a square
 */
function generateSquare(centerX, centerY, size, numPointsPerSide = 25) {
  const points = [];
  const half = size / 2;
  const corners = [
    { x: centerX - half, y: centerY - half }, // Top-left
    { x: centerX + half, y: centerY - half }, // Top-right
    { x: centerX + half, y: centerY + half }, // Bottom-right
    { x: centerX - half, y: centerY + half }, // Bottom-left
    { x: centerX - half, y: centerY - half }  // Back to top-left
  ];

  for (let i = 0; i < corners.length - 1; i++) {
    const start = corners[i];
    const end = corners[i + 1];
    for (let j = 0; j < numPointsPerSide; j++) {
      const t = j / numPointsPerSide;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
  }
  points.push(corners[0]); // Close the shape
  return points;
}

/**
 * Generate points along a triangle
 */
function generateTriangle(centerX, centerY, size, numPointsPerSide = 33) {
  const points = [];
  const height = size * Math.sqrt(3) / 2;
  const corners = [
    { x: centerX, y: centerY - height * 2/3 },              // Top
    { x: centerX + size/2, y: centerY + height * 1/3 },     // Bottom-right
    { x: centerX - size/2, y: centerY + height * 1/3 },     // Bottom-left
    { x: centerX, y: centerY - height * 2/3 }               // Back to top
  ];

  for (let i = 0; i < corners.length - 1; i++) {
    const start = corners[i];
    const end = corners[i + 1];
    for (let j = 0; j < numPointsPerSide; j++) {
      const t = j / numPointsPerSide;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
  }
  points.push(corners[0]);
  return points;
}

/**
 * Generate points along a 5-point star
 */
function generateStar(centerX, centerY, outerRadius, innerRadius, numPoints = 100) {
  const points = [];
  const spikes = 5;
  const totalPoints = spikes * 2;
  const vertices = [];

  for (let i = 0; i < totalPoints; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / totalPoints) * Math.PI * 2 - Math.PI / 2;
    vertices.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  vertices.push(vertices[0]); // Close the shape

  const pointsPerSegment = Math.floor(numPoints / totalPoints);
  for (let i = 0; i < vertices.length - 1; i++) {
    const start = vertices[i];
    const end = vertices[i + 1];
    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
  }
  points.push(vertices[0]);
  return points;
}

/**
 * Generate points along a heart shape
 */
function generateHeart(centerX, centerY, size, numPoints = 100) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    // Heart parametric equations
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    points.push({
      x: centerX + x * (size / 32),
      y: centerY + y * (size / 32)
    });
  }
  return points;
}

/**
 * Generate points along a diamond
 */
function generateDiamond(centerX, centerY, width, height, numPointsPerSide = 25) {
  const points = [];
  const corners = [
    { x: centerX, y: centerY - height/2 },  // Top
    { x: centerX + width/2, y: centerY },    // Right
    { x: centerX, y: centerY + height/2 },   // Bottom
    { x: centerX - width/2, y: centerY },    // Left
    { x: centerX, y: centerY - height/2 }    // Back to top
  ];

  for (let i = 0; i < corners.length - 1; i++) {
    const start = corners[i];
    const end = corners[i + 1];
    for (let j = 0; j < numPointsPerSide; j++) {
      const t = j / numPointsPerSide;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
  }
  points.push(corners[0]);
  return points;
}

/**
 * Generate points along a figure-8 / infinity symbol
 */
function generateInfinity(centerX, centerY, size, numPoints = 100) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    // Lemniscate of Bernoulli (infinity shape)
    const scale = size / 2;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const denom = 1 + sinT * sinT;
    points.push({
      x: centerX + (scale * cosT) / denom,
      y: centerY + (scale * sinT * cosT) / denom
    });
  }
  return points;
}

/**
 * Generate points along a spiral
 */
function generateSpiral(centerX, centerY, maxRadius, rotations = 2.5, numPoints = 150) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const angle = t * rotations * Math.PI * 2;
    const radius = t * maxRadius;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  return points;
}

/**
 * Generate points along a lightning bolt
 */
function generateLightning(centerX, centerY, size, numPointsPerSegment = 15) {
  const points = [];
  const halfW = size * 0.3;
  const halfH = size / 2;

  const vertices = [
    { x: centerX - halfW * 0.3, y: centerY - halfH },      // Top
    { x: centerX + halfW * 0.5, y: centerY - halfH * 0.2 }, // Upper right
    { x: centerX - halfW * 0.1, y: centerY },               // Middle left
    { x: centerX + halfW * 0.3, y: centerY + halfH * 0.1 }, // Middle right
    { x: centerX - halfW * 0.4, y: centerY + halfH }        // Bottom
  ];

  for (let i = 0; i < vertices.length - 1; i++) {
    const start = vertices[i];
    const end = vertices[i + 1];
    for (let j = 0; j < numPointsPerSegment; j++) {
      const t = j / numPointsPerSegment;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
  }
  points.push(vertices[vertices.length - 1]);
  return points;
}

/**
 * Generate a straight diagonal line
 */
function generateLine(startX, startY, endX, endY, numPoints = 50) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    points.push({
      x: startX + (endX - startX) * t,
      y: startY + (endY - startY) * t
    });
  }
  return points;
}

/**
 * Generate an arrow shape
 */
function generateArrow(centerX, centerY, size, numPointsPerSegment = 20) {
  const points = [];
  const halfH = size / 2;
  const halfW = size * 0.4;
  const stemWidth = size * 0.15;

  // Arrow pointing right
  const vertices = [
    { x: centerX - halfW, y: centerY - stemWidth },       // Stem top-left
    { x: centerX, y: centerY - stemWidth },               // Before arrow top
    { x: centerX, y: centerY - halfW },                   // Arrow top
    { x: centerX + halfW, y: centerY },                   // Arrow point
    { x: centerX, y: centerY + halfW },                   // Arrow bottom
    { x: centerX, y: centerY + stemWidth },               // Before stem bottom
    { x: centerX - halfW, y: centerY + stemWidth },       // Stem bottom-left
    { x: centerX - halfW, y: centerY - stemWidth }        // Close
  ];

  for (let i = 0; i < vertices.length - 1; i++) {
    const start = vertices[i];
    const end = vertices[i + 1];
    for (let j = 0; j < numPointsPerSegment; j++) {
      const t = j / numPointsPerSegment;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
  }
  points.push(vertices[0]);
  return points;
}

/**
 * Generate a hexagon
 */
function generateHexagon(centerX, centerY, radius, numPointsPerSide = 17) {
  const points = [];
  const vertices = [];

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    vertices.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  vertices.push(vertices[0]);

  for (let i = 0; i < vertices.length - 1; i++) {
    const start = vertices[i];
    const end = vertices[i + 1];
    for (let j = 0; j < numPointsPerSide; j++) {
      const t = j / numPointsPerSide;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
  }
  points.push(vertices[0]);
  return points;
}

/**
 * Generate a crescent moon
 */
function generateMoon(centerX, centerY, size, numPoints = 80) {
  const points = [];
  const outerRadius = size / 2;
  const innerRadius = size * 0.35;
  const offset = size * 0.2;

  // Outer arc (right side of moon)
  for (let i = 0; i <= numPoints / 2; i++) {
    const t = i / (numPoints / 2);
    const angle = -Math.PI / 2 + t * Math.PI;
    points.push({
      x: centerX + Math.cos(angle) * outerRadius,
      y: centerY + Math.sin(angle) * outerRadius
    });
  }

  // Inner arc (left side, going back up)
  for (let i = numPoints / 2; i >= 0; i--) {
    const t = i / (numPoints / 2);
    const angle = -Math.PI / 2 + t * Math.PI;
    points.push({
      x: centerX + offset + Math.cos(angle) * innerRadius,
      y: centerY + Math.sin(angle) * innerRadius
    });
  }

  return points;
}

// Shape definitions with generators
export const shapes = {
  // Easy shapes
  circle: {
    id: 'circle',
    name: 'Circle',
    difficulty: DIFFICULTIES.EASY,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      const radius = canvasSize * 0.35;
      return generateCircle(center, center, radius);
    }
  },
  square: {
    id: 'square',
    name: 'Square',
    difficulty: DIFFICULTIES.EASY,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      const size = canvasSize * 0.65;
      return generateSquare(center, center, size);
    }
  },
  triangle: {
    id: 'triangle',
    name: 'Triangle',
    difficulty: DIFFICULTIES.EASY,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      const size = canvasSize * 0.7;
      return generateTriangle(center, center, size);
    }
  },
  line: {
    id: 'line',
    name: 'Line',
    difficulty: DIFFICULTIES.EASY,
    generate: (canvasSize) => {
      const margin = canvasSize * 0.15;
      return generateLine(margin, margin, canvasSize - margin, canvasSize - margin);
    }
  },

  // Medium shapes
  star: {
    id: 'star',
    name: 'Star',
    difficulty: DIFFICULTIES.MEDIUM,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      const outer = canvasSize * 0.4;
      const inner = canvasSize * 0.18;
      return generateStar(center, center, outer, inner);
    }
  },
  heart: {
    id: 'heart',
    name: 'Heart',
    difficulty: DIFFICULTIES.MEDIUM,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      const size = canvasSize * 0.7;
      return generateHeart(center, center + canvasSize * 0.05, size);
    }
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond',
    difficulty: DIFFICULTIES.MEDIUM,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      return generateDiamond(center, center, canvasSize * 0.5, canvasSize * 0.7);
    }
  },
  infinity: {
    id: 'infinity',
    name: 'Infinity',
    difficulty: DIFFICULTIES.MEDIUM,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      return generateInfinity(center, center, canvasSize * 0.7);
    }
  },
  hexagon: {
    id: 'hexagon',
    name: 'Hexagon',
    difficulty: DIFFICULTIES.MEDIUM,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      return generateHexagon(center, center, canvasSize * 0.38);
    }
  },

  // Hard shapes
  spiral: {
    id: 'spiral',
    name: 'Spiral',
    difficulty: DIFFICULTIES.HARD,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      return generateSpiral(center, center, canvasSize * 0.4, 2.5);
    }
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    difficulty: DIFFICULTIES.HARD,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      return generateLightning(center, center, canvasSize * 0.8);
    }
  },
  arrow: {
    id: 'arrow',
    name: 'Arrow',
    difficulty: DIFFICULTIES.HARD,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      return generateArrow(center, center, canvasSize * 0.7);
    }
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    difficulty: DIFFICULTIES.HARD,
    generate: (canvasSize) => {
      const center = canvasSize / 2;
      return generateMoon(center, center, canvasSize * 0.7);
    }
  }
};

/**
 * Get all shapes as an array
 */
export function getAllShapes() {
  return Object.values(shapes);
}

/**
 * Get shapes filtered by difficulty
 */
export function getShapesByDifficulty(difficulty) {
  return Object.values(shapes).filter(s => s.difficulty === difficulty);
}

/**
 * Get a shape by ID
 */
export function getShapeById(id) {
  return shapes[id] || null;
}

/**
 * Convert points array to SVG path string
 */
export function pointsToSvgPath(points) {
  if (points.length === 0) return '';

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  return path;
}
