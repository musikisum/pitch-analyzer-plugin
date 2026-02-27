import Piano from './piano.js';
import PropTypes from 'prop-types';
import { Input, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined } from '@ant-design/icons';
import React, { useRef, useState, useEffect } from 'react';

const { TextArea } = Input;

const NOTE_BASE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitchClassOf(note) {
  const match = note.match(/^([\^_=]*)([A-Ga-g])/);
  if (!match) {
    return null;
  }
  const prefix = match[1];
  const letter = match[2].toUpperCase();
  let pc = NOTE_BASE_PC[letter];
  if (prefix === '^^') {
    pc += 2;
  } else if (prefix === '^') {
    pc += 1;
  } else if (prefix === '__') {
    pc -= 2;
  } else if (prefix === '_') {
    pc -= 1;
  }
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
    if (pc === null) {
      return true;
    }
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
      return `=${note}`;
    }
    return note;
  });
}

function processNotes(notes) {
  return applyAccidentalContext(deduplicateNotes(applyAccidentalContext(notes)));
}

const ABCREGEX = /(?:\^{1,2}|_{1,2}|=)?[A-Ga-g][,']*|[zZ]|[[\]|]/g;

export default function InputSection({ abcNotes, onNotesChange }) {

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

  const activePcs = new Set(abcNotes.map(pitchClassOf).filter(pc => pc !== null));

  const handleDeleteAll = () => {
    onNotesChange([]);
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

  const handlePianoKeyClick = (abcNote, pc) => {
    if (activePcs.has(pc)) {
      onNotesChange(processNotes(abcNotes.filter(n => pitchClassOf(n) !== pc)));
    } else {
      onNotesChange(processNotes([...abcNotes, abcNote]));
    }
  };

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
              </div>
            )
          }
        ]}
        />
      <div className="EP_Educandu_PitchAnalyzer_Display-pianoContainer">
        <Piano activePcs={activePcs} onKeyPress={handlePianoKeyClick} />
        <button
          type="button"
          aria-label={t('deleteAllLabel')}
          className="EP_Educandu_PitchAnalyzer_Display-resetButton"
          onClick={handleDeleteAll}
          disabled={abcNotes.length === 0}
          >
          <DeleteOutlined />
        </button>
      </div>
    </div>
  );
}

InputSection.propTypes = {
  abcNotes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onNotesChange: PropTypes.func.isRequired
};
