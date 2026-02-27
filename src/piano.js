import React, { useState } from 'react';
import PropTypes from 'prop-types';

const WHITE_KEYS = [
  { note: 'C', label: 'C', abcCode: 'C', pc: 0 },
  { note: 'D', label: 'D', abcCode: 'D', pc: 2 },
  { note: 'E', label: 'E', abcCode: 'E', pc: 4 },
  { note: 'F', label: 'F', abcCode: 'F', pc: 5 },
  { note: 'G', label: 'G', abcCode: 'G', pc: 7 },
  { note: 'A', label: 'A', abcCode: 'A', pc: 9 },
  { note: 'B', label: 'B', abcCode: 'B', pc: 11 }
];

const BLACK_KEYS = [
  { left: '9.8%', sharpLabel: '^C', flatLabel: '_D', pc: 1 },
  { left: '24.1%', sharpLabel: '^D', flatLabel: '_E', pc: 3 },
  { left: '52.6%', sharpLabel: '^F', flatLabel: '_G', pc: 6 },
  { left: '66.9%', sharpLabel: '^G', flatLabel: '_A', pc: 8 },
  { left: '81.2%', sharpLabel: '^A', flatLabel: '_B', pc: 10 }
];

const STYLE_WHITE_HOVER_ADD    = { background: 'linear-gradient(to bottom, #e8f5e9 0%, #c8e6c9 100%)' };
const STYLE_WHITE_HOVER_REMOVE = { background: 'linear-gradient(to bottom, #ffcdd2 0%, #ef9a9a 100%)', borderColor: '#ef9a9a' };
const STYLE_BLACK_HOVER_ADD    = { background: 'linear-gradient(to bottom, #2e7d32 0%, #1b5e20 100%)' };
const STYLE_BLACK_HOVER_REMOVE = { background: 'linear-gradient(to bottom, #c62828 0%, #b71c1c 100%)' };

export default function Piano({ activePcs, onKeyPress }) {
  const [hoveredPc, setHoveredPc] = useState(null);

  const whiteKeyStyle = pc => {
    if (hoveredPc !== pc) { return {}; }
    return activePcs.has(pc) ? STYLE_WHITE_HOVER_REMOVE : STYLE_WHITE_HOVER_ADD;
  };

  const blackKeyStyle = pc => {
    if (hoveredPc !== pc) { return {}; }
    return activePcs.has(pc) ? STYLE_BLACK_HOVER_REMOVE : STYLE_BLACK_HOVER_ADD;
  };

  return (
    <div className="EP_Educandu_Piano">
      <div className="EP_Educandu_Piano-keyboard">
        {WHITE_KEYS.map(key => (
          <button
            key={key.note}
            type="button"
            className="EP_Educandu_Piano-whiteKey"
            style={whiteKeyStyle(key.pc)}
            onMouseEnter={() => setHoveredPc(key.pc)}
            onMouseLeave={() => setHoveredPc(null)}
            onClick={() => onKeyPress(key.abcCode, key.pc)}
            >
            <span className="EP_Educandu_Piano-keyLabel">{key.label}</span>
          </button>
        ))}
        <div className="EP_Educandu_Piano-blackKeys">
          {BLACK_KEYS.map(key => (
            <div
              key={key.left}
              className="EP_Educandu_Piano-blackKey"
              style={{ left: key.left }}
              >
              <button
                type="button"
                className="EP_Educandu_Piano-blackKeyLeft"
                style={blackKeyStyle(key.pc)}
                onMouseEnter={() => setHoveredPc(key.pc)}
                onMouseLeave={() => setHoveredPc(null)}
                onClick={() => onKeyPress(key.sharpLabel, key.pc)}
                >
                <span className="EP_Educandu_Piano-blackKeyLabel">{key.sharpLabel}</span>
              </button>
              <button
                type="button"
                className="EP_Educandu_Piano-blackKeyRight"
                style={blackKeyStyle(key.pc)}
                onMouseEnter={() => setHoveredPc(key.pc)}
                onMouseLeave={() => setHoveredPc(null)}
                onClick={() => onKeyPress(key.flatLabel, key.pc)}
                >
                <span className="EP_Educandu_Piano-blackKeyLabel">{key.flatLabel}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Piano.propTypes = {
  activePcs: PropTypes.instanceOf(Set).isRequired,
  onKeyPress: PropTypes.func.isRequired
};
