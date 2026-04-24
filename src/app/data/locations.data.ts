import { TravelLocation } from '../models/location.model';

/**
 * Seed anchor points pre-loaded into the application.
 * Add, remove, or edit entries here to customize the default locations
 * shown on the 3-D map when no localStorage data is present.
 *
 * Each object must satisfy the {@link TravelLocation} interface.
 */
export const DEFAULT_LOCATIONS: TravelLocation[] = [
  {
    id: '1',
    name: '北京 · 故宫',
    latitude: 39.9163,
    longitude: 116.3972,
    visitDate: '2023-10-01',
    markerColor: '#E74C3C',
    images: ['https://tse4-mm.cn.bing.net/th/id/OIP-C.0jtJZv1orU29loRFE39abgHaE7?w=250&h=180&c=7&r=0&o=7&dpr=1.9&pid=1.7&rm=3'],
    content: `# 故宫 — 紫禁城

> 走在朱红宫墙之间，历史扑面而来。

## 行程亮点

- 参观了**太和殿**、中和殿与保和殿三大殿
- 在御花园的古树下小憩
- 欣赏了院内珍藏的书画文物

## 旅行感悟

金秋十月，天高气爽，故宫的琉璃黄瓦在阳光下熠熠生辉。
置身其中，仿佛穿越回了那个鼎盛的大明王朝。

**推荐指数** ⭐⭐⭐⭐⭐
`,
  },
  {
    id: '2',
    name: '上海 · 外滩',
    latitude: 31.2397,
    longitude: 121.4899,
    visitDate: '2023-05-20',
    markerColor: '#3498DB',
    images: [],
    content: `# 外滩夜景

> 黄浦江两岸灯火通明，东方明珠倒映在水面。

## 游览路线

1. 南京东路步行街
2. 外滩观景台
3. 黄浦江夜游轮渡

## 美食推荐

| 餐厅 | 招牌菜 | 人均 |
|------|--------|------|
| 南翔馒头店 | 小笼包 | ¥60 |
| 老正兴 | 红烧肉 | ¥120 |

夜晚的外滩是上海最浪漫的地方，一定要来看看！
`,
  },
  {
    id: '3',
    name: '成都 · 宽窄巷子',
    latitude: 30.6748,
    longitude: 104.0568,
    visitDate: '2022-08-15',
    markerColor: '#2ECC71',
    images: [],
    content: `# 宽窄巷子漫游记

> 老成都的烟火气，在青石板路上慢慢流淌。

## 必吃清单

- 🍡 **糖油果子** — 外脆内软，香甜可口
- 🫖 **盖碗茶** — 在庭院里坐一个下午
- 🌶️ **串串香** — 麻辣鲜香，停不下来

## 摄影打卡

巷子里的老门楼、青瓦屋檐和爬山虎是绝佳的拍照背景，
**傍晚时分**光线最为柔和，推荐那时前往。

\`\`\`
宽巷子 → 窄巷子 → 井巷子
建议游览时间：2-3 小时
\`\`\`
`,
  },
];
