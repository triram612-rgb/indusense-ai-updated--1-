import * as THREE from 'three';
import type { Severity } from '@/lib/types';

/** Scene palette. Mirrors the Tailwind tokens so 2D and 3D never disagree. */
export const HEX = {
  void: '#07090C',
  surface: '#0E1218',
  panel: '#141A22',
  raised: '#1A212B',
  hairline: '#222B36',
  edge: '#2E3A49',
  signal: '#2F8BFF',
  signalBright: '#5AA7FF',
  nominal: '#12B5A0',
  caution: '#F59E0B',
  critical: '#F04438',
  unknown: '#8B7BD8',
  ink: '#E7ECF3',
  inkMuted: '#94A1B2',
} as const;

export const severityHex: Record<Severity, string> = {
  nominal: HEX.nominal,
  caution: HEX.caution,
  critical: HEX.critical,
  unknown: HEX.unknown,
};

export const severityColor: Record<Severity, THREE.Color> = {
  nominal: new THREE.Color(HEX.nominal),
  caution: new THREE.Color(HEX.caution),
  critical: new THREE.Color(HEX.critical),
  unknown: new THREE.Color(HEX.unknown),
};

/** The conveyor spine runs along X at this height. */
export const DECK_Y = 0.42;
export const LINE_START = -17.5;
export const LINE_END = 17;

/** Shared geometries — created once, reused by every instance in the scene. */
export const geo = {
  unit: new THREE.BoxGeometry(0.34, 0.2, 0.34),
  marker: new THREE.OctahedronGeometry(0.17, 0),
  particle: new THREE.SphereGeometry(0.055, 6, 6),
};

/** Shared materials for the chassis, so the whole plant reads as one machine. */
export const mat = {
  chassis: new THREE.MeshStandardMaterial({ color: '#171E27', roughness: 0.72, metalness: 0.32 }),
  chassisDark: new THREE.MeshStandardMaterial({ color: '#10161D', roughness: 0.85, metalness: 0.18 }),
  deck: new THREE.MeshStandardMaterial({ color: '#1C242E', roughness: 0.6, metalness: 0.4 }),
  rail: new THREE.MeshStandardMaterial({ color: '#2E3A49', roughness: 0.4, metalness: 0.7 }),
};
