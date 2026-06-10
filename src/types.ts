/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PhotoFrame {
  id: string;
  x: number;      // Percentage or relative coordinate inside a bounding box (0 - 100)
  y: number;      // Relative coordinate (0 - 100)
  width: number;  // Relative width (0 - 100)
  height: number; // Relative height (0 - 100)
  imageUrl: string | null; // Selected photo URL or null for empty frame
  shapeId: string; // The parent shape template id
}

export type LayoutStyle = 'GRID' | 'OFFS_BRICK' | 'CIRCLE';

export interface BaseShape {
  id: string;
  name: string;
  icon: string;
  type: 'svg' | 'canvas' | 'text';
  svgPath?: string; // Optional built-in SVG path representations
}

export interface PresetImage {
  id: string;
  url: string;
  label: string;
}
