import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { contarVersiculos, descargarCitas, obtenerTextoVersiculo, limpiarCache } from './api/client';
import { calcularLayoutConcordancia } from './utils/graphLayout';
import { TemaConcordancia } from './types';
import './App.css';

export interface AppState {
  fase: 'espera' | 'contando' | 'descargando' | 'listo'; // Estados del flujo
  error: string | null;
  tema: string;
  concordancia: TemaConcordancia | null;
  totalVersiculos: number;
  versiculosDescargados: number;
}

function App(): React.ReactElement {
  // Estados
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  
  const [estado, setEstado] = useState<AppState>({
    fase: 'espera',
    error: null,
    tema: '',
    concordancia: null,
    totalVersiculos: 0,
    versiculosDescargados: 0,
  });

  const [inputTema, setInputTema] = useState('');
  const [textoVersiculo, setTextoVersiculo] = useState<{ cita: string; texto: string } | null>(null);

  /**
   * FASE 1: Contar versículos
   */
  const contar = useCallback(async (temaABuscar: string): Promise<number> => {
    try {
      setEstado((prev) => ({
        ...prev,
        fase: 'contando',
        error: null,
        tema: temaABuscar,
      }));

      const respuesta = await contarVersiculos(temaABuscar);
      console.log(`✅ Conteo completado: ${respuesta.total} versículos`);
      
      return respuesta.total;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setEstado((prev) => ({
        ...prev,
        error: `Error al contar: ${mensaje}`,
        fase: 'espera',
      }));
      throw err;
    }
  }, []);

  /**
   * FASE 2: Descargar citas con progreso
   */
  const descargar = useCallback(async (temaABuscar: string, total: number) => {
    try {
      setEstado((prev) => ({
        ...prev,
        fase: 'descargando',
        totalVersiculos: total,
        versiculosDescargados: 0,
      }));

      // Simular progreso mientras se descargan
      let progreso = 0;
      const intervalo = setInterval(() => {
        progreso += Math.random() * 15;
        if (progreso > total) progreso = total;
        setEstado((prev) => ({
          ...prev,
          versiculosDescargados: Math.min(Math.floor(progreso), total),
        }));
      }, 100);

      const respuesta = await descargarCitas(temaABuscar);

      clearInterval(intervalo);
      setEstado((prev) => ({
        ...prev,
        concordancia: respuesta.data,
        versiculosDescargados: total,
        fase: 'listo',
      }));

      // Calcular layout y actualizar React Flow
      const layout = calcularLayoutConcordancia(respuesta.data, handleClickVersiculo);
      setNodes(layout.nodes);
      setEdges(layout.edges);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      setEstado((prev) => ({
        ...prev,
        error: `Error al descargar: ${mensaje}`,
        fase: 'espera',
      }));
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  /**
   * Buscar completamente: Contar + Descargar
   */
  const buscarConcordancia = useCallback(async (temaABuscar: string) => {
    if (!temaABuscar.trim()) {
      setEstado((prev) => ({ ...prev, error: 'Por favor ingresa un tema' }));
      return;
    }

    try {
      // FASE 1: Contar
      const total = await contar(temaABuscar);

      // FASE 2: Descargar
      await descargar(temaABuscar, total);
    } catch (err) {
      console.error('Error en búsqueda:', err);
    }
  }, [contar, descargar]);

  /**
   * Manejar envío del formulario
   */
  const handleBuscar = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    buscarConcordancia(inputTema);
  }, [inputTema, buscarConcordancia]);

  /**
   * Click en versículo para obtener texto
   */
  const handleClickVersiculo = useCallback(async (cita: string) => {
    try {
      setTextoVersiculo(null);
      const respuesta = await obtenerTextoVersiculo(cita);
      setTextoVersiculo(respuesta);
    } catch (err) {
      setEstado((prev) => ({
        ...prev,
        error: `Error al obtener texto: ${err instanceof Error ? err.message : 'desconocido'}`,
      }));
    }
  }, []);

  /**
   * Limpiar caché
   */
  const handleLimpiarCache = useCallback(async () => {
    try {
      await limpiarCache();
      setEstado((prev) => ({
        ...prev,
        error: 'Caché limpiado correctamente',
        fase: 'espera',
        concordancia: null,
        totalVersiculos: 0,
        versiculosDescargados: 0,
      }));
      setNodes([]);
      setEdges([]);
      setInputTema('');
      setTimeout(() => {
        setEstado((prev) => ({ ...prev, error: null }));
      }, 2000);
    } catch (err) {
      setEstado((prev) => ({
        ...prev,
        error: `Error al limpiar caché: ${err instanceof Error ? err.message : 'unknown'}`,
      }));
    }
  }, [setNodes, setEdges]);

  /**
   * Temas sugeridos
   */
  const temasSugeridos = ['fe', 'amor', 'paz', 'gozo', 'esperanza', 'sabiduría'];

  const handleTemaSugerido = useCallback((tema: string) => {
    setInputTema(tema);
    buscarConcordancia(tema);
  }, [buscarConcordancia]);

  const estaOcupado = estado.fase !== 'espera' && estado.fase !== 'listo';

  return (
    <div className="app-container">
      <div className="panel-control">
        <h1>📖 Concordancia Bíblica</h1>

        {/* Progreso: Contando versículos */}
        {estado.fase === 'contando' && (
          <div className="progreso-container">
            <div className="progreso-contenido">
              <p>🔍 Buscando versículos para "{estado.tema}"...</p>
              <div className="barra-progreso">
                <div className="barra-progreso-relleno"></div>
              </div>
              <p className="progreso-texto">Contabilizando resultados en la API</p>
            </div>
          </div>
        )}

        {/* Progreso: Descargando citas */}
        {estado.fase === 'descargando' && (
          <div className="progreso-container">
            <div className="progreso-contenido">
              <p>⬇️ Descargando citas</p>
              <div className="progreso-info">
                {estado.versiculosDescargados} / {estado.totalVersiculos}
              </div>
              <div className="barra-progreso">
                <div 
                  className="barra-progreso-relleno" 
                  style={{ 
                    width: `${(estado.versiculosDescargados / estado.totalVersiculos) * 100}%`,
                    animation: 'none'
                  }}
                ></div>
              </div>
              <p className="progreso-texto">
                {Math.round((estado.versiculosDescargados / estado.totalVersiculos) * 100)}%
              </p>
            </div>
          </div>
        )}

        {/* Formulario de búsqueda */}
        <form onSubmit={handleBuscar} className="formulario-busqueda">
          <input
            type="text"
            value={inputTema}
            onChange={(e) => setInputTema(e.target.value)}
            placeholder="Busca un tema (ej: fe, amor, paciencia)..."
            disabled={estaOcupado}
            className="input-tema"
          />
          <button
            type="submit"
            disabled={estaOcupado}
            className="boton-buscar"
          >
            {estaOcupado ? '⏳ Procesando...' : '🔍 Buscar'}
          </button>
        </form>

        {/* Temas sugeridos */}
        <div className="temas-sugeridos">
          <p className="etiqueta">Temas sugeridos:</p>
          <div className="botones-temas">
            {temasSugeridos.map((tema) => (
              <button
                key={tema}
                onClick={() => handleTemaSugerido(tema)}
                disabled={estaOcupado}
                className="boton-tema"
              >
                {tema}
              </button>
            ))}
          </div>
        </div>

        {/* Estado de la búsqueda */}
        {estado.concordancia && estado.fase === 'listo' && (
          <div className="info-busqueda">
            <p>
              <strong>Tema:</strong> {estado.concordancia.tema}
            </p>
            <p>
              <strong>Versículos descargados:</strong> {estado.concordancia.versiculos.length}
            </p>
            {estado.concordancia.versiculos.length === 0 && (
              <p style={{ color: '#dc2626', marginTop: '10px' }}>
                ℹ️ No se encontraron versículos para este tema. Intenta con otro.
              </p>
            )}
            <p>
              <strong>Fuente:</strong> 🌐 Red
            </p>
          </div>
        )}

        {/* Mensaje de error */}
        {estado.error && (
          <div className="mensaje-error">
            ⚠️ {estado.error}
          </div>
        )}

        {/* Botón para limpiar caché */}
        <button
          onClick={handleLimpiarCache}
          disabled={estaOcupado}
          className="boton-limpiar"
        >
          🗑️ Limpiar caché
        </button>

        {/* Modal de texto de versículo */}
        {textoVersiculo && (
          <div className="modal-overlay" onClick={() => setTextoVersiculo(null)}>
            <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
              <button className="modal-cerrar" onClick={() => setTextoVersiculo(null)}>✕</button>
              <h3>{textoVersiculo.cita}</h3>
              <p>{textoVersiculo.texto}</p>
            </div>
          </div>
        )}
      </div>

      {/* React Flow - Mapa conceptual */}
      <div className="grafo-container">
        {nodes.length > 0 ? (
          <ReactFlow 
            nodes={nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                onClick: (cita: string) => handleClickVersiculo(cita)
              }
            }))} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange}
          >
            <Background color="#aaa" gap={16} />
            <Controls />
          </ReactFlow>
        ) : (
          <div className="placeholder">
            <p>📊 Busca un tema para ver el mapa conceptual de la concordancia bíblica</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
