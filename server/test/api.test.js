import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/server.js';

let server;
const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, resolve);
  });
});

import mongoose from 'mongoose';

test.after(async () => {
  await mongoose.disconnect();
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('GET /api/health should return 200 and system health indicators', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.service, 'AfterFrame API');
  assert.ok(data.database);
  assert.ok(data.tmdb);
});

test('GET /api/tmdb/top-10 should return 10 ranked titles', async () => {
  const res = await fetch(`${BASE_URL}/api/tmdb/top-10`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.results));
  assert.equal(data.results.length, 10);
  assert.equal(data.results[0].rank, 1);
  assert.equal(data.results[9].rank, 10);
});

test('GET /api/tmdb/trending should return trending media', async () => {
  const res = await fetch(`${BASE_URL}/api/tmdb/trending?mediaType=movie&timeWindow=week`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.results));
  assert.ok(data.results.length > 0);
});

test('GET /api/tmdb/genres should return valid genre mapping', async () => {
  const res = await fetch(`${BASE_URL}/api/tmdb/genres`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.genres));
  assert.ok(data.genres.some(g => g.name === 'Drama'));
});

test('GET /api/tmdb/search should return matches for query', async () => {
  const res = await fetch(`${BASE_URL}/api/tmdb/search?q=Clayface`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.results));
  assert.ok(data.results.length > 0);
  assert.equal(data.results[0].title, 'Clayface');
});

test('GET /api/community/people/trending should return people with afterframe_votes', async () => {
  const res = await fetch(`${BASE_URL}/api/community/people/trending`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.people));
  assert.ok(data.people.length > 0);
  assert.ok('afterframe_votes' in data.people[0]);
  assert.ok('rank_delta' in data.people[0]);
});

test('POST /api/watchlist without auth should return 401 Unauthorized', async () => {
  const res = await fetch(`${BASE_URL}/api/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tmdbId: 12345, title: 'Sample Title' })
  });
  // Without token, it should reject with 401 (or 503 if DB disconnected first)
  assert.ok([401, 503].includes(res.status));
});

test('GET /api/tmdb/providers returns distinct regional providers for IN, US, and GB', async () => {
  const [resIN, resUS, resGB] = await Promise.all([
    fetch(`${BASE_URL}/api/tmdb/providers?region=IN`),
    fetch(`${BASE_URL}/api/tmdb/providers?region=US`),
    fetch(`${BASE_URL}/api/tmdb/providers?region=GB`)
  ]);

  assert.equal(resIN.status, 200);
  assert.equal(resUS.status, 200);
  assert.equal(resGB.status, 200);

  const [dataIN, dataUS, dataGB] = await Promise.all([resIN.json(), resUS.json(), resGB.json()]);

  // IN contains Hotstar (122)
  const inHasHotstar = dataIN.providers.some(p => p.id === 122 || p.name.includes('Hotstar'));
  assert.ok(inHasHotstar, 'India should include Hotstar');

  // US contains Max (1899) and Hulu (15)
  const usHasMax = dataUS.providers.some(p => p.id === 1899 || p.name === 'Max');
  const usHasHulu = dataUS.providers.some(p => p.id === 15 || p.name === 'Hulu');
  assert.ok(usHasMax, 'US should include Max');
  assert.ok(usHasHulu, 'US should include Hulu');

  // GB contains BBC iPlayer (38)
  const gbHasBBC = dataGB.providers.some(p => p.id === 38 || p.name.includes('BBC'));
  assert.ok(gbHasBBC, 'GB should include BBC iPlayer');

  // Ensure IN and US providers are distinct and not cross-contaminated
  const usProviderIds = new Set(dataUS.providers.map(p => p.id));
  assert.ok(!usProviderIds.has(122), 'US providers must not contain Hotstar (122)');
});

test('GET /api/tmdb/streaming-titles returns regional titles without error', async () => {
  const res = await fetch(`${BASE_URL}/api/tmdb/streaming-titles?region=IN&providerId=119`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.region, 'IN');
  assert.equal(data.providerId, 119);
  assert.ok(Array.isArray(data.results));
});

test('GET /api/tmdb/:mediaType/:id/trailer returns authentic trailer key', async () => {
  const res = await fetch(`${BASE_URL}/api/tmdb/movie/687163/trailer`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok('videoKey' in data);
  if (data.videoKey) {
    assert.notEqual(data.videoKey, 'dQw4w9WgXcQ', 'Trailer must never be hardcoded rickroll');
    assert.equal(data.site, 'YouTube');
  }
});

test('GET /api/tmdb/regional-discovery returns accurate origin-country cinema', async () => {
  const [resIN, resUS, resGB] = await Promise.all([
    fetch(`${BASE_URL}/api/tmdb/regional-discovery?region=IN`),
    fetch(`${BASE_URL}/api/tmdb/regional-discovery?region=US`),
    fetch(`${BASE_URL}/api/tmdb/regional-discovery?region=GB`)
  ]);

  assert.equal(resIN.status, 200);
  assert.equal(resUS.status, 200);
  assert.equal(resGB.status, 200);

  const [dataIN, dataUS, dataGB] = await Promise.all([resIN.json(), resUS.json(), resGB.json()]);

  assert.equal(dataIN.region, 'IN');
  assert.equal(dataIN.label, 'Popular from India');
  assert.ok(Array.isArray(dataIN.results));
  assert.ok(dataIN.results.length > 0);

  assert.equal(dataUS.region, 'US');
  assert.equal(dataUS.label, 'Popular from the US');

  assert.equal(dataGB.region, 'GB');
  assert.equal(dataGB.label, 'Popular from the UK');
});

test('POST /api/auth/register saves preferences and requires explicit sign in (no auto-login)', async () => {
  const testEmail = `cinephile_${Date.now()}@afterframe.test`;
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sofia Coppola',
      email: testEmail,
      password: 'cinemapassword123',
      preferences: {
        genres: ['Drama', 'Sci-Fi'],
        languages: ['English', 'Japanese'],
        viewingStyles: { era: 'recent', length: 'short', mood: 'intense' },
        favoriteTitles: [{ id: 550, title: 'Fight Club' }],
        favoritePeople: [{ id: 525, name: 'Christopher Nolan' }]
      }
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.requiresLogin, true, 'Registration must require explicit login');
  assert.equal(data.token, undefined, 'Registration must not issue an authenticated token');
  assert.ok(data.user);
  assert.deepEqual(data.user.preferences.genres, ['Drama', 'Sci-Fi']);
  assert.deepEqual(data.user.preferences.languages, ['English', 'Japanese']);
});

test('GET /api/community/taste-match returns guest explainable structure', async () => {
  const res = await fetch(`${BASE_URL}/api/community/taste-match/movie/550`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'guest');
  assert.equal(data.score, null);
  assert.ok(Array.isArray(data.breakdowns));
});

test('GET /api/events verifies known test event Friday Night IMAX Screening is removed', async () => {
  const res = await fetch(`${BASE_URL}/api/events`);
  assert.equal(res.status, 200);
  const data = await res.json();
  const testEvent = (data.events || []).find(e =>
    (e.title || '').includes('Friday Night IMAX Screening') ||
    (e.venue || '').includes('Palladium Screen 1')
  );
  assert.equal(testEvent, undefined, 'Known temporary test event must not exist in database');
});

test('GET /api/invalid-route should return 404 Endpoint Not Found', async () => {
  const res = await fetch(`${BASE_URL}/api/non-existent-afterframe-path`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.error, 'Endpoint Not Found');
});
