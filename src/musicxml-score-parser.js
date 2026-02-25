// Parses duration suffixes in ABC notation.
// Returns [multiplier, divisor] as integers.
// Examples: '' → [1,1], '2' → [2,1], '/' → [1,2], '//' → [1,4], '3/2' → [3,2], '/4' → [1,4]
function parseDurationSuffix(suffix) {
  if (!suffix) {
    return [1, 1];
  }
  // Pure slashes: / → 1/2, // → 1/4, /// → 1/8
  if (/^\/+$/.test(suffix)) {
    return [1, 2 ** suffix.length];
  }
  // Pure integer: '2' → [2, 1]
  if (/^\d+$/.test(suffix)) {
    return [parseInt(suffix, 10), 1];
  }
  // num/den: '3/2' → [3, 2]
  const mFull = suffix.match(/^(\d+)\/(\d+)$/);
  if (mFull) {
    return [parseInt(mFull[1], 10), parseInt(mFull[2], 10)];
  }
  // /den: '/4' → [1, 4]
  const mFrac = suffix.match(/^\/(\d+)$/);
  if (mFrac) {
    return [1, parseInt(mFrac[1], 10)];
  }
  // num/: '3/' → [3, 2]
  const mNumSlash = suffix.match(/^(\d+)\/$/);
  if (mNumSlash) {
    return [parseInt(mNumSlash[1], 10), 2];
  }
  return [1, 1];
}

// Default q value for a tuplet of p notes (standard ABC tuplet convention).
function defaultTupletQ(p) {
  if (p === 2) {
    return 3;
  }
  if (p === 3) {
    return 2;
  }
  if (p === 4) {
    return 3;
  }
  if (p === 6) {
    return 2;
  }
  if (p === 8) {
    return 3;
  }
  return 2;
}

