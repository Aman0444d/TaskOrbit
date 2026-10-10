/**
 * tests/api.test.js
 *
 * Comprehensive API test suite for TaskOrbit backend.
 * Uses Jest + Supertest + mongodb-memory-server.
 *
 * ✅ Fully self-contained: no Atlas connection, no IP whitelist needed.
 * ✅ Uses an in-memory MongoDB that is started/stopped per test run.
 * ✅ Zero risk of touching development or production data.
 *
 * Run with:  npm test
 * Verbose:   npm run test:verbose
 */

'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request  = require('supertest');

// Set required env vars BEFORE loading app modules
process.env.JWT_SECRET      = process.env.JWT_SECRET || 'test_jwt_secret_for_taskorbit_2024';
process.env.JWT_EXPIRES_IN  = '7d';
process.env.NODE_ENV        = 'test';

// Lazy-require app AFTER env is set
let app;
const getApp = () => {
  if (!app) app = require('../app');
  return app;
};

// ── In-memory MongoDB lifecycle ───────────────────────────────────────────────
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  // Load app after connection is established
  getApp();
}, 60000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}, 20000);

afterEach(async () => {
  // Clear all collections between tests to ensure isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

let _counter = 0;
const uniqueEmail = () => `testuser_${Date.now()}_${++_counter}@example.com`;

/** Register a user and return token + id + credentials */
const registerUser = async (overrides = {}) => {
  const email    = overrides.email    || uniqueEmail();
  const password = overrides.password || 'password123';
  const payload  = { name: 'Test User', email, password, ...overrides };
  const res = await request(getApp()).post('/api/auth/register').send(payload);
  return {
    res,
    token:  res.body?.data?.token,
    userId: res.body?.data?._id,
    email,
    password,
  };
};

/** Create a project as an authenticated user */
const createProject = async (token, overrides = {}) =>
  request(getApp())
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test Project', ...overrides });

/** Create a task in a project */
const createTask = async (token, projectId, overrides = {}) =>
  request(getApp())
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test Task', ...overrides });

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 1 — Health Endpoint
// ═════════════════════════════════════════════════════════════════════════════
describe('1. Health Endpoint', () => {
  test('GET /api/health → 200 with status:ok', async () => {
    const res = await request(getApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 2 — Auth: Registration
// ═════════════════════════════════════════════════════════════════════════════
describe('2. Auth — Registration', () => {
  test('Valid registration → 201 with token, no password in response', async () => {
    const { res } = await registerUser({ name: 'Alice' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.email).toBeDefined();
    expect(res.body.data.password).toBeUndefined();
  });

  test('Duplicate email → 409', async () => {
    const email = uniqueEmail();
    await registerUser({ email });
    const { res } = await registerUser({ email });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('Missing name → 400', async () => {
    const res = await request(getApp())
      .post('/api/auth/register')
      .send({ email: uniqueEmail(), password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Invalid email format → 400', async () => {
    const res = await request(getApp())
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Password too short (< 6 chars) → 400', async () => {
    const res = await request(getApp())
      .post('/api/auth/register')
      .send({ name: 'Bob', email: uniqueEmail(), password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Empty body → 400', async () => {
    const res = await request(getApp()).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 3 — Auth: Login
// ═════════════════════════════════════════════════════════════════════════════
describe('3. Auth — Login', () => {
  let testEmail, testPassword;

  beforeEach(async () => {
    testPassword = 'loginPass99!';
    const { email } = await registerUser({ password: testPassword });
    testEmail = email;
  });

  test('Valid credentials → 200 with token, no password in response', async () => {
    const res = await request(getApp())
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.password).toBeUndefined();
  });

  test('Wrong password → 401', async () => {
    const res = await request(getApp())
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Unknown email → 401', async () => {
    const res = await request(getApp())
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Empty body → 400', async () => {
    const res = await request(getApp()).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Missing password field → 400', async () => {
    const res = await request(getApp())
      .post('/api/auth/login')
      .send({ email: testEmail });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 4 — Auth: Protected Profile (GET /api/auth/me)
// ═════════════════════════════════════════════════════════════════════════════
describe('4. Auth — Protected Profile', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await registerUser());
  });

  test('Valid token → 200 with user data, no password', async () => {
    const res = await request(getApp())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBeDefined();
    expect(res.body.data.password).toBeUndefined();
  });

  test('No token → 401', async () => {
    const res = await request(getApp()).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Invalid/garbage token → 401', async () => {
    const res = await request(getApp())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.garbage');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Malformed Authorization header (not Bearer) → 401', async () => {
    const res = await request(getApp())
      .get('/api/auth/me')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 5 — Projects: CRUD
// ═════════════════════════════════════════════════════════════════════════════
describe('5. Projects — CRUD', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await registerUser());
  });

  test('POST /api/projects → 201 creates project', async () => {
    const res = await createProject(token, { title: 'My Project', description: 'desc' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My Project');
    expect(res.body.data.owner).toBeDefined();
  });

  test('POST /api/projects → 400 when title missing', async () => {
    const res = await request(getApp())
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'no title' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/projects → 400 when title is 1 character', async () => {
    const res = await request(getApp())
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/projects → 401 without token', async () => {
    const res = await request(getApp()).post('/api/projects').send({ title: 'Anon' });
    expect(res.status).toBe(401);
  });

  test('GET /api/projects → 200 lists user projects', async () => {
    await createProject(token, { title: 'P1' });
    await createProject(token, { title: 'P2' });
    const res = await request(getApp())
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(2);
  });

  test('GET /api/projects?status=active → 200 filters by status', async () => {
    await createProject(token, { title: 'Active P' });
    const res = await request(getApp())
      .get('/api/projects?status=active')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every(p => p.status === 'active')).toBe(true);
  });

  test('GET /api/projects?status=invalid → 400', async () => {
    const res = await request(getApp())
      .get('/api/projects?status=invalid-status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/projects/:id → 200 returns correct project', async () => {
    const pRes = await createProject(token, { title: 'FindMe' });
    const id   = pRes.body.data._id;
    const res  = await request(getApp())
      .get(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  test('GET /api/projects/:id → 400 on invalid ObjectId', async () => {
    const res = await request(getApp())
      .get('/api/projects/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('GET /api/projects/:id → 404 on non-existent project', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(getApp())
      .get(`/api/projects/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('PUT /api/projects/:id → 200 updates title and status', async () => {
    const pRes = await createProject(token);
    const id   = pRes.body.data._id;
    const res  = await request(getApp())
      .put(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated');
    expect(res.body.data.status).toBe('completed');
  });

  test('PUT /api/projects/:id → 400 on invalid status', async () => {
    const pRes = await createProject(token);
    const id   = pRes.body.data._id;
    const res  = await request(getApp())
      .put(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'super-active' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('DELETE /api/projects/:id → 200 and project is gone', async () => {
    const pRes = await createProject(token, { title: 'ToDelete' });
    const id   = pRes.body.data._id;
    const del  = await request(getApp())
      .delete(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const check = await request(getApp())
      .get(`/api/projects/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(check.status).toBe(404);
  });

  test('DELETE /api/projects/:id → 404 on non-existent', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(getApp())
      .delete(`/api/projects/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 6 — Tasks: CRUD and Project Relationship
// ═════════════════════════════════════════════════════════════════════════════
describe('6. Tasks — CRUD and Project Relationship', () => {
  let token, projectId;

  beforeEach(async () => {
    ({ token } = await registerUser());
    const pRes = await createProject(token, { title: 'Task Host' });
    projectId  = pRes.body.data._id;
  });

  test('POST /api/projects/:id/tasks → 201 creates task', async () => {
    const res = await createTask(token, projectId, { title: 'My Task', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My Task');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.status).toBe('todo');
  });

  test('POST /api/projects/:id/tasks → 400 when title missing', async () => {
    const res = await request(getApp())
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'low' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/projects/:id/tasks → 404 for non-existent project', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await createTask(token, fakeId, { title: 'Orphan' });
    expect(res.status).toBe(404);
  });

  test('GET /api/projects/:id/tasks → 200 lists tasks for a project', async () => {
    await createTask(token, projectId, { title: 'T1' });
    await createTask(token, projectId, { title: 'T2' });
    const res = await request(getApp())
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/tasks → 200 lists all user tasks', async () => {
    await createTask(token, projectId, { title: 'Global T1' });
    const res = await request(getApp())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/tasks?status=todo → 200 filters by status', async () => {
    await createTask(token, projectId, { title: 'Todo Task' });
    const res = await request(getApp())
      .get('/api/tasks?status=todo')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every(t => t.status === 'todo')).toBe(true);
  });

  test('GET /api/tasks?status=invalid → 400', async () => {
    const res = await request(getApp())
      .get('/api/tasks?status=invalid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/tasks?priority=super-urgent → 400', async () => {
    const res = await request(getApp())
      .get('/api/tasks?priority=super-urgent')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/tasks/:id → 200 returns task with populated project', async () => {
    const tRes = await createTask(token, projectId);
    const id   = tRes.body.data._id;
    const res  = await request(getApp())
      .get(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
    expect(res.body.data.project).toBeDefined();
    expect(res.body.data.project.title).toBeDefined();
  });

  test('GET /api/tasks/:id → 404 on non-existent task', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(getApp())
      .get(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('PUT /api/tasks/:id → 200 updates task status', async () => {
    const tRes = await createTask(token, projectId);
    const id   = tRes.body.data._id;
    const res  = await request(getApp())
      .put(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in-progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in-progress');
  });

  test('PUT /api/tasks/:id → 400 on invalid status value', async () => {
    const tRes = await createTask(token, projectId);
    const id   = tRes.body.data._id;
    const res  = await request(getApp())
      .put(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'flying' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/tasks/:id → 400 on invalid priority value', async () => {
    const tRes = await createTask(token, projectId);
    const id   = tRes.body.data._id;
    const res  = await request(getApp())
      .put(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'mega' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('DELETE /api/tasks/:id → 200 and task is gone', async () => {
    const tRes  = await createTask(token, projectId, { title: 'DeleteMe' });
    const delId = tRes.body.data._id;
    const del   = await request(getApp())
      .delete(`/api/tasks/${delId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const check = await request(getApp())
      .get(`/api/tasks/${delId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(check.status).toBe(404);
  });

  test('DELETE /api/projects/:id cascade-deletes all its tasks', async () => {
    // Create dedicated project + two tasks
    const pRes  = await createProject(token, { title: 'Cascade Project' });
    const pid   = pRes.body.data._id;
    const tRes1 = await createTask(token, pid, { title: 'CT1' });
    const tRes2 = await createTask(token, pid, { title: 'CT2' });
    const tid1  = tRes1.body.data._id;
    const tid2  = tRes2.body.data._id;

    // Delete the project
    await request(getApp())
      .delete(`/api/projects/${pid}`)
      .set('Authorization', `Bearer ${token}`);

    // Both tasks should be gone
    const c1 = await request(getApp()).get(`/api/tasks/${tid1}`).set('Authorization', `Bearer ${token}`);
    const c2 = await request(getApp()).get(`/api/tasks/${tid2}`).set('Authorization', `Bearer ${token}`);
    expect(c1.status).toBe(404);
    expect(c2.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 7 — Dashboard Statistics
// ═════════════════════════════════════════════════════════════════════════════
describe('7. Dashboard Statistics', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await registerUser());
  });

  test('GET /api/dashboard → 200 returns correct stats shape', async () => {
    const res = await request(getApp())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { data } = res.body;
    expect(data.projects).toBeDefined();
    expect(typeof data.projects.total).toBe('number');
    expect(typeof data.projects.active).toBe('number');
    expect(typeof data.projects.completed).toBe('number');
    expect(data.tasks).toBeDefined();
    expect(typeof data.tasks.total).toBe('number');
    expect(typeof data.tasks.overdue).toBe('number');
    expect(Array.isArray(data.recentProjects)).toBe(true);
    expect(Array.isArray(data.upcomingTasks)).toBe(true);
  });

  test('GET /api/dashboard → stats count matches created data', async () => {
    const pRes = await createProject(token, { title: 'Dashboard P' });
    const pid  = pRes.body.data._id;
    await createTask(token, pid, { title: 'DT1' });
    await createTask(token, pid, { title: 'DT2' });

    const res = await request(getApp())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.projects.total).toBe(1);
    expect(res.body.data.tasks.total).toBe(2);
  });

  test('GET /api/dashboard → 401 without token', async () => {
    const res = await request(getApp()).get('/api/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 8 — User Ownership and Cross-User Access Prevention
// ═════════════════════════════════════════════════════════════════════════════
describe('8. Ownership and Cross-User Access Prevention', () => {
  let tokenA, tokenB, projectIdA, taskIdA;

  beforeEach(async () => {
    ({ token: tokenA } = await registerUser({ name: 'User A' }));
    ({ token: tokenB } = await registerUser({ name: 'User B' }));

    const pRes = await createProject(tokenA, { title: 'A Private Project' });
    projectIdA = pRes.body.data._id;
    const tRes = await createTask(tokenA, projectIdA, { title: 'A Private Task' });
    taskIdA    = tRes.body.data._id;
  });

  test('User B cannot view User A project → 404', async () => {
    const res = await request(getApp())
      .get(`/api/projects/${projectIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test('User B cannot update User A project → 404', async () => {
    const res = await request(getApp())
      .put(`/api/projects/${projectIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(404);
  });

  test('User B cannot delete User A project → 404', async () => {
    const res = await request(getApp())
      .delete(`/api/projects/${projectIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test('User B cannot view User A task → 404', async () => {
    const res = await request(getApp())
      .get(`/api/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test('User B cannot update User A task → 404', async () => {
    const res = await request(getApp())
      .put(`/api/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });

  test('User B cannot delete User A task → 404', async () => {
    const res = await request(getApp())
      .delete(`/api/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test('User B project list does not include User A projects', async () => {
    const res = await request(getApp())
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map(p => p._id);
    expect(ids).not.toContain(projectIdA);
  });

  test('Mass-assignment: client cannot override owner on project create', async () => {
    const { userId: userBId } = await registerUser({ name: 'UserB2' });
    const res = await request(getApp())
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Owner Override Attempt', owner: userBId });
    expect(res.status).toBe(201);
    // owner must be tokenA's user, not userBId
    expect(res.body.data.owner).not.toBe(userBId);
  });

  test('Mass-assignment: client cannot override owner on task create', async () => {
    const { userId: userBId } = await registerUser({ name: 'UserB3' });
    const res = await request(getApp())
      .post(`/api/projects/${projectIdA}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task Owner Override', owner: userBId });
    expect(res.status).toBe(201);
    expect(res.body.data.owner).not.toBe(userBId);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 9 — Unknown Routes (404 catch-all)
// ═════════════════════════════════════════════════════════════════════════════
describe('9. Unknown Routes', () => {
  test('GET /api/nonexistent-route → 404 with success:false', async () => {
    const res = await request(getApp()).get('/api/this-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
