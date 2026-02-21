import React, { useState } from 'react';
import PcSetView from './pc-set-view.js';
import AnalysisLog from './analysis-log.js';
import InputSection from './input-section.js';
import { TASK_MODE } from './constants.js';
import { useTranslation } from 'react-i18next';
import abcPcsetAdapter from './adapter-abc-pcset.js';
import Markdown from '@educandu/educandu/components/markdown.js';
import AbcPlayer from '@educandu/educandu/components/abc-player.js';
import AbcNotation from '@educandu/educandu/components/abc-notation.js';
import ClientConfig from '@educandu/educandu/bootstrap/client-config.js';
import CopyrightNotice from '@educandu/educandu/components/copyright-notice.js';
import { useService } from '@educandu/educandu/components/container-context.js';
import { getAccessibleUrl } from '@educandu/educandu/utils/source-utils.js';
import { sectionDisplayProps } from '@educandu/educandu/ui/default-prop-types.js';

export default function PitchAnalyzerDisplay({ content }) {

  const { t } = useTranslation('educandu/pitch-analyzer');
  const clientConfig = useService(ClientConfig);
  const [abcNotes, setAbcNotes] = useState([]);
  const [lastRenderResult, setLastRenderResult] = useState(null);
  const pcSetData = abcPcsetAdapter(abcNotes);

  const {
    taskMode = TASK_MODE.none,
    taskWidth = 100,
    taskDescription = '',
    taskAbcCode = '',
    taskImage = { sourceUrl: '', copyrightNotice: '' },
    width
  } = content;

  const getFullAbcCode = () => {
    if (abcNotes.length === 0) {
      return '';
    }
    return `X:1\nL:1/1\nK:C\n${abcNotes.join('')}`;
  };

  const hasTaskContent = taskMode !== TASK_MODE.none || !!taskDescription;

  return (
    <div className="EP_Educandu_PitchAnalyzer_Display">
      <div className={`u-horizontally-centered u-width-${width}`}>
        <div className="EP_Educandu_PitchAnalyzer_Display-content">

          {hasTaskContent && (
            <div className={`EP_Educandu_PitchAnalyzer_Display-taskSection u-horizontally-centered u-width-${taskWidth}`}>
              {taskMode === TASK_MODE.abcCode && taskAbcCode && (
                <div className="EP_Educandu_PitchAnalyzer_Display-taskNotation">
                  <AbcNotation abcCode={taskAbcCode} />
                </div>
              )}
              {taskMode === TASK_MODE.image && taskImage.sourceUrl && (
                <div className="EP_Educandu_PitchAnalyzer_Display-taskImage">
                  <img
                    src={getAccessibleUrl({ url: taskImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                    alt=""
                    />
                  {taskImage.copyrightNotice && (
                    <CopyrightNotice value={taskImage.copyrightNotice} />
                  )}
                </div>
              )}
              {taskDescription && (
                <div className="EP_Educandu_PitchAnalyzer_Display-taskDescription">
                  <Markdown>{taskDescription}</Markdown>
                </div>
              )}
            </div>
          )}

          <div className="EP_Educandu_PitchAnalyzer_Display-previewSection">
            <div className="EP_Educandu_PitchAnalyzer_Display-previewContainer">
              <div className="EP_Educandu_PitchAnalyzer_Display-preview">
                <AbcNotation abcCode={getFullAbcCode()} onRender={setLastRenderResult} />
              </div>
              <div className="EP_Educandu_PitchAnalyzer_Display-previewLabel">
                {t('preview')}
              </div>
            </div>
          </div>

          <InputSection abcNotes={abcNotes} onNotesChange={setAbcNotes} />

          <div className="AbcNotation-player">
            <AbcPlayer renderResult={lastRenderResult} />
          </div>

          <PcSetView data={pcSetData} abcNotes={abcNotes} defaultOpen={false} />

          <AnalysisLog pcSetData={pcSetData} abcNotes={abcNotes} onSelect={setAbcNotes} />
        </div>
      </div>
    </div>
  );
}

PitchAnalyzerDisplay.propTypes = {
  ...sectionDisplayProps
};
