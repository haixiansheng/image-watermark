/* 图片加水印工具 —— 纯浏览器端 · 单张模式
 * 输入一张图 → 叠加文字或 Logo 水印 → 输出一张图。图片不上传，全部本地处理。
 *
 * 两种水印:
 *  - text  文字水印：内容 / 字号 / 颜色 / 透明度 / 旋转 / 位置 / 平铺 / 描边
 *  - image 图片水印：上传 Logo / 缩放 / 透明度 / 位置
 * 位置支持九宫格 + 平铺
 */
'use strict';

const $ = id => document.getElementById(id);

/* ---------- i18n ---------- */
const I18N = {
  zh: {
    pickImage: '请选择一张图片',
    pickLogo: '请选择一张 Logo 图片',
    done: '完成',
    original: '原图',
    result: '加水印后',
    download: '⬇ 下载图片',
    pickAnother: '换一张图片',
    failed: '处理失败，请重试',
    modeText: '文字水印',
    modeImage: '图片水印',
    textPlaceholder: '水印文字，如：© 你的名字',
    needText: '请输入水印文字',
    needLogo: '请先上传 Logo',
    defaultText: '© Your Name',
  },
  en: {
    pickImage: 'Please select an image',
    pickLogo: 'Please select a logo image',
    done: 'Done',
    original: 'Original',
    result: 'Watermarked',
    download: '⬇ Download image',
    pickAnother: 'Choose another image',
    failed: 'Failed — please try again',
    modeText: 'Text',
    modeImage: 'Logo image',
    textPlaceholder: 'Watermark text, e.g. © Your Name',
    needText: 'Please enter watermark text',
    needLogo: 'Please upload a logo first',
    defaultText: '© Your Name',
  },
};
const LANG = (document.documentElement.lang || 'zh').toLowerCase().startsWith('en') ? 'en' : 'zh';
const T = I18N[LANG];

const els = {
  dropZone: $('dropZone'), fileInput: $('fileInput'),
  uploadPanel: $('uploadPanel'), workPanel: $('workPanel'),
  canvas: $('canvas'),
  origSize: $('origSize'), resultSize: $('resultSize'),
  origDims: $('origDims'), resultDims: $('resultDims'),
  modeText: $('modeText'), modeImage: $('modeImage'),
  textPanel: $('textPanel'), imagePanel: $('imagePanel'),
  wmText: $('wmText'), fontSize: $('fontSize'), fontSizeVal: $('fontSizeVal'),
  color: $('color'), opacity: $('opacity'), opacityVal: $('opacityVal'),
  rotation: $('rotation'), rotationVal: $('rotationVal'),
  bold: $('bold'), outline: $('outline'),
  logoPick: $('logoPick'), logoInput: $('logoInput'), logoThumb: $('logoThumb'),
  logoName: $('logoName'),
  logoScale: $('logoScale'), logoScaleVal: $('logoScaleVal'),
  posGrid: $('posGrid'), posRow: $('posRow'),
  downloadBtn: $('downloadBtn'), resetBtn: $('resetBtn'), status: $('status'),
};

const state = {
  base: null,        // 原始 Image
  file: null,
  name: 'image',
  logo: null,
  mode: 'text',
  pos: 'bottom-right',
  tiled: false,
  busy: false,
  url: null,
};

const KB = 1024;
const fmtSize = b => b < KB ? `${b} B` : b < KB * KB ? `${(b / KB).toFixed(1)} KB` : `${(b / KB / KB).toFixed(2)} MB`;

/* ---------- 基础图导入 ---------- */
els.dropZone.addEventListener('click', () => els.fileInput.click());
els.dropZone.addEventListener('dragover', e => { e.preventDefault(); els.dropZone.classList.add('dragover'); });
els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dragover'));
els.dropZone.addEventListener('drop', e => {
  e.preventDefault(); els.dropZone.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});
