/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhotoFrame, LayoutStyle } from './types';

/**
 * 仮想キャンバスを使って、指定された形状（SVGまたは日本語テキスト）の
 * 塗りつぶし領域（シルエット）を判定するための二次元ピクセルマップ（100x100）を作成します。
 */
export function generateSilhouetteMask(
  shapeId: string,
  svgPath: string | undefined,
  customText: string,
  fontSize: number = 80,
  fontFamily: string = 'Inter, "Mplus 1p", "Hiragino Kaku Gothic Pro", "Noto Sans JP", sans-serif'
): Promise<{ mask: boolean[][]; maskUrl: string }> {
  return new Promise((resolve) => {
    const size = 100;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // フォールバック: 全て塗りつぶし
      resolve({
        mask: Array(size).fill(null).map(() => Array(size).fill(true)),
        maskUrl: ''
      });
      return;
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // 背景を白、形状領域を黒、透過部を判断
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    let lines: string[] = [];
    let finalFontSize = 95;

    if (shapeId === 'japanese_text' || !svgPath) {
      // 文字を描画する。太字で中央に配置
      const textToDraw = customText || 'LOVE';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // テキストを読みやすく、100x100の格子に収まるように行分けする
      if (textToDraw.includes(' ')) {
        lines = textToDraw.split(' ').filter(Boolean);
      } else if (textToDraw.length <= 4) {
        lines = [textToDraw];
      } else if (textToDraw.length <= 7) {
        const mid = Math.ceil(textToDraw.length / 2);
        lines = [textToDraw.slice(0, mid), textToDraw.slice(mid)];
      } else {
        // 8〜10文字なら3つまたは2つに分ける
        const mid1 = Math.ceil(textToDraw.length / 3);
        const mid2 = Math.ceil((textToDraw.length * 2) / 3);
        if (textToDraw.length >= 9) {
          lines = [textToDraw.slice(0, mid1), textToDraw.slice(mid1, mid2), textToDraw.slice(mid2)];
        } else {
          const midHalf = Math.ceil(textToDraw.length / 2);
          lines = [textToDraw.slice(0, midHalf), textToDraw.slice(midHalf)];
        }
      }

      // すべての行がキャンバスに綺麗にフィットする最適な文字サイズを計算する
      const maxAllowedWidth = 92;
      const maxAllowedHeight = 92;

      for (let sizeTest = 95; sizeTest >= 11; sizeTest--) {
        ctx.font = `bold ${sizeTest}px ${fontFamily}`;
        let currentWidth = 0;
        for (const line of lines) {
          const w = ctx.measureText(line).width;
          if (w > currentWidth) currentWidth = w;
        }
        
        const totalHeight = lines.length * sizeTest * 1.05;
        if (currentWidth <= maxAllowedWidth && totalHeight <= maxAllowedHeight) {
          finalFontSize = sizeTest;
          break;
        }
        finalFontSize = sizeTest;
      }

      ctx.font = `bold ${finalFontSize}px ${fontFamily}`;
      ctx.lineWidth = finalFontSize * 0.08;
      ctx.strokeStyle = '#000000';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      // 各行を垂直中央に均等描画
      const totalHeight = lines.length * finalFontSize * 1.05;
      const startY = (size - totalHeight) / 2 + (finalFontSize / 2) + (finalFontSize * 0.05);
      
      lines.forEach((line, idx) => {
        const y = startY + idx * finalFontSize * 1.05;
        ctx.strokeText(line, size / 2, y);
        ctx.fillText(line, size / 2, y);
      });
    } else {
      // SVGパスを仮想的に描画
      // Path2D が使える環境を想定
      try {
        const p = new Path2D(svgPath);
        ctx.save();
        // SVGの想定座標系(0-100)からcanvas(0-100)にスケーリング
        ctx.fill(p);
        ctx.restore();
      } catch (e) {
        // Path2Dが対応していない場合のフォールバック（簡易形状）
        ctx.beginPath();
        if (shapeId === 'heart') {
          ctx.arc(30, 35, 25, 0, Math.PI * 2);
          ctx.arc(70, 35, 25, 0, Math.PI * 2);
          ctx.moveTo(5, 50);
          ctx.lineTo(50, 95);
          ctx.lineTo(95, 50);
          ctx.fill();
        } else {
          // デフォルト矩形
          ctx.fillRect(15, 15, 70, 70);
        }
      }
    }

    // ピクセルをスキャンしてマスクを作成
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const mask: boolean[][] = [];

    for (let y = 0; y < size; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // 黒色（#000000）に近い部分を形状内（マスク対象）とする
        const isSilhouette = r < 128 && g < 128 && b < 128;
        row.push(isSilhouette);
      }
      mask.push(row);
    }

    // --- 高解像度クリッピングマスク URL (800x800) の描画 ---
    const highResCanvas = document.createElement('canvas');
    highResCanvas.width = 800;
    highResCanvas.height = 800;
    const hrCtx = highResCanvas.getContext('2d');
    
    if (hrCtx) {
      hrCtx.fillStyle = '#000000'; // 黒（完全な不透明）で形状を塗りつぶし、背景は透明を保つ

      if (shapeId === 'japanese_text' || !svgPath) {
        const hrFontSize = finalFontSize * 8;
        hrCtx.font = `bold ${hrFontSize}px ${fontFamily}`;
        hrCtx.textAlign = 'center';
        hrCtx.textBaseline = 'middle';
        hrCtx.lineWidth = hrFontSize * 0.08;
        hrCtx.strokeStyle = '#000000';
        hrCtx.lineJoin = 'round';
        hrCtx.lineCap = 'round';
        
        const hrTotalHeight = lines.length * hrFontSize * 1.05;
        const hrStartY = (800 - hrTotalHeight) / 2 + (hrFontSize / 2) + (hrFontSize * 0.05);
        
        lines.forEach((line, idx) => {
          const y = hrStartY + idx * hrFontSize * 1.05;
          hrCtx.strokeText(line, 400, y);
          hrCtx.fillText(line, 400, y);
        });
      } else {
        try {
          const p = new Path2D(svgPath);
          hrCtx.save();
          hrCtx.scale(8, 8); // 100x100 から 800x800 に拡大
          hrCtx.fill(p);
          hrCtx.restore();
        } catch (e) {
          hrCtx.beginPath();
          if (shapeId === 'heart') {
            hrCtx.arc(240, 280, 200, 0, Math.PI * 2);
            hrCtx.arc(560, 280, 200, 0, Math.PI * 2);
            hrCtx.moveTo(40, 400);
            hrCtx.lineTo(400, 760);
            hrCtx.lineTo(760, 400);
            hrCtx.fill();
          } else {
            hrCtx.fillRect(120, 120, 560, 560);
          }
        }
      }
    }

    const maskUrl = highResCanvas.toDataURL('image/png');

    resolve({ mask, maskUrl });
  });
}

