import Database from 'better-sqlite3';
import axios from 'axios';
import { Versiculo, TemaConcordancia } from '../types/index';

export class BibleService {
  private db: Database.Database;
  private readonly BIBLE_API_URL = 'https://www.bible-api.com';
  
  // Mapeo de libros bíblicos español -> inglés
  private readonly LIBRO_MAPEO: Record<string, string> = {
    'génesis': 'Genesis',
    'éxodo': 'Exodus',
    'levítico': 'Leviticus',
    'números': 'Numbers',
    'deuteronomio': 'Deuteronomy',
    'josué': 'Joshua',
    'jueces': 'Judges',
    'rut': 'Ruth',
    '1 samuel': '1 Samuel',
    '2 samuel': '2 Samuel',
    '1 reyes': '1 Kings',
    '2 reyes': '2 Kings',
    '1 crónicas': '1 Chronicles',
    '2 crónicas': '2 Chronicles',
    'esdras': 'Ezra',
    'nehemías': 'Nehemiah',
    'ester': 'Esther',
    'job': 'Job',
    'salmos': 'Psalms',
    'proverbios': 'Proverbs',
    'eclesiastés': 'Ecclesiastes',
    'cantar de los cantares': 'Song of Songs',
    'isaías': 'Isaiah',
    'jeremías': 'Jeremiah',
    'lamentaciones': 'Lamentations',
    'ezequiel': 'Ezekiel',
    'daniel': 'Daniel',
    'oseas': 'Hosea',
    'joel': 'Joel',
    'amós': 'Amos',
    'abdías': 'Obadiah',
    'jonás': 'Jonah',
    'miqueas': 'Micah',
    'nahúm': 'Nahum',
    'habacuc': 'Habakkuk',
    'sofonías': 'Zephaniah',
    'hageo': 'Haggai',
    'zacarías': 'Zechariah',
    'malaquías': 'Malachi',
    'mateo': 'Matthew',
    'marcos': 'Mark',
    'lucas': 'Luke',
    'juan': 'John',
    'hechos': 'Acts',
    'romanos': 'Romans',
    '1 corintios': '1 Corinthians',
    '2 corintios': '2 Corinthians',
    'gálatas': 'Galatians',
    'efesios': 'Ephesians',
    'filipenses': 'Philippians',
    'colosenses': 'Colossians',
    '1 tesalonicenses': '1 Thessalonians',
    '2 tesalonicenses': '2 Thessalonians',
    '1 timoteo': '1 Timothy',
    '2 timoteo': '2 Timothy',
    'tito': 'Titus',
    'filemón': 'Philemon',
    'hebreos': 'Hebrews',
    'santiago': 'James',
    '1 pedro': '1 Peter',
    '2 pedro': '2 Peter',
    '1 juan': '1 John',
    '2 juan': '2 John',
    '3 juan': '3 John',
    'judas': 'Jude',
    'apocalipsis': 'Revelation',
  };

  constructor(db: Database.Database) {
    this.db = db;
  }
  
  /**
   * Convierte una cita en español a inglés
   */
  private convertirCitaAIngles(citaEspanol: string): string {
    let citaIngles = citaEspanol;
    
    // Encontrar el libro
    for (const [es, en] of Object.entries(this.LIBRO_MAPEO)) {
      const regex = new RegExp(`^${es}\\s+`, 'i');
      if (regex.test(citaEspanol)) {
        citaIngles = citaIngles.replace(regex, `${en} `);
        break;
      }
    }
    
    return citaIngles;
  }

  /**
   * Obtiene un tema con sus versículos directamente de la base de datos local
   */
  obtenerTemaLocal(tema: string): TemaConcordancia | null {
    const query = `
      SELECT v.cita, v.texto
      FROM versiculos v
      INNER JOIN temas t ON v.tema_id = t.tema
      WHERE t.tema = ?
      ORDER BY v.id ASC
    `;

    const stmt = this.db.prepare(query);
    const versiculos = stmt.all(tema) as Versiculo[];

    if (versiculos.length === 0) {
      return null;
    }

    return {
      tema,
      versiculos,
    };
  }

