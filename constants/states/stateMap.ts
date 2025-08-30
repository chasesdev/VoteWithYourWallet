// Centralized state name mapping to avoid duplication
export const STATE_NAME_MAPPING: { [key: string]: string } = {
  // Full state names to abbreviations
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY',
  
  // Abbreviations to abbreviations (for consistency)
  'AL': 'AL',
  'AK': 'AK',
  'AZ': 'AZ',
  'AR': 'AR',
  'CA': 'CA',
  'CO': 'CO',
  'CT': 'CT',
  'DE': 'DE',
  'FL': 'FL',
  'GA': 'GA',
  'HI': 'HI',
  'ID': 'ID',
  'IL': 'IL',
  'IN': 'IN',
  'IA': 'IA',
  'KS': 'KS',
  'KY': 'KY',
  'LA': 'LA',
  'ME': 'ME',
  'MD': 'MD',
  'MA': 'MA',
  'MI': 'MI',
  'MN': 'MN',
  'MS': 'MS',
  'MO': 'MO',
  'MT': 'MT',
  'NE': 'NE',
  'NV': 'NV',
  'NH': 'NH',
  'NJ': 'NJ',
  'NM': 'NM',
  'NY': 'NY',
  'NC': 'NC',
  'ND': 'ND',
  'OH': 'OH',
  'OK': 'OK',
  'OR': 'OR',
  'PA': 'PA',
  'RI': 'RI',
  'SC': 'SC',
  'SD': 'SD',
  'TN': 'TN',
  'TX': 'TX',
  'UT': 'UT',
  'VT': 'VT',
  'VA': 'VA',
  'WA': 'WA',
  'WV': 'WV',
  'WI': 'WI',
  'WY': 'WY'
};

// Utility functions for state name handling
export const cleanStateName = (state: string): string => {
  return STATE_NAME_MAPPING[state] || state.toUpperCase().substring(0, 2);
};

export const isValidState = (state: string): boolean => {
  return state in STATE_NAME_MAPPING;
};

export const getStateAbbreviation = (state: string): string => {
  return STATE_NAME_MAPPING[state] || state.toUpperCase().substring(0, 2);
};

export const getStateFullName = (abbreviation: string): string | null => {
  const fullName = Object.keys(STATE_NAME_MAPPING).find(
    key => STATE_NAME_MAPPING[key] === abbreviation.toUpperCase()
  );
  return fullName || null;
};

// List of all state abbreviations
export const STATE_ABBREVIATIONS = Object.values(STATE_NAME_MAPPING);

// List of all state full names
export const STATE_FULL_NAMES = Object.keys(STATE_NAME_MAPPING);

