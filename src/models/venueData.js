'use strict';

/**
 * In-memory data store for venue state.
 * Holds zones, facilities, navigation graph, and notifications.
 */

const zones = [
  { id: 'A1', name: 'North Gate Entry', capacity: 500, current: 0, x: 50, y: 10 },
  { id: 'A2', name: 'South Gate Entry', capacity: 500, current: 0, x: 50, y: 90 },
  { id: 'A3', name: 'East Gate Entry', capacity: 400, current: 0, x: 90, y: 50 },
  { id: 'A4', name: 'West Gate Entry', capacity: 400, current: 0, x: 10, y: 50 },
  { id: 'B1', name: 'North Concourse', capacity: 1000, current: 0, x: 50, y: 25 },
  { id: 'B2', name: 'South Concourse', capacity: 1000, current: 0, x: 50, y: 75 },
  { id: 'B3', name: 'East Concourse', capacity: 800, current: 0, x: 75, y: 50 },
  { id: 'B4', name: 'West Concourse', capacity: 800, current: 0, x: 25, y: 50 },
  { id: 'C1', name: 'Seating Section A', capacity: 2000, current: 0, x: 40, y: 40 },
  { id: 'C2', name: 'Seating Section B', capacity: 2000, current: 0, x: 60, y: 40 },
  { id: 'C3', name: 'Seating Section C', capacity: 2000, current: 0, x: 60, y: 60 },
  { id: 'C4', name: 'Seating Section D', capacity: 2000, current: 0, x: 40, y: 60 },
  { id: 'D1', name: 'Field / Pitch', capacity: 100, current: 0, x: 50, y: 50 },
];

const facilities = [
  { id: 'F01', name: 'North Concessions Stand 1', type: 'concessions', zoneId: 'B1', waitMinutes: 0, isOpen: true },
  { id: 'F02', name: 'North Concessions Stand 2', type: 'concessions', zoneId: 'B1', waitMinutes: 0, isOpen: true },
  { id: 'F03', name: 'South Concessions Stand 1', type: 'concessions', zoneId: 'B2', waitMinutes: 0, isOpen: true },
  { id: 'F04', name: 'South Concessions Stand 2', type: 'concessions', zoneId: 'B2', waitMinutes: 0, isOpen: true },
  { id: 'F05', name: 'East Concessions Stand',    type: 'concessions', zoneId: 'B3', waitMinutes: 0, isOpen: true },
  { id: 'F06', name: 'West Concessions Stand',    type: 'concessions', zoneId: 'B4', waitMinutes: 0, isOpen: true },
  { id: 'F07', name: 'North Restrooms M',   type: 'restroom', zoneId: 'B1', waitMinutes: 0, isOpen: true },
  { id: 'F08', name: 'North Restrooms W',   type: 'restroom', zoneId: 'B1', waitMinutes: 0, isOpen: true },
  { id: 'F09', name: 'South Restrooms M',   type: 'restroom', zoneId: 'B2', waitMinutes: 0, isOpen: true },
  { id: 'F10', name: 'South Restrooms W',   type: 'restroom', zoneId: 'B2', waitMinutes: 0, isOpen: true },
  { id: 'F11', name: 'East Restrooms',      type: 'restroom', zoneId: 'B3', waitMinutes: 0, isOpen: true },
  { id: 'F12', name: 'West Restrooms',      type: 'restroom', zoneId: 'B4', waitMinutes: 0, isOpen: true },
  { id: 'F13', name: 'North Entry Gate 1',  type: 'gate', zoneId: 'A1', waitMinutes: 0, isOpen: true },
  { id: 'F14', name: 'North Entry Gate 2',  type: 'gate', zoneId: 'A1', waitMinutes: 0, isOpen: true },
  { id: 'F15', name: 'South Entry Gate 1',  type: 'gate', zoneId: 'A2', waitMinutes: 0, isOpen: true },
  { id: 'F16', name: 'South Entry Gate 2',  type: 'gate', zoneId: 'A2', waitMinutes: 0, isOpen: true },
  { id: 'F17', name: 'East Entry Gate',     type: 'gate', zoneId: 'A3', waitMinutes: 0, isOpen: true },
  { id: 'F18', name: 'West Entry Gate',     type: 'gate', zoneId: 'A4', waitMinutes: 0, isOpen: true },
  { id: 'F19', name: 'First Aid North',     type: 'medical', zoneId: 'B1', waitMinutes: 0, isOpen: true },
  { id: 'F20', name: 'First Aid South',     type: 'medical', zoneId: 'B2', waitMinutes: 0, isOpen: true },
];

/**
 * Adjacency list for navigation graph (zone id -> list of neighbour zone ids).
 * Edges are bidirectional.
 */
const navigationGraph = {
  A1: ['B1'],
  A2: ['B2'],
  A3: ['B3'],
  A4: ['B4'],
  B1: ['A1', 'B3', 'B4', 'C1', 'C2'],
  B2: ['A2', 'B3', 'B4', 'C3', 'C4'],
  B3: ['A3', 'B1', 'B2', 'C2', 'C3'],
  B4: ['A4', 'B1', 'B2', 'C1', 'C4'],
  C1: ['B1', 'B4', 'D1'],
  C2: ['B1', 'B3', 'D1'],
  C3: ['B2', 'B3', 'D1'],
  C4: ['B2', 'B4', 'D1'],
  D1: ['C1', 'C2', 'C3', 'C4'],
};

const notifications = [];

module.exports = { zones, facilities, navigationGraph, notifications };
