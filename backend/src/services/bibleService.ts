import Database from 'better-sqlite3';
import axios from 'axios';
import { Versiculo, TemaConcordancia } from '../types/index';

export class BibleService {
  private db: Database.Database;
  private readonly BIBLE_API_URL = 'https://www.bible-api.com';

  constructor(db: Database.Database) {
    this.db = db;
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
   * Busca en la API real de Bible, con fallback a datos simulados
   */
  async buscarEnRedYGuardar(tema: string): Promise<TemaConcordancia> {
    let versiculos: Versiculo[] = [];

    try {
      // Intentar obtener de API real
      console.log(`🔍 Buscando "${tema}" en Bible API...`);
      versiculos = await this.buscarEnBibleAPI(tema);

      if (versiculos.length === 0) {
        console.log(`⚠️ No se encontraron resultados en API para "${tema}", usando datos simulados`);
        versiculos = this.obtenerDatosSimuladosBibleGateway(tema);
      } else {
        console.log(`✅ Encontrados ${versiculos.length} versículos en Bible API para "${tema}"`);
      }
    } catch (error) {
      console.log(`❌ Error al consultar API: ${error}, usando datos simulados`);
      versiculos = this.obtenerDatosSimuladosBibleGateway(tema);
    }

    // Guardar en BD
    this.guardarEnBaseDatos(tema, versiculos);

    return {
      tema,
      versiculos,
    };
  }

  /**
   * Busca versículos en Bible API que contengan la palabra clave
   */
  private async buscarEnBibleAPI(keyword: string): Promise<Versiculo[]> {
    const versiculos: Versiculo[] = [];
    const libros = this.obtenerLibrosBiblia();

    for (const libro of libros) {
      if (versiculos.length >= 300) break;

      try {
        const capitulosDelLibro = this.obtenerCapitulosPorLibro(libro);

        for (const capitulo of capitulosDelLibro) {
          if (versiculos.length >= 300) break;

          try {
            const referencia = `${libro} ${capitulo}`;
            const response = await axios.get(`${this.BIBLE_API_URL}/?passage=${encodeURIComponent(referencia)}`);

            if (response.data && response.data.passages) {
              for (const passage of response.data.passages) {
                const texto = passage.content || '';

                if (texto.toLowerCase().includes(keyword.toLowerCase())) {
                  const versos = this.extraerVersiculos(passage, keyword);
                  versiculos.push(...versos);

                  if (versiculos.length >= 300) break;
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

    return versiculos.slice(0, 300);
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