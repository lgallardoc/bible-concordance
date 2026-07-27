export interface Versiculo {
  cita: string;
  texto: string;
}

export interface TemaConcordancia {
  tema: string;
  versiculos: Versiculo[];
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