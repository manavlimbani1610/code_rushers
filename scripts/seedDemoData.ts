// Seed demo data for Community Mangrove Watch
// Run with: npx ts-node scripts/seedDemoData.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const regions = ['Delta', 'Sundarbans', 'Mekong'];
const categories = ['cutting', 'dumping', 'encroachment', 'fire', 'other'];
const roles = ['community_reporter', 'ngo', 'gov_officer', 'researcher'];

async function seedUsers() {
  const users = [];
  for (const role of roles) {
    for (let i = 1; i <= 5; i++) {
      users.push({
        id: `${role}_${i}`,
        role,
        display_name: `${role.replace('_', ' ')} ${i}`,
        org: role === 'ngo' ? 'NGO Org' : '',
        score: Math.floor(Math.random() * 100),
        region: regions[i % regions.length],
        created_at: new Date().toISOString(),
      });
    }
  }
  await supabase.from('users').upsert(users);
  return users;
}

async function seedReports(users: any[]) {
  const reports = [];
  for (let i = 1; i <= 25; i++) {
    const region = regions[i % regions.length];
    const category = categories[i % categories.length];
    const reporter = users[Math.floor(Math.random() * users.length)];
    reports.push({
      id: `report_${i}`,
      reporter_id: reporter.id,
      category,
      description: `Sample report ${i} in ${region} (${category})`,
      status: i % 4 === 0 ? 'In Progress' : i % 5 === 0 ? 'Resolved' : 'New',
      severity: Math.ceil(Math.random() * 5),
      lat: 15 + Math.random(),
      lng: 80 + Math.random(),
      region,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      validated_at: null,
    });
  }
  // Add some duplicates
  reports[5].description = reports[0].description;
  reports[10].description = reports[1].description;
  await supabase.from('reports').upsert(reports);
  return reports;
}

async function seedAssignments(reports: any[], users: any[]) {
  const assignments = [];
  for (let i = 0; i < 2; i++) {
    assignments.push({
      id: `assign_${i}`,
      report_id: reports[i].id,
      assignee_id: users.filter(u => u.role === 'gov_officer')[i].id,
      status: 'In Progress',
      sla_due_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    });
  }
  await supabase.from('assignments').upsert(assignments);
}

async function seedBadges(users: any[]) {
  const badges = [];
  for (let i = 0; i < 3; i++) {
    badges.push({
      id: `badge_${i}`,
      user_id: users[i].id,
      badge_type: 'Top Contributor',
      awarded_at: new Date().toISOString(),
    });
  }
  await supabase.from('badges').upsert(badges);
}

async function main() {
  const users = await seedUsers();
  const reports = await seedReports(users);
  await seedAssignments(reports, users);
  await seedBadges(users);
  console.log('Demo data seeded!');
}

main();
