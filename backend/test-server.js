const express = require('express');
const cors = require('cors');
const bibleRoutes = require('./dist/src/routes/bibleRoutes').default;
const { bibleService } = require('./dist/lib/bible/bibleService');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Rutas de la API - Bible LBLA
console.log('Adding /api/bible routes...');
console.log('bibleRoutes type:', typeof bibleRoutes);
app.use('/api/bible', bibleRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

// Start server
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });

  console.log('Initializing Bible service...');
  try {
    await bibleService.initialize();
    console.log('✅ Service ready');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

startServer().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
