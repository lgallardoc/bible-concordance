import { TemaConcordancia } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export interface RespuestaConcordancia {
  source: 'cache' | 'database' | 'network';
  data: TemaConcordancia;
}

export async function obtenerConcordancia(tema: string): Promise<RespuestaConcordancia> {
  try {
    const url = new URL(`${API_BASE_URL}/concordancia`);
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

    const data: RespuestaConcordancia = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener concordancia:', error);
    throw error;
  }
}

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