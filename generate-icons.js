// Script to generate PNG icons from SVG
// Note: This requires Node.js with canvas and fs modules

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// Function to create a PNG from SVG
async function createPNG(size) {
  try {
    // Create a canvas with the specified size
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Load the SVG image
    const svg = fs.readFileSync('./images/icon.svg', 'utf8');
    const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    const img = await loadImage(dataUrl);
    
    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, size, size);
    
    // Write the PNG to a file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./images/icon${size}.png`, buffer);
    
    console.log(`Created icon${size}.png`);
  } catch (err) {
    console.error(`Error creating ${size}x${size} icon:`, err);
  }
}

// Generate icons of different sizes
async function generateIcons() {
  // Create the images directory if it doesn't exist
  if (!fs.existsSync('./images')) {
    fs.mkdirSync('./images');
  }
  
  // Generate icons in different sizes
  await createPNG(16);
  await createPNG(48);
  await createPNG(128);
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);

/*
NOTE: To run this script, you need to install the canvas package:
npm install canvas

Then run:
node generate-icons.js
*/ 