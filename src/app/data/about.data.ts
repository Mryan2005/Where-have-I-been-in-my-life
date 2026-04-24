/**
 * About-window content for each supported language.
 * Edit this file to customise the information shown in the About panel.
 */
export const ABOUT_CONTENT = {
  zh: {
    title: '关于',
    appName: '我去过的地方',
    version: '版本 1.0.0',
    description: '一款记录你人生旅途的地图应用。\n在地图上标记每一个到过的地方，\n留下属于你的旅行记忆。',
    author: '作者',
    authorName: 'Mryan2005',
    tech: '技术栈',
    techList: 'Angular · MapLibre GL · OpenFreeMap',
    license: '开源协议',
    licenseText: 'MIT License',
  },
  en: {
    title: 'About',
    appName: 'Where I\'ve Been',
    version: 'Version 1.0.0',
    description: 'A map app to record your life journey.\nMark every place you\'ve visited on the map\nand keep your travel memories forever.',
    author: 'Author',
    authorName: 'Mryan2005',
    tech: 'Tech Stack',
    techList: 'Angular · MapLibre GL · OpenFreeMap',
    license: 'License',
    licenseText: 'MIT License',
  },
} as const;

export type AboutContent = typeof ABOUT_CONTENT;
