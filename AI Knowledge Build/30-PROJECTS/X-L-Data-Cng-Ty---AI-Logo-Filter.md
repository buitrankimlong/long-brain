---
tags: [project, x-l-data-cng-ty---ai-logo-filter]
status: hoan-thanh
started: 2026-04-20
client: Logo QA
stack: [Node.js, Sharp, File System, Image Analysis, Async/Concurrency]
updated: 2026-05-09
---

# Xử Lý Data Công Ty - AI Logo Filter

## Mo ta
Node.js script dùng Sharp để phân tích + lọc logo công ty. Kiểm tra file size, ảnh corrupt, dimension quá nhỏ, ảnh blank/1 màu, unique colors. Output: filter_report.json với quality assessment (good/low/bad). Xử lý SVG + raster formats (PNG/JPG). Concurrency=20 để xử lý nhanh.

## Stack
- Node.js
- Sharp
- File System
- Image Analysis
- Async/Concurrency

## Quyet dinh quan trong
- Dùng Sharp (libvips wrapper) cho fast image processing - File size threshold = 500 bytes (placeholder detection) - Min dimension = 32px, good = 48px - Max blank stddev = 5 (1 color detection) - Min unique colors = 10 (placeholder vs real logo) - SVG chỉ check size (không analyze pixel) - Concurrency = 20 để process nhanh

## Bai hoc rut ra
Sharp cần build native library (đã có node_modules/.bin/). Stddev < 5 = ảnh blank/1 màu. File size < 500B = placeholder 99%. Ảnh nhỏ (32-48px) = low quality, <32 = reject. SVG kho phân tích pixel nên chỉ check size. Report format JSON dễ parse lại. Concurrency 20 optimal cho logo filtering.

## Ket qua
Logo filter hoàn thành. Analyze 1000s logos → filter_report.json. Quality: good/low/bad. Move bad logos → logos_bad/. Report chi tiết: file size, dimension, stddev, unique colors.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

build_import.js:
```javascript
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const logosDir = path.join(__dirname, 'logos');

// Build a map: safeFilename(legalName) -> full file path in logos/
const logoMap = {};
if (fs.existsSync(logosDir)) {
  for (const file of fs.readdirSync(logosDir)) {
    const nameWithoutExt = file.replace(/\.[^.]+$/, '');
    logoMap[nameWithoutExt] = path.join(logosDir, file);
  }
}

const mimeMap = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function safeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 100);
}

function getLogoDataUrl(taxId) {
  const filePath = logoMap[taxId];
  if (!filePath) return null;
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = mimeMap[ext] || 'image/png';
  return `data:${mime};base64,${data.toString('base64')}`;
}

// Read all JSON files
const companies = JSON.parse(fs.readFileSync(path.join(dataDir, 'company_profiles.json'), 'utf8'));
const contacts = JSON.parse(fs.readFileSync(path.join(dataDir, 'contacts.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products_services.json'), 'utf8'));
const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf8'));
const cooperations = JSON.parse(fs.readFileSync(path.join(dataDir, 'cooperations.json'), 'utf8'));
const certificates = JSON.parse(fs.readFileSync(path.join(dataDir, 'certificates.json'), 'utf8'));
const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));

// Helper: group array by key
function groupBy(arr, key) {
  const map = {};
  for (const item of arr) {
    const k = item[key] || '_unknown_';
    if (!map[k]) map[k] = [];
    map[k].push(item);
  }
  return map;
}

// Build taxId lookup from users.json (businessName -> taxId)
const usersByBiz = groupBy(users, 'businessName');

// Filter companies: only keep those with taxId from users.json
// Deduplicate by taxId: keep first occurrence
const seenTaxIds = new Set();
const filteredCompanies = [];
let skippedNoTax = 0;
let skippedDuplicate = 0;

for (const comp of companies) {
  const bizName = comp.legalName;
  const userRaw = (usersByBiz[bizName] || [])[0] || {};
  const taxId = (userRaw.taxId || '').trim();

  if (!taxId) { skippedNoTax++; continue; }
  if (seenTaxIds.has(taxId)) { skippedDuplicate++; continue; }

  seenTaxIds.add(taxId);
  filteredCompanies.push({ comp, userRaw, taxId });
}
```
