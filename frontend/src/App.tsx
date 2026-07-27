import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { obtenerConcordancia, limpiarCache } from './api/client';
import { calcularLayoutConcordancia } from './utils/graphLayout';
import { TemaConcordancia } from './types';
import './App.css';

export interface AppState {
  cargando: boolean;
  error: string | null;
  tema: string;
  concordancia: TemaConcordancia | null;
  fuente: 'cache' | 'database' | 'network' | null;
}

function App(): React.ReactElement {
  // Estados
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  
  const [estado, setEstado] = useState<AppState>({
    cargando: false,
    error: null,
    tema: '',
    concordancia: null,
    fuente: null,
  });

  const [inputTema, setInputTema] = useState('');

  /**
   * Buscar concordancia para un tema
   */
  const buscarConcordancia = useCallback(async (temaABuscar: string) => {
    if (!temaABuscar.trim()) {
      setEstado((prev) => ({ ...prev, error: 'Por favor ingresa un tema' }));
      return;
    }

    setEstado((prev) => ({
      ...prev,
      cargando: true,
      error: null,
      tema: temaABuscar,
    }));

    try {
      const respuesta = await obtenerConcordancia(temaABuscar);
      
      setEstado((prev) => ({
        ...prev,
        concordancia: respuesta.data,
        fuente: respuesta.source,
        cargando: false,
      }));

      // Calcular layout y actualizar React Flow
      const layout = calcularLayoutConcordancia(respuesta.data);
      setNodes(layout.nodes);
      setEdges(layout.edges);
    } catch (err) {
      setEstado((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error desconocido',
        cargando: false,
      }));
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  /**
   * Manejar envío del formulario
   */
  const handleBuscar = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    buscarConcordancia(inputTema);
  }, [inputTema, buscarConcordancia]);

  /**
   * Limpiar caché
   */
  const handleLimpiarCache = useCallback(async () => {
    try {
      await limpiarCache();
      setEstado((prev) => ({
        ...prev,
        error: 'Caché limpiado correctamente',
      }));
      setTimeout(() => {
        setEstado((prev) => ({ ...prev, error: null }));
      }, 2000);
    } catch (err) {
      setEstado((prev) => ({
        ...prev,
        error: `Error al limpiar caché: ${err instanceof Error ? err.message : 'unknown'}`,
      }));
    }
  }, []);

  /**
   * Temas sugeridos para pruebas
   */
  const temasSugeridos = ['fe', 'amor', 'paz', 'gozo', 'esperanza', 'sabiduría'];

  const handleTemaSugerido = useCallback((tema: string) => {
    setInputTema(tema);
    buscarConcordancia(tema);
  }, [buscarConcordancia]);

  return (
    <div className="app-container">
      <div className="panel-control">
        <h1>📖 Concordancia Bíblica</h1>

        {/* Formulario de búsqueda */}
        <form onSubmit={handleBuscar} className="formulario-busqueda">
          <input
            type="text"
            value={inputTema}
            onChange={(e) => setInputTema(e.target.value)}
            placeholder="Busca un tema (ej: fe, amor, paciencia)..."
            disabled={estado.cargando}
            className="input-tema"
          />
          <button
            type="submit"
            disabled={estado.cargando}
            className="boton-buscar"
          >
            {estado.cargando ? '⏳ Buscando...' : '🔍 Buscar'}
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
                disabled={estado.cargando}
                className="boton-tema"
              >
                {tema}
              </button>
            ))}
          </div>
        </div>

        {/* Estado de la búsqueda */}
        {estado.concordancia && (
          <div className="info-busqueda">
            <p>
              <strong>Tema:</strong> {estado.concordancia.tema}
            </p>
            <p>
              <strong>Versículos encontrados:</strong> {estado.concordancia.versiculos.length}
            </p>
            {estado.concordancia.versiculos.length === 0 && (
              <p style={{ color: '#dc2626', marginTop: '10px' }}>
                ℹ️ No se encontraron versículos para este tema. Intenta con otro.
              </p>
            )}
            <p>
              <strong>Fuente:</strong>{' '}
              <span className={`fuente fuente-${estado.fuente}`}>
                {estado.fuente === 'cache' && '💾 Caché'}
                {estado.fuente === 'database' && '🗄️ Base de datos'}
                {estado.fuente === 'network' && '🌐 Red'}
              </span>
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
          disabled={estado.cargando}
          className="boton-limpiar"
        >
          🗑️ Limpiar caché
        </button>
      </div>

      {/* React Flow - Mapa conceptual */}
      <div className="grafo-container">
        {nodes.length > 0 ? (
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}>
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