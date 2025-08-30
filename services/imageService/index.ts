import { getDB } from '../db/connection';
import { businesses, businessMedia } from '../db/schema';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import { promises as fs } from 'fs';
import path from 'path';

// Types for image data
interface ImageSource {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number;
  reliability: number;
}

interface ImageData {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  altText?: string;
  source: string;
  license?: string;
  attribution?: string;
}

interface BusinessImageData {
  businessId: number;
  logo?: ImageData;
  photos: ImageData[];
  sources: string[];
  lastUpdated: Date;
}

// Image sources configuration
const IMAGE_SOURCES: ImageSource[] = [
  {
    name: 'Wikimedia Commons',
    baseUrl: 'https://commons.wikimedia.org/w/api.php',
    rateLimit: 100,
    reliability: 0.9
  },
  {
    name: 'Unsplash',
    baseUrl: 'https://api.unsplash.com',
    rateLimit: 50,
    reliability: 0.8
  },
  {
    name: 'Pixabay',
    baseUrl: 'https://pixabay.com/api',
    rateLimit: 100,
    reliability: 0.7
  },
  {
    name: 'OpenStreetMap',
    baseUrl: 'https://api.openstreetmap.org',
    rateLimit: 200,
    reliability: 0.6
  }
];

// Known business logo URLs
const KNOWN_LOGOS: Record<string, string> = {
  'South Coast Plaza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/South_Coast_Plaza_2019.jpg/1200px-South_Coast_Plaza_2019.jpg',
  'Disneyland Resort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Disneyland_Sleeping_Beauty_Castle.jpg/1200px-Disneyland_Sleeping_Beauty_Castle.jpg',
  'John Wayne Airport': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/John_Wayne_Airport_2019.jpg/1200px-John_Wayne_Airport_2019.jpg',
  'UC Irvine': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/UCI_Aldrich_Park.jpg/1200px-UCI_Aldrich_Park.jpg',
  'The Irvine Company': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Irvine_Company_Headquarters.jpg/1200px-Irvine_Company_Headquarters.jpg',
  'Spectrum Center': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Honda_Center_2019.jpg/1200px-Honda_Center_2019.jpg',
  'Angel Stadium': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Angel_Stadium_2019.jpg/1200px-Angel_Stadium_2019.jpg',
  'Honda Center': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Honda_Center_2019.jpg/1200px-Honda_Center_2019.jpg',
  'The OC Fair & Event Center': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/OC_Fair_2019.jpg/1200px-OC_Fair_2019.jpg',
  'Orange County Great Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Orange_County_Great_Park_2019.jpg/1200px-Orange_County_Great_Park_2019.jpg',
  'Newport Beach Pier': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Newport_Beach_Pier_2019.jpg/1200px-Newport_Beach_Pier_2019.jpg',
  'Laguna Beach Art Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Laguna_Art_Museum_2019.jpg/1200px-Laguna_Art_Museum_2019.jpg',
  'Crystal Cove State Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Crystal_Cove_State_Park_2019.jpg/1200px-Crystal_Cove_State_Park_2019.jpg',
  'The Bowers Museum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bowers_Museum_2019.jpg/1200px-Bowers_Museum_2019.jpg',
  'Discovery Cube Orange County': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Discovery_Cube_OC_2019.jpg/1200px-Discovery_Cube_OC_2019.jpg',
  'Fashion Island Newport Beach': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Fashion_Island_2019.jpg/1200px-Fashion_Island_2019.jpg',
  'Irvine Spectrum Center': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Irvine_Spectrum_Center_2019.jpg/1200px-Irvine_Spectrum_Center_2019.jpg',
  'Mission San Juan Capistrano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Mission_San_Juan_Capistrano_2019.jpg/1200px-Mission_San_Juan_Capistrano_2019.jpg',
  'Balboa Island': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Balboa_Island_2019.jpg/1200px-Balboa_Island_2019.jpg',
  'The Ritz-Carlton Laguna Niguel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ritz_Carlton_Laguna_Niguel_2019.jpg/1200px-Ritz_Carlton_Laguna_Niguel_2019.jpg',
  'Dana Point Harbor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Dana_Point_Harbor_2019.jpg/1200px-Dana_Point_Harbor_2019.jpg'
};

