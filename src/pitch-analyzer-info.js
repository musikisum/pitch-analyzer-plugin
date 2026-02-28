import joi from 'joi';
import React from 'react';
import { TASK_MODE } from './constants.js';
import { getDefaultContent } from './default-content.js';
import PitchAnalyzerIcon from './pitch-analyzer-icon.js';
import cloneDeep from '@educandu/educandu/utils/clone-deep.js';
import { PLUGIN_GROUP } from '@educandu/educandu/domain/constants.js';
import GithubFlavoredMarkdown from '@educandu/educandu/common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '@educandu/educandu/utils/source-utils.js';

class PitchAnalyzerInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'musikisum/educandu-plugin-pitch-analyzer';

  allowsInput = true;

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('musikisum/educandu-plugin-pitch-analyzer:name');
  }

  getIcon() {
    return <PitchAnalyzerIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.other, PLUGIN_GROUP.userInput];
  }

  async resolveDisplayComponent() {
    return (await import('./pitch-analyzer-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./pitch-analyzer-editor.js')).default;
  }

  getDefaultContent() {
    return getDefaultContent();
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
