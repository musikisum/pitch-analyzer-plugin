import { TASK_MODE } from './constants.js';
import PitchAnalyzerInfo from './pitch-analyzer-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '@educandu/educandu/common/github-flavored-markdown.js';

function makeDefaultContent() {
  return {
    width: 100,
    taskMode: TASK_MODE.none,
    taskWidth: 100,
    taskDescription: '',
    taskAbcCode: '',
    taskImage: {
      sourceUrl: '',
      copyrightNotice: ''
    },
    chordMap: null
  };
}

describe('pitch-analyzer-info', () => {
  let sut;

  beforeEach(() => {
    sut = new PitchAnalyzerInfo(new GithubFlavoredMarkdown());
  });

  // ---------------------------------------------------------------------------
  describe('getDefaultContent', () => {
    it('returns an object with all required fields', () => {
      expect(sut.getDefaultContent()).toMatchObject({
        width: 100,
        taskMode: TASK_MODE.none,
        taskWidth: 100,
        taskDescription: '',
        taskAbcCode: '',
        taskImage: { sourceUrl: '', copyrightNotice: '' }
      });
    });

    it('the returned default content passes validateContent without errors', () => {
      expect(() => sut.validateContent(sut.getDefaultContent())).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  describe('validateContent', () => {
    it('accepts valid default content', () => {
      expect(() => sut.validateContent(makeDefaultContent())).not.toThrow();
    });

    it('accepts every TASK_MODE value for taskMode', () => {
      expect(() => sut.validateContent({ ...makeDefaultContent(), taskMode: TASK_MODE.none })).not.toThrow();
      expect(() => sut.validateContent({ ...makeDefaultContent(), taskMode: TASK_MODE.abcCode })).not.toThrow();
      expect(() => sut.validateContent({ ...makeDefaultContent(), taskMode: TASK_MODE.image })).not.toThrow();
    });

    it('accepts content with additional unknown fields (schema allows unknown)', () => {
      expect(() => sut.validateContent({ ...makeDefaultContent(), extraField: 'ignored' })).not.toThrow();
    });

    it('throws a validation error – not a null exception – for null content', () => {
      expect(() => sut.validateContent(null)).toThrow();
    });

    it('does not crash for undefined content (joi silently accepts it at the top level)', () => {
      // joi.attempt(undefined, joi.object(...)) does not throw by default.
      // The important guarantee is: no null exception, no uncontrolled crash.
      expect(() => sut.validateContent()).not.toThrow();
    });

    it('throws a validation error – not a null exception – for a number', () => {
      expect(() => sut.validateContent(42)).toThrow();
    });

    it('throws a validation error – not a null exception – for a string', () => {
      expect(() => sut.validateContent('string')).toThrow();
    });

    it('throws when the required field width is missing', () => {
      const { width: _w, ...noWidth } = makeDefaultContent();
      expect(() => sut.validateContent(noWidth)).toThrow();
    });

    it('throws when width exceeds the maximum (100)', () => {
      expect(() => sut.validateContent({ ...makeDefaultContent(), width: 101 })).toThrow();
    });

    it('throws when width is below the minimum (0)', () => {
      expect(() => sut.validateContent({ ...makeDefaultContent(), width: -1 })).toThrow();
    });

    it('throws when width is a string instead of a number (no auto-conversion)', () => {
      expect(() => sut.validateContent({ ...makeDefaultContent(), width: '100' })).toThrow();
    });

    it('throws for an invalid taskMode value', () => {
      expect(() => sut.validateContent({ ...makeDefaultContent(), taskMode: 'invalid-mode' })).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  describe('cloneContent', () => {
    it('returns an equal but distinct object', () => {
      const original = makeDefaultContent();
      const cloned = sut.cloneContent(original);
      expect(cloned).toStrictEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('clones the nested taskImage object independently (deep clone)', () => {
      const original = makeDefaultContent();
      const cloned = sut.cloneContent(original);
      cloned.taskImage.sourceUrl = 'changed';
      expect(original.taskImage.sourceUrl).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  describe('redactContent', () => {
    it('redacts room-media resources from taskDescription for a different room', () => {
      const content = {
        ...makeDefaultContent(),
        taskDescription: '![img](cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/img.png)'
      };
      const result = sut.redactContent(content, 'rebhjf4MLq7yjeoCnYfn7E');
      expect(result.taskDescription).toBe('![img]()');
    });

    it('leaves room-media resources from the same room intact in taskDescription', () => {
      const content = {
        ...makeDefaultContent(),
        taskDescription: '![img](cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/img.png)'
      };
      const result = sut.redactContent(content, '63cHjt3BAhGnNxzJGrTsN1');
      expect(result.taskDescription).toContain('cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/img.png');
    });

    it('leaves non-room-media CDN resources intact regardless of target room', () => {
      const content = {
        ...makeDefaultContent(),
        taskDescription: '![img](cdn://media-library/JgTaqob5vqosBiHsZZoh1/img.png)'
      };
      const result = sut.redactContent(content, 'any-room-id');
      expect(result.taskDescription).toContain('cdn://media-library/JgTaqob5vqosBiHsZZoh1/img.png');
    });

    it('redacts room-media resources from taskImage.copyrightNotice for a different room', () => {
      const content = {
        ...makeDefaultContent(),
        taskImage: {
          sourceUrl: '',
          copyrightNotice: '![img](cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/img.png)'
        }
      };
      const result = sut.redactContent(content, 'rebhjf4MLq7yjeoCnYfn7E');
      expect(result.taskImage.copyrightNotice).toBe('![img]()');
    });

    it('clears taskImage.sourceUrl when it is not accessible from the target room', () => {
      const content = {
        ...makeDefaultContent(),
        taskImage: {
          sourceUrl: 'cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/photo.jpg',
          copyrightNotice: ''
        }
      };
      const result = sut.redactContent(content, 'rebhjf4MLq7yjeoCnYfn7E');
      expect(result.taskImage.sourceUrl).toBe('');
    });

    it('preserves taskImage.sourceUrl when it is accessible from the target room', () => {
      const content = {
        ...makeDefaultContent(),
        taskImage: {
          sourceUrl: 'cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/photo.jpg',
          copyrightNotice: ''
        }
      };
      const result = sut.redactContent(content, '63cHjt3BAhGnNxzJGrTsN1');
      expect(result.taskImage.sourceUrl).toBe('cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/photo.jpg');
    });

    it('does not mutate the original content object', () => {
      const content = {
        ...makeDefaultContent(),
        taskDescription: '![img](cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/img.png)'
      };
      sut.redactContent(content, 'rebhjf4MLq7yjeoCnYfn7E');
      expect(content.taskDescription).toContain('cdn://room-media/63cHjt3BAhGnNxzJGrTsN1/img.png');
    });

    it('does not crash when taskImage is absent from content', () => {
      const { taskImage: _ti, ...noTaskImage } = makeDefaultContent();
      expect(() => sut.redactContent(noTaskImage, 'any-room-id')).not.toThrow();
    });

    it('does not crash when taskImage is null', () => {
      const content = { ...makeDefaultContent(), taskImage: null };
      expect(() => sut.redactContent(content, 'any-room-id')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  describe('getCdnResources', () => {
    it('returns CDN resources found in taskDescription', () => {
      const content = {
        ...makeDefaultContent(),
        taskDescription: '![img](cdn://media-library/JgTaqob5vqosBiHsZZoh1/img.png)'
      };
      expect(sut.getCdnResources(content)).toContain('cdn://media-library/JgTaqob5vqosBiHsZZoh1/img.png');
    });

    it('returns CDN resources found in taskImage.copyrightNotice', () => {
      const content = {
        ...makeDefaultContent(),
        taskImage: {
          sourceUrl: '',
          copyrightNotice: '![img](cdn://room-media/roomX/pic.png)'
        }
      };
      expect(sut.getCdnResources(content)).toContain('cdn://room-media/roomX/pic.png');
    });

    it('includes taskImage.sourceUrl when it is an internal CDN resource', () => {
      const content = {
        ...makeDefaultContent(),
        taskImage: {
          sourceUrl: 'cdn://media-library/JgTaqob5vqosBiHsZZoh1/img.png',
          copyrightNotice: ''
        }
      };
      expect(sut.getCdnResources(content)).toContain('cdn://media-library/JgTaqob5vqosBiHsZZoh1/img.png');
    });

    it('does not include external https:// URLs from taskImage.sourceUrl', () => {
      const content = {
        ...makeDefaultContent(),
        taskImage: {
          sourceUrl: 'https://external.example.com/image.jpg',
          copyrightNotice: ''
        }
      };
      expect(sut.getCdnResources(content)).not.toContain('https://external.example.com/image.jpg');
    });

    it('deduplicates resources that appear in multiple fields', () => {
      const url = 'cdn://media-library/JgTaqob5vqosBiHsZZoh1/img.png';
      const content = {
        ...makeDefaultContent(),
        taskDescription: `![a](${url}) ![b](${url})`,
        taskImage: { sourceUrl: url, copyrightNotice: '' }
      };
      const result = sut.getCdnResources(content);
      expect(result.filter(r => r === url)).toHaveLength(1);
    });

    it('returns an empty array when there are no CDN resources', () => {
      expect(sut.getCdnResources(makeDefaultContent())).toStrictEqual([]);
    });

    it('never includes empty strings in the result', () => {
      const result = sut.getCdnResources(makeDefaultContent());
      expect(result.every(r => r !== '')).toBe(true);
    });

    it('does not crash when taskImage is absent from content', () => {
      const { taskImage: _ti, ...noTaskImage } = makeDefaultContent();
      expect(() => sut.getCdnResources(noTaskImage)).not.toThrow();
    });

    it('does not crash when taskImage is null', () => {
      const content = { ...makeDefaultContent(), taskImage: null };
      expect(() => sut.getCdnResources(content)).not.toThrow();
    });
  });

});
