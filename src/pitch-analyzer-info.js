import joi from 'joi';
import React from 'react';
import { RadarChartOutlined } from '@ant-design/icons';
import { TASK_MODE } from './constants.js';
import cloneDeep from '@educandu/educandu/utils/clone-deep.js';
import { PLUGIN_GROUP } from '@educandu/educandu/domain/constants.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '@educandu/educandu/utils/source-utils.js';
import GithubFlavoredMarkdown from '@educandu/educandu/common/github-flavored-markdown.js';

class PitchAnalyzerInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'educandu/pitch-analyzer';

  allowsInput = true;

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('educandu/pitch-analyzer:name');
  }

  getIcon() {
    return <RadarChartOutlined />;
  }

  getGroups() {
    return [PLUGIN_GROUP.mostUsed, PLUGIN_GROUP.other];
  }

  async resolveDisplayComponent() {
    return (await import('./pitch-analyzer-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./pitch-analyzer-editor.js')).default;
  }

  getDefaultContent() {
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

  validateContent(content) {
    const schema = joi.object({
      width: joi.number().min(0).max(100).required(),
      taskMode: joi.string().valid(...Object.values(TASK_MODE)).optional(),
      taskWidth: joi.number().min(0).max(100).optional(),
      taskDescription: joi.string().allow('').optional(),
      taskAbcCode: joi.string().allow('').optional(),
      taskImage: joi.object({
        sourceUrl: joi.string().allow('').required(),
        copyrightNotice: joi.string().allow('').required()
      }).optional()
    }).unknown(true);

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.taskDescription = this.gfm.redactCdnResources(
      redactedContent.taskDescription,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (redactedContent.taskImage) {
      redactedContent.taskImage.copyrightNotice = this.gfm.redactCdnResources(
        redactedContent.taskImage.copyrightNotice,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

      if (!couldAccessUrlFromRoom(redactedContent.taskImage.sourceUrl, targetRoomId)) {
        redactedContent.taskImage.sourceUrl = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.taskDescription));
    if (content.taskImage) {
      cdnResources.push(...this.gfm.extractCdnResources(content.taskImage.copyrightNotice));

      if (isInternalSourceType({ url: content.taskImage.sourceUrl })) {
        cdnResources.push(content.taskImage.sourceUrl);
      }
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default PitchAnalyzerInfo;
