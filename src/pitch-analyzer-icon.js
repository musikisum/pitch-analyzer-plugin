import React from 'react';

export default function PitchAnalyzerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      >
      {/* "1,3,7" stretched across full width */}
      <text
        x="12"
        y="11"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        textLength="22"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="sans-serif"
        fill="currentColor"
        >
        1,3,7
      </text>

      {/* White keys drawn first, black key on top */}
      <rect
        x="1.5"
        y="14.5"
        width="10"
        height="9"
        rx="0.5"
        fill="white"
        stroke="currentColor"
        strokeWidth="0.5"
        />
      <rect
        x="12.5"
        y="14.5"
        width="10"
        height="9"
        rx="0.5"
        fill="white"
        stroke="currentColor"
        strokeWidth="0.5"
        />
      <rect
        x="9.25"
        y="14.5"
        width="5.5"
        height="6"
        rx="0.4"
        fill="currentColor"
        />
    </svg>
  );
}
