import dagre from 'dagre';
import type { MindMapNode, MindMapEdge } from '../types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const VERSE_NODE_WIDTH = 240;
const VERSE_NODE_HEIGHT = 120;

export class LayoutCalculator {
  static calculateLayout(
    nodes: MindMapNode[],
    edges: MindMapEdge[]
  ): MindMapNode[] {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'TB',
      nodesep: 120,
      ranksep: 200,
      marginx: 50,
      marginy: 50,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Agregar nodos
    nodes.forEach((node) => {
      const isVerse = node.type === 'verse';
      const width = isVerse ? VERSE_NODE_WIDTH : NODE_WIDTH;
      const height = isVerse ? VERSE_NODE_HEIGHT : NODE_HEIGHT;

      g.setNode(node.id, { width, height });
    });

    // Agregar edges
    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    // Calcular layout
    dagre.layout(g);

    // Actualizar posiciones
    return nodes.map((node) => {
      const dagreNode = g.node(node.id);
      if (dagreNode) {
        const isVerse = node.type === 'verse';
        const width = isVerse ? VERSE_NODE_WIDTH : NODE_WIDTH;
        const height = isVerse ? VERSE_NODE_HEIGHT : NODE_HEIGHT;

        return {
          ...node,
          position: {
            x: dagreNode.x - width / 2,
            y: dagreNode.y - height / 2,
          },
        };
      }
      return node;
    });
  }
}
