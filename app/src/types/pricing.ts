export type PricingTier = 'free' | 'monthly' | 'lifetime';

export interface PricingPlan {
  tier: PricingTier;
  name: string;
  nameEn: string;
  price: string;
  priceNote: string;
  features: string[];
  limits: FeatureLimits;
  cta: string;
  highlighted: boolean;
}

export interface FeatureLimits {
  maxFolders: number;
  maxFilesPerFolder: number;
  dailyPremiumActions: number; // 10 for free, Infinity for paid
  designTemplates: number; // 2 for free, 6 for paid
  cloudSync: boolean;
  managedAI: boolean;
  linkSharing: boolean;
}

export type PremiumAction = 'pdf' | 'html_export' | 'share_link' | 'llm' | 'wiki_generate';
