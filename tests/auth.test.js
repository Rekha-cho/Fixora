const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('🔑 Authentication API Unit Tests', () => {
    
    // Close the database connection after all tests have completed
    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('POST /api/auth/signup', () => {
        it('❌ should fail to register if name, email, or password is missing', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'incomplete@fixora.com'
                    // Missing password and name
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('fields required');
        });

        it('❌ should fail if user attempts to signup with an already registered email', async () => {
            // Note: Since 'admin@fixora.com' is a default user or registered user, this should fail
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'Duplicate Student',
                    email: 'admin@fixora.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('already registered');
        });
    });

    describe('POST /api/auth/login', () => {
        it('❌ should reject login with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent_user@fixora.com',
                    password: 'wrong_password_123',
                    role: 'student'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Invalid credentials');
        });

        it('❌ should reject login if selected role is incorrect', async () => {
            // Trying to login as admin with student role selection or vice versa
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@fixora.com',
                    password: 'admin123',
                    role: 'student' // Admin account but trying to log in as student
                });

            expect(res.statusCode).toBe(403);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Access denied');
        });
    });
});
