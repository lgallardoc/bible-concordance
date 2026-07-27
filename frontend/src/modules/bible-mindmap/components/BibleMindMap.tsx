// @ts-ignore
import { useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
// @ts-ignore
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { useMindMapData } from '../hooks/useMindMapData';

interface BibleMindMapProps {
  verseId?: string;
  onNodeSelect?: (node: any) => void;
}

const nodeTypes = { custom: CustomNode };

export function BibleMindMap({ verseId = 'juan-3-16', onNodeSelect }: BibleMindMapProps) {
  const { graphData, generateGraph, handleNodeClick } = useMindMapData(verseId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  useEffect(() => {
    generateGraph();
  }, [verseId]);

  useEffect(() => {
    if (!graphData.nodes.length) return;
    const rfNodes = graphData.nodes.map((n: any) => ({
      id: n.id,
      data: { ...n.data, nodeType: n.type },   // <-- pass nodeType into data
      position: n.position,
      type: 'custom',
    }));
    const rfEdges = graphData.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated ?? false,
      style: { stroke: '#64748b', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: '#64748b' },
      labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.8 },
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [graphData, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          handleNodeClick(node.id);
          if (onNodeSelect) onNodeSelect({ id: node.id, data: node.data });
        }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls style={{ bottom: 40, right: 10 }} />
      </ReactFlow>
    </div>
  );
}
