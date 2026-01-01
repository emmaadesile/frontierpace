import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Function to extract colors from CSS text
function extractColorsFromCSS(cssText) {
  const colorRegex = /#([0-9A-Fa-f]{3,6})\b|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;
  const matches = cssText.match(colorRegex) || [];
  return matches.map(color => normalizeColor(color)).filter(Boolean);
}

// Function to normalize color to hex format
function normalizeColor(color) {
  color = color.trim().toLowerCase();
  
  // Handle hex colors
  if (color.startsWith('#')) {
    if (color.length === 4) {
      // Convert #rgb to #rrggbb
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    if (color.length === 7) {
      return color;
    }
    return null;
  }
  
  // Handle rgb/rgba
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0]);
      const g = parseInt(match[1]);
      const b = parseInt(match[2]);
      return rgbToHex(r, g, b);
    }
  }
  
  // Handle hsl/hsla (simplified conversion)
  if (color.startsWith('hsl')) {
    const match = color.match(/[\d.]+/g);
    if (match && match.length >= 3) {
      const h = parseFloat(match[0]);
      const s = parseFloat(match[1]) / 100;
      const l = parseFloat(match[2]) / 100;
      return hslToHex(h, s, l);
    }
  }
  
  return null;
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert HSL to Hex
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return rgbToHex(r, g, b);
}

// Calculate luminance to determine if color is light or dark
function getLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const [rLinear, gLinear, bLinear] = [r, g, b].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function isLightColor(hex) {
  return getLuminance(hex) > 0.5;
}

// Remove duplicates from array
function removeDuplicates(arr) {
  return [...new Set(arr)];
}

app.post('/api/extract-colors', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate URL
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Fetch the webpage
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch page: ${response.statusText}` });
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const colors = new Set();
    
    // Extract colors from inline styles
    $('[style]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const extracted = extractColorsFromCSS(style);
      extracted.forEach(color => colors.add(color));
    });
    
    // Extract colors from style tags
    $('style').each((_, el) => {
      const cssText = $(el).html() || '';
      const extracted = extractColorsFromCSS(cssText);
      extracted.forEach(color => colors.add(color));
    });
    
    // Extract colors from link stylesheets
    const stylesheetPromises = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const promise = (async () => {
          try {
            let stylesheetUrl = href;
            if (!href.startsWith('http')) {
              stylesheetUrl = new URL(href, url).href;
            }
            const cssResponse = await fetch(stylesheetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            if (cssResponse.ok) {
              const cssText = await cssResponse.text();
              const extracted = extractColorsFromCSS(cssText);
              extracted.forEach(color => colors.add(color));
            }
          } catch (e) {
            // Ignore errors fetching external stylesheets
          }
        })();
        stylesheetPromises.push(promise);
      }
    });
    
    // Wait for all stylesheet fetches to complete
    await Promise.all(stylesheetPromises);
    
    const colorArray = Array.from(colors).filter(Boolean);
    
    // Separate into light and dark colors
    const lightColors = [];
    const darkColors = [];
    
    colorArray.forEach(color => {
      if (isLightColor(color)) {
        lightColors.push(color);
      } else {
        darkColors.push(color);
      }
    });
    
    // Remove duplicates and sort
    const uniqueLightColors = removeDuplicates(lightColors).sort();
    const uniqueDarkColors = removeDuplicates(darkColors).sort();
    
    res.json({
      light: uniqueLightColors,
      dark: uniqueDarkColors,
      total: uniqueLightColors.length + uniqueDarkColors.length
    });
    
  } catch (error) {
    console.error('Error extracting colors:', error);
    res.status(500).json({ error: error.message || 'Failed to extract colors' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

