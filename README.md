# 📖 Bible Concordance

Una aplicación web interactiva para explorar concordancias bíblicas con visualización de grafos conceptuales. Permite buscar temas, ver versículos relacionados y comprender la relación entre ellos mediante un mapa visual.

## 🎯 Características

- ✅ **Búsqueda de temas bíblicos**: Encuentra versículos relacionados con un tema
- ✅ **Visualización con grafos**: Mapa conceptual interactivo usando React Flow
- ✅ **Sistema de caché**: Cache en memoria (Frontend) y base de datos (Backend)
- ✅ **Múltiples fuentes**: Caché → Base de datos → Red (Simulada)
- ✅ **Interfaz responsiva**: Diseño moderno y fácil de usar
- ✅ **Temas predefinidos**: fe, amor, paz, gozo, esperanza, sabiduría, paciencia, fortaleza, perdón, gratitud

## 🏗️ Arquitectura

### Stack Tecnológico

```
Frontend (React + TypeScript)
    ↓
API REST (Express + TypeScript)
    ↓
Base de Datos (SQLite)
```

### Componentes

#### **Frontend** (`/frontend`)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Visualización de Grafos**: React Flow + Dagre (layout automático)
- **API Client**: Fetch API con proxy a backend

**Estructura de carpetas:**
```
frontend/
├── src/
│   ├── App.tsx                 # Componente principal
│   ├── App.css                 # Estilos
│   ├── main.tsx                # Entry point
│   ├── api/
│   │   └── client.ts           # Cliente HTTP para API
│   ├── types/
│   │   └── index.ts            # Tipos TypeScript compartidos
│   └── utils/
│       └── graphLayout.tsx     # Cálculo de layout con Dagre
├── index.html
├── vite.config.ts
└── tsconfig.json
```

**Flujo de datos:**
1. Usuario ingresa un tema en el formulario
2. Frontend hace request a `/api/concordancia?tema={tema}`
3. Backend busca en caché local → BD → red (simulada)
4. Response incluye versículos y fuente de datos
5. Frontend calcula layout con Dagre
6. React Flow renderiza el grafo interactivo

#### **Backend** (`/backend`)
- **Framework**: Express.js + TypeScript
- **Base de Datos**: SQLite (better-sqlite3)
- **Puerto**: 3000

**Estructura de carpetas:**
```
backend/
├── src/
│   ├── index.ts                # Servidor Express principal
│   ├── config/
│   │   └── database.ts         # Inicialización de SQLite
│   ├── controllers/
│   │   └── concordanciaController.ts  # Lógica de rutas
│   ├── services/
│   │   └── bibleService.ts     # Lógica de búsqueda
│   └── types/
│       └── index.ts            # Tipos TypeScript compartidos
├── tsconfig.json
├── bible.db                    # Base de datos SQLite
└── dist/                       # Compilado (generado)
```

**Estrategia Cache-First:**
```
Request → Cache (Frontend) → BD (SQLite) → Red (Simulada) → BD → Cache
```

### Rutas API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/concordancia?tema={tema}` | Busca versículos para un tema |
| POST | `/api/cache/limpiar` | Limpia el caché en memoria del backend |
| GET | `/health` | Health check del servidor |

### Respuesta de API

```json
{
  "source": "cache|database|network",
  "data": {
    "tema": "amor",
    "versiculos": [
      {
        "cita": "1 Juan 4:7",
        "texto": "Amados, amémonos los unos a los otros..."
      }
    ]
  }
}
```

### Base de Datos

**Esquema SQLite:**

```sql
-- Tabla de temas
CREATE TABLE temas (
  tema TEXT PRIMARY KEY
);

-- Tabla de versículos
CREATE TABLE versiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tema_id TEXT NOT NULL,
  cita TEXT NOT NULL,
  texto TEXT NOT NULL,
  FOREIGN KEY (tema_id) REFERENCES temas(tema)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_tema_id ON versiculos(tema_id);
```

## 🚀 Instalación

