import { randomUUID } from 'node:crypto';

const baseUrl = process.env.API_URL ?? 'http://localhost:3000/v1';
const adminApiKey = process.env.ADMIN_API_KEY ?? 'change-me-with-a-long-random-value';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { response, body };
}

function adminHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Api-Key': adminApiKey,
    ...extra,
  };
}

function deviceHeaders(token, extra = {}) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const health = await request('/health/ready');
assert(health.response.ok, 'Backend is not ready');

const spaceResult = await request('/spaces', {
  method: 'POST',
  headers: adminHeaders(),
  body: JSON.stringify({ displayName: `Demo ${Date.now()}` }),
});
assert(spaceResult.response.status === 201, 'Unable to create space');
const space = spaceResult.body;

const pairingResult = await request(`/spaces/${space.id}/devices/pairing-code`, {
  method: 'POST',
  headers: adminHeaders(),
});
assert(pairingResult.response.status === 201, 'Unable to create pairing code');

const enrollResult = await request('/devices/enroll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pairingCode: pairingResult.body.pairingCode,
    name: 'Kanso Demo Phone',
  }),
});
assert(enrollResult.response.status === 201, 'Unable to enroll device');
let deviceToken = enrollResult.body.deviceToken;

const reusePairing = await request('/devices/enroll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pairingCode: pairingResult.body.pairingCode,
    name: 'Second Phone',
  }),
});
assert(reusePairing.response.status === 400, 'Pairing code should be single-use');

const policy1 = await request(`/spaces/${space.id}/policy`, {
  method: 'PUT',
  headers: adminHeaders(),
  body: JSON.stringify({
    content: {
      autonomy: { communication: 2, demarches: 1, medias: 2, achats: 1 },
      accessibility: { reducedAnimations: true },
    },
  }),
});
assert(policy1.response.ok && policy1.body.version === 1, 'Policy v1 failed');

const pull1 = await request('/devices/me/policy', {
  headers: deviceHeaders(deviceToken),
});
assert(pull1.response.status === 200, 'Initial policy pull failed');
const etag1 = pull1.response.headers.get('etag');
assert(Boolean(etag1), 'ETag missing');

const unchanged = await request('/devices/me/policy', {
  headers: deviceHeaders(deviceToken, { 'If-None-Match': etag1 }),
});
assert(unchanged.response.status === 304, 'Expected 304');

const policy2 = await request(`/spaces/${space.id}/policy`, {
  method: 'PUT',
  headers: adminHeaders(),
  body: JSON.stringify({
    content: {
      autonomy: { communication: 3, demarches: 1, medias: 2, achats: 1 },
      accessibility: { reducedAnimations: true },
    },
  }),
});
assert(policy2.response.ok && policy2.body.version === 2, 'Policy v2 failed');

const pull2 = await request('/devices/me/policy', {
  headers: deviceHeaders(deviceToken, { 'If-None-Match': etag1 }),
});
assert(pull2.response.status === 200 && pull2.body.version === 2, 'Updated policy pull failed');

const events = [
  {
    eventId: randomUUID(),
    type: 'guidage.termine',
    occurredAt: new Date().toISOString(),
  },
  {
    eventId: randomUUID(),
    type: 'politique.appliquee',
    occurredAt: new Date().toISOString(),
    policyVersion: 2,
  },
];

for (let attempt = 0; attempt < 2; attempt += 1) {
  const eventResult = await request('/devices/me/events', {
    method: 'POST',
    headers: deviceHeaders(deviceToken),
    body: JSON.stringify({ events }),
  });
  assert(eventResult.response.ok, 'Event upload failed');
  assert(eventResult.body.acknowledged.length === 2, 'Event acknowledgement failed');
}

const devices = await request(`/spaces/${space.id}/devices`, {
  headers: adminHeaders(),
});
assert(devices.response.ok, 'Unable to list devices');
assert(devices.body.length === 1, 'Unexpected device count');
assert(devices.body[0].appliedPolicyVersion === 2, 'Applied policy version was not updated');

const eventList = await request(`/spaces/${space.id}/events?limit=10`, {
  headers: adminHeaders(),
});
assert(eventList.response.ok, 'Unable to list events');
assert(eventList.body.items.length === 2, 'Idempotence failed');

const rotate = await request('/devices/me/token/rotate', {
  method: 'POST',
  headers: deviceHeaders(deviceToken),
});
assert(rotate.response.ok, 'Token rotation failed');
const previousToken = deviceToken;
deviceToken = rotate.body.deviceToken;

const oldTokenAttempt = await request('/devices/me/policy', {
  headers: deviceHeaders(previousToken),
});
assert(oldTokenAttempt.response.status === 401, 'Old token should be invalid');

const newTokenAttempt = await request('/devices/me/policy', {
  headers: deviceHeaders(deviceToken),
});
assert(newTokenAttempt.response.ok, 'New token should be valid');

const revoke = await request(`/devices/${enrollResult.body.deviceId}/revoke`, {
  method: 'POST',
  headers: adminHeaders(),
});
assert(revoke.response.ok, 'Device revocation failed');

const revokedAttempt = await request('/devices/me/policy', {
  headers: deviceHeaders(deviceToken),
});
assert(revokedAttempt.response.status === 401, 'Revoked device should be unauthorized');

console.log(JSON.stringify({
  status: 'ok',
  spaceId: space.id,
  deviceId: enrollResult.body.deviceId,
  policyVersion: 2,
  storedEvents: eventList.body.items.length,
}, null, 2));
