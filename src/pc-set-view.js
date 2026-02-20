import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge,
  Button,
  Card,
  Collapse,
  Descriptions,
  Divider,
  Input,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import { CopyOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
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

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function buildSummaryTitle(title, data) {
  if (title) {
    return title;
  }
  const parts = [];
  if (data && data.forteName) {parts.push(data.forteName);}
  if (data && data.fortePrimeForm) {parts.push(`PF [${data.fortePrimeForm}]`);}
  return parts.length ? parts.join(' · ') : 'Set';
}

export default function PcSetCollapseCardAntD({ data, defaultOpen, title }) {
  const [activeKey, setActiveKey] = useState(defaultOpen ? ['details'] : []);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('');
  const [mode, setMode] = useState('chips');

  const superSets = useMemo(() => {
    const v = data && data.superSets;
    return Array.isArray(v) ? v : [];
  }, [data]);

  const subSets = useMemo(() => {
    const v = data && data.subSets;
    return Array.isArray(v) ? v : [];
  }, [data]);

  const summaryTitle = useMemo(() => buildSummaryTitle(title, data), [title, data]);
  const jsonPretty = useMemo(() => JSON.stringify(data || {}, null, 2), [data]);
  const filterNorm = useMemo(() => filter.trim().toLowerCase(), [filter]);

  const matchesFilter = useCallback(
    s => {
      if (!filterNorm) {return true;}
      const label = s === '' ? '∅' : s;
      return String(label).toLowerCase().includes(filterNorm);
    },
    [filterNorm]
  );

  const superFiltered = useMemo(
    () => superSets.filter(matchesFilter),
    [superSets, matchesFilter]
  );

  const subFiltered = useMemo(
    () => subSets.filter(matchesFilter),
    [subSets, matchesFilter]
  );

  const handleCollapseChange = useCallback(k => {
    setActiveKey(k);
  }, []);

  const handleFilterChange = useCallback(e => {
    setFilter(e.target.value);
  }, []);

  const handleModeChange = useCallback(v => {
    setMode(v);
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(jsonPretty);
    if (!ok) {return;}

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }, [jsonPretty]);

  return (
    <Collapse
      defaultActiveKey={defaultOpen ? ['details'] : []}
      activeKey={activeKey}
      onChange={handleCollapseChange}
      expandIcon={renderExpandIcon}
      >
      <Panel
        key="details"
        header={
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: 16 }}>
                {summaryTitle}
              </Text>
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                {copied ? 'Kopiert' : 'JSON'}
              </Button>
            </Space>

            <Space wrap>
              {typeof (data && data.cardinality) === 'number' && (
                <Badge
                  count={`Cardinality: ${data.cardinality}`}
                  style={{ backgroundColor: '#f0f0f0', color: '#000' }}
                  />
              )}
              {data && data.intervalVector ? <Tag>Interval Vector <Text>{data.intervalVector}</Text></Tag> : null}
              {data && data.zMate ? <Tag>Z-Mate <Text>{data.zMate}</Text></Tag> : null}
            </Space>
          </Space>
        }
        >
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 16 }}>
          <Descriptions
            size="small"
            column={{ xs: 1, sm: 3, md: 3, lg: 3 }}
            bordered
            style={{ borderRadius: 12, overflow: 'hidden' }}
            >
            <Descriptions.Item label="Forte Name">
              <Text>{(data && data.forteName) || null}</Text>
            </Descriptions.Item>          
            <Descriptions.Item label="Forte Prime Form">
              <Text>{(data && data.fortePrimeForm) || null}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Rahn Prime Form">
              <Text>{(data && data.rahnPrimeForm) || null}</Text>
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
              placeholder="Filter (z.B. 0123, 79A, ∅ …)"
              style={{ maxWidth: 360, borderRadius: 10 }}
              />

            <Segmented
              value={mode}
              onChange={handleModeChange}
              options={[
                { label: 'Chips', value: 'chips' },
                { label: 'Liste', value: 'list' },
              ]}
              />
          </Space>

          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              size="small"
              style={{ borderRadius: 14 }}
              title={
                <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>SuperSets</Text>
                  <Tag>
                    {superFiltered.length} / {superSets.length}
                  </Tag>
                </Space>
              }
              >
              {mode === 'chips'
                ? (
                  <div style={{ maxHeight: 220, overflow: 'auto' }}>
                    {superFiltered.length
                      ?                     superFiltered.map((s, i) => <ChipTag key={`${s}-${i}`} value={s} />)
                      : (
                        <Text type="secondary">Keine Treffer</Text>
                      )}
                  </div>
                )
                : (
                  <div style={{ maxHeight: 220, overflow: 'auto' }}>
                    {superFiltered.length
                      ? (
                        <ol style={{ margin: 0, paddingInlineStart: 18 }}>
                          {superFiltered.map((s, i) => (
                            <li key={`${s}-${i}`} style={{ marginBottom: 6 }}>
                              {s === '' ? '∅' : s}
                            </li>
                          ))}
                        </ol>
                      )
                      : (
                        <Text type="secondary">Keine Treffer</Text>
                      )}
                  </div>
                )}
            </Card>

            <Card
              size="small"
              style={{ borderRadius: 14 }}
              title={
                <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>SubSets</Text>
                  <Tag>
                    {subFiltered.length} / {subSets.length}
                  </Tag>
                </Space>
              }
              >
              {mode === 'chips'
                ? (
                  <div style={{ maxHeight: 220, overflow: 'auto' }}>
                    {subFiltered.length
                      ?                     subFiltered.map((s, i) => <ChipTag key={`${s || 'empty'}-${i}`} value={s} />)
                      : (
                        <Text type="secondary">Keine Treffer</Text>
                      )}
                  </div>
                )
                : (
                  <div style={{ maxHeight: 220, overflow: 'auto' }}>
                    {subFiltered.length
                      ? (
                        <ol style={{ margin: 0, paddingInlineStart: 18 }}>
                          {subFiltered.map((s, i) => (
                            <li key={`${s || 'empty'}-${i}`} style={{ marginBottom: 6 }}>
                              {s === '' ? '∅' : s}
                            </li>
                          ))}
                        </ol>
                      )
                      : (
                        <Text type="secondary">Keine Treffer</Text>
                      )}
                  </div>
                )}
            </Card>

            <Card size="small" style={{ borderRadius: 14 }} title={<Text strong>Raw JSON</Text>}>
              <pre
                style={{
                  margin: 0,
                  maxHeight: 260,
                  overflow: 'auto',
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.03)',
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
                >
                {jsonPretty}
              </pre>
            </Card>
          </Space>
        </Card>
      </Panel>
    </Collapse>
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
};

PcSetCollapseCardAntD.defaultProps = {
  data: null,
  defaultOpen: false,
  title: null
};
