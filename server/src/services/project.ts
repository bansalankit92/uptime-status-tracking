import { db } from '../db/connection.js';
import { projects } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

let cachedDefaultProjectId: number | null = null;

export function getDefaultProjectId(): number {
  if (cachedDefaultProjectId !== null) return cachedDefaultProjectId;

  const project = db.select({ id: projects.id }).from(projects).where(eq(projects.slug, 'default')).get();
  if (!project) {
    throw new Error('Default project not found. Run db:seed first.');
  }
  cachedDefaultProjectId = project.id;
  return project.id;
}
