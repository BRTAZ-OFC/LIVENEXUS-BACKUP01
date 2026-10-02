
import { getCloudflareD1 } from './dashboard/api/auth/cloudflareD1.js';

async function diagnose() {
  const db = getCloudflareD1();
  if (!db) {
    console.error('Database connection failed - missing env vars');
    return;
  }

  try {
    console.log('--- DIAGNOSIS: Users ---');
    const users = await db.prepare('SELECT id, email FROM users LIMIT 5').all();
    console.log(JSON.stringify(users.results, null, 2));

    console.log('\n--- DIAGNOSIS: Sessions ---');
    const sessions = await db.prepare('SELECT id, user_id FROM sessions LIMIT 5').all();
    console.log(JSON.stringify(sessions.results, null, 2));

    if (sessions.results.length > 0) {
      const testSession = sessions.results[0];
      console.log(`\n--- TESTING DELETE for userId: ${testSession.user_id} ---`);
      
      // We wrap in try-catch to get the EXACT error
      try {
        console.log('Step 1: Deleting sessions...');
        await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(testSession.user_id).run();
        console.log('Step 1 success');

        console.log('Step 2: Deleting user...');
        await db.prepare('DELETE FROM users WHERE id = ?').bind(testSession.user_id).run();
        console.log('Step 2 success');
      } catch (err) {
        console.error('--- CAPTURED D1 ERROR ---');
        console.error(err);
        console.error('------------------------');
      }
    } else {
      console.log('\nNo sessions found to test deletion.');
    }
  } catch (err) {
    console.error('General diagnosis error:', err);
  }
}

diagnose();
