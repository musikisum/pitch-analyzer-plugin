import Piano from './piano.js';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Logger from '@educandu/educandu/common/logger.js';
import { Input, Dropdown, Tooltip, Collapse } from 'antd';
import { convertMusicXmlToAbc } from '@educandu/abc-tools';
import React, { useRef, useState, useEffect } from 'react';
import { handleWarning } from '@educandu/educandu/ui/error-helper.js';

const { TextArea } = Input;

const logger = new Logger(import.meta.url);

const NOTE_BASE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitchClassOf(note) {
  const match = note.match(/^([\^_=]*)([A-Ga-g])/);
  if (!match) {
    return null;
  }
  const prefix = match[1];
  const letter = match[2].toUpperCase();
  let pc = NOTE_BASE_PC[letter];
  if (prefix === '^^') {pc += 2;} else if (prefix === '^') {pc += 1;} else if (prefix === '__') {pc -= 2;} else if (prefix === '_') {pc -= 1;}
  return ((pc % 12) + 12) % 12;
}

function deduplicateNotes(notes) {
  const lastIndexByPc = {};
  notes.forEach((note, i) => {
    const pc = pitchClassOf(note);
    if (pc !== null) {
      lastIndexByPc[pc] = i;
    }
  });
  return notes.filter((note, i) => {
    const pc = pitchClassOf(note);
    if (pc === null) {return true;}
    return lastIndexByPc[pc] === i;
  });
}

function applyAccidentalContext(notes) {
  const accidentalActive = {};
  return notes.map(note => {
    if (!/^[\^_=]?[A-Ga-g]/.test(note)) {
      return note;
    }
    const hasAccidental = note.startsWith('^') || note.startsWith('_');
    const hasNatural = note.startsWith('=');
    const stripped = note.replace(/^[\^_=]+/, '');
    const pitchLetter = stripped[0].toUpperCase();

    if (hasAccidental) {
      accidentalActive[pitchLetter] = true;
      return note;
    }
    if (hasNatural) {
      const wasActive = !!accidentalActive[pitchLetter];
      accidentalActive[pitchLetter] = false;
      return wasActive ? note : stripped;
    }
    if (accidentalActive[pitchLetter]) {
      accidentalActive[pitchLetter] = false;
      return `=${  note}`;
    }
    return note;
  });
}

function processNotes(notes) {
  return applyAccidentalContext(deduplicateNotes(applyAccidentalContext(notes)));
}

export default function InputSection({ abcNotes, onNotesChange }) {

  const ABCREGEX = /(?:\^{1,2}|_{1,2}|=)?[A-Ga-g][,']*|[zZ]|[\[\]|]/g;
  
  const fileInputRef = useRef(null);
  const lastNotesFromTypingRef = useRef(null);
  const { t } = useTranslation('educandu/pitch-analyzer');
  const [inputText, setInputText] = useState(() => abcNotes.join(' '));

  useEffect(() => {
    if (lastNotesFromTypingRef.current === abcNotes) {
      lastNotesFromTypingRef.current = null;
    } else {
      setInputText(abcNotes.join(' '));
    }
  }, [abcNotes]);

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
      const notes = processNotes(result.match(ABCREGEX) || []);
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
    setInputText(value);
    const rawNotes = value.match(ABCREGEX) || [];
    const notes = processNotes(rawNotes);
    const hasTransformation = rawNotes.length !== notes.length || rawNotes.some((note, i) => note !== notes[i]);
    lastNotesFromTypingRef.current = hasTransformation ? null : notes;
    onNotesChange(notes);
  };

  const handlePianoKeyPress = note => {
    onNotesChange(processNotes([...abcNotes, note]));
  };

  const handleDeleteFirst = () => {
    if (abcNotes.length > 0) {
      onNotesChange(processNotes(abcNotes.slice(1)));
    }
  };

  const handleDeleteLast = () => {
    if (abcNotes.length > 0) {
      onNotesChange(processNotes(abcNotes.slice(0, -1)));
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
                  value={inputText}
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
