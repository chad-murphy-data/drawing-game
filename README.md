# Shape Tracer

A browser-based party game where players trace over ghost shapes as accurately and quickly as possible. Perfect for team events and social gatherings.

## Quick Start

1. Open `index.html` in a modern web browser
2. Enter your name
3. Select a game mode
4. Choose a shape and start tracing!

For local development with a server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

Then open http://localhost:8000

## Game Modes

- **Standard**: Pure accuracy scoring with no time pressure
- **Speed**: Race against the clock - accuracy minus time penalty
- **Memory**: The shape disappears after 3 seconds - trace from memory!

## Shapes

### Easy
- Circle, Square, Triangle, Line

### Medium
- Star, Heart, Diamond, Infinity, Hexagon

### Hard
- Spiral, Lightning, Arrow, Moon

## Scoring

- **Green Zone** (0-15px from path): Full points
- **Yellow Zone** (15-30px): Partial points
- **Red Zone** (30+px): Miss

### Bonuses
- **Completion Bonus**: +5% for tracing >90% of the shape
- **Smoothness Bonus**: Up to +5% for consistent strokes
- **Speed Bonus**: Up to +10% in Speed Mode

### Score Tiers
- 95-100%: PERFECT!
- 85-94%: Great!
- 70-84%: Good!
- 50-69%: Keep practicing!
- Below 50%: Oof...

## Features

- Works on desktop (mouse) and mobile (touch)
- Local leaderboard with filtering
- Animated countdown and results
- Confetti celebration for high scores
- Responsive design

## Tech Stack

- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas for drawing
- CSS3 with animations
- LocalStorage for persistence

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Project Structure

```
/shape-tracer
├── index.html
├── README.md
└── src/
    ├── app.js              # Main application logic
    ├── styles.css          # All styling
    ├── shapes/
    │   ├── definitions.js  # Shape path generators
    │   └── scoring.js      # Accuracy calculations
    └── utils/
        └── storage.js      # LocalStorage wrapper
```
