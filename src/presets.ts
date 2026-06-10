/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseShape, PresetImage } from './types';

export const PRESET_SHAPES: BaseShape[] = [
  {
    id: 'shape_preset',
    name: '型 (Silhouette)',
    icon: '🔮',
    type: 'svg'
  },
  {
    id: 'custom_text',
    name: 'テキスト',
    icon: '✍️',
    type: 'text'
  }
];

export const SHAPE_SUB_PRESETS = [
  {
    id: 'heart',
    name: 'ハート型',
    icon: '❤️',
    svgPath: 'M50,25 C35,5 5,10 5,42 C5,70 45,95 50,95 C55,95 95,70 95,42 C95,10 65,5 50,25 Z'
  },
  {
    id: 'star',
    name: '星型',
    icon: '⭐',
    svgPath: 'M50,5 L63,38 L98,38 L70,58 L81,91 L50,70 L19,91 L30,58 L2,38 L37,38 Z'
  },
  {
    id: 'diamond',
    name: 'ダイヤ型',
    icon: '💎',
    svgPath: 'M50,5 L95,50 L50,95 L5,50 Z'
  },
  {
    id: 'circle',
    name: '円型',
    icon: '⚪',
    svgPath: 'M50,5 A45,45 0 1,1 49.9,5 Z'
  },
  {
    id: 'triangle',
    name: '三角形',
    icon: '🔺',
    svgPath: 'M50,10 L93,90 L7,90 Z'
  },
  {
    id: 'landscape_rect',
    name: '横長長方形',
    icon: '▭',
    svgPath: 'M5,25 L95,25 L95,75 L5,75 Z'
  },
  {
    id: 'portrait_rect',
    name: '縦長長方形',
    icon: '▯',
    svgPath: 'M25,5 L75,5 L75,95 L25,95 Z'
  },
  {
    id: 'square',
    name: '正方形',
    icon: '⬛',
    svgPath: 'M10,10 L90,10 L90,90 L10,90 Z'
  }
];

// Rich set of preloaded, copyright-free high-quality images for immediate beautiful outputs
export const SAMPLE_IMAGES: PresetImage[] = [];
