import { StateConfig } from '../types';

// Tier 1 - Major States (1000+ businesses each)
export const CALIFORNIA_CONFIG: StateConfig = {
  state: 'California', 
  tier: 1, 
  businessTarget: 2000, 
  cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland', 'Fresno', 'Long Beach', 'Anaheim', 'Santa Ana'], 
  metropolitanAreas: ['Los Angeles-Long Beach-Anaheim', 'San Francisco-Oakland-Berkeley', 'San Diego-Chula Vista-Carlsbad', 'Riverside-San Bernardino-Ontario', 'Sacramento-Roseville-Folsom', 'San Jose-Sunnyvale-Santa Clara', 'Fresno', 'Bakersfield', 'Oxnard-Thousand Oaks-Ventura', 'Stockton'], 
  industries: ['Technology', 'Entertainment', 'Aerospace', 'Agriculture', 'Tourism', 'Healthcare', 'Finance', 'Manufacturing', 'Biotechnology', 'Renewable Energy'] 
};

export const TEXAS_CONFIG: StateConfig = {
  state: 'Texas', 
  tier: 1, 
  businessTarget: 1800, 
  cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock'], 
  metropolitanAreas: ['Houston-The Woodlands-Sugar Land', 'Dallas-Fort Worth-Arlington', 'Austin-Round Rock-Georgetown', 'San Antonio-New Braunfels', 'McAllen-Edinburg-Mission', 'El Paso', 'Killeen-Temple', 'Brownsville-Harlingen', 'Beaumont-Port Arthur', 'Lubbock'], 
  industries: ['Energy', 'Technology', 'Aerospace', 'Healthcare', 'Finance', 'Agriculture', 'Manufacturing', 'Defense', 'Logistics', 'Oil & Gas'] 
};

export const FLORIDA_CONFIG: StateConfig = {
  state: 'Florida', 
  tier: 1, 
  businessTarget: 1500, 
  cities: ['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Lauderdale', 'Tallahassee', 'St. Petersburg', 'Hialeah', 'Tampa', 'Orlando'], 
  metropolitanAreas: ['Miami-Fort Lauderdale-Pompano Beach', 'Tampa-St. Petersburg-Clearwater', 'Orlando-Kissimmee-Sanford', 'Jacksonville', 'North Port-Bradenton-Sarasota', 'Cape Coral-Fort Myers', 'Pensacola', 'Port St. Lucie', 'Deltona-Daytona Beach-Ormond Beach', 'Palm Bay-Melbourne-Titusville'], 
  industries: ['Tourism', 'Aerospace', 'Healthcare', 'Finance', 'Agriculture', 'International Trade', 'Technology', 'Real Estate', 'Cruise Lines', 'Hospitality'] 
};

export const NEW_YORK_CONFIG: StateConfig = {
  state: 'New York', 
  tier: 1, 
  businessTarget: 1600, 
  cities: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers', 'Schenectady', 'New Rochelle', 'Mount Vernon', 'Utica'], 
  metropolitanAreas: ['New York-Newark-Jersey City', 'Buffalo-Cheektowaga', 'Rochester', 'Albany-Schenectady-Troy', 'Syracuse', 'Poughkeepsie-Newburgh-Middletown', 'Kingston', 'Glens Falls', 'Elmira', 'Binghamton'], 
  industries: ['Finance', 'Media', 'Technology', ' Healthcare', 'Real Estate', 'Manufacturing', 'Tourism', 'Education', 'Fashion', 'Food Processing'] 
};

export const PENNSYLVANIA_CONFIG: StateConfig = {
  state: 'Pennsylvania', 
  tier: 1, 
  businessTarget: 900, 
  cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'York'], 
  metropolitanAreas: ['Philadelphia-Camden-Wilmington', 'Pittsburgh', 'Allentown-Bethlehem-Easton', 'Harrisburg-Carlisle', 'Scranton--Wilkes-Barre', 'Lancaster', 'York', 'Williamsport', 'Johnstown', 'Altoona'], 
  industries: ['Manufacturing', 'Healthcare', 'Education', 'Finance', 'Technology', 'Energy', 'Agriculture', 'Logistics', 'Pharmaceuticals', 'Steel'] 
};

export const TIER1_STATES: StateConfig[] = [
  CALIFORNIA_CONFIG,
  TEXAS_CONFIG,
  FLORIDA_CONFIG,
  NEW_YORK_CONFIG,
  PENNSYLVANIA_CONFIG
];