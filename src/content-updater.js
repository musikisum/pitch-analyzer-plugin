import version from './version.js';
import { getDefaultContent } from './default-content.js';

function parseVersion(str) {
  if (!str) { return { major: 0, minor: 0 }; }
  const parts = str.split('.').map(Number);
  return { major: parts[0] || 0, minor: parts[1] || 0 };
}

function needsMigration(contentVersion) {
  const stored = parseVersion(contentVersion);
  return stored.major !== version.MAJOR || stored.minor !== version.MINOR;
}

export function upgradeContent(content) {
  if (!needsMigration(content?.version)) {
    return content;
  }
  const defaults = getDefaultContent();
  const upgraded = {};
  for (const key of Object.keys(defaults)) {
    upgraded[key] = key in content ? content[key] : defaults[key];
  }
  upgraded.version = version.toString();
  return upgraded;
}
