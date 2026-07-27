export interface Versiculo {
  cita: string;
  texto: string;
  referencias?: string[]; // Referencias cruzadas
}

export interface Arista {
  origen: string;
  destino: string;
  tipo: 'tema-versiculo' | 'versiculo-referencia';
}

export interface TemaConcordancia {
  tema: string;
  versiculos: Versiculo[];
  grafo?: {
    nodos: string[];
    aristas: Arista[];
  };
}