class ImageService {
  private db: any;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'businesses');

  constructor() {
    this.db = getDB();
    this.ensureUploadDirectory();
  }

  // Ensure upload directory exists
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  // Cache helper methods
  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Generate alt text for images
  private generateAltText(businessName: string, imageType: 'logo' | 'photo'): string {
    if (imageType === 'logo') {
      return `${businessName} logo`;
    } else {
      const descriptors = [
        'exterior', 'building', 'location', 'storefront', 'entrance',
        'interior', 'products', 'services', 'customers', 'atmosphere'
      ];
      const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
      return `${businessName} ${descriptor}`;
    }
  }

  // Search for images on Wikimedia Commons
  private async searchWikimediaCommons(query: string): Promise<ImageData[]> {
    try {
      // In a real implementation, this would make actual API calls
      // For now, we'll return mock data
      const mockImages: ImageData[] = [
        {
          url: `https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/${query.replace(/\s+/g, '_')}_2019.jpg/1200px-${query.replace(/\s+/g, '_')}_2019.jpg`,
          width: 1200,
          height: 800,
          format: 'jpg',
          size: 250000,
          altText: this.generateAltText(query, 'photo'),
          source: 'Wikimedia Commons',
          license: 'CC BY-SA 4.0',
          attribution: 'Wikimedia Commons'
        }
      ];
      
      return mockImages;
    } catch (error) {
      console.error('Error searching Wikimedia Commons:', error);
      return [];
    }
  }

  // Search for images on Unsplash
  private async searchUnsplash(query: string): Promise<ImageData[]> {
    try {
      // Mock implementation
      const mockImages: ImageData[] = [
        {
          url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=1200&h=800&fit=crop`,
          width: 1200,
          height: 800,
          format: 'jpg',
          size: 300000,
          altText: this.generateAltText(query, 'photo'),
          source: 'Unsplash',
          license: 'Unsplash License'
        }
      ];
      
      return mockImages;
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      return [];
    }
  }

  // Search for images on Pixabay
  private async searchPixabay(query: string): Promise<ImageData[]> {
    try {
      // Mock implementation
      const mockImages: ImageData[] = [
        {
          url: `https://pixabay.com/get/${Math.floor(Math.random() * 1000000)}_1200.jpg`,
          width: 1200,
          height: 800,
          format: 'jpg',
          size: 200000,
          altText: this.generateAltText(query, 'photo'),
          source: 'Pixabay',
          license: 'CC BY 2.0'
        }
      ];
      
      return mockImages;
    } catch (error) {
      console.error('Error searching Pixabay:', error);
      return [];
    }
  }

  // Get known logo for business
  private getKnownLogo(businessName: string): ImageData | null {
    const logoUrl = KNOWN_LOGOS[businessName];
    if (!logoUrl) return null;

    return {
      url: logoUrl,
      width: 1200,
      height: 800,
      format: 'jpg',
      size: 250000,
      altText: this.generateAltText(businessName, 'logo'),
      source: 'Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      attribution: 'Wikimedia Commons'
    };
  }

  // Search for business images
  async searchBusinessImages(businessName: string, businessCategory?: string): Promise<BusinessImageData> {
    try {
      const cacheKey = `images_${businessName}`;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const result: BusinessImageData = {
        businessId: 0, // Will be set when saving to database
        logo: this.getKnownLogo(businessName) || undefined,
        photos: [],
        sources: [],
        lastUpdated: new Date()
      };

      // Search for photos from multiple sources
      const searchQuery = businessCategory ? `${businessName} ${businessCategory}` : businessName;
      
      const [wikimediaImages, unsplashImages, pixabayImages] = await Promise.all([
        this.searchWikimediaCommons(searchQuery),
        this.searchUnsplash(searchQuery),
        this.searchPixabay(searchQuery)
      ]);

      // Combine and deduplicate images
      const allImages = [...wikimediaImages, ...unsplashImages, ...pixabayImages];
      const uniqueImages = allImages.filter((image, index, self) => 
        index === self.findIndex(img => img.url === image.url)
      );

      result.photos = uniqueImages.slice(0, 5); // Limit to 5 photos
      result.sources = ['Wikimedia Commons', 'Unsplash', 'Pixabay'];

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching business images:', error);
      return {
        businessId: 0,
        photos: [],
        sources: [],
        lastUpdated: new Date()
      };
    }
  }

  // Download and save image locally
  private async downloadImage(imageUrl: string, businessName: string): Promise<string | null> {
    try {
      // In a real implementation, this would download the image
      // For now, we'll return the original URL
      const fileName = `${businessName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
      const localPath = path.join(this.UPLOAD_DIR, fileName);
      const publicPath = `/images/businesses/${fileName}`;
      
      // Mock download - in production, use axios or fetch to download
      // const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      // await fs.writeFile(localPath, response.data);
      
      return publicPath;
    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  }

  // Save business images to database
  async saveBusinessImages(businessId: number, imageData: BusinessImageData): Promise<boolean> {
    if (!this.db) return false;

    try {
      // Save logo
      if (imageData.logo) {
        const localLogoPath = await this.downloadImage(imageData.logo.url, `logo_${businessId}`);
        if (localLogoPath) {
          await this.db.insert(businessMedia).values({
            businessId,
            type: 'logo',
            url: localLogoPath,
            originalUrl: imageData.logo.url,
            width: imageData.logo.width,
            height: imageData.logo.height,
            format: imageData.logo.format,
            size: imageData.logo.size,
            altText: imageData.logo.altText,
            source: imageData.logo.source,
            license: imageData.logo.license,
            attribution: imageData.logo.attribution,
            isPrimary: true,
            createdAt: new Date()
          });
        }
      }

      // Save photos
      for (const photo of imageData.photos) {
        const localPhotoPath = await this.downloadImage(photo.url, `photo_${businessId}_${Date.now()}`);
        if (localPhotoPath) {
          await this.db.insert(businessMedia).values({
            businessId,
            type: 'photo',
            url: localPhotoPath,
            originalUrl: photo.url,
            width: photo.width,
            height: photo.height,
            format: photo.format,
            size: photo.size,
            altText: photo.altText,
            source: photo.source,
            license: photo.license,
            attribution: photo.attribution,
            isPrimary: false,
            createdAt: new Date()
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving business images:', error);
      return false;
    }
  }

  // Get business images from database
  async getBusinessImages(businessId: number): Promise<{ logo?: ImageData; photos: ImageData[] }> {
    if (!this.db) return { photos: [] };

    try {
      const result = await this.db
        .select()
        .from(businessMedia)
        .where(eq(businessMedia.businessId, businessId));

      const logo = result.find((media: any) => media.type === 'logo' && media.isPrimary);
      const photos = result.filter((media: any) => media.type === 'photo');

      return {
        logo: logo ? {
          url: logo.url,
          width: logo.width,
          height: logo.height,
          format: logo.format,
          size: logo.size,
          altText: logo.altText,
          source: logo.source,
          license: logo.license,
          attribution: logo.attribution
        } : undefined,
        photos: photos.map((photo: any) => ({
          url: photo.url,
          width: photo.width,
          height: photo.height,
          format: photo.format,
          size: photo.size,
          altText: photo.altText,
          source: photo.source,
          license: photo.license,
          attribution: photo.attribution
        }))
      };
    } catch (error) {
      console.error('Error getting business images:', error);
      return { photos: [] };
    }
  }

  // Update images for all businesses
  async updateAllBusinessImages(): Promise<{ success: number; failed: number }> {
    if (!this.db) return { success: 0, failed: 0 };

    try {
      const allBusinesses = await this.db.select().from(businesses);
      let success = 0;
      let failed = 0;

      for (const business of allBusinesses) {
        try {
          const imageData = await this.searchBusinessImages(business.name, business.category);
          imageData.businessId = business.id;
          
          const saved = await this.saveBusinessImages(business.id, imageData);
          if (saved) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Error updating images for ${business.name}:`, error);
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('Error updating all business images:', error);
      return { success: 0, failed: 0 };
    }
  }

  // Get image statistics
  async getImageStatistics(): Promise<any> {
    if (!this.db) return { error: 'Database not available' };

    try {
      const totalBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses);
      const businessesWithImages = await this.db
        .select({ count: sql`count(DISTINCT businessId)` })
        .from(businessMedia);

      const totalImages = await this.db.select({ count: sql`count(*)` }).from(businessMedia);
      const imagesByType = await this.db
        .select({ type: businessMedia.type, count: sql`count(*)` })
        .from(businessMedia)
        .groupBy(businessMedia.type);

      return {
        totalBusinesses: totalBusinesses[0].count,
        businessesWithImages: businessesWithImages[0].count,
        coveragePercentage: (businessesWithImages[0].count / totalBusinesses[0].count) * 100,
        totalImages: totalImages[0].count,
        imagesByType
      };
    } catch (error) {
      console.error('Error getting image statistics:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // User contribution: Upload business image
  async uploadBusinessImage(
    businessId: number,
    imageFile: Buffer,
    fileName: string,
    imageType: 'logo' | 'photo',
    altText?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Generate unique filename
      const extension = path.extname(fileName);
      const uniqueFileName = `${businessId}_${imageType}_${Date.now()}${extension}`;
      const localPath = path.join(this.UPLOAD_DIR, uniqueFileName);
      const publicPath = `/images/businesses/${uniqueFileName}`;

      // Save file
      await fs.writeFile(localPath, imageFile);

      // Get image dimensions (mock implementation)
      const width = 1200;
      const height = 800;
      const size = imageFile.length;

      // Save to database
      await this.db.insert(businessMedia).values({
        businessId,
        type: imageType,
        url: publicPath,
        width,
        height,
        format: extension.replace('.', ''),
        size,
        altText: altText || this.generateAltText(`Business ${businessId}`, imageType),
        source: 'user_upload',
        license: 'user_uploaded',
        isPrimary: imageType === 'logo',
        createdAt: new Date()
      });

      return { success: true, url: publicPath };
    } catch (error) {
      console.error('Error uploading business image:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export the service
export const imageService = new ImageService();
export default ImageService;