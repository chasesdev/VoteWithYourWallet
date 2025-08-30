// Constants for political alignment service

// Political alignment sources
export const ALIGNMENT_SOURCES = [
  {
    name: 'OpenSecrets',
    url: 'https://www.opensecrets.org',
    reliability: 0.9,
    type: 'database' as const
  },
  {
    name: 'Ballotpedia',
    url: 'https://ballotpedia.org',
    reliability: 0.85,
    type: 'database' as const
  },
  {
    name: 'FollowTheMoney',
    url: 'https://www.followthemoney.org',
    reliability: 0.8,
    type: 'database' as const
  },
  {
    name: 'FactCheck.org',
    url: 'https://www.factcheck.org',
    reliability: 0.9,
    type: 'news' as const
  },
  {
    name: 'PolitiFact',
    url: 'https://www.politifact.com',
    reliability: 0.85,
    type: 'news' as const
  }
];

// Known political leanings for major organizations
export const KNOWN_POLITICAL_LEANS: Record<string, string> = {
  'Democratic Party': 'liberal',
  'Republican Party': 'conservative',
  'Libertarian Party': 'libertarian',
  'Green Party': 'green',
  'NRA': 'conservative',
  'Planned Parenthood': 'liberal',
  'ACLU': 'liberal',
  'Heritage Foundation': 'conservative',
  'Sierra Club': 'green',
  'Chamber of Commerce': 'conservative',
  'AFL-CIO': 'liberal',
  'NARAL': 'liberal',
  'National Right to Life': 'conservative',
  'Human Rights Campaign': 'liberal',
  'Focus on the Family': 'conservative',
  'MoveOn.org': 'liberal',
  'Tea Party Patriots': 'conservative',
  '350.org': 'green',
  'Reason Foundation': 'libertarian'
};

// Political keywords for detection
export const POLITICAL_KEYWORDS = {
  liberal: ['democratic', 'progressive', 'liberal', 'left', 'labor', 'union', 'civil rights'],
  conservative: ['republican', 'conservative', 'right', 'freedom', 'heritage', 'family'],
  libertarian: ['libertarian', 'freedom', 'liberty', 'tax', 'constitution'],
  green: ['green', 'environmental', 'climate', 'nature', 'sustainability']
};

// Default alignment configuration
export const DEFAULT_ALIGNMENT_CONFIG = {
  autoUpdate: true,
  updateInterval: 24 * 60 * 60 * 1000, // 24 hours
  minConfidence: 50,
  enableUserInput: true,
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxDonationsPerBusiness: 100
};

// Mock data for demonstration
export const MOCK_POLITICAL_STATEMENTS = [
  { text: 'Supports environmental regulations', lean: 'green', confidence: 0.8 },
  { text: 'Advocates for lower taxes', lean: 'conservative', confidence: 0.7 },
  { text: 'Promotes social equality', lean: 'liberal', confidence: 0.9 },
  { text: 'Supports individual freedoms', lean: 'libertarian', confidence: 0.6 },
  { text: 'Calls for bipartisan solutions', lean: 'centrist', confidence: 0.8 }
];

// Alignment calculation weights
export const ALIGNMENT_WEIGHTS = {
  donationWeight: 1,
  statementWeight: 2,
  maxWeight: 10
};

// Database table names
export const DB_TABLES = {
  businessAlignments: 'business_alignments',
  donations: 'donations',
  userAlignments: 'user_alignments',
  userBusinessAlignments: 'user_business_alignments'
} as const;