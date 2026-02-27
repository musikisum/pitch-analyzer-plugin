import version from './version.js';
import { TASK_MODE, TASK_AUDIO_TYPE } from './constants.js';

export function getDefaultContent() {
  return {
    version:            version.toString(),
    width:              100,
    taskMode:           TASK_MODE.none,
    taskWidth:          100,
    taskDescription:    '',
    taskAbcCode:        '',
    taskImage:          { sourceUrl: '', copyrightNotice: '' },
    taskAudioType:      TASK_AUDIO_TYPE.none,
    taskAudioSourceUrl: '',
    chordMap:           null,
    parsedScore:        null
  };
}
