import 'dotenv/config';
import { createUser, initDatabase } from './lib/db.js';

async function initializeUsers() {
  try {
    await initDatabase();


    // Create Faidao
    await createUser(
      'faidao',
      process.env.FAIDAO_PASSWORD || 'sudoku2024', // Use env var or default
      'Faidao - The Queen',
      null
    );

    // Create Filip
    await createUser(
      'filip',
      process.env.FILIP_PASSWORD || 'sudoku2024', // Use env var or default
      'Filip - The Champion',
      null
    );


  } catch (error) {
    console.error('❌ Failed to initialize users:', error);
    throw error;
  }
}

initializeUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
