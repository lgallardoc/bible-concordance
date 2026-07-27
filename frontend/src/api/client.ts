import { TemaConcordancia } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export interface RespuestaConteo {
  tema: string;
  total: number;
}

export interface RespuestaCitas {
  source: 'cache' | 'network';
  data: TemaConcordancia;
}

export interface RespuestaTexto {
  cita: string;
  texto: string;
}

/**
 * FASE 1: Contar versículos encontrados
 */
export async function contarVersiculos(tema: string): Promise<RespuestaConteo> {
  try {
    const url = new URL(`${API_BASE_URL}/concordancia/contar`);
    url.searchParams.append('tema', tema);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data: RespuestaConteo = await response.json();
    return data;
  } catch (error) {
    console.error('Error al contar versículos:', error);
    throw error;
  }
}

/**
 * FASE 2: Descargar citas del tema
 */
export async function descargarCitas(tema: string): Promise<RespuestaCitas> {
  try {
    const url = new URL(`${API_BASE_URL}/concordancia/descargar`);
    url.searchParams.append('tema', tema);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data: RespuestaCitas = await response.json();
    return data;
  } catch (error) {
    console.error('Error al descargar citas:', error);
    throw error;
  }
}

/**
 * Obtener texto completo de un versículo
 */
export async function obtenerTextoVersiculo(cita: string): Promise<RespuestaTexto> {
  try {
    const url = new URL(`${API_BASE_URL}/concordancia/texto`);
    url.searchParams.append('cita', cita);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data: RespuestaTexto = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener texto del versículo:', error);
    throw error;
  }
}

/**
 * Limpiar caché
 */
export async function limpiarCache(): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/cache/limpiar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al limpiar caché:', error);
    throw error;
  }
}