// Parses one measure's ABC string into an array of { token, beatStart }.
// token: acc+letter (e.g. '_B', '=F', 'C') — no octave modifiers
// beatStart: 0-indexed position in mDen-units (beat 1 = beatStart 0)
// beatFactor = lNum * mDen / lDen  (mDen-units per L-unit)
function parseMeasureStr(str, lNum, lDen, mDen) {
  const beatFactor = (lNum * mDen) / lDen;
  const result = [];
  let beat = 0;
  let tupletMult = 1;
  let tupletLeft = 0;

  // Strip all inline headers [X:...] (M: changes already extracted by caller)
  let s = str.replace(/\[[A-Z]:[^\]]*\]/g, ' ');
  // Strip decorations !...!, +...+, grace notes {...}, and text annotations "..."
  s = s.replace(/![^!]*!/g, '').replace(/\+[^+]*\+/g, '').replace(/\{[^}]*\}/g, '').replace(/"[^"]*"/g, '');

  let i = 0;
  while (i < s.length) {
    const ch = s[i];

    if (/\s/.test(ch) || ch === '|' || ch === ':') {
      // Whitespace or stray bar/repeat markers — skip
      i += 1;
    } else if (ch === '(') {
      // Tuplet: (p or (p:q or (p:q:r
      i += 1;
      const tm = s.slice(i).match(/^(\d+)(?::(\d+)(?::(\d+))?)?/);
      if (tm) {
        const p = parseInt(tm[1], 10);
        const q = tm[2] ? parseInt(tm[2], 10) : defaultTupletQ(p);
        const r = tm[3] ? parseInt(tm[3], 10) : p;
        tupletMult = q / p;
        tupletLeft = r;
        i += tm[0].length;
      }
    } else if (ch === '[') {
      // Chord: [notes]duration  e.g. [CEG]2 or [^CE_G]
      const cm = s.slice(i).match(/^\[([A-Ga-g_^=,'\d\s]+)\](\d*\/*\d*)/);
      if (cm) {
        const [dm, dd] = parseDurationSuffix(cm[2]);
        const eff = tupletLeft > 0 ? tupletMult : 1;
        const dur = (dm / dd) * beatFactor * eff;
        // Extract individual note tokens from chord content
        const noteRe = /([_^=]*)([A-Ga-g])[,']*/g;
        let nm = noteRe.exec(cm[1]);
        while (nm !== null) {
          result.push({ token: nm[1] + nm[2], beatStart: beat });
          nm = noteRe.exec(cm[1]);
        }
        beat += dur;
        if (tupletLeft > 0) {
          tupletLeft -= 1;
          if (tupletLeft === 0) {
            tupletMult = 1;
          }
        }
        i += cm[0].length;
      } else {
        // Not a recognised chord — skip bracket
        i += 1;
      }
    } else if (ch === 'z' || ch === 'Z' || ch === 'x') {
      // Rest: z (beat rest), Z (measure rest), x (invisible rest)
      i += 1;
      const rm = s.slice(i).match(/^(\d*\/*\d*)/);
      const suffix = rm ? rm[1] : '';
      const [dm, dd] = parseDurationSuffix(suffix);
      const eff = tupletLeft > 0 ? tupletMult : 1;
      beat += (dm / dd) * beatFactor * eff;
      i += suffix.length;
      if (tupletLeft > 0) {
        tupletLeft -= 1;
        if (tupletLeft === 0) {
          tupletMult = 1;
        }
      }
    } else {
      // Note: [accidentals][letter][octave][duration]
      const nm = s.slice(i).match(/^([_^=]*)([A-Ga-g])([,']*)(\d*\/*\d*)/);
      if (nm) {
        const [dm, dd] = parseDurationSuffix(nm[4]);
        const eff = tupletLeft > 0 ? tupletMult : 1;
        const dur = (dm / dd) * beatFactor * eff;
        // Token: acc + letter only (octave irrelevant for pitch-class analysis)
        result.push({ token: nm[1] + nm[2], beatStart: beat });
        beat += dur;
        if (tupletLeft > 0) {
          tupletLeft -= 1;
          if (tupletLeft === 0) {
            tupletMult = 1;
          }
        }
        i += nm[0].length;
      } else {
        i += 1;
      }
    }
  }

  return result;
}

// Parses one voice's full content (joined lines) into measures.
// Returns { measures: Array<Array<{token,beatStart}>>, measureMeta: Array<{mNum,mDen}> }
function parseVoiceContent(content, lNum, lDen, initMNum, initMDen) {
  let curMNum = initMNum;
  let curMDen = initMDen;
  const measures = [];
  const measureMeta = [];

  // Split on bar lines: |, ||, |], |:, :|
  const segments = content.split(/\|[\]|:]?|:\|/);

  for (const rawSeg of segments) {
    const seg = rawSeg.trim();
    if (seg) {
      // Extract inline [M:n/m] changes — update time sig for this and following measures
      const mChange = seg.match(/\[M:(\d+)\/(\d+)\]/);
      if (mChange) {
        curMNum = parseInt(mChange[1], 10);
        curMDen = parseInt(mChange[2], 10);
      }

      measureMeta.push({ mNum: curMNum, mDen: curMDen });
      measures.push(parseMeasureStr(seg, lNum, lDen, curMDen));
    }
  }

  return { measures, measureMeta };
}

// Parses an ABC string (as returned by convertMusicXmlToAbc) into a structured score object.
//
// Returns:
//   voices:        [{ id: string, label: string }, ...]
//   measureCount:  number
//   measures:      [{ mNum: number, mDen: number }, ...]  (index 0 = measure 1)
//   voiceMeasures: { [voiceId]: Array<Array<{ token: string, beatStart: number }>> }
//
// beatStart is 0-indexed in mDen-units:  beat 1 in the UI = beatStart 0
export function parseMusicXmlAbcScore(abcString) {
  const lines = abcString.split('\n');

  // Defaults (will be overridden by header)
  let lNum = 1;
  let lDen = 8;
  let mNum = 4;
  let mDen = 4;
  const voiceDecls = []; // [{ id, label }]

  let headerDone = false;
  const bodyLines = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!headerDone) {
      const lMatch = line.match(/^L:\s*(\d+)\/(\d+)/);
      if (lMatch) {
        lNum = parseInt(lMatch[1], 10);
        lDen = parseInt(lMatch[2], 10);
      } else {
        const mMatch = line.match(/^M:\s*(\d+)\/(\d+)/);
        if (mMatch) {
          mNum = parseInt(mMatch[1], 10);
          mDen = parseInt(mMatch[2], 10);
        } else if (/^K:/.test(line)) {
          // K: is the last standard header field — everything after goes to body
          headerDone = true;
        }
        // V: lines before K: are ignored (voice declarations after K: are captured in the body phase)
      }
    } else {
      // Body: skip ABC comments (%), lyrics (w:), and empty lines
      const stripped = line.replace(/%.*$/, '').trim();
      if (stripped && !/^w:/.test(stripped)) {
        bodyLines.push(stripped);
      }
    }
  }

  // Fallback: if no K: found, treat non-header-like lines as body
  if (!headerDone) {
    for (const rawLine of lines) {
      const stripped = rawLine.trim().replace(/%.*$/, '').trim();
      if (stripped && !/^[A-Z]:/.test(stripped) && !/^%/.test(stripped)) {
        bodyLines.push(stripped);
      }
    }
  }

  // Collect voice section content.
  // xml2abc format: after K:, voice declarations appear as "V:N nm=..." then
  // the body voice sections start with standalone "V:N" lines.
  // Both formats are handled: "[V:N] music..." inline and "V:N\nmusic" block.
  const voiceSectionLines = {}; // voiceId → string[]
  let currentVoiceId = null;

  for (const line of bodyLines) {
    // Inline voice header: "[V:1] notes..." or "[V:1]notes..."
    const inlineV = line.match(/^\[V:(\S+?)\](.*)/);
    // Standalone voice header: "V:1" or "V:1 nm=..." (must not start with '[')
    const standaloneV = !inlineV && !line.startsWith('[') ? line.match(/^V:(\S+)/) : null;

    if (inlineV) {
      const id = inlineV[1];
      currentVoiceId = id;
      if (!voiceSectionLines[id]) {
        voiceSectionLines[id] = [];
      }
      if (!voiceDecls.find(v => v.id === id)) {
        voiceDecls.push({ id, label: `V:${id}` });
      }
      const rest = inlineV[2].trim();
      if (rest) {
        voiceSectionLines[id].push(rest);
      }
    } else if (standaloneV) {
      const id = standaloneV[1];
      currentVoiceId = id;
      if (!voiceSectionLines[id]) {
        voiceSectionLines[id] = [];
      }
      if (!voiceDecls.find(v => v.id === id)) {
        const nameMatch = line.match(/nm="([^"]+)"/);
        const label = nameMatch ? `${nameMatch[1]} (V:${id})` : `V:${id}`;
        voiceDecls.push({ id, label });
      }
    } else {
      // Plain music line — belongs to currentVoiceId
      if (currentVoiceId === null) {
        const fallbackId = voiceDecls.length > 0 ? voiceDecls[0].id : '1';
        currentVoiceId = fallbackId;
        if (!voiceSectionLines[fallbackId]) {
          voiceSectionLines[fallbackId] = [];
        }
        if (!voiceDecls.find(v => v.id === fallbackId)) {
          voiceDecls.push({ id: fallbackId, label: `V:${fallbackId}` });
        }
      }
      voiceSectionLines[currentVoiceId].push(line);
    }
  }

  // Ensure at least one voice
  if (voiceDecls.length === 0) {
    voiceDecls.push({ id: '1', label: 'V:1' });
  }

  // Parse each voice into measures
  const voiceMeasures = {};
  const voiceMeta = {};

  for (const voice of voiceDecls) {
    const content = (voiceSectionLines[voice.id] || []).join(' ');
    const { measures, measureMeta } = parseVoiceContent(content, lNum, lDen, mNum, mDen);
    voiceMeasures[voice.id] = measures;
    voiceMeta[voice.id] = measureMeta;
  }

  // Determine measure count from the voice with the most measures
  let maxMeasureCount = 0;
  let referenceVoiceId = voiceDecls[0].id;
  for (const voice of voiceDecls) {
    const count = voiceMeasures[voice.id].length;
    if (count > maxMeasureCount) {
      maxMeasureCount = count;
      referenceVoiceId = voice.id;
    }
  }

  // Pad all voices to the same measure count
  for (const voice of voiceDecls) {
    while (voiceMeasures[voice.id].length < maxMeasureCount) {
      voiceMeasures[voice.id].push([]);
    }
  }

  // Build global measures array from the reference voice
  const refMeta = voiceMeta[referenceVoiceId] || [];
  const defaultMeta = { mNum, mDen };
  const measures = Array.from({ length: maxMeasureCount }, (_, idx) => refMeta[idx] || defaultMeta);

  const safeCount = maxMeasureCount || 1;
  const safeMeasures = measures.length > 0 ? measures : [defaultMeta];

  return {
    voices: voiceDecls,
    measureCount: safeCount,
    measures: safeMeasures,
    voiceMeasures
  };
}