  /**
   * FASE 1: Contar versículos encontrados sin descargar texto
   */
  async contarVersiculos(tema: string): Promise<number> {
    try {
      console.log(`📊 Contando versículos para "${tema}" en Bible API...`);
      const count = await this.contarEnBibleAPI(tema);
      
      if (count > 0) {
        console.log(`📈 Encontrados ${count} versículos para "${tema}"`);
        return count;
      }
    } catch (error) {
      console.log(`❌ Error al contar en API: ${error}`);
    }

    // Fallback a datos simulados
    console.log(`⚠️ Usando datos simulados para "${tema}"`);
    const fallback = this.obtenerDatosSimuladosBibleGateway(tema);
    console.log(`📈 Fallback: ${fallback.length} versículos`);
    return fallback.length;
  }

  /**
   * FASE 2: Descargar solo las citas (sin texto completo)
   */
  async descargarCitas(tema: string, callback?: (progreso: number, total: number) => void): Promise<Versiculo[]> {
    let citas: Versiculo[] = [];

    try {
      console.log(`⬇️ Descargando citas para "${tema}"...`);
      citas = await this.descargarCitasDesdeAPI(tema, callback);

      if (citas.length === 0) {
        console.log(`⚠️ No se descargaron citas de API para "${tema}", usando fallback`);
        citas = this.obtenerDatosSimuladosBibleGateway(tema);
      } else {
        console.log(`✅ Descargadas ${citas.length} citas para "${tema}"`);
      }
    } catch (error) {
      console.log(`❌ Error al descargar citas: ${error}`);
      citas = this.obtenerDatosSimuladosBibleGateway(tema);
    }

    // Guardar en BD
    this.guardarEnBaseDatos(tema, citas);

    return citas;
  }

  /**
   * Obtener texto completo de un versículo específico
   */
  async obtenerTextoVersiculo(cita: string): Promise<string> {
    try {
      console.log(`📖 Obteniendo texto de ${cita}...`);
      
      // Primero, buscar en los datos simulados
      const textoSimulado = this.obtenerTextoSimulado(cita);
      if (textoSimulado) {
        console.log(`✅ Texto obtenido de datos simulados para ${cita}`);
        return textoSimulado;
      }
      
      // Si no está en simulados, intentar la API
      const citaIngles = this.convertirCitaAIngles(cita);
      console.log(`🔤 Cita convertida: ${cita} -> ${citaIngles}`);
      
      const response = await axios.get(`${this.BIBLE_API_URL}/${encodeURIComponent(citaIngles)}`);
      
      if (response.data && response.data.text) {
        const texto = response.data.text.trim();
        console.log(`✅ Texto obtenido de API para ${cita}`);
        return texto;
      }
    } catch (error) {
      console.log(`⚠️ Error al obtener texto: ${error}`);
    }
    
    return `Texto no disponible para ${cita}`;
  }

  /**
   * Buscar texto en los datos simulados
   */
  private obtenerTextoSimulado(cita: string): string | null {
    // Buscar en todos los temas simulados
    const temas = ['fe', 'amor', 'paz', 'gozo', 'esperanza', 'sabiduría'];
    
    for (const tema of temas) {
      const versiculos = this.obtenerDatosSimuladosBibleGateway(tema);
      const versiculo = versiculos.find(v => v.cita.toLowerCase() === cita.toLowerCase());
      if (versiculo) {
        return versiculo.texto;
      }
    }
    
    return null;
  }

