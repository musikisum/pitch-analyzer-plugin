import React, { useState } from 'react';
import PcSetView from './pc-set-view.js';
import AnalysisLog from './analysis-log.js';
import InputSection from './input-section.js';
import { useTranslation } from 'react-i18next';
import abcPcsetAdapter from './adapter-abc-pcset.js';
import MusicXmlAnalyzer from './musicxml-analyzer.js';
import { TASK_MODE, TASK_AUDIO_TYPE } from './constants.js';
import Markdown from '@educandu/educandu/components/markdown.js';
import AbcPlayer from '@educandu/educandu/components/abc-player.js';
import AbcNotation from '@educandu/educandu/components/abc-notation.js';
import ClientConfig from '@educandu/educandu/bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '@educandu/educandu/domain/constants.js';
import CopyrightNotice from '@educandu/educandu/components/copyright-notice.js';
import { upgradeContent } from './content-updater.js';
import { useService } from '@educandu/educandu/components/container-context.js';
import { sectionDisplayProps } from '@educandu/educandu/ui/default-prop-types.js';
import MediaPlayer from '@educandu/educandu/components/media-player/media-player.js';
import { getAccessibleUrl, isInternalSourceType } from '@educandu/educandu/utils/source-utils.js';

export default function PitchAnalyzerDisplay({ content }) {

  const { t, i18n } = useTranslation('educandu/pitch-analyzer');
  const clientConfig = useService(ClientConfig);
  const upgradedContent = upgradeContent(content);
  const [abcNotes, setAbcNotes] = useState([]);
  const [lastRenderResult, setLastRenderResult] = useState(null);
  const [taskRenderResult, setTaskRenderResult] = useState(null);
  const pcSetData = abcPcsetAdapter(abcNotes);

  const {
    taskMode = TASK_MODE.none,
    taskWidth = 100,
    taskDescription = '',
    taskAbcCode = '',
    taskImage = { sourceUrl: '', copyrightNotice: '' },
    taskAudioType = TASK_AUDIO_TYPE.none,
    taskAudioSourceUrl = '',
    chordMap = null,
    parsedScore = null,
    width
  } = upgradedContent;

  const getFullAbcCode = () => {
    if (abcNotes.length === 0) {
      return '';
    }
    return `X:1\nL:1/1\nK:C\n${abcNotes.join('')}`;
  };

  const chordMatch = chordMap && pcSetData?.rahnPrimeForm ? chordMap[pcSetData.rahnPrimeForm] : null;
  const chordLang = i18n.language?.startsWith('de') ? 'de' : 'en';
  const chordLabelRaw = chordMatch?.[chordLang] ?? chordMatch?.en;
  const chordValueRaw = chordMatch?.value;
  const chordLabelText = Array.isArray(chordLabelRaw) ? chordLabelRaw.join(', ') : chordLabelRaw || null;
  const chordValueText = Array.isArray(chordValueRaw) ? chordValueRaw.join(', ') : chordValueRaw || null;

  const hasTaskContent = taskMode !== TASK_MODE.none || !!taskDescription;
  const hasDescriptionOrAudio = !!taskDescription
    || (taskAudioType === TASK_AUDIO_TYPE.abcPlayer && taskMode === TASK_MODE.abcCode)
    || (taskAudioType === TASK_AUDIO_TYPE.urlAudio && !!taskAudioSourceUrl);

  return (
    <div className="EP_Educandu_PitchAnalyzer_Display">
      <div className={`u-horizontally-centered u-width-${width}`}>
        <div className="EP_Educandu_PitchAnalyzer_Display-content">

          {!!hasTaskContent && (
            <div className={`EP_Educandu_PitchAnalyzer_Display-taskSection u-horizontally-centered u-width-${taskWidth}`}>
              {taskMode === TASK_MODE.abcCode && !!taskAbcCode && (
                <div className="EP_Educandu_PitchAnalyzer_Display-taskNotation">
                  <AbcNotation abcCode={taskAbcCode} onRender={setTaskRenderResult} />
                </div>
              )}
              {taskMode === TASK_MODE.image && !!taskImage.sourceUrl && (
                <div className="EP_Educandu_PitchAnalyzer_Display-taskImage">
                  <img
                    src={getAccessibleUrl({ url: taskImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                    alt=""
                    />
                  {!!taskImage.copyrightNotice && (
                    <CopyrightNotice value={taskImage.copyrightNotice} />
                  )}
                </div>
              )}
              {!!hasDescriptionOrAudio && (
                <div className="EP_Educandu_PitchAnalyzer_Display-taskDescriptionContainer">
                  {taskAudioType === TASK_AUDIO_TYPE.abcPlayer && taskMode === TASK_MODE.abcCode && (
                    <div className="EP_Educandu_PitchAnalyzer_Display-taskAudioPlayer">
                      <AbcPlayer renderResult={taskRenderResult} />
                    </div>
                  )}
                  {taskAudioType === TASK_AUDIO_TYPE.urlAudio && !!taskAudioSourceUrl && (
                    <div className="EP_Educandu_PitchAnalyzer_Display-taskAudioPlayer">
                      <MediaPlayer
                        sourceUrl={getAccessibleUrl({ url: taskAudioSourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                        screenMode={MEDIA_SCREEN_MODE.none}
                        allowDownload={isInternalSourceType({ url: taskAudioSourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                        allowLoop
                        allowPlaybackRate
                        />
                    </div>
                  )}
                  {!!taskDescription && (
                    <div className="EP_Educandu_PitchAnalyzer_Display-taskDescription">
                      <Markdown>{taskDescription}</Markdown>
                    </div>
                  )}
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

          {!!parsedScore && (
            <MusicXmlAnalyzer parsedScore={parsedScore} onNotesChange={setAbcNotes} />
          )}

          <div className="AbcNotation-player">
            <AbcPlayer renderResult={lastRenderResult} />
          </div>

          <PcSetView data={pcSetData} defaultOpen={false} />

          {!!chordMatch && (
            <div className="EP_Educandu_PitchAnalyzer_Display-chordMatch">
              <span className="EP_Educandu_PitchAnalyzer_Display-chordMatchLabel">
                {t('chordMatchLabel')}:
              </span>
              {!!chordLabelText && (
                <span className="EP_Educandu_PitchAnalyzer_Display-chordMatchValue">
                  {chordLabelText}
                </span>
              )}
              {!!chordValueText && (
                <span className="EP_Educandu_PitchAnalyzer_Display-chordMatchValue EP_Educandu_PitchAnalyzer_Display-chordMatchValue--secondary">
                  {chordValueText}
                </span>
              )}
            </div>
          )}

          <AnalysisLog
            pcSetData={pcSetData}
            abcNotes={abcNotes}
            onSelect={setAbcNotes}
            chordLabel={chordLabelText}
            chordValue={chordValueText}
            />
        </div>
      </div>
    </div>
  );
}

PitchAnalyzerDisplay.propTypes = {
  ...sectionDisplayProps
};
