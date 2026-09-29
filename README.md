# e次元 · e-times

第 17 届「工行杯」全国大学生金融科技创新大赛参赛作品演示站。

纯静态站点（HTML / CSS / 原生 JS，零外部依赖），可直接由 GitHub Pages 托管。

## 在线预览

- 移动端演示站 → https://cryo-skm.github.io/e-times/
- PC 端工作台 → https://cryo-skm.github.io/e-times/pc/

## 内容结构

```
index.html          移动端演示站入口（工行手机银行外壳 → e次元）
pc/index.html       PC 端工作台入口（银行网银壳 + e次元工作台）
css/                样式（style / xingegu / ec-theme / ec-modules）
js/                 脚本（app / data / xingegu / chars / ec-entry / ec-discovery / modules3）
img/art/            原创二次元插画素材（立绘、横幅）
manifest.json       PWA 清单
sw.js               Service Worker（离线缓存）
```

## 页面一览

**移动端**：首页 / 生活 / 谷圈广场 / 商城 / 论坛 / 创作中心 / 兑换中心 / 我的 …

**PC 端工作台**（13 个功能页）：

| 分组 | 页面 |
|---|---|
| 主线 | 首页 |
| 金融服务 | 价值变现引擎、出谷通托管、谷卡 |
| 我的 | 商品、时空谷馆、收藏、藏馆 |
| 社区 | 谷圈广场、谷享代购、AR 藏馆、消息、个人中心 |

## 本地运行

无需构建，直接用浏览器打开 `index.html` 即可。
建议起一个静态服务器以获得完整的 PWA / Service Worker 体验：

```bash
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 技术要点

- 全部使用相对路径，可托管在任意子目录下。
- 转场：从银行端入口进入 e次元时有多条路径，分别落到站内不同位置。
- 素材：站内插画为原创绘制，不含任何第三方作品素材。

## 免责声明

本项目为大学生学科竞赛的**教学演示作品**，界面中的银行相关名称与视觉元素仅用于演示场景，
与任何金融机构无隶属、合作或代理关系，不构成任何金融产品或服务。