### Requisitos
- Node.js 18+
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/lgallardoc/bible-concordance.git
cd bible-concordance
```

2. **Instalar dependencias**
```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd ../frontend
npm install
```

3. **Compilar el backend**
```bash
cd backend
npx tsc
```

4. **Iniciar el backend**
```bash
cd backend
node dist/index.js
# Servidor ejecutándose en http://localhost:3000
```

5. **Iniciar el frontend** (en otra terminal)
```bash
cd frontend
npm run dev
# Aplicación disponible en http://localhost:5173
```

## 📚 Temas Disponibles

| Tema | Versículos |
|------|-----------|
| fe | 8 |
| amor | 10 |
| paz | 6 |
| gozo | 4 |
| esperanza | 4 |
| sabiduría | 3 |
| paciencia | 5 |
| fortaleza | 4 |
| perdón | 3 |
| gratitud | 3 |

## 🔍 Uso

1. Abre http://localhost:5173 en tu navegador
2. Escribe un tema en el buscador o haz clic en los botones de temas sugeridos
3. Visualiza el mapa conceptual con los versículos relacionados
4. Interactúa con el grafo (zoom, pan, seleccionar nodos)
5. Usa "Limpiar caché" para limpiar la memoria

## 🛠️ Desarrollo

### Scripts disponibles

**Backend:**
```bash
npm run dev    # Compilar y ejecutar con nodemon (si está configurado)
npx tsc        # Compilar TypeScript
node dist/index.js  # Ejecutar servidor compilado
```

**Frontend:**
```bash
npm run dev    # Servidor de desarrollo con Vite
npm run build  # Compilar para producción
npm run preview # Previsualizar build de producción
```

### Estructura de tipos

Los tipos compartidos se encuentran en:
- `backend/src/types/index.ts`
- `frontend/src/types/index.ts`

```typescript
interface Versiculo {
  cita: string;
  texto: string;
}

interface TemaConcordancia {
  tema: string;
  versiculos: Versiculo[];
}
```

## 🎨 Personalización

### Agregar nuevos temas

Edita `backend/src/services/bibleService.ts`:

```typescript
private obtenerDatosSimuladosBibleGateway(tema: string): Versiculo[] {
  const datosSimulados: Record<string, Versiculo[]> = {
    // Agregar aquí
    "nuevo-tema": [
      { cita: "Libro X:Y", texto: "Texto del versículo..." },
    ],
  };
  return datosSimulados[tema.toLowerCase()] || [];
}
```

### Modificar colores del grafo

Edita `frontend/src/utils/graphLayout.tsx`:
```typescript
// Tema (nodo raíz)
background: '#4f46e5',  // Color de fondo
border: '2px solid #4338ca',  // Color del borde

// Versículos
background: '#f3f4f6',  // Color de fondo
border: '1px solid #d1d5db',  // Color del borde
```

## 📦 Dependencias Principales

### Backend
- express: Framework web
- better-sqlite3: Base de datos SQLite
- cors: Manejo de CORS
- typescript: Lenguaje

### Frontend
- react: Librería UI
- reactflow: Visualización de grafos
- dagre: Algoritmo de layout para grafos
- typescript: Lenguaje

## 🔐 Seguridad

- ✅ CORS habilitado para localhost
- ✅ Foreign keys habilitadas en SQLite
- ✅ Validación de entrada en frontend y backend
- ✅ TypeScript para type-safety

## 📋 Notas

- Los datos de versículos están simulados en el backend
- Para integrar datos reales, reemplaza `obtenerDatosSimuladosBibleGateway()` con una llamada a Bible Gateway API
- El caché del frontend se limpia con el botón "Limpiar caché"
- La base de datos SQLite se genera automáticamente en `backend/bible.db`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 👨‍💻 Autor

- **Luis Gallardo** - [lgallardoc](https://github.com/lgallardoc)

## 🙏 Agradecimientos

- Bible Gateway por la inspiración
- React Flow por la visualización de grafos
- Dagre por los algoritmos de layout

---

**Última actualización**: 27 de Julio de 2026