/**
 * Concurrency Test Script for BookIt Booking System
 *
 * This script simulates two users attempting to book the LAST remaining seat
 * for an event simultaneously. Expected outcome:
 *   - Exactly 1 successful booking (201)
 *   - Exactly 1 failure (409 — no seats available)
 *   - No overselling under any circumstances
 *
 * Usage:
 *   node scripts/test-concurrency.js
 *
 * Prerequisites:
 *   - Server running on http://localhost:3001
 *   - Database seeded with at least 2 users and 1 event
 */

const API_URL = 'http://127.0.0.1:3001/api';

async function makeRequest(url, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options;
  const res = await fetch(`${API_URL}${url}`, {
    ...restOptions,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function login(email, password) {
  const res = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.data.error?.message}`);
  }
  return res.data.token;
}

async function createTestEvent(token) {
  const res = await makeRequest('/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: `Concurrency Test Event ${Date.now()}`,
      description: 'This event has exactly 1 seat to test concurrent booking.',
      venue: 'Test Venue',
      date: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days from now
      totalSeats: 1,
      price: 10.00,
    }),
  });
  if (res.status !== 201) {
    throw new Error(`Failed to create event: ${res.data.error?.message} | Details: ${JSON.stringify(res.data.error?.details)}`);
  }
  return res.data.event;
}

async function bookEvent(token, eventId, userName) {
  const start = Date.now();
  const res = await makeRequest('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventId }),
  });
  const elapsed = Date.now() - start;
  return { ...res, userName, elapsed };
}

async function getEvent(eventId) {
  const res = await makeRequest(`/events/${eventId}`);
  return res.data.event;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   BookIt Concurrency Test                       ║');
  console.log('║   Testing: 2 users booking the last seat        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Login as organizer and 2 users
    console.log('1. Logging in test users...');
    const organizerToken = await login('organizer@bookit.com', 'password123');
    const user1Token = await login('user1@bookit.com', 'password123');
    const user2Token = await login('user2@bookit.com', 'password123');
    console.log('   ✅ All 3 users logged in\n');

    // Step 2: Create event with exactly 1 seat
    console.log('2. Creating event with 1 seat...');
    const event = await createTestEvent(organizerToken);
    console.log(`   ✅ Event created: "${event.title}"`);
    console.log(`   📊 Available seats: ${event.availableSeats}\n`);

    // Step 3: Simultaneously book the event
    console.log('3. Sending CONCURRENT booking requests...');
    console.log('   ⏱  Both requests sent at the same instant\n');

    const results = await Promise.allSettled([
      bookEvent(user1Token, event.id, 'User 1 (Alice)'),
      bookEvent(user2Token, event.id, 'User 2 (Bob)'),
    ]);

    // Step 4: Analyze results
    console.log('4. Results:\n');
    console.log('   ┌─────────────────────┬────────┬───────────┬────────────┐');
    console.log('   │ User                │ Status │ Result    │ Time (ms)  │');
    console.log('   ├─────────────────────┼────────┼───────────┼────────────┤');

    let successCount = 0;
    let failureCount = 0;

    for (const result of results) {
      const r = result.status === 'fulfilled' ? result.value : { status: 'ERROR', userName: '?', elapsed: 0 };
      const statusStr = r.status.toString().padEnd(6);
      const isSuccess = r.status === 201;

      if (isSuccess) successCount++;
      else failureCount++;

      const resultStr = (isSuccess ? '✅ BOOKED' : '❌ DENIED').padEnd(9);
      const name = r.userName.padEnd(19);
      const time = (r.elapsed + 'ms').padStart(10);

      console.log(`   │ ${name} │ ${statusStr} │ ${resultStr} │ ${time} │`);
    }

    console.log('   └─────────────────────┴────────┴───────────┴────────────┘\n');

    // Step 5: Verify database state
    console.log('5. Verifying database state...');
    const updatedEvent = await getEvent(event.id);
    console.log(`   📊 Available seats after test: ${updatedEvent.availableSeats}`);
    console.log(`   ✅ Successful bookings: ${successCount}`);
    console.log(`   ❌ Rejected bookings: ${failureCount}\n`);

    // Step 6: Final verdict
    console.log('═══════════════════════════════════════════════════');
    if (successCount === 1 && failureCount === 1 && updatedEvent.availableSeats === 0) {
      console.log('🎉 TEST PASSED! Concurrency handling is correct.');
      console.log('   - Exactly 1 booking succeeded');
      console.log('   - Exactly 1 booking was rejected');
      console.log('   - No overselling occurred');
      console.log('   - available_seats is 0 (correct)');
    } else {
      console.log('🚨 TEST FAILED! Concurrency issue detected.');
      console.log(`   - Expected: 1 success, 1 failure, 0 seats left`);
      console.log(`   - Got: ${successCount} successes, ${failureCount} failures, ${updatedEvent.availableSeats} seats left`);
    }
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

main();
