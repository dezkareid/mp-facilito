import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(fileURLToPath(import.meta.url), '..', '..');

const marketplacePath = join(rootDir, '.claude-plugin', 'marketplace.json');
const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf8'));

const pluginsDir = join(rootDir, 'plugins');
const pluginDirs = readdirSync(pluginsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => join(pluginsDir, d.name));

for (const pluginDir of pluginDirs) {
  const pkgPath = join(pluginDir, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    continue;
  }

  const { name, version } = pkg;

  const pluginJsonPath = join(pluginDir, '.claude-plugin', 'plugin.json');
  const pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf8'));
  pluginJson.version = version;
  writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2) + '\n');
  console.log(`  plugin.json  ${name}@${version}`);

  const entry = marketplace.plugins.find(p => p.name === name);
  if (entry) {
    entry.version = version;
    console.log(`  marketplace  ${name}@${version}`);
  } else {
    console.warn(`  warning: no marketplace entry found for "${name}"`);
  }
}

writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n');
console.log('Done.');
