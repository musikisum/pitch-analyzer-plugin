import React from 'react';
import { Form, Radio } from 'antd';
import { TASK_MODE } from './constants.js';
import { useTranslation } from 'react-i18next';
import Info from '@educandu/educandu/components/info.js';
import AbcInput from '@educandu/educandu/components/abc-input.js';
import UrlInput from '@educandu/educandu/components/url-input.js';
import MarkdownInput from '@educandu/educandu/components/markdown-input.js';
import { sectionEditorProps } from '@educandu/educandu/ui/default-prop-types.js';
import ObjectWidthSlider from '@educandu/educandu/components/object-width-slider.js';
import CopyrightNoticeEditor from '@educandu/educandu/components/copyright-notice-editor.js';
import { FORM_ITEM_LAYOUT, FORM_ITEM_LAYOUT_VERTICAL, SOURCE_TYPE } from '@educandu/educandu/domain/constants.js';
import { ensureIsExcluded } from '@educandu/educandu/utils/array-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function PitchAnalyzerEditor({ content, onContentChanged }) {
  const { t } = useTranslation('educandu/pitch-analyzer');
  const {
    taskMode = TASK_MODE.none,
    taskWidth = 100,
    taskDescription = '',
    taskAbcCode = '',
    taskImage = { sourceUrl: '', copyrightNotice: '' },
    width
  } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleTaskModeChange = event => {
    updateContent({ taskMode: event.target.value });
  };

  const handleTaskWidthChange = value => {
    updateContent({ taskWidth: value });
  };

  const handleTaskAbcCodeChange = event => {
    updateContent({ taskAbcCode: event.target.value });
  };

  const handleTaskImageSourceUrlChange = value => {
    updateContent({ taskImage: { ...taskImage, sourceUrl: value } });
  };

  const handleTaskImageCopyrightNoticeChange = value => {
    updateContent({ taskImage: { ...taskImage, copyrightNotice: value } });
  };

  const handleTaskDescriptionChange = event => {
    updateContent({ taskDescription: event.target.value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  return (
    <div className="EP_Educandu_PitchAnalyzer_Editor">
      <Form labelAlign="left">
        <FormItem label={t('taskMode')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={taskMode} onChange={handleTaskModeChange}>
            <RadioButton value={TASK_MODE.none}>{t('taskModeNone')}</RadioButton>
            <RadioButton value={TASK_MODE.abcCode}>{t('taskModeAbcCode')}</RadioButton>
            <RadioButton value={TASK_MODE.image}>{t('taskModeImage')}</RadioButton>
          </RadioGroup>
        </FormItem>

        {taskMode !== TASK_MODE.none && (
          <FormItem label={t('common:width')} {...FORM_ITEM_LAYOUT}>
            <ObjectWidthSlider value={taskWidth} onChange={handleTaskWidthChange} />
          </FormItem>
        )}

        {taskMode === TASK_MODE.abcCode && (
          <FormItem label={t('taskAbcCode')} {...FORM_ITEM_LAYOUT_VERTICAL}>
            <AbcInput
              debounced
              value={taskAbcCode}
              onChange={handleTaskAbcCodeChange}
              />
          </FormItem>
        )}

        {taskMode === TASK_MODE.image && (
          <FormItem label={t('common:url')} {...FORM_ITEM_LAYOUT}>
            <UrlInput
              value={taskImage.sourceUrl}
              onChange={handleTaskImageSourceUrlChange}
              allowedSourceTypes={ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube)}
              />
          </FormItem>
        )}

        {taskMode === TASK_MODE.image && (
          <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
            <CopyrightNoticeEditor
              debounced
              value={taskImage.copyrightNotice}
              sourceUrl={taskImage.sourceUrl}
              onChange={handleTaskImageCopyrightNoticeChange}
              />
          </FormItem>
        )}

        <FormItem label={t('taskDescription')} {...FORM_ITEM_LAYOUT_VERTICAL}>
          <MarkdownInput value={taskDescription} onChange={handleTaskDescriptionChange} renderAnchors />
        </FormItem>

        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
      </Form>
    </div>
  );
}

PitchAnalyzerEditor.propTypes = {
  ...sectionEditorProps
};
