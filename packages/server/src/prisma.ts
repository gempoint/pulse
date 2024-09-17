import { PrismaClient } from '@prisma/client';
import { drizzle } from 'drizzle-orm/prisma/pg';

export default new PrismaClient().$extends(drizzle());