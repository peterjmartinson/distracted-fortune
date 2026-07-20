/**
 * Printful Catalog Sync Script for Distracted Fortune (Math Mugs)
 * Usage: node scripts/sync_printful_mugs.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.argv.includes('--dry-run');
const API_KEY = process.env.PRINTFUL_API_KEY;
const MUGS_FILE_PATH = path.join(__dirname, '..', '_data', 'mugs.yml');
const DEFAULT_STORE_URL = process.env.PRINTFUL_STORE_URL || 'https://distractedfortune.printful.me';

// Simple YAML parser / serializer helper for mugs catalog
function parseMugsYaml(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const blocks = content.split(/\n(?=- id:)/g).filter(b => b.trim());
  const items = [];

  for (const block of blocks) {
    const item = {};
    const lines = block.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*(?:-\s*)?([a-zA-Z0-9_]+):\s*(.*)$/);
      if (match) {
        let key = match[1];
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        } else if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(val) && val !== '') val = Number(val);
        item[key] = val;
      }
    }
    if (item.id) items.push(item);
  }
  return items;
}

function dumpMugsYaml(items) {
  return items.map(item => {
    return `- id: ${item.id}
  title: "${(item.title || '').replace(/"/g, '\\"')}"
  tagline: "${(item.tagline || '').replace(/"/g, '\\"')}"
  price: "${item.price || '$18.00'}"
  image: "${item.image || ''}"
  url: "${item.url || DEFAULT_STORE_URL}"
  featured: ${item.featured ? 'true' : 'false'}
  active: ${item.active !== false ? 'true' : 'false'}`;
  }).join('\n\n') + '\n';
}

async function fetchPrintfulProducts(apiKey) {
  console.log('Fetching products from Printful API...');
  const res = await fetch('https://api.printful.com/store/products', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'DistractedFortune-SyncScript'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printful API responded with status ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.result || [];
}

async function main() {
  console.log(`=== Printful Sync Script ${DRY_RUN ? '(DRY RUN)' : ''} ===`);

  const existingMugs = parseMugsYaml(MUGS_FILE_PATH);
  console.log(`Loaded ${existingMugs.length} existing products from _data/mugs.yml.`);

  if (!API_KEY) {
    console.warn('\n[WARNING] PRINTFUL_API_KEY environment variable is not set.');
    if (DRY_RUN) {
      console.log('Dry run complete. Existing catalog verified:');
      console.log(dumpMugsYaml(existingMugs));
      process.exit(0);
    } else {
      console.error('ERROR: PRINTFUL_API_KEY is required for live sync.');
      process.exit(1);
    }
  }

  try {
    const printfulProducts = await fetchPrintfulProducts(API_KEY);
    console.log(`Fetched ${printfulProducts.length} items from Printful store.`);

    const existingMap = new Map(existingMugs.map(m => [String(m.id), m]));
    const updatedMugs = [];

    for (const p of printfulProducts) {
      const idStr = String(p.id);
      const existing = existingMap.get(idStr);

      const title = p.name || (existing ? existing.title : 'Math Mug');
      const image = p.thumbnail_url || (existing ? existing.image : '');
      const url = p.external_url || (existing ? existing.url : `${DEFAULT_STORE_URL}`);
      const price = existing && existing.price ? existing.price : '$18.00';
      const tagline = existing && existing.tagline ? existing.tagline : 'Premium mathematical ceramic mug.';
      const featured = existing ? Boolean(existing.featured) : false;
      const active = true;

      updatedMugs.push({
        id: p.id,
        title,
        tagline,
        price,
        image,
        url,
        featured,
        active
      });

      existingMap.delete(idStr);
    }

    // Preserve any existing items that were created manually or not returned by API
    for (const remaining of existingMap.values()) {
      updatedMugs.push(remaining);
    }

    const yamlOutput = dumpMugsYaml(updatedMugs);

    if (DRY_RUN) {
      console.log('\n--- Dry Run Output ---');
      console.log(yamlOutput);
    } else {
      fs.writeFileSync(MUGS_FILE_PATH, yamlOutput, 'utf8');
      console.log(`\nSuccessfully updated ${MUGS_FILE_PATH} with ${updatedMugs.length} mugs.`);
    }

  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
}

main();
