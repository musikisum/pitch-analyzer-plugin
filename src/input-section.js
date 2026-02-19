import Piano from './piano.js';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useRef } from 'react';
import Logger from '@educandu/educandu/common/logger.js';
import { Input, Dropdown, Tooltip, Collapse } from 'antd';
import { convertMusicXmlToAbc } from '@educandu/abc-tools';
import { handleWarning } from '@educandu/educandu/ui/error-helper.js';

const { TextArea } = Input;

const logger = new Logger(import.meta.url);

export default function InputSection({ abcNotes, onNotesChange }) {
  const fileInputRef = useRef(null);
  const { t } = useTranslation('educandu/pitch-analyzer');

  const getAbcString = () => abcNotes.join('');

  const importMusicXml = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async event => {
    const { target } = event;
    const file = target.files?.[0];
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
      onNotesChange(notes);
      if (warningMessage) {
        handleWarning({ message: warningMessage, logger, t });
      }
    } catch (error) {
      handleWarning({ message: error.message, logger, t });
    }

    target.value = '';
  };

  const handleToolsItemClick = ({ key }) => {
    if (key === 'import-music-xml') {
      importMusicXml();
    }
  };

  const handleAbcCodeChange = event => {
    const value = event.target.value;
    const notes = value.match(/[_^=]?[A-Ga-g][,']*|[zZ]|[\[\]|]/g) || [];
    onNotesChange(notes);
  };

  const handlePianoKeyPress = note => {
    onNotesChange([...abcNotes, note]);
  };

  const handleDeleteFirst = () => {
    if (abcNotes.length > 0) {
      onNotesChange(abcNotes.slice(1));
    }
  };

  const handleDeleteLast = () => {
    if (abcNotes.length > 0) {
      onNotesChange(abcNotes.slice(0, -1));
    }
  };

  const toolsItems = [
    {
      key: 'import-music-xml',
      label: t('importMusicXmlLabel')
    }
  ];

  return (
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.musicxml"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        />
    </div>
  );
}

InputSection.propTypes = {
  abcNotes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onNotesChange: PropTypes.func.isRequired
};
