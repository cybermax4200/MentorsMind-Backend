import db from '../config/db'; // Assuming a db config exists

export class LearnerService {
  static async getProgress(learnerId: number) {
    const result = await db.query(
      'SELECT total_sessions, total_hours_spent, skills_covered FROM learner_progress WHERE learner_id = $1',
      [learnerId]
    );
    return result.rows[0] || { total_sessions: 0, total_hours_spent: 0, skills_covered: [] };
  }

  static async updateGoals(learnerId: number, goalData: any) {
    const { goal_title, target_date } = goalData;
    return await db.query(
      'INSERT INTO learner_goals (learner_id, goal_title, target_date) VALUES ($1, $2, $3) RETURNING *',
      [learnerId, goal_title, target_date]
    );
  }

  static async getStats(learnerId: number) {
    // Logic to calculate total spend and avg rating from sessions table
    const stats = await db.query(
      'SELECT COUNT(*) as total_sessions, AVG(rating_given) as avg_rating FROM sessions WHERE learner_id = $1',
      [learnerId]
    );
    return stats.rows[0];
  }
}
