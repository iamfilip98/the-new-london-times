require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Import the puzzle generation module
const puzzlesHandler = require('./api/puzzles.js');

async function generateToday() {
  const today = '2025-10-18';
  
  console.log('\n═══════════════════════════════════════════');
  console.log(`GENERATING FRESH PUZZLES FOR ${today}`);
  console.log('Using NEW gameplay-driven validation!');
  console.log('═══════════════════════════════════════════\n');
  
  // Create mock request and response objects
  const mockReq = {
    method: 'POST',
    body: {
      action: 'generate',
      date: today
    },
    headers: {}
  };
  
  let responseData = null;
  let statusCode = 200;
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    status: function(code) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      responseData = data;
      return Promise.resolve(data);
    },
    end: function() {
      return Promise.resolve();
    }
  };
  
  try {
    await puzzlesHandler(mockReq, mockRes);
    
    if (statusCode === 200 && responseData) {
      console.log('\n✅ GENERATION COMPLETE!\n');
      console.log('Puzzle Details:');
      console.log('═══════════════════════════════════════════');
      
      // Count clues for each difficulty
      if (responseData.easy && responseData.easy.puzzle) {
        const easyClues = responseData.easy.puzzle.flat().filter(n => n !== 0).length;
        console.log(`Easy:   ${easyClues} clues (target: 42)`);
      }
      
      if (responseData.medium && responseData.medium.puzzle) {
        const mediumClues = responseData.medium.puzzle.flat().filter(n => n !== 0).length;
        console.log(`Medium: ${mediumClues} clues (target: 25)`);
      }
      
      if (responseData.hard && responseData.hard.puzzle) {
        const hardClues = responseData.hard.puzzle.flat().filter(n => n !== 0).length;
        console.log(`Hard:   ${hardClues} clues (target: 19)`);
      }
      
      console.log('═══════════════════════════════════════════\n');
    } else {
      console.error(`❌ Generation failed with status ${statusCode}`);
      console.error('Response:', responseData);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error during generation:', error.message);
    process.exit(1);
  }
}

generateToday();
