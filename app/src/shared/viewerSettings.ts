export interface ViewerSettings {
  templateId: string;   // 'apple'|'stripe'|'linear'|'vercel'|'mistral'|'asome'
  fontSize: number;     // 12-28, default 18
  lineHeight: number;   // 1.4-2.6, default 1.8
  padding: number;      // 20-100, default 60
  docWidth: string;     // '640px'|'800px'|'1200px'|'100%'
  isDark: boolean;      // default false
}

export const DEFAULT_VIEWER_SETTINGS: ViewerSettings = {
  templateId: 'asome',
  fontSize: 18,
  lineHeight: 1.8,
  padding: 60,
  docWidth: '800px',
  isDark: false,
};
