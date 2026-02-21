import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { Button, Input, message, Space, Typography } from 'antd';
import { DeleteOutlined, DownloadOutlined, HolderOutlined, RedoOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import DragAndDropContainer from '@educandu/educandu/components/drag-and-drop-container.js';

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

function moveItem(arr, fromIndex, toIndex) {
  const next = [...arr];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function AnalysisLog({ pcSetData, abcNotes, onSelect }) {
  const { t } = useTranslation('educandu/pitch-analyzer');
  const importFileRef = useRef(null);
  const [measure, setMeasure] = useState('');
  const [comment, setComment] = useState('');
  const [results, setResults] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);

  const handleSave = () => {
    const entry = {
      key: `entry-${Date.now()}`,
      measure,
      comment,
      abcNotes: [...abcNotes],
      pcSet: { ...pcSetData }
    };
    setResults(prev => [...prev, entry]);
    setMeasure('');
    setComment('');
    setSelectedKey(null);
  };

  const handleUpdate = () => {
    setResults(prev => prev.map(item =>
      item.key === selectedKey
        ? { ...item, measure, comment, abcNotes: [...abcNotes], pcSet: { ...pcSetData } }
        : item
    ));
  };

  const handleDelete = key => {
    setResults(prev => {
      const next = prev.filter(item => item.key !== key);
      if (selectedKey === key) {
        setSelectedKey(null);
        setMeasure('');
        setComment('');
      }
      return next;
    });
  };

  const handleSelect = item => {
    setSelectedKey(item.key);
    setMeasure(item.measure);
    setComment(item.comment);
    onSelect(item.abcNotes);
  };

  const handleItemMove = (fromIndex, toIndex) => {
    setResults(prev => moveItem(prev, fromIndex, toIndex));
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
        const withKeys = parsed.map((item, i) => ({
          key: item.key || `entry-${Date.now()}-${i}`,
          ...item
        }));
        setResults(withKeys);
        setSelectedKey(null);
      }
    } catch {
      message.error(t('importErrorMessage'));
    }
    target.value = '';
  };

  const isSaveDisabled = abcNotes.length === 0;
  const isUpdateDisabled = abcNotes.length === 0 || selectedKey === null;

  const dragAndDropItems = results.map(item => ({
    key: item.key,
    render: ({ dragHandleProps, isDragged, isOtherDragged }) => (
      <div
        className={[
          'EP_Educandu_PitchAnalyzer_Display-analysisLogItem',
          item.key === selectedKey ? 'EP_Educandu_PitchAnalyzer_Display-analysisLogItem--selected' : '',
          isDragged ? 'is-dragged' : '',
          isOtherDragged ? 'is-other-dragged' : ''
        ].filter(Boolean).join(' ')}
        onClick={() => handleSelect(item)}
        >
        <span
          {...dragHandleProps}
          className="EP_Educandu_PitchAnalyzer_Display-analysisLogItemHandle"
          onClick={e => e.stopPropagation()}
          >
          <HolderOutlined />
        </span>
        <Space wrap style={{ flex: 1 }}>
          {item.measure ? <Text strong>{item.measure}</Text> : null}
          {item.pcSet?.forteName ? <Text code>{item.pcSet.forteName}</Text> : null}
          {item.pcSet?.fortePrimeForm ? <Text type="secondary">[{item.pcSet.fortePrimeForm}]</Text> : null}
          {item.comment ? <Text type="secondary">— {item.comment}</Text> : null}
        </Space>
        <span className="EP_Educandu_PitchAnalyzer_Display-analysisLogItemActions">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={e => { e.stopPropagation(); handleDelete(item.key); }}
            />
        </span>
      </div>
    )
  }));

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
        <Button
          icon={<RedoOutlined />}
          disabled={isUpdateDisabled}
          onClick={handleUpdate}
          >
          {t('updateResultLabel')}
        </Button>
      </Space>

      {results.length > 0 && (
        <div className="EP_Educandu_PitchAnalyzer_Display-analysisLogResults">
          <div className="EP_Educandu_PitchAnalyzer_Display-analysisLogList">
            <DragAndDropContainer
              droppableId="analysis-log"
              items={dragAndDropItems}
              onItemMove={handleItemMove}
              />
          </div>
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
