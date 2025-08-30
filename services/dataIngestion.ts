import { getDB } from '../db/connection';
import { businesses, businessCategories, businessTags, businessTagRelations, businessMedia, businessAlignments, donations, dataSources, syncLogs } from '../db/schema';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';

// Types for business data
interface BusinessData {
  name: string;
  description?: string;
  category: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  hours?: string;
  priceRange?: string;
  yearFounded?: number;
  employeeCount?: number;
  businessSize?: string;
  imageUrl?: string;
  logoUrl?: string;
  socialMedia?: Record<string, string | undefined>;
  tags?: string[];
  attributes?: Record<string, any>;
  dataSource: string;
  dataQuality?: number;
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
  duration: number;
}

// Real Orange County businesses data
const ORANGE_COUNTY_BUSINESSES: BusinessData[] = [
  {
    name: "South Coast Plaza",
    description: "Luxury shopping center in Costa Mesa featuring high-end retailers and dining",
    category: "Retail",
    website: "https://southcoastplaza.com",
    address: "3333 Bristol Street",
    city: "Costa Mesa",
    state: "CA",
    zipCode: "92626",
    county: "Orange County",
    latitude: 33.6724,
    longitude: -117.9123,
    phone: "(714) 540-2000",
    hours: "10:00 AM - 9:00 PM",
    priceRange: "$$$",
    yearFounded: 1967,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/South_Coast_Plaza_2019.jpg/1200px-South_Coast_Plaza_2019.jpg",
    logoUrl: "https://southcoastplaza.com/wp-content/uploads/2021/01/SCP-Logo-Color.png",
    socialMedia: {
      instagram: "@southcoastplaza",
      facebook: "South Coast Plaza"
    },
    tags: ["luxury", "shopping", "mall", "retail", "fashion"],
    dataSource: "manual"
  },
  {
    name: "Disneyland Resort",
    description: "Original Disney theme park featuring classic attractions and entertainment",
    category: "Entertainment",
    website: "https://disneyland.disney.go.com",
    address: "1313 Disneyland Drive",
    city: "Anaheim",
    state: "CA",
    zipCode: "92802",
    county: "Orange County",
    latitude: 33.8121,
    longitude: -117.9189,
    phone: "(714) 781-4565",
    hours: "8:00 AM - 12:00 AM",
    priceRange: "$$$$",
    yearFounded: 1955,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Disneyland_Sleeping_Beauty_Castle.jpg/1200px-Disneyland_Sleeping_Beauty_Castle.jpg",
    logoUrl: "https://disneyland.disney.go.com/media/disneyland/logo.png",
    socialMedia: {
      instagram: "@disneyland",
      twitter: "@Disneyland",
      facebook: "Disneyland"
    },
    tags: ["theme park", "entertainment", "family", "tourist attraction", "disney"],
    dataSource: "manual"
  },
  {
    name: "John Wayne Airport",
    description: "Orange County's primary commercial airport serving the region",
    category: "Transportation",
    website: "https://www.ocair.com",
    address: "18601 Airport Way",
    city: "Santa Ana",
    state: "CA",
    zipCode: "92707",
    county: "Orange County",
    latitude: 33.6755,
    longitude: -117.8681,
    phone: "(949) 252-5200",
    hours: "24/7",
    priceRange: "$",
    yearFounded: 1942,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/John_Wayne_Airport_2019.jpg/1200px-John_Wayne_Airport_2019.jpg",
    logoUrl: "https://www.ocair.com/sites/main/files/main-images/jwa-logo.png",
    socialMedia: {
      twitter: "@JohnWayneAir",
      facebook: "John Wayne Airport"
    },
    tags: ["airport", "transportation", "travel", "aviation"],
    dataSource: "manual"
  },
  {
    name: "UC Irvine",
    description: "University of California, Irvine - Public research university",
    category: "Education",
    website: "https://www.uci.edu",
    address: "4120 East Peltason Drive",
    city: "Irvine",
    state: "CA",
    zipCode: "92697",
    county: "Orange County",
    latitude: 33.6442,
    longitude: -117.8434,
    phone: "(949) 824-5011",
    hours: "24/7",
    priceRange: "$",
    yearFounded: 1965,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/UCI_Aldrich_Park.jpg/1200px-UCI_Aldrich_Park.jpg",
    logoUrl: "https://www.uci.edu/assets/images/uci-logo.svg",
    socialMedia: {
      instagram: "@UCIrvine",
      twitter: "@UCIrvine",
      facebook: "UC Irvine"
    },
    tags: ["university", "education", "research", "higher education"],
    dataSource: "manual"
  },
  {
    name: "The Irvine Company",
    description: "Real estate development and property management company",
    category: "Real Estate",
    website: "https://www.theirvinecompany.com",
    address: "1 Irvine Center Drive",
    city: "Irvine",
    state: "CA",
    zipCode: "92618",
    county: "Orange County",
    latitude: 33.6842,
    longitude: -117.8434,
    phone: "(949) 721-2000",
    hours: "9:00 AM - 5:00 PM",
    priceRange: "$$$",
    yearFounded: 1864,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Irvine_Company_Headquarters.jpg/1200px-Irvine_Company_Headquarters.jpg",
    logoUrl: "https://www.theirvinecompany.com/wp-content/uploads/2021/01/irvine-company-logo.png",
    socialMedia: {
      linkedin: "the-irvine-company",
      facebook: "The Irvine Company"
    },
    tags: ["real estate", "development", "property management", "investment"],
    dataSource: "manual"
  },
  {
    name: "Spectrum Center",
    description: "Sports and entertainment arena, home to the Anaheim Ducks",
    category: "Entertainment",
    website: "https://www.spectrumcenteranaheim.com",
    address: "2000 East Katella Avenue",
    city: "Anaheim",
    state: "CA",
    zipCode: "92806",
    county: "Orange County",
    latitude: 33.8333,
    longitude: -117.9167,
    phone: "(714) 776-1600",
    hours: "Varies",
    priceRange: "$$$",
    yearFounded: 1998,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Honda_Center_2019.jpg/1200px-Honda_Center_2019.jpg",
    logoUrl: "https://www.spectrumcenteranaheim.com/assets/images/spectrum-center-logo.png",
    socialMedia: {
      instagram: "@SpectrumCenter",
      twitter: "@SpectrumCenter",
      facebook: "Spectrum Center"
    },
    tags: ["arena", "sports", "entertainment", "concerts", "hockey"],
    dataSource: "manual"
  },
  {
    name: "Angel Stadium",
    description: "Baseball stadium, home of the Los Angeles Angels",
    category: "Entertainment",
    website: "https://www.angelsbaseball.com",
    address: "2000 Gene Autry Way",
    city: "Anaheim",
    state: "CA",
    zipCode: "92806",
    county: "Orange County",
    latitude: 33.8333,
    longitude: -117.9167,
    phone: "(714) 940-2000",
    hours: "Varies",
    priceRange: "$$$",
    yearFounded: 1966,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Angel_Stadium_2019.jpg/1200px-Angel_Stadium_2019.jpg",
    logoUrl: "https://www.mlbstatic.com/team-logos/108.svg",
    socialMedia: {
      instagram: "@Angels",
      twitter: "@Angels",
      facebook: "Los Angeles Angels"
    },
    tags: ["baseball", "stadium", "sports", "angels", "mlb"],
    dataSource: "manual"
  },
  {
    name: "Honda Center",
    description: "Multi-purpose arena hosting sports events, concerts, and entertainment",
    category: "Entertainment",
    website: "https://www.hondacenter.com",
    address: "2695 East Katella Avenue",
    city: "Anaheim",
    state: "CA",
    zipCode: "92806",
    county: "Orange County",
    latitude: 33.8333,
    longitude: -117.9167,
    phone: "(714) 704-2200",
    hours: "Varies",
    priceRange: "$$$",
    yearFounded: 1993,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Honda_Center_2019.jpg/1200px-Honda_Center_2019.jpg",
    logoUrl: "https://www.hondacenter.com/assets/images/honda-center-logo.png",
    socialMedia: {
      instagram: "@HondaCenter",
      twitter: "@HondaCenter",
      facebook: "Honda Center"
    },
    tags: ["arena", "sports", "entertainment", "concerts", "ducks"],
    dataSource: "manual"
  },
  {
    name: "The OC Fair & Event Center",
    description: "Annual fairgrounds and year-round event venue",
    category: "Entertainment",
    website: "https://www.ocfair.com",
    address: "88 Fair Drive",
    city: "Costa Mesa",
    state: "CA",
    zipCode: "92626",
    county: "Orange County",
    latitude: 33.6724,
    longitude: -117.9123,
    phone: "(714) 708-1500",
    hours: "Varies",
    priceRange: "$$",
    yearFounded: 1894,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/OC_Fair_2019.jpg/1200px-OC_Fair_2019.jpg",
    logoUrl: "https://www.ocfair.com/wp-content/uploads/2021/01/oc-fair-logo.png",
    socialMedia: {
      instagram: "@OCFair",
      twitter: "@OCFair",
      facebook: "OC Fair"
    },
    tags: ["fair", "event center", "entertainment", "festival", "carnival"],
    dataSource: "manual"
  },
  {
    name: "Orange County Great Park",
    description: "Large urban park with sports facilities and recreational activities",
    category: "Recreation",
    website: "https://www.ocgp.org",
    address: "8000 Great Park Boulevard",
    city: "Irvine",
    state: "CA",
    zipCode: "92618",
    county: "Orange County",
    latitude: 33.6842,
    longitude: -117.8434,
    phone: "(949) 724-6800",
    hours: "6:00 AM - 10:00 PM",
    priceRange: "Free",
    yearFounded: 2007,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Orange_County_Great_Park_2019.jpg/1200px-Orange_County_Great_Park_2019.jpg",
    logoUrl: "https://www.ocgp.org/wp-content/uploads/2021/01/great-park-logo.png",
    socialMedia: {
      instagram: "@OCGreatPark",
      facebook: "Orange County Great Park"
    },
    tags: ["park", "recreation", "outdoor", "nature", "sports"],
    dataSource: "manual"
  },
  {
    name: "Newport Beach Pier",
    description: "Historic wooden pier and popular fishing destination",
    category: "Recreation",
    website: "https://www.newportbeach.com",
    address: "300 Main Street",
    city: "Newport Beach",
    state: "CA",
    zipCode: "92663",
    county: "Orange County",
    latitude: 33.6139,
    longitude: -117.8867,
    phone: "(949) 644-3151",
    hours: "24/7",
    priceRange: "Free",
    yearFounded: 1906,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Newport_Beach_Pier_2019.jpg/1200px-Newport_Beach_Pier_2019.jpg",
    logoUrl: "https://www.newportbeach.com/wp-content/uploads/2021/01/newport-beach-logo.png",
    socialMedia: {
      instagram: "@newportbeach",
      facebook: "City of Newport Beach"
    },
    tags: ["pier", "beach", "recreation", "tourist attraction", "fishing"],
    dataSource: "manual"
  },
  {
    name: "Laguna Beach Art Museum",
    description: "Premier art museum showcasing California art",
    category: "Arts & Culture",
    website: "https://www.lagunaartmuseum.org",
    address: "307 Cliff Drive",
    city: "Laguna Beach",
    state: "CA",
    zipCode: "92651",
    county: "Orange County",
    latitude: 33.5428,
    longitude: -117.7833,
    phone: "(949) 494-8971",
    hours: "11:00 AM - 5:00 PM",
    priceRange: "$$",
    yearFounded: 1986,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Laguna_Art_Museum_2019.jpg/1200px-Laguna_Art_Museum_2019.jpg",
    logoUrl: "https://www.lagunaartmuseum.org/wp-content/uploads/2021/01/laguna-art-museum-logo.png",
    socialMedia: {
      instagram: "@lagunaartmuseum",
      facebook: "Laguna Art Museum"
    },
    tags: ["museum", "art", "culture", "exhibition", "california art"],
    dataSource: "manual"
  },
  {
    name: "Crystal Cove State Park",
    description: "Beautiful coastal state park with pristine beaches and hiking trails",
    category: "Recreation",
    website: "https://www.parks.ca.gov",
    address: "8471 North Coast Highway",
    city: "Laguna Beach",
    state: "CA",
    zipCode: "92651",
    county: "Orange County",
    latitude: 33.5428,
    longitude: -117.7833,
    phone: "(949) 497-3083",
    hours: "6:00 AM - 10:00 PM",
    priceRange: "$",
    yearFounded: 1979,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Crystal_Cove_State_Park_2019.jpg/1200px-Crystal_Cove_State_Park_2019.jpg",
    logoUrl: "https://www.parks.ca.gov/pages/images/crystal-cove-logo.png",
    socialMedia: {
      instagram: "@crystalcovestatepark",
      facebook: "Crystal Cove State Park"
    },
    tags: ["state park", "beach", "hiking", "nature", "coastal"],
    dataSource: "manual"
  },
  {
    name: "The Bowers Museum",
    description: "World-class art museum featuring diverse cultural exhibitions",
    category: "Arts & Culture",
    website: "https://www.bowers.org",
    address: "2002 North Main Street",
    city: "Santa Ana",
    state: "CA",
    zipCode: "92701",
    county: "Orange County",
    latitude: 33.7456,
    longitude: -117.8678,
    phone: "(714) 567-3600",
    hours: "10:00 AM - 4:00 PM",
    priceRange: "$$",
    yearFounded: 1936,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bowers_Museum_2019.jpg/1200px-Bowers_Museum_2019.jpg",
    logoUrl: "https://www.bowers.org/wp-content/uploads/2021/01/bowers-museum-logo.png",
    socialMedia: {
      instagram: "@bowersmuseum",
      facebook: "Bowers Museum"
    },
    tags: ["museum", "art", "culture", "history", "exhibitions"],
    dataSource: "manual"
  },
  {
    name: "Discovery Cube Orange County",
    description: "Interactive science museum for children and families",
    category: "Education",
    website: "https://www.discoverycube.org",
    address: "2500 N Main Street",
    city: "Santa Ana",
    state: "CA",
    zipCode: "92701",
    county: "Orange County",
    latitude: 33.7456,
    longitude: -117.8678,
    phone: "(714) 542-2823",
    hours: "10:00 AM - 5:00 PM",
    priceRange: "$$",
    yearFounded: 1998,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Discovery_Cube_OC_2019.jpg/1200px-Discovery_Cube_OC_2019.jpg",
    logoUrl: "https://www.discoverycube.org/wp-content/uploads/2021/01/discovery-cube-logo.png",
    socialMedia: {
      instagram: "@discoverycube",
      facebook: "Discovery Cube"
    },
    tags: ["museum", "science", "education", "children", "interactive"],
    dataSource: "manual"
  },
  {
    name: "Fashion Island Newport Beach",
    description: "Open-air shopping center with ocean views and luxury retailers",
    category: "Retail",
    website: "https://www.shopfashionisland.com",
    address: "1111 Newport Center Drive",
    city: "Newport Beach",
    state: "CA",
    zipCode: "92663",
    county: "Orange County",
    latitude: 33.6139,
    longitude: -117.8867,
    phone: "(949) 721-2000",
    hours: "10:00 AM - 9:00 PM",
    priceRange: "$$$",
    yearFounded: 1967,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Fashion_Island_2019.jpg/1200px-Fashion_Island_2019.jpg",
    logoUrl: "https://www.shopfashionisland.com/wp-content/uploads/2021/01/fashion-island-logo.png",
    socialMedia: {
      instagram: "@fashionisland",
      facebook: "Fashion Island"
    },
    tags: ["shopping", "mall", "retail", "luxury", "fashion"],
    dataSource: "manual"
  },
  {
    name: "Irvine Spectrum Center",
    description: "Popular outdoor shopping and entertainment destination",
    category: "Retail",
    website: "https://www.shopirvinespectrum.com",
    address: "71 Fortune Drive",
    city: "Irvine",
    state: "CA",
    zipCode: "92618",
    county: "Orange County",
    latitude: 33.6842,
    longitude: -117.8434,
    phone: "(949) 753-5180",
    hours: "10:00 AM - 10:00 PM",
    priceRange: "$$$",
    yearFounded: 1995,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Irvine_Spectrum_Center_2019.jpg/1200px-Irvine_Spectrum_Center_2019.jpg",
    logoUrl: "https://www.shopirvinespectrum.com/wp-content/uploads/2021/01/irvine-spectrum-logo.png",
    socialMedia: {
      instagram: "@irvinespectrum",
      facebook: "Irvine Spectrum Center"
    },
    tags: ["shopping", "entertainment", "dining", "retail", "outdoor mall"],
    dataSource: "manual"
  },
  {
    name: "Mission San Juan Capistrano",
    description: "Historic Spanish mission and cultural landmark",
    category: "Arts & Culture",
    website: "https://www.missionsjc.com",
    address: "26801 Ortega Highway",
    city: "San Juan Capistrano",
    state: "CA",
    zipCode: "92675",
    county: "Orange County",
    latitude: 33.5017,
    longitude: -117.6625,
    phone: "(949) 234-1300",
    hours: "9:00 AM - 5:00 PM",
    priceRange: "$$",
    yearFounded: 1776,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Mission_San_Juan_Capistrano_2019.jpg/1200px-Mission_San_Juan_Capistrano_2019.jpg",
    logoUrl: "https://www.missionsjc.com/wp-content/uploads/2021/01/mission-logo.png",
    socialMedia: {
      instagram: "@missionsjc",
      facebook: "Mission San Juan Capistrano"
    },
    tags: ["mission", "history", "culture", "landmark", "tourist attraction"],
    dataSource: "manual"
  },
  {
    name: "Balboa Island",
    description: "Charming island community with shops and waterfront dining",
    category: "Recreation",
    website: "https://www.balboaislandnewportbeach.com",
    address: "100 Marine Avenue",
    city: "Newport Beach",
    state: "CA",
    zipCode: "92662",
    county: "Orange County",
    latitude: 33.6056,
    longitude: -117.8928,
    phone: "(949) 673-7576",
    hours: "Varies",
    priceRange: "$$$",
    yearFounded: 1905,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Balboa_Island_2019.jpg/1200px-Balboa_Island_2019.jpg",
    logoUrl: "https://www.balboaislandnewportbeach.com/wp-content/uploads/2021/01/balboa-island-logo.png",
    socialMedia: {
      instagram: "@balboaisland",
      facebook: "Balboa Island"
    },
    tags: ["island", "shopping", "dining", "waterfront", "tourist attraction"],
    dataSource: "manual"
  },
  {
    name: "The Ritz-Carlton Laguna Niguel",
    description: "Luxury oceanfront resort and spa",
    category: "Hospitality",
    website: "https://www.ritzcarlton.com/en/hotels/california/laguna-niguel",
    address: "1 Ritz-Carlton Drive",
    city: "Dana Point",
    state: "CA",
    zipCode: "92629",
    county: "Orange County",
    latitude: 33.4647,
    longitude: -117.7036,
    phone: "(949) 240-2000",
    hours: "24/7",
    priceRange: "$$$$",
    yearFounded: 1984,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ritz_Carlton_Laguna_Niguel_2019.jpg/1200px-Ritz_Carlton_Laguna_Niguel_2019.jpg",
    logoUrl: "https://www.ritzcarlton.com/assets/logos/ritz-carlton-logo.png",
    socialMedia: {
      instagram: "@ritzcarlton",
      facebook: "The Ritz-Carlton"
    },
    tags: ["luxury", "resort", "hotel", "spa", "oceanfront"],
    dataSource: "manual"
  },
  {
    name: "Dana Point Harbor",
    description: "Scenic harbor with boat rentals and waterfront activities",
    category: "Recreation",
    website: "https://www.danapointharbor.com",
    address: "24699 Dana Point Harbor Drive",
    city: "Dana Point",
    state: "CA",
    zipCode: "92629",
    county: "Orange County",
    latitude: 33.4647,
    longitude: -117.7036,
    phone: "(949) 923-2255",
    hours: "24/7",
    priceRange: "$$",
    yearFounded: 1971,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Dana_Point_Harbor_2019.jpg/1200px-Dana_Point_Harbor_2019.jpg",
    logoUrl: "https://www.danapointharbor.com/wp-content/uploads/2021/01/dana-point-harbor-logo.png",
    socialMedia: {
      instagram: "@danapointharbor",
      facebook: "Dana Point Harbor"
    },
    tags: ["harbor", "boating", "waterfront", "recreation", "fishing"],
    dataSource: "manual"
  }
];

