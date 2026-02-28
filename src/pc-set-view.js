import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
import { Badge, Card, Collapse, Descriptions, Divider, Input, Segmented, Space, Tag, Typography } from 'antd';

const { Text } = Typography;

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
  return (
    <Tag style={{ marginInlineEnd: 8, marginBottom: 8, borderRadius: 999 }}>
      {value === '' ? '∅' : value}
    </Tag>
  );
}

ChipTag.propTypes = {
  value: PropTypes.string.isRequired,
};

function SetItems({ filtered, mode }) {
  const { t } = useTranslation('musikisum/educandu-plugin-pitch-analyzer');
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

function PcSetDetailsPanel({ data, superSets, subSets }) {
  const { t } = useTranslation('musikisum/educandu-plugin-pitch-analyzer');
  const [filter, setFilter] = useState('');
  const [mode, setMode] = useState('chips');

  const filterNorm = filter.trim().toLowerCase();
  const matches = s => !filterNorm || String(s === '' ? '∅' : s).toLowerCase().includes(filterNorm);
  const superFiltered = superSets.filter(matches);
  const subFiltered = subSets.filter(matches);

  return (
    <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 3, md: 3, lg: 3 }}
        bordered
        style={{ borderRadius: 12, overflow: 'hidden' }}
        >
        <Descriptions.Item label={t('forteNameLabel')}>
          <Text>{data?.forteName || null}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('fortePrimeFormLabel')}>
          <Text>{data?.fortePrimeForm || null}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('rahnPrimeFormLabel')}>
          <Text>{data?.rahnPrimeForm || null}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ marginBlock: 16 }} />

      <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
        <Input
          allowClear
          value={filter}
          onChange={e => setFilter(e.target.value)}
          prefix={<SearchOutlined />}
          placeholder={t('filterPlaceholder')}
          style={{ maxWidth: 360, borderRadius: 10 }}
          />
        <Segmented
          value={mode}
          onChange={setMode}
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
  );
}

PcSetDetailsPanel.propTypes = {
  data: PropTypes.shape({
    forteName: PropTypes.string,
    fortePrimeForm: PropTypes.string,
    rahnPrimeForm: PropTypes.string,
  }),
  superSets: PropTypes.arrayOf(PropTypes.string).isRequired,
  subSets: PropTypes.arrayOf(PropTypes.string).isRequired,
};

PcSetDetailsPanel.defaultProps = {
  data: null,
};

function buildSummaryTitle(title, data, t) {
  if (title) { return title; }
  const parts = [];
  if (data?.forteName) { parts.push(data.forteName); }
  if (data?.fortePrimeForm) { parts.push(`PF [${data.fortePrimeForm}]`); }
  return parts.length ? parts.join(' · ') : t('setTitle');
}

export default function PcSetView({ data, defaultOpen, title }) {
  const { t } = useTranslation('musikisum/educandu-plugin-pitch-analyzer');
  const [activeKey, setActiveKey] = useState(defaultOpen ? ['details'] : []);

  const superSets = Array.isArray(data?.superSets) ? data.superSets : [];
  const subSets = Array.isArray(data?.subSets) ? data.subSets : [];
  const summaryTitle = buildSummaryTitle(title, data, t);

  const collapseItems = [{
    key: 'details',
    label: (
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Text strong style={{ fontSize: 16 }}>{summaryTitle}</Text>
        <Space wrap>
          {typeof data?.cardinality === 'number' && (
            <Badge
              count={t('cardinalityLabel', { count: data.cardinality })}
              style={{ backgroundColor: '#f0f0f0', color: '#000' }}
              />
          )}
          {data?.intervalVector ? <Tag>{t('intervalVectorLabel')} <Text>{data.intervalVector}</Text></Tag> : null}
          {data?.zMate ? <Tag>{t('zMateLabel')} <Text>{data.zMate}</Text></Tag> : null}
        </Space>
      </Space>
    ),
    children: <PcSetDetailsPanel data={data} superSets={superSets} subSets={subSets} />,
  }];

  return (
    <Collapse
      defaultActiveKey={defaultOpen ? ['details'] : []}
      activeKey={activeKey}
      onChange={setActiveKey}
      expandIcon={renderExpandIcon}
      items={collapseItems}
      />
  );
}

PcSetView.propTypes = {
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
};

PcSetView.defaultProps = {
  data: null,
  defaultOpen: false,
  title: null,
};
