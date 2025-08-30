// Types specific to political alignment service
export interface PoliticalAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

export interface DonationData {
  organization: string;
  amount: number;
  politicalLean: string;
  year: number;
  sourceUrl?: string;
}

export interface BusinessPoliticalData {
  businessId: number;
  alignment: PoliticalAlignment;
  donations: DonationData[];
  sources: string[];
  confidence: number;
  lastUpdated: Date;
}

export interface AlignmentSource {
  name: string;
  url: string;
  reliability: number;
  type: 'news' | 'database' | 'official' | 'social';
}

export interface UserAlignment {
  userId: number;
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBusinessAlignment {
  userId: number;
  businessId: number;
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlignmentConfig {
  autoUpdate: boolean;
  updateInterval: number;
  minConfidence: number;
  enableUserInput: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  maxDonationsPerBusiness: number;
}

export interface AlignmentStats {
  totalBusinesses: number;
  businessesWithAlignment: number;
  coveragePercentage: number;
  averageAlignments: {
    avgLiberal: number;
    avgConservative: number;
    avgLibertarian: number;
    avgGreen: number;
    avgCentrist: number;
  };
  topDonors: Array<{
    organization: string;
    totalAmount: number;
    politicalLean: string;
  }>;
  recentUpdates: Array<{
    businessId: number;
    lastUpdated: Date;
    confidence: number;
  }>;
}