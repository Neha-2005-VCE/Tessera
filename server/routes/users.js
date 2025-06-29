import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

router.get('/career-recommendations', authenticateToken, async (req, res) => {
  try {
    // Step 1: Get current skills of user
    const skillsResult = await pool.query(
      'SELECT title, category, strength FROM skills WHERE user_id = $1',
      [req.user.id]
    );

    const userSkills = skillsResult.rows.map(skill => ({
      title: skill.title,
      category: skill.category,
      strength: skill.strength
    }));

    if (userSkills.length === 0) return res.json([]);

    // Step 2: Hash sorted skills for caching
    const sortedSkills = [...userSkills].sort((a, b) => a.title.localeCompare(b.title));
    const skillsHash = crypto.createHash('sha256').update(JSON.stringify(sortedSkills)).digest('hex');

    // Step 3: Check if we already cached this skills version
    const cachedResult = await pool.query(
      `SELECT * FROM career_recommendations 
       WHERE user_id = $1 AND skills_hash = $2 
       ORDER BY match_percentage DESC`,
      [req.user.id, skillsHash]
    );

    if (cachedResult.rows.length > 0) {
      const recommendations = cachedResult.rows.map(row => ({
        title: row.title,
        description: row.description,
        nextSkills: row.next_skills,
        growthPath: row.growth_path,
        matchPercentage: row.match_percentage,
        salaryRange: row.salary_range,
        demandLevel: row.demand_level
      }));
      return res.json(recommendations);
    }

    // Step 4: Call Flask Gemini API to generate fresh recommendations
    const flaskResponse = await axios.post(
      'http://127.0.0.1:5000/career_recommendations',
      { skills: userSkills }
    );

    const newRecs = flaskResponse.data;

    // Step 5: Save new recommendations in DB with hash
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Remove old recommendations for this user
      await client.query('DELETE FROM career_recommendations WHERE user_id = $1', [req.user.id]);

      for (const rec of newRecs) {
        // Validate nextSkills format
        let nextSkills = rec.nextSkills;
        if (!Array.isArray(nextSkills)) {
          console.warn('⚠️ nextSkills not an array:', nextSkills);
          try {
            nextSkills = JSON.parse(nextSkills);
          } catch (e) {
            nextSkills = [];
          }
        }

        await client.query(
          `INSERT INTO career_recommendations 
           (user_id, title, description, next_skills, growth_path, match_percentage, salary_range, demand_level, skills_hash)
           VALUES ($1, $2, $3, $4::text[], $5, $6, $7, $8, $9)`,
          [
            req.user.id,
            rec.title,
            rec.description,
            nextSkills,
            rec.growthPath,
            rec.matchPercentage,
            rec.salaryRange,
            rec.demandLevel,
            skillsHash
          ]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('💥 DB error during insertion:', err);
      return res.status(500).json({ error: 'Database error inserting career recommendations' });
    } finally {
      client.release();
    }

    // Step 6: Return new recommendations
    res.json(newRecs);
  } catch (error) {
    console.error('Career recommendations error:', error?.response?.data || error.message || error);
    res.status(500).json({ error: 'Failed to fetch career recommendations' });
  }
});
// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_skills,
        COUNT(CASE WHEN strength >= 8 THEN 1 END) as expert_skills,
        COUNT(CASE WHEN strength >= 6 AND strength < 8 THEN 1 END) as intermediate_skills,
        COUNT(CASE WHEN strength < 6 THEN 1 END) as beginner_skills,
        COUNT(DISTINCT category) as categories
      FROM skills 
      WHERE user_id = $1
    `, [req.user.id]);

    const stats = result.rows[0];
    
    res.json({
      totalSkills: parseInt(stats.total_skills),
      expertSkills: parseInt(stats.expert_skills),
      intermediateSkills: parseInt(stats.intermediate_skills),
      beginnerSkills: parseInt(stats.beginner_skills),
      categories: parseInt(stats.categories)
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export default router;