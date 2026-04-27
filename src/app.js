/**
 * Simple Node.js Express App for CI/CD Demo
 */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello from CI/CD Demo App!', status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/add', (req, res) => {
  const { a, b } = req.query;
  const result = Number(a) + Number(b);
  res.json({ result });
});

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;