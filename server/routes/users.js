import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get career recommendations for user
router.get('/career-recommendations', authenticateToken, async (req, res) => {
  try {
    // Check if user has career recommendations cached
    const cachedResult = await pool.query(
      'SELECT * FROM career_recommendations WHERE user_id = $1 ORDER BY match_percentage DESC',
      [req.user.id]
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

    // Generate new recommendations based on user skills
    const skillsResult = await pool.query(
      'SELECT title, category, strength FROM skills WHERE user_id = $1',
      [req.user.id]
    );

    if (skillsResult.rows.length === 0) {
      return res.json([]);
    }

    // Mock career recommendations generation
    const mockRecommendations = [
      {
        title: 'Senior Frontend Developer',
        description: 'Lead frontend development projects using modern frameworks and ensure exceptional user experiences',
        nextSkills: ['Vue.js', 'Angular', 'WebGL', 'Performance Optimization'],
        growthPath: 'Frontend Developer → Senior Frontend → Lead Frontend → Engineering Manager',
        matchPercentage: 92,
        salaryRange: '$80k - $120k',
        demandLevel: 'High'
      },
      {
        title: 'Full Stack Developer',
        description: 'Build end-to-end web applications handling both frontend and backend development',
        nextSkills: ['Microservices', 'GraphQL', 'Redis', 'Message Queues'],
        growthPath: 'Full Stack Developer → Senior Full Stack → Solutions Architect → CTO',
        matchPercentage: 78,
        salaryRange: '$75k - $130k',
        demandLevel: 'High'
      },
      {
        title: 'DevOps Engineer',
        description: 'Streamline development workflows and manage cloud infrastructure for scalable applications',
        nextSkills: ['Kubernetes', 'Terraform', 'CI/CD Pipelines', 'Monitoring'],
        growthPath: 'DevOps Engineer → Senior DevOps → Platform Engineer → Infrastructure Architect',
        matchPercentage: 65,
        salaryRange: '$85k - $140k',
        demandLevel: 'High'
      },
      {
        title: 'Product Manager (Technical)',
        description: 'Bridge technical and business teams to drive product strategy and development',
        nextSkills: ['Product Analytics', 'User Research', 'Market Analysis', 'Roadmap Planning'],
        growthPath: 'Technical PM → Senior PM → Director of Product → VP of Product',
        matchPercentage: 58,
        salaryRange: '$90k - $150k',
        demandLevel: 'Medium'
      }
    ];

    // Cache recommendations in database
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Clear existing recommendations
      await client.query('DELETE FROM career_recommendations WHERE user_id = $1', [req.user.id]);
      
      // Insert new recommendations
      for (const rec of mockRecommendations) {
        await client.query(
          `INSERT INTO career_recommendations 
           (user_id, title, description, next_skills, growth_path, match_percentage, salary_range, demand_level)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [req.user.id, rec.title, rec.description, rec.nextSkills, rec.growthPath, 
           rec.matchPercentage, rec.salaryRange, rec.demandLevel]
        );
      }
      
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    res.json(mockRecommendations);
  } catch (error) {
    console.error('Career recommendations error:', error);
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