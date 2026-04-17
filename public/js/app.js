/* global io */
'use strict';

/**
 * Physical Event Experience – Frontend Application
 *
 * Connects to the backend via Socket.IO for real-time updates and
 * uses the REST API for initial data fetch and navigation queries.
 */

const API = '';   // relative – same origin

// ---------- State -----------------------------------------
let zonesData = [];
let facilitiesData = [];

// ---------- Socket.IO ----------------------------------------
const socket = io();

const badge = document.getElementById('connection-badge');
socket.on('connect', () => {
  badge.textContent = 'Live';
  badge.className = 'connection-badge connected';
});
socket.on('disconnect', () => {
  badge.textContent = 'Offline';
  badge.className = 'connection-badge disconnected';
});

socket.on('zone:update', (zone) => {
  const idx = zonesData.findIndex((z) => z.id === zone.id);
  if (idx !== -1) zonesData[idx] = zone;
  renderMap();
  renderStats();
});

socket.on('facility:update', (facility) => {
  const idx = facilitiesData.findIndex((f) => f.id === facility.id);
  if (idx !== -1) facilitiesData[idx] = facility;
  renderFacilityLists();
  renderStats();
});

socket.on('notification:new', (notif) => {
  prependNotification(notif);
});

// ---------- API helpers -----------------------------------------
async function apiFetch(path, options) {
  const res = await fetch(API + path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---------- Initial load -----------------------------------------
async function loadAll() {
  try {
    [zonesData, facilitiesData] = await Promise.all([
      apiFetch('/api/zones'),
      apiFetch('/api/facilities'),
    ]);
    renderMap();
    renderFacilityLists();
    renderStats();
    populateNavSelects();
  } catch (err) {
    console.error('Failed to load initial data', err);
  }

  try {
    const notifications = await apiFetch('/api/notifications');
    const list = document.getElementById('notif-list');
    if (notifications.length === 0) return;
    list.innerHTML = '';
    notifications.forEach((n) => appendNotification(n, list));
  } catch (err) {
    console.error('Failed to load notifications', err);
  }
}

// ---------- Venue map rendering ---------------------------------
function densityColor(level) {
  const map = { low: '#4caf50', moderate: '#ffb300', high: '#ff7043', critical: '#e53935' };
  return map[level] || '#555';
}

function renderMap() {
  const container = document.getElementById('venue-map');
  container.innerHTML = '';

  zonesData.forEach((z) => {
    const el = document.createElement('div');
    el.className = `map-zone ${z.densityLevel}`;
    el.style.left = `${z.x}%`;
    el.style.top  = `${z.y}%`;
    el.style.background = densityColor(z.densityLevel);

    // Size based on capacity
    const base = 44;
    const size = Math.min(base + Math.round(z.capacity / 100), 80);
    el.style.width  = `${size}px`;
    el.style.height = `${size}px`;

    el.innerHTML = `<span class="zone-id">${z.id}</span><span class="zone-pct">${z.occupancyPercent}%</span>`;
    el.setAttribute('title', `${z.name}\n${z.current} / ${z.capacity} (${z.occupancyPercent}%)`);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${z.name}: ${z.occupancyPercent}% full, ${z.densityLevel} density`);
    container.appendChild(el);
  });
}

// ---------- Stats summary -----------------------------------------
function renderStats() {
  const totalAttendees = zonesData.reduce((s, z) => s + z.current, 0);
  const totalCapacity  = zonesData.reduce((s, z) => s + z.capacity, 0);
  const pct = totalCapacity > 0 ? Math.round((totalAttendees / totalCapacity) * 100) : 0;
  const critical = zonesData.filter((z) => z.densityLevel === 'critical').length;
  const openFacilities = facilitiesData.filter((f) => f.isOpen).length;

  document.getElementById('stat-total-attendees').textContent = totalAttendees.toLocaleString();
  document.getElementById('stat-capacity-pct').textContent    = `${pct}%`;
  document.getElementById('stat-critical-zones').textContent  = critical;
  document.getElementById('stat-open-facilities').textContent = openFacilities;
}

// ---------- Facility wait-time lists ---------------------------------
function waitBadgeClass(facility) {
  if (!facility.isOpen) return 'closed';
  if (facility.waitMinutes === 0) return 'wait-0';
  if (facility.waitMinutes <= 5) return 'wait-low';
  if (facility.waitMinutes <= 15) return 'wait-medium';
  return 'wait-high';
}

function waitBadgeText(facility) {
  if (!facility.isOpen) return 'Closed';
  if (facility.waitMinutes === 0) return 'No wait';
  return `~${facility.waitMinutes} min`;
}

function facilityIcon(type) {
  const icons = { concessions: '🍔', restroom: '🚻', gate: '🎟️', medical: '🏥' };
  return icons[type] || '📍';
}

function renderFacilityList(containerId, type) {
  const list = document.getElementById(containerId);
  const items = facilitiesData.filter((f) => f.type === type);
  list.innerHTML = items
    .map(
      (f) => `<li class="wait-item">
        <span class="wait-item__icon" aria-hidden="true">${facilityIcon(f.type)}</span>
        <span class="wait-item__name" title="${f.name}">${f.name}</span>
        <span class="wait-item__badge ${waitBadgeClass(f)}">${waitBadgeText(f)}</span>
      </li>`
    )
    .join('');
}

function renderFacilityLists() {
  renderFacilityList('concessions-list', 'concessions');
  renderFacilityList('restrooms-list', 'restroom');
  renderFacilityList('gates-list', 'gate');
}

// ---------- Navigation form -----------------------------------------
function populateNavSelects() {
  const fromSel = document.getElementById('nav-from');
  const toSel   = document.getElementById('nav-to');

  const options = zonesData
    .map((z) => `<option value="${z.id}">${z.id} – ${z.name}</option>`)
    .join('');

  fromSel.innerHTML = '<option value="">— Starting zone —</option>' + options;
  toSel.innerHTML   = '<option value="">— Destination zone —</option>' + options;
}

document.getElementById('nav-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const from = document.getElementById('nav-from').value;
  const to   = document.getElementById('nav-to').value;
  const resultEl = document.getElementById('route-result');

  if (!from || !to) {
    resultEl.hidden = false;
    resultEl.innerHTML = '<p style="color:var(--density-high)">Please select both a starting zone and a destination.</p>';
    return;
  }
  if (from === to) {
    resultEl.hidden = false;
    resultEl.innerHTML = '<p>You are already at your destination.</p>';
    return;
  }

  try {
    const route = await apiFetch(`/api/navigation/${encodeURIComponent(from)}/${encodeURIComponent(to)}`);
    renderRoute(route, resultEl);
  } catch (err) {
    resultEl.hidden = false;
    resultEl.innerHTML = `<p style="color:var(--density-high)">Could not find a route: ${err.message}</p>`;
  }
});

function renderRoute(route, container) {
  const zoneMap = Object.fromEntries(zonesData.map((z) => [z.id, z]));
  const steps = route.path
    .map((id) => {
      const z = zoneMap[id] || { id, name: id, densityLevel: 'low', occupancyPercent: 0 };
      return `<div class="route-step">
        <span class="route-step__arrow">›</span>
        <span class="route-step__zone">${z.id}</span>
        <span class="density-pill ${z.densityLevel}">${z.occupancyPercent}%</span>
        <span style="font-size:.78rem;color:var(--color-text-dim)">${z.name || ''}</span>
      </div>`;
    })
    .join('');

  container.hidden = false;
  container.innerHTML = `
    <p style="font-size:.8rem;color:var(--color-text-dim);margin-bottom:.4rem">
      Recommended route (${route.path.length} stops):
    </p>
    <div class="route-steps">${steps}</div>`;
}

// ---------- Notifications -----------------------------------------
function buildNotifItem(notif) {
  const li = document.createElement('li');
  li.className = `notif-item ${notif.severity}`;
  const time = new Date(notif.timestamp).toLocaleTimeString();
  li.innerHTML = `<div>${escapeHtml(notif.message)}</div><div class="notif-item__time">${time}</div>`;
  return li;
}

function prependNotification(notif) {
  const list = document.getElementById('notif-list');
  const empty = list.querySelector('.notif-empty');
  if (empty) empty.remove();
  list.insertBefore(buildNotifItem(notif), list.firstChild);
  // Keep list manageable
  while (list.children.length > 50) list.removeChild(list.lastChild);
}

function appendNotification(notif, list) {
  list.appendChild(buildNotifItem(notif));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- Bootstrap -----------------------------------------
loadAll();