/**
 * マスクから、特定の領域がシルエット内に含まれているかの比率（0.0 〜 1.0）を計算します。
 */
export function getCoverageRatio(
  mask: boolean[][],
  x: number,
  y: number,
  w: number,
  h: number
): number {
  const size = mask.length;
  let matches = 0;
  let total = 0;

  const startX = Math.max(0, Math.floor(x));
  const endX = Math.min(size - 1, Math.floor(x + w));
  const startY = Math.max(0, Math.floor(y));
  const endY = Math.min(size - 1, Math.floor(y + h));

  for (let py = startY; py <= endY; py++) {
    for (let px = startX; px <= endX; px++) {
      total++;
      if (mask[py] && mask[py][px]) {
        matches++;
      }
    }
  }

  return total > 0 ? matches / total : 0;
}

/**
 * 分割数、レイアウトアルゴリズム、ベースマスクに基づいて、最適な
 * フォトフレーム座標（x, y, w, h）を自動計算して一括配置します。
 */
export function calculateMosaicLayout(
  mask: boolean[][],
  layoutStyle: LayoutStyle,
  density: number, // 分割密度の指定（例：低い=10、中=25、高い=50）
  shapeId: string,
  frameGap: number = 1.0 // 画像同士の隙間 (百分率座標系での引き算)
): PhotoFrame[] {
  const runLayout = (targetThreshold: number): PhotoFrame[] => {
    const frames: PhotoFrame[] = [];
    const size = 100; // 0-100の百分率座標系
    
    // 密度のスケーリング（グリッドの列数・解像度を決定 : 3 から 60 の範囲でスライダーでスムーズに可変）
    const columns = Math.max(3, Math.min(60, Math.round(density / 3.5)));
    const rows = columns;
    const cellW = size / columns;
    const cellH = size / rows;

    if (layoutStyle === 'GRID') {
      // 1. 格子状グリッドレイアウト
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const x = c * cellW;
          const y = r * cellH;
          
          // 矩形のカバー率を計算
          const coverage = getCoverageRatio(mask, x, y, cellW, cellH);
          if (coverage >= targetThreshold) {
            frames.push({
              id: `frame-grid-${r}-${c}-${count++}`,
              x: Math.round(x * 10) / 10,
              y: Math.round(y * 10) / 10,
              width: Math.round(Math.max(0.3, cellW - frameGap) * 10) / 10, // 隙間(ガーター)を設けるため小さく
              height: Math.round(Math.max(0.3, cellH - frameGap) * 10) / 10,
              imageUrl: null,
              shapeId
            });
          }
        }
      }
    } else if (layoutStyle === 'OFFS_BRICK') {
      // 2. レンガ調（レンガのように偶数行をオフセット）
      let count = 0;
      for (let r = 0; r < rows; r++) {
        const isOffsetRow = r % 2 === 1;
        const xOffset = isOffsetRow ? cellW / 2 : 0;
        
        // オフセット行はセルの数が1つ増減しうる
        const colsInRow = isOffsetRow ? columns + 1 : columns;
        
        for (let c = 0; c < colsInRow; c++) {
          let x = c * cellW - (isOffsetRow ? cellW / 2 : 0);
          const y = r * cellH;
          let w = cellW;
          
          // 画面外へのはみ出しを調整
          if (x < 0) {
            w = cellW + x;
            x = 0;
          }
          if (x + w > size) {
            w = size - x;
          }

          if (w < cellW / 3) continue; // 小さすぎる端数は除外

          const coverage = getCoverageRatio(mask, x, y, w, cellH);
          if (coverage >= targetThreshold) {
            frames.push({
              id: `frame-brick-${r}-${c}-${count++}`,
              x: Math.round(x * 10) / 10,
              y: Math.round(y * 10) / 10,
              width: Math.round(Math.max(0.3, w - (frameGap * 1.2)) * 10) / 10,
              height: Math.round(Math.max(0.3, cellH - frameGap) * 10) / 10,
              imageUrl: null,
              shapeId
            });
          }
        }
      }
    } else if (layoutStyle === 'CIRCLE') {
      // 3. 円形レイアウト（同心円状、または極座標状に円形フレームを配置）
      let count = 0;
      const center = 50;
      const ringCount = Math.max(2, Math.min(20, Math.round(density / 6.5)));
      const radiusStep = 45 / ringCount; // 外枠（0-100）に収まるよう最大45%

      // セルの大きさ（円を真円に保ちたいので直径を決定。適宜隙間を空ける）
      const baseDiameter = Math.min(cellW, cellH) * 0.95;
      const diameter = Math.max(0.3, baseDiameter - frameGap);

      // 1. 中心に1つ配置
      const centX = center - diameter / 2;
      const centY = center - diameter / 2;
      if (getCoverageRatio(mask, centX, centY, diameter, diameter) >= targetThreshold) {
        frames.push({
          id: `frame-circle-center-${count++}`,
          x: Math.round(centX * 10) / 10,
          y: Math.round(centY * 10) / 10,
          width: Math.round(diameter * 10) / 10,
          height: Math.round(diameter * 10) / 10,
          imageUrl: null,
          shapeId
        });
      }

      // 2. 周囲に同心円（リング）状に配置
      for (let r = 1; r <= ringCount; r++) {
        const radius = r * radiusStep;
        // 円周に応じて配置数を自動調整（隙間が空きすぎず重なりすぎないよう）
        const circumference = 2 * Math.PI * radius;
        const idealCount = Math.floor(circumference / (diameter * 1.15));
        const stepAngle = (2 * Math.PI) / Math.max(1, idealCount);

        for (let i = 0; i < idealCount; i++) {
          const angle = i * stepAngle;
          const x = center + radius * Math.cos(angle) - diameter / 2;
          const y = center + radius * Math.sin(angle) - diameter / 2;

          const coverage = getCoverageRatio(mask, x, y, diameter, diameter);
          if (coverage >= targetThreshold) {
            frames.push({
              id: `frame-circle-ring-${r}-${i}-${count++}`,
              x: Math.round(x * 10) / 10,
              y: Math.round(y * 10) / 10,
              width: Math.round(diameter * 10) / 10,
              height: Math.round(diameter * 10) / 10,
              imageUrl: null,
              shapeId
            });
          }
        }
      }
    }
    return frames;
  };

  // シルエットとの被り判定しきい値（この値以上の面積がシルエットに重なっていれば採用）
  const initialThreshold = (shapeId === 'japanese_text') ? 0.35 : 0.45;
  let frames = runLayout(initialThreshold);

  // もし配置領域が1つも見つからなかった場合、しきい値を段階的に下げて再試行する
  if (frames.length === 0) {
    const fallbacks = [0.25, 0.18, 0.12, 0.06, 0.02];
    for (const fb of fallbacks) {
      if (fb < initialThreshold) {
        frames = runLayout(fb);
        if (frames.length > 0) {
          break;
        }
      }
    }
  }

  return frames;
}
