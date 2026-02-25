import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { Checkbox, InputNumber, Space } from 'antd';

const NOTE_BASE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitchClassOf(token) {
  const m = token.match(/^([_^=]*)([A-Ga-g])/);
  if (!m) {
    return null;
  }
  const prefix = m[1];
  const letter = m[2].toUpperCase();
  if (!(letter in NOTE_BASE_PC)) {
    return null;
  }
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

function deduplicateByPitchClass(tokens) {
  const lastIndexByPc = {};
  tokens.forEach((token, i) => {
    const pc = pitchClassOf(token);
    if (pc !== null) {
      lastIndexByPc[pc] = i;
    }
  });
  return tokens.filter((token, i) => {
    const pc = pitchClassOf(token);
    return pc === null || lastIndexByPc[pc] === i;
  });
}

export default function MusicXmlAnalyzer({ parsedScore, onNotesChange }) {
  const { t } = useTranslation('educandu/pitch-analyzer');

  const [selectedVoices, setSelectedVoices] = useState(
    () => new Set(parsedScore.voices.map(v => v.id))
  );
  const [fromMeasure, setFromMeasure] = useState(1);
  const [fromBeat, setFromBeat] = useState(1);
  const [toMeasure, setToMeasure] = useState(parsedScore.measureCount);
  const [toBeat, setToBeat] = useState(parsedScore.measures[parsedScore.measureCount - 1].mNum);

  useEffect(() => {
    const rawTokens = [];
    for (const voice of parsedScore.voices) {
      if (!selectedVoices.has(voice.id)) {
        continue; // eslint-disable-line no-continue
      }
      const vMeasures = parsedScore.voiceMeasures[voice.id];
      for (let m = fromMeasure - 1; m <= toMeasure - 1; m += 1) {
        for (const { token, beatStart } of vMeasures[m] ?? []) {
          if (m === fromMeasure - 1 && beatStart < fromBeat - 1) {
            continue; // eslint-disable-line no-continue
          }
          if (m === toMeasure - 1 && beatStart > toBeat - 1) {
            continue; // eslint-disable-line no-continue
          }
          rawTokens.push(token);
        }
      }
    }
    onNotesChange(deduplicateByPitchClass(rawTokens));
  }, [parsedScore, selectedVoices, fromMeasure, fromBeat, toMeasure, toBeat, onNotesChange]);

  const fromBeatMax = parsedScore.measures[fromMeasure - 1]?.mNum ?? 4;
  const toBeatMax = parsedScore.measures[toMeasure - 1]?.mNum ?? 4;

  const handleFromMeasureChange = v => {
    if (!v) {
      return;
    }
    const next = Math.min(v, toMeasure);
    setFromMeasure(next);
    setFromBeat(prev => Math.min(prev, parsedScore.measures[next - 1]?.mNum ?? 4));
  };

  const handleToMeasureChange = v => {
    if (!v) {
      return;
    }
    const next = Math.max(v, fromMeasure);
    setToMeasure(next);
    setToBeat(prev => Math.min(prev, parsedScore.measures[next - 1]?.mNum ?? 4));
  };

  const handleFromBeatChange = v => {
    if (v) {
      setFromBeat(Math.min(v, fromBeatMax));
    }
  };

  const handleToBeatChange = v => {
    if (v) {
      setToBeat(Math.min(v, toBeatMax));
    }
  };

  return (
    <div className="EP_Educandu_PitchAnalyzer_Display-musicXmlAnalyzer">
      <Checkbox.Group
        options={parsedScore.voices.map(v => ({ label: v.label, value: v.id }))}
        value={[...selectedVoices]}
        onChange={ids => setSelectedVoices(new Set(ids))}
        />
      <Space wrap>
        <span>{t('musicXmlAnalyzerFromLabel')}</span>
        <span>{t('musicXmlAnalyzerMeasureLabel')}</span>
        <InputNumber
          min={1}
          max={toMeasure}
          value={fromMeasure}
          onChange={handleFromMeasureChange}
          />
        <span>{t('musicXmlAnalyzerBeatLabel')}</span>
        <InputNumber
          min={1}
          max={fromBeatMax}
          value={fromBeat}
          onChange={handleFromBeatChange}
          />
        <span>{t('musicXmlAnalyzerToLabel')}</span>
        <span>{t('musicXmlAnalyzerMeasureLabel')}</span>
        <InputNumber
          min={fromMeasure}
          max={parsedScore.measureCount}
          value={toMeasure}
          onChange={handleToMeasureChange}
          />
        <span>{t('musicXmlAnalyzerBeatLabel')}</span>
        <InputNumber
          min={1}
          max={toBeatMax}
          value={toBeat}
          onChange={handleToBeatChange}
          />
      </Space>
    </div>
  );
}

MusicXmlAnalyzer.propTypes = {
  parsedScore: PropTypes.shape({
    voices: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })).isRequired,
    measureCount: PropTypes.number.isRequired,
    measures: PropTypes.arrayOf(PropTypes.shape({
      mNum: PropTypes.number.isRequired,
      mDen: PropTypes.number.isRequired
    })).isRequired,
    voiceMeasures: PropTypes.object.isRequired
  }).isRequired,
  onNotesChange: PropTypes.func.isRequired
};
