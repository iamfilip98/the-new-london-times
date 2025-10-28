/**
 * Shared validation functions for API endpoints
 * Prevents injection attacks and ensures data integrity
 */

const VALID_PLAYERS = ['faidao', 'filip'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * Validate player name
 * @param {string} player - Player name to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid with specific message
 */
function validatePlayer(player) {
  if (!player) {
    throw new Error('Player is required');
  }

  if (typeof player !== 'string') {
    throw new Error('Player must be a string');
  }

  if (!VALID_PLAYERS.includes(player)) {
    throw new Error(`Invalid player. Must be one of: ${VALID_PLAYERS.join(', ')}`);
  }

  return true;
}

/**
 * Validate difficulty level
 * @param {string} difficulty - Difficulty to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid with specific message
 */
function validateDifficulty(difficulty) {
  if (!difficulty) {
    throw new Error('Difficulty is required');
  }

  if (typeof difficulty !== 'string') {
    throw new Error('Difficulty must be a string');
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw new Error(`Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  return true;
}

/**
 * Validate date string (YYYY-MM-DD format)
 * @param {string} date - Date to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid with specific message
 */
function validateDate(date) {
  if (!date) {
    throw new Error('Date is required');
  }

  if (typeof date !== 'string') {
    throw new Error('Date must be a string');
  }

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }

  // Verify it's a valid date
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }

  // Check if date string matches parsed date (prevents weird dates like 2025-13-45)
  const [year, month, day] = date.split('-').map(Number);
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() !== month - 1 ||
    dateObj.getUTCDate() !== day
  ) {
    throw new Error('Invalid date values');
  }

  return true;
}

/**
 * Validate game data (time, errors, score, hints)
 * @param {object} gameData - Game data to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid with specific message
 */
function validateGameData(gameData) {
  if (!gameData || typeof gameData !== 'object') {
    throw new Error('Game data must be an object');
  }

  // Validate time (required, must be positive integer)
  if (gameData.time !== undefined && gameData.time !== null) {
    if (typeof gameData.time !== 'number' || gameData.time < 0 || !Number.isInteger(gameData.time)) {
      throw new Error('Time must be a positive integer');
    }
    if (gameData.time > 86400) { // Max 24 hours
      throw new Error('Time cannot exceed 24 hours (86400 seconds)');
    }
  }

  // Validate errors (must be non-negative integer if provided)
  if (gameData.errors !== undefined && gameData.errors !== null) {
    if (typeof gameData.errors !== 'number' || gameData.errors < 0 || !Number.isInteger(gameData.errors)) {
      throw new Error('Errors must be a non-negative integer');
    }
    if (gameData.errors > 100) {
      throw new Error('Errors seems unreasonably high (max 100)');
    }
  }

  // Validate score (must be non-negative number if provided)
  if (gameData.score !== undefined && gameData.score !== null) {
    if (typeof gameData.score !== 'number' || gameData.score < 0) {
      throw new Error('Score must be a non-negative number');
    }
    if (gameData.score > 10000) {
      throw new Error('Score seems unreasonably high (max 10000)');
    }
  }

  // Validate hints (must be non-negative integer if provided)
  if (gameData.hints !== undefined && gameData.hints !== null) {
    if (typeof gameData.hints !== 'number' || gameData.hints < 0 || !Number.isInteger(gameData.hints)) {
      throw new Error('Hints must be a non-negative integer');
    }
    if (gameData.hints > 10) {
      throw new Error('Hints seems unreasonably high (max 10)');
    }
  }

  return true;
}

/**
 * Sanitize string input to prevent injection attacks
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove any potential SQL injection characters
  // Since we use parameterized queries, this is extra safety
  return input
    .replace(/['"`;\\]/g, '') // Remove quotes, semicolons, backslashes
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Comprehensive validation for save game endpoint
 */
function validateSaveGameRequest(data) {
  const errors = [];

  try {
    validatePlayer(data.player);
  } catch (e) {
    errors.push(e.message);
  }

  try {
    validateDate(data.date);
  } catch (e) {
    errors.push(e.message);
  }

  try {
    validateDifficulty(data.difficulty);
  } catch (e) {
    errors.push(e.message);
  }

  try {
    validateGameData(data);
  } catch (e) {
    errors.push(e.message);
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}

module.exports = {
  validatePlayer,
  validateDifficulty,
  validateDate,
  validateGameData,
  validateSaveGameRequest,
  sanitizeString,
  VALID_PLAYERS,
  VALID_DIFFICULTIES
};
