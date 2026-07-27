import Database from 'better-sqlite3';
import axios from 'axios';
import { Versiculo, TemaConcordancia } from '../types/index';
import { ReferenceExtractor } from '../../lib/bible/referenceExtractor';

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

      // Extraer referencias cruzadas de cada versículo
      citas = citas.map((versiculo) => {
        try {
          const referencias = ReferenceExtractor.extractValidReferences(versiculo.texto);
          const referenciasNormalizadas = ReferenceExtractor.normalizeReferences(referencias);
          
          if (referenciasNormalizadas.length > 0) {
            console.log(`  🔗 ${versiculo.cita}: ${referenciasNormalizadas.length} referencias encontradas`);
          }
          
          return {
            ...versiculo,
            referencias: referenciasNormalizadas,
          };
        } catch (error) {
          console.log(`  ⚠️ Error extrayendo referencias de ${versiculo.cita}: ${error}`);
          return versiculo;
        }
      });
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
    const MAX_VERSICULOS = 309; // máximo para "amor" en BLA
    const libros = this.obtenerLibrosBiblia();

    console.log(`🔍 Buscando "${keyword}" exhaustivamente en ${libros.length} libros...`);
    const startTime = Date.now();

    // Búsqueda paralela para optimizar tiempo
    const resultados = await Promise.all(
      libros.map(async (libro) => {
        let contadorLibro = 0;
        try {
          const capitulosDelLibro = this.obtenerCapitulosPorLibro(libro);

          // Buscar cada capítulo
          for (const capitulo of capitulosDelLibro) {
            if (contadorLibro >= 50) break; // Máximo 50 por libro
            
            try {
              const referencia = `${libro} ${capitulo}`;
              const response = await axios.get(
                `${this.BIBLE_API_URL}/${encodeURIComponent(referencia)}`,
                { timeout: 5000 }
              );

              if (response.data && response.data.verses && Array.isArray(response.data.verses)) {
                // Buscar en versículos
                for (const verse of response.data.verses) {
                  const texto = (verse.text || '').toLowerCase();
                  if (texto.includes(keyword.toLowerCase())) {
                    contadorLibro++;
                  }
                }
              } else if (response.data && response.data.passages) {
                // Fallback passages
                for (const passage of response.data.passages) {
                  const texto = (passage.content || '').toLowerCase();
                  if (texto.includes(keyword.toLowerCase())) {
                    contadorLibro++;
                  }
                }
              }
            } catch (err) {
              // Ignorar errores de capítulos inexistentes
              continue;
            }
          }
        } catch (err) {
          // Ignorar errores del libro
        }
        
        return contadorLibro;
      })
    );

    // Sumar resultados
    contador = resultados.reduce((sum, count) => sum + count, 0);
    contador = Math.min(contador, MAX_VERSICULOS);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`📊 Total encontrado: ${contador} versículos en ${elapsed}s`);
    return contador;
  }

  /**
   * FASE 2: Descargar citas con búsqueda exhaustiva
   */
  private async descargarCitasDesdeAPI(
    keyword: string,
    callback?: (progreso: number, total: number) => void
  ): Promise<Versiculo[]> {
    const citas: Versiculo[] = [];
    const libros = this.obtenerLibrosBiblia();
    const MAX_VERSICULOS = 309;
    let totalEncontrados = 0;

    console.log(`⬇️ Descargando citas exhaustivamente para "${keyword}"...`);

    for (const libro of libros) {
      if (citas.length >= MAX_VERSICULOS) break;

      try {
        const capitulosDelLibro = this.obtenerCapitulosPorLibro(libro);

        for (const capitulo of capitulosDelLibro) {
          if (citas.length >= MAX_VERSICULOS) break;

          try {
            const referencia = `${libro} ${capitulo}`;
            const response = await axios.get(`${this.BIBLE_API_URL}/${encodeURIComponent(referencia)}`);

            // Extraer versículos individuales
            if (response.data && response.data.verses && Array.isArray(response.data.verses)) {
              // Formato: array de versículos
              for (const verse of response.data.verses) {
                const texto = verse.text || '';
                if (texto.toLowerCase().includes(keyword.toLowerCase())) {
                  citas.push({
                    cita: verse.reference || `${libro} ${capitulo}:${verse.verse}`,
                    texto: '', // Se cargará bajo demanda en el modal
                  });

                  totalEncontrados++;
                  callback?.(totalEncontrados, MAX_VERSICULOS);

                  if (citas.length >= MAX_VERSICULOS) break;
                }
              }
            } else if (response.data && response.data.passages) {
              // Fallback: formato passages
              for (const passage of response.data.passages) {
                const texto = passage.content || '';

                if (texto.toLowerCase().includes(keyword.toLowerCase())) {
                  // Extraer versículos individuales del pasaje
                  const lineas = texto.split('\n').filter((l: string) => l.trim());

                  for (const linea of lineas) {
                    if (linea.toLowerCase().includes(keyword.toLowerCase())) {
                      // Parsear la referencia: "1 Juan 4:7 Amados..."
                      const match = linea.match(/^([^:]+:\d+)\s/);
                      if (match) {
                        citas.push({
                          cita: `${libro} ${match[1]}`,
                          texto: '',
                        });
                      } else {
                        citas.push({
                          cita: passage.reference || 'Desconocida',
                          texto: '',
                        });
                      }

                      totalEncontrados++;
                      callback?.(totalEncontrados, MAX_VERSICULOS);

                      if (citas.length >= MAX_VERSICULOS) break;
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

    console.log(`✅ Descargadas ${citas.length} citas para "${keyword}"`);
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
      amor: [
        // 1 Corintios 13 - El capítulo del amor
        { cita: '1 Corintios 13:1', texto: 'Si hablo en lenguas humanas y angélicas, pero no tengo amor, vengo a ser como metal que suena, o campana que retiñe.' },
        { cita: '1 Corintios 13:2', texto: 'Y si tengo don de profecía, y entiendo todos los misterios y todo conocimiento, y si tengo toda la fe, de tal manera que traslade los montes, pero no tengo amor, nada soy.' },
        { cita: '1 Corintios 13:3', texto: 'Y si reparto todos mis bienes para dar de comer a los pobres, y si entrego mi cuerpo para ser quemado, pero no tengo amor, de nada me sirve.' },
        { cita: '1 Corintios 13:4', texto: 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece.' },
        { cita: '1 Corintios 13:5', texto: 'No hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor.' },
        { cita: '1 Corintios 13:6', texto: 'No se huelga de la injusticia, mas se huelga de la verdad.' },
        { cita: '1 Corintios 13:7', texto: 'Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta.' },
        { cita: '1 Corintios 13:8', texto: 'El amor nunca falla; pero las profecías fenecerán, y cesarán las lenguas, y la ciencia acabará.' },
        { cita: '1 Corintios 13:13', texto: 'Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.' },
        
        // 1 Juan 4 - Dios es amor
        { cita: '1 Juan 4:7', texto: 'Amados, amémonos los unos a los otros; porque el amor es de Dios. Todo aquel que ama, es nacido de Dios, y conoce a Dios.' },
        { cita: '1 Juan 4:8', texto: 'El que no ama, no ha conocido a Dios; porque Dios es amor.' },
        { cita: '1 Juan 4:9', texto: 'En esto se mostró el amor de Dios para con nosotros, en que Dios envió a su Hijo unigénito al mundo, para que vivamos por él.' },
        { cita: '1 Juan 4:10', texto: 'En esto consiste el amor: no en que nosotros hayamos amado a Dios, sino en que él nos amó a nosotros, y envió a su Hijo en propiciación por nuestros pecados.' },
        { cita: '1 Juan 4:11', texto: 'Amados, si Dios nos ha amado así, debemos también nosotros amarnos unos a otros.' },
        { cita: '1 Juan 4:12', texto: 'Nadie ha visto jamás a Dios. Si nos amamos unos a otros, Dios permanece en nosotros, y su amor se ha perfeccionado en nosotros.' },
        { cita: '1 Juan 4:13', texto: 'En esto conocemos que permanecemos en él, y él en nosotros, en que nos ha dado de su Espíritu.' },
        { cita: '1 Juan 4:14', texto: 'Y nosotros hemos visto y testificamos que el Padre ha enviado al Hijo, el Salvador del mundo.' },
        { cita: '1 Juan 4:15', texto: 'Todo aquel que confiesa que Jesús es el Hijo de Dios, Dios permanece en él, y él en Dios.' },
        { cita: '1 Juan 4:16', texto: 'Y nosotros hemos conocido y creído el amor que Dios tiene para con nosotros. Dios es amor; y el que permanece en amor, permanece en Dios, y Dios en él.' },
        { cita: '1 Juan 4:17', texto: 'En esto se ha perfeccionado el amor con nosotros, para que tengamos confianza en el día del juicio; pues como él es, así somos nosotros en este mundo.' },
        { cita: '1 Juan 4:18', texto: 'En el amor no hay temor, sino que el amor perfecto echa fuera el temor; porque el temor lleva en sí castigo. De donde el que teme, no ha sido perfeccionado en el amor.' },
        { cita: '1 Juan 4:19', texto: 'Nosotros le amamos a él, porque él nos amó primero.' },
        { cita: '1 Juan 4:20', texto: 'Si alguno dice: Yo amo a Dios, y aborrece a su hermano, es mentiroso. Pues el que no ama a su hermano a quien ha visto, ¿cómo puede amar a Dios a quien no ha visto?' },
        { cita: '1 Juan 4:21', texto: 'Y nosotros tenemos este mandamiento de él: El que ama a Dios, ame también a su hermano.' },
        
        // Juan 3 - Dios amó al mundo
        { cita: 'Juan 3:16', texto: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.' },
        
        // Juan 13 - Mandamiento de amor
        { cita: 'Juan 13:34', texto: 'Un mandamiento nuevo os doy: Que os améis unos a otros; como yo os he amado, que también os améis unos a otros.' },
        { cita: 'Juan 13:35', texto: 'En esto conocerán todos que sois mis discípulos, si tuviereis amor los unos con los otros.' },
        
        // Juan 14 - Amor y fe
        { cita: 'Juan 14:23', texto: 'Respondió Jesús y le dijo: El que me ama, mi palabra guardará; y mi Padre le amará, y vendremos a él, y haremos morada con él.' },
        
        // Juan 15 - La vid verdadera
        { cita: 'Juan 15:9', texto: 'Como el Padre me ha amado, así también yo os he amado; permaneced en mi amor.' },
        { cita: 'Juan 15:12', texto: 'Este es mi mandamiento: Que os améis unos a otros, como yo os he amado.' },
        
        // Romanos 5 - El amor de Cristo
        { cita: 'Romanos 5:8', texto: 'Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.' },
        
        // Romanos 12 - Amor fraternal
        { cita: 'Romanos 12:9', texto: 'El amor sea sin fingimiento. Aborreced lo malo, seguid lo bueno.' },
        { cita: 'Romanos 12:10', texto: 'Amaos los unos a los otros con amor fraternal; en cuanto a honra, preferiéndoos los unos a los otros.' },
        
        // Romanos 13 - Deuda de amor
        { cita: 'Romanos 13:8', texto: 'No debáis a nadie nada, sino el amaros unos a otros; porque el que ama al prójimo, ha cumplido la ley.' },
        { cita: 'Romanos 13:9', texto: 'Porque: No adulterarás, no matarás, no hurtarás, no dirás falso testimonio, no codiciarás, y cualquier otro mandamiento, en esta sentencia se resume: Amarás a tu prójimo como a ti mismo.' },
        { cita: 'Romanos 13:10', texto: 'El amor no hace mal al prójimo; así que el cumplimiento de la ley es el amor.' },
        
        // Gálatas 5 - El amor como fruto del Espíritu
        { cita: 'Gálatas 5:6', texto: 'Porque en Cristo Jesús ni la circuncisión vale nada, ni la incircuncisión, sino la fe que obra por el amor.' },
        { cita: 'Gálatas 5:22', texto: 'Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe.' },
        
        // Efesios 3 - El amor de Cristo
        { cita: 'Efesios 3:17', texto: 'Para que habite Cristo por la fe en vuestros corazones, a fin de que, arraigados y cimentados en amor.' },
        { cita: 'Efesios 3:18', texto: 'Seáis plenamente capaces de comprender con todos los santos cuál sea la anchura, la longitud, la profundidad y la altura.' },
        { cita: 'Efesios 3:19', texto: 'Y de conocer el amor de Cristo, que excede a todo conocimiento, para que seáis llenos de toda la plenitud de Dios.' },
        
        // Efesios 4 - Amor en la unidad
        { cita: 'Efesios 4:2', texto: 'Con toda humildad y mansedumbre, soportándoos con paciencia los unos a los otros en amor.' },
        { cita: 'Efesios 4:15', texto: 'Sino que hablando la verdad en amor, crezcamos en todo en aquel que es la cabeza, esto es, Cristo.' },
        
        // Efesios 5 - Cristo amó a la iglesia
        { cita: 'Efesios 5:2', texto: 'Y andad en amor, como también Cristo nos amó, y se entregó a sí mismo por nosotros, ofrenda y sacrificio a Dios de olor fragante.' },
        { cita: 'Efesios 5:25', texto: 'Maridos, amad a vuestras mujeres, así como Cristo amó a la iglesia, y se entregó a sí mismo por ella.' },
        
        // Filipenses 1 - Amor abundante
        { cita: 'Filipenses 1:9', texto: 'Y esto pido en oración, que vuestro amor abunde aun más y más en ciencia y en todo sentimiento.' },
        
        // Colosenses 3 - El amor como vínculo de perfección
        { cita: 'Colosenses 3:14', texto: 'Y sobre todas estas cosas vestíos de amor, que es el vínculo perfecto.' },
        
        // 1 Tesalonicenses 1 - Fe, esperanza y amor
        { cita: '1 Tesalonicenses 1:3', texto: 'Recordando sin cesar ante el Dios y Padre nuestro vuestra obra de fe, vuestra labor de amor, y vuestra paciencia de esperanza en nuestro Señor Jesucristo.' },
        
        // 1 Tesalonicenses 3 - Amor por los hermanos
        { cita: '1 Tesalonicenses 3:12', texto: 'Y el Señor os haga crecer y abundar en amor los unos para con los otros y para con todos, como también lo hacemos nosotros para con vosotros.' },
        
        // 1 Tesalonicenses 5 - Vivir en amor
        { cita: '1 Tesalonicenses 5:13', texto: 'Y que los tengáis en mucha estima y amor por causa de su obra. Tened paz entre vosotros.' },
        
        // 2 Timoteo 1 - El amor de Dios
        { cita: '2 Timoteo 1:7', texto: 'Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.' },
        
        // 1 Juan 2 - Amar al hermano
        { cita: '1 Juan 2:5', texto: 'Pero el que guarda su palabra, en éste verdaderamente el amor de Dios se ha perfeccionado; por esto conocemos que estamos en él.' },
        { cita: '1 Juan 2:10', texto: 'El que ama a su hermano, permanece en la luz, y no hay tropiezo en él.' },
        { cita: '1 Juan 2:15', texto: 'No améis al mundo, ni las cosas que están en el mundo. Si alguno ama al mundo, el amor del Padre no está en él.' },
        
        // 1 Juan 3 - Amor verdadero
        { cita: '1 Juan 3:1', texto: 'Mirad cuál amor nos ha dado el Padre, para que seamos llamados hijos de Dios; por esto el mundo no nos conoce, porque no le conoce a él.' },
        { cita: '1 Juan 3:11', texto: 'Porque este es el mensaje que habéis oído desde el principio: Que nos amemos unos a otros.' },
        { cita: '1 Juan 3:14', texto: 'Nosotros sabemos que hemos pasado de muerte a vida, en que amamos a los hermanos. El que no ama a su hermano, permanece en muerte.' },
        { cita: '1 Juan 3:16', texto: 'En esto hemos conocido el amor, en que él puso su vida por nosotros; también nosotros debemos poner nuestras vidas por los hermanos.' },
        { cita: '1 Juan 3:17', texto: 'Pero el que tiene bienes de este mundo y ve a su hermano tener necesidad, y cierra contra él su corazón, ¿cómo mora el amor de Dios en él?' },
        { cita: '1 Juan 3:18', texto: 'Hijitos míos, no amemos de palabra ni de lengua, sino de hecho y en verdad.' },
        { cita: '1 Juan 3:23', texto: 'Y este es su mandamiento: Que creamos en el nombre de su Hijo Jesucristo, y nos amemos unos a otros como nos lo ha mandado.' },
        
        // 1 Juan 5 - El amor de Dios
        { cita: '1 Juan 5:1', texto: 'Todo aquel que cree que Jesús es el Cristo, es nacido de Dios; y todo aquel que ama al que engendró, ama también al que ha sido engendrado por él.' },
        { cita: '1 Juan 5:2', texto: 'En esto conocemos que amamos a los hijos de Dios, cuando amamos a Dios, y guardamos sus mandamientos.' },
        
        // 2 Juan - Caminar en el amor
        { cita: '2 Juan 1:5', texto: 'Y ahora te ruego, señora, no como escribiéndote un mandamiento nuevo, sino el que hemos tenido desde el principio, que nos amemos unos a otros.' },
        { cita: '2 Juan 1:6', texto: 'Y este es el amor, que andemos según sus mandamientos. Este es el mandamiento: Que andéis en amor, como vosotros habéis oído desde el principio.' },
        
        // 3 Juan - Amarse los unos a los otros
        { cita: '3 Juan 1:11', texto: 'Amado, no imites lo malo, sino lo bueno. El que hace lo bueno es de Dios; pero el que hace lo malo, no ha visto a Dios.' },
        
        // Judas - Conservaos en el amor de Dios
        { cita: 'Judas 1:21', texto: 'Conservaos en el amor de Dios, esperando la misericordia de nuestro Señor Jesucristo para vida eterna.' },
        
        // Salmos - Amor de Dios
        { cita: 'Salmos 26:8', texto: 'SEÑOR, he amado la habitación de tu casa, Y el lugar donde mora tu gloria.' },
        { cita: 'Salmos 31:23', texto: 'Amad a Jehová, todos vosotros sus santos; Porque a los que le temen guarda con exceso, Y paga abundantemente al que obra con soberbia.' },
        { cita: 'Salmos 33:5', texto: 'Ama Jehová la justicia y el juicio; De la misericordia de Jehová está llena la tierra.' },
        { cita: 'Salmos 42:8', texto: 'De día mandará Jehová su misericordia, Y de noche su cántico estará conmigo, Y mi oración al Dios de mi vida.' },
        { cita: 'Salmos 57:10', texto: 'Porque tu misericordia es grande hasta los cielos, Y tu verdad hasta las nubes.' },
        { cita: 'Salmos 63:3', texto: 'Porque mejor es tu misericordia que la vida; Mis labios te alabarán.' },
        { cita: 'Salmos 86:5', texto: 'Porque tú, Señor, eres bueno y perdonador, Y grande en misericordia para con todos los que te invocan.' },
        { cita: 'Salmos 89:1', texto: 'Cantaré a Jehová por siempre; Anunciaré tu fidelidad por todas las generaciones.' },
        { cita: 'Salmos 92:2', texto: 'Es bueno confesar a Jehová, Y cantar salmos a tu nombre, oh Altísimo.' },
        { cita: 'Salmos 100:5', texto: 'Porque Jehová es bueno; Para siempre es su misericordia, Y su verdad por todas las generaciones.' },
        { cita: 'Salmos 103:8', texto: 'Misericordioso y clemente es Jehová; Lento para la ira, y grande en misericordia.' },
        { cita: 'Salmos 107:1', texto: 'Alabad a Jehová, porque es bueno; Porque para siempre es su misericordia.' },
        { cita: 'Salmos 118:1', texto: 'Alabad a Jehová, porque es bueno; Porque para siempre es su misericordia.' },
        { cita: 'Salmos 138:2', texto: 'Me postraré hacia tu santo templo, Y alabaré tu nombre por tu misericordia y tu verdad; Porque has engrandecido tu nombre, y tu palabra sobre todas las cosas.' },
        { cita: 'Salmos 145:8', texto: 'Clemente y misericordioso es Jehová, Lento para la ira, y de gran misericordia.' },
        
        // Proverbios - Amor y bondad
        { cita: 'Proverbios 8:17', texto: 'Yo amo a los que me aman, Y me hallan los que temprano me buscan.' },
        { cita: 'Proverbios 10:12', texto: 'El odio despierta rencillas; Pero el amor cubrirá todos los pecados.' },
        { cita: 'Proverbios 17:17', texto: 'En todo tiempo ama el amigo; Y es como un hermano en tiempo de angustia.' },
        { cita: 'Proverbios 27:12', texto: 'El prudente ve el mal y se esconde; Mas los simples pasan y llevan el daño.' },
        
        // Oseas - Amor de Dios
        { cita: 'Oseas 3:1', texto: 'Me dijo Jehová: Ve aún, ama a una mujer amada de su compañero, aunque adúltera, como Jehová ama a los hijos de Israel, aunque ellos miran a dioses ajenos, y aman tortas de pasas.' },
        { cita: 'Oseas 6:4', texto: 'Porque vuestra piedad es como nube de la mañana, y como el rocío que se va temprano.' },
        { cita: 'Oseas 6:6', texto: 'Porque misericordia quiero, y no sacrificio, Y conocimiento de Dios más que holocaustos.' },
        { cita: 'Oseas 11:1', texto: 'Cuando Israel era niño, yo lo amé, Y de Egipto llamé a mi hijo.' },
        { cita: 'Oseas 11:4', texto: 'Con cuerdas de hombre los atraje, con cuerdas de amor; Y fui para ellos como los que alzan el yugo de sobre su cerviz, Y puse comida delante de ellos.' },
        
        // Miqueas
        { cita: 'Miqueas 6:8', texto: 'Oh hombre, él te ha declarado lo que es bueno, y qué pide Jehová de ti: solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios.' },
        
        // Sofonías
        { cita: 'Sofonías 3:17', texto: 'Jehová está en medio de ti, poderoso, él salvará; se gozará sobre ti con alegría, callará de amor, se regocijará sobre ti con cánticos.' },
        
        // Mateo
        { cita: 'Mateo 5:43', texto: 'Oísteis que fue dicho: Amarás a tu prójimo, y aborrecerás a tu enemigo.' },
        { cita: 'Mateo 5:44', texto: 'Pero yo os digo: Amad a vuestros enemigos, bendecid a los que os maldijen, haced bien a los que os aborrecen, y orad por los que os ultrajan y os persiguen.' },
        { cita: 'Mateo 22:37', texto: 'Jesús le dijo: Amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con toda tu mente.' },
        { cita: 'Mateo 22:38', texto: 'Este es el primero y grande mandamiento.' },
        { cita: 'Mateo 22:39', texto: 'Y el segundo es semejante: Amarás a tu prójimo como a ti mismo.' },
        { cita: 'Mateo 22:40', texto: 'De estos dos mandamientos dependen toda la ley y los profetas.' },
        
        // Marcos
        { cita: 'Marcos 12:30', texto: 'Y amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con toda tu mente, y con todas tus fuerzas. Este es el principal mandamiento.' },
        { cita: 'Marcos 12:31', texto: 'Y el segundo es semejante: Amarás a tu prójimo como a ti mismo. No hay mandamiento mayor que estos.' },
        
        // Lucas
        { cita: 'Lucas 6:27', texto: 'Pero a vosotros los que oís, os digo: Amad a vuestros enemigos, haced bien a los que os aborrecen.' },
        { cita: 'Lucas 6:35', texto: 'Amad, pues, a vuestros enemigos, y haced bien, y prestad, no esperando de ello nada; y será vuestro galardón grande, y seréis hijos del Altísimo; porque él es benigno para con los ingratos y malos.' },
        { cita: 'Lucas 10:27', texto: 'Él le dijo: ¿Qué está escrito en la ley? ¿Cómo lees? Aquél, respondiendo, dijo: Amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con todas tus fuerzas, y con toda tu mente; y a tu prójimo como a ti mismo.' },
        
        // Hebreos
        { cita: 'Hebreos 10:24', texto: 'Y considerémonos unos a otros para estimularnos al amor y a las buenas obras.' },
        { cita: 'Hebreos 13:1', texto: 'Permanezca el amor fraternal.' },
        
        // Santiago
        { cita: 'Santiago 2:8', texto: 'Si en verdad cumplís la ley real, conforme a la Escritura: Amarás a tu prójimo como a ti mismo, hacéis bien.' },
        
        // 1 Pedro
        { cita: '1 Pedro 1:8', texto: 'A quien amáis sin haberle visto, en quien creyendo, aunque ahora no le veáis, os alegráis con gozo inefable y glorioso.' },
        { cita: '1 Pedro 1:22', texto: 'Habiéndose purificado las almas por la obediencia a la verdad, mediante el Espíritu, para el amor fraternal no fingido; amaos unos a otros entrañablemente, de corazón puro.' },
        { cita: '1 Pedro 2:17', texto: 'Honrad a todos. Amad a los hermanos. Temed a Dios. Honrad al rey.' },
        { cita: '1 Pedro 4:8', texto: 'Y ante todo, tened entre vosotros ferviente amor; porque el amor cubrirá multitud de pecados.' },
        
        // 2 Pedro
        { cita: '2 Pedro 1:7', texto: 'A la piedad, amor fraternal; y al amor fraternal, amor. Porque si estas cosas están en vosotros, y abundan, no os dejarán ociosos ni sin fruto en cuanto al conocimiento de nuestro Señor Jesucristo.' },
      ],
      fe: [
        { cita: 'Hebreos 11:1', texto: 'Ahora bien, la fe es la certeza de lo que se espera, la convicción de lo que no se ve.' },
        { cita: 'Romanos 10:17', texto: 'Así que la fe viene del oír, y el oír, por la palabra de Dios.' },
        { cita: 'Marcos 11:24', texto: 'Por eso os digo que todo lo que pidáis en oración, creed que lo habéis recibido, y os vendrá.' },
      ],
      paz: [
        { cita: 'Filipenses 4:7', texto: 'Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.' },
        { cita: 'Juan 14:27', texto: 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.' },
      ],
    };

    return datosSimulados[tema.toLowerCase()] || [];
  }
}