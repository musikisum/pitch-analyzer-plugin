import React from 'react';
import PropTypes from 'prop-types';

const WHITE_KEYS = [
  { note: 'C', label: 'C', abcCode: '=C' },
  { note: 'D', label: 'D', abcCode: '=D' },
  { note: 'E', label: 'E', abcCode: '=E' },
  { note: 'F', label: 'F', abcCode: '=F' },
  { note: 'G', label: 'G', abcCode: '=G' },
  { note: 'A', label: 'A', abcCode: '=A' },
  { note: 'B', label: 'B', abcCode: '=B' }
];

const BLACK_KEYS = [
  { left: '9.8%', sharpLabel: '^C', flatLabel: '_D' },
  { left: '24.1%', sharpLabel: '^D', flatLabel: '_E' },
  { left: '52.6%', sharpLabel: '^F', flatLabel: '_G' },
  { left: '66.9%', sharpLabel: '^G', flatLabel: '_A' },
  { left: '81.2%', sharpLabel: '^A', flatLabel: '_B' }
];

export default function Piano({ onKeyPress }) {
  const handleWhiteKeyClick = key => {
    onKeyPress(key.abcCode);
  };

  const handleBlackKeyClick = label => {
    onKeyPress(label);
  };

  return (
    <div className="EP_Educandu_Piano">
      <div className="EP_Educandu_Piano-keyboard">
        {WHITE_KEYS.map(key => (
          <button
            key={key.note}
            type="button"
            className="EP_Educandu_Piano-whiteKey"
            onClick={() => handleWhiteKeyClick(key)}
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
                onClick={() => handleBlackKeyClick(key.sharpLabel)}
                >
                <span className="EP_Educandu_Piano-blackKeyLabel">{key.sharpLabel}</span>
              </button>
              <button
                type="button"
                className="EP_Educandu_Piano-blackKeyRight"
                onClick={() => handleBlackKeyClick(key.flatLabel)}
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
  onKeyPress: PropTypes.func.isRequired
};