  /**
   * FASE 1: Contar versículos en la API
   */
  private async contarEnBibleAPI(keyword: string): Promise<number> {
    let contador = 0;
    const libros = this.obtenerLibrosBiblia();

    for (const libro of libros) {
      if (contador >= 300) break;

      try {
        const capitulosDelLibro = this.obtenerCapitulosPorLibro(libro);

        for (const capitulo of capitulosDelLibro) {
          if (contador >= 300) break;

          try {
            const referencia = `${libro} ${capitulo}`;
            const response = await axios.get(`${this.BIBLE_API_URL}/?passage=${encodeURIComponent(referencia)}`);

            if (response.data && response.data.passages) {
              for (const passage of response.data.passages) {
                const texto = passage.content || '';
                if (texto.toLowerCase().includes(keyword.toLowerCase())) {
                  const lineas = texto.split('\n').filter((l: string) => l.trim());
                  for (const linea of lineas) {
                    if (linea.toLowerCase().includes(keyword.toLowerCase())) {
                      contador++;
                      if (contador >= 300) break;
                    }
                  }
                }
              }
            }
          } catch (err) {
            continue;
          }
        }
      } catch (err) {
        continue;
      }
    }

    return Math.min(contador, 300);
  }

  /**
   * FASE 2: Descargar solo citas (sin texto completo)
   */
  private async descargarCitasDesdeAPI(
    keyword: string,
    callback?: (progreso: number, total: number) => void
  ): Promise<Versiculo[]> {
    const citas: Versiculo[] = [];
    const libros = this.obtenerLibrosBiblia();
    let progreso = 0;
    let totalEstimado = 50; // Estimación inicial

    for (const libro of libros) {
      if (citas.length >= 300) break;

      try {
        const capitulosDelLibro = this.obtenerCapitulosPorLibro(libro);

        for (const capitulo of capitulosDelLibro) {
          if (citas.length >= 300) break;

          try {
            const referencia = `${libro} ${capitulo}`;
            const response = await axios.get(`${this.BIBLE_API_URL}/?passage=${encodeURIComponent(referencia)}`);

            if (response.data && response.data.passages) {
              for (const passage of response.data.passages) {
                const texto = passage.content || '';

                if (texto.toLowerCase().includes(keyword.toLowerCase())) {
                  const lineas = texto.split('\n').filter((l: string) => l.trim());

                  for (const linea of lineas) {
                    if (linea.toLowerCase().includes(keyword.toLowerCase())) {
                      const match = linea.match(/^(.+?)\s+(.+)$/);
                      citas.push({
                        cita: match ? match[1].trim() : passage.reference || 'Desconocida',
                        // Guardar solo el reference, el texto se carga después
                        texto: '',
                      });

                      progreso++;
                      callback?.(progreso, totalEstimado);

                      if (citas.length >= 300) break;
                    }
                  }
                }
              }
            }
          } catch (err) {
            continue;
          }
        }
      } catch (err) {
        continue;
      }
    }

    return citas;
  }

  /**
   * Extrae versículos individuales del pasaje de la API
   */
  private extraerVersiculos(passage: any, keyword: string): Versiculo[] {
    const versiculos: Versiculo[] = [];

    if (!passage.content) return versiculos;

    const lineas = passage.content.split('\n').filter((l: string) => l.trim());

    for (const linea of lineas) {
      if (linea.toLowerCase().includes(keyword.toLowerCase())) {
        const match = linea.match(/^(.+?)\s+(.+)$/);
        if (match) {
          versiculos.push({
            cita: match[1].trim(),
            texto: match[2].trim(),
          });
        } else {
          versiculos.push({
            cita: passage.reference || 'Desconocida',
            texto: linea.trim(),
          });
        }
      }
    }

    return versiculos;
  }

  /**
   * Obtiene lista de libros de la Biblia
   */
  private obtenerLibrosBiblia(): string[] {
    return [
      'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
      'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
      '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras',
      'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
      'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones',
      'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós',
      'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc',
      'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
      'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos',
      'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios',
      'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses',
      '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón', 'Hebreos',
      'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan',
      '3 Juan', 'Judas', 'Apocalipsis'
    ];
  }

