import React, { useState } from 'react';
import PcSetView from './pc-set-view.js';
import InputSection from './input-section.js';
import { useTranslation } from 'react-i18next';
import abcPcsetAdapter from './abc-pcset-adapter.js';
import AbcPlayer from '@educandu/educandu/components/abc-player.js';
import AbcNotation from '@educandu/educandu/components/abc-notation.js';
import { sectionDisplayProps } from '@educandu/educandu/ui/default-prop-types.js';

export default function PitchAnalyzerDisplay({ content }) {

  const { t } = useTranslation('educandu/pitch-analyzer');
  const [abcNotes, setAbcNotes] = useState([]);
  const [lastRenderResult, setLastRenderResult] = useState(null);

  const getFullAbcCode = () => {
    if (abcNotes.length === 0) {
      return '';
    }
    return `X:1\nL:1/1\nK:C\n${abcNotes.join('')}`;
  };

  return (
    <div className="EP_Educandu_PitchAnalyzer_Display">
      <div className={`u-horizontally-centered u-width-${content.width}`}>
        <div className="EP_Educandu_PitchAnalyzer_Display-content">
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
          <PcSetView data={abcPcsetAdapter(abcNotes)} abcNotes={abcNotes} onImport={setAbcNotes} defaultOpen={false} />
        </div>
      </div>
    </div>
  );
}

PitchAnalyzerDisplay.propTypes = {
  ...sectionDisplayProps
};
