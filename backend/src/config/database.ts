import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bible.db');
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

export function inicializarBaseDatos(): void {
  // Tabla de temas
  db.exec(`
    CREATE TABLE IF NOT EXISTS temas (
      tema TEXT PRIMARY KEY
    )
  `);

  // Tabla de versículos con FK a temas
  db.exec(`
    CREATE TABLE IF NOT EXISTS versiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tema_id TEXT NOT NULL,
      cita TEXT NOT NULL,
      texto TEXT NOT NULL,
      FOREIGN KEY (tema_id) REFERENCES temas(tema)
    )
  `);

  // Crear índice para búsquedas frecuentes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tema_id ON versiculos(tema_id)
  `);
}

export function obtenerBaseDatos(): Database.Database {
  return db;
}

export function cerrarBaseDatos(): void {
  db.close();
}