  /**
   * Obtiene cantidad de capítulos por libro
   */
  private obtenerCapitulosPorLibro(libro: string): number[] {
    const capitulosPorLibro: Record<string, number> = {
      'Génesis': 50, 'Éxodo': 40, 'Levítico': 27, 'Números': 36, 'Deuteronomio': 34,
      'Josué': 24, 'Jueces': 21, 'Rut': 4, '1 Samuel': 31, '2 Samuel': 24,
      '1 Reyes': 22, '2 Reyes': 25, '1 Crónicas': 29, '2 Crónicas': 36, 'Esdras': 10,
      'Nehemías': 13, 'Ester': 10, 'Job': 42, 'Salmos': 150, 'Proverbios': 31,
      'Eclesiastés': 12, 'Cantares': 8, 'Isaías': 66, 'Jeremías': 52, 'Lamentaciones': 5,
      'Ezequiel': 48, 'Daniel': 12, 'Oseas': 14, 'Joel': 3, 'Amós': 9,
      'Abdías': 1, 'Jonás': 4, 'Miqueas': 7, 'Nahúm': 3, 'Habacuc': 3,
      'Sofonías': 3, 'Hageo': 2, 'Zacarías': 14, 'Malaquías': 4,
      'Mateo': 28, 'Marcos': 16, 'Lucas': 24, 'Juan': 21, 'Hechos': 28,
      'Romanos': 16, '1 Corintios': 16, '2 Corintios': 13, 'Gálatas': 6, 'Efesios': 6,
      'Filipenses': 4, 'Colosenses': 4, '1 Tesalonicenses': 5, '2 Tesalonicenses': 3,
      '1 Timoteo': 6, '2 Timoteo': 4, 'Tito': 3, 'Filemón': 1, 'Hebreos': 13,
      'Santiago': 5, '1 Pedro': 5, '2 Pedro': 3, '1 Juan': 5, '2 Juan': 1,
      '3 Juan': 1, 'Judas': 1, 'Apocalipsis': 22
    };

    const capitulos = capitulosPorLibro[libro] || 10;
    return Array.from({ length: Math.min(capitulos, 10) }, (_, i) => i + 1); // Limitar a primeros 10 capítulos por performance
  }

  /**
   * Guarda versículos en la base de datos
   */
  private guardarEnBaseDatos(tema: string, versiculos: Versiculo[]): void {
    try {
      const insertarTema = this.db.prepare('INSERT OR IGNORE INTO temas (tema) VALUES (?)');
      const insertarVersiculos = this.db.prepare(
        'INSERT INTO versiculos (tema_id, cita, texto) VALUES (?, ?, ?)'
      );

      const transaccion = this.db.transaction(() => {
        insertarTema.run(tema);

        for (const versiculo of versiculos) {
          insertarVersiculos.run(tema, versiculo.cita, versiculo.texto);
        }
      });

      transaccion();
    } catch (error) {
      console.error('Error al guardar en BD:', error);
    }
  }

  /**
   * Datos simulados como fallback
   */
  private obtenerDatosSimuladosBibleGateway(tema: string): Versiculo[] {
    const datosSimulados: Record<string, Versiculo[]> = {
      fe: [
        { cita: 'Hebreos 11:1', texto: 'Ahora bien, la fe es la certeza de lo que se espera, la convicción de lo que no se ve.' },
        { cita: 'Romanos 10:17', texto: 'Así que la fe viene del oír, y el oír, por la palabra de Dios.' },
        { cita: 'Marcos 11:24', texto: 'Por eso os digo que todo lo que pidáis en oración, creed que lo habéis recibido, y os vendrá.' },
      ],
      amor: [
        { cita: '1 Juan 4:7', texto: 'Amados, amémonos los unos a los otros; porque el amor es de Dios.' },
        { cita: '1 Corintios 13:4-7', texto: 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece; no hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor; no se huelga de la injusticia, mas se huelga de la verdad. Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta.' },
        { cita: 'Juan 3:16', texto: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.' },
      ],
      paz: [
        { cita: 'Filipenses 4:7', texto: 'Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.' },
        { cita: 'Juan 14:27', texto: 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.' },
      ],
    };

    return datosSimulados[tema.toLowerCase()] || [];
  }
}