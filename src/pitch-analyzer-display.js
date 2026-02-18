import { Input, Dropdown, Tooltip, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import Piano from './piano.js';
import AbcNotation from '@educandu/educandu/components/abc-notation.js';
import { handleWarning } from '@educandu/educandu/ui/error-helper.js';
import { convertMusicXmlToAbc } from '@educandu/abc-tools';
import { sectionDisplayProps } from '@educandu/educandu/ui/default-prop-types.js';
import Logger from '@educandu/educandu/common/logger.js';

const { TextArea } = Input;

const logger = new Logger(import.meta.url);

export default function PitchAnalyzerDisplay({ content }) {
  const fileInputRef = useRef(null);
  const { t } = useTranslation('educandu/pitch-analyzer');

  const [abcNotes, setAbcNotes] = useState([]);

  const getAbcString = () => {
    return abcNotes.join('');
  };

  const getFullAbcCode = () => {
    if (abcNotes.length === 0) {
      return '';
    }
    return `X:1\nL:1/1\nK:C\n${getAbcString()}`;
  };

  const importMusicXml = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async event => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const xmlString = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e.target.error);
        reader.readAsText(file);
      });

      const { result, warningMessage } = convertMusicXmlToAbc(xmlString);
      const notes = result.match(/[_^=]?[A-Ga-g][,']*|[zZ]|[\[\]|]/g) || [];
      setAbcNotes(notes);
      if (warningMessage) {
        handleWarning({ message: warningMessage, logger, t });
      }
    } catch (error) {
      handleWarning({ message: error.message, logger, t });
    }

    event.target.value = '';
  };

  const handleToolsItemClick = ({ key }) => {
    if (key === 'import-music-xml') {
      importMusicXml();
    }
  };

  const handleAbcCodeChange = event => {
    const value = event.target.value;
    const notes = value.match(/[_^=]?[A-Ga-g][,']*|[zZ]|[\[\]|]/g) || [];
    setAbcNotes(notes);
  };

  const handlePianoKeyPress = note => {
    setAbcNotes([...abcNotes, note]);
  };

  const handleDeleteFirst = () => {
    if (abcNotes.length > 0) {
      setAbcNotes(abcNotes.slice(1));
    }
  };

  const handleDeleteLast = () => {
    if (abcNotes.length > 0) {
      setAbcNotes(abcNotes.slice(0, -1));
    }
  };

  const toolsItems = [
    {
      key: 'import-music-xml',
      label: t('importMusicXmlLabel')
    }
  ];

  return (
    <div className="EP_Educandu_PitchAnalyzer_Display">
      <div className={`u-horizontally-centered u-width-${content.width}`}>
        <div className="EP_Educandu_PitchAnalyzer_Display-content">
          <div className="EP_Educandu_PitchAnalyzer_Display-previewSection">
            <div className="EP_Educandu_PitchAnalyzer_Display-previewContainer">
              <div className="EP_Educandu_PitchAnalyzer_Display-preview">
                <AbcNotation abcCode={getFullAbcCode()} />
              </div>
              <div className="EP_Educandu_PitchAnalyzer_Display-previewLabel">
                {t('preview')}
              </div>
            </div>
          </div>
          <div className="EP_Educandu_PitchAnalyzer_Display-inputSection">
            <Collapse
              size="small"
              items={[
                {
                  key: 'abc-input',
                  label: t('abcInputLabel'),
                  children: (
                    <div className="EP_Educandu_PitchAnalyzer_Display-inputContainer">
                      <TextArea
                        value={getAbcString()}
                        rows={6}
                        className="EP_Educandu_PitchAnalyzer_Display-textarea"
                        onChange={handleAbcCodeChange}
                        placeholder={t('abcPlaceholder')}
                        />
                      <div className="EP_Educandu_PitchAnalyzer_Display-toolsContainer">
                        <Dropdown
                          placement="topLeft"
                          trigger={['click']}
                          arrow={{ pointAtCenter: true }}
                          menu={{ items: toolsItems, onClick: handleToolsItemClick }}
                          >
                          <Tooltip title={t('toolsButtonTooltip')} placement="left">
                            <div className="EP_Educandu_PitchAnalyzer_Display-toolsButton">
                              {t('tools')}
                            </div>
                          </Tooltip>
                        </Dropdown>
                      </div>
                    </div>
                  )
                }
              ]}
              />
            <div className="EP_Educandu_PitchAnalyzer_Display-pianoContainer">
              <button
                type="button"
                className="EP_Educandu_PitchAnalyzer_Display-deleteButton"
                onClick={handleDeleteFirst}
                disabled={abcNotes.length === 0}
                >
                ←
              </button>
              <Piano onKeyPress={handlePianoKeyPress} />
              <button
                type="button"
                className="EP_Educandu_PitchAnalyzer_Display-deleteButton"
                onClick={handleDeleteLast}
                disabled={abcNotes.length === 0}
                >
                →
              </button>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,.musicxml"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          />
      </div>
    </div>
  );
}

PitchAnalyzerDisplay.propTypes = {
  ...sectionDisplayProps
};
