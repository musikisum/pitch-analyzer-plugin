import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { DeleteOutlined, DownloadOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Input, List, message, Space, Typography } from 'antd';

const { Text } = Typography;

async function downloadJson(data, fileName, successMessage) {
  const json = JSON.stringify(data, null, 2);

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      message.success(successMessage);
      return;
    } catch (e) {
      if (e.name === 'AbortError') { return; }
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
  message.success(successMessage);
}

export default function AnalysisLog({ pcSetData, abcNotes, onSelect }) {
  const { t } = useTranslation('educandu/pitch-analyzer');
  const importFileRef = useRef(null);
  const [measure, setMeasure] = useState('');
  const [comment, setComment] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleSave = () => {
    const entry = {
      measure,
      comment,
      abcNotes: [...abcNotes],
      pcSet: { ...pcSetData }
    };
    setResults(prev => [...prev, entry]);
    setMeasure('');
    setComment('');
  };

  const handleDelete = index => {
    setResults(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (selectedIndex === index) {
        setSelectedIndex(null);
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1);
      }
      return next;
    });
  };

  const handleSelect = (item, index) => {
    setSelectedIndex(index);
    onSelect(item.abcNotes);
  };

  const handleDownload = () => {
    downloadJson(results, 'analyse.json', t('saveSuccessMessage'));
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImportFile = async event => {
    const { target } = event;
    const file = target.files?.[0];
    if (!file) { return; }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setResults(parsed);
        setSelectedIndex(null);
      }
    } catch {
      message.error(t('importErrorMessage'));
    }
    target.value = '';
  };

  const isSaveDisabled = abcNotes.length === 0;

  return (
    <div className="EP_Educandu_PitchAnalyzer_Display-analysisLog">
      <Space wrap>
        <Input
          value={measure}
          onChange={e => setMeasure(e.target.value)}
          placeholder={t('measurePlaceholder')}
          style={{ width: 160 }}
          />
        <Input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={t('commentPlaceholder')}
          style={{ width: 260 }}
          />
        <Button
          icon={<SaveOutlined />}
          disabled={isSaveDisabled}
          onClick={handleSave}
          >
          {t('saveResultLabel')}
        </Button>
      </Space>

      {results.length > 0 && (
        <div className="EP_Educandu_PitchAnalyzer_Display-analysisLogResults">
          <List
            size="small"
            bordered
            dataSource={results}
            renderItem={(item, index) => (
              <List.Item
                className={index === selectedIndex ? 'EP_Educandu_PitchAnalyzer_Display-analysisLogItem--selected' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => handleSelect(item, index)}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={e => { e.stopPropagation(); handleDelete(index); }}
                    />
                ]}
                >
                <Space wrap>
                  {item.measure && <Text strong>{item.measure}</Text>}
                  {item.pcSet?.forteName && <Text code>{item.pcSet.forteName}</Text>}
                  {item.pcSet?.fortePrimeForm && <Text type="secondary">[{item.pcSet.fortePrimeForm}]</Text>}
                  {item.comment && <Text type="secondary">— {item.comment}</Text>}
                </Space>
              </List.Item>
            )}
            />
          <Space style={{ marginTop: 8 }}>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              {t('downloadAnalysisLabel')}
            </Button>
            <Button icon={<UploadOutlined />} onClick={handleImportClick}>
              {t('importAnalysisLabel')}
            </Button>
          </Space>
        </div>
      )}

      {results.length === 0 && (
        <Button icon={<UploadOutlined />} onClick={handleImportClick}>
          {t('importAnalysisLabel')}
        </Button>
      )}

      <input
        ref={importFileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
        />
    </div>
  );
}

AnalysisLog.propTypes = {
  pcSetData: PropTypes.shape({
    rahnPrimeForm: PropTypes.string,
    fortePrimeForm: PropTypes.string,
    intervalVector: PropTypes.string,
    forteName: PropTypes.string,
    cardinality: PropTypes.number,
    zMate: PropTypes.string,
    superSets: PropTypes.arrayOf(PropTypes.string),
    subSets: PropTypes.arrayOf(PropTypes.string),
  }),
  abcNotes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired,
};

AnalysisLog.defaultProps = {
  pcSetData: null,
};
