'use strict';

const { zones, navigationGraph } = require('../models/venueData');

/**
 * BFS-based shortest path between two zones.
 * Returns the sequence of zone ids or null if no path exists.
 * @param {string} fromId
 * @param {string} toId
 * @returns {string[]|null}
 */
function shortestPath(fromId, toId) {
  if (fromId === toId) return [fromId];
  if (!navigationGraph[fromId] || !navigationGraph[toId]) return null;

  const visited = new Set([fromId]);
  const queue = [[fromId]];

  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];

    for (const neighbour of navigationGraph[node] || []) {
      if (neighbour === toId) return [...path, neighbour];
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push([...path, neighbour]);
      }
    }
  }
  return null;
}

/**
 * Find the recommended (least-congested) route between two zones.
 * The algorithm finds the path that minimises total zone occupancy,
 * falling back to shortest path when congestion is equal.
 *
 * @param {string} fromId
 * @param {string} toId
 * @returns {{ path: string[], zoneDetails: object[], totalOccupancy: number }|null}
 */
function getRecommendedRoute(fromId, toId) {
  if (fromId === toId) {
    const zone = zones.find((z) => z.id === fromId);
    return zone
      ? { path: [fromId], zoneDetails: [zone], totalOccupancy: zone.current }
      : null;
  }

  if (!navigationGraph[fromId] || !navigationGraph[toId]) return null;

  // Dijkstra-style with occupancy as cost
  const occupancy = (id) => (zones.find((z) => z.id === id) || { current: 0 }).current;

  const dist = { [fromId]: 0 };
  const prev = {};
  const unvisited = new Set(Object.keys(navigationGraph));

  while (unvisited.size) {
    // Pick unvisited node with lowest dist
    let u = null;
    for (const node of unvisited) {
      if (dist[node] !== undefined) {
        if (u === null || dist[node] < dist[u]) u = node;
      }
    }
    if (u === null || u === toId) break;
    unvisited.delete(u);

    for (const neighbour of navigationGraph[u] || []) {
      const alt = dist[u] + occupancy(neighbour);
      if (dist[neighbour] === undefined || alt < dist[neighbour]) {
        dist[neighbour] = alt;
        prev[neighbour] = u;
      }
    }
  }

  if (dist[toId] === undefined) return null;

  // Reconstruct path
  const path = [];
  let cur = toId;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }

  const zoneDetails = path.map((id) => zones.find((z) => z.id === id) || { id });
  return { path, zoneDetails, totalOccupancy: dist[toId] };
}

module.exports = { shortestPath, getRecommendedRoute };
