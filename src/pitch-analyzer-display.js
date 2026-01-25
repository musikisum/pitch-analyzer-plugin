import { Input, Dropdown, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import AbcNotation from '@educandu/educandu/components/abc-notation.js';
import { handleError, handleWarning } from '@educandu/educandu/ui/error-helper.js';
import { convertMusicXmlToAbc, transposeAbc } from '@educandu/abc-tools';
import { sectionDisplayProps } from '@educandu/educandu/ui/default-prop-types.js';
import Logger from '@educandu/educandu/common/logger.js';

const { TextArea } = Input;

const logger = new Logger(import.meta.url);

const TRANSPOSITION_HALF_STEPS = [6, 5, 4, 3, 2, 1, -1, -2, -3, -4, -5, -6];

export default function PitchAnalyzerDisplay({ content }) {
  const fileInputRef = useRef(null);
  const { t } = useTranslation('educandu/pitch-analyzer');

  const [abcCode, setAbcCode] = useState('');

  const importMusicXml = () => {
    fileInputRef.current?.click();
  };

  const transpose = halfSteps => {
    try {
      const newValue = transposeAbc(abcCode, halfSteps);
      setAbcCode(newValue);
    } catch (error) {
      handleError({ message: error.message, error, logger, t });
    }
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
      setAbcCode(result);
      if (warningMessage) {
        handleWarning({ message: warningMessage, logger, t });
      }
    } catch (error) {
      handleError({ message: error.message, error, logger, t });
    }

    event.target.value = '';
  };

  const handleToolsItemClick = ({ key }) => {
    if (key === 'import-music-xml') {
      importMusicXml();
    } else {
      transpose(Number.parseInt(key.split('|')[1], 10));
    }
  };

  const handleAbcCodeChange = event => {
    setAbcCode(event.target.value);
  };

  const toolsItems = [
    {
      key: 'import-music-xml',
      label: t('importMusicXmlLabel')
    },
    {
      key: 'transpose',
      label: t('transposeLabel'),
      disabled: !abcCode,
      children: TRANSPOSITION_HALF_STEPS.map(halfSteps => ({
        key: `transpose-child|${halfSteps}`,
        label: t('transposeChildLabel', {
          halfSteps: Math.abs(halfSteps),
          direction: halfSteps < 0 ? t('down') : t('up')
        })
      }))
    }
  ];

  return (
    <div className="EP_Educandu_PitchAnalyzer_Display">
      <div className={`u-horizontally-centered u-width-${content.width}`}>
        <div className="EP_Educandu_PitchAnalyzer_Display-content">
          <div className="EP_Educandu_PitchAnalyzer_Display-previewSection">
            <div className="EP_Educandu_PitchAnalyzer_Display-previewContainer">
              <div className="EP_Educandu_PitchAnalyzer_Display-preview">
                <AbcNotation abcCode={abcCode} />
              </div>
              <div className="EP_Educandu_PitchAnalyzer_Display-previewLabel">
                {t('preview')}
              </div>
            </div>
          </div>
          <div className="EP_Educandu_PitchAnalyzer_Display-inputSection">
            <div className="EP_Educandu_PitchAnalyzer_Display-inputContainer">
              <TextArea
                value={abcCode}
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
