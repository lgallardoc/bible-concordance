// @ts-ignore
import { useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
// @ts-ignore
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { DrawerPanel } from './DrawerPanel';
import { useMindMapData } from '../hooks/useMindMapData';

interface BibleMindMapProps {
  verseId?: string;
}

const nodeTypes = {
  custom: CustomNode,
};

export function BibleMindMap({ verseId = 'juan-3-16' }: BibleMindMapProps) {
  const { graphData, selectedNode, generateGraph, handleNodeClick, setSelectedNode } =
    useMindMapData(verseId);

  const [nodes, setNodes] = useNodesState<Node[]>([]);
  const [edges, setEdges] = useEdgesState<Edge[]>([]);

  useEffect(() => {
    generateGraph();
  }, [verseId]);

  useEffect(() => {
    const reactFlowNodes = graphData.nodes.map((node: any) => ({
      id: node.id,
      data: { ...node.data },
      position: node.position,
      type: 'custom',
      style: node.style,
      selected: selectedNode?.id === node.id,
    }));

    const reactFlowEdges = graphData.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: edge.animated,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: 'arrowclosed',
    }));

    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [graphData, selectedNode, setNodes, setEdges]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => {
          handleNodeClick(node.id);
        }}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Drawer Panel */}
      <DrawerPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />

      {/* Welcome Message */}
      {!selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <p className="text-sm text-gray-600">
            👆 Haz clic en un nodo para ver detalles. Puedes hacer zoom, pan y seleccionar nodos para
            explorar referencias cruzadas.
          </p>
        </div>
      )}
    </div>
  );
}
