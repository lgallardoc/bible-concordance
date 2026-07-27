import { Handle, Position } from 'reactflow';
import type { MindMapNode } from '../types';

interface CustomNodeProps {
  data: MindMapNode['data'];
}

export function VersNode({ data }: CustomNodeProps) {
  return (
    <div className="p-3 rounded-lg bg-indigo-600 text-white border-3 border-indigo-700 cursor-pointer transition-all">
      <div className="text-sm font-bold text-center break-words max-w-xs">{data.label}</div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function StrongsNode({ data }: CustomNodeProps) {
  return (
    <div className="p-2 rounded-lg bg-cyan-500 text-white border-2 border-cyan-600 cursor-pointer transition-all hover:shadow-lg">
      <div className="text-xs font-bold">{data.label}</div>
      <div className="text-xs mt-1 opacity-80">{data.code}</div>
      {data.count && <div className="text-xs mt-1 bg-white/20 rounded px-1">📊 {data.count}</div>}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function ConcordanceNode({ data }: CustomNodeProps) {
  return (
    <div className="p-2 rounded-lg bg-green-100 text-green-900 border-2 border-dashed border-green-500 cursor-pointer transition-all hover:shadow-md">
      <div className="text-xs font-semibold">{data.reference}</div>
      {data.excerpt && <div className="text-xs mt-1 opacity-70 truncate">{data.excerpt}</div>}
      <Handle type="target" position={Position.Top} />
    </div>
  );
}

export function CustomNode({ data }: any) {
  if (!data.type) {
    // Detectar tipo por el contenido
    if (data.reference && !data.code) {
      return data.strongCode ? <ConcordanceNode data={data} /> : <VersNode data={data} />;
    } else if (data.code) {
      return <StrongsNode data={data} />;
    }
  }
  return <div>Unknown node type</div>;
}
