import React, { useRef } from 'react';
import { Button, Form, message, Radio, Space, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { TASK_MODE, TASK_AUDIO_TYPE } from './constants.js';
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

const { Text } = Typography;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function PitchAnalyzerEditor({ content, onContentChanged }) {
  const { t } = useTranslation('educandu/pitch-analyzer');
  const chordMapFileRef = useRef(null);
  const {
    taskMode = TASK_MODE.none,
    taskWidth = 100,
    taskDescription = '',
    taskAbcCode = '',
    taskImage = { sourceUrl: '', copyrightNotice: '' },
    taskAudioType = TASK_AUDIO_TYPE.none,
    taskAudioSourceUrl = '',
    chordMap = null,
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

  const handleTaskAudioTypeChange = event => {
    updateContent({ taskAudioType: event.target.value });
  };

  const handleTaskAudioSourceUrlChange = value => {
    updateContent({ taskAudioSourceUrl: value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  const handleChordMapUploadClick = () => {
    chordMapFileRef.current?.click();
  };

  const handleChordMapFile = async event => {
    const { target } = event;
    const file = target.files?.[0];
    if (!file) { return; }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        updateContent({ chordMap: parsed });
      }
    } catch {
      message.error(t('importErrorMessage'));
    }
    target.value = '';
  };

  const handleChordMapClear = () => {
    updateContent({ chordMap: null });
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

        {taskMode !== TASK_MODE.none && (
        <FormItem label={t('taskAudioType')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={taskAudioType} onChange={handleTaskAudioTypeChange}>
            <RadioButton value={TASK_AUDIO_TYPE.none}>{t('taskAudioTypeNone')}</RadioButton>
            {taskMode === TASK_MODE.abcCode && (
            <RadioButton value={TASK_AUDIO_TYPE.abcPlayer}>{t('taskAudioTypeAbcPlayer')}</RadioButton>
            )}
            <RadioButton value={TASK_AUDIO_TYPE.urlAudio}>{t('taskAudioTypeUrlAudio')}</RadioButton>
          </RadioGroup>
        </FormItem>
        )}

        {taskMode !== TASK_MODE.none && taskAudioType === TASK_AUDIO_TYPE.urlAudio && (
          <FormItem label={t('taskAudioSourceUrl')} {...FORM_ITEM_LAYOUT}>
            <UrlInput
              value={taskAudioSourceUrl}
              onChange={handleTaskAudioSourceUrlChange}
              />
          </FormItem>
        )}

        <FormItem label={t('chordMapLabel')} {...FORM_ITEM_LAYOUT}>
          <Space wrap>
            <Button icon={<UploadOutlined />} onClick={handleChordMapUploadClick}>
              {t('chordMapUploadLabel')}
            </Button>
            {!!chordMap && (
              <Text type="secondary">
                {t('chordMapEntriesCount', { count: Object.keys(chordMap).length })}
              </Text>
            )}
            {!!chordMap && (
              <Button size="small" danger onClick={handleChordMapClear}>
                {t('chordMapClearLabel')}
              </Button>
            )}
          </Space>
          <input
            ref={chordMapFileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleChordMapFile}
            />
        </FormItem>

        <FormItem label={t('taskDescription')} {...FORM_ITEM_LAYOUT}>
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
