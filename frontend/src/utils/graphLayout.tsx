import { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import { TemaConcordancia } from '../types';

const ANCHO_NODO = 280;
const ALTO_NODO = 100;
const DISTANCIA_X = 350;
const DISTANCIA_Y = 150;

export interface GrafoLayout {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Calcula las posiciones X,Y de los versículos usando Dagre
 * Formato: Left-to-Right (LR) para visualizar la concordancia como un mapa conceptual
 */
export function calcularLayoutConcordancia(
  concordancia: TemaConcordancia,
  onClickVersiculo?: (cita: string) => void
): GrafoLayout {
  // Crear grafo dirigido
  const g = new dagre.graphlib.Graph();

  // Configurar el grafo
  g.setGraph({
    rankdir: 'LR', // Left to Right
    nodeSep: DISTANCIA_X,
    rankSep: DISTANCIA_Y,
    marginX: 50,
    marginY: 50,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Crear nodo raíz para el tema
  const nodoTemaId = `tema-${concordancia.tema}`;
  g.setNode(nodoTemaId, {
    label: concordancia.tema,
    width: ANCHO_NODO,
    height: ALTO_NODO,
  });

  // Crear nodos para cada versículo
  concordancia.versiculos.forEach((versiculo, index) => {
    const nodoId = `versiculo-${index}`;
    g.setNode(nodoId, {
      label: versiculo.cita,
      width: ANCHO_NODO,
      height: ALTO_NODO,
    });

    // Crear arista del tema al versículo
    g.setEdge(nodoTemaId, nodoId);
  });

  // Calcular el layout
  dagre.layout(g);

  // Convertir nodos de Dagre a React Flow
  const nodes: Node[] = [];
  g.nodes().forEach((nodeId) => {
    const dagreNode = g.node(nodeId);
    const esTemaNodo = nodeId.startsWith('tema-');

    if (nodeId.startsWith('tema-')) {
      nodes.push({
        id: nodeId,
        data: { label: concordancia.tema },
        position: { x: dagreNode.x - ANCHO_NODO / 2, y: dagreNode.y - ALTO_NODO / 2 },
        style: {
          background: '#4f46e5',
          color: '#fff',
          border: '2px solid #4338ca',
          borderRadius: '8px',
          padding: '12px',
          fontWeight: 'bold',
          fontSize: '14px',
          textAlign: 'center',
          width: ANCHO_NODO,
          height: ALTO_NODO,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
    } else {
      const index = parseInt(nodeId.split('-')[1], 10);
      const versiculo = concordancia.versiculos[index];

      nodes.push({
        id: nodeId,
        data: {
          label: (
            <button 
              onClick={() => {
                console.log('Click en versículo:', versiculo.cita);
                if (onClickVersiculo) {
                  onClickVersiculo(versiculo.cita);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                width: '100%',
                height: '100%',
                fontSize: '12px',
                color: '#111827',
                fontWeight: '500',
                wordBreak: 'break-word',
              }}
              title={`Click para ver texto de ${versiculo.cita}`}
            >
              {versiculo.cita}
            </button>
          ),
          cita: versiculo.cita,
        },
        position: { x: dagreNode.x - ANCHO_NODO / 2, y: dagreNode.y - ALTO_NODO / 2 },
        style: {
          background: '#f3f4f6',
          color: '#111827',
          border: '2px solid #d1d5db',
          borderRadius: '6px',
          padding: '10px',
          fontSize: '12px',
          width: ANCHO_NODO,
          height: ALTO_NODO,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        },
      });
    }
  });

  // Convertir aristas de Dagre a React Flow
  const edges: Edge[] = [];
  g.edges().forEach((edgeInfo) => {
    edges.push({
      id: `${edgeInfo.v}-${edgeInfo.w}`,
      source: edgeInfo.v,
      target: edgeInfo.w,
      animated: true,
      style: {
        stroke: '#cbd5e1',
        strokeWidth: 2,
      },
      markerEnd: { type: 'arrowclosed', color: '#cbd5e1' },
    });
  });

  return { nodes, edges };
}
