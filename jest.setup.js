// jest.setup.js
require('dotenv').config({ path: '.env.test' }); // load test env variables
const { PrismaClient } = require('@prisma/client');
global.prisma = new PrismaClient();

afterAll(async () => {
  await global.prisma.$disconnect();
});
