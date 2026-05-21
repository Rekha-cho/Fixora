// tests/complaintRoutes.test.js
// Integration tests for complaint routes using supertest.

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const jwt = require('jsonwebtoken');

// ── Token Helpers ──────────────────────────────────────────────────────────────

const testStudent = {
  _id: '60f6c0b5e1d3c81234567890',
  name: 'Test Student',
  email: 'teststudent@fixora.com',
  role: 'student',
};

const studentToken = jwt.sign(
  { id: testStudent._id, role: testStudent.role, name: testStudent.name },
  process.env.JWT_SECRET || 'fixora_secret_key',
  { expiresIn: '1h' }
);

// ── Teardown ───────────────────────────────────────────────────────────────────

afterAll(async () => {
  await mongoose.connection.close();
});

// ── GET /api/complaints ────────────────────────────────────────────────────────

describe('GET /api/complaints', () => {

  it('✅ should return 200 and an array when authenticated', async () => {
    const res = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('❌ should return 401 when no auth token is provided', async () => {
    const res = await request(app)
      .get('/api/complaints')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body).toHaveProperty('message');
  });

});

// ── POST /api/complaints ───────────────────────────────────────────────────────

describe('POST /api/complaints', () => {

  it('❌ should return 401 when posting without an auth token', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .field('title', 'Broken AC in Lab')
      .field('description', 'The AC has not been working for 3 days.')
      .field('category', 'Infrastructure');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('❌ should return 400 when required fields (title/description/category) are missing', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', '') // empty title
      .field('description', ''); // empty description
    // category also missing

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('fields required');
  });

});

