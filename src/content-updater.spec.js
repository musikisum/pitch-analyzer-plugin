import version from './version.js';
import { upgradeContent } from './content-updater.js';
import { getDefaultContent } from './default-content.js';
import { describe, expect, it } from 'vitest';

const CURRENT_VERSION = version.toString();

describe('content-updater', () => {
  describe('upgradeContent', () => {

    describe('no migration needed', () => {
      it('returns the same reference when version matches', () => {
        const content = { ...getDefaultContent() };
        const result = upgradeContent(content);
        expect(result).toBe(content);
      });

      it('returns the same reference when only PATCH differs', () => {
        const content = { ...getDefaultContent(), version: `${version.MAJOR}.${version.MINOR}.999` };
        const result = upgradeContent(content);
        expect(result).toBe(content);
      });
    });

    describe('migration triggered', () => {
      it('returns a new object (not the same reference) when migration runs', () => {
        const content = { ...getDefaultContent(), version: '0.0.0' };
        const result = upgradeContent(content);
        expect(result).not.toBe(content);
      });

      it('sets version to the current version after migration', () => {
        const content = { ...getDefaultContent(), version: '0.0.0' };
        const result = upgradeContent(content);
        expect(result.version).toBe(CURRENT_VERSION);
      });

      it('triggers migration when version field is absent', () => {
        const { version: _v, ...contentWithoutVersion } = getDefaultContent();
        const result = upgradeContent(contentWithoutVersion);
        expect(result.version).toBe(CURRENT_VERSION);
      });

      it('triggers migration when version field is null', () => {
        const content = { ...getDefaultContent(), version: null };
        const result = upgradeContent(content);
        expect(result.version).toBe(CURRENT_VERSION);
      });

      it('triggers migration when MAJOR differs', () => {
        const content = { ...getDefaultContent(), version: `${version.MAJOR + 1}.${version.MINOR}.0` };
        const result = upgradeContent(content);
        expect(result.version).toBe(CURRENT_VERSION);
      });

      it('triggers migration when MINOR differs', () => {
        const content = { ...getDefaultContent(), version: `${version.MAJOR}.${version.MINOR + 1}.0` };
        const result = upgradeContent(content);
        expect(result.version).toBe(CURRENT_VERSION);
      });
    });

    describe('field handling during migration', () => {
      it('preserves existing field values from old content', () => {
        const content = { ...getDefaultContent(), version: '0.0.0', width: 42, taskDescription: 'hello' };
        const result = upgradeContent(content);
        expect(result.width).toBe(42);
        expect(result.taskDescription).toBe('hello');
      });

      it('fills missing fields with defaults', () => {
        const defaults = getDefaultContent();
        const { taskAudioType: _a, taskAudioSourceUrl: _b, parsedScore: _p, ...oldContent } = defaults;
        const content = { ...oldContent, version: '0.0.0' };
        const result = upgradeContent(content);
        expect(result.taskAudioType).toBe(defaults.taskAudioType);
        expect(result.taskAudioSourceUrl).toBe(defaults.taskAudioSourceUrl);
        expect(result.parsedScore).toBe(defaults.parsedScore);
      });

      it('drops obsolete fields that are not in the current schema', () => {
        const content = { ...getDefaultContent(), version: '0.0.0', legacyField: 'old-value' };
        const result = upgradeContent(content);
        expect('legacyField' in result).toBe(false);
      });

      it('result contains exactly the keys from getDefaultContent()', () => {
        const content = { ...getDefaultContent(), version: '0.0.0', obsolete: true };
        const result = upgradeContent(content);
        const expectedKeys = Object.keys(getDefaultContent()).sort();
        const actualKeys = Object.keys(result).sort();
        expect(actualKeys).toEqual(expectedKeys);
      });

      it('preserves a null value for a field that exists in old content', () => {
        const content = { ...getDefaultContent(), version: '0.0.0', chordMap: null };
        const result = upgradeContent(content);
        expect(result.chordMap).toBeNull();
      });

      it('preserves a non-null chordMap from old content', () => {
        const chordMap = { '037': { en: 'Major' } };
        const content = { ...getDefaultContent(), version: '0.0.0', chordMap };
        const result = upgradeContent(content);
        expect(result.chordMap).toBe(chordMap);
      });
    });

    describe('edge cases', () => {
      it('does not crash when content has no version and minimal fields', () => {
        const content = { width: 100 };
        expect(() => upgradeContent(content)).not.toThrow();
      });

      it('handles content with no fields at all', () => {
        const result = upgradeContent({});
        const defaults = getDefaultContent();
        for (const key of Object.keys(defaults)) {
          if (key !== 'version') {
            expect(result[key]).toEqual(defaults[key]);
          }
        }
        expect(result.version).toBe(CURRENT_VERSION);
      });
    });

  });
});
