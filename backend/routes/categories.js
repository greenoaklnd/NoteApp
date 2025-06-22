const express = require('express');
const router = express.Router();
const pool = require('../db'); 

// Helper to build nested tree
function buildTree(categories) {
  const map = {};
  categories.forEach(cat => (map[cat.id] = { ...cat, children: [] }));

  const roots = [];
  categories.forEach(cat => {
    if (cat.parent_id) {
      map[cat.parent_id].children.push(map[cat.id]);
    } else {
      roots.push(map[cat.id]);
    }
  });
  return roots;
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, parent_id FROM categories ORDER BY name');
    const categories = result.rows;
    const nested = buildTree(categories);
    res.json(nested);
  } catch (error) {
    console.error('Error fetching categories', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
