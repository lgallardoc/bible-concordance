import type { SelectedNodeData } from '../types';
import { BibleMindMapService } from '../services/bibleService';

interface DrawerPanelProps {
  selectedNode: SelectedNodeData | null;
  onClose: () => void;
}

export function DrawerPanel({ selectedNode, onClose }: DrawerPanelProps) {
  if (!selectedNode) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold">Detalles del Nodo</h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-indigo-700 rounded-full p-2 transition"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {selectedNode.type === 'verse' && (
          <>
            <div>
              <h3 className="font-bold text-indigo-600 mb-2">📖 Versículo</h3>
              <p className="text-sm text-gray-700">{selectedNode.data.reference}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Texto Completo:</h4>
              <p className="text-sm text-gray-600 leading-relaxed italic">
                {BibleMindMapService.getVerse(selectedNode.id.replace('verse-', ''))?.text}
              </p>
            </div>
          </>
        )}

        {selectedNode.type === 'strongs' && (
          <>
            <div>
              <h3 className="font-bold text-cyan-600 mb-2">🔤 Lema (Strong's Number)</h3>
              <div className="bg-cyan-50 p-2 rounded mb-2">
                <p className="text-sm font-mono font-bold text-cyan-700">{selectedNode.data.code}</p>
                <p className="text-sm font-semibold text-cyan-900 italic">{selectedNode.data.label}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Definición (Breve):</h4>
              <p className="text-sm text-gray-600">{selectedNode.data.definition}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Concordancias LBLA (Locales): {selectedNode.data.count}
              </h4>
              <div className="space-y-2">
                {BibleMindMapService.getConcordanceByStrong(selectedNode.data.code).map((conc, idx) => (
                  <div key={idx} className="bg-green-50 p-2 rounded border-l-2 border-green-500">
                    <p className="text-xs font-semibold text-green-700">{conc.reference}</p>
                    <p className="text-xs text-gray-600 mt-1">{conc.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedNode.type === 'concordance' && (
          <>
            <div>
              <h3 className="font-bold text-green-600 mb-2">📍 Referencia Cruzada</h3>
              <p className="text-sm font-semibold text-green-900">{selectedNode.data.reference}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Texto Completo:</h4>
              <p className="text-sm text-gray-600 italic leading-relaxed">
                &quot;{selectedNode.data.excerpt}&quot;
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Strong Code:</h4>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded text-gray-700">
                {selectedNode.data.strongCode}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