els.fileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (f) handleFile(f);
});
document.addEventListener('paste', e => {
  const items = (e.clipboardData || {}).items || [];
  for (const it of items) {
    if (it.type && it.type.startsWith('image/')) {
      const f = it.getAsFile();
      if (f) { handleFile(f); e.preventDefault(); return; }
    }
  }
});

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) { alert(T.pickImage); return; }
  state.name = (file.name || 'image').replace(/\.[^.]+$/, '');
  state.file = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.base = img;
    els.canvas.width = img.naturalWidth;
    els.canvas.height = img.naturalHeight;
    els.origSize.textContent = fmtSize(file.size);
    els.origDims.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
    els.uploadPanel.classList.add('hidden');
    els.workPanel.classList.remove('hidden');
    render();
  };
  img.onerror = () => alert('图片加载失败 / Failed to load image');
  img.src = url;
}

/* ---------- Logo 导入 ---------- */
els.logoPick.addEventListener('click', () => els.logoInput.click());
els.logoInput.addEventListener('change', e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if (!f.type.startsWith('image/')) { alert(T.pickLogo); return; }
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    state.logo = img;
    els.logoThumb.src = url;
    els.logoThumb.classList.remove('hidden');
    els.logoName.textContent = f.name;
    render();
  };
  img.src = url;
});

/* ---------- 参数绑定 ---------- */
function bind(el, fn) {
  if (!el) return;
  ['input', 'change'].forEach(ev => el.addEventListener(ev, fn));
}
bind(els.wmText, render);
bind(els.fontSize, () => { els.fontSizeVal.textContent = els.fontSize.value; render(); });
bind(els.color, render);
bind(els.opacity, () => { els.opacityVal.textContent = els.opacity.value; render(); });
bind(els.rotation, () => { els.rotationVal.textContent = els.rotation.value; render(); });
bind(els.bold, render);
bind(els.outline, render);
bind(els.logoScale, () => { els.logoScaleVal.textContent = els.logoScale.value; render(); });

els.modeText.addEventListener('click', () => setMode('text'));
els.modeImage.addEventListener('click', () => setMode('image'));
function setMode(m) {
  state.mode = m;
  els.modeText.classList.toggle('active', m === 'text');
  els.modeImage.classList.toggle('active', m === 'image');
  els.textPanel.classList.toggle('hidden', m !== 'text');
  els.imagePanel.classList.toggle('hidden', m !== 'image');
  render();
}

/* 九宫格 + 平铺（事件挂在 posRow 上，平铺按钮是它的兄弟节点） */
els.posRow.addEventListener('click', e => {
  const btn = e.target.closest('[data-pos]');
  if (!btn) return;
  const p = btn.dataset.pos;
  state.tiled = (p === 'tile');
  if (!state.tiled) state.pos = p;
  [...els.posRow.querySelectorAll('[data-pos]')].forEach(b =>
    b.classList.toggle('active', b.dataset.pos === p));
  render();
});

els.resetBtn.addEventListener('click', () => {
  if (state.url) URL.revokeObjectURL(state.url);
  state.base = null; state.logo = null; state.file = null; state.url = null;
  els.fileInput.value = '';
  els.logoInput.value = '';
  els.logoThumb.classList.add('hidden');
  els.logoThumb.removeAttribute('src');
  els.logoName.textContent = '';
  els.workPanel.classList.add('hidden');
  els.uploadPanel.classList.remove('hidden');
  els.status.textContent = '';
});