// Grouped states by region for easier filtering
export const STATE_REGIONS = {
  'Northeast': ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
  'Midwest': ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  'South': ['AL', 'AR', 'DE', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'NC', 'OK', 'SC', 'TN', 'TX', 'VA', 'WV'],
  'West': ['AZ', 'CA', 'CO', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY'],
  'Pacific': ['AK', 'HI']
};

// Get states by region
export const getStatesByRegion = (region: keyof typeof STATE_REGIONS): string[] => {
  return STATE_REGIONS[region] || [];
};

// Check if state is in a specific region
export const isStateInRegion = (state: string, region: keyof typeof STATE_REGIONS): boolean => {
  const abbreviation = getStateAbbreviation(state);
  return STATE_REGIONS[region].includes(abbreviation);
};

// Get all states in multiple regions
export const getStatesInRegions = (regions: (keyof typeof STATE_REGIONS)[]): string[] => {
  const states = new Set<string>();
  regions.forEach(region => {
    STATE_REGIONS[region].forEach(state => states.add(state));
  });
  return Array.from(states);
};

// Common state name variations for fuzzy matching
export const STATE_NAME_VARIATIONS: { [key: string]: string[] } = {
  'California': ['CA', 'Calif', 'Calif.', 'Golden State'],
  'Texas': ['TX', 'Tex', 'Tex.', 'Lone Star State'],
  'Florida': ['FL', 'Fla', 'Fla.', 'Sunshine State'],
  'New York': ['NY', 'N.Y.', 'Empire State'],
  'Pennsylvania': ['PA', 'Pa', 'Pa.', 'Keystone State'],
  'Illinois': ['IL', 'Ill', 'Ill.', 'Prairie State'],
  'Ohio': ['OH', 'O.', 'Buckeye State'],
  'Georgia': ['GA', 'Ga', 'Ga.', 'Peach State'],
  'North Carolina': ['NC', 'N.C.', 'Tar Heel State'],
  'Michigan': ['MI', 'Mich', 'Mich.', 'Wolverine State'],
  'New Jersey': ['NJ', 'N.J.', 'Garden State'],
  'Virginia': ['VA', 'Va', 'Va.', 'Old Dominion'],
  'Washington': ['WA', 'Wash', 'Wash.', 'Evergreen State'],
  'Arizona': ['AZ', 'Ariz', 'Ariz.', 'Grand Canyon State'],
  'Massachusetts': ['MA', 'Mass', 'Mass.', 'Bay State'],
  'Tennessee': ['TN', 'Tenn', 'Tenn.', 'Volunteer State'],
  'Indiana': ['IN', 'Ind', 'Ind.', 'Hoosier State'],
  'Missouri': ['MO', 'Mo', 'Mo.', 'Show Me State'],
  'Maryland': ['MD', 'Md', 'Md.', 'Old Line State'],
  'Wisconsin': ['WI', 'Wis', 'Wis.', 'Badger State'],
  'Colorado': ['CO', 'Colo', 'Colo.', 'Centennial State'],
  'Minnesota': ['MN', 'Minn', 'Minn.', 'North Star State'],
  'South Carolina': ['SC', 'S.C.', 'Palmetto State'],
  'Alabama': ['AL', 'Ala', 'Ala.', 'Yellowhammer State'],
  'Louisiana': ['LA', 'La', 'La.', 'Pelican State'],
  'Kentucky': ['KY', 'Ky', 'Ky.', 'Bluegrass State'],
  'Oregon': ['OR', 'Ore', 'Ore.', 'Beaver State'],
  'Oklahoma': ['OK', 'Okla', 'Okla.', 'Sooner State'],
  'Connecticut': ['CT', 'Conn', 'Conn.', 'Constitution State'],
  'Utah': ['UT', 'Utah', 'Beehive State'],
  'Iowa': ['IA', 'Iowa', 'Hawkeye State'],
  'Nevada': ['NV', 'Nev', 'Nev.', 'Silver State'],
  'Arkansas': ['AR', 'Ark', 'Ark.', 'Natural State'],
  'Mississippi': ['MS', 'Miss', 'Miss.', 'Magnolia State'],
  'Kansas': ['KS', 'Kan', 'Kan.', 'Sunflower State'],
  'Nebraska': ['NE', 'Neb', 'Neb.', 'Cornhusker State'],
  'Idaho': ['ID', 'Idaho', 'Gem State'],
  'New Mexico': ['NM', 'N.M.', 'Land of Enchantment'],
  'Delaware': ['DE', 'Del', 'Del.', 'First State'],
  'South Dakota': ['SD', 'S.D.', 'Mount Rushmore State'],
  'North Dakota': ['ND', 'N.D.', 'Peace Garden State'],
  'Alaska': ['AK', 'Alaska', 'Last Frontier'],
  'Hawaii': ['HI', 'Hawaii', 'Aloha State'],
  'West Virginia': ['WV', 'W.Va.', 'Mountain State'],
  'New Hampshire': ['NH', 'N.H.', 'Granite State'],
  'Maine': ['ME', 'Maine', 'Pine Tree State'],
  'Vermont': ['VT', 'Vt', 'Vt.', 'Green Mountain State'],
  'Wyoming': ['WY', 'Wyo', 'Wyo.', 'Equality State'],
  'Rhode Island': ['RI', 'R.I.', 'Ocean State']
};

// Fuzzy state name matching
export const matchStateName = (input: string): string | null => {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check exact match first
  if (STATE_NAME_MAPPING[normalizedInput]) {
    return STATE_NAME_MAPPING[normalizedInput];
  }
  
  // Check variations
  for (const [fullName, variations] of Object.entries(STATE_NAME_VARIATIONS)) {
    if (fullName.toLowerCase() === normalizedInput) {
      return STATE_NAME_MAPPING[fullName];
    }
    
    for (const variation of variations) {
      if (variation.toLowerCase() === normalizedInput) {
        return STATE_NAME_MAPPING[fullName];
      }
    }
  }
  
  // Check if input is already a valid abbreviation
  if (STATE_ABBREVIATIONS.includes(normalizedInput.toUpperCase())) {
    return normalizedInput.toUpperCase();
  }
  
  return null;
};

// Get all possible state names (full names and variations)
export const getAllStateNames = (): string[] => {
  const names = new Set<string>();
  
  // Add full names
  Object.keys(STATE_NAME_MAPPING).forEach(name => {
    names.add(name);
    names.add(name.toLowerCase());
  });
  
  // Add abbreviations
  Object.values(STATE_NAME_MAPPING).forEach(abbrev => {
    names.add(abbrev);
    names.add(abbrev.toLowerCase());
  });
  
  // Add variations
  Object.values(STATE_NAME_VARIATIONS).forEach(variations => {
    variations.forEach(variation => {
      names.add(variation);
      names.add(variation.toLowerCase());
    });
  });
  
  return Array.from(names);
};