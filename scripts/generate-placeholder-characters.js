const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Character configurations
const characters = ['character1', 'character2', 'character3', 'character4'];
const states = ['working', 'home', 'break'];
const frames = [1, 2];
const colors = {
  character1: '#EF4444', // red
  character2: '#3B82F6', // blue
  character3: '#10B981', // green
  character4: '#8B5CF6', // purple
};

// Create placeholder images
characters.forEach(character => {
  states.forEach(state => {
    frames.forEach(frame => {
      const canvas = createCanvas(64, 64);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = colors[character];
      ctx.fillRect(0, 0, 64, 64);

      // Character number
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(character.slice(-1), 32, 25);

      // State indicator
      ctx.font = '16px Arial';
      const stateSymbol = {
        working: '💼',
        home: '🏠',
        break: '☕'
      }[state];
      ctx.fillText(stateSymbol, 32, 45);

      // Frame indicator (subtle animation difference)
      if (frame === 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, 0, 64, 64);
      }

      // Save the image
      const fileName = `${state}_${frame}.png`;
      const filePath = path.join(__dirname, '..', 'public', 'characters', character, fileName);
      
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(filePath, buffer);
      console.log(`Created: ${filePath}`);
    });
  });
});