export interface Versiculo {
  cita: string;
  texto: string;
}

export interface TemaConcordancia {
  tema: string;
  versiculos: Versiculo[];
}