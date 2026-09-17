# 💧 图片加水印工具 · Image Watermark Tool

上传一张图片 → 加文字或 Logo 水印 → 下载一张图片。**全流程在你的浏览器里完成，图片不上传任何服务器。**

> 语言：**中文** | [English](en/)

[![Deploy: GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222?logo=github)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Privacy: 100% local](https://img.shields.io/badge/privacy-100%25%20local-success)](#-隐私)

## ✨ 特性

- **✏️ 文字水印** — 内容 / 字号 / 颜色 / 透明度 / 旋转 / 粗体 / **描边**
- **🖼️ Logo 图片水印** — 上传自己的 Logo，调整缩放与透明度
- **▦ 九宫格 + 平铺** — 九个位置一键定位，或平铺全图（防盗图）
- **👁️ 实时预览** — 改任何参数立刻重绘，所见即所得
- **💧 不加二次水印** — 输出只有你加的水印
- **🔐 纯本地处理** — 图片不离开设备，无后端、无上传
- **🕵️ 自动去除 EXIF** — 顺带移除 GPS 位置隐私
- **🆓 零依赖** — 纯原生 JS + Canvas

## 🚀 使用

**在线版：**
- 中文：https://haixiansheng.github.io/image-watermark/
- English：https://haixiansheng.github.io/image-watermark/en/

**本地运行：**
```bash
git clone https://github.com/haixiansheng/image-watermark.git
cd image-watermark
python -m http.server 8080
# 打开 http://127.0.0.1:8080
```

## 🏗 技术实现

| 模块 | 方案 |
|---|---|
| 解码 | 浏览器原生 `Image` 解码 |
| 绘制 | Canvas 2D：`fillText` / `strokeText` / `drawImage` |
| 透明度 | `ctx.globalAlpha` |
| 旋转 | `ctx.translate` + `ctx.rotate` 坐标变换 |
| 九宫格定位 | 按位置计算锚点中心坐标 |
| 平铺 | 双层循环按间距铺满（含对角线扩展，旋转后不留空） |
| 依赖 | **零依赖** |

## ⚠️ 已知限制

| 限制 | 说明 |
|---|---|
| 水印不可撤销 | 保存后无法去除，请务必保留原图 |
| 一次一张 | 批量功能开发中 |
| 输出 JPEG | 不支持透明输出（JPEG 无 alpha） |

## 📄 License

MIT
