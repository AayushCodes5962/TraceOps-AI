
import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

export default function GraphExplorer({ report }) {
  const { nodes, edges } = useMemo(() => {
    if (!report?.found) return { nodes: [], edges: [] }

    const node = (id, label, detail, position, kind) => ({
      id,
      position,
      data: { label: `${label}\n${detail}` },
      style: {
        background: '#151c2c',
        color: '#e7eaf3',
        border: `1px solid ${
          kind === 'alert' ? '#f87171' :
          kind === 'user' ? '#a78bfa' :
          kind === 'device' ? '#60a5fa' : '#34d399'
        }`,
        borderRadius: 10,
        padding: 12,
        width: 175,
        whiteSpace: 'pre-line',
        fontSize: 12,
        lineHeight: 1.7,
      },
    })

    const nodes = [
      node(
        report.alert.id,
        report.alert.id,
        report.alert.type,
        { x: 30, y: 150 },
        'alert'
      ),
      node(
        report.user.id,
        report.user.name,
        report.user.privileged ? 'Privileged account' : 'Standard account',
        { x: 260, y: 150 },
        'user'
      ),
      ...report.devices.map((device, i) =>
        node(
          `device-${i}`,
          device,
          'Connected device',
          { x: 490, y: 150 + i * 120 },
          'device'
        )
      ),
      ...report.systems.map((system, i) =>
        node(
          `system-${i}`,
          system,
          'Connected system',
          { x: 720, y: 150 + i * 120 },
          'system'
        )
      ),
      ...report.related_alerts.map((alert, i) =>
        node(
          alert.id,
          alert.id,
          `${alert.type} · ${alert.severity}`,
          { x: 260, y: 330 + i * 120 },
          'alert'
        )
      ),
    ]

    const edges = [
      {
        id: 'alert-user',
        source: report.alert.id,
        target: report.user.id,
        label: 'INVOLVES',
      },
      ...report.devices.map((_, i) => ({
        id: `user-device-${i}`,
        source: report.user.id,
        target: `device-${i}`,
        label: 'USES',
      })),
      ...report.systems.map((_, i) => ({
        id: `device-system-${i}`,
        source: `device-${i}`,
        target: `system-${i}`,
        label: 'CONNECTS TO',
      })),
      ...report.related_alerts.map(alert => ({
        id: `related-${alert.id}`,
        source: alert.id,
        target: report.user.id,
        label: 'INVOLVES',
      })),
    ].map(edge => ({
      ...edge,
      animated: true,
      style: { stroke: '#7770b5', strokeWidth: 1.5 },
      labelStyle: { fill: '#b8bfd1', fontSize: 10 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#7770b5' },
    }))

    return { nodes, edges }
  }, [report])

  if (!report?.found) {
    return <p className="muted">Run an investigation to explore the graph.</p>
  }

  return (
    <div style={{ height: 430, border: '1px solid #2a3143', borderRadius: 10, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333b50" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={node => {
            if (node.id.startsWith('ALT')) return '#f87171'
            if (node.id.startsWith('USR')) return '#a78bfa'
            return '#60a5fa'
          }}
          maskColor="rgba(8, 12, 20, 0.7)"
        />
      </ReactFlow>
    </div>
  )
}
