import { useState, useCallback } from 'react';
import type { MindMapNode, MindMapEdge, MindMapGraphData, SelectedNodeData } from '../types';
import { BibleMindMapService } from '../services/bibleService';
import { LayoutCalculator } from '../utils/layoutCalculator';

export function useMindMapData(verseId: string) {
  const [graphData, setGraphData] = useState<MindMapGraphData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const generateGraph = useCallback(() => {
    const verse = BibleMindMapService.getVerse(verseId);
    if (!verse) return;

    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    const verseReference = BibleMindMapService.getVerseReference(verseId);

    // Nodo raíz - Versículo
    const verseNodeId = `verse-${verseId}`;
    nodes.push({
      id: verseNodeId,
      type: 'verse',
      data: {
        label: `${verseReference} (LBLA)`,
        reference: verseReference,
      },
      position: { x: 0, y: 0 },
      style: {
        background: '#4f46e5',
        color: '#fff',
        border: '3px solid #4338ca',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '13px',
        fontWeight: 'bold',
        textAlign: 'center',
      },
    });

    // Nodos Strongs (Lemas)
    const strongsNumbers = BibleMindMapService.getVerseStrongsReferences(verseId);
    strongsNumbers.forEach((strongs, idx) => {
      const strongNodeId = `strongs-${strongs.code}`;
      nodes.push({
        id: strongNodeId,
        type: 'strongs',
        data: {
          label: strongs.lemma,
          code: strongs.code,
          count: strongs.concordanceCount,
          definition: strongs.definition,
        },
        position: { x: idx * 250 - (strongsNumbers.length - 1) * 125, y: 200 },
        style: {
          background: '#06b6d4',
          color: '#fff',
          border: '2px solid #0891b2',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          fontWeight: '600',
          textAlign: 'center',
        },
      });

      // Edge versículo -> strongs
      edges.push({
        id: `edge-${verseNodeId}-${strongNodeId}`,
        source: verseNodeId,
        target: strongNodeId,
        label: 'Lema',
        animated: true,
      });

      // Nodos de Concordancia (referencias cruzadas)
      const concordances = BibleMindMapService.getConcordanceByStrong(strongs.code);
      concordances.forEach((conc, concIdx) => {
        const concNodeId = `concordance-${conc.verseId}-${strongs.code}-${concIdx}`;
        nodes.push({
          id: concNodeId,
          type: 'concordance',
          data: {
            label: conc.reference,
            reference: conc.reference,
            excerpt: conc.text.substring(0, 50) + '...',
            strongCode: strongs.code,
          },
          position: { x: 0, y: 400 },
          style: {
            background: '#dcfce7',
            color: '#15803d',
            border: '2px dashed #22c55e',
            borderRadius: '6px',
            padding: '8px',
            fontSize: '11px',
            textAlign: 'center',
          },
        });

        // Edge strongs -> concordancia
        edges.push({
          id: `edge-${strongNodeId}-${concNodeId}`,
          source: strongNodeId,
          target: concNodeId,
          label: 'Concordancia',
        });
      });
    });

    // Calcular layout
    const layoutedNodes = LayoutCalculator.calculateLayout(nodes, edges);

    setGraphData({ nodes: layoutedNodes, edges });
  }, [verseId]);

  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const node = graphData.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setSelectedNode({
        id: nodeId,
        type: node.type,
        data: node.data,
      });

      if (node.type === 'strongs') {
        toggleNodeExpansion(nodeId);
      }
    },
    [graphData.nodes, toggleNodeExpansion]
  );

  return {
    graphData,
    selectedNode,
    expandedNodes,
    generateGraph,
    handleNodeClick,
    setSelectedNode,
  };
}
