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
 * Incluye referencias cruzadas entre versículos como un mapa mental conectado
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
    nodesep: DISTANCIA_X,
    ranksep: DISTANCIA_Y,
    marginx: 50,
    marginy: 50,
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

  // Crear nodos para referencias cruzadas encontradas
  const referenciasUnicas = new Set<string>();
  concordancia.versiculos.forEach((versiculo) => {
    if (versiculo.referencias && versiculo.referencias.length > 0) {
      versiculo.referencias.forEach((referencia) => {
        referenciasUnicas.add(referencia);
      });
    }
  });

  // Agregar nodos de referencias al grafo
  referenciasUnicas.forEach((referencia) => {
    const nodoRefId = `referencia-${referencia.replace(/\s+/g, '-')}`;
    g.setNode(nodoRefId, {
      label: referencia,
      width: ANCHO_NODO,
      height: ALTO_NODO,
    });
  });

  // Conectar versículos a sus referencias
  concordancia.versiculos.forEach((versiculo, index) => {
    if (versiculo.referencias && versiculo.referencias.length > 0) {
      const nodoVersiculoId = `versiculo-${index}`;
      versiculo.referencias.forEach((referencia) => {
        const nodoRefId = `referencia-${referencia.replace(/\s+/g, '-')}`;
        g.setEdge(nodoVersiculoId, nodoRefId, { label: 'cita' });
      });
    }
  });

  // Calcular el layout
  dagre.layout(g);

  // Convertir nodos de Dagre a React Flow
  const nodes: Node[] = [];
  g.nodes().forEach((nodeId) => {
    const dagreNode = g.node(nodeId);

    if (nodeId.startsWith('tema-')) {
      nodes.push({
        id: nodeId,
        data: { label: concordancia.tema },
        position: { x: dagreNode.x - ANCHO_NODO / 2, y: dagreNode.y - ALTO_NODO / 2 },
        style: {
          background: '#4f46e5',
          color: '#fff',
          border: '3px solid #4338ca',
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
          boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)',
        },
      });
    } else if (nodeId.startsWith('versiculo-')) {
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
              {versiculo.referencias && versiculo.referencias.length > 0 && (
                <div style={{ fontSize: '10px', marginTop: '4px', color: '#666' }}>
                  🔗 {versiculo.referencias.length} cita{versiculo.referencias.length !== 1 ? 's' : ''}
                </div>
              )}
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
          boxShadow: versiculo.referencias && versiculo.referencias.length > 0 
            ? '0 0 8px rgba(34, 197, 94, 0.3)'
            : 'none',
        },
      });
    } else if (nodeId.startsWith('referencia-')) {
      // Nodo de referencia cruzada
      const referencia = nodeId.replace('referencia-', '').replace(/-/g, ' ');
      nodes.push({
        id: nodeId,
        data: {
          label: (
            <button 
              onClick={() => {
                console.log('Click en referencia:', referencia);
                if (onClickVersiculo) {
                  onClickVersiculo(referencia);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                width: '100%',
                height: '100%',
                fontSize: '11px',
                color: '#111827',
                fontWeight: '500',
                wordBreak: 'break-word',
              }}
              title={`Click para ver ${referencia}`}
            >
              📍 {referencia}
            </button>
          ),
        },
        position: { x: dagreNode.x - ANCHO_NODO / 2, y: dagreNode.y - ALTO_NODO / 2 },
        style: {
          background: '#dcfce7',
          color: '#15803d',
          border: '2px dashed #22c55e',
          borderRadius: '6px',
          padding: '10px',
          fontSize: '11px',
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
    const isReference = edgeInfo.v.startsWith('versiculo-') && edgeInfo.w.startsWith('referencia-');
    
    edges.push({
      id: `${edgeInfo.v}-${edgeInfo.w}`,
      source: edgeInfo.v,
      target: edgeInfo.w,
      animated: isReference, // Animar solo referencias cruzadas
      style: {
        stroke: isReference ? '#22c55e' : '#cbd5e1',
        strokeWidth: isReference ? 2 : 1.5,
        strokeDasharray: isReference ? '5,5' : '0',
      },
    });
  });

  return { nodes, edges };
}
