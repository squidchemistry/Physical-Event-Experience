# Physical Event Experience 🏟️

A **real-time venue coordination platform** that improves the physical event experience for attendees at large-scale sporting venues. The system tackles crowd movement, waiting times, and real-time coordination through a live web dashboard and a REST + WebSocket API.

---

## Features

| Feature | Description |
|---|---|
| **Live Crowd Map** | Interactive venue map showing crowd density per zone (Low → Moderate → High → Critical) |
| **Concession & Restroom Wait Times** | Real-time wait estimates for every food stand, restroom, and entry gate |
| **Smart Navigation** | Dijkstra-based routing that recommends the least-congested path between any two zones |
| **Real-time Alerts** | Push notifications for closures, crowd surges, medical incidents, and special announcements |
| **Venue Overview Stats** | Live totals for attendee count, capacity utilisation, critical zones, and open facilities |

---

## Architecture

```
Physical-Event-Experience/
├── server.js                  # Entry point – starts HTTP + Socket.IO server
├── src/
│   ├── app.js                 # Express app factory
│   ├── models/
│   │   └── venueData.js       # In-memory venue state (zones, facilities, navigation graph)
│   ├── services/
│   │   ├── venueService.js    # Zone & facility CRUD with density enrichment
│   │   ├── navigationService.js # BFS + Dijkstra routing across zone graph
│   │   └── notificationService.js # Notification management
│   └── routes/
│       ├── zones.js           # GET/PUT /api/zones
│       ├── facilities.js      # GET/PUT /api/facilities
│       ├── navigation.js      # GET /api/navigation/:from/:to
│       └── notifications.js   # GET/POST /api/notifications
├── public/
│   ├── index.html             # Attendee-facing SPA
│   ├── css/styles.css         # Dark-themed, mobile-first UI
│   └── js/app.js              # Frontend – Socket.IO + REST client
└── tests/
    ├── venueService.test.js
    ├── navigationService.test.js
    ├── notificationService.test.js
    └── api.test.js
```

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Install

```bash
npm install
```

### Run

```bash
npm start
# Server running on http://localhost:3000
```

Open `http://localhost:3000` in your browser to view the live dashboard.

### Test

```bash
npm test
```

---

## REST API

All endpoints return JSON. Clients should `Content-Type: application/json` on write requests.

### Zones

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/zones` | List all zones with density metrics |
| `GET` | `/api/zones/:id` | Get a single zone |
| `PUT` | `/api/zones/:id/density` | Update crowd count `{ current: number }` |

### Facilities

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/facilities` | List all facilities; filter with `?type=concessions\|restroom\|gate\|medical` |
| `PUT` | `/api/facilities/:id` | Update `{ waitMinutes?, isOpen? }` |

### Navigation

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/navigation/:from/:to` | Returns the least-congested route between two zone ids |

### Notifications

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | List recent notifications; filter with `?limit=N` |
| `POST` | `/api/notifications` | Create `{ message, severity?, zoneId?, facilityId? }` |

---

## WebSocket Events

The server broadcasts the following Socket.IO events:

| Event | Payload | Trigger |
|---|---|---|
| `zone:update` | Updated zone object | `PUT /api/zones/:id/density` |
| `facility:update` | Updated facility object | `PUT /api/facilities/:id` |
| `notification:new` | New notification object | `POST /api/notifications` |

---

## Density Levels

| Level | Occupancy | Colour |
|---|---|---|
| Low | < 40% | 🟢 Green |
| Moderate | 40 – 64% | 🟡 Amber |
| High | 65 – 84% | 🟠 Orange |
| Critical | ≥ 85% | 🔴 Red (pulsing) |

---

## License

ISC
