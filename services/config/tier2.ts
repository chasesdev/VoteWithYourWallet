import { StateConfig } from '../types';

// Tier 2 - Large States (200-500 businesses each)
export const ILLINOIS_CONFIG: StateConfig = {
  state: 'Illinois', 
  tier: 2, 
  businessTarget: 200, 
  cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville'], 
  metropolitanAreas: ['Chicago-Naperville-Elgin', 'Rockford', 'Peoria', 'Springfield', 'Champaign-Urbana'], 
  industries: ['Finance', 'Manufacturing', 'Technology', 'Agriculture', 'Healthcare', 'Transportation', 'Education', 'Energy'] 
};

export const OHIO_CONFIG: StateConfig = {
  state: 'Ohio', 
  tier: 2, 
  businessTarget: 200, 
  cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'], 
  metropolitanAreas: ['Columbus', 'Cleveland-Elyria', 'Cincinnati', 'Toledo', 'Akron'], 
  industries: ['Manufacturing', 'Healthcare', 'Finance', 'Technology', 'Agriculture', 'Logistics', 'Education', 'Energy'] 
};

export const GEORGIA_CONFIG: StateConfig = {
  state: 'Georgia', 
  tier: 2, 
  businessTarget: 200, 
  cities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'], 
  metropolitanAreas: ['Atlanta-Sandy Springs-Alpharetta', 'Augusta-Richmond County','Columbus', 'Savannah', 'Athens-Clarke County'], 
  industries: ['Technology', 'Agriculture', 'Film', 'Logistics', 'Healthcare', 'Finance', 'Manufacturing', 'Tourism'] 
};

export const NORTH_CAROLINA_CONFIG: StateConfig = {
  state: 'North Carolina', 
  tier: 2, 
  businessTarget: 200, 
  cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'], 
  metropolitanAreas: ['Charlotte-Concord-Gastonia', 'Raleigh-Cary', 'Greensboro-High Point', 'Durham-Chapel Hill', 'Winston-Salem'], 
  industries: ['Technology', 'Finance', 'Healthcare', 'Education', 'Agriculture', 'Manufacturing', 'Tourism', 'Research'] 
};

export const MICHIGAN_CONFIG: StateConfig = {
  state: 'Michigan', 
  tier: 2, 
  businessTarget: 200, 
  cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'], 
  metropolitanAreas: ['Detroit-Warren-Dearborn', 'Grand Rapids-Kentwood', 'Warren-Troy-Farmington Hills', 'Lansing-East Lansing', 'Ann Arbor'], 
  industries: ['Automotive', 'Manufacturing', 'Technology', 'Healthcare', 'Agriculture', 'Tourism', 'Education', 'Finance'] 
};

export const TIER2_STATES: StateConfig[] = [
  ILLINOIS_CONFIG,
  OHIO_CONFIG,
  GEORGIA_CONFIG,
  NORTH_CAROLINA_CONFIG,
  MICHIGAN_CONFIG
];