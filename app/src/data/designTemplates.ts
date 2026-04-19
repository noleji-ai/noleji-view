export interface DesignTemplate {
  id: string;
  name: string;
  color: string;
  accent: string;
  font: string;
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  { id: 'apple', name: 'Apple Premium', color: '#000000', accent: '#0071E3', font: 'SF Pro, Inter' },
  { id: 'stripe', name: 'Stripe Elegant', color: '#635BFF', accent: '#00D7FF', font: 'Inter' },
  { id: 'linear', name: 'Linear Minimal', color: '#5E6AD2', accent: '#8A94E9', font: 'Inter' },
  { id: 'vercel', name: 'Vercel Precise', color: '#000000', accent: '#000000', font: 'Geist, sans-serif' },
  { id: 'mistral', name: 'Mistral French', color: '#FF5917', accent: '#7C3AED', font: 'Inter' },
  { id: 'asome', name: 'Asome Emerald', color: '#1A202C', accent: '#10B981', font: 'Source Serif 4' },
];
