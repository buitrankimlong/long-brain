---
tags: [sharp, image-analysis, nodejs, logo-quality, file-processing]
description: Image Analysis with Sharp.js
created: 2026-05-09
moc: "[[05 Nen Tang Chatbot]]"
---

## Image Analysis with Sharp.js (Node.js)

### 1. Installation + Setup

```bash
npm install sharp
npm install color color-convert  # For color analysis
```

**Why Sharp:**
- Fast (libvips C++ backend)
- Minimal dependencies
- Async/Promise-based
- Supports PNG, JPG, GIF, WebP, SVG, TIFF

### 2. Basic Image Analysis

```javascript
const sharp = require('sharp');
const fs = require('fs');

async function analyzeImage(filePath) {
  const stats = fs.statSync(filePath);
  const result = {
    file: path.basename(filePath),
    fileSize: stats.size,
    issues: [],
    quality: 'good',
  };

  // File size check
  if (stats.size < 500) {
    result.issues.push('file_too_small');
    result.quality = 'bad';
    return result;
  }

  // Skip SVG (vector, can't analyze pixels)
  if (path.extname(filePath).toLowerCase() === '.svg') {
    return result;
  }

  // Get metadata
  try {
    const img = sharp(filePath);
    const metadata = await img.metadata();
    result.width = metadata.width;
    result.height = metadata.height;
  } catch (err) {
    result.issues.push('corrupted');
    result.quality = 'bad';
    return result;
  }

  return result;
}
```

### 3. Detect Low Quality (Dimension Check)

```javascript
const MIN_DIMENSION = 32;      // Reject < 32x32
const MIN_GOOD_DIMENSION = 48; // Good = 48x48+

if (metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION) {
  result.issues.push(`too_small_px (${metadata.width}x${metadata.height})`);
  result.quality = 'bad';
  return result;
}

if (metadata.width < MIN_GOOD_DIMENSION || metadata.height < MIN_GOOD_DIMENSION) {
  result.issues.push(`low_res (${metadata.width}x${metadata.height})`);
  result.quality = 'low';  // Warning, not rejection
}
```

### 4. Detect Blank/Placeholder Images (Color Analysis)

```javascript
const img = sharp(filePath);
const stats = await img.stats();  // Get channel statistics

// Analyze color distribution
const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) 
                  / stats.channels.length;

const MAX_BLANK_STDDEV = 5;  // Low stddev = uniform color

if (avgStdDev < MAX_BLANK_STDDEV) {
  const avgMean = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) 
                  / stats.channels.length;

  // Check if nearly white (255 = max)
  if (avgMean > 250 && avgStdDev < 2) {
    result.issues.push('blank_white');
    result.quality = 'bad';
    return result;
  }

  // Check if nearly black (0 = min)
  if (avgMean < 10 && avgStdDev < 2) {
    result.issues.push('blank_black');
    result.quality = 'bad';
    return result;
  }

  result.issues.push('low_color_variety');
  result.quality = 'low';
}
```

**stddev Interpretation:**
- stddev < 2: Solid color (blank)
- stddev 2-5: Mostly 1-2 colors (placeholder)
- stddev 5-10: Limited palette
- stddev > 10: Rich colors (quality logo)

### 5. Count Unique Colors

```javascript
// Quantize to 256 colors, then analyze histogram
const histogram = await img.stats();
// or use histogram approach:
const quantized = await sharp(filePath)
  .stats()  // Returns { channels: [{min, max, mean, stdev}] }
  .then(s => s);

// For unique color count, need different approach:
const hist = await sharp(filePath)
  .clone()
  .colourspace('srgb')
  .raw()
  .toBuffer({
    resolveWithObject: true
  });

// Count unique RGB values (expensive)
const uniqueColors = new Set();
for (let i = 0; i < hist.data.length; i += 3) {
  const color = `${hist.data[i]},${hist.data[i+1]},${hist.data[i+2]}`;
  uniqueColors.add(color);
}

const MIN_UNIQUE_COLORS = 10;
if (uniqueColors.size < MIN_UNIQUE_COLORS) {
  result.issues.push(`only_${uniqueColors.size}_colors`);
  result.quality = 'bad';
}
```

**Note:** Unique color counting is expensive - consider palette quantization instead.

### 6. Concurrent Image Processing

```javascript
const CONCURRENCY = 20;
const pLimit = require('p-limit');
const limit = pLimit(CONCURRENCY);

const files = fs.readdirSync(logoDir);
const tasks = files.map(file =>
  limit(() => analyzeImage(path.join(logoDir, file)))
);

const results = await Promise.all(tasks);
```

**Why limit concurrency:**
- sharp still uses async I/O
- 20 concurrent = good balance
- Too many = memory spike + slow

### 7. Report Generation

```javascript
const goodLogos = results.filter(r => r.quality === 'good');
const lowLogos = results.filter(r => r.quality === 'low');
const badLogos = results.filter(r => r.quality === 'bad');

const report = {
  timestamp: new Date().toISOString(),
  total: results.length,
  good: goodLogos.length,
  low: lowLogos.length,
  bad: badLogos.length,
  passRate: (goodLogos.length / results.length * 100).toFixed(2) + '%',
  issues: {
    file_too_small: results.filter(r => r.issues.includes('file_too_small')).length,
    too_small_px: results.filter(r => r.issues.find(i => i.startsWith('too_small_px'))).length,
    blank_white: results.filter(r => r.issues.includes('blank_white')).length,
    low_color_variety: results.filter(r => r.issues.includes('low_color_variety')).length,
  },
  details: results
};

fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
```

### 8. Move Bad Files

```javascript
const badDir = path.join(__dirname, 'logos_bad');
if (!fs.existsSync(badDir)) {
  fs.mkdirSync(badDir, { recursive: true });
}

for (const result of badLogos) {
  const src = path.join(logoDir, result.file);
  const dst = path.join(badDir, result.file);
  
  if (fs.existsSync(src)) {
    fs.renameSync(src, dst);
  }
}
```

## Quality Thresholds (Logo Context)

| Metric | Threshold | Interpretation |
|--------|-----------|-----------------|
| File Size | < 500 B | Placeholder |
| Dimension | < 32×32 | Corrupt/Tiny |
| Dimension | 32-48×48 | Low res (warning) |
| Dimension | > 48×48 | Good |
| stddev | < 5 | Single color (blank) |
| stddev | 5-10 | Limited palette |
| stddev | > 10 | Rich colors |
| unique colors | < 10 | Placeholder |
| unique colors | > 10 | Quality logo |

## Best Practices

1. **Check file size first:** Skip tiny files early
2. **Handle SVG separately:** Can't analyze pixels
3. **stddev < 5 = suspicious:** Likely placeholder
4. **Dimension 32×32 = reject:** Too small to render
5. **Report separately:** good/low/bad
6. **Concurrency = 20:** Balance speed + memory
7. **Move bad files:** Don't delete, move to bad/ folder
8. **JSON report format:** Easy to parse + track over time

## Gotchas

- SVG has no pixel data: Check file size only
- stddev calculation per channel: Need to average
- Unique color count expensive: Use quantization (256 colors) instead
- Corrupted PNG: Sharp throws, need try/catch
- Memory leak: Don't hold all image buffers
- Concurrency too high: OOM, capped at ~50 safe
- Windows path handling: Use path.join(), not string concat