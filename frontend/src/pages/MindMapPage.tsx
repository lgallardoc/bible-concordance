import { useState } from 'react';
import { BibleMindMap } from '../modules/bible-mindmap';
import { BibleMindMapService } from '../modules/bible-mindmap/services/bibleService';
import { DrawerPanel } from '../modules/bible-mindmap/components/DrawerPanel';
import { useMindMapData } from '../modules/bible-mindmap/hooks/useMindMapData';

const ALL_VERSES = [
  { id: 'juan-3-16', label: 'Juan 3:16 (LBLA)' },
  { id: 'romanos-5-8', label: 'Romanos 5:8' },
  { id: '1-juan-4-9', label: '1 Juan 4:9' },
  { id: 'mateo-24-14', label: 'Mateo 24:14' },
];

const KEYWORDS = [
  'Juan 3:16', 'Juan 3:19', 'Juan 3:18', 'Juan 3:17',
  'Juan 4:10', 'Juan 4:12', 'Juan 4:13', 'Juan 4:14',
  'Romanos 2:33', 'Romanos 5:48',
  'Agapa', 'Agapaō', 'Agapō', 'Hijo',
];

// Inner component that has access to useMindMapData
function MindMapContent({ verseId }: { verseId: string }) {
  const { selectedNode, setSelectedNode, handleNodeClick } = useMindMapData(verseId);

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Center: Mind Map */}
      <div style={{ flex: 1, position: 'relative', background: '#f1f5f9' }}>
        <BibleMindMap
          verseId={verseId}
          onNodeSelect={(node: any) => handleNodeClick(node.id)}
        />
        {/* Controls label */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0',
          borderRadius: '8px', padding: '6px 14px', fontSize: '12px', color: '#64748b',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          Haz clic en un nodo para ver detalles · Rueda para zoom · Arrastrar para mover
        </div>
      </div>

      {/* Right: Drawer Panel */}
      {selectedNode && (
        <div style={{ width: '320px', borderLeft: '1px solid #e2e8f0', background: '#fff', overflow: 'auto', flexShrink: 0 }}>
          <DrawerPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      )}
    </div>
  );
}

export function MindMapPage() {
  const [selectedVerse, setSelectedVerse] = useState('juan-3-16');
  const [search, setSearch] = useState('');

  const verse = BibleMindMapService.getVerse(selectedVerse);
  const verseText = verse?.text ?? '';

  const filteredKeywords = KEYWORDS.filter(k =>
    k.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header */}
      <div style={{ background: 'linear-gradient(90deg, #3730a3 0%, #4f46e5 100%)', color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>📖 Bible Concordance Mind Map</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '12px', opacity: 0.8 }}>Versión LBLA · {verse?.book} {verse?.chapter}:{verse?.verse}</div>
      </div>

      {/* Three-panel layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: '200px', background: '#1e1b4b', color: '#c7d2fe', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          {/* Selected verse info */}
          <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #312e81' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e0e7ff', marginBottom: '4px' }}>
              {verse?.book} {verse?.chapter}:{verse?.verse} (LBLA) &nbsp;
              <span style={{ fontSize: '10px', background: '#4f46e5', borderRadius: '4px', padding: '1px 5px' }}>✓</span>
            </div>
            <div style={{ fontSize: '11px', color: '#818cf8', lineHeight: '1.4' }}>
              {verseText.substring(0, 70)}...
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #312e81' }}>
            <input
              type="text"
              placeholder="Buscar versículo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', background: '#312e81', border: '1px solid #4338ca',
                borderRadius: '6px', padding: '6px 10px', color: '#e0e7ff', fontSize: '12px', outline: 'none',
              }}
            />
          </div>

          {/* Verse list */}
          <div style={{ padding: '8px 0', borderBottom: '1px solid #312e81' }}>
            <div style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Palabras Clave</div>
            {ALL_VERSES.map(v => (
              <div
                key={v.id}
                onClick={() => setSelectedVerse(v.id)}
                style={{
                  padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
                  background: selectedVerse === v.id ? '#312e81' : 'transparent',
                  color: selectedVerse === v.id ? '#a5b4fc' : '#c7d2fe',
                  borderLeft: selectedVerse === v.id ? '3px solid #818cf8' : '3px solid transparent',
                }}
              >
                {v.label}
              </div>
            ))}
          </div>

          {/* Keywords */}
          <div style={{ padding: '8px 0', flex: 1 }}>
            {filteredKeywords.map((kw, i) => (
              <div key={i} style={{ padding: '4px 12px', fontSize: '11px', color: '#818cf8', cursor: 'default' }}>
                {kw}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER + RIGHT (mind map + optional drawer) */}
        <MindMapContent key={selectedVerse} verseId={selectedVerse} />
      </div>
    </div>
  );
}
