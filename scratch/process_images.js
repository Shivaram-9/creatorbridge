const { Jimp } = require('jimp');
const path = require('path');

async function processImage(inputPath, outputPath) {
  try {
    const image = await Jimp.read(inputPath);
    
    // Convert black pixels to transparent
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If the pixel is very dark (close to black), make it transparent
      if (red < 15 && green < 15 && blue < 15) {
        this.bitmap.data[idx + 3] = 0; // Set alpha to 0
      } else {
        // Simple anti-aliasing for edges (feathering dark pixels)
        if (red < 40 && green < 40 && blue < 40) {
           this.bitmap.data[idx + 3] = Math.max(0, this.bitmap.data[idx + 3] - 150);
        }
      }
    });

    // Autocrop transparent pixels
    image.autocrop();

    await image.write(outputPath);
    console.log('Successfully processed:', outputPath);
  } catch (err) {
    console.error('Error processing', inputPath, err);
  }
}

async function run() {
  const root = path.resolve(__dirname, '..');
  
  await processImage(
    path.join(root, 'Mettalic Blue Badge for Creators.png'),
    path.join(root, 'client', 'src', 'assets', 'creator_badge.png')
  );

  await processImage(
    path.join(root, 'Mettalic Gold Badge for brands.png'),
    path.join(root, 'client', 'src', 'assets', 'brand_badge.png')
  );
}

run();