class DataIngestionService {
  private db: any;
  private rateLimiter: Map<string, number> = new Map();

  constructor() {
    this.db = getDB();
  }

  // Rate limiting helper
  private async checkRateLimit(source: string): Promise<boolean> {
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(source) || 0;
    const rateLimit = 1000; // requests per hour
    const minInterval = 3600000 / rateLimit; // milliseconds between requests
    
    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
    }
    
    this.rateLimiter.set(source, Date.now());
    return true;
  }

  // Validate business data
  private validateBusinessData(business: BusinessData): boolean {
    if (!business.name || business.name.trim() === '') {
      return false;
    }
    if (!business.category || business.category.trim() === '') {
      return false;
    }
    return true;
  }

  // Check for duplicate businesses
  private async findDuplicateBusiness(business: BusinessData): Promise<any | null> {
    if (!this.db) return null;

    try {
      // Check by name and city
      const existingBusiness = await this.db
        .select()
        .from(businesses)
        .where(
          and(
            ilike(businesses.name, business.name),
            ilike(businesses.city, business.city || '')
          )
        )
        .limit(1);

      return existingBusiness.length > 0 ? existingBusiness[0] : null;
    } catch (error) {
      console.error('Error checking for duplicate business:', error);
      return null;
    }
  }

  // Insert or update business
  private async upsertBusiness(business: BusinessData): Promise<{ success: boolean; businessId?: number; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const existingBusiness = await this.findDuplicateBusiness(business);

      if (existingBusiness) {
        // Update existing business
        const updateData = {
          name: business.name,
          description: business.description || null,
          category: business.category,
          website: business.website || null,
          address: business.address || null,
          city: business.city || null,
          state: business.state || null,
          zipCode: business.zipCode || null,
          county: business.county || null,
          neighborhood: business.neighborhood || null,
          latitude: business.latitude || null,
          longitude: business.longitude || null,
          phone: business.phone || null,
          email: business.email || null,
          hours: business.hours || null,
          priceRange: business.priceRange || null,
          yearFounded: business.yearFounded || null,
          employeeCount: business.employeeCount || null,
          businessSize: business.businessSize || null,
          imageUrl: business.imageUrl || null,
          logoUrl: business.logoUrl || null,
          socialMedia: business.socialMedia || {},
          attributes: business.attributes || {},
          dataQuality: business.dataQuality || 1,
          updatedAt: new Date()
        };

        await this.db
          .update(businesses)
          .set(updateData)
          .where(eq(businesses.id, existingBusiness.id));

        return { success: true, businessId: existingBusiness.id };
      } else {
        // Insert new business
        const insertData = {
          name: business.name,
          description: business.description || null,
          category: business.category,
          website: business.website || null,
          address: business.address || null,
          city: business.city || null,
          state: business.state || null,
          zipCode: business.zipCode || null,
          county: business.county || null,
          neighborhood: business.neighborhood || null,
          latitude: business.latitude || null,
          longitude: business.longitude || null,
          phone: business.phone || null,
          email: business.email || null,
          hours: business.hours || null,
          priceRange: business.priceRange || null,
          yearFounded: business.yearFounded || null,
          employeeCount: business.employeeCount || null,
          businessSize: business.businessSize || null,
          imageUrl: business.imageUrl || null,
          logoUrl: business.logoUrl || null,
          socialMedia: business.socialMedia || {},
          attributes: business.attributes || {},
          dataQuality: business.dataQuality || 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await this.db.insert(businesses).values(insertData).returning({ id: businesses.id });
        return { success: true, businessId: result[0].id };
      }
    } catch (error) {
      console.error('Error upserting business:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Process a single business
  private async processBusiness(business: BusinessData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate business data
      if (!this.validateBusinessData(business)) {
        return { success: false, error: 'Invalid business data' };
      }

      // Insert or update business
      const result = await this.upsertBusiness(business);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing business:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Import businesses in batches
  async importBusinessesInBatch(businesses: BusinessData[], batchSize: number = 10): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsAdded = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Process businesses in batches
      for (let i = 0; i < businesses.length; i += batchSize) {
        const batch = businesses.slice(i, i + batchSize);
        
        for (const business of batch) {
          recordsProcessed++;
          
          try {
            const result = await this.processBusiness(business);
            
            if (result.success) {
              // Check if it was an update or insert
              const existingBusiness = await this.findDuplicateBusiness(business);
              if (existingBusiness) {
                recordsUpdated++;
              } else {
                recordsAdded++;
              }
            } else {
              recordsFailed++;
              errors.push(`Failed to process ${business.name}: ${result.error}`);
            }
          } catch (error) {
            recordsFailed++;
            errors.push(`Error processing ${business.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Add a small delay between batches to avoid overwhelming the database
        if (i + batchSize < businesses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        recordsFailed,
        errors,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        recordsFailed,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration
      };
    }
  }

  // Import Orange County businesses
  async importOrangeCountyBusinesses(batchSize: number = 10): Promise<SyncResult> {
    console.log(`Starting import of ${ORANGE_COUNTY_BUSINESSES.length} Orange County businesses in batches of ${batchSize}`);
    
    const result = await this.importBusinessesInBatch(ORANGE_COUNTY_BUSINESSES, batchSize);
    
    console.log(`Import completed:`);
    console.log(`- Processed: ${result.recordsProcessed}`);
    console.log(`- Added: ${result.recordsAdded}`);
    console.log(`- Updated: ${result.recordsUpdated}`);
    console.log(`- Failed: ${result.recordsFailed}`);
    console.log(`- Duration: ${result.duration}ms`);
    
    if (result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach(error => console.log(`- ${error}`));
    }
    
    return result;
  }

  // Get business statistics
  async getBusinessStatistics(): Promise<any> {
    if (!this.db) {
      return { error: 'Database not available' };
    }

    try {
      const totalBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses);
      const businessesByCategory = await this.db
        .select({ category: businesses.category, count: sql`count(*)` })
        .from(businesses)
        .groupBy(businesses.category);
      const businessesByCity = await this.db
        .select({ city: businesses.city, count: sql`count(*)` })
        .from(businesses)
        .groupBy(businesses.city);

      return {
        totalBusinesses: totalBusinesses[0].count,
        businessesByCategory,
        businessesByCity
      };
    } catch (error) {
      console.error('Error getting business statistics:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export the service
export const dataIngestionService = new DataIngestionService();
export default DataIngestionService;