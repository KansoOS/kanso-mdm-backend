import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const baseUrl = process.env.API_URL ?? 'http://localhost:3000/v1';
const adminApiKey = process.env.ADMIN_API_KEY ?? 'change-me-with-a-long-random-value';
const statePath = new URL('./offline-device-state.json', import.meta.url);
const queuePath = new URL('./offline-device-events.json', import.meta.url);

async function readJson(path, fallback) {
  if (!existsSync(path)) {
    return fallback;
  }
  return JSON.parse(await readFile(path, 'utf8'));
}

async function saveJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  return {
    response,
    body: text ? JSON.parse(text) : null,
  };
}

let state = await readJson(statePath, {});
let queue = await readJson(queuePath, []);

if (!state.deviceToken) {
  const space = await fetchJson('/spaces', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Api-Key': adminApiKey,
    },
    body: JSON.stringify({ displayName: 'Offline Device Demo' }),
  });

  const pairing = await fetchJson(`/spaces/${space.body.id}/devices/pairing-code`, {
    method: 'POST',
    headers: { 'X-Admin-Api-Key': adminApiKey },
  });

  const enrollment = await fetchJson('/devices/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pairingCode: pairing.body.pairingCode,
      name: 'Offline Demo Phone',
    }),
  });

  state = {
    spaceId: space.body.id,
    deviceId: enrollment.body.deviceId,
    deviceToken: enrollment.body.deviceToken,
    etag: null,
    policy: null,
  };

  await saveJson(statePath, state);
}

queue.push({
  eventId: randomUUID(),
  type: 'guidage.termine',
  occurredAt: new Date().toISOString(),
});
await saveJson(queuePath, queue);

try {
  const headers = {
    Authorization: `Bearer ${state.deviceToken}`,
  };

  if (state.etag) {
    headers['If-None-Match'] = state.etag;
  }

  const policyResponse = await fetch(`${baseUrl}/devices/me/policy`, { headers });

  if (policyResponse.status === 200) {
    state.etag = policyResponse.headers.get('etag');
    state.policy = await policyResponse.json();
    await saveJson(statePath, state);
  }

  if (queue.length > 0) {
    const upload = await fetchJson('/devices/me/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.deviceToken}`,
      },
      body: JSON.stringify({ events: queue }),
    });

    if (upload.response.ok) {
      const acknowledged = new Set(upload.body.acknowledged);
      queue = queue.filter((event) => !acknowledged.has(event.eventId));
      await saveJson(queuePath, queue);
    }
  }

  console.log(JSON.stringify({ online: true, pendingEvents: queue.length, etag: state.etag }, null, 2));
} catch {
  console.log(JSON.stringify({ online: false, pendingEvents: queue.length, etag: state.etag }, null, 2));
}
