/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Heart, 
  Image as ImageIcon, 
  Upload, 
  Copy, 
  Shuffle, 
  AlertCircle, 
  Grid, 
  Layers, 
  Type, 
  Download,
  Check, 
  Trash2, 
  Code2, 
  ChevronRight, 
  Info,
  ZoomIn,
  ZoomOut,
  Palette,
  Eye,
  RefreshCw,
  HelpCircle,
  Undo2,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';

// 自作の型定義とレイアウトユーティリティをインポート
import { BaseShape, LayoutStyle, PhotoFrame } from './types';
import { PRESET_SHAPES, SAMPLE_IMAGES, SHAPE_SUB_PRESETS } from './presets';
import { generateSilhouetteMask, calculateMosaicLayout } from './layoutUtils';

const G20_LANGUAGES = [
  { code: 'ja', name: '日本語 (Japan)', flag: '🇯🇵', word: '平和' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', word: 'LOVE' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧', word: 'HOPE' },
  { code: 'zh-CN', name: '简体中文 (China)', flag: '🇨🇳', word: '福' },
  { code: 'de', name: 'Deutsch (Germany)', flag: '🇩🇪', word: 'LIEBE' },
  { code: 'fr', name: 'Français (France)', flag: '🇫🇷', word: 'AMOUR' },
  { code: 'it', name: 'Italiano (Italy)', flag: '🇮🇹', word: 'AMORE' },
  { code: 'ko', name: '한국어 (Korea)', flag: '🇰🇷', word: '사랑' },
  { code: 'hi', name: 'हिन्दी (India)', flag: '🇮🇳', word: 'प्यार' },
  { code: 'pt', name: 'Português (Brazil)', flag: '🇧🇷', word: 'AMOR' },
  { code: 'ru', name: 'Русский (Russia)', flag: '🇷🇺', word: 'МИР' },
  { code: 'es-MX', name: 'Español (Mexico)', flag: '🇲🇽', word: 'AMOR' },
  { code: 'es-AR', name: 'Español (Argentina)', flag: '🇦🇷', word: 'VIDA' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', word: 'KASIH' },
  { code: 'ar', name: 'العربية (Saudi Arabia)', flag: '🇸🇦', word: 'سلام' },
  { code: 'tr', name: 'Türkçe (Turkey)', flag: '🇹🇷', word: 'SEVGİ' },
  { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺', word: 'MATE' },
  { code: 'en-CA', name: 'English (Canada)', flag: '🇨🇦', word: 'PEACE' },
  { code: 'en-ZA', name: 'English (South Africa)', flag: '🇿🇦', word: 'UNITY' },
  { code: 'eu', name: 'English (EU)', flag: '🇪🇺', word: 'UNITY' }
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  ja: {
    title: "フォトアート", tutorial: "使い方", total_cells: "合計セル数", tutorial_guide: "フォトアート 使い方チュートリアル",
    tut_step_1_title: "思い出写真のアップロード", tut_step_1_desc: "PCやスマホからお好みの写真（複数選択可）をアップロードすることで、自分だけの完全にオリジナルなコラージュが作れます。",
    tut_step_2_title: "一括自動配備", tut_step_2_desc: "「一括挿入」ボタンをクリックすることで、すべてのグレー枠に瞬時におしゃれな写真素材を自動で敷き詰めることができます。",
    tut_step_3_title: "画像の瞬間シャッフル", tut_step_3_desc: "「画像シャッフル」機能を使うことで、既にセットされている写真同士の配置パターンを数秒で別パターンへランダムに入れ替えて楽しめます。",
    tab_shape: "1. ベース形状", tab_layout: "2. 分割レイアウト", tab_photo: "3. 写真・一括", tab_dev: "4. コード取得",
    shape_main_title: "1. 全体の形を選択する", shape_main_desc: "コラージュのマスターシルエットです。個別フレームはここからはみ出さないように自動で敷き詰められます。",
    shape_preset_label: "ベース形状を選択:", shape_text_label: "表示する文字 (コラージュシルエットになります)：",
    text_placeholder: "好きなアルファベットや文字を入力してください", text_desc: "※文字数やスペース、アルファベットに応じて、自動で2行や3行に美しくマルチライン最適化されます。",
    shape_heart: "ハート型", shape_star: "星型", shape_diamond: "ダイヤ型", shape_circle: "円型", shape_triangle: "三角形", shape_landscape_rect: "横長長方形", shape_portrait_rect: "縦長長方形", shape_square: "正方形", shape_preset: "シルエット型", custom_text: "カスタムテキスト",
    layout_main_title: "2. コラージュの分割レイアウト", layout_style: "分割アルゴリズムを選択：", layout_density: "分割フレーム数（直接入力も可）：",
    layout_gap_label: "画像同士の隙間 (Gap / Spacing)",
    layout_gap_desc: "0.0% (隙間ゼロ) 〜 3.5% の範囲で画像と画像の隙間をスライダーで細かく調整できます。",
    gap_zero: "隙間なし", gap_wide: "広め",
    density_desc_1: "10〜200の範囲で自動算出されます。数値が大きくなるほど写真のマス目が細かくなります。",
    density_coarse: "粗め", density_medium: "標準ふつう", density_fine: "細かめ", density_exfine: "極細", canvas_ratio: "キャンバスのアスペクト比：",
    algo_grid_p_title: "格子状", algo_grid_p_desc: "整然としたモザイクフレームを敷き詰めます", algo_brick_p_title: "レンガ調", algo_brick_p_desc: "偶数行をズラした西洋レンガ積みのレイアウト",
    photo_main_title: "3. 写真の一括・個別配備", photo_main_desc: "お気に入りの写真をアップロードして、一括配置やシャッフル機能で楽しくコラージュを編集しましょう！",
    btn_upload: "PC等の写真を追加", btn_insert: "一括挿入", btn_shuffle: "画像シャッフル", btn_clear: "写真クリア", pool_title: "現在の写真プール", btn_cloud_photos: "クラウド写真を追加選択する",
    no_photos: "アップロードされた写真はありません。上のボタンから追加してください。",
    dropzone: "ここに写真をドロップして追加 (複数可)",
    export_main_title: "4. 完全スタンドアロン HTML エクスポート", export_main_desc: "ここで作成したコラージュと、レイアウト計算 of すべての機能を1つのHTMLファイルにパッケージングしてエクスポートします。",
    btn_download_html: "スタンドアロンHTMLファイルをダウンロード", btn_copy_html: "HTMLコードをコピーする",
    zoom: "ズーム:", color_tune: "背景色を自由に調色:", color_hue: "色", color_sat: "彩", color_light: "明", layout_preview: "レイアウトプレビュー", btn_download_png: "モザイクフォトをPNG画像で書き出す",
    toast_copied_html: "📋 index.htmlのソースコードをクリップボードにコピーしました！", toast_png_success: "✨ PNG画像として書き出しに成功しました！ダウンロードを開始します。",
    toast_png_error: "⚠️ PNG書き出し中にエラーが発生しました", toast_sample_photos: "📸 写真ライブラリをリセットしました。", toast_cleared_pool: "🗑️ プールを初期化しました。",
    toast_lang_changed: "🌐 言語を $lang に変更し、文字「" + "$word」がセットされました。",
    err_no_photos: "プールに写真がありません。先に写真を追加してください。", progress: "進捗:",
    aspect_label: "画角:", coordinates_label: "外枠座標線", loading_contour: "文字・形状の等高線を最適化中...", text_limit_label: "最大10文字制限 (日本語・英数字)", btn_copied: "コピーしました！", badge_standard: "標準", badge_popular: "人気", toast_autofill: "すべてのフレームに写真が自動充填されました！", toast_shuffle: "割り当て写真を一括シャッフルしました！", toast_clear: "写真の割り当てをクリアしました。",
    toast_copied_html_success: "📋 index.htmlのソースコードをクリップボードにコピーしました！",
    toast_html_download_success: "💾 単一ファイル版の「index.html」をローカルにダウンロードしました！",
    toast_canva_simulation: "🎉 Canvaのシミュレートキャンバスに $count 個のカスタム・モザイクフレームをエクスポートしました！",
    toast_images_added: "$count 枚のカスタム写真がプールに追加されました。",
    toast_photo_applied: "選択フレームに写真を適用しました。",
    toast_html_saved: "📋 現在の作業状態を含む複製HTMLを保存しました！",
    frames_unit: "枚",
    btn_back: "戻る", btn_next: "次へ →", btn_restart: "最初から読む",
    usage_limit: "お試し残り回数",
    usage_limit_reached: "お試し利用の上限制限（10回）",
    usage_limit_reached_desc: "このアプリはサンプル（お試し版）となっており、主要機能（作成、シャッフル、一括挿入、ダウンロードなど）の合計お試し利用制限（最大10回）に達しました。制限なしの完全版の導入や、オーダーメイドでのシステム開発のご相談については、お気軽にお知らせください。",
    btn_contact: "完全版・システム導入のご相談",
    btn_reset_trial: "お試し制限をリセット (検証用)",
    trial_badge: "無料デモ版 (お試し: $count/10回使用)",
    trial_limit_reached_title: "10回のお試し制限に達しました"
  },
  en: {
    title: "PhotoArt", tutorial: "Tutorial", total_cells: "Total Cells", tutorial_guide: "PhotoArt Tutorial Guide",
    tut_step_1_title: "Upload Photo Memories", tut_step_1_desc: "Upload user favorite photos (multiple supported) from device to design an original collage in seconds.",
    tut_step_2_title: "Bulk Layout", tut_step_2_desc: "Click 'Bulk Insert' to instantly and automatically load images to all empty blocks.",
    tut_step_3_title: "Instant Shuffle", tut_step_3_desc: "Use Shuffle option to instantly randomize the patterns of placed pictures across frames.",
    tab_shape: "1. Shape", tab_layout: "2. Layout", tab_photo: "3. Photo Stream", tab_dev: "4. Export HTML",
    shape_main_title: "1. Select Silhouette Shape outline", shape_main_desc: "This forms the boundaries for mosaic collage cells. Photos will adaptively sit within these lines.",
    shape_preset_label: "Choose Template Geometry:", shape_text_label: "Silhouette Characters (Becomes Mask shape):",
    text_placeholder: "Enter letters or words...", text_desc: "※ Will automatically scale and wrap across multi-lines cleanly based on spacing and inputs.",
    shape_heart: "Heart", shape_star: "Star", shape_diamond: "Diamond", shape_circle: "Circle", shape_triangle: "Triangle", shape_landscape_rect: "Landscape", shape_portrait_rect: "Portrait", shape_square: "Square", shape_preset: "Preset Mask", custom_text: "Custom Text",
    layout_main_title: "2. Set Collage Density & Splitting", layout_style: "Layout Algorithm:", layout_density: "Dividing Tiles Count (Direct value input OK):",
    layout_gap_label: "Image Frame Spacing (Gap)",
    layout_gap_desc: "Adjust the gap between individual photos from 0.0% (perfectly touching) to 3.5% of canvas size using slider.",
    gap_zero: "No Gap", gap_wide: "Wide Gap",
    density_desc_1: "Recommended from 10 to 200 tiles. Higher inputs yield more compact and high fidelity micro-cells.",
    density_coarse: "Coarse", density_medium: "Medium", density_fine: "Fine", density_exfine: "Ultra", canvas_ratio: "Canvas Aspect Ratio:",
    algo_grid_p_title: "Grid Layout", algo_grid_p_desc: "Classic uniformly aligned square blocks packing setup.", algo_brick_p_title: "Brick Layout", algo_brick_p_desc: "Alternating shifted line blocks like brick wall alignment.",
    photo_main_title: "3. Photos Batch Actions Manager", photo_main_desc: "Add device snaps, allocate them to all grids in one tap, or shuffle alignment positions infinitely!",
    btn_upload: "Add device pictures", btn_insert: "Bulk Insert", btn_shuffle: "Shuffle Snaps", btn_clear: "Clear Snaps", pool_title: "Available Photos Asset Pool", btn_preset_pool: "Restore Template Assets", btn_cloud_photos: "Add/Select Cloud Photos",
    no_photos: "No uploaded photos in pool. Please select snap files or load presets to experience.",
    dropzone: "Drop photo files here to upload (Multiple supported)",
    export_main_title: "4. Standalone HTML single-file builder", export_main_desc: "Bundles layout settings, algorithms, and loaded image pools together into one lightweight portable HTML document.",
    btn_download_html: "Download Standalone HTML File", btn_copy_html: "Copy Web App Code",
    zoom: "Zoom:", color_tune: "Background Custom Canvas Tuning:", color_hue: "Hue", color_sat: "Sat", color_light: "Light", layout_preview: "Layout Preview", btn_download_png: "Save collage as High-Res PNG Image",
    toast_copied_html: "📋 Portable single file HTML code has been copied securely!", toast_png_success: "✨ PNG rendering completed! Starting direct download stream.",
    toast_png_error: "⚠️ Failure during PNG image compilation.", toast_sample_photos: "📸 High quality demo photo package loaded successfully!", toast_cleared_pool: "🗑️ Cleared uploaded image pool.",
    toast_lang_changed: "🌐 Language preset has been updated. Text seed set to \"$word\"",
    err_no_photos: "No photos in pool. Please upload first, or restore demo samples.", progress: "Progress:",
    aspect_label: "Aspect:", coordinates_label: "Show Coordinates", loading_contour: "Optimizing character/shape contours...", text_limit_label: "Max 10 characters limit (Any text)", btn_copied: "Copied!", badge_standard: "Standard", badge_popular: "Popular", toast_autofill: "Successfully autofilled photos across all frames!", toast_shuffle: "Successfully shuffled all assigned photos!", toast_clear: "Cleared all photo assignments.",
    toast_copied_html_success: "📋 Portable index.html source code copied to clipboard!",
    toast_html_download_success: "💾 Standalone 'index.html' downloaded successfully to local storage!",
    toast_canva_simulation: "🎉 Exported $count custom mosaic frames to the mock Canva Board!",
    toast_images_added: "$count custom photo(s) added to pool.",
    toast_photo_applied: "Photo applied to selected frame.",
    toast_html_saved: "📋 Saved duplicate HTML with current states!",
    frames_unit: "frames",
    btn_back: "Back", btn_next: "Next →", btn_restart: "Restart",
    usage_limit: "Trial Remaining",
    usage_limit_reached: "Demo Trial limit (10 actions) reached",
    usage_limit_reached_desc: "This is a demo/sample version, and you have reached the 10-use limit on main features (generation, shuffles, downloads, etc.). For inquiries about introducing the premium full version or a custom-tailored system, please let us know.",
    btn_contact: "Contact us for Full Version",
    btn_reset_trial: "Reset Trial (For evaluation)",
    trial_badge: "Free Trial ($count/10 used)",
    trial_limit_reached_title: "10-Use Trial Limit Reached"
  },
  zh: {
    title: "照片艺术", tutorial: "教程", total_cells: "总格子数", tutorial_guide: "照片艺术 使用说明教程",
    tut_step_1_title: "上传你的照片", tut_step_1_desc: "从您的电脑 or 手机上传多张照片，创建属于自己的、完全原创的照片拼贴画。",
    tut_step_2_title: "一键自动填充", tut_step_2_desc: "点击“一键插入”按钮，即可把您上传的照片自动填满所有灰色边框。",
    tut_step_3_title: "照片随机打乱", tut_step_3_desc: "使用“随机打乱”功能，可以在几秒钟内将已排好的照片进行随机重新排序。",
    tab_shape: "1. 拼贴轮廓", tab_layout: "2. 拼贴排版", tab_photo: "3. 照片 & 批量", tab_dev: "4. 导出网页",
    shape_main_title: "1. 选择整体轮廓形状", shape_main_desc: "这是拼贴画的整体轮廓。每张照片框架都会自动紧密填充在内部。",
    shape_preset_label: "选择几何形状:", shape_text_label: "拼贴文字内容 (用于照片轮廓形状)：",
    text_placeholder: "请输入您想要使用的字母或文字...", text_desc: "※ 软件会根据输入的文字长度和空格，自动提供精美的多行美化排版。",
    shape_heart: "心形", shape_star: "星形", shape_diamond: "钻石形", shape_circle: "圆形", shape_triangle: "三角形", shape_landscape_rect: "横向长方形", shape_portrait_rect: "纵向长方形", shape_square: "正方形", shape_preset: "图形 (Silhouette)", custom_text: "文字",
    layout_main_title: "2. 拼贴碎片结构排版", layout_style: "选择排版划分算法：", layout_density: "拼贴分割密度 (支持直接输数值)：",
    density_desc_1: "设定值在 10 ~ 200 之间。数值越高，生成的照片格子和细节就越细密。",
    density_coarse: "稀疏", density_medium: "标准中等", density_fine: "细致", density_exfine: "超细极密", canvas_ratio: "画布长宽比例：",
    algo_grid_p_title: "网格排列", algo_grid_p_desc: "使用对称紧凑的方法，把格子整齐排列在画板中间。", algo_brick_p_title: "错位砖墙", algo_brick_p_desc: "按照传统建筑砖砌的方法，偶数行错开布置。",
    photo_main_title: "3. 照片一键批量与个别微调", photo_main_desc: "上传您和家人的照片，一键灌入所有空闲网格中，并一键混剪出意想不到的效果！",
    btn_upload: "选择设备内的照片", btn_insert: "一键批量插入", btn_shuffle: "随机重混布局", btn_clear: "清空导入库", pool_title: "已加载的照片素材区", btn_preset_pool: "充填示例美图",
    no_photos: "当前没有任何用户照片。建议点击上方按钮上传，或使用官方样照开始体验！",
    dropzone: "把照片文件拖拽到此框中完成秒速加载",
    export_main_title: "4. 完全独立 HTML 物理单文件导出", export_main_desc: "将当前的素材配准、位置计算、动画引擎和所有自定义配置完全压缩打包为单个离线可用的 HTML 浏览器程序。",
    btn_download_html: "本地下载单网页 (.html) 应用程序", btn_copy_html: "复制代码到剪贴板",
    zoom: "缩放:", color_tune: "画布背景底色调色盘:", color_hue: "色", color_sat: "饱", color_light: "光", layout_preview: "拼贴布局层预读", btn_download_png: "渲染为超清 PNG 图片保存至本地",
    toast_copied_html: "📋 已经成功复制了离线网页源代码！", toast_png_success: "✨ PNG 大图已由图形显存渲染成功！启动本地保存流程。",
    toast_png_error: "⚠️ PNG 生成或打包下载中发生异常", toast_sample_photos: "📸 已成功调用并装载测试图库！", toast_cleared_pool: "🗑️ 照片载入池已被清空。",
    toast_lang_changed: "🌐 全局语言已更新！当前默认轮廓文字设定为 \"$word\"。", err_no_photos: "导入照片库为空。请先选择文件上传或导入样例图片。", progress: "进度:",
    aspect_label: "画幅比例:", coordinates_label: "显示边框坐标线", loading_contour: "正在优化文字或形状的等高线精度...", text_limit_label: "最大限制10个字符", btn_copied: "已复制！", badge_standard: "标准", badge_popular: "热门", toast_autofill: "所有格子已成功自动填充照片！", toast_shuffle: "已成功随机打乱所有照片布局！", toast_clear: "已清空所有已装载的照片。",
    toast_copied_html_success: "📋 离线 index.html 网页源代码已复制到剪贴板！",
    toast_html_download_success: "💾 单文件版 “index.html” 已成功运行并下载到本地！",
    toast_canva_simulation: "🎉 成功导出 $count 个照片格点到 Canva 模拟画布！",
    toast_images_added: "$count 张自定义照片已添加到池中。",
    toast_photo_applied: "图片已应用到选中的框架。",
    toast_html_saved: "📋 复制当前状态的HTML已保存！",
    frames_unit: "张",
    btn_back: "返回", btn_next: "下一步 →", btn_restart: "重新开始"
  },
  ko: {
    title: "포토아트", tutorial: "사용팁", total_cells: "전체 마디 수", tutorial_guide: "포토아트 실시간 콜라주 튜토리얼",
    tut_step_1_title: "추억 사진 불러오기", tut_step_1_desc: "컴퓨터나 스마트폰 내 원하는 사진들을 불러와 나만의 아름다운 사진 콜라주를 만드실 수 있습니다.",
    tut_step_2_title: "전체 화면 매칭", tut_step_2_desc: "'일괄 삽입' 버튼을 누르시면, 선택하신 모자이크 형태에 알맞게 즉시 모든 사진이 자동으로 마운트됩니다.",
    tut_step_3_title: "무작위 셔플 기능", tut_step_3_desc: "'이미지 셔플' 기법을 이용해 콜라주 프레임상의 위치를 무작위로 계속 전환하며 즐겨보세요.",
    tab_shape: "1. 형상 설정", tab_layout: "2. 분할 타입", tab_photo: "3. 사진 소스", tab_dev: "4. 소스코드",
    shape_main_title: "1. 기준 실루엣 형상 결정", shape_main_desc: "콜라주 아트의 기본 형태가 되는 모양입니다. 마디 프레임들이 해당 모양 내부로 기하학적인 자동 배치가 됩니다.",
    shape_preset_label: "원하는 모양 프리셋 선택:", shape_text_label: "표시할 커스텀 단어나 문자 (실루엣화 됩니다):",
    text_placeholder: "표시하고자 하는 알파벳이나 문장을 기록해주세요...", text_desc: "※ 글자수와 공백 규칙에 대응하여, 자동 다중 라인으로 세련되게 스케일이 조정됩니다.",
    shape_heart: "하트형", shape_star: "별모양", shape_diamond: "다이아몬드", shape_circle: "정원형", shape_triangle: "삼각형", shape_landscape_rect: "가로 직사각형", shape_portrait_rect: "세로 직사각형", shape_square: "정사각형", shape_preset: "기본 모형", custom_text: "타이포텍스트",
    layout_main_title: "2. 콜라주 분할 구성 방식", layout_style: "수학적 분할 알고리즘 지정:", layout_density: "세분화 밀도 강도 (직접 키 프레스 가능):",
    density_desc_1: "결정 간격은 10에서 200까지입니다. 값이 커질수록 가용 타일이 증가하여 고밀도 결과물이 연출됩니다.",
    density_coarse: "러프하게", density_medium: "기본보통", density_fine: "정교하게", density_exfine: "강력압축", canvas_ratio: "인쇄 캔버스 형태비율:",
    algo_grid_p_title: "정렬 격자", algo_grid_p_desc: "빈 공간 없이 사각형들을 그리드 정렬로 반듯하게 고정 배치합니다.", algo_brick_p_title: "렌가 스타일", algo_brick_p_desc: "가로 줄 바꿈마다 일정 간격씩 엇갈리는 장식 벽돌 시공 스타일 레이아웃입니다.",
    photo_main_title: "3. 파일 제어 및 사진 매니저", photo_main_desc: "가지고 계신 보물 사진을 추가하고, 실버 프레임 내에 마법같이 한번에 밀어넣거나 돌려보며 콜라주를 디자인하세요.",
    btn_upload: "로컬 저장소 사진 추가", btn_insert: "일교 자동 배치", btn_shuffle: "이미지 셔플링", btn_clear: "보관함 지우기", pool_title: "현재 마운트된 사진들", btn_preset_pool: "대표 이미지 적용",
    no_photos: "등록한 사진이 존재하지 않습니다. 상단의 업로드를 수행하시거나 데모용 패키지를 받아서 실험해 보세요.",
    dropzone: "추가하려는 전용 사진 파일을 여기로 끌어오세요",
    export_main_title: "4. 단독 구동 포터블 HTML 프로그램 내려받기", export_main_desc: "현재 제작하고 정렬된 데이터를, 인터넷이 끊겨도 동일하게 실행할 수 있는 HTML 싱글 웹파일 형태로 디스크로 백업합니다.",
    btn_download_html: "오프라인 HTML 전체 파일 다운로드", btn_copy_html: "HTML 코드 그대로 복사하기",
    zoom: "조밀도:", color_tune: "도화지 뒷배경색 보정:", color_hue: "색", color_sat: "채", color_light: "명", layout_preview: "콜라주 영역 미리보기", btn_download_png: "완성된 콜라주를 고해상도 PNG 파일로 내보내기",
    toast_copied_html: "📋 단일 포터블 가사 HTML 소스 코드가 안전하게 복사되었습니다!", toast_png_success: "✨ 기기의 전용 GPU 캔버스 연산 처리 완료! 다운로드가 개시됩니다.",
    toast_png_error: "⚠️ PNG 병합 연산중 통신 오류가 발생했습니다.", toast_sample_photos: "📸 완벽한 출력물을 만들기 위해 고화질 샘플 셋을 채웠습니다!", toast_cleared_pool: "🗑️ 모든 수집된 커스텀 사진풀이 초기화되었습니다.",
    toast_lang_changed: "🌐 시스템 사용 언어가 번역되었습니다! 기본 캐릭터는 \"$word\"(으)로 셋업되었습니다.", err_no_photos: "보관함에 사진이 존재하지 않습니다. 먼저 업로드하거나 샘플 이미지를 적용하세요.", progress: "진행:",
    aspect_label: "화각:", coordinates_label: "외곽 좌표선", loading_contour: "문자 및 도형 윤곽선 최적화 중...", text_limit_label: "최대 10자 제한 (모든 텍스트)", btn_copied: "복사 완료!", badge_standard: "기본", badge_popular: "인기", toast_autofill: "모든 프레임에 사진이 자동으로 채워졌습니다!", toast_shuffle: "모든 배치 지점의 사진이 무작위로 섞였습니다!", toast_clear: "모든 사진 배치가 초기화되었습니다.",
    toast_copied_html_success: "📋 index.html 소스 코드를 클립보드에 복사했습니다!",
    toast_html_download_success: "💾 단일 파일 버전 'index.html'을 로컬에 다운로드 완료했습니다!",
    toast_canva_simulation: "🎉 Canva 모조 캔버스로 $count개의 모자이크 타일을 내보냈습니다!",
    toast_images_added: "$count장의 사용자 정의 사진이 풀에 추가되었습니다.",
    toast_photo_applied: "선택 프레임에 사진을 적용했습니다.",
    toast_html_saved: "📋 현재 작업 상태를 포함한 복제 HTML을 저장했습니다!",
    frames_unit: "장",
    btn_back: "뒤로", btn_next: "다음 →", btn_restart: "처음부터"
  },
  es: {
    title: "FotoArt", tutorial: "Guía", total_cells: "Celda Total", tutorial_guide: "Guía de Tutorial para FotoArt",
    tut_step_1_title: "Sube fotos de recuerdos", tut_step_1_desc: "Sube las fotos de tu teléfono o laptop para crear un collage de fotos moderno y completamente original.",
    tut_step_2_title: "Auto-disposición en un clic", tut_step_2_desc: "Presiona 'Insertar Todo' para distribuir todas tus fotos en todas las casillas de visualización en un instante.",
    tut_step_3_title: "Mezcla rápida express", tut_step_3_desc: "Usa la opción de 'Mezclar fotos' para reordenar de forma aleatoria la colocación de tus fotos en segundos.",
    tab_shape: "1. Silueta base", tab_layout: "2. Dividir lienzo", tab_photo: "3. Gestionar fotos", tab_dev: "4. Guardar código",
    shape_main_title: "1. Elija la forma general de silueta", shape_main_desc: "Es el patrón maestro del collage. Los marcos individuales de fotos se amoldarán de manera adaptada automáticamente para no sobrepasar los bordes.",
    shape_preset_label: "Seleccionar patrón geométrico:", shape_text_label: "Texto de la silueta (se convertirá en la forma física):",
    text_placeholder: "Ingresa palabras o letras mayúsculas aquí...", text_desc: "※ Según la cantidad de caracteres y espacios ingresados, se autogenerará una partición de líneas hermosa para el collage.",
    shape_heart: "Corazón", shape_star: "Estrella", shape_diamond: "Diamante", shape_circle: "Círculo", shape_triangle: "Triángulo", shape_landscape_rect: "Rectángulo horizontal", shape_portrait_rect: "Rectángulo vertical", shape_square: "Cuadrado", shape_preset: "Estilo", custom_text: "Letras libres",
    layout_main_title: "2. Ajustar disposición y divisiones", layout_style: "Seleccionar algoritmo de empaquetado:", layout_density: "Densidad de división de cuadros (admite número):",
    density_desc_1: "Rango de cálculo entre 10 y 200. Con números mayores se obtendrán mosaicos fotográficos más chicos y bien detallados.",
    density_coarse: "Bajo", density_medium: "Normal estándar", density_fine: "Detallado", density_exfine: "Ultra denso", canvas_ratio: "Proporciones de aspecto:",
    algo_grid_p_title: "Cuadrícula uniforme", algo_grid_p_desc: "Coloca las imágenes de manera equidistante y simétrica dentro del patrón.", algo_brick_p_title: "Estilo de ladrillos", algo_brick_p_desc: "Diseño que desplaza de forma alterna las líneas horizontales como muros convencionales.",
    photo_main_title: "3. Importaciones masivas o parciales", photo_main_desc: "¡Trae tus imágenes favoritas, insértalas todas de manera express, o haz combinaciones de mezcla para crear diseños asombrosos!",
    btn_upload: "Añadir fotos locales", btn_insert: "Rellenar masivo", btn_shuffle: "Mezclar fotos", btn_clear: "Borrar galería", pool_title: "Galería de imágenes cargada", btn_preset_pool: "Cargar muestras de diseño",
    no_photos: "No has subido fotos aún. Sube imágenes desde el botón superior o carga las muestras predeterminadas.",
    dropzone: "Arrastra fotos hasta aquí para añadirlas a la galería",
    export_main_title: "4. Exportar como Web HTML offline completa", export_main_desc: "Une el collage, tus imágenes y los algoritmos creadores dentro de un único archivo HTML listo para abrir sin internet.",
    btn_download_html: "Descargar aplicación de página (.html) portátil", btn_copy_html: "Copiar el código de la página al portapapeles",
    zoom: "Zoom:", color_tune: "Elegir color de base del cuadro:", color_hue: "Matiz", color_sat: "Sat", color_light: "Luz", layout_preview: "Vista de zonas de rejillas", btn_download_png: "Guardar creación en ordenador como fichero PNG",
    toast_copied_html: "📋 ¡Código de la aplicación copiada para usos externos!", toast_png_success: "✨ ¡El render de tu collage se completó con éxito! Iniciando la guardada.",
    toast_png_error: "⚠️ Algo falló durante la renderización del archivo final PNG.", toast_sample_photos: "📸 Biblioteca de pruebas predefinida ha sido cargada con éxito.", toast_cleared_pool: "🗑️ El depósito temporal de tus fotos ha sido limpiado.",
    toast_lang_changed: "🌐 ¡Lector de idioma actualizado! La palabra por defecto se configuró en \"$word\".", err_no_photos: "No hay fotos en la galería. Por favor, sube imágenes o carga las de prueba primero.", progress: "Progreso:",
    aspect_label: "Aspecto:", coordinates_label: "Mostrar coordenadas", loading_contour: "Optimizando los contornos del texto o forma...", text_limit_label: "Límite máximo de 10 caracteres", btn_copied: "¡Copiado!", badge_standard: "Estándar", badge_popular: "Popular", toast_autofill: "¡Se han rellenado automáticamente todas las fotos!", toast_shuffle: "¡Se han mezclado todas las fotos asignadas!", toast_clear: "Se ha limpiado la colocación de todas las fotos.",
    toast_copied_html_success: "📋 ¡Código fuente de index.html copiado al portapapeles!",
    toast_html_download_success: "💾 ¡Se descargó con éxito el archivo portable 'index.html'!",
    toast_canva_simulation: "🎉 ¡Se exportaron $count marcos de mosaico personalizados al panel Canva simulado!",
    toast_images_added: "$count foto(s) personalizada(s) añadida(s) a la galería.",
    toast_photo_applied: "Foto aplicada al cuadro seleccionado.",
    toast_html_saved: "📋 ¡Se guardó el HTML duplicado con los estados actuales!",
    frames_unit: "marcos",
    btn_back: "Atrás", btn_next: "Siguiente →", btn_restart: "Reiniciar"
  },
  fr: {
    title: "PhotoArt", tutorial: "Tutoriel", total_cells: "Nombre de cases", tutorial_guide: "Guide d'utilisation PhotoArt",
    tut_step_1_title: "Importer vos photos", tut_step_1_desc: "Téléchargez vos photos préférées (sélection multiple) depuis votre PC/mobile pour concevoir une mosaïque personnalisée.",
    tut_step_2_title: "Remplissage instantané", tut_step_2_desc: "Cliquez sur 'Remplir tout' pour remplir immédiatement toutes les cases grises vides avec vos photos.",
    tut_step_3_title: "Mélange automatique", tut_step_3_desc: "Utilisez le bouton 'Mélanger' pour réorganiser de façon aléatoire vos photos en quelques secondes.",
    tab_shape: "1. Gabarit", tab_layout: "2. Mise en page", tab_photo: "3. Photos & Lots", tab_dev: "4. Exporter HTML",
    shape_main_title: "1. Choisir le masque de silhouette", shape_main_desc: "Gabarit principal de la mosaïque. Les vignettes individuelles s'ajustent automatiquement sans dépasser.",
    shape_preset_label: "Type de gabarit prédéfini :", shape_text_label: "Texte à afficher (générateur de masque) :",
    text_placeholder: "Saisissez un mot de silhouette...", text_desc: "※ Optimisé automatiquement en 2 ou 3 lignes selon la longueur du mot pour un rendu visuel équilibré.",
    shape_heart: "Cœur", shape_star: "Étoile", shape_diamond: "Losange", shape_circle: "Cercle", shape_triangle: "Triangle", shape_landscape_rect: "Paysage large", shape_portrait_rect: "Portrait haut", shape_square: "Carré proportionnel", shape_preset: "Modèle", custom_text: "Texte libre",
    layout_main_title: "2. Type de mise en page et densité", layout_style: "Algorithme d'arrangement :", layout_density: "Densité des cases (saisie directe possible) :",
    density_desc_1: "Valeur calculée entre 10 et 200. Plus le nombre est grand, plus les vignettes seront petites et détaillées.",
    density_coarse: "Léger", density_medium: "Moyen", density_fine: "Fin", density_exfine: "Ultra fin", canvas_ratio: "Ratio d'aspect du canevas :",
    algo_grid_p_title: "Mise en grille", algo_grid_p_desc: "Aligne régulièrement toutes les photos dans la forme spécifiée.", algo_brick_p_title: "Accumulation de briques", algo_brick_p_desc: "Décale horizontalement chaque ligne à mi-distance pour rappeler la construction de façades.",
    photo_main_title: "3. Éditeur de fichiers images", photo_main_desc: "Ajoutez vos images, distribuez-les toutes automatiquement ou mélangez pour une création originale !",
    btn_upload: "Télécharger des images", btn_insert: "Insérer tout", btn_shuffle: "Mélanger disposition", btn_clear: "Vider la galerie", pool_title: "Votre dépôt d'images actives", btn_preset_pool: "Restaurer exemples",
    no_photos: "Aucune photo importée. Ajoutez des images avec le bouton ou chargez les démos pour tester.",
    dropzone: "Déposer vos images ici pour les charger en tâche rapide",
    export_main_title: "4. Exporter le projet autonome HTML interactif", export_main_desc: "Rassemble la mosaïque, vos visuels et l'ensemble des algorithmes dans une page Web HTML complète consultable hors ligne.",
    btn_download_html: "Télécharger la page HTML autonome (.html)", btn_copy_html: "Copiar el código de la página en el portapapeles",
    zoom: "Zoom :", color_tune: "Couleur de fond de canevas (HSL) :", color_hue: "Teinte", color_sat: "Sat.", color_light: "Lum.", layout_preview: "Aperçu de la grille", btn_download_png: "Exporter la mosaïque finale en photo PNG",
    toast_copied_html: "📋 Code source de l'application copié dans le presse-papiers !", toast_png_success: "✨ Portrait mosaïque généré ! Enregistrement du fichier PNG démarré.",
    toast_png_error: "⚠️ Dysfonctionnement lors de la fusion d'image finale PNG.", toast_sample_photos: "📸 Échantillons de démonstration chargés !", toast_cleared_pool: "🗑️ Galerie d'images réinitialisée.",
    toast_lang_changed: "🌐 Preset linguistique mis à jour ! Gabarit défini sur \"$word\".", err_no_photos: "Aucune photo disponible. Veuillez d'abord ajouter des images ou charger les échantillons.", progress: "Progression:",
    aspect_label: "Ratio :", coordinates_label: "Afficher les coordonnées", loading_contour: "Optimisation des contours de forme ou texte...", text_limit_label: "Limite de 10 caractères max", btn_copied: "Copié !", badge_standard: "Standard", badge_popular: "Populaire", toast_autofill: "Toutes les cases ont été remplies automatiquement !", toast_shuffle: "Toutes les photos attribuées ont été mélangées !", toast_clear: "L'attribution des photos a été réinitialisée.",
    toast_copied_html_success: "📋 Code source de index.html copié dans le presse-papiers !",
    toast_html_download_success: "💾 Page 'index.html' autonome téléchargée !",
    toast_canva_simulation: "🎉 Exportation de $count cadres mosaïque vers l'espace Canva fictif !",
    toast_images_added: "$count photo(s) personnalisée(s) ajoutée(s) à la galerie.",
    toast_photo_applied: "Photo appliquée au cadre sélectionné.",
    toast_html_saved: "📋 HTML dupliqué enregistré avec les états actuels !",
    frames_unit: "cadres",
    btn_back: "Retour", btn_next: "Suivant →", btn_restart: "Recommencer"
  },
  de: {
    title: "PhotoArt", tutorial: "Tutorial", total_cells: "Zellen gesamt", tutorial_guide: "PhotoArt Web Collage-Tutorial",
    tut_step_1_title: "Eigene Fotos hochladen", tut_step_1_desc: "Laden Sie Ihre Lieblingsfotos vom PC/Handy hoch, um eine einzigartige Kollagenform zu entwerfen.",
    tut_step_2_title: "Automatisches Befüllen", tut_step_2_desc: "Klicken Sie auf 'Alles Einfügen', um hochgeladene Bilder sofort automatisch in alle Rahmen zu verteilen.",
    tut_step_3_title: "Zufällige Mischung", tut_step_3_desc: "Nutzen Sie 'Bilder mischen', um bereits platzierte Bilder in Sekundenschnelle beliebig umzuordnen.",
    tab_shape: "1. Silhouette", tab_layout: "2. Aufteilung", tab_photo: "3. Fotoverwaltung", tab_dev: "4. HTML-Code",
    shape_main_title: "1. Silhouette Gesamtform bestimmen", shape_main_desc: "Dies ist der Master-Maskenrahmen. Einzelne Fotorahmen passen sich automatisch in die Grenzen ein.",
    shape_preset_label: "Formvorlage auswählen :", shape_text_label: "Wort der Silhouette (wird die mathematische Form) :",
    text_placeholder: "Geben Sie Buchstaben ein...", text_desc: "※ Je nach Länge und Abständen wird die Schrifthöhe in zwei oder drei Zeilen formschön berechnet.",
    shape_heart: "Herzform", shape_star: "Sternform", shape_diamond: "Diamantform", shape_circle: "Kreisrund", shape_triangle: "Dreiecksform", shape_landscape_rect: "Querformatiges Rechteck", shape_portrait_rect: "Hochformatiges Rechteck", shape_square: "Zentriertes Quadrat", shape_preset: "Vorlage", custom_text: "Eigener Text",
    layout_main_title: "2. Aufteilung und Dichte-Einstellungen", layout_style: "Layout-Arrangement-Methode :", layout_density: "Rahmendichte-Wert (Zahleneingabe möglich) :",
    density_desc_1: "Wird automatisch zwischen 10 und 200 berechnet. Höhere Stufen schaffen kleinere, dichtere Rasterfelder.",
    density_coarse: "Grob", density_medium: "Normal standard", density_fine: "Fein", density_exfine: "Hochpräzise", canvas_ratio: "Seitenverhältnis :",
    algo_grid_p_title: "Rasterausrichtung", algo_grid_p_desc: "Fügt alle Fotos parallel in geordneten quadratischen Abständen an.", algo_brick_p_title: "Ziegelsteinschema", algo_brick_p_desc: "Horizontaler Offset wie beim klassischen Hochbau für eine harmonische Ziegeloptik.",
    photo_main_title: "3. Massenaktionen & Fotoverwaltung", photo_main_desc: "Laden Sie Fotos hoch, füllen Sie alle Raster auf einmal oder mischen Sie für tolle Mustereffekte !",
    btn_upload: "Bilder importieren", btn_insert: "Alles befüllen", btn_shuffle: "Bilder mischen", btn_clear: "Fotopool leeren", pool_title: "Geladener Fototeilbereich", btn_preset_pool: "Beispielfotos laden",
    no_photos: "Überhaupt keine Bilder im Speicher. Fügen Sie Fotos hinzu oder nutzen Sie Demofotos zum Experimentieren.",
    dropzone: "Dateien zum Hochladen hierher ziehen",
    export_main_title: "4. Portablen HTML-Einzelkopie-Bezug", export_main_desc: "Komprimiert Ihre Kreation, die Bilder und alle Ausführungslogiken in ein tragbares Offline-Web-Dokument.",
    btn_download_html: "Eigenständiges HTML-Dokument (.html) laden", btn_copy_html: "HTML-Code kopieren",
    zoom: "Zoom :", color_tune: "Leinwand-Mintergrundfarbe (HSL) :", color_hue: "Farbe", color_sat: "Sätt.", color_light: "Hell.", layout_preview: "Rastervorschau", btn_download_png: "Mosaikcollage als hochauflösendes PNG laden",
    toast_copied_html: "📋 Portable Anwendungsquelle in Zwischenablage kopiert !", toast_png_success: "✨ Grafikkarte hat Bild erfolgreich fertiggestellt! Dateitransfer startet.",
    toast_png_error: "⚠️ Fehler bei der Bildgenerierung des fertigen PNG-Entwurfs.", toast_sample_photos: "📸 Demobilder wurden erfolgreich eingespielt !", toast_cleared_pool: "🗑️ Benutzer-Bilderpool zurückgesetzt.",
    toast_lang_changed: "🌐 Spracheinstellung geändert ! Wortvorgabe lautet nun \"$word\".", err_no_photos: "Keine eigenen Fotos vorhanden. Fügen Sie Fotos hinzu oder nutzen Sie Beispieldaten.", progress: "Fortschritt:",
    aspect_label: "Bildwinkel:", coordinates_label: "Koordinaten anzeigen", loading_contour: "Optimiere Schrift- und Formkonturen...", text_limit_label: "Maximal 10 Zeichen", btn_copied: "Kopiert!", badge_standard: "Standard", badge_popular: "Beliebt", toast_autofill: "Alle Bilder wurden erfolgreich automatisch eingefügt!", toast_shuffle: "Zugeordnete Fotos wurden erfolgreich gemischt!", toast_clear: "Alle Fotozuordnungen wurden gelöscht.",
    toast_copied_html_success: "📋 index.html Quellcode in die Zwischenablage kopiert!",
    toast_html_download_success: "💾 Eigenständige 'index.html' erfolgreich heruntergeladen!",
    toast_canva_simulation: "🎉 $count eigene Mosaikrahmen in das simulierte Canva-Board exportiert!",
    toast_images_added: "$count eigene(s) Foto(s) zum Pool hinzugefügt.",
    toast_photo_applied: "Foto auf ausgewählten Rahmen angewendet.",
    toast_html_saved: "📋 Duplizierte HTML mit aktuellen Zuständen gespeichert!",
    frames_unit: "Rahmen"
  },
  tempTrash2: {
    tab_shape: "1. Silueta base", tab_layout: "2. Dividir lienzo", tab_photo: "3. Gestionar fotos", tab_dev: "4. Guardar código",
    shape_main_title: "1. Elija la forma general de silueta", shape_main_desc: "Es el patrón maestro del collage. Los marcos individuales de fotos se amoldarán de manera adaptada automáticamente para no sobrepasar los bordes.",
    shape_preset_label: "Seleccionar patrón geométrico:", shape_text_label: "Texto de la silueta (se convertirá en la forma física):",
    text_placeholder: "Ingresa palabras o letras mayúsculas aquí...", text_desc: "※ Según la cantidad de caracteres y espacios ingresados, se autogenerará una partición de líneas hermosa para el collage.",
    shape_heart: "Corazón", shape_star: "Estrella", shape_diamond: "Diamante", shape_circle: "Círculo", shape_triangle: "Triángulo", shape_landscape_rect: "Rectángulo horizontal", shape_portrait_rect: "Rectángulo vertical", shape_square: "Cuadrado", shape_preset: "Estilo", custom_text: "Letras libres",
    layout_main_title: "2. Ajustar disposición y divisiones", layout_style: "Seleccionar algoritmo de empaquetado:", layout_density: "Densidad de división de cuadros (admite número):",
    density_desc_1: "Rango de cálculo entre 10 y 200. Con números mayores se obtendrán mosaicos fotográficos más chicos y bien detallados.",
    density_coarse: "Bajo", density_medium: "Normal estándar", density_fine: "Detallado", density_exfine: "Ultra denso", canvas_ratio: "Proporciones de aspecto:",
    algo_grid_p_title: "Cuadrícula uniforme", algo_grid_p_desc: "Coloca las imágenes de manera equidistante y simétrica dentro del patrón.", algo_brick_p_title: "Estilo de ladrillos", algo_brick_p_desc: "Diseño que desplaza de forma alterna las líneas horizontales como muros convencionales.",
    photo_main_title: "3. Importaciones masivas o parciales", photo_main_desc: "¡Trae tus imágenes favoritas, insértalas todas de manera express, o haz combinaciones de mezcla para crear diseños asombrosos!",
    btn_upload: "Añadir fotos locales", btn_insert: "Rellenar masivo", btn_shuffle: "Mezclar fotos", btn_clear: "Borrar galería", pool_title: "Galería de imágenes cargada", btn_preset_pool: "Cargar muestras de diseño",
    no_photos: "No has subido fotos aún. Sube imágenes desde el botón superior o carga las muestras predeterminadas.",
    dropzone: "Arrastra fotos hasta aquí para añadirlas a la galería",
    export_main_title: "4. Exportar como Web HTML offline completa", export_main_desc: "Une el collage, tus imágenes y los algoritmos creadores dentro de un único archivo HTML listo para abrir sin internet.",
    btn_download_html: "Descargar aplicación de página (.html) portátil", btn_copy_html: "Copiar el código de la página al portapapeles",
    zoom: "Zoom:", color_tune: "Elegir color de base del cuadro:", color_hue: "Matiz", color_sat: "Sat", color_light: "Luz", layout_preview: "Vista de zonas de rejillas", btn_download_png: "Guardar creación en ordenador como fichero PNG",
    toast_copied_html: "📋 ¡Código de la aplicación copiada para usos externos!", toast_png_success: "✨ ¡El render de tu collage se completó con éxito! Iniciando la guardada.",
    toast_png_error: "⚠️ Algo falló durante la renderización del archivo final PNG.", toast_sample_photos: "📸 Biblioteca de pruebas predefinida ha sido cargada con éxito.", toast_cleared_pool: "🗑️ El depósito temporal de tus fotos ha sido limpiado.",
    toast_lang_changed: "🌐 ¡Lector de idioma actualizado! La palabra por defecto se configuró en \"$word\".", err_no_photos: "No hay fotos en la galería. Por favor, sube imágenes o carga las de prueba primero.", progress: "Progreso:",
    aspect_label: "Aspecto:", coordinates_label: "Mostrar coordenadas", loading_contour: "Optimizando los contornos del texto o forma...", text_limit_label: "Límite máximo de 10 caracteres", btn_copied: "¡Copiado!", badge_standard: "Estándar", badge_popular: "Popular", toast_autofill: "¡Se han rellenado automáticamente todas las fotos!", toast_shuffle: "¡Se han mezclado todas las fotos asignadas!", toast_clear: "Se ha limpiado la colocación de todas las fotos.",
    frames_unit: "marcos",
    btn_back: "Atrás", btn_next: "Siguiente →", btn_restart: "Reiniciar"
  },
  fr_GOMI: {
    title: "PhotoArt", tutorial: "Tutoriel", total_cells: "Nombre de cases", tutorial_guide: "Guide d'utilisation PhotoArt",
    tut_step_1_title: "Importer vos photos", tut_step_1_desc: "Téléchargez vos photos préférées (sélection multiple) depuis votre PC/mobile pour concevoir une mosaïque personnalisée.",
    tut_step_2_title: "Remplissage instantané", tut_step_2_desc: "Cliquez sur 'Remplir tout' pour remplir immédiatement toutes les cases grises vides avec vos photos.",
    tut_step_3_title: "Mélange automatique", tut_step_3_desc: "Utilisez le bouton 'Mélanger' pour réorganiser de façon aléatoire vos photos en quelques secondes.",
    tab_shape: "1. Gabarit", tab_layout: "2. Mise en page", tab_photo: "3. Photos & Lots", tab_dev: "4. Exporter HTML",
    shape_main_title: "1. Choisir le masque de silhouette", shape_main_desc: "Gabarit principal de la mosaïque. Les vignettes individuelles s'ajustent automatiquement sans dépasser.",
    shape_preset_label: "Type de gabarit prédéfini :", shape_text_label: "Texte à afficher (générateur de masque) :",
    text_placeholder: "Saisissez un mot de silhouette...", text_desc: "※ Optimisé automatiquement en 2 ou 3 lignes selon la longueur du mot pour un rendu visuel équilibré.",
    shape_heart: "Cœur", shape_star: "Étoile", shape_diamond: "Losange", shape_circle: "Cercle", shape_triangle: "Triangle", shape_landscape_rect: "Paysage large", shape_portrait_rect: "Portrait haut", shape_square: "Carré proportionnel", shape_preset: "Modèle", custom_text: "Texte libre",
    layout_main_title: "2. Type de mise en page et densité", layout_style: "Algorithme d'arrangement :", layout_density: "Densité des cases (saisie directe possible) :",
    density_desc_1: "Valeur calculée entre 10 et 200. Plus le nombre est grand, plus les vignettes seront petites et détaillées.",
    density_coarse: "Léger", density_medium: "Moyen", density_fine: "Fin", density_exfine: "Ultra fin", canvas_ratio: "Ratio d'aspect du canevas :",
    algo_grid_p_title: "Mise en grille", algo_grid_p_desc: "Aligne régulièrement toutes les photos dans la forme spécifiée.", algo_brick_p_title: "Accumulation de briques", algo_brick_p_desc: "Décale horizontalement chaque ligne à mi-distance pour rappeler la construction de façades.",
    photo_main_title: "3. Éditeur de fichiers images", photo_main_desc: "Ajoutez vos images, distribuez-les toutes automatiquement ou mélangez pour une création originale !",
    btn_upload: "Télécharger des images", btn_insert: "Insérer tout", btn_shuffle: "Mélanger disposition", btn_clear: "Vider la galerie", pool_title: "Votre dépôt d'images actives", btn_preset_pool: "Restaurer exemples",
    no_photos: "Aucune photo importée. Ajoutez des images avec le bouton ou chargez les démos pour tester.",
    dropzone: "Déposer vos images ici pour les charger en tâche rapide",
    export_main_title: "4. Exporter le projet autonome HTML interactif", export_main_desc: "Rassemble la mosaïque, vos visuels et l'ensemble des algorithmes dans une page Web HTML complète consultable hors ligne.",
    btn_download_html: "Télécharger la page HTML autonome (.html)", btn_copy_html: "Copier le code de la page dans le presse-papiers",
    zoom: "Zoom :", color_tune: "Couleur de fond de canevas (HSL) :", color_hue: "Teinte", color_sat: "Sat.", color_light: "Lum.", layout_preview: "Aperçu de la grille", btn_download_png: "Exporter la mosaïque finale en photo PNG",
    toast_copied_html: "📋 Code source de l'application copié dans le presse-papiers !", toast_png_success: "✨ Portrait mosaïque généré ! Enregistrement du fichier PNG démarré.",
    toast_png_error: "⚠️ Dysfonctionnement lors de la fusion d'image finale PNG.", toast_sample_photos: "📸 Échantillons de démonstration chargés !", toast_cleared_pool: "🗑️ Galerie d'images réinitialisée.",
    toast_lang_changed: "🌐 Preset linguistique mis à jour ! Gabarit défini sur \"$word\".", err_no_photos: "Aucune photo disponible. Veuillez d'abord ajouter des images ou charger les échantillons.", progress: "Progression:",
    aspect_label: "Ratio :", coordinates_label: "Afficher les coordonnées", loading_contour: "Optimisation des contours de forme ou texte...", text_limit_label: "Limite de 10 caractères max", btn_copied: "Copié !", badge_standard: "Standard", badge_popular: "Populaire", toast_autofill: "Toutes les cases ont été remplies automatiquement !", toast_shuffle: "Toutes les photos attribuées ont été mélangées !", toast_clear: "L'attribution des photos a été réinitialisée.",
    frames_unit: "cadres",
    btn_back: "Retour", btn_next: "Suivant →", btn_restart: "Recommencer"
  },
  de_GOMI: {
    title: "PhotoArt", tutorial: "Tutorial", total_cells: "Zellen gesamt", tutorial_guide: "PhotoArt Web Collage-Tutorial",
    tut_step_1_title: "Eigene Fotos hochladen", tut_step_1_desc: "Laden Sie Ihre Lieblingsfotos vom PC/Handy hoch, um eine einzigartige Kollagenform zu entwerfen.",
    tut_step_2_title: "Automatisches Befüllen", tut_step_2_desc: "Klicken Sie auf 'Alles Einfügen', um hochgeladene Bilder sofort automatisch in alle Rahmen zu verteilen.",
    tut_step_3_title: "Zufällige Mischung", tut_step_3_desc: "Nutzen Sie 'Bilder mischen', um bereits platzierte Bilder in Sekundenschnelle beliebig umzuordnen.",
    tab_shape: "1. Silhouette", tab_layout: "2. Aufteilung", tab_photo: "3. Fotoverwaltung", tab_dev: "4. HTML-Code",
    shape_main_title: "1. Silhouette Gesamtform bestimmen", shape_main_desc: "Dies ist der Master-Maskenrahmen. Einzelne Fotorahmen passen sich automatisch in die Grenzen ein.",
    shape_preset_label: "Formvorlage auswählen :", shape_text_label: "Wort der Silhouette (wird die mathematische Form) :",
    text_placeholder: "Geben Sie Buchstaben ein...", text_desc: "※ Je nach Länge und Abständen wird die Schrifthöhe in zwei oder drei Zeilen formschön berechnet.",
    shape_heart: "Herzform", shape_star: "Sternform", shape_diamond: "Diamantform", shape_circle: "Kreisrund", shape_triangle: "Dreiecksform", shape_landscape_rect: "Querformatiges Rechteck", shape_portrait_rect: "Hochformatiges Rechteck", shape_square: "Zentriertes Quadrat", shape_preset: "Vorlage", custom_text: "Eigener Text",
    layout_main_title: "2. Aufteilung und Dichte-Einstellungen", layout_style: "Layout-Arrangement-Methode :", layout_density: "Rahmendichte-Wert (Zahleneingabe möglich) :",
    density_desc_1: "Wird automatisch zwischen 10 und 200 berechnet. Höhere Stufen schaffen kleinere, dichtere Rasterfelder.",
    density_coarse: "Grob", density_medium: "Normal standard", density_fine: "Fein", density_exfine: "Hochpräzise", canvas_ratio: "Seitenverhältnis :",
    algo_grid_p_title: "Rasterausrichtung", algo_grid_p_desc: "Fügt alle Fotos parallel in geordneten quadratischen Abständen an.", algo_brick_p_title: "Ziegelsteinschema", algo_brick_p_desc: "Horizontaler Offset wie beim klassischen Hochbau für eine harmonische Ziegeloptik.",
    photo_main_title: "3. Massenaktionen & Fotoverwaltung", photo_main_desc: "Laden Sie Fotos hoch, füllen Sie alle Raster auf einmal oder mischen Sie für tolle Mustereffekte !",
    btn_upload: "Bilder importieren", btn_insert: "Alles befüllen", btn_shuffle: "Bilder mischen", btn_clear: "Fotopool leeren", pool_title: "Geladener Fototeilbereich", btn_preset_pool: "Beispielfotos laden",
    no_photos: "Überhaupt keine Bilder im Speicher. Fügen Sie Fotos hinzu oder nutzen Sie Demofotos zum Experimentieren.",
    dropzone: "Dateien zum Hochladen hierher ziehen",
    export_main_title: "4. Portablen HTML-Einzelkopie-Bezug", export_main_desc: "Komprimiert Ihre Kreation, die Bilder und alle Ausführungslogiken in ein tragbares Offline-Web-Dokument.",
    btn_download_html: "Eigenständiges HTML-Dokument (.html) laden", btn_copy_html: "HTML-Code kopieren",
    zoom: "Zoom :", color_tune: "Leinwand-Mintergrundfarbe (HSL) :", color_hue: "Farbe", color_sat: "Sätt.", color_light: "Hell.", layout_preview: "Rastervorschau", btn_download_png: "Mosaikcollage als hochauflösendes PNG laden",
    toast_copied_html: "📋 Portable Anwendungsquelle in Zwischenablage kopiert !", toast_png_success: "✨ Grafikkarte hat Bild erfolgreich fertiggestellt! Dateitransfer startet.",
    toast_png_error: "⚠️ Fehler bei der Bildgenerierung des fertigen PNG-Entwurfs.", toast_sample_photos: "📸 Demobilder wurden erfolgreich eingespielt !", toast_cleared_pool: "🗑️ Benutzer-Bilderpool zurückgesetzt.",
    toast_lang_changed: "🌐 Spracheinstellung geändert ! Wortvorgabe lautet nun \"$word\".", err_no_photos: "Keine eigenen Fotos vorhanden. Fügen Sie Fotos hinzu oder nutzen Sie Beispieldaten.", progress: "Fortschritt:",
    aspect_label: "Bildwinkel:", coordinates_label: "Koordinaten anzeigen", loading_contour: "Optimiere Schrift- und Formkonturen...", text_limit_label: "Maximal 10 Zeichen", btn_copied: "Kopiert!", badge_standard: "Standard", badge_popular: "Beliebt", toast_autofill: "Alle Bilder wurden erfolgreich automatisch eingefügt!", toast_shuffle: "Zugeordnete Fotos wurden erfolgreich gemischt!", toast_clear: "Alle Fotozuordnungen wurden gelöscht.",
    frames_unit: "Rahmen",
    btn_back: "Zurück", btn_next: "Weiter →", btn_restart: "Neustart"
  }
};


function getSplitLines(text: string): string[] {
  const textToDraw = text || 'LOVE';
  if (textToDraw.includes(' ')) {
    return textToDraw.split(' ').filter(Boolean);
  } else if (textToDraw.length <= 4) {
    return [textToDraw];
  } else if (textToDraw.length <= 7) {
    const mid = Math.ceil(textToDraw.length / 2);
    return [textToDraw.slice(0, mid), textToDraw.slice(mid)];
  } else {
    const mid1 = Math.ceil(textToDraw.length / 3);
    const mid2 = Math.ceil((textToDraw.length * 2) / 3);
    if (textToDraw.length >= 9) {
      return [textToDraw.slice(0, mid1), textToDraw.slice(mid1, mid2), textToDraw.slice(mid2)];
    } else {
      const midHalf = Math.ceil(textToDraw.length / 2);
      return [textToDraw.slice(0, midHalf), textToDraw.slice(midHalf)];
    }
  }
}

export default function App() {
  // --- 状態管理 (State Management) ---
  const [selectedShape, setSelectedShape] = useState<BaseShape>(PRESET_SHAPES[0]);
  const [selectedSubShape, setSelectedSubShape] = useState(SHAPE_SUB_PRESETS[0]);
  const [customText, setCustomText] = useState<string>('LOVE');
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>('GRID');
  const [density, setDensity] = useState<number | "">(25); // 分割密度 (グリッド密度)
  const [frameGap, setFrameGap] = useState<number>(1.0); // 画像同士の隙間 (0〜4.0)
  const [maskUrl, setMaskUrl] = useState<string>(''); // CSSマスク用URL
  const [frames, setFrames] = useState<PhotoFrame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 写真プール
  const [usePresetPool, setUsePresetPool] = useState<boolean>(true);
  const [currentPool, setCurrentPool] = useState<string[]>([]);
  const [isDraggingOverPool, setIsDraggingOverPool] = useState<boolean>(false);

  // キャンバス設定 (Sleek Interface 準拠 of Canvas controls)
  const [bgHue, setBgHue] = useState<number>(210); // HSL 色相
  const [bgSat, setBgSat] = useState<number>(16);   // HSL 彩度
  const [bgLight, setBgLight] = useState<number>(95); // HSL 明度
  const [canvasBg, setCanvasBg] = useState<string>('#f1f5f9');
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16' | 'custom'>('1:1');
  const [customWidth, setCustomWidth] = useState<number>(1200);
  const [customHeight, setCustomHeight] = useState<number>(1200);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(false);

  // HSL状態が変更された際、canvasBgを自動更新
  useEffect(() => {
    setCanvasBg(`hsl(${bgHue}, ${bgSat}%, ${bgLight}%)`);
  }, [bgHue, bgSat, bgLight]);

  // 対話・一時状態
  const [draggedImageUrl, setDraggedImageUrl] = useState<string | null>(null);
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'template' | 'layout' | 'photo'>('template');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isHtmlCopied, setIsHtmlCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [appLang, setAppLang] = useState<string>('ja');
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [logoFailed, setLogoFailed] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // --- 利用制限（サンプルお試し制限: 10回） ---
  const [usageCount, setUsageCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('photo_art_usage_count');
      return stored ? Math.min(10, parseInt(stored, 10)) : 0;
    } catch (e) {
      return 0;
    }
  });
  const [isLimitModalOpen, setIsLimitModalOpen] = useState<boolean>(false);
  const [lastLoggedConfig, setLastLoggedConfig] = useState<string>('');

  const checkAndIncrementUsage = (isConfigChange: boolean = false): boolean => {
    if (usageCount >= 10) {
      setIsLimitModalOpen(true);
      return false;
    }

    if (isConfigChange) {
      const currentConfigStr = JSON.stringify({
        shapeId: selectedShape.id,
        subShapeId: selectedSubShape.id,
        text: customText,
        style: layoutStyle
      });
      
      // 初回はカウントしない
      if (!lastLoggedConfig) {
        setLastLoggedConfig(currentConfigStr);
        return true;
      }

      // 変化がない場合はカウントしない
      if (currentConfigStr === lastLoggedConfig) {
        return true;
      }
      
      setLastLoggedConfig(currentConfigStr);
    }

    const nextCount = Math.min(10, usageCount + 1);
    setUsageCount(nextCount);
    try {
      localStorage.setItem('photo_art_usage_count', nextCount.toString());
    } catch (e) {
      console.error(e);
    }

    if (nextCount >= 10) {
      setIsLimitModalOpen(true);
    }
    return true;
  };

  const handleResetTrial = () => {
    setUsageCount(0);
    setLastLoggedConfig('');
    try {
      localStorage.setItem('photo_art_usage_count', '0');
    } catch (e) {
      console.error(e);
    }
    setIsLimitModalOpen(false);
    triggerSuccessToast(appLang === 'ja' ? 'お試し利用回数をリセットしました！' : 'Reset trial usage count successful!');
  };

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'ok') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      })
      .catch(err => {
        console.error("Backend health check failed:", err);
        setBackendStatus('error');
      });
  }, []);

  const t = (key: string, replacements?: Record<string, string>, langOverride?: string): string => {
    const targetLang = langOverride || appLang;
    const baseLang = targetLang.split('-')[0];
    const dict = TRANSLATIONS[targetLang] || TRANSLATIONS[baseLang] || TRANSLATIONS['ja'];
    let text = dict[key] || TRANSLATIONS['ja'][key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(k, v);
      });
    }
    return text;
  };

  // ファイルインプット参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  // プール内の写真が変更された時、空のフレームやくすんだ部分に画像割り当てを自動で補完して形状崩れを防ぐ
  useEffect(() => {
    const poolToUse = currentPool.length > 0 ? currentPool : SAMPLE_IMAGES.map(img => img.url);
    if (poolToUse.length === 0) return;
    setFrames(prev => {
      let changed = false;
      const nextFrames = prev.map((frame, index) => {
        if (frame.imageUrl && (currentPool.includes(frame.imageUrl) || SAMPLE_IMAGES.some(s => s.url === frame.imageUrl))) return frame;
        changed = true;
        return { ...frame, imageUrl: poolToUse[index % poolToUse.length] };
      });
      return changed ? nextFrames : prev;
    });
  }, [currentPool]);

  // --- 形状・モザイクレイアウトの動的再計算 ---
  useEffect(() => {
    let active = true;
    async function recomputeLayout() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const isShape = selectedShape.id === 'shape_preset';
        
        const textVal = customText;
        const pathVal = isShape ? selectedSubShape.svgPath : undefined;
        // テキスト系（custom_text）のときは敷き詰め判定しきい値を低め(0.35)にするために 'japanese_text' を渡す
        const effShapeId = isShape ? 'shape_preset' : 'japanese_text';

        // 1. オフ画面キャンバスによるシルエットのピクセルマスク生成 (100x100グリッド) と高解像度マスクURL取得
        const { mask, maskUrl: newMaskUrl } = await generateSilhouetteMask(
          effShapeId,
          pathVal,
          textVal
        );

        if (!active) return;
        setMaskUrl(newMaskUrl);

        // 2. アルゴリズムに応じたモザイク座標の算出
        const safeDensity = !density || density < 10 ? 10 : Number(density);
        const calculated = calculateMosaicLayout(
          mask,
          layoutStyle,
          safeDensity,
          effShapeId,
          frameGap
        );

        // 3. 写真の引き継ぎ・配列補正をして状態を更新
        const poolToUse = currentPool.length > 0 ? currentPool : SAMPLE_IMAGES.map(img => img.url);
        const matched = calculated.map((newFrame, index) => {
          const oldFrame = frames.find(f => Math.abs(f.x - newFrame.x) < 2 && Math.abs(f.y - newFrame.y) < 2);
          if (oldFrame && oldFrame.imageUrl) {
            return { ...newFrame, imageUrl: oldFrame.imageUrl };
          }
          // 写真枚数が極端に少ない場合や初期状態でも欠落部が生じず形状が美しく維持されるよう、
          // 写真プール(又はサンプル)画像を繰り返して一括自動充填します。これにより全体の形が鮮明に維持されます。
          return { ...newFrame, imageUrl: poolToUse[index % poolToUse.length] };
        });

        if (usageCount >= 10) {
          setIsLimitModalOpen(true);
          return;
        }

        setFrames(matched);
        checkAndIncrementUsage(true);
      } catch (error) {
        console.error("Layout generation failed:", error);
        setErrorMessage("レイアウト生成中にエラーが発生しました。");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    recomputeLayout();

    return () => {
      active = false;
    };
  }, [selectedShape.id, selectedSubShape.id, customText, layoutStyle, density, frameGap]);

  // --- 写真の一括・シャッフルコントロールロジック ---
  
  // 1. 全フレームにプールからランダム、または順番に写真を一括挿入
  const handleAutoFill = () => {
    if (usageCount >= 10) {
      setIsLimitModalOpen(true);
      return;
    }
    if (currentPool.length === 0) {
      setErrorMessage(t('err_no_photos'));
      return;
    }
    setFrames(prev => prev.map((frame, index) => {
      const photoUrl = currentPool[index % currentPool.length];
      return { ...frame, imageUrl: photoUrl };
    }));
    triggerSuccessToast(t('toast_autofill'));
    checkAndIncrementUsage();
  };

  // 2. 割り当てられている写真をシャッフル (配置換え)
  const handleShuffleAssignedPhotos = () => {
    if (usageCount >= 10) {
      setIsLimitModalOpen(true);
      return;
    }
    const allocatedUrls = frames.map(f => f.imageUrl).filter((url): url is string => url !== null);
    if (allocatedUrls.length === 0) {
      handleAutoFill();
      return;
    }

    // Fisher-Yates シャッフル
    const shuffledIdxs = [...allocatedUrls];
    for (let i = shuffledIdxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIdxs[i], shuffledIdxs[j]] = [shuffledIdxs[j], shuffledIdxs[i]];
    }

    let shuffledIndex = 0;
    setFrames(prev => prev.map(frame => {
      if (frame.imageUrl) {
        const newUrl = shuffledIdxs[shuffledIndex % shuffledIdxs.length];
        shuffledIndex++;
        return { ...frame, imageUrl: newUrl };
      }
      return frame;
    }));
    triggerSuccessToast(t('toast_shuffle'));
    checkAndIncrementUsage();
  };

  // 3. 写真を完全にクリア
  const handleClearPhotos = () => {
    setFrames(prev => prev.map(f => ({ ...f, imageUrl: null })));
    triggerSuccessToast(t('toast_clear'));
  };

  // 4. カスタム写真の追加 (アップロード)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      urls.push(url);
    }

    setCurrentPool(prev => [...urls, ...prev]);
    setUsePresetPool(false);
    triggerSuccessToast(t('toast_upload', { '$count': String(urls.length) }));
  };

  const handleLocalFileSelect = handleImageUpload;

  // 素材プール用のドラッグ＆ドロップハンドラ
  const handlePoolDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverPool(true);
  };

  const handlePoolDragLeave = () => {
    setIsDraggingOverPool(false);
  };

  const handlePoolDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverPool(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        urls.push(url);
      }
    }

    if (urls.length > 0) {
      setCurrentPool(prev => [...urls, ...prev]);
      setUsePresetPool(false);
      triggerSuccessToast(t('toast_upload', { '$count': String(urls.length) }));
    }
  };

  const handleAddPhotoToPool = (url: string) => {
    setCurrentPool(prev => [url, ...prev]);
    setUsePresetPool(false);
    triggerSuccessToast(t('toast_upload', { '$count': '1' }));
  };

  const handleAddManyToPool = (urls: string[]) => {
    setCurrentPool(prev => [...urls, ...prev]);
    setUsePresetPool(false);
    triggerSuccessToast(t('toast_upload', { '$count': String(urls.length) }));
  };

  const handleApplyPresetPool = () => {
    setCurrentPool(SAMPLE_IMAGES.map(img => img.url));
    setUsePresetPool(true);
    triggerSuccessToast(t('toast_sample_photos'));
  };

  const triggerSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // --- ドラッグ＆ドロップおよびクリック制御 ---
  const handleFrameDragOver = (e: React.DragEvent, frameId: string) => {
    e.preventDefault();
    setHoveredFrameId(frameId);
  };

  const handleFrameDrop = (e: React.DragEvent, frameId: string) => {
    e.preventDefault();
    setHoveredFrameId(null);
    
    // ドラッグ中の画像URLを取得してフレームに適用
    const imageUrl = e.dataTransfer.getData('text/plain') || draggedImageUrl;
    if (imageUrl) {
      setFrames(prev => prev.map(frame => {
        if (frame.id === frameId) {
          return { ...frame, imageUrl: imageUrl };
        }
        return frame;
      }));
    }
    setDraggedImageUrl(null);
  };

  const handleFrameClick = (frameId: string) => {
    setSelectedFrameId(frameId === selectedFrameId ? null : frameId);
  };

  const handleQuickAssignImage = (imageUrl: string) => {
    if (selectedFrameId) {
      setFrames(prev => prev.map(frame => {
        if (frame.id === selectedFrameId) {
          return { ...frame, imageUrl };
        }
        return frame;
      }));
      setSelectedFrameId(null);
    }
  };

  // --- Canva Apps SDK 2.3コードの自動生成 ---
  const generateCanvaCode = (): string => {
    const serializedFrames = frames.map(f => {
      const baseCanvasWidth = 800;
      let baseCanvasHeight = 800;
      if (canvasAspectRatio === 'custom') {
        baseCanvasHeight = Math.round(800 * (customHeight / customWidth));
      } else if (canvasAspectRatio === '3:4') {
        baseCanvasHeight = 1066;
      } else if (canvasAspectRatio === '4:3') {
        baseCanvasHeight = 600;
      } else if (canvasAspectRatio === '16:9') {
        baseCanvasHeight = 450;
      } else if (canvasAspectRatio === '9:16') {
        baseCanvasHeight = 1422;
      }
      
      const padding = 50;
      const scaleX = (baseCanvasWidth - padding * 2) / 100;
      const scaleY = (baseCanvasHeight - padding * 2) / 100;
      
      const realX = padding + f.x * scaleX;
      const realY = padding + f.y * scaleY;
      const realW = f.width * scaleX;
      const realH = f.height * scaleY;

      return {
        id: f.id,
        x: Math.round(realX * 10) / 10,
        y: Math.round(realY * 10) / 10,
        width: Math.round(realW * 10) / 10,
        height: Math.round(realH * 10) / 10,
        placeholderImageUrl: f.imageUrl || "",
      };
    });

    return `/**
 * @license
 * Canva Custom Mosaic Apps SDK v2.3 Module
 * 以下のコードをCanva App環境で実行すると、
 * 正確な座標制限に従ってはみ出さない高品質フォトフレーム群が生成されます。
 */

import { canva, design } from "@canva/design";

// 選択された全体の形: "${selectedShape.id === 'shape_preset' ? selectedSubShape.name : `自由テキスト: ${customText}`}"
// レイアウト構成: "${layoutStyle === 'GRID' ? '格子状グリッド' : layoutStyle === 'OFFS_BRICK' ? 'レンガ調' : '円形'}"
// 総フレーム検出数: ${frames.length} 個

async function addCustomMosaicFrames() {
  try {
    const frameCoordinates = ${JSON.stringify(serializedFrames.slice(0, 80), null, 2)};
    
    console.log("Canva SDK: " + frameCoordinates.length + "個のフレームを追加します。");
    
    // CanvaのAPI \`design.addFrames()\` を一括呼び出し
    const result = await design.addFrames(
      frameCoordinates.map(coord => ({
        top: coord.y,
        left: coord.x,
        width: coord.width,
        height: coord.height,
        aspectRatio: coord.width / coord.height,
        initialImageUrl: coord.placeholderImageUrl || undefined
      }))
    );
    
    console.log("Canvaフレームの作成に成功しました。結果:", result);
    return result;
  } catch (error) {
    console.error("Canva API error:", error);
    throw error;
  }
}
`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateCanvaCode());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const generateSingleFileHtml = (): string => {
    const serializedLanguages = JSON.stringify(G20_LANGUAGES, null, 2);
    const serializedPresetShapes = JSON.stringify(PRESET_SHAPES, null, 2);
    const serializedSubPresets = JSON.stringify(SHAPE_SUB_PRESETS, null, 2);
    const serializedSampleImages = JSON.stringify(SAMPLE_IMAGES, null, 2);
    const serializedTranslations = JSON.stringify(TRANSLATIONS, null, 2);

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>フォトアート - スタンドアロン版</title>
  
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- React & ReactDOM CDNs -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin></script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@400;500;700;950&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Inter', 'Noto Sans JP', sans-serif;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    const G20_LANGUAGES = ${serializedLanguages};
    const PRESET_SHAPES = ${serializedPresetShapes};
    const SHAPE_SUB_PRESETS = ${serializedSubPresets};
    const SAMPLE_IMAGES = ${serializedSampleImages};
    const TRANSLATIONS = ${serializedTranslations};

    // --- Silhouette Generation & Mosaic Layout Algorithm ---
    function generateSilhouetteMask(shapeId, svgPath, customText, fontSize = 80, fontFamily = 'Inter, "Mplus 1p", "Hiragino Kaku Gothic Pro", "Noto Sans JP", sans-serif') {
      return new Promise((resolve) => {
        const size = 100;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(Array(size).fill(null).map(() => Array(size).fill(true)));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';

        if (shapeId === 'japanese_text' || !svgPath) {
          const textToDraw = customText || 'LOVE';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let lines = [];
          if (textToDraw.includes(' ')) {
            lines = textToDraw.split(' ').filter(Boolean);
          } else if (textToDraw.length <= 4) {
            lines = [textToDraw];
          } else if (textToDraw.length <= 7) {
            const mid = Math.ceil(textToDraw.length / 2);
            lines = [textToDraw.slice(0, mid), textToDraw.slice(mid)];
          } else {
            const mid1 = Math.ceil(textToDraw.length / 3);
            const mid2 = Math.ceil((textToDraw.length * 2) / 3);
            if (textToDraw.length >= 9) {
              lines = [textToDraw.slice(0, mid1), textToDraw.slice(mid1, mid2), textToDraw.slice(mid2)];
            } else {
              const midHalf = Math.ceil(textToDraw.length / 2);
              lines = [textToDraw.slice(0, midHalf), textToDraw.slice(midHalf)];
            }
          }

          const maxAllowedWidth = 92;
          const maxAllowedHeight = 92;
          let finalFontSize = 95;

          for (let sizeTest = 95; sizeTest >= 11; sizeTest--) {
            ctx.font = 'bold ' + sizeTest + 'px ' + fontFamily;
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

          ctx.font = 'bold ' + finalFontSize + 'px ' + fontFamily;
          ctx.lineWidth = finalFontSize * 0.08;
          ctx.strokeStyle = '#000000';
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          
          const totalHeight = lines.length * finalFontSize * 1.05;
          const startY = (size - totalHeight) / 2 + (finalFontSize / 2) + (finalFontSize * 0.05);
          
          lines.forEach((line, idx) => {
            const y = startY + idx * finalFontSize * 1.05;
            ctx.strokeText(line, size / 2, y);
            ctx.fillText(line, size / 2, y);
          });
        } else {
          try {
            const p = new Path2D(svgPath);
            ctx.save();
            ctx.fill(p);
            ctx.restore();
          } catch (e) {
            ctx.beginPath();
            if (shapeId === 'heart') {
              ctx.arc(30, 35, 25, 0, Math.PI * 2);
              ctx.arc(70, 35, 25, 0, Math.PI * 2);
              ctx.moveTo(5, 50);
              ctx.lineTo(50, 95);
              ctx.lineTo(95, 50);
              ctx.fill();
            } else {
              ctx.fillRect(15, 15, 70, 70);
            }
          }
        }

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;
        const mask = [];

        for (let y = 0; y < size; y++) {
          const row = [];
          for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
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
            hrCtx.font = 'bold ' + hrFontSize + 'px ' + fontFamily;
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

    function getCoverageRatio(mask, x, y, w, h) {
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

     function calculateMosaicLayout(mask, layoutStyle, density, shapeId, frameGap = 1.0) {
      const runLayout = (targetThreshold) => {
        const frames = [];
        const size = 100;
        
        const columns = Math.max(3, Math.min(60, Math.round(density / 3.5)));
        const rows = columns;
        const cellW = size / columns;
        const cellH = size / rows;

        if (layoutStyle === 'GRID') {
          let count = 0;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
              const x = c * cellW;
              const y = r * cellH;
              const coverage = getCoverageRatio(mask, x, y, cellW, cellH);
              if (coverage >= targetThreshold) {
                frames.push({
                  id: 'frame-grid-' + r + '-' + c + '-' + (count++),
                  x: Math.round(x * 10) / 10,
                  y: Math.round(y * 10) / 10,
                  width: Math.round(Math.max(0.3, cellW - frameGap) * 10) / 10,
                  height: Math.round(Math.max(0.3, cellH - frameGap) * 10) / 10,
                  imageUrl: null,
                  shapeId
                });
              }
            }
          }
        } else if (layoutStyle === 'OFFS_BRICK') {
          let count = 0;
          for (let r = 0; r < rows; r++) {
            const isOffsetRow = r % 2 === 1;
            const colsInRow = isOffsetRow ? columns + 1 : columns;
            
            for (let c = 0; c < colsInRow; c++) {
              let x = c * cellW - (isOffsetRow ? cellW / 2 : 0);
              const y = r * cellH;
              let w = cellW;
              
              if (x < 0) {
                w = cellW + x;
                x = 0;
              }
              if (x + w > size) {
                w = size - x;
              }

              if (w < cellW / 3) continue;

              const coverage = getCoverageRatio(mask, x, y, w, cellH);
              if (coverage >= targetThreshold) {
                frames.push({
                  id: 'frame-brick-' + r + '-' + c + '-' + (count++),
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
          let count = 0;
          const center = 50;
          const ringCount = Math.max(2, Math.min(20, Math.round(density / 6.5)));
          const radiusStep = 45 / ringCount;
          const baseDiameter = Math.min(cellW, cellH) * 0.95;
          const diameter = Math.max(0.3, baseDiameter - frameGap);

          const centX = center - diameter / 2;
          const centY = center - diameter / 2;
          if (getCoverageRatio(mask, centX, centY, diameter, diameter) >= targetThreshold) {
            frames.push({
              id: 'frame-circle-center-' + (count++),
              x: Math.round(centX * 10) / 10,
              y: Math.round(centY * 10) / 10,
              width: Math.round(diameter * 10) / 10,
              height: Math.round(diameter * 10) / 10,
              imageUrl: null,
              shapeId
            });
          }

          for (let r = 1; r <= ringCount; r++) {
            const radius = r * radiusStep;
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
                  id: 'frame-circle-ring-' + r + '-' + i + '-' + (count++),
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

      const initialThreshold = (shapeId === 'japanese_text') ? 0.35 : 0.45;
      let frames = runLayout(initialThreshold);

      if (frames.length === 0) {
        const fallbacks = [0.25, 0.18, 0.12, 0.06, 0.02];
        for (let j = 0; j < fallbacks.length; j++) {
          const fb = fallbacks[j];
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

    function getSplitLines(text) {
      const textToDraw = text || 'LOVE';
      if (textToDraw.includes(' ')) {
        return textToDraw.split(' ').filter(Boolean);
      } else if (textToDraw.length <= 4) {
        return [textToDraw];
      } else if (textToDraw.length <= 7) {
        const mid = Math.ceil(textToDraw.length / 2);
        return [textToDraw.slice(0, mid), textToDraw.slice(mid)];
      } else {
        const mid1 = Math.ceil(textToDraw.length / 3);
        const mid2 = Math.ceil((textToDraw.length * 2) / 3);
        if (textToDraw.length >= 9) {
          return [textToDraw.slice(0, mid1), textToDraw.slice(mid1, mid2), textToDraw.slice(mid2)];
        } else {
          const midHalf = Math.ceil(textToDraw.length / 2);
          return [textToDraw.slice(0, midHalf), textToDraw.slice(midHalf)];
        }
      }
    }

    // --- Inline Icon SVG Assets ---
    const Icon = ({ name, className = "w-4 h-4 text-current" }) => {
      const icons = {
        sparkles: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        ),
        heart: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        ),
        image: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        upload: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        ),
        copy: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        ),
        shuffle: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5M20 20v-5h-.581m0 0a8.003 8.003 0 11-15.357-2V15" />
          </svg>
        ),
        grid: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
        layers: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
        type: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M12 6v14m-5 0h10" />
          </svg>
        ),
        download: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        ),
        check: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
        'trash-2': (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        code: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
        palette: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        ),
        info: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        plus: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
        chevronRight: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        ),
        chevronLeft: (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        ),
        'help-circle': (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
      return icons[name] || (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    }

    // --- Main App React Component ---
    function App() {
      const [selectedShape, setSelectedShape] = useState(PRESET_SHAPES[0]);
      const [selectedSubShape, setSelectedSubShape] = useState(SHAPE_SUB_PRESETS[0]);
      const [customText, setCustomText] = useState('LOVE');
      const [layoutStyle, setLayoutStyle] = useState('GRID');
      const [density, setDensity] = useState(25);
      const [frameGap, setFrameGap] = useState(1.0);
      const [maskUrl, setMaskUrl] = useState('');
      const [frames, setFrames] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const [usePresetPool, setUsePresetPool] = useState(true);
      const [currentPool, setCurrentPool] = useState([]);
      const [bgHue, setBgHue] = useState(210);
      const [bgSat, setBgSat] = useState(16);
      const [bgLight, setBgLight] = useState(95);
      const [canvasBg, setCanvasBg] = useState('#f1f5f9');
      const [canvasAspectRatio, setCanvasAspectRatio] = useState('1:1');
      const [customWidth, setCustomWidth] = useState(1200);
      const [customHeight, setCustomHeight] = useState(1200);
      const [zoomLevel, setZoomLevel] = useState(100);
      const [showCoordinates, setShowCoordinates] = useState(false);
      const [draggedImageUrl, setDraggedImageUrl] = useState(null);
      const [hoveredFrameId, setHoveredFrameId] = useState(null);
      const [selectedFrameId, setSelectedFrameId] = useState(null);
      const [activeTab, setActiveTab] = useState('template');
      const [successMessage, setSuccessMessage] = useState(null);
      const [appLang, setAppLang] = useState('ja');
      const [tutorialStep, setTutorialStep] = useState(1);
      const [customUserImageUrl, setCustomUserImageUrl] = useState('');

      const t = (key, replacements, langOverride) => {
        const targetLang = langOverride || appLang;
        const baseLang = targetLang.split('-')[0];
        const dict = TRANSLATIONS[targetLang] || TRANSLATIONS[baseLang] || TRANSLATIONS['ja'];
        let text = dict[key] || TRANSLATIONS['ja'][key] || key;
        if (replacements) {
          Object.entries(replacements).forEach(([k, v]) => {
            text = text.replace(k, v);
          });
        }
        return text;
      };

      useEffect(() => {
        setCanvasBg('hsl(' + bgHue + ',' + bgSat + '%,' + bgLight + '%)');
      }, [bgHue, bgSat, bgLight]);

      useEffect(() => {
        let active = true;
        async function recomputeLayout() {
          setIsLoading(true);
          try {
            const isShape = selectedShape.id === 'shape_preset';
            const textVal = customText;
            const pathVal = isShape ? selectedSubShape.svgPath : undefined;
            const effShapeId = isShape ? 'shape_preset' : 'japanese_text';

            const { mask, maskUrl: newMaskUrl } = await generateSilhouetteMask(effShapeId, pathVal, textVal);
            if (!active) return;
            setMaskUrl(newMaskUrl);

            const safeDensity = !density || density < 10 ? 10 : Number(density);
            const calculated = calculateMosaicLayout(mask, layoutStyle, safeDensity, effShapeId, frameGap);
            const poolToUse = currentPool.length > 0 ? currentPool : SAMPLE_IMAGES.map(img => img.url);
            const matched = calculated.map((newFrame, index) => {
              const oldFrame = frames.find(f => Math.abs(f.x - newFrame.x) < 2 && Math.abs(f.y - newFrame.y) < 2);
              if (oldFrame && oldFrame.imageUrl) {
                return { ...newFrame, imageUrl: oldFrame.imageUrl };
              }
              // スタンドアロンの写真枚数に関わらず、形状の一部が欠けて崩れることを防ぎ、全体の形を美しく維持します
              return { ...newFrame, imageUrl: poolToUse[index % poolToUse.length] };
            });

            setFrames(matched);
          } catch (error) {
            console.error(error);
          } finally {
            if (active) setIsLoading(false);
          }
        }
        recomputeLayout();
        return () => { active = false; };
      }, [selectedShape, selectedSubShape, customText, layoutStyle, density, frameGap]);

      const triggerSuccessToast = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 4000);
      };

      const handleAutoFillPhotos = () => {
        setFrames(prev => prev.map((frame, i) => {
          const url = currentPool[i % currentPool.length];
          return { ...frame, imageUrl: url };
        }));
        triggerSuccessToast(t('toast_autofill'));
      };

      const handleClearPhotoAssignments = () => {
        setFrames(prev => prev.map(f => ({ ...f, imageUrl: null })));
        triggerSuccessToast(t('toast_clear'));
      };

      const handleShufflePhotos = () => {
        const allocatedUrls = frames.map(f => f.imageUrl).filter(Boolean);
        if (allocatedUrls.length === 0) {
          setFrames(prev => prev.map(f => {
            const rnd = currentPool[Math.floor(Math.random() * currentPool.length)];
            return { ...f, imageUrl: rnd };
          }));
        } else {
          const shuffled = [...allocatedUrls].sort(() => Math.random() - 0.5);
          let index = 0;
          setFrames(prev => prev.map(f => {
            if (f.imageUrl) {
              const nextUrl = shuffled[index % shuffled.length];
              index++;
              return { ...f, imageUrl: nextUrl };
            }
            return f;
          }));
        }
        triggerSuccessToast(t('toast_shuffle'));
      };

      const handleAddCustomImage = (e) => {
        e?.preventDefault();
        if (!customUserImageUrl) return;
        const urls = customUserImageUrl.split(/[\\n, ]+/).map(u => u.trim()).filter(Boolean);
        if (urls.length > 0) {
          setCurrentPool(prev => [...urls, ...prev]);
          setUsePresetPool(false);
          setCustomUserImageUrl('');
          triggerSuccessToast(t('toast_images_added', { '$count': String(urls.length) }));
        }
      };

      const handleSelectPresetImage = (url) => {
        if (selectedFrameId) {
          setFrames(prev => prev.map(f => f.id === selectedFrameId ? { ...f, imageUrl: url } : f));
          setSelectedFrameId(null);
          triggerSuccessToast(t('toast_photo_applied'));
        }
      };

      const loadFrameImage = (frame) => {
        return new Promise((resolve) => {
          if (!frame.imageUrl) {
            resolve({ frameId: frame.id, img: null });
            return;
          }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve({ frameId: frame.id, img });
          img.onerror = () => resolve({ frameId: frame.id, img: null });
          img.src = frame.imageUrl;
        });
      };

      const handleExportPNG = async () => {
        setIsLoading(true);
        try {
          const loadPromises = frames.map(frame => loadFrameImage(frame));
          const loadedResults = await Promise.all(loadPromises);
          const imageMap = new Map();
          loadedResults.forEach(res => {
            if (res.img) imageMap.set(res.frameId, res.img);
          });

          const canvas = document.createElement('canvas');
          let canvasWidth = 1200;
          let canvasHeight = 1200;
          if (canvasAspectRatio === 'custom') {
            canvasWidth = customWidth;
            canvasHeight = customHeight;
          } else if (canvasAspectRatio === '3:4') {
            canvasWidth = 1200; canvasHeight = 1600;
          } else if (canvasAspectRatio === '4:3') {
            canvasWidth = 1600; canvasHeight = 1200;
          } else if (canvasAspectRatio === '16:9') {
            canvasWidth = 1600; canvasHeight = 900;
          } else if (canvasAspectRatio === '9:16') {
            canvasWidth = 900; canvasHeight = 1600;
          }

          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error();

          ctx.fillStyle = canvasBg;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          const pad = canvasWidth * 0.05;
          const drawWidth = canvasWidth - pad * 2;
          const drawHeight = canvasHeight - pad * 2;

          // はみ出た部分を見切るために、1度透明なテンポラリキャンバスにフレーム群を描画してから
          // 形状で destination-in マスクをかけて、メインキャンバスに重ねて描画します。
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasWidth;
          tempCanvas.height = canvasHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) throw new Error();

          frames.forEach(frame => {
            const fx = pad + (frame.x / 100) * drawWidth;
            const fy = pad + (frame.y / 100) * drawHeight;
            const fRefWidth = (frame.width / 100) * drawWidth;
            const fRefHeight = (frame.height / 100) * drawHeight;
            const img = imageMap.get(frame.id);

            tempCtx.save();
            if (layoutStyle === 'CIRCLE') {
              tempCtx.beginPath();
              const r = Math.min(fRefWidth, fRefHeight) / 2;
              tempCtx.arc(fx + fRefWidth / 2, fy + fRefHeight / 2, r, 0, Math.PI * 2);
              tempCtx.closePath();
              tempCtx.clip();
            } else {
              const radius = 3;
              tempCtx.beginPath();
              tempCtx.moveTo(fx + radius, fy);
              tempCtx.arcTo(fx + fRefWidth, fy, fx + fRefWidth, fy + fRefHeight, radius);
              tempCtx.arcTo(fx + fRefWidth, fy + fRefHeight, fx, fy + fRefHeight, radius);
              tempCtx.arcTo(fx, fy + fRefHeight, fx, fy, radius);
              tempCtx.arcTo(fx, fy, fx + fRefWidth, fy, radius);
              tempCtx.closePath();
              tempCtx.clip();
            }

            if (img) {
              const imgAspect = img.width / img.height;
              const frameAspect = fRefWidth / fRefHeight;
              let sx = 0, sy = 0, sw = img.width, sh = img.height;
              if (imgAspect > frameAspect) {
                sw = img.height * frameAspect;
                sx = (img.width - sw) / 2;
              } else {
                sh = img.width / frameAspect;
                sy = (img.height - sh) / 2;
              }
              tempCtx.drawImage(img, sx, sy, sw, sh, fx, fy, fRefWidth, fRefHeight);
            } else {
              tempCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
              tempCtx.fillRect(fx, fy, fRefWidth, fRefHeight);
              tempCtx.strokeStyle = 'rgba(0,0,0,0.1)';
              tempCtx.lineWidth = 1;
              tempCtx.strokeRect(fx, fy, fRefWidth, fRefHeight);
            }

            if (layoutStyle === 'CIRCLE') {
              tempCtx.strokeStyle = 'rgba(255,255,255,0.4)';
              tempCtx.lineWidth = 1.5;
              const r = Math.min(fRefWidth, fRefHeight) / 2;
              tempCtx.beginPath();
              tempCtx.arc(fx + fRefWidth / 2, fy + fRefHeight / 2, r, 0, Math.PI * 2);
              tempCtx.stroke();
            }
            tempCtx.restore();
          });

          // 形状最優先のクリッピングマスクを適用
          tempCtx.globalCompositeOperation = 'destination-in';
          const pathValue = selectedShape.id === 'shape_preset' ? selectedSubShape.svgPath : undefined;
          
          tempCtx.save();
          tempCtx.translate(pad, pad);
          tempCtx.scale(drawWidth / 100, drawHeight / 100);
          tempCtx.fillStyle = '#000000'; // マスク用の不透明色

          if (selectedShape.id === 'japanese_text' || !pathValue) {
            const textToDraw = customText || 'LOVE';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            
            // linesの分割
            let lines = [];
            if (textToDraw.includes(' ')) {
              lines = textToDraw.split(' ').filter(Boolean);
            } else if (textToDraw.length <= 4) {
              lines = [textToDraw];
            } else if (textToDraw.length <= 7) {
              const mid = Math.ceil(textToDraw.length / 2);
              lines = [textToDraw.slice(0, mid), textToDraw.slice(mid)];
            } else {
              const mid1 = Math.ceil(textToDraw.length / 3);
              const mid2 = Math.ceil((textToDraw.length * 2) / 3);
              if (textToDraw.length >= 9) {
                lines = [textToDraw.slice(0, mid1), textToDraw.slice(mid1, mid2), textToDraw.slice(mid2)];
              } else {
                const midHalf = Math.ceil(textToDraw.length / 2);
                lines = [textToDraw.slice(0, midHalf), textToDraw.slice(midHalf)];
              }
            }

            const fontFamily = 'Inter, "Mplus 1p", "Hiragino Kaku Gothic Pro", "Noto Sans JP", sans-serif';
            let finalFontSize = 95;

            for (let sizeTest = 95; sizeTest >= 11; sizeTest--) {
              tempCtx.font = "bold " + sizeTest + "px " + fontFamily;
              let currentWidth = 0;
              for (const line of lines) {
                const w = tempCtx.measureText(line).width;
                if (w > currentWidth) currentWidth = w;
              }
              
              const totalHeight = lines.length * sizeTest * 1.05;
              if (currentWidth <= 92 && totalHeight <= 92) {
                finalFontSize = sizeTest;
                break;
              }
              finalFontSize = sizeTest;
            }

            tempCtx.font = "bold " + finalFontSize + "px " + fontFamily;
            const totalHeight = lines.length * finalFontSize * 1.05;
            const startY = (100 - totalHeight) / 2 + (finalFontSize / 2) + (finalFontSize * 0.05);
            
            lines.forEach((line, idx) => {
              const y = startY + idx * finalFontSize * 1.05;
              tempCtx.fillText(line, 50, y);
            });
          } else {
            try {
              const p = new Path2D(pathValue);
              tempCtx.fill(p);
            } catch (e) {
              // フォールバック
              tempCtx.beginPath();
              if (selectedShape.id === 'heart') {
                tempCtx.arc(30, 35, 25, 0, Math.PI * 2);
                tempCtx.arc(70, 35, 25, 0, Math.PI * 2);
                tempCtx.moveTo(5, 50);
                tempCtx.lineTo(50, 95);
                tempCtx.lineTo(95, 50);
                tempCtx.fill();
              } else {
                tempCtx.fillRect(15, 15, 70, 70);
              }
            }
          }
          tempCtx.restore();

          // メインキャンバスに重ねて描画します
          ctx.drawImage(tempCanvas, 0, 0);

          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = "mosaic-photo-" + Date.now() + ".png";
          link.href = dataUrl;
          link.click();
          triggerSuccessToast(t('toast_png_success'));
        } catch (err) {
          triggerSuccessToast(t('toast_png_error'));
        } finally {
          setIsLoading(false);
        }
      };

      const handleExportHtmlFile = () => {
        const htmlContent = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "my-mosaic-art.html";
        link.click();
        URL.revokeObjectURL(url);
        triggerSuccessToast(t('toast_html_saved'));
      };

      // Ensure single-page app in iframe runs correctly
      return (
        <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden" id="sleek-app-root">
          
          <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10" id="m-header">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-xs bg-slate-50">
                <img
                  src="/photo-art-logo.ico"
                  alt="フォトアート"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      // Prevent duplicate fallbacks
                      if (parent.querySelector('svg')) return;
                      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                      svg.setAttribute('viewBox', '0 0 200 200');
                      svg.setAttribute('class', 'w-full h-full');
                      svg.innerHTML = \`<defs><linearGradient id="photoart-bg-port" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6" /><stop offset="50%" stop-color="#3b82f6" /><stop offset="100%" stop-color="#06b6d4" /></linearGradient></defs><rect width="200" height="200" rx="44" fill="url(#photoart-bg-port)" /><circle cx="100" cy="100" r="40" fill="white" opacity="0.3" /></svg>\`;
                      parent.appendChild(svg);
                    }
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-slate-900">{t('title')}</h1>
                  <select
                    value={appLang}
                    onChange={(e) => {
                      const l = e.target.value;
                      setAppLang(l);
                      const lObj = G20_LANGUAGES.find(lang => lang.code === l);
                      if (lObj) {
                        setCustomText(lObj.word);
                        triggerSuccessToast(t('toast_lang_changed', { '$lang': lObj.flag + " " + lObj.name, '$word': lObj.word }, l));
                      }
                    }}
                    className="bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 text-[10.5px] font-bold text-indigo-700 outline-none cursor-pointer"
                  >
                    {G20_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs text-slate-500 bg-slate-100 p-1.5 px-3 rounded-full font-mono font-bold">{t('total_cells')}: {frames.length}</span>
            </div>
          </header>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Controls */}
            <aside className="w-full md:w-[360px] h-[280px] sm:h-[320px] md:h-full bg-white border-t md:border-t-0 md:border-r border-slate-200 flex flex-col shrink-0 order-2 md:order-1 z-20 relative">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1 shrink-0">
                {['template', 'layout', 'photo'].map((tId) => (
                  <button
                    key={tId}
                    onClick={() => setActiveTab(tId as any)}
                    className={'flex-1 py-1 px-1 rounded-md text-[10px] font-bold transition-all capitalize select-none cursor-pointer ' + (activeTab === tId ? 'bg-white text-indigo-600 border border-indigo-150 shadow-xs' : 'text-slate-550 border border-transparent hover:text-slate-800')}
                  >
                    {tId === 'template' && t('tab_shape')}
                    {tId === 'layout' && t('tab_layout')}
                    {tId === 'photo' && t('tab_photo')}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                {activeTab === 'template' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('shape_main_title')}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_SHAPES.map((shape) => (
                          <button
                            key={shape.id}
                            onClick={() => setSelectedShape(shape)}
                            className={'p-2.5 rounded-lg border text-left transition-all ' + (selectedShape.id === shape.id ? 'border-indigo-500 bg-indigo-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300')}
                          >
                            <span className="text-base mr-1.5">{shape.icon}</span>
                            <span className="text-xs font-bold text-slate-800">{t(shape.name)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedShape.id === 'shape_preset' ? (
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 block">{t('shape_preset_label')}</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {SHAPE_SUB_PRESETS.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => setSelectedSubShape(sub)}
                              className={'p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-700 ' + (selectedSubShape.id === sub.id ? 'bg-white border-indigo-500 text-indigo-700 shadow-xs' : 'bg-white border-slate-150 hover:bg-slate-50')}
                            >
                              <span>{sub.icon}</span>
                              <span className="truncate">{t('shape_' + sub.id)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-3">
                        <span className="text-[11px] font-bold text-slate-700 block">{t('shape_text_label')}</span>
                        <input
                          type="text"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value.slice(0, 15))}
                          placeholder="LOVE"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <p className="text-[10px] text-slate-400">{t('text_desc')}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'layout' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-3">
                      <span className="text-[11px] font-bold text-slate-700 block">{t('layout_main_title')}</span>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { id: 'GRID', label: t('algo_grid_p_title'), desc: t('algo_grid_p_desc') },
                          { id: 'OFFS_BRICK', label: t('algo_brick_p_title'), desc: t('algo_brick_p_desc') }
                        ].map((alg) => (
                          <button
                            key={alg.id}
                            onClick={() => setLayoutStyle(alg.id as LayoutStyle)}
                            className={'p-2 rounded-lg border text-left transition-all ' + (layoutStyle === alg.id ? 'border-sm bg-indigo-50/50 border-indigo-400' : 'bg-white border-slate-150 hover:border-slate-200')}
                          >
                            <span className="text-xs font-bold text-slate-800 block">{alg.label}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{alg.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                        <span>{t('layout_density')}</span>
                        <input
                          type="number"
                          min="10"
                          max="200"
                          value={density}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            if (valStr === '') {
                              setDensity('');
                            } else {
                              const val = Number(valStr);
                              if (!isNaN(val)) setDensity(val);
                            }
                          }}
                          onBlur={() => {
                            if (density === '' || density < 10) setDensity(10);
                            if (density > 200) setDensity(200);
                          }}
                          className="w-16 px-1.5 py-0.5 text-xs text-indigo-600 bg-white border border-slate-200 rounded font-mono font-bold text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={density}
                        onChange={(e) => setDensity(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>粗い (大サイズの枠)</span>
                        <span>極細 (小サイズの枠)</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                        <span>{t('layout_gap_label')}</span>
                        <span className="text-[11px] font-mono font-bold text-indigo-600">
                          {frameGap === 0 ? t('gap_zero') : frameGap.toFixed(1) + '%'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3.5"
                        step="0.1"
                        value={frameGap}
                        onChange={(e) => setFrameGap(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>{t('gap_zero')}</span>
                        <span>{t('gap_wide')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'photo' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                       <span className="text-[11px] font-bold text-slate-700 block">{t('photo_main_title')}</span>
                       <div className="grid grid-cols-3 gap-1.5">
                         <button
                           onClick={handleAutoFillPhotos}
                           className="py-2 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                         >
                           <Icon name="sparkles" className="w-4 h-4 text-indigo-500" />
                           {t('btn_insert')}
                         </button>
                         <button
                           onClick={handleShufflePhotos}
                           className="py-2 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                          >
                            <Icon name="shuffle" className="w-4 h-4 text-slate-500" />
                            {t('btn_shuffle')}
                          </button>
                          <button
                            onClick={handleClearPhotoAssignments}
                            className="py-2 px-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                          >
                            <Icon name="trash-2" className="w-4 h-4 text-red-500" />
                            {t('btn_clear')}
                          </button>
                        </div>
                     </div>

                     <div className="space-y-3">
                       {/* 端末から写真を追加ゾーン */}
                       <div className="bg-indigo-50/40 border border-dashed border-indigo-300 p-4 rounded-xl text-center space-y-2 transition-all hover:bg-indigo-50/70">
                         <span className="text-[11.5px] font-extrabold text-indigo-950 block text-center flex items-center justify-center gap-1.5 select-none">
                           <Icon name="upload" className="w-4 h-4 text-indigo-600 animate-pulse" />
                           端末・PCから写真を選択・追加
                         </span>
                         <input
                           type="file"
                           multiple
                           accept="image/*"
                           onChange={handleLocalFileSelect}
                           className="hidden"
                           id="standalone-file-input"
                         />
                         <label
                           htmlFor="standalone-file-input"
                           className="max-w-[240px] mx-auto py-2 px-4 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold transition-all block cursor-pointer text-center shadow-md shadow-indigo-600/20 active:scale-95"
                         >
                           写真ファイルを一括選択する
                         </label>
                         <p className="text-[9px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto pt-1 select-none">
                           ※スマホから実行した場合、端末内のGoogleフォト等のアプリからも写真を選択できます。<br />
                           ※複数枚の写真（数十〜数百枚）を一度に高画質のまま一括インポートできます。
                         </p>
                       </div>

                       {/* プールされている画像一覧のプレビュー */}
                       {currentPool && currentPool.length > 0 && (
                         <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-2">
                           <span className="text-[10px] font-bold text-slate-600 block flex justify-between items-center px-0.5 select-none">
                             <span>追加済みの写真 ({currentPool.length}枚) </span>
                             <span className="text-[8.5px] text-slate-400 font-normal">※個別に削除可能</span>
                           </span>
                           <div className="grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto p-1 bg-white rounded-lg border border-slate-150">
                             {currentPool.map((url, idx) => (
                               <div key={url + '-' + idx} className="relative aspect-square rounded overflow-hidden border border-slate-200 group">
                                 <img src={url} className="w-full h-full object-cover" />
                                 <button
                                   onClick={() => {
                                     const updated = [...currentPool];
                                     updated.splice(idx, 1);
                                     setCurrentPool(updated);
                                   }}
                                   className="absolute top-0.5 right-0.5 bg-red-650 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold text-[8.5px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-750 shadow-xs"
                                   title="この写真をプールから削除"
                                 >
                                   ×
                                 </button>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

               </div>

               {/* Progress & Actions */}
               <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2 select-none shrink-0">
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                   <span>{t('progress')}</span>
                   <span>{progressPercent}% ({filledCount}/{frames.length} {t('frames_unit')})</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: progressPercent + '%' }}></div>
                 </div>
               </div>

               {/* Action output buttons footer */}
               <div className="p-3 border-t border-slate-200 shrink-0 bg-slate-50 flex flex-col gap-2">
                 <button
                   onClick={handleExportPNG}
                   disabled={isLoading || frames.length === 0}
                   className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-lg flex items-center justify-center gap-1.5 text-xs shadow-xs hover:shadow transition-all cursor-pointer"
                 >
                   <Icon name="download" className="w-4 h-4 text-emerald-100" />
                   {t('btn_download_png')}
                 </button>


               </div>
             </aside>        {/* Canvas Preview Area */}
            <main className="flex-1 bg-slate-100 p-2 sm:p-4 md:p-8 flex flex-col items-center justify-between overflow-y-auto relative order-1 md:order-2">
              <div className="absolute inset-x-0 top-0 h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              {/* Toolbar */}
              <div className="w-full max-w-2xl bg-white rounded-xl px-3 py-2 border border-slate-200 flex flex-wrap justify-between items-center gap-3.5 shadow-xs relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold select-none">{t('zoom')}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1 hover:bg-slate-100 rounded text-slate-550"><Icon name="chevronLeft" className="w-3.5 h-3.5" /></button>
                    <span className="text-[10.5px] font-mono font-bold text-slate-650 w-8 text-center">{zoomLevel}%</span>
                    <button onClick={() => setZoomLevel(Math.min(180, zoomLevel + 10))} className="p-1 hover:bg-slate-100 rounded text-slate-550"><Icon name="chevronRight" className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {/* Aspect Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold select-none">{t('aspect_label')}</span>
                  <div className="flex gap-1 items-center">
                     {['1:1', '3:4', '4:3', '16:9', '9:16', 'custom'].map(ratio => (
                       <button
                         key={ratio}
                         onClick={() => setCanvasAspectRatio(ratio)}
                         className={'px-1.5 py-0.5 rounded text-[9.5px] font-bold ' + (canvasAspectRatio === ratio ? 'bg-indigo-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')}
                       >
                         {ratio === 'custom' ? 'カスタム' : ratio}
                       </button>
                     ))}
                     {canvasAspectRatio === 'custom' && (
                       <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200 ml-1">
                         <input
                           type="number"
                           value={customWidth}
                           onChange={(e) => setCustomWidth(Math.max(100, Math.min(8000, Number(e.target.value) || 1200)))}
                           className="w-11 px-1 py-0.5 text-[9px] border rounded bg-white font-mono text-center leading-none"
                           title="幅 (Width px)"
                           placeholder="W"
                         />
                         <span className="text-[8px] text-slate-400">×</span>
                         <input
                           type="number"
                           value={customHeight}
                           onChange={(e) => setCustomHeight(Math.max(100, Math.min(8000, Number(e.target.value) || 1200)))}
                           className="w-11 px-1 py-0.5 text-[9px] border rounded bg-white font-mono text-center leading-none"
                           title="高さ (Height px)"
                           placeholder="H"
                         />
                         <span className="text-[8px] text-slate-400">px</span>
                       </div>
                     )}
                  </div>
                </div>

                {/* HSL adjustment */}
                <div className="flex items-center gap-4 border-l border-slate-200 pl-4 py-0.5" id="canvas-bg-controls">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[8px] font-bold select-none leading-none mb-0.5">
                      <span className="text-slate-550">{t('color_tune')}</span>
                      <span className="font-mono text-[8px] text-indigo-600 bg-indigo-50 px-0.5 rounded font-semibold ml-1">
                        {'HSL(' + bgHue + ',' + bgSat + '%,' + bgLight + '%)'}
                      </span>
                    </div>
                    <div className="space-y-0.5 w-[140px]" id="hsl-sliders-group-portable">
                      {/* Hue */}
                      <div className="flex items-center gap-1">
                        <span className="text-[7.5px] text-slate-400 w-2.5 font-bold select-none">{t('color_hue')}</span>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={bgHue}
                          onChange={(e) => setBgHue(Number(e.target.value))}
                          className="flex-1 h-1 rounded-sm appearance-none cursor-pointer accent-slate-600"
                          style={{
                            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                          }}
                        />
                      </div>
                      {/* Saturation */}
                      <div className="flex items-center gap-1">
                        <span className="text-[7.5px] text-slate-400 w-2.5 font-bold select-none">{t('color_sat')}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={bgSat}
                          onChange={(e) => setBgSat(Number(e.target.value))}
                          className="flex-1 h-1 rounded-sm appearance-none cursor-pointer accent-indigo-500"
                          style={{
                            background: 'linear-gradient(to right, #808080, hsl(\' + bgHue + \', 100%, 50%))'
                          }}
                        />
                      </div>
                      {/* Lightness */}
                      <div className="flex items-center gap-1">
                        <span className="text-[7.5px] text-slate-400 w-2.5 font-bold select-none">{t('color_light')}</span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={bgLight}
                          onChange={(e) => setBgLight(Number(e.target.value))}
                          className="flex-1 h-1 rounded-sm appearance-none cursor-pointer accent-indigo-500"
                          style={{
                            background: 'linear-gradient(to right, #151515, HSL(\' + bgHue + \',\' + bgSat + \'%,50%), #ffffff)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Canvas viewport container */}
              <div className="flex-1 flex items-center justify-center py-4 w-full relative z-10" style={{ minHeight: '380px' }}>
                <div
                  className="rounded-2xl shadow-xl transition-all relative overflow-hidden flex flex-wrap border border-slate-200/50"
                  style={{
                    backgroundColor: canvasBg,
                    width: (canvasAspectRatio === \'1:1\' || canvasAspectRatio === \'3:4\' || canvasAspectRatio === \'9:16\') ? \'430px\' :
                           (canvasAspectRatio === \'custom\') ? (customWidth >= customHeight ? \'520px\' : \'430px\') : \'520px\',
                    aspectRatio: canvasAspectRatio === \'custom\'
                      ? customWidth + \'/\' + customHeight
                      : (canvasAspectRatio === \'1:1\' ? \'1\' : canvasAspectRatio === \'3:4\' ? \'3/4\' : canvasAspectRatio === \'4:3\' ? \'4/3\' : canvasAspectRatio === \'16:9\' ? \'16/9\' : \'9/16\'),
                    transform: \'scale(\' + (zoomLevel / 100) + \')\'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-50">
                      <div className="flex flex-col items-center gap-2">
                        <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-[10px] text-slate-500 font-bold tracking-tight">{t(\'loading_contour\')}</span>
                      </div>
                    </div>
                  )}

                  {/* Render frames */}
                  <div
                    className="absolute inset-0"
                    style={{
                      maskImage: maskUrl ? \'url(\' + maskUrl + \')\' : \'none\',
                      maskSize: \'100% 100%\',
                      maskRepeat: \'no-repeat\',
                      WebkitMaskImage: maskUrl ? \'url(\' + maskUrl + \')\' : \'none\',
                      WebkitMaskSize: \'100% 100%\',
                      WebkitMaskRepeat: \'no-repeat\'
                    }}
                  >
                    {frames.map((frame) => {
                      const isSelected = selectedFrameId === frame.id;
                      const isHovered = hoveredFrameId === frame.id;

                      return (
                        <div
                          key={frame.id}
                          onDragOver={(e) => { e.preventDefault(); setHoveredFrameId(frame.id); }}
                          onDragLeave={() => setHoveredFrameId(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setHoveredFrameId(null);
                            const url = e.dataTransfer.getData(\'text/plain\');
                            if (url) {
                              setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, imageUrl: url } : f));
                            }
                          }}
                          onClick={() => setSelectedFrameId(frame.id === selectedFrameId ? null : frame.id)}
                          className={\'absolute cursor-pointer select-none transition-all duration-150 overflow-hidden group \' + (layoutStyle === \'CIRCLE\' ? \'rounded-full\' : \'rounded\')}
                          style={{
                            left: frame.x + '%',
                            top: frame.y + '%',
                            width: frame.width + '%',
                            height: frame.height + '%',
                            backgroundColor: frame.imageUrl ? 'transparent' : 'rgba(255, 255, 255, 0.45)',
                            border: isSelected ? '2px solid #6366f1' : isHovered ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.1)',
                            boxShadow: isHovered ? '0 0 8px rgba(99,102,241,0.3)' : 'none'
                          }}
                        >
                          {frame.imageUrl ? (
                            <img src={frame.imageUrl} className="w-full h-full object-cover pointer-events-none" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-400 font-bold opacity-60">
                              +
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bot tutorial banner inside single HTML */}
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-4 flex gap-3 text-xs text-slate-600 relative z-10 font-sans shadow-sm">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0 mt-0.5">💡</div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{t('tutorial_guide')} ({tutorialStep}/3)</span>
                    <div className="flex items-center gap-1.5">
                      {tutorialStep > 1 && <button onClick={() => setTutorialStep(tutorialStep - 1)} className="text-[10px] text-slate-500 bg-slate-100 p-0.5 px-1.5 rounded cursor-pointer">{t('btn_back')}</button>}
                      {tutorialStep < 3 ? <button onClick={() => setTutorialStep(tutorialStep + 1)} className="text-[10px] bg-indigo-50 text-indigo-600 font-bold p-0.5 px-1.5 rounded cursor-pointer">{t('btn_next')}</button> : <button onClick={() => setTutorialStep(1)} className="text-[10px] bg-indigo-100 text-indigo-700 p-0.5 px-1.5 rounded cursor-pointer">{t('btn_restart')}</button>}
                    </div>
                  </div>
                  <div className="mt-1">
                    {tutorialStep === 1 && <p className="text-[11px] text-slate-500 leading-normal"><strong>{t('tut_step_1_title')}: </strong>{t('tut_step_1_desc')}</p>}
                    {tutorialStep === 2 && <p className="text-[11px] text-slate-500 leading-normal"><strong>{t('tut_step_2_title')}: </strong>{t('tut_step_2_desc')}</p>}
                    {tutorialStep === 3 && <p className="text-[11px] text-slate-500 leading-normal"><strong>{t('tut_step_3_title')}: </strong>{t('tut_step_3_desc')}</p>}
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* Toast Notification Container */}
          {successMessage && (
            <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-2xl animate-bounce flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`;
  };

  const handleCopySingleFileHtml = () => {
    if (usageCount >= 10) {
      setIsLimitModalOpen(true);
      return;
    }
    navigator.clipboard.writeText(generateSingleFileHtml());
    setIsHtmlCopied(true);
    triggerSuccessToast("📋 index.htmlのソースコードをクリップボードにコピーしました！");
    setTimeout(() => setIsHtmlCopied(false), 2500);
    checkAndIncrementUsage();
  };

  const handleDownloadSingleFileHtml = () => {
    if (usageCount >= 10) {
      setIsLimitModalOpen(true);
      return;
    }
    const htmlString = generateSingleFileHtml();
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8;' });
    const u = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = u;
    link.download = "index.html";
    link.click();
    URL.revokeObjectURL(u);
    triggerSuccessToast("💾 単一ファイル版の「index.html」をローカルにダウンロードしました！");
    checkAndIncrementUsage();
  };

  const handleDownloadMultiFileZip = async () => {
    setIsLoading(true);
    try {
      const zip = new JSZip();

      // Dynamic source file fetching ensures 100% consistency with the beautiful preview!
      const fetchText = async (filePath: string): Promise<string> => {
        const res = await fetch(filePath);
        if (!res.ok) {
          throw new Error(`ProductionEnvironException: Cannot fetch source files inside compiled app`);
        }
        return await res.text();
      };

      const [
        packageJson,
        viteConfig,
        indexHtml,
        tsconfigJson,
        mainTsx,
        indexCss,
        typesTs,
        presetsTs,
        layoutUtilsTs,
        firebaseAuthTs,
        appTsx
      ] = await Promise.all([
        fetchText('/package.json').catch(() => `{ "name": "photo-mosaic-art-pro", "version": "1.0.0", "type": "module", "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" }, "dependencies": { "react": "^19.0.1", "react-dom": "^19.0.1", "jszip": "^3.10.1", "lucide-react": "^0.546.0", "motion": "^12.23.24", "firebase": "^12.14.0" }, "devDependencies": { "@types/react": "^19.0.1", "@types/react-dom": "^19.0.1", "typescript": "^5.8.2", "vite": "^6.2.3", "tailwindcss": "^4.1.14", "@tailwindcss/vite": "^4.1.14" } }`),
        fetchText('/vite.config.ts').catch(() => `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\nexport default defineConfig({ plugins: [react(), tailwindcss()] });`),
        fetchText('/index.html').catch(() => `<!DOCTYPE html>\n<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>フォトアート</title></head><body class="bg-slate-50 text-slate-800"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`),
        fetchText('/tsconfig.json').catch(() => `{ "compilerOptions": { "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler", "jsx": "react-jsx", "strict": true } }`),
        fetchText('/src/main.tsx'),
        fetchText('/src/index.css'),
        fetchText('/src/types.ts'),
        fetchText('/src/presets.ts'),
        fetchText('/src/layoutUtils.ts'),
        fetchText('/src/firebaseAuth.ts'),
        fetchText('/src/App.tsx')
      ]);

      // Bundle standard Vite React project configurations
      zip.file("package.json", packageJson);
      zip.file("vite.config.ts", viteConfig);
      zip.file("index.html", indexHtml);
      zip.file("tsconfig.json", tsconfigJson);
      
      const srcFolder = zip.folder("src");
      if (srcFolder) {
        srcFolder.file("main.tsx", mainTsx);
        srcFolder.file("index.css", indexCss);
        srcFolder.file("types.ts", typesTs);
        srcFolder.file("presets.ts", presetsTs);
        srcFolder.file("layoutUtils.ts", layoutUtilsTs);
        srcFolder.file("firebaseAuth.ts", firebaseAuthTs);
        srcFolder.file("App.tsx", appTsx);
      }

      // Add a comprehensive high-quality deployer README
      const readmeTxt = `フォトアート - 100% 完全再現 Vite + React デプロイパッケージ
========================================================================

この度は、開発用ならびにデプロイ用に完全再現された複数ファイル構成（Vite + React）のソースコードパッケージをエクスポートいただきありがとうございます！

このパッケージは、プレビュー表示されている【超多機能＆豪華アニメーションつきの全画面UI】のソースコードそのものです。
標準的なViteプロジェクトとして構築されており、Vercel、Netlify、GitHub Pagesなどのホスティング環境で100%忠実に完全動作します。

● パッケージファイル構成
  - package.json          : プロジェクト設定、React 19, Motion, Tailwind などのプラグイン定義
  - vite.config.ts        : 高速ビルドツール Vite の最適化設定
  - tsconfig.json         : 厳密な型安全のための TypeScript 構成
  - index.html            : Webアプリケーションのマスターマウント文書
  - src/
    ├─ main.tsx          : 描画のエントリポイント
    ├─ index.css         : Tailwind CSS の設定
    ├─ App.tsx           : マスター画面（すべての状態、サイドバー、各種調整ダイヤル、多言語対応）
    ├─ types.ts          : フォトモザイクデータの型定義
    ├─ presets.ts        : ハートや文字等、シルエットに使うプリセットデータ
    ├─ layoutUtils.ts    : 2次元マスク生成・コラージュ分割アルゴリズム（数学計算エンジン）
    ├─ firebaseAuth.ts   : Firebase 認証および Google Photos API ロケータ
    └─ components/
        ├─ GooglePhotosSelector.tsx : クラウドから Googleフォトを流し込むビュー
        └─ AmazonPhotosSelector.tsx : Amazon Photos インポート連携ビュー

● 🚀 Vercel / Netlify へのデプロイ手順（超簡単 1分）
  1. このZIPアーカイブを任意のフォルダに解凍します。
  2. 新規の GitHub レポジトリを作成し、解凍したすべてのファイルをそのままアップロード（プッシュ）します。
  3. Vercelの管理画面（ https://vercel.com/ ）を開き、「New Project」から作成したGitHubリポジトリを選択。
  4. Vercelが自動的に「Vite」プロジェクトであることを認識し、ビルドコマンド等も自動設定されます。
  5. 【Deploy】ボタンをクリックするだけで、世界中へ超高速ロードされる完全な本番サイトが無料公開されます！

● 💻 ローカル環境での起動・開発方法
  解凍されたプロジェクトフォルダで、以下のコマンドを順に実行してください：
  
  # 依存関係のインストール
  npm install

  # 開発用ローカルサーバーの起動
  npm run dev

  # 本番ビルドテスト
  npm run build

========================================================================
フォトアート (TypeScript + Vite + React)`;

      zip.file("README.md", readmeTxt);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const u = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = u;
      link.download = `photo-mosaic-art-vite-react-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(u);

      triggerSuccessToast("🎁 プレビュー画面を完全再現した Vite+React の高品質ZIPを構築・ダウンロードしました！");
    } catch (err: any) {
      console.error("Failed to generate ZIP", err);
      if (err?.message?.includes('ProductionEnvironException') || err?.message?.includes('fetch')) {
        alert("⚠️ Vercelなどの本番デプロイ後の環境では、個々のTypeScriptソースコード群が1つの最適化ファイルにビルド集約され、元の個々のファイルが存在しないため、ZIPでのエクスポートができません。\n\n代わりに、すべての設定とデザイン機能が1つのファイルに完全・軽量保存された「単一HTML版（index.html）」のダウンロード機能（すぐ右隣のボタン）を強くお勧めします！本番環境でも180%完全動作・ローカルでも即座に展開できます。");
      } else {
        triggerSuccessToast("⚠️ ZIPアーカイブの構築中にエラーが検知されました。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCanvasSimulated = () => {
    triggerSuccessToast(`🎉 Canvaのシミュレートキャンバスに ${frames.length} 個 of カスタム・モザイクフレームをエクスポートしました！`);
  };

  const loadFrameImage = (frame: PhotoFrame): Promise<{ frameId: string; img: HTMLImageElement | null }> => {
    return new Promise((resolve) => {
      if (!frame.imageUrl) {
        resolve({ frameId: frame.id, img: null });
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        resolve({ frameId: frame.id, img });
      };
      img.onerror = () => {
        console.warn(`Failed to load image for frame: ${frame.imageUrl}`);
        resolve({ frameId: frame.id, img: null });
      };
      img.src = frame.imageUrl;
    });
  };

  const handleExportPNG = async () => {
    if (usageCount >= 10) {
      setIsLimitModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      const loadPromises = frames.map(frame => loadFrameImage(frame));
      const loadedResults = await Promise.all(loadPromises);
      const imageMap = new Map<string, HTMLImageElement>();
      loadedResults.forEach(res => {
        if (res.img) {
          imageMap.set(res.frameId, res.img);
        }
      });

      const canvas = document.createElement('canvas');
      let canvasWidth = 1200;
      let canvasHeight = 1200;
      if (canvasAspectRatio === 'custom') {
        canvasWidth = customWidth;
        canvasHeight = customHeight;
      } else if (canvasAspectRatio === '3:4') {
        canvasWidth = 1200;
        canvasHeight = 1600;
      } else if (canvasAspectRatio === '4:3') {
        canvasWidth = 1600;
        canvasHeight = 1200;
      } else if (canvasAspectRatio === '16:9') {
        canvasWidth = 1600;
        canvasHeight = 900;
      } else if (canvasAspectRatio === '9:16') {
        canvasWidth = 900;
        canvasHeight = 1600;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context output failed');

      // 背景塗りつぶし
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 内側5%のパディング
      const pad = canvasWidth * 0.05;
      const drawWidth = canvasWidth - pad * 2;
      const drawHeight = canvasHeight - pad * 2;

      // はみ出た部分を見切るために、1度透明なテンポラリキャンバスにフレーム群を描画してから
      // 形状で destination-in マスクをかけて、メインキャンバスに重ねて描画します。
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Temporary Canvas context output failed');

      frames.forEach(frame => {
        const fx = pad + (frame.x / 100) * drawWidth;
        const fy = pad + (frame.y / 100) * drawHeight;
        const fRefWidth = (frame.width / 100) * drawWidth;
        const fRefHeight = (frame.height / 100) * drawHeight;

        const img = imageMap.get(frame.id);

        tempCtx.save();
        
        if (layoutStyle === 'CIRCLE') {
          tempCtx.beginPath();
          const r = Math.min(fRefWidth, fRefHeight) / 2;
          tempCtx.arc(fx + fRefWidth / 2, fy + fRefHeight / 2, r, 0, Math.PI * 2);
          tempCtx.closePath();
          tempCtx.clip();
        } else {
          tempCtx.beginPath();
          const radius = 3;
          tempCtx.moveTo(fx + radius, fy);
          tempCtx.arcTo(fx + fRefWidth, fy, fx + fRefWidth, fy + fRefHeight, radius);
          tempCtx.arcTo(fx + fRefWidth, fy + fRefHeight, fx, fy + fRefHeight, radius);
          tempCtx.arcTo(fx, fy + fRefHeight, fx, fy, radius);
          tempCtx.arcTo(fx, fy, fx + fRefWidth, fy, radius);
          tempCtx.closePath();
          tempCtx.clip();
        }

        if (img) {
          const imgAspect = img.width / img.height;
          const frameAspect = fRefWidth / fRefHeight;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;

          if (imgAspect > frameAspect) {
            sw = img.height * frameAspect;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / frameAspect;
            sy = (img.height - sh) / 2;
          }

          tempCtx.drawImage(img, sx, sy, sw, sh, fx, fy, fRefWidth, fRefHeight);
        } else {
          tempCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          tempCtx.fillRect(fx, fy, fRefWidth, fRefHeight);
          tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          tempCtx.lineWidth = 1;
          tempCtx.strokeRect(fx, fy, fRefWidth, fRefHeight);
        }

        if (layoutStyle === 'CIRCLE') {
          tempCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          tempCtx.lineWidth = 1.5;
          const r = Math.min(fRefWidth, fRefHeight) / 2;
          tempCtx.beginPath();
          tempCtx.arc(fx + fRefWidth / 2, fy + fRefHeight / 2, r, 0, Math.PI * 2);
          tempCtx.stroke();
        }

        tempCtx.restore();
      });

      // 形状最優先のクリッピングマスクを適用
      tempCtx.globalCompositeOperation = 'destination-in';
      const pathValue = selectedShape.id === 'shape_preset' ? selectedSubShape.svgPath : undefined;
      
      tempCtx.save();
      tempCtx.translate(pad, pad);
      tempCtx.scale(drawWidth / 100, drawHeight / 100);
      tempCtx.fillStyle = '#000000'; // マスク用の不透明色

      if (selectedShape.id === 'japanese_text' || !pathValue) {
        const textToDraw = customText || 'LOVE';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        
        // linesの分割
        let lines: string[] = [];
        if (textToDraw.includes(' ')) {
          lines = textToDraw.split(' ').filter(Boolean);
        } else if (textToDraw.length <= 4) {
          lines = [textToDraw];
        } else if (textToDraw.length <= 7) {
          const mid = Math.ceil(textToDraw.length / 2);
          lines = [textToDraw.slice(0, mid), textToDraw.slice(mid)];
        } else {
          const mid1 = Math.ceil(textToDraw.length / 3);
          const mid2 = Math.ceil((textToDraw.length * 2) / 3);
          if (textToDraw.length >= 9) {
            lines = [textToDraw.slice(0, mid1), textToDraw.slice(mid1, mid2), textToDraw.slice(mid2)];
          } else {
            const midHalf = Math.ceil(textToDraw.length / 2);
            lines = [textToDraw.slice(0, midHalf), textToDraw.slice(midHalf)];
          }
        }

        const fontFamily = 'Inter, "Mplus 1p", "Hiragino Kaku Gothic Pro", "Noto Sans JP", sans-serif';
        let finalFontSize = 95;

        for (let sizeTest = 95; sizeTest >= 11; sizeTest--) {
          tempCtx.font = `bold ${sizeTest}px ${fontFamily}`;
          let currentWidth = 0;
          for (const line of lines) {
            const w = tempCtx.measureText(line).width;
            if (w > currentWidth) currentWidth = w;
          }
          
          const totalHeight = lines.length * sizeTest * 1.05;
          if (currentWidth <= 92 && totalHeight <= 92) {
            finalFontSize = sizeTest;
            break;
          }
          finalFontSize = sizeTest;
        }

        tempCtx.font = `bold ${finalFontSize}px ${fontFamily}`;
        const totalHeight = lines.length * finalFontSize * 1.05;
        const startY = (100 - totalHeight) / 2 + (finalFontSize / 2) + (finalFontSize * 0.05);
        
        lines.forEach((line, idx) => {
          const y = startY + idx * finalFontSize * 1.05;
          tempCtx.fillText(line, 50, y);
        });
      } else {
        try {
          const p = new Path2D(pathValue);
          tempCtx.fill(p);
        } catch (e) {
          // フォールバック
          tempCtx.beginPath();
          if (selectedShape.id === 'heart') {
            tempCtx.arc(30, 35, 25, 0, Math.PI * 2);
            tempCtx.arc(70, 35, 25, 0, Math.PI * 2);
            tempCtx.moveTo(5, 50);
            tempCtx.lineTo(50, 95);
            tempCtx.lineTo(95, 50);
            tempCtx.fill();
          } else {
            tempCtx.fillRect(15, 15, 70, 70);
          }
        }
      }
      tempCtx.restore();

      // メインキャンバスに重ねて描画します
      ctx.drawImage(tempCanvas, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `mosaic-photo-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      triggerSuccessToast("📸 完成した高品質なモザイクフォトをPNG画像として書き出しました！");
      checkAndIncrementUsage();
    } catch (err) {
      console.error(err);
      triggerSuccessToast("❌ 画像の出力中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // 進捗状況
  const filledCount = frames.filter(f => f.imageUrl !== null).length;
  const progressPercent = frames.length > 0 ? Math.round((filledCount / frames.length) * 100) : 0;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden" id="sleek-app-root">
      
      {/* 1. Canva App Header (Sleek Theme) */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10" id="m-header">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-xs bg-slate-50" id="logo-badge">
            {!logoFailed ? (
              <img
                src="/photo-art-logo.ico"
                alt="フォトアート"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => {
                  console.log("Failed to load /photo-art-logo.ico, falling back to SVG");
                  setLogoFailed(true);
                }}
              />
            ) : (
              <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="photoart-bg" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="40%" stopColor="#a855f7" />
                    <stop offset="70%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="photoart-metal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="50%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>
                  <radialGradient id="photoart-lens-inner" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="35%" stopColor="#f97316" />
                    <stop offset="75%" stopColor="#7c2d12" />
                    <stop offset="100%" stopColor="#1c1917" />
                  </radialGradient>
                  <linearGradient id="photoart-heart" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff007f" />
                    <stop offset="60%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                  <pattern id="mosaic-pat-main" width="24" height="24" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="11" height="11" fill="#fbcfe8" opacity="0.95" rx="1" />
                    <rect x="12" y="0" width="11" height="11" fill="#bfdbfe" opacity="0.9" rx="1" />
                    <rect x="0" y="12" width="11" height="11" fill="#fed7aa" opacity="0.95" rx="1" />
                    <rect x="12" y="12" width="11" height="11" fill="#bbf7d0" opacity="0.85" rx="1" />
                    <rect x="2" y="2" width="7" height="7" fill="#ec4899" opacity="0.2" />
                    <rect x="14" y="2" width="7" height="7" fill="#3b82f6" opacity="0.2" />
                    <rect x="2" y="14" width="7" height="7" fill="#f97316" opacity="0.2" />
                    <rect x="14" y="14" width="7" height="7" fill="#10b981" opacity="0.2" />
                  </pattern>
                  <pattern id="heart-mosaic-pat-main" width="8" height="8" patternUnits="userSpaceOnUse">
                    <rect width="3.8" height="3.8" fill="#fda4af" opacity="0.9" />
                    <rect x="4" width="3.8" height="3.8" fill="#fecdd3" opacity="0.85" />
                    <rect y="4" width="3.8" height="3.8" fill="#f43f5e" opacity="0.9" />
                    <rect x="4" y="4" width="3.8" height="3.8" fill="#fb7185" opacity="0.8" />
                  </pattern>
                </defs>
                <rect width="200" height="200" rx="44" fill="url(#photoart-bg)" />
                <rect x="45" y="48" width="18" height="14" rx="2" fill="url(#photoart-metal)" stroke="#475569" strokeWidth="0.8" />
                <rect x="75" y="43" width="34" height="19" rx="3" fill="url(#photoart-metal)" stroke="#475569" strokeWidth="0.8" />
                <rect x="135" y="45" width="22" height="17" rx="2" fill="url(#photoart-metal)" stroke="#475569" strokeWidth="0.8" />
                <line x1="50" y1="48" x2="50" y2="54" stroke="#475569" strokeWidth="1.2" />
                <line x1="54" y1="48" x2="54" y2="54" stroke="#475569" strokeWidth="1.2" />
                <line x1="58" y1="48" x2="58" y2="54" stroke="#475569" strokeWidth="1.2" />
                <line x1="82" y1="43" x2="82" y2="52" stroke="#475569" strokeWidth="1.5" />
                <line x1="87" y1="43" x2="87" y2="52" stroke="#475569" strokeWidth="1.5" />
                <line x1="92" y1="43" x2="92" y2="52" stroke="#475569" strokeWidth="1.5" />
                <line x1="97" y1="43" x2="97" y2="52" stroke="#475569" strokeWidth="1.5" />
                <line x1="102" y1="43" x2="102" y2="52" stroke="#475569" strokeWidth="1.5" />
                <line x1="140" y1="45" x2="140" y2="52" stroke="#475569" strokeWidth="1.2" />
                <line x1="146" y1="45" x2="146" y2="52" stroke="#475569" strokeWidth="1.2" />
                <line x1="152" y1="45" x2="152" y2="52" stroke="#475569" strokeWidth="1.2" />
                <rect x="28" y="62" width="144" height="98" rx="22" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
                <rect x="31" y="65" width="138" height="92" rx="19" fill="url(#mosaic-pat-main)" />
                <circle cx="100" cy="111" r="39" fill="url(#photoart-metal)" stroke="#64748b" strokeWidth="1.5" />
                <circle cx="100" cy="111" r="34" fill="none" stroke="white" strokeDasharray="4 4" strokeWidth="2" opacity="0.5" />
                <circle cx="100" cy="111" r="31" fill="url(#photoart-lens-inner)" stroke="#1c1917" strokeWidth="1.5" />
                <circle cx="92" cy="103" r="24" fill="none" stroke="white" strokeDasharray="15 120" strokeWidth="2" opacity="0.35" transform="rotate(-30 100 111)" />
                <path d="M 100 97 C 97 90, 84 90, 82 101 C 80 110, 91 118, 100 127 C 109 118, 120 110, 118 101 C 116 90, 103 90, 100 97 Z" fill="url(#photoart-heart)" />
                <path d="M 100 97 C 97 90, 84 90, 82 101 C 80 110, 91 118, 100 127 C 109 118, 120 110, 118 101 C 116 90, 103 90, 100 97 Z" fill="url(#heart-mosaic-pat-main)" opacity="0.6" />
                <path d="M 100 97 C 97 90, 84 90, 82 101 C 80 110, 91 118, 100 127 C 109 118, 120 110, 118 101 C 116 90, 103 90, 100 97 Z" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" strokeDasharray="2 2" />
                <rect x="40" y="72" width="22" height="15" rx="3" fill="#475569" opacity="0.2" />
                <circle cx="148" cy="79" r="6" fill="#334155" />
                <circle cx="148" cy="79" r="3" fill="#0f172a" />
                <circle cx="149" cy="78" r="1.5" fill="white" opacity="0.6" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                {t('title')}
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  backendStatus === 'connected' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : backendStatus === 'connecting'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    backendStatus === 'connected' 
                      ? 'bg-emerald-500' 
                      : backendStatus === 'connecting'
                      ? 'bg-amber-500' 
                      : 'bg-rose-500'
                  }`} />
                  {backendStatus === 'connected' ? 'Express API ON' : backendStatus === 'connecting' ? 'API Connecting...' : 'API Offline'}
                </span>
              </h1>
              <div className="relative inline-flex items-center gap-2" id="g20-lang-selector-container">
                <select
                  value={appLang}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setAppLang(newLang);
                    const langObj = G20_LANGUAGES.find(l => l.code === newLang);
                    if (langObj) {
                      setCustomText(langObj.word);
                      triggerSuccessToast(t('toast_lang_changed', { '$lang': `${langObj.flag} ${langObj.name}`, '$word': langObj.word }, newLang));
                    }
                  }}
                  className="bg-indigo-50/60 hover:bg-indigo-100/80 active:bg-indigo-100 border border-indigo-200/80 focus:border-indigo-550 focus:border-indigo-500 rounded px-1.5 py-0.5 text-[10.5px] font-bold text-indigo-700 outline-none transition-all shadow-xs cursor-pointer flex items-center"
                  id="g20-lang-select"
                >
                  {G20_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-white text-slate-800">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                
                {/* 無料デモ版お試し制限バッジ */}
                <div 
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold border transition-all ${
                    usageCount >= 10
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                  }`}
                  id="trial-usage-badge"
                  title={t('usage_limit')}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${usageCount >= 10 ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                  <span>{t('trial_badge', { '$count': usageCount.toString() })}</span>
                </div>

                <button
                  onClick={() => setIsTutorialOpen(prev => !prev)}
                  className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 rounded font-bold text-[10.5px] shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  title="使い方の説明チュートリアルを展開・非表示切り替え"
                  id="tutorial-toggle-btn"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-white" />
                  {t('tutorial')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. メインレイアウト */}
      <div className="flex flex-col flex-1 overflow-hidden" id="workspace-container">
        
        {/* スマートにスライド展開するチュートリアル（処理ガイド） */}
        <AnimatePresence>
          {isTutorialOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="bg-indigo-50 border-b border-indigo-150 p-4 shrink-0 font-sans shadow-inner z-30"
              id="tutorial-dropdown"
            >
              <div className="max-w-3xl mx-auto flex gap-4 text-xs text-slate-700 relative">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg shrink-0">
                  💡
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {t('tutorial_guide')}
                    </span>
                    <button
                      onClick={() => setIsTutorialOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer px-1.5 focus:outline-none"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* 横並びのステップガイド (レスポンシブ：スマホでは縦、PCでは横) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-800 font-bold">
                        <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-mono">1</span>
                        {t('tut_step_1_title')}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        {t('tut_step_1_desc')}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-800 font-bold">
                        <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-mono">2</span>
                        {t('tut_step_2_title')}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        {t('tut_step_2_desc')}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-800 font-bold">
                        <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-mono">3</span>
                        {t('tut_step_3_title')}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        {t('tut_step_3_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 下部：スリーク・コントロールエリア (Sleek Bottom Controls) */}
        <aside className="h-[275px] md:h-[300px] bg-white border-t border-slate-200 flex flex-col shrink-0 order-2 z-20 shadow-md" id="panel-sidebar">
          
          {/* タブメニュー */}
          <div className="flex border-b border-slate-200 text-xs font-semibold bg-slate-50 select-none bg-white">
            {[
              { id: 'template', label: t('tab_shape'), icon: Layers },
              { id: 'layout', label: t('tab_layout'), icon: Grid },
              { id: 'photo', label: t('tab_photo'), icon: ImageIcon }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-1.5 px-1 text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
                    activeTab === tab.id 
                      ? 'border-indigo-600 text-indigo-600 bg-white font-bold' 
                      : 'border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                  id={`tab-btn-${tab.id}`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[9.5px] tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* サイドバーコンテンツ */}
          <div className="flex-1 overflow-y-auto p-2 md:p-2.5 space-y-3">
            
            {/* 動的ステータス/通知トースト (インサイドバー) */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs flex gap-2"
                  id="success-toast"
                >
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-medium leading-normal">{successMessage}</span>
                </motion.div>
              )}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs flex gap-2"
                  id="error-toast"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 各タブのフォーム実装 */}
            {activeTab === 'template' && (
              <div className="space-y-4" id="tab-content-template">
                <div className="hidden sm:block">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t('shape_main_title')}</h3>
                  <p className="text-[10px] text-slate-500">
                    {t('shape_main_desc')}
                  </p>
                </div>

                {/* ベース形状の大枠選択（個別の8つの型ボタン ＋ テキストボタン） */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {t('shape_preset_label')}
                  </label>
                  <div className="grid grid-cols-3 gap-2" id="shapes-presets-grid">
                    {/* 8つの個別型ボタン */}
                    {SHAPE_SUB_PRESETS.map((sub) => {
                      const isSelected = selectedShape.id === 'shape_preset' && selectedSubShape.id === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            const shapePreset = PRESET_SHAPES.find(s => s.id === 'shape_preset');
                            if (shapePreset) {
                              setSelectedShape(shapePreset);
                            }
                            setSelectedSubShape(sub);
                            setErrorMessage(null);
                          }}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[72px] relative overflow-hidden group cursor-pointer ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-50/60 text-indigo-700 shadow-sm font-semibold ring-2 ring-indigo-500/10' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                          }`}
                          id={`shape-btn-${sub.id}`}
                        >
                          <span className="text-xl group-hover:scale-110 transition-transform duration-200" aria-hidden="true">{sub.icon}</span>
                          <span className="text-[10px] font-bold text-slate-800 tracking-wide block truncate w-full">
                            {t('shape_' + sub.id) || sub.name}
                          </span>
                        </button>
                      );
                    })}

                    {/* 9番目のテキストボタン */}
                    {(() => {
                      const textShape = PRESET_SHAPES.find(s => s.id === 'custom_text');
                      if (!textShape) return null;
                      const isSelected = selectedShape.id === 'custom_text';
                      return (
                        <button
                          onClick={() => {
                            setSelectedShape(textShape);
                            setErrorMessage(null);
                          }}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[72px] relative overflow-hidden group cursor-pointer ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-50/60 text-indigo-700 shadow-sm font-bold ring-2 ring-indigo-500/10' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                          }`}
                          id="shape-btn-custom_text"
                        >
                          <span className="text-xl group-hover:scale-110 transition-transform duration-200" aria-hidden="true">✍️</span>
                          <span className="text-[10px] font-bold text-slate-800 tracking-wide block truncate w-full">
                            {t('custom_text')}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* カスタムテキスト入力（大きく表示） */}
                {selectedShape.id === 'custom_text' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                    id="custom-text-panel"
                  >
                    <div className="flex items-center gap-2 text-indigo-600 justify-between">
                      <div className="flex items-center gap-1.5">
                        <Type className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('shape_text_label')}</span>
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[8.5px] px-1.5 py-0.5 rounded leading-none scale-95 select-none text-right">
                        {appLang === 'ja' ? '最大10文字制限 (日本語・英数字)' : 'Max 10 characters'}
                      </span>
                    </div>
                    
                    <div className="w-full">
                      <input
                        type="text"
                        maxLength={10}
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="LOVE"
                        className="w-full h-14 bg-white border-2 border-indigo-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2 text-slate-900 font-black text-2xl tracking-widest text-center outline-none transition-all shadow-md focus:shadow-indigo-100/50"
                        id="input-japanese-character"
                      />
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setActiveTab('layout')}
                    className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold transition-all inline-flex items-center gap-0.5 shadow-sm cursor-pointer"
                  >
                    {t('tab_layout')}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-2.5" id="tab-content-layout">
                <div className="hidden sm:block">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t('layout_main_title')}</h3>
                </div>

                {/* レイアウトタイプ一覧 */}
                <div className="grid grid-cols-2 gap-2" id="layout-styles-list">
                  {[
                    { 
                      id: 'GRID', 
                      title: t('algo_grid_p_title'), 
                      desc: t('algo_grid_p_desc'),
                      badge: t('badge_standard') 
                    },
                    { 
                      id: 'OFFS_BRICK', 
                      title: t('algo_brick_p_title'), 
                      desc: t('algo_brick_p_desc'),
                      badge: t('badge_popular') 
                    }
                  ].map((opt) => {
                    const isSelected = layoutStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setLayoutStyle(opt.id as LayoutStyle)}
                        className={`w-full p-1.5 rounded-md border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/60 font-semibold ring-1 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:bg-slate-50'
                        }`}
                        id={`layout-algo-${opt.id}`}
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] font-bold text-slate-900 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                            {opt.title}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 truncate leading-tight pl-2.5">
                           {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* 分割密度の調整 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 shadow-xs">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="text-slate-800">{t('layout_density')}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={density}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr === '') {
                            setDensity('');
                          } else {
                            const val = Number(valStr);
                            if (!isNaN(val)) {
                              setDensity(val);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!val || val < 10) setDensity(10);
                          if (val > 200) setDensity(200);
                        }}
                        className="w-14 text-center px-1.5 py-0.5 text-xs text-indigo-750 bg-white border border-indigo-200 rounded font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-505 focus:ring-indigo-500"
                      />
                      <strong className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-[11px] font-mono leading-none">
                        {density <= 20 ? t('density_coarse') : 
                         density <= 60 ? t('density_medium') : 
                         density <= 130 ? t('density_fine') : 
                         t('density_exfine')}
                      </strong>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 select-none font-sans">{t('density_coarse')}</span>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="1"
                      value={density}
                      onChange={(e) => setDensity(Number(e.target.value))}
                      className="flex-1 h-2.5 bg-slate-200 hover:bg-slate-350 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-750 transition-all"
                      style={{ height: '8px' }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 select-none font-sans">{t('density_fine')}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 text-right leading-tight select-none">
                    {t('density_desc_1')}
                  </p>
                </div>

                {/* 画像間の隙間（ガーター）調整 */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 shadow-xs" id="layout-spacing-panel">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="text-slate-800">{t('layout_gap_label')}</span>
                    <strong className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-[11px] font-mono leading-none">
                      {frameGap === 0 ? t('gap_zero') : `${frameGap.toFixed(1)}%`}
                    </strong>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 select-none font-sans">{t('gap_zero')}</span>
                    <input
                      type="range"
                      min="0"
                      max="3.5"
                      step="0.1"
                      value={frameGap}
                      onChange={(e) => setFrameGap(Number(e.target.value))}
                      className="flex-1 h-2.5 bg-slate-200 hover:bg-slate-350 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-750 transition-all"
                      style={{ height: '8px' }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 select-none font-sans">{t('gap_wide')}</span>
                  </div>
                  <p className="text-[9px] text-slate-450 leading-tight select-none">
                    {t('layout_gap_desc')}
                  </p>
                </div>

                <div className="flex justify-end pt-0.5">
                  <button
                    onClick={() => setActiveTab('photo')}
                    className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold transition-all inline-flex items-center gap-0.5 shadow-sm"
                  >
                    {t('tab_photo')}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'photo' && (
              <div className="space-y-2.5" id="tab-content-photo">
                {/* 一括制御ロジックのUI */}
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-2.5" id="bulk-controls">
                  <div className="flex gap-2">
                    <button
                      onClick={handleAutoFill}
                      className="flex-1 py-1 px-2 bg-slate-800 text-white hover:bg-slate-700 transition-colors rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                      title="空白フレームにプール画像を順次一括配置"
                    >
                      <ImageIcon className="w-3 h-3 text-indigo-300" />
                      {t('btn_insert')}
                    </button>

                    <button
                      onClick={handleShuffleAssignedPhotos}
                      className="flex-1 py-1 px-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      title="配置済みの写真をシャッフル入れ替え"
                    >
                      <Shuffle className="w-3 h-3 text-indigo-150" />
                      {t('btn_shuffle')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200">
                    <button
                      onClick={handleClearPhotos}
                      className="py-0.5 px-1.5 bg-white border border-red-200 text-red-650 hover:bg-red-50 hover:text-red-700 text-[9.5px] font-semibold rounded cursor-pointer"
                    >
                      {t('btn_clear')}
                    </button>
                    <div className="text-[10px] text-slate-500">
                      {t('progress')} <strong className="text-slate-800">{filledCount} / {frames.length} ({progressPercent}%)</strong>
                    </div>
                  </div>

                  {/* 統合型ローカル・インポート ターゲット & ドラッグ＆ドロップ エリア */}
                  <div 
                    onDragOver={handlePoolDragOver}
                    onDragLeave={handlePoolDragLeave}
                    onDrop={handlePoolDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 select-none ${
                      isDraggingOverPool 
                        ? 'border-indigo-600 bg-indigo-50/50 scale-[0.98]' 
                        : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/15 hover:bg-indigo-50/25'
                    }`}
                    title="パソコンから写真ファイルをドラッグするか、クリックして選択"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto shadow-sm">
                        <Upload className={`w-5 h-5 text-indigo-650 ${isDraggingOverPool ? 'animate-bounce' : 'animate-pulse'}`} />
                      </div>
                      <div>
                        <span className="text-[12px] text-indigo-950 font-extrabold block">
                          PC・スマホから写真を追加
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          ドラッグ＆ドロップ、またはファイル選択
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-indigo-100/50 pt-2.5 mt-2.5">
                      <p className="text-[9px] text-slate-500 font-medium leading-relaxed text-left">
                        ※スマホから実行した場合、端末内のGoogleフォト等のアプリからも写真を選択できます。<br />
                        ※複数枚の写真（数十〜数百枚）を一度に一括インポートできます。
                      </p>
                    </div>
                  </div>

                  {/* 素材プールのサムネイル一覧プレビュー表示 */}
                  {currentPool && currentPool.length > 0 && (
                    <div className="bg-slate-100 border border-slate-205 p-2 rounded-xl space-y-1.5 mt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-650 px-0.5 select-none">
                        <span>素材プール ({currentPool.length}枚)</span>
                        <span className="text-[8.5px] text-slate-450 font-normal">※個別に削除可能</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 max-h-[140px] overflow-y-auto p-1 bg-white rounded-lg border border-slate-205 select-none">
                        {currentPool.map((url, idx) => (
                          <div key={url + '-' + idx} className="relative aspect-square rounded overflow-hidden border border-slate-150 group bg-slate-50">
                            <img src={url} className="w-full h-full object-cover" loading="lazy" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = [...currentPool];
                                updated.splice(idx, 1);
                                setCurrentPool(updated);
                              }}
                              className="absolute top-0.5 right-0.5 bg-red-650 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold text-[8.5px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-750 shadow-xs"
                              title="この写真をプールから削除"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}




          </div>

          <div className="p-3 border-t border-slate-200 shrink-0 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <button 
              onClick={handleExportPNG}
              disabled={isLoading}
              className="w-full sm:w-auto py-2 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-bold text-xs shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              id="export-png-btn"
              title="完成したモザイクフォトをPNG画像としてダウンロード"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              {t('btn_download_png')}
            </button>


          </div>
        </aside>

        {/* 上部：Canva エディタ・シミュレートキャンバス (Sleek Preview Area) */}
        <main className="flex-1 bg-slate-100 p-6 md:p-8 flex flex-col items-center justify-between overflow-y-auto order-1 relative" id="main-editor-canvas">
          
          {/* ドットの装飾パターンバックドロップ */}
          <div className="absolute inset-x-0 top-0 h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          {/* クイックツールバー */}
          <div className="w-full max-w-2xl bg-white rounded-xl px-3 py-2 border border-slate-200 flex flex-wrap justify-between items-center gap-3.5 shadow-xs relative z-10" id="canvas-toolbar">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium font-bold text-slate-600">{t('zoom')}</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                  className="p-0.5 px-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
                  title="ズームアウト"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="text-[10.5px] font-mono text-slate-700 w-8 text-center">
                  {zoomLevel}%
                </span>
                <button 
                  onClick={() => setZoomLevel(prev => Math.min(150, prev + 25))}
                  className="p-0.5 px-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
                  title="ズームイン"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* キャンバス背景 (HSLスライダーのみ) */}
            <div className="flex items-center gap-3 shrink-0 border-l border-r border-slate-150 px-3 py-0.5" id="canvas-bg-controls">
              {/* HSL自由調整スライダー */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold select-none leading-none">
                  <span className="text-slate-600 font-bold select-none h-3">{t('color_tune')}</span>
                  <span className="font-mono text-[8.5px] text-indigo-650 bg-indigo-50/70 p-0.5 px-1 rounded font-bold">
                    {bgHue === 0 && bgSat === 0 && bgLight === 100 ? '#FFFFFF' : `HSL(${bgHue},${bgSat}%,${bgLight}%)`}
                  </span>
                </div>
                <div className="space-y-0.5 w-[145px]" id="hsl-sliders-group">
                  {/* Hue Slider */}
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-slate-400 w-2.5 font-bold select-none">{t('color_hue')}</span>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={bgHue}
                      onChange={(e) => setBgHue(Number(e.target.value))}
                      className="flex-1 h-1 rounded-sm appearance-none cursor-pointer accent-slate-600"
                      style={{
                        background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                      }}
                      title="色相 (Hue)"
                    />
                  </div>
                  {/* Saturation Slider */}
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-slate-400 w-2.5 font-bold select-none">{t('color_sat')}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgSat}
                      onChange={(e) => setBgSat(Number(e.target.value))}
                      className="flex-1 h-1 rounded-sm appearance-none cursor-pointer accent-indigo-500"
                      style={{
                        background: `linear-gradient(to right, #808080, hsl(${bgHue}, 100%, 50%))`
                      }}
                      title="彩度 (Saturation)"
                    />
                  </div>
                  {/* Lightness Slider */}
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-slate-400 w-2.5 font-bold select-none">{t('color_light')}</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={bgLight}
                      onChange={(e) => setBgLight(Number(e.target.value))}
                      className="flex-1 h-1 rounded-sm appearance-none cursor-pointer accent-indigo-500"
                      style={{
                        background: `linear-gradient(to right, #151515, hsl(${bgHue}, ${bgSat}%, 50%), #ffffff)`
                      }}
                      title="明度 (Lightness)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* キャンバス画角（アスペクト比） */}
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium font-bold text-slate-600">{t('aspect_label')}</span>
                <div className="flex gap-0.5" id="aspect-ratio-selector-group">
                  {[
                    { id: '1:1', label: '1:1' },
                    { id: '3:4', label: '3:4' },
                    { id: '4:3', label: '4:3' },
                    { id: '16:9', label: '16:9' },
                    { id: '9:16', label: '9:16' },
                    { id: 'custom', label: 'カスタム' }
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setCanvasAspectRatio(ratio.id as any)}
                      className={`px-1.5 py-0.5 text-[9.5px] rounded transition-all font-bold border cursor-pointer ${
                        canvasAspectRatio === ratio.id 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>
              {canvasAspectRatio === 'custom' && (
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200">
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Math.max(100, Math.min(8000, Number(e.target.value) || 1200)))}
                    className="w-14 px-1 py-0.5 text-[10px] border rounded bg-white font-mono text-center"
                    placeholder="幅(px)"
                  />
                  <span className="text-[9px] text-slate-400">×</span>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Math.max(100, Math.min(8000, Number(e.target.value) || 1200)))}
                    className="w-14 px-1 py-0.5 text-[10px] border rounded bg-white font-mono text-center"
                    placeholder="高さ(px)"
                  />
                  <span className="text-[9px] text-slate-400">px</span>
                </div>
              )}
            </div>

            {/* 補助境界線のトグラー */}
            <div className="flex items-center gap-1.5 font-bold">
              <input
                type="checkbox"
                id="toggle-coords"
                checked={showCoordinates}
                onChange={(e) => setShowCoordinates(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="toggle-coords" className="text-[10.5px] text-slate-600 cursor-pointer select-none font-medium">
                {t('coordinates_label')}
              </label>
            </div>
          </div>

          {/* Canva キャンバスビューポート */}
          <div className="w-full max-w-2xl flex items-center justify-center p-3 relative z-10" id="canvas-workspace">
            {isLoading && (
              <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 z-30" id="canvas-loader">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-semibold text-indigo-600">{t('loading_contour')}</span>
              </div>
            )}

            {/* シミュレートされたCanvaドキュメント (800px四方が最大、ズーム機能) */}
            <div 
              style={{ 
                transform: `scale(${zoomLevel / 100})`, 
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                backgroundColor: canvasBg,
                aspectRatio: canvasAspectRatio === 'custom'
                  ? `${customWidth}/${customHeight}`
                  : canvasAspectRatio === '1:1' ? '1' : canvasAspectRatio === '3:4' ? '3/4' : canvasAspectRatio === '4:3' ? '4/3' : canvasAspectRatio === '9:16' ? '9/16' : '16/9'
              }}
              className="w-full rounded shadow-xl overflow-hidden relative transition-all duration-300 border border-slate-200"
              id="canva-document-viewport"
            >
              
              {/* シルエット背景マスクの半透明ウォーターマーク */}
              <div className="absolute inset-x-2 inset-y-2 flex items-center justify-center opacity-[0.08] select-none pointer-events-none" id="silhouette-backdrop">
                {selectedShape.id === 'shape_preset' ? (
                  selectedSubShape.svgPath && (
                    <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] fill-current text-indigo-600">
                      <path d={selectedSubShape.svgPath} />
                    </svg>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-center w-full max-w-[90%] leading-tight select-none">
                    {getSplitLines(customText || 'LOVE').map((line, idx) => {
                      // Adjust font sizing class based on lines length and line text character count
                      const linesCount = getSplitLines(customText || 'LOVE').length;
                      let fontStyle = {};
                      
                      if (linesCount === 1) {
                        const len = line.length;
                        const fs = len <= 1 ? '180px' : len <= 2 ? '130px' : len <= 3 ? '95px' : '75px';
                        fontStyle = { fontSize: fs };
                      } else if (linesCount === 2) {
                        const len = line.length;
                        const fs = len <= 2 ? '85px' : len <= 3 ? '70px' : '55px';
                        fontStyle = { fontSize: fs };
                      } else {
                        fontStyle = { fontSize: '42px' };
                      }

                      return (
                        <span 
                          key={idx} 
                          style={fontStyle}
                          className="font-sans font-black tracking-normal leading-[1.05] block text-center text-indigo-600 select-none whitespace-nowrap overflow-visible"
                        >
                          {line}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* キャンバス用ルーラー表記 */}
              <div className="absolute top-3 left-4 text-[9px] font-mono text-slate-400 select-none pointer-events-none">
                Canvasドキュメントサイズ: {
                  canvasAspectRatio === 'custom' ? `${customWidth}px × ${customHeight}px (カスタム)` :
                  canvasAspectRatio === '1:1' ? '800px × 800px (1:1)' :
                  canvasAspectRatio === '3:4' ? '800px × 1066px (3:4)' :
                  canvasAspectRatio === '4:3' ? '800px × 600px (4:3)' :
                  canvasAspectRatio === '9:16' ? '450px × 800px (9:16)' :
                  '800px × 450px (16:9)'
                }
              </div>
              <div className="absolute right-4 bottom-3 text-[9px] font-mono text-slate-400 select-none pointer-events-none">
                全体輪郭: {
                  selectedShape.id === 'shape_preset' 
                    ? selectedSubShape.name 
                    : `テキスト「${customText || 'LOVE'}」`
                } ({layoutStyle})
              </div>

              {/* フォトフレームをマッピング配置：絶対パーセント座標で全描画 */}
              {frames.length === 0 ? (
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 text-center text-slate-400 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">
                    境界内に有効な配置領域が見つかりませんでした。<br />
                    別のレイアウトを選択するか、文字を変更してください。
                  </p>
                </div>
              ) : (
                <div className="absolute inset-0 p-[32px]" id="frames-relative-container">
                  <div 
                    className="w-full h-full relative"
                    style={{
                      maskImage: maskUrl ? `url(${maskUrl})` : 'none',
                      maskSize: '100% 100%',
                      maskRepeat: 'no-repeat',
                      WebkitMaskImage: maskUrl ? `url(${maskUrl})` : 'none',
                      WebkitMaskSize: '100% 100%',
                      WebkitMaskRepeat: 'no-repeat',
                    }}
                  >
                    {frames.map((frame) => {
                      const hasImage = frame.imageUrl !== null;
                      const isHovered = hoveredFrameId === frame.id;
                      const isSelected = selectedFrameId === frame.id;
                      
                      return (
                        <div
                          key={frame.id}
                          onDragOver={(e) => handleFrameDragOver(e, frame.id)}
                          onDragLeave={() => setHoveredFrameId(null)}
                          onDrop={(e) => handleFrameDrop(e, frame.id)}
                          onClick={() => handleFrameClick(frame.id)}
                          style={{
                            left: `${frame.x}%`,
                            top: `${frame.y}%`,
                            width: `${frame.width}%`,
                            height: `${frame.height}%`,
                          }}
                          className={`absolute overflow-hidden cursor-crosshair group transition-all border ${
                            layoutStyle === 'CIRCLE' ? 'rounded-full aspect-square' : 'rounded-[1.5px]'
                          } ${
                            isSelected
                              ? 'ring-2 ring-indigo-500 ring-offset-1 z-20 border-indigo-500'
                              : isHovered
                                ? 'border-indigo-400 bg-indigo-50/20 z-10 scale-[1.02]'
                                : showCoordinates
                                  ? 'border-indigo-300/45 bg-amber-500/5'
                                  : 'border-slate-300/60 bg-slate-500/5 hover:border-indigo-400 hover:scale-[1.01]'
                          }`}
                        >
                          {/* 各フレーム画像 */}
                          {hasImage ? (
                            <img 
                              src={frame.imageUrl!} 
                              alt="" 
                              className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                                layoutStyle === 'CIRCLE' ? 'rounded-full' : ''
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center text-[8px] text-slate-400 bg-slate-100/30 ${
                              layoutStyle === 'CIRCLE' ? 'rounded-full' : ''
                            }`}>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[8px] text-indigo-600">
                                ドロップ
                              </span>
                            </div>
                          )}

                          {/* 座標や個別の情報ラベルを表示 */}
                          {showCoordinates && (
                            <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white font-mono text-[7px] px-0.5 rounded leading-none scale-75 select-none pointer-events-none">
                              x:{Math.round(frame.x)},y:{Math.round(frame.y)}
                            </div>
                          )}

                          {/* ホバー時オーバレイ */}
                          <div className={`absolute inset-0 bg-indigo-900/10 transition-opacity pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 ${
                            layoutStyle === 'CIRCLE' ? 'rounded-full' : ''
                          }`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* キャンバスバッジ表示 */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm flex items-center gap-1.5 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-slate-650 text-slate-700">レイアウトプレビュー</span>
              </div>
            </div>
          </div>



        </main>
      </div>

      {/* 5. お試し制限モーダルダイアログ */}
      <AnimatePresence>
        {isLimitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="limit-modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLimitModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              id="limit-modal-backdrop"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md w-full relative z-10 flex flex-col items-center text-center font-sans animate-fade-in"
              id="limit-modal-card"
            >
              {/* アイコン */}
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 text-2xl mb-4 shrink-0 shadow-xs animate-bounce" id="limit-modal-icon">
                ⚠️
              </div>

              {/* タイトル */}
              <h2 className="text-lg font-extrabold text-slate-900 mb-2 tracking-tight" id="limit-modal-title">
                {t('usage_limit_reached')}
              </h2>

              {/* 説明書き */}
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mb-6" id="limit-modal-desc">
                {t('usage_limit_reached_desc')}
              </p>

              {/* 進捗具合 */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden border border-slate-200/60" id="limit-modal-progress-bar">
                <div className="bg-rose-500 h-full w-full rounded-full" />
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col gap-2 w-full" id="limit-modal-actions">
                <a
                  href="mailto:contacts@example.com?subject=PhotoArt%20Full%20Version%20Inquiry"
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  id="limit-modal-contact-btn"
                >
                  {t('btn_contact')}
                </a>
                
                <button
                  onClick={handleResetTrial}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-205 hover:bg-slate-200 active:scale-[0.98] border border-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                  id="limit-modal-reset-btn"
                >
                  {t('btn_reset_trial')}
                </button>
              </div>

              {/* クローズボタン */}
              <button
                onClick={() => setIsLimitModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm p-1.5 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                title="閉じる"
                id="limit-modal-close-btn"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