/* ---------- 渲染水印 ---------- */
function render() {
  if (!state.base) return;
  const canvas = els.canvas;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.drawImage(state.base, 0, 0, W, H);

  const opacity = Math.max(1, parseInt(els.opacity.value, 10)) / 100;
  const rot = parseInt(els.rotation.value, 10) * Math.PI / 180;

  if (state.mode === 'text') {
    drawTextWatermark(ctx, W, H, opacity, rot);
  } else {
    drawLogoWatermark(ctx, W, H, opacity, rot);
  }

  // 输出
  canvas.toBlob(blob => {
    if (!blob) return;
    if (state.url) URL.revokeObjectURL(state.url);
    state.url = URL.createObjectURL(blob);
    els.resultSize.textContent = fmtSize(blob.size);
    els.resultDims.textContent = `${canvas.width}×${canvas.height}`;
    els.downloadBtn.href = state.url;
    els.downloadBtn.download = `${state.name}_watermark.jpg`;
    els.status.textContent = T.done;
  }, 'image/jpeg', 0.95);
}

function drawTextWatermark(ctx, W, H, opacity, rot) {
  const text = (els.wmText.value || '').trim();
  if (!text) { els.status.textContent = T.needText; return; }

  const pct = parseInt(els.fontSize.value, 10);
  const size = Math.max(8, Math.round(W * pct / 100));
  const bold = els.bold.checked ? 'bold ' : '';
  const family = '"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif';
  ctx.font = `${bold}${size}px ${family}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.globalAlpha = opacity;

  const outline = els.outline.checked;
  const color = els.color.value;
  const m = ctx.measureText(text);
  const tw = m.width;
  const th = size;
  const pad = Math.round(size * 0.6);

  if (state.tiled) {
    // 平铺：按对角线间距铺满整图
    const gapX = tw + pad * 3;
    const gapY = th + pad * 4;
    const diag = Math.sqrt(W * W + H * H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(rot);
    ctx.translate(-W / 2, -H / 2);
    for (let y = -diag; y < H + diag; y += gapY) {
      for (let x = -diag; x < W + diag; x += gapX) {
        paint(ctx, text, x, y, color, outline, size);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }

  const { ax, ay } = anchor(state.pos, W, H, tw, th, pad);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(rot);
  paint(ctx, text, 0, 0, color, outline, size);
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** 画一次文字（含描边） */
function paint(ctx, text, x, y, color, outline, size) {
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, Math.round(size * 0.12));
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawLogoWatermark(ctx, W, H, opacity, rot) {
  if (!state.logo) { els.status.textContent = T.needLogo; return; }
  const pct = parseInt(els.logoScale.value, 10);
  const targetW = Math.max(16, Math.round(W * pct / 100));
  const ratio = state.logo.naturalHeight / state.logo.naturalWidth;
  const targetH = Math.round(targetW * ratio);
  const pad = Math.round(Math.min(W, H) * 0.03);

  ctx.globalAlpha = opacity;

  if (state.tiled) {
    const gapX = targetW + pad * 2;
    const gapY = targetH + pad * 2;
    const diag = Math.sqrt(W * W + H * H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(rot);
    ctx.translate(-W / 2, -H / 2);
    for (let y = -diag; y < H + diag; y += gapY) {
      for (let x = -diag; x < W + diag; x += gapX) {
        ctx.drawImage(state.logo, x, y, targetW, targetH);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }

  const { ax, ay } = anchor(state.pos, W, H, targetW, targetH, pad);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(rot);
  ctx.drawImage(state.logo, -targetW / 2, -targetH / 2, targetW, targetH);
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** 根据九宫格位置算出锚点中心坐标 */
function anchor(pos, W, H, tw, th, pad) {
  const halfW = tw / 2, halfH = th / 2;
  let cx = W / 2, cy = H / 2;
  if (pos.includes('left')) cx = pad + halfW;
  else if (pos.includes('right')) cx = W - pad - halfW;
  if (pos.startsWith('top')) cy = pad + halfH;
  else if (pos.startsWith('bottom')) cy = H - pad - halfH;
  return { ax: cx, ay: cy };
}

/* ---------- init ---------- */
els.wmText.value = T.defaultText;
els.fontSizeVal.textContent = els.fontSize.value;
els.opacityVal.textContent = els.opacity.value;
els.rotationVal.textContent = els.rotation.value;
els.logoScaleVal.textContent = els.logoScale.value;
setMode('text');
