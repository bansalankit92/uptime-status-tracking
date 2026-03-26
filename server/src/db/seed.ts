import 'dotenv/config';
import { db } from './connection.js';
import { users, projects, statusPages } from './schema/index.js';
import { config } from '../config.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  // Create admin user if not exists
  const existing = db.select().from(users).where(eq(users.email, config.admin.email)).get();
  if (!existing) {
    const hash = await bcrypt.hash(config.admin.password, 12);
    db.insert(users).values({
      email: config.admin.email,
      passwordHash: hash,
      name: 'Admin',
      role: 'admin',
    }).run();
    console.log(`Created admin user: ${config.admin.email}`);
  } else {
    console.log('Admin user already exists, skipping.');
  }

  // Create default project if not exists
  const existingProject = db.select().from(projects).where(eq(projects.slug, 'default')).get();
  if (!existingProject) {
    const result = db.insert(projects).values({
      name: 'Default Project',
      slug: 'default',
    }).returning().get();

    // Create default status page
    db.insert(statusPages).values({
      projectId: result.id,
      slug: 'status',
      title: 'Service Status',
      description: 'Current status of our services',
      theme: 'minimal',
      fontFamily: 'inter',
      uptimeBarStyle: 'pill',
      footerLayout: 'simple',
      footerText: 'Powered by Uptime Monitor',
    }).run();
    console.log('Created default project and status page.');
  } else {
    console.log('Default project already exists, skipping.');
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
