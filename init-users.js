import 'dotenv/config';
import { createUser, initDatabase } from './lib/db.js';

async function initializeUsers() {
  try {
    console.log('🔧 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized');

    console.log('👥 Creating users...');

    // Create Faidao
    await createUser(
      'faidao',
      process.env.FAIDAO_PASSWORD || 'sudoku2024', // Use env var or default
      'Faidao - The Queen',
      null
    );
    console.log('✅ Created user: faidao');

    // Create Filip
    await createUser(
      'filip',
      process.env.FILIP_PASSWORD || 'sudoku2024', // Use env var or default
      'Filip - The Champion',
      null
    );
    console.log('✅ Created user: filip');

    console.log('🎉 All users initialized successfully!');
    console.log('');
    console.log('📝 Note: Users can now login with their credentials.');
    console.log('   To set custom passwords, use environment variables:');
    console.log('   FAIDAO_PASSWORD and FILIP_PASSWORD');
    console.log('');
    console.log('⚠️  IMPORTANT: Change passwords in production by setting');
    console.log('   these environment variables in your deployment platform.');

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
