import Database from 'better-sqlite3';
import { Versiculo, TemaConcordancia, RegistroVersiculoDB } from '../types/index';

export class BibleService {
  private db: Database.Database;

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
   * Simula la búsqueda en Bible Gateway, limpia el formato "Cita - Texto"
   * e inserta en bloque en la base de datos
   */
  async buscarEnRedYGuardar(tema: string): Promise<TemaConcordancia> {
    // Simulación de respuesta de Bible Gateway en formato "Cita - Texto"
    const datosSimulados = this.obtenerDatosSimuladosBibleGateway(tema);

    // Iniciar transacción para inserción en bloque
    const insertarTema = this.db.prepare('INSERT OR IGNORE INTO temas (tema) VALUES (?)');
    const insertarVersiculos = this.db.prepare(
      'INSERT INTO versiculos (tema_id, cita, texto) VALUES (?, ?, ?)'
    );

    const transaccion = this.db.transaction(() => {
      insertarTema.run(tema);

      for (const versiculos of datosSimulados) {
        insertarVersiculos.run(tema, versiculos.cita, versiculos.texto);
      }
    });

    transaccion();

    return {
      tema,
      versiculos: datosSimulados,
    };
  }

  /**
   * Simula los datos obtenidos de Bible Gateway
   * Formato: "Cita - Texto"
   */
  private obtenerDatosSimuladosBibleGateway(tema: string): Versiculo[] {
    // Aquí van datos simulados según el tema
    const datosSimulados: Record<string, Versiculo[]> = {
      fe: [
        { cita: 'Hebreos 11:1', texto: 'Ahora bien, la fe es la certeza de lo que se espera, la convicción de lo que no se ve.' },
        { cita: 'Romanos 10:17', texto: 'Así que la fe viene del oír, y el oír, por la palabra de Dios.' },
        { cita: 'Marcos 11:24', texto: 'Por eso os digo que todo lo que pidáis en oración, creed que lo habéis recibido, y os vendrá.' },
        { cita: 'Efesios 2:8', texto: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios.' },
        { cita: '2 Corintios 5:7', texto: 'Porque por fe andamos, no por vista.' },
        { cita: 'Santiago 2:26', texto: 'Porque como el cuerpo sin espíritu está muerto, así también la fe sin obras está muerta.' },
        { cita: '1 Pedro 1:7', texto: 'Para que sometida a prueba vuestra fe, mucho más preciosa que el oro, el cual aunque perecedero se prueba con fuego, sea hallada en alabanza, gloria y honra cuando sea manifestado Jesucristo.' },
        { cita: 'Habacuc 2:4', texto: 'He aquí que aquel cuya alma no es recta, se enorgullecerá; mas el justo por su fe vivirá.' },
      ],
      amor: [
        { cita: '1 Juan 4:7', texto: 'Amados, amémonos los unos a los otros; porque el amor es de Dios.' },
        { cita: '1 Corintios 13:4', texto: 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece;' },
        { cita: 'Proverbios 10:12', texto: 'El odio despierta rencillas; pero el amor cubre todas las faltas.' },
        { cita: 'Juan 13:34', texto: 'Un mandamiento nuevo os doy: Que os améis los unos a los otros; como yo os he amado, que también os améis los unos a los otros.' },
        { cita: '1 Juan 4:8', texto: 'El que no ama, no ha conocido a Dios; porque Dios es amor.' },
        { cita: 'Romanos 13:8', texto: 'No debáis a nadie nada, sino el amaros unos a otros; porque el que ama al prójimo, ha cumplido la ley.' },
        { cita: '1 Pedro 4:8', texto: 'Y sobre todo, tened entre vosotros fervoroso amor; porque el amor cubrirá multitud de pecados.' },
        { cita: 'Proverbios 17:17', texto: 'En todo tiempo ama el amigo; y es como un hermano en el tiempo de angustia.' },
        { cita: '1 Corintios 13:13', texto: 'Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.' },
        { cita: 'Efesios 5:25', texto: 'Maridos, amad a vuestras mujeres, así como Cristo amó a la iglesia, y se entregó a sí mismo por ella.' },
      ],
      paciencia: [
        { cita: 'Gálatas 5:22', texto: 'Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe,' },
        { cita: 'Colosenses 3:12', texto: 'Vestiós, pues, como escogidos de Dios, santos y amados, de entrañas de misericordia, de benignidad, de humildad, de mansedumbre, de paciencia;' },
        { cita: 'Santiago 1:4', texto: 'Mas tenga la paciencia su obra completa, para que seáis perfectos y cabales, sin que os falte cosa alguna.' },
        { cita: 'Romanos 12:12', texto: 'Gozosos en la esperanza; sufridos en la tribulación; constantes en la oración.' },
        { cita: '2 Timoteo 2:24', texto: 'Porque el siervo del Señor no debe ser contencioso, sino amable para con todos, apto para enseñar, sufrido.' },
      ],
      paz: [
        { cita: 'Filipenses 4:7', texto: 'Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.' },
        { cita: 'Juan 14:27', texto: 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.' },
        { cita: 'Romanos 5:1', texto: 'Justificados, pues, por la fe, tenemos paz para con Dios por medio de nuestro Señor Jesucristo.' },
        { cita: 'Isaías 26:3', texto: 'Tu nombre es perpetuamente misericordioso; a ti te buscaremos todos los que guardan la ley.' },
        { cita: 'Proverbios 16:7', texto: 'Cuando los caminos del hombre son agradables a Jehová, aun a sus enemigos hace estar en paz con él.' },
        { cita: 'Salmos 29:11', texto: 'Jehová dará poder a su pueblo; Jehová bendecirá a su pueblo con paz.' },
      ],
      gozo: [
        { cita: 'Filipenses 4:4', texto: 'Regocijaos en el Señor siempre. Otra vez os digo: ¡Regocijaos!' },
        { cita: 'Nehemías 8:10', texto: 'Y les dijo: Andad, comed grosuras, y bebed vino dulce, y enviad porciones a los que no tienen nada preparado; porque día santo es a nuestro Señor. No os entristezcáis, porque el gozo de Jehová es vuestra fuerza.' },
        { cita: '1 Pedro 1:8', texto: 'A quien amáis sin haberle visto, en quien creyendo, aunque ahora no lo veáis, os alegráis con gozo inefable y glorioso.' },
        { cita: 'Salmos 16:11', texto: 'Me mostrarás la senda de la vida; en tu presencia hay plenitud de gozo; delicias a tu diestra para siempre.' },
      ],
      esperanza: [
        { cita: 'Romanos 15:13', texto: 'Y el Dios de esperanza os llene de todo gozo y paz en el creer, para que abundéis en esperanza por el poder del Espíritu Santo.' },
        { cita: 'Hebreos 6:19', texto: 'La cual tenemos como segura y firme ancla del alma, y que penetra hasta dentro del velo.' },
        { cita: 'Proverbios 23:18', texto: 'Porque ciertamente hay fin, y tu esperanza no será cortada.' },
        { cita: '1 Tesalonicenses 5:8', texto: 'Pero nosotros, que somos del día, seamos sobrios, habiéndonos vestido con la coraza de fe y de caridad, y con la esperanza de salvación como yelmo.' },
      ],
      gratitud: [
        { cita: 'Colosenses 3:15', texto: 'Y la paz de Dios gobierne en vuestros corazones, a la cual asimismo fuisteis llamados en un solo cuerpo; y sed agradecidos.' },
        { cita: 'Filipenses 4:6', texto: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.' },
        { cita: '1 Tesalonicenses 5:17-18', texto: 'Orad sin cesar. Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.' },
        { cita: 'Colosenses 2:7', texto: 'Arraigados y sobreedificados en él, y confirmados en la fe, así como habéis sido enseñados, abundando en acciones de gracias.' },
        { cita: 'Salmos 100:4', texto: 'Entrad por sus puertas con acción de gracias, Por sus atrios con alabanza; Alabadle, bendecid su nombre.' },
        { cita: '1 Pedro 5:7', texto: 'Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.' },
      ],
      perdón: [
        { cita: 'Efesios 4:32', texto: 'Antes sed benignos unos con otros, misericordiosos, perdonándoos unos a otros, como Dios también os perdonó a vosotros en Cristo.' },
        { cita: 'Colosenses 3:13', texto: 'Soportándoos unos a otros, y perdonándoos unos a otros si alguno tuviere queja contra otro. De la manera que Cristo os perdonó, así también hacedlo vosotros.' },
        { cita: 'Mateo 18:21-22', texto: 'Entonces se le acercó Pedro y le dijo: Señor, ¿cuántas veces perdonaré a mi hermano que peque contra mí? ¿Hasta siete? Jesús le dijo: No te digo hasta siete, sino aun hasta setenta veces siete.' },
        { cita: '1 Juan 1:9', texto: 'Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad.' },
        { cita: 'Marcos 11:25', texto: 'Y cuando estéis orando, perdonad, si tenéis algo contra alguno, para que también vuestro Padre que está en los cielos os perdone vuestras ofensas.' },
        { cita: 'Lucas 6:37', texto: 'No juzguéis, y no seréis juzgados; no condenéis, y no seréis condenados; perdonad, y seréis perdonados.' },
      ],
      sabiduría: [
        { cita: 'Santiago 1:5', texto: 'Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada.' },
        { cita: 'Proverbios 3:5-6', texto: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.' },
        { cita: 'Proverbios 1:7', texto: 'El principio de la sabiduría es el temor de Jehová; Los insensatos desprecian la sabiduría y la enseñanza.' },
        { cita: 'Proverbios 9:10', texto: 'El principio de la sabiduría es el temor de Jehová, Y el conocimiento del Santísimo es la inteligencia.' },
        { cita: 'Proverbios 8:11', texto: 'Porque mejor es la sabiduría que las piedras preciosas; Y todo lo que se puede desear, no es de compararse con ella.' },
        { cita: 'Colosenses 1:9', texto: 'Por lo cual también nosotros, desde el día que lo oímos, no cesamos de orar por vosotros, y de pedir que seáis llenos del conocimiento de su voluntad en toda sabiduría e inteligencia espiritual.' },
      ],
    };

    return datosSimulados[tema.toLowerCase()] || [];
  }
}