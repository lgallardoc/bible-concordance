export interface Versiculo {
  cita: string;
  texto: string;
  referencias?: string[]; // Referencias cruzadas encontradas en el texto
}

export interface TemaConcordancia {
  tema: string;
  versiculos: Versiculo[];
  grafo?: {
    nodos: string[]; // Lista de todas las citas (incluye el tema y versículos)
    aristas: Array<{
      origen: string;
      destino: string;
      tipo: 'tema-versiculo' | 'versiculo-referencia'; // Tipo de conexión
    }>;
  };
}

export interface RegistroVersiculoDB {
  id: number;
  tema_id: string;
  cita: string;
  texto: string;
}

export interface RegistroTemaBD {
  tema: string;
}