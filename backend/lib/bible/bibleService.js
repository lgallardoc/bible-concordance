"use strict";
/**
 * Servicio principal de Bible con integración LBLA
 * Descarga, cachea, indexa y proporciona búsqueda
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bibleService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const fuse_js_1 = __importDefault(require("fuse.js"));
const referenceParser_1 = require("../bible/referenceParser");
// Configuración
const LBLA_URL = 'https://mrk214.github.io/bible-data-es-spa/data/es___spa___spa/LBLA_vid_89.json';
const CACHE_DIR = path_1.default.join(__dirname, '../../data/.cache');
const CACHE_FILE = path_1.default.join(CACHE_DIR, 'LBLA_vid_89.json');
const INDEX_FILE = path_1.default.join(CACHE_DIR, 'index-v1.json');
class BibleService {
    constructor() {
        this.index = null;
        this.fuse = null;
        this.isInitialized = false;
        this.isInitializing = false;
    }
    /**
     * Inicializar el servicio: cargar caché, construir índice
     */
    async initialize() {
        if (this.isInitialized || this.isInitializing)
            return;
        this.isInitializing = true;
        try {
            // Crear directorio si no existe
            if (!fs_1.default.existsSync(CACHE_DIR)) {
                fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
            }
            // Intentar cargar índice serializado
            if (fs_1.default.existsSync(INDEX_FILE)) {
                console.log('📚 Cargando índice desde caché...');
                this.index = JSON.parse(fs_1.default.readFileSync(INDEX_FILE, 'utf-8'));
                this._initFuse();
                this.isInitialized = true;
                this.isInitializing = false;
                console.log('✅ Índice cargado. Total versículos:', this.index.totalVerses);
                return;
            }
            // Si no hay índice, construirlo
            console.log('🔄 Construyendo índice (primera vez)...');
            await this.buildIndex();
            this.isInitialized = true;
            this.isInitializing = false;
            console.log('✅ Índice construido exitosamente');
        }
        catch (error) {
            this.isInitializing = false;
            console.error('❌ Error inicializando servicio:', error);
            throw error;
        }
    }
    /**
     * Construir el índice completo desde LBLA
     */
    async buildIndex() {
        // Descargar o cargar LBLA
        let lblaData;
        if (fs_1.default.existsSync(CACHE_FILE)) {
            console.log('📂 LBLA encontrada en caché local');
            lblaData = JSON.parse(fs_1.default.readFileSync(CACHE_FILE, 'utf-8'));
        }
        else {
            console.log('📡 Descargando LBLA desde internet (~30MB)...');
            try {
                const response = await axios_1.default.get(LBLA_URL, {
                    timeout: 60000,
                    responseType: 'json',
                });
                lblaData = response.data;
                // Guardar en caché
                fs_1.default.writeFileSync(CACHE_FILE, JSON.stringify(lblaData), 'utf-8');
                console.log('💾 LBLA guardada en caché');
            }
            catch (error) {
                console.error('❌ Error descargando LBLA:', error);
                throw error;
            }
        }
        // Procesar y construir índice
        const verses = [];
        const invertedIndex = {};
        let bookCount = 0;
        for (const book of lblaData) {
            bookCount++;
            if (bookCount % 5 === 0) {
                console.log(`  📖 Procesando libro ${bookCount}/${lblaData.length}...`);
            }
            for (const chapter of book.chapters || []) {
                for (const verse of chapter.verses || []) {
                    const reference = `${book.name} ${chapter.number}:${verse.number}`;
                    const text = verse.text || '';
                    verses.push({
                        reference,
                        book: book.name,
                        chapter: chapter.number,
                        verse: verse.number,
                        text,
                    });
                    // Construir índice invertido (por palabra)
                    const words = this._tokenize(text);
                    for (const word of words) {
                        if (!invertedIndex[word]) {
                            invertedIndex[word] = { references: new Set(), count: 0 };
                        }
                        invertedIndex[word].references.add(reference);
                        invertedIndex[word].count += 1;
                    }
                }
            }
        }
        // Convertir Sets a arrays para serialización
        const serializedIndex = {};
        for (const [word, data] of Object.entries(invertedIndex)) {
            serializedIndex[word] = {
                references: Array.from(data.references),
                count: data.count,
            };
        }
        // Crear IndexData
        this.index = {
            version: '1.0',
            timestamp: Date.now(),
            totalVerses: verses.length,
            verses,
            invertedIndex: serializedIndex,
        };
        // Guardar índice
        fs_1.default.writeFileSync(INDEX_FILE, JSON.stringify(this.index), 'utf-8');
        this._initFuse();
    }
    /**
     * Inicializar Fuse para búsqueda fuzzy
     */
    _initFuse() {
        if (!this.index)
            return;
        this.fuse = new fuse_js_1.default(this.index.verses, {
            keys: ['text', 'reference'],
            threshold: 0.3,
            minMatchCharLength: 2,
            includeScore: true,
        });
    }
    /**
     * Tokenizar texto (palabras simples)
     */
    _tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^a-záéíóúñ\s]/g, '') // Remover puntuación
            .split(/\s+/)
            .filter(w => w.length > 2); // Solo palabras con 3+ caracteres
    }
    /**
     * Obtener un pasaje por referencia
     */
    async getPassage(reference) {
        if (!this.index)
            await this.initialize();
        try {
            const parsed = referenceParser_1.BibleReferenceParser.parse(reference);
            const verse = this.index.verses.find(v => v.book === parsed.book &&
                v.chapter === parsed.chapter &&
                v.verse === parsed.startVerse);
            return verse
                ? {
                    book: verse.book,
                    chapter: verse.chapter,
                    number: verse.verse,
                    text: verse.text,
                }
                : null;
        }
        catch (error) {
            console.error('Error obteniendo pasaje:', error);
            return null;
        }
    }
    /**
     * Obtener un rango de versículos
     */
    async getPassageRange(reference) {
        if (!this.index)
            await this.initialize();
        try {
            const parsed = referenceParser_1.BibleReferenceParser.parse(reference);
            return this.index.verses.filter(v => v.book === parsed.book &&
                v.chapter === parsed.chapter &&
                v.verse >= parsed.startVerse &&
                v.verse <= parsed.endVerse);
        }
        catch (error) {
            console.error('Error obteniendo rango:', error);
            return [];
        }
    }
    /**
     * Buscar por texto (fuzzy)
     */
    async searchByText(query, options = {}) {
        if (!this.fuse || !this.index)
            await this.initialize();
        const { limit = 20, fuzzy = true } = options;
        const results = this.fuse.search(query, { limit });
        return results.map(result => ({
            reference: result.item.reference,
            score: 1 - (result.score || 0), // Invertir score (0-1)
            snippet: this._makeSnippet(result.item.text, query, 100),
        }));
    }
    /**
     * Concordancia: buscar palabra y listar todas las referencias
     */
    async concordance(term, options = {}) {
        if (!this.index)
            await this.initialize();
        const { limit = 1000 } = options;
        const normalizedTerm = term.toLowerCase();
        const wordData = this.index.invertedIndex[normalizedTerm];
        if (!wordData) {
            return {
                term,
                totalOccurrences: 0,
                references: [],
            };
        }
        // Construir resultado detallado
        const references = wordData.references.slice(0, limit).map(ref => {
            const verse = this.index.verses.find(v => v.reference === ref);
            return {
                reference: ref,
                occurrences: 1, // Simplificado: asumir 1 por referencia
                snippets: verse ? [this._makeSnippet(verse.text, term, 80)] : [],
            };
        });
        return {
            term,
            totalOccurrences: wordData.count,
            references,
        };
    }
    /**
     * Contar referencias por concepto (clave o semántica simple)
     */
    async countByTopic(topic, options = {}) {
        if (!this.index)
            await this.initialize();
        const { semantic = false } = options;
        if (!semantic) {
            // Búsqueda simple por palabra clave
            const concordance = await this.concordance(topic, { limit: 1000 });
            return {
                topic,
                count: concordance.totalOccurrences,
                references: concordance.references.map(r => r.reference),
            };
        }
        // Opción semántica (TODO: integrar con embeddings)
        return {
            topic,
            count: 0,
            references: [],
        };
    }
    /**
     * Obtener versículo aleatorio
     */
    async getRandomVerse() {
        if (!this.index)
            await this.initialize();
        const verses = this.index.verses;
        const random = verses[Math.floor(Math.random() * verses.length)];
        return {
            book: random.book,
            chapter: random.chapter,
            number: random.verse,
            text: random.text,
        };
    }
    /**
     * Obtener estado del servicio
     */
    getStatus() {
        return {
            ready: this.isInitialized,
            totalVerses: this.index?.totalVerses || 0,
            cacheExists: fs_1.default.existsSync(CACHE_FILE),
            indexExists: fs_1.default.existsSync(INDEX_FILE),
        };
    }
    /**
     * Reconstruir índice (limpiar caché)
     */
    async rebuildIndex() {
        if (fs_1.default.existsSync(INDEX_FILE)) {
            fs_1.default.unlinkSync(INDEX_FILE);
        }
        if (fs_1.default.existsSync(CACHE_FILE)) {
            fs_1.default.unlinkSync(CACHE_FILE);
        }
        this.index = null;
        this.fuse = null;
        this.isInitialized = false;
        await this.initialize();
    }
    /**
     * Helper: hacer snippet de texto
     */
    _makeSnippet(text, query, maxLength) {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) {
            return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
        }
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + query.length + 20);
        let snippet = text.substring(start, end);
        if (start > 0)
            snippet = '...' + snippet;
        if (end < text.length)
            snippet = snippet + '...';
        return snippet;
    }
}
// Exportar instancia singleton
exports.bibleService = new BibleService();
