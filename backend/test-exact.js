const express = require('express');
const bibleRoutes = require('./dist/src/routes/bibleRoutes').default;

const app = express();

// Replicate the exact setup
app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});
app.use('/api/bible', bibleRoutes);

app.listen(3004, () => {
  console.log('Test on 3004');
  console.log('Routes:', bibleRoutes.stack.length);
});
