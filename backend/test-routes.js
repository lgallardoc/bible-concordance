const express = require('express');

const app = express();

// Test 1: Direct route (like legacy concordancia)
app.get('/api/test/direct', (req, res) => {
  res.json({ test: 'direct route works' });
});

// Test 2: Router on /api/test2
const router = express.Router();
router.get('/status', (req, res) => {
  res.json({ test: 'router route works' });
});
app.use('/api/test2', router);

// Test 3: Router on /api/bible (simulating the real setup)
const bibRouter = express.Router();
bibRouter.get('/status', (req, res) => {
  res.json({ test: 'bible router works' });
});
app.use('/api/bible', bibRouter);

app.listen(3003, () => console.log('Test on 3003'));
