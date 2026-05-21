// tests/complaintRoutes.test.js
// Integration test for the GET /api/complaints endpoint using supertest.

const request = require('supertest');
const app = require('../server'); // server.js now exports the Express app without starting the HTTP server in test env

// Helper to generate a JWT for an authenticated user (you can reuse a test user created in auth.test.js)
// For simplicity we will sign a token directly using the same secret.
const jwt = require('jsonwebtoken');

const testUser = {
  _id: '60f6c0b5e1d3c81234567890',
  name: 'Test User',
  email: 'test@example.com',
  role: 'student',
};

const authToken = jwt.sign({ id: testUser._id, role: testUser.role }, process.env.JWT_SECRET || 'testsecret', {
  expiresIn: '1h',
});

describe('GET /api/complaints', () => {
  it('should return an array of complaints (empty array if none exist)', async () => {
    const res = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);

    // The response body should be an array (could be empty if DB is clean)
    expect(Array.isArray(res.body)).toBe(true);
  });
});
