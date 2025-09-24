const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import API handlers
const entriesHandler = require('./api/entries');
const puzzlesHandler = require('./api/puzzles');
const gamesHandler = require('./api/games');
const statsHandler = require('./api/stats');
const achievementsHandler = require('./api/achievements');

const port = 3000;

// Helper to parse request body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Create a Vercel-compatible request/response wrapper
function createVercelCompatible(req, res) {
  const parsedUrl = url.parse(req.url, true);

  // Add Vercel-style methods to response
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  res.end = res.end.bind(res);

  // Add query parameters to request
  req.query = parsedUrl.query || {};

  return { req, res };
}

// Simple HTTP server to test API endpoints locally
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Add CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse body for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    req.body = await parseBody(req);
  }

  // Create Vercel-compatible wrappers
  const { req: vercelReq, res: vercelRes } = createVercelCompatible(req, res);

  // Route API requests
  try {
    if (pathname.startsWith('/api/entries')) {
      await entriesHandler(vercelReq, vercelRes);
      return;
    }

    if (pathname.startsWith('/api/puzzles')) {
      await puzzlesHandler(vercelReq, vercelRes);
      return;
    }

    if (pathname.startsWith('/api/games')) {
      await gamesHandler(vercelReq, vercelRes);
      return;
    }

    if (pathname.startsWith('/api/stats')) {
      await statsHandler(vercelReq, vercelRes);
      return;
    }

    if (pathname.startsWith('/api/achievements')) {
      await achievementsHandler(vercelReq, vercelRes);
      return;
    }

    // For non-API requests, return 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(port, () => {
  console.log(`🚀 Test API server running on http://localhost:${port}`);
  console.log('API endpoints available:');
  console.log('  - GET /api/entries');
  console.log('  - GET /api/puzzles?date=YYYY-MM-DD');
  console.log('  - GET /api/games?date=YYYY-MM-DD');
  console.log('  - GET /api/stats?type=all');
  console.log('  - GET /api/achievements');
});