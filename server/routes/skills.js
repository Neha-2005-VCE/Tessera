import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import axios from "axios";
import multer from 'multer';
const upload = multer({ dest: 'uploads/' }); 
import fs from 'fs';
import FormData from 'form-data';

const router = express.Router();

// Get user's skills
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get skills list
    const skillsResult = await pool.query(
      'SELECT title, category, strength FROM skills WHERE user_id = $1 ORDER BY category, title',
      [req.user.id]
    );

    // Get skills tree
    const treeResult = await pool.query(
      'SELECT tree_data FROM skills_tree WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    const skills = {
      list: skillsResult.rows,
      tree: treeResult.rows.length > 0 ? treeResult.rows[0].tree_data : null
    };

    res.json(skills);
  } catch (error) {
    console.error('Skills fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Save skills data (from file upload processing)
router.post('/', authenticateToken, async (req, res) => {
  const { skills, tree } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Clear existing skills for this user
    await client.query('DELETE FROM skills WHERE user_id = $1', [req.user.id]);
    await client.query('DELETE FROM skills_tree WHERE user_id = $1', [req.user.id]);

    // Insert new skills
    for (const skill of skills) {
      await client.query(
        'INSERT INTO skills (user_id, title, category, strength) VALUES ($1, $2, $3, $4)',
        [req.user.id, skill.title, skill.category, skill.strength]
      );
    }

    // Insert skills tree
    if (tree) {
      await client.query(
        'INSERT INTO skills_tree (user_id, tree_data) VALUES ($1, $2)',
        [req.user.id, JSON.stringify(tree)]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Skills saved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Skills save error:', error);
    res.status(500).json({ error: 'Failed to save skills' });
  } finally {
    client.release();
  }
});

// Get skills comparison data
router.get('/compare', authenticateToken, async (req, res) => {
  try {
    // Get other users with their skills for comparison
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.user_type, u.company, u.role, u.institute,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'title', s.title,
              'category', s.category,
              'strength', s.strength
            )
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'::json
        ) as skills
      FROM users u
      LEFT JOIN skills s ON u.id = s.user_id
      WHERE u.id != $1
      GROUP BY u.id, u.name, u.user_type, u.company, u.role, u.institute
      HAVING COUNT(s.id) > 0
      LIMIT 20
    `, [req.user.id]);

    const users = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      role: row.role || `${row.user_type.charAt(0).toUpperCase()}${row.user_type.slice(1)}`,
      company: row.company || row.institute,
      skills: row.skills
    }));

    res.json(users);
  } catch (error) {
    console.error('Skills comparison fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

// Mock file upload endpoint (simulates Flask API)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const FLASK_API_URL = "http://127.0.0.1:5000";
    const file = req.file;
    let mockSkillsData = {};

    // Call Flask API with file
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(file.path), file.originalname);
      form.append('filet', "pdf");

      const response = await axios.post(`${FLASK_API_URL}/submit`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      console.log('Flask API response:', response.data);

      mockSkillsData = {
        tree: response.data.tree,
        list: response.data.list
      };
    } catch (error) {
      console.warn('Flask API failed. Using default data.');
      await new Promise(resolve => setTimeout(resolve, 2000));

       mockSkillsData = {
      tree: {
        title: "Skills",
        strength: 8,
        children: [
          {
            title: "Frontend",
            strength: 7,
            children: [
              { title: "React", strength: 8 },
              { title: "JavaScript", strength: 7 },
              { title: "TypeScript", strength: 6 },
              { title: "HTML/CSS", strength: 9 }
            ]
          },
          {
            title: "Backend",
            strength: 6,
            children: [
              { title: "Node.js", strength: 7 },
              { title: "Python", strength: 5 },
              { title: "SQL", strength: 6 }
            ]
          },
          {
            title: "Tools",
            strength: 7,
            children: [
              { title: "Git", strength: 8 },
              { title: "Docker", strength: 5 },
              { title: "AWS", strength: 4 }
            ]
          }
        ]
      },
      list: [
        { title: "React", category: "Frontend", strength: 8 },
        { title: "JavaScript", category: "Frontend", strength: 7 },
        { title: "TypeScript", category: "Frontend", strength: 6 },
        { title: "HTML/CSS", category: "Frontend", strength: 9 },
        { title: "Node.js", category: "Backend", strength: 7 },
        { title: "Python", category: "Backend", strength: 5 },
        { title: "SQL", category: "Backend", strength: 6 },
        { title: "Git", category: "Tools", strength: 8 },
        { title: "Docker", category: "Tools", strength: 5 },
        { title: "AWS", category: "Tools", strength: 4 }
      ]
    };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Merge list skills
      const existingSkillsRes = await client.query(
        'SELECT title, category, strength FROM skills WHERE user_id = $1',
        [req.user.id]
      );
      const existingSkillsMap = new Map();
      for (const row of existingSkillsRes.rows) {
        existingSkillsMap.set(`${row.title.toLowerCase()}::${row.category.toLowerCase()}`, row.strength);
      }

      for (const skill of mockSkillsData.list) {
        const key = `${skill.title.toLowerCase()}::${skill.category.toLowerCase()}`;
        if (!existingSkillsMap.has(key)) {
          await client.query(
            'INSERT INTO skills (user_id, title, category, strength) VALUES ($1, $2, $3, $4)',
            [req.user.id, skill.title, skill.category, skill.strength]
          );
        } else {
          const existingStrength = existingSkillsMap.get(key);
          if (skill.strength > existingStrength) {
            await client.query(
              'UPDATE skills SET strength = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND title = $3 AND category = $4',
              [skill.strength, req.user.id, skill.title, skill.category]
            );
          }
        }
      }

      // 2. Merge skill tree
      const treeRes = await client.query(
        'SELECT tree_data FROM skills_tree WHERE user_id = $1',
        [req.user.id]
      );

      let mergedTree = mockSkillsData.tree;

      const mergeSkillTrees = (a, b) => {
        const mapify = (children = []) => Object.fromEntries(children.map(c => [c.title, c]));

        const mergeNodes = (a, b) => {
          const merged = {
            title: a.title || b.title,
            strength: Math.max(a.strength || 0, b.strength || 0),
          };

          const aMap = mapify(a.children);
          const bMap = mapify(b.children);
          const allKeys = new Set([...Object.keys(aMap), ...Object.keys(bMap)]);

          const children = [];
          for (const key of allKeys) {
            if (aMap[key] && bMap[key]) {
              children.push(mergeNodes(aMap[key], bMap[key]));
            } else {
              children.push(aMap[key] || bMap[key]);
            }
          }

          if (children.length > 0) merged.children = children;

          return merged;
        };

        return mergeNodes(a, b);
      };

      if (treeRes.rows.length > 0) {
        const existingTree = treeRes.rows[0].tree_data;
        mergedTree = mergeSkillTrees(existingTree, mockSkillsData.tree);
      }

      await client.query(
        `INSERT INTO skills_tree (user_id, tree_data)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET tree_data = EXCLUDED.tree_data, updated_at = CURRENT_TIMESTAMP`,
        [req.user.id, JSON.stringify(mergedTree)]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json(mockSkillsData);
  } catch (error) {
    console.error('File upload processing error:', error);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
});

export default router;