import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
  Badge,
  Button,
  Card,
  Collapse,
  Descriptions,
  Divider,
  Input,
  message,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import { DownloadOutlined, DownOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import pcsetToAbcNotes, { sortAbcNotesByPitch } from './pcset-abc-adapter.js';

const { Text } = Typography;

const PC_SET_KEYS = ['rahnPrimeForm', 'fortePrimeForm', 'intervalVector', 'forteName', 'cardinality', 'zMate', 'superSets', 'subSets'];

const EMPTY_NOTES = [];

function renderExpandIcon({ isActive }) {
  return (
    <DownOutlined
      style={{
        fontSize: 12,
        transform: `rotate(${isActive ? 180 : 0}deg)`,
        transition: 'transform 0.2s ease',
      }}
      />
  );
}

function ChipTag({ value }) {
  const label = value === '' ? '∅' : value;
  return (
    <Tag
      style={{
        marginInlineEnd: 8,
        marginBottom: 8,
        borderRadius: 999
      }}
      >
      {label}
    </Tag>
  );
}

ChipTag.propTypes = {
  value: PropTypes.string.isRequired,
};

function SetItems({ filtered, mode }) {
  const { t } = useTranslation('educandu/pitch-analyzer');
  if (!filtered.length) {
    return <Text type="secondary">{t('noResults')}</Text>;
  }
  if (mode === 'list') {
    return (
      <ol style={{ margin: 0, paddingInlineStart: 18 }}>
        {filtered.map((s, i) => (
          <li key={`${s || 'empty'}-${i}`} style={{ marginBottom: 6 }}>
            {s === '' ? '∅' : s}
          </li>
        ))}
      </ol>
    );
  }
  return filtered.map((s, i) => <ChipTag key={`${s || 'empty'}-${i}`} value={s} />);
}

SetItems.propTypes = {
  filtered: PropTypes.arrayOf(PropTypes.string).isRequired,
  mode: PropTypes.oneOf(['chips', 'list']).isRequired,
};

function SetCard({ title, all, filtered, mode }) {
  return (
    <Card
      size="small"
      style={{ borderRadius: 14 }}
      title={
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text strong>{title}</Text>
          <Tag>{filtered.length} / {all.length}</Tag>
        </Space>
      }
      >
      <SetItems filtered={filtered} mode={mode} />
    </Card>
  );
}

SetCard.propTypes = {
  title: PropTypes.string.isRequired,
  all: PropTypes.arrayOf(PropTypes.string).isRequired,
  filtered: PropTypes.arrayOf(PropTypes.string).isRequired,
  mode: PropTypes.oneOf(['chips', 'list']).isRequired,
};

async function saveJsonFile(json, forteName, successMessage) {
  const fileName = `${forteName || 'pc-set'}.json`;

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
      // Fall through to anchor fallback on unexpected errors
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

function buildSummaryTitle(title, activeData, t) {
  if (title) {
    return title;
  }
  const parts = [];
  if (activeData?.forteName) { parts.push(activeData.forteName); }
  if (activeData?.fortePrimeForm) { parts.push(`PF [${activeData.fortePrimeForm}]`); }
  return parts.length ? parts.join(' · ') : t('setTitle');
}

export default function PcSetCollapseCardAntD({ data, defaultOpen, title, abcNotes, onImport }) {
  const { t } = useTranslation('educandu/pitch-analyzer');
  const [activeKey, setActiveKey] = useState(defaultOpen ? ['details'] : []);
  const [filter, setFilter] = useState('');
  const [mode, setMode] = useState('chips');
  const [importedData, setImportedData] = useState(null);

  const importFileRef = useRef(null);

  const activeData = useMemo(() => importedData ?? data, [importedData, data]);

  useEffect(() => {
    setImportedData(null);
  }, [data]);

  const superSets = useMemo(() => {
    const v = activeData?.superSets;
    return Array.isArray(v) ? v : [];
  }, [activeData]);

  const subSets = useMemo(() => {
    const v = activeData?.subSets;
    return Array.isArray(v) ? v : [];
  }, [activeData]);

  const summaryTitle = useMemo(() => buildSummaryTitle(title, activeData, t), [title, activeData, t]);
  const jsonExport = useMemo(() => JSON.stringify({ ...data, abcNotes }, null, 2), [data, abcNotes]);
  const filterNorm = useMemo(() => filter.trim().toLowerCase(), [filter]);

  const matchesFilter = useCallback(
    s => {
      if (!filterNorm) { return true; }
      const label = s === '' ? '∅' : s;
      return String(label).toLowerCase().includes(filterNorm);
    },
    [filterNorm]
  );

  const superFiltered = useMemo(() => superSets.filter(matchesFilter), [superSets, matchesFilter]);
  const subFiltered = useMemo(() => subSets.filter(matchesFilter), [subSets, matchesFilter]);

  const handleCollapseChange = useCallback(k => setActiveKey(k), []);
  const handleFilterChange = useCallback(e => setFilter(e.target.value), []);
  const handleModeChange = useCallback(v => setMode(v), []);

  const handleSave = useCallback(async e => {
    e.stopPropagation();
    await saveJsonFile(jsonExport, activeData?.forteName, t('saveSuccessMessage'));
  }, [jsonExport, activeData, t]);

  const handleImportClick = useCallback(e => {
    e.stopPropagation();
    importFileRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async event => {
    const { target } = event;
    const file = target.files?.[0];
    if (!file) { return; }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const pcData = Object.fromEntries(
        PC_SET_KEYS.filter(k => k in parsed).map(k => [k, parsed[k]])
      );
      if (Object.keys(pcData).length > 0) {
        setImportedData(pcData);
      }

      if (onImport) {
        const rawNotes = Array.isArray(parsed.abcNotes) && parsed.abcNotes.length > 0
          ? parsed.abcNotes
          : pcsetToAbcNotes(parsed);
        const notes = sortAbcNotesByPitch(rawNotes);
        if (notes.length > 0) {
          onImport(notes);
        }
      }
    } catch {
      message.error(t('importErrorMessage'));
    }
    target.value = '';
  }, [onImport, t]);

  const collapseItems = useMemo(() => [{
    key: 'details',
    label: (
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 16 }}>{summaryTitle}</Text>
          <Space>
            {!!onImport && (
              <Button icon={<UploadOutlined />} onClick={handleImportClick}>
                {t('importLabel')}
              </Button>
            )}
            <Button icon={<DownloadOutlined />} onClick={handleSave}>
              {t('jsonLabel')}
            </Button>
          </Space>
        </Space>
        <Space wrap>
          {typeof activeData?.cardinality === 'number' && (
            <Badge
              count={t('cardinalityLabel', { count: activeData.cardinality })}
              style={{ backgroundColor: '#f0f0f0', color: '#000' }}
              />
          )}
          {activeData?.intervalVector ? <Tag>{t('intervalVectorLabel')} <Text>{activeData.intervalVector}</Text></Tag> : null}
          {activeData?.zMate ? <Tag>{t('zMateLabel')} <Text>{activeData.zMate}</Text></Tag> : null}
        </Space>
      </Space>
    ),
    children: (
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 3, md: 3, lg: 3 }}
          bordered
          style={{ borderRadius: 12, overflow: 'hidden' }}
          >
          <Descriptions.Item label={t('forteNameLabel')}>
            <Text>{activeData?.forteName || null}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('fortePrimeFormLabel')}>
            <Text>{activeData?.fortePrimeForm || null}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('rahnPrimeFormLabel')}>
            <Text>{activeData?.rahnPrimeForm || null}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider style={{ marginBlock: 16 }} />

        <Space
          wrap
          style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}
          >
          <Input
            allowClear
            value={filter}
            onChange={handleFilterChange}
            prefix={<SearchOutlined />}
            placeholder={t('filterPlaceholder')}
            style={{ maxWidth: 360, borderRadius: 10 }}
            />
          <Segmented
            value={mode}
            onChange={handleModeChange}
            options={[
              { label: t('chipsLabel'), value: 'chips' },
              { label: t('listLabel'), value: 'list' },
            ]}
            />
        </Space>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <SetCard title={t('superSetsLabel')} all={superSets} filtered={superFiltered} mode={mode} />
          <SetCard title={t('subSetsLabel')} all={subSets} filtered={subFiltered} mode={mode} />
        </Space>
      </Card>
    ),
  }], [
    summaryTitle, onImport, handleImportClick, handleSave, activeData,
    filter, handleFilterChange, mode, handleModeChange,
    superSets, superFiltered, subSets, subFiltered, t,
  ]);

  return (
    <React.Fragment>
      <Collapse
        defaultActiveKey={defaultOpen ? ['details'] : []}
        activeKey={activeKey}
        onChange={handleCollapseChange}
        expandIcon={renderExpandIcon}
        items={collapseItems}
        />
      <input
        ref={importFileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
        />
    </React.Fragment>
  );
}

PcSetCollapseCardAntD.propTypes = {
  data: PropTypes.shape({
    rahnPrimeForm: PropTypes.string,
    fortePrimeForm: PropTypes.string,
    intervalVector: PropTypes.string,
    forteName: PropTypes.string,
    cardinality: PropTypes.number,
    zMate: PropTypes.string,
    superSets: PropTypes.arrayOf(PropTypes.string),
    subSets: PropTypes.arrayOf(PropTypes.string),
  }),
  defaultOpen: PropTypes.bool,
  title: PropTypes.string,
  abcNotes: PropTypes.arrayOf(PropTypes.string),
  onImport: PropTypes.func,
};

PcSetCollapseCardAntD.defaultProps = {
  data: null,
  defaultOpen: false,
  title: null,
  abcNotes: EMPTY_NOTES,
  onImport: null,
};
