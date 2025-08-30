import { cleanStateName } from '../constants/states/stateMap';

// Business data processor for cleaning and normalizing scraped data
export default class BusinessDataProcessor {
  /**
   * Clean and normalize business data
   */
  static cleanBusinessData(rawData: any): any {
    if (!rawData) {
      throw new Error('Raw data is required');
    }

    const cleanedData: any = {
      name: this.cleanString(rawData.name || rawData.title || ''),
      description: this.cleanString(rawData.description || rawData.summary || ''),
      category: this.cleanCategory(rawData.category || rawData.type || ''),
      address: this.cleanAddress(rawData.address || rawData.location || ''),
      city: this.cleanString(rawData.city || rawData.locality || ''),
      state: cleanStateName(rawData.state || rawData.region || ''),
      zipCode: this.cleanZipCode(rawData.zipCode || rawData.postalCode || ''),
      phone: this.cleanPhone(rawData.phone || rawData.phoneNumber || ''),
      email: this.cleanEmail(rawData.email || rawData.contactEmail || ''),
      website: this.cleanWebsite(rawData.website || rawData.url || ''),
      latitude: this.cleanNumber(rawData.latitude || rawData.lat),
      longitude: this.cleanNumber(rawData.longitude || rawData.lng),
      rating: this.cleanNumber(rawData.rating || rawData.score),
      reviewCount: this.cleanNumber(rawData.reviewCount || rawData.reviews),
      imageUrl: this.cleanUrl(rawData.imageUrl || rawData.logo || rawData.image),
      isActive: rawData.isActive !== false,
      dataQuality: this.calculateDataQuality(rawData),
      source: this.cleanSource(rawData.source || 'Unknown'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return cleanedData;
  }

  /**
   * Clean string values
   */
  private static cleanString(value: any): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ');
  }

  /**
   * Clean category values
   */
  private static cleanCategory(value: any): string {
    const category = this.cleanString(value);
    if (!category) return 'Uncategorized';
    
    // Normalize common category variations
    const categoryMap: { [key: string]: string } = {
      'restaurant': 'Food & Dining',
      'food': 'Food & Dining',
      'dining': 'Food & Dining',
      'cafe': 'Food & Dining',
      'bar': 'Food & Dining',
      'retail': 'Retail',
      'shop': 'Retail',
      'store': 'Retail',
      'shopping': 'Retail',
      'healthcare': 'Healthcare',
      'medical': 'Healthcare',
      'hospital': 'Healthcare',
      'clinic': 'Healthcare',
      'professional': 'Professional Services',
      'legal': 'Professional Services',
      'financial': 'Professional Services',
      'consulting': 'Professional Services',
      'entertainment': 'Entertainment',
      'movie': 'Entertainment',
      'theater': 'Entertainment',
      'music': 'Entertainment',
      'education': 'Education',
      'school': 'Education',
      'university': 'Education',
      'training': 'Education',
      'travel': 'Travel & Tourism',
      'hotel': 'Travel & Tourism',
      'tourism': 'Travel & Tourism',
      'automotive': 'Automotive',
      'car': 'Automotive',
      'repair': 'Automotive',
      'real estate': 'Real Estate',
      'property': 'Real Estate',
      'housing': 'Real Estate',
      'technology': 'Technology',
      'tech': 'Technology',
      'software': 'Technology',
      'fitness': 'Fitness & Wellness',
      'gym': 'Fitness & Wellness',
      'wellness': 'Fitness & Wellness',
      'beauty': 'Beauty & Personal Care',
      'salon': 'Beauty & Personal Care',
      'spa': 'Beauty & Personal Care',
      'home services': 'Home Services',
      'plumbing': 'Home Services',
      'electrical': 'Home Services',
      'cleaning': 'Home Services',
      'bank': 'Financial Services',
      'credit union': 'Financial Services',
      'investment': 'Financial Services',
      'government': 'Government & Public Services',
      'public': 'Government & Public Services',
      'non-profit': 'Non-profit & Organizations',
      'charity': 'Non-profit & Organizations',
      'manufacturing': 'Manufacturing & Industrial',
      'industrial': 'Manufacturing & Industrial',
      'agriculture': 'Agriculture',
      'farm': 'Agriculture',
      'media': 'Media & Publishing',
      'publishing': 'Media & Publishing',
      'broadcasting': 'Media & Publishing',
      'legal services': 'Legal Services',
      'law': 'Legal Services'
    };

    const normalizedCategory = category.toLowerCase();
    for (const [key, normalized] of Object.entries(categoryMap)) {
      if (normalizedCategory.includes(key)) {
        return normalized;
      }
    }

    return category;
  }

  /**
   * Clean address values
   */
  private static cleanAddress(value: any): string {
    const address = this.cleanString(value);
    if (!address) return '';
    
    // Remove extra whitespace and normalize
    return address.replace(/\s+/g, ' ').replace(/,\s*$/, '');
  }

  /**
   * Clean phone numbers
   */
  private static cleanPhone(value: any): string {
    const phone = this.cleanString(value);
    if (!phone) return '';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if it's 10 digits
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    return phone;
  }

  /**
   * Clean email addresses
   */
  private static cleanEmail(value: any): string {
    const email = this.cleanString(value);
    if (!email) return '';
    
    // Basic email validation
    if (email.includes('@') && email.includes('.')) {
      return email.toLowerCase();
    }
    
    return '';
  }

  /**
   * Clean website URLs
   */
  private static cleanWebsite(value: any): string {
    const website = this.cleanString(value);
    if (!website) return '';
    
    // Add https:// if missing
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      return `https://${website}`;
    }
    
    return website;
  }

  /**
   * Clean numeric values
   */
  private static cleanNumber(value: any): number | undefined {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    }
    
    return undefined;
  }

  /**
   * Clean zip codes
   */
  private static cleanZipCode(value: any): string {
    const zip = this.cleanString(value);
    if (!zip) return '';
    
    // Remove non-digit characters
    const digits = zip.replace(/\D/g, '');
    
    // Return as 5 digits or 5+4 format
    if (digits.length === 5) {
      return digits;
    } else if (digits.length === 9) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    
    return zip;
  }

  /**
   * Clean URLs
   */
  private static cleanUrl(value: any): string {
    const url = this.cleanString(value);
    if (!url) return '';
    
    try {
      new URL(url);
      return url;
    } catch {
      // If it's not a full URL, try to make it one
      if (url.startsWith('/')) {
        return `https://example.com${url}`;
      } else if (url.startsWith('www.')) {
        return `https://${url}`;
      } else {
        return `https://${url}`;
      }
    }
  }

  /**
   * Clean source values
   */
  private static cleanSource(value: any): string {
    const source = this.cleanString(value);
    if (!source) return 'Unknown';
    
    // Normalize source names
    const sourceMap: { [key: string]: string } = {
      'google': 'Google',
      'bing': 'Bing',
      'yahoo': 'Yahoo',
      'yellowpages': 'Yellow Pages',
      'yelp': 'Yelp',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'linkedin': 'LinkedIn',
      'instagram': 'Instagram'
    };

    const normalizedSource = source.toLowerCase();
    for (const [key, normalized] of Object.entries(sourceMap)) {
      if (normalizedSource.includes(key)) {
        return normalized;
      }
    }

    return source;
  }

  /**
   * Calculate data quality score
   */
  private static calculateDataQuality(data: any): number {
    let score = 0;
    let maxScore = 0;

    // Name (required)
    if (data.name && data.name.length > 0) {
      score += 20;
    }
    maxScore += 20;

    // Category
    if (data.category && data.category.length > 0) {
      score += 15;
    }
    maxScore += 15;

    // Address
    if (data.address && data.address.length > 0) {
      score += 15;
    }
    maxScore += 15;

    // City
    if (data.city && data.city.length > 0) {
      score += 10;
    }
    maxScore += 10;

    // State
    if (data.state && data.state.length > 0) {
      score += 10;
    }
    maxScore += 10;

    // Zip Code
    if (data.zipCode && data.zipCode.length > 0) {
      score += 10;
    }
    maxScore += 10;

    // Phone
    if (data.phone && data.phone.length > 0) {
      score += 10;
    }
    maxScore += 10;

    // Website
    if (data.website && data.website.length > 0) {
      score += 10;
    }
    maxScore += 10;

    // Rating
    if (data.rating && data.rating > 0) {
      score += 5;
    }
    maxScore += 5;

    // Review Count
    if (data.reviewCount && data.reviewCount > 0) {
      score += 5;
    }
    maxScore += 5;

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Validate business data
   */
  static validateBusinessData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!data.name || data.name.length < 2) {
      errors.push('Business name is required and must be at least 2 characters');
    }

    if (!data.address || data.address.length < 5) {
      errors.push('Business address is required and must be at least 5 characters');
    }

    if (!data.city || data.city.length < 2) {
      errors.push('Business city is required and must be at least 2 characters');
    }

    if (!data.state || data.state.length < 2) {
      errors.push('Business state is required and must be at least 2 characters');
    }

    if (!data.zipCode || data.zipCode.length < 5) {
      errors.push('Business zip code is required and must be at least 5 characters');
    }

    // Optional field validation
    if (data.phone && !/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) {
      errors.push('Phone number must be 10 digits');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email address is invalid');
    }

    if (data.website && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(data.website)) {
      errors.push('Website URL is invalid');
    }

    if (data.rating && (data.rating < 0 || data.rating > 5)) {
      errors.push('Rating must be between 0 and 5');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Deduplicate business data
   */
  static deduplicateBusinesses(businesses: any[]): any[] {
    const uniqueBusinesses = new Map<string, any>();

    for (const business of businesses) {
      // Create a unique key based on name and address
      const key = `${business.name.toLowerCase().trim()}|${(business.address || '').toLowerCase().trim()}`;
      
      if (!uniqueBusinesses.has(key)) {
        uniqueBusinesses.set(key, business);
      } else {
        // If duplicate exists, keep the one with higher data quality
        const existing = uniqueBusinesses.get(key);
        if ((business.dataQuality || 0) > (existing.dataQuality || 0)) {
          uniqueBusinesses.set(key, business);
        }
      }
    }

    return Array.from(uniqueBusinesses.values());
  }

  /**
   * Filter businesses by minimum data quality
   */
  static filterByQuality(businesses: any[], minQuality: number = 50): any[] {
    return businesses.filter(business => (business.dataQuality || 0) >= minQuality);
  }

  /**
   * Filter businesses by category
   */
  static filterByCategory(businesses: any[], category: string): any[] {
    const normalizedCategory = category.toLowerCase();
    return businesses.filter(business => {
      const businessCategory = business.category || '';
      return businessCategory.toLowerCase().includes(normalizedCategory);
    });
  }

  /**
   * Filter businesses by state
   */
  static filterByState(businesses: any[], state: string): any[] {
    const normalizedState = state.toUpperCase();
    return businesses.filter(business => {
      const businessState = business.state || '';
      return businessState.toUpperCase() === normalizedState;
    });
  }

  /**
   * Search businesses by keyword
   */
  static searchBusinesses(businesses: any[], keyword: string): any[] {
    const normalizedKeyword = keyword.toLowerCase();
    return businesses.filter(business => {
      const searchableText = `${business.name} ${business.description || ''} ${business.category || ''} ${business.address || ''}`.toLowerCase();
      return searchableText.includes(normalizedKeyword);
    });
  }

  /**
   * Get statistics for business data
   */
  static getBusinessStats(businesses: any[]): any {
    const stats: any = {
      totalBusinesses: businesses.length,
      byState: {},
      byCategory: {},
      averageRating: 0,
      averageDataQuality: 0,
      businessesWithPhone: 0,
      businessesWithWebsite: 0,
      businessesWithEmail: 0
    };

    let totalRating = 0;
    let totalQuality = 0;
    let ratingCount = 0;
    let qualityCount = 0;

    for (const business of businesses) {
      // Count by state
      const state = business.state || 'Unknown';
      stats.byState[state] = (stats.byState[state] || 0) + 1;

      // Count by category
      const category = business.category || 'Uncategorized';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Calculate averages
      if (business.rating) {
        totalRating += business.rating;
        ratingCount++;
      }

      if (business.dataQuality) {
        totalQuality += business.dataQuality;
        qualityCount++;
      }

      // Count features
      if (business.phone) stats.businessesWithPhone++;
      if (business.website) stats.businessesWithWebsite++;
      if (business.email) stats.businessesWithEmail++;
    }

    // Calculate averages
    stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    stats.averageDataQuality = qualityCount > 0 ? totalQuality / qualityCount : 0;

    // Sort by count
    stats.byState = Object.entries(stats.byState)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .reduce((obj: Record<string, number>, [key, value]) => {
        obj[key] = value as number;
        return obj;
      }, {});

    stats.byCategory = Object.entries(stats.byCategory)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .reduce((obj: Record<string, number>, [key, value]) => {
        obj[key] = value as number;
        return obj;
      }, {});

    return stats;
  }

  /**
   * Export business data to CSV
   */
  static exportToCSV(businesses: any[]): string {
    if (!businesses || businesses.length === 0) {
      return '';
    }

    const headers = [
      'Name',
      'Description',
      'Category',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Phone',
      'Email',
      'Website',
      'Latitude',
      'Longitude',
      'Rating',
      'Review Count',
      'Image URL',
      'Data Quality',
      'Source',
      'Created At',
      'Updated At'
    ];

    const rows = businesses.map(business => [
      business.name || '',
      business.description || '',
      business.category || '',
      business.address || '',
      business.city || '',
      business.state || '',
      business.zipCode || '',
      business.phone || '',
      business.email || '',
      business.website || '',
      business.latitude || '',
      business.longitude || '',
      business.rating || '',
      business.reviewCount || '',
      business.imageUrl || '',
      business.dataQuality || '',
      business.source || '',
      business.createdAt ? new Date(business.createdAt).toISOString() : '',
      business.updatedAt ? new Date(business.updatedAt).toISOString() : ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${(field || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }

  /**
   * Export business data to JSON
   */
  static exportToJSON(businesses: any[]): string {
    return JSON.stringify(businesses, null, 2);
  }

  /**
   * Export business data to XML
   */
  static exportToXML(businesses: any[]): string {
    if (!businesses || businesses.length === 0) {
      return '<?xml version="1.0" encoding="UTF-8"?><businesses/>';
    }

    const businessElements = businesses.map(business => `
    <business>
      <name>${this.escapeXml(business.name || '')}</name>
      <description>${this.escapeXml(business.description || '')}</description>
      <category>${this.escapeXml(business.category || '')}</category>
      <address>${this.escapeXml(business.address || '')}</address>
      <city>${this.escapeXml(business.city || '')}</city>
      <state>${this.escapeXml(business.state || '')}</state>
      <zipCode>${this.escapeXml(business.zipCode || '')}</zipCode>
      <phone>${this.escapeXml(business.phone || '')}</phone>
      <email>${this.escapeXml(business.email || '')}</email>
      <website>${this.escapeXml(business.website || '')}</website>
      <latitude>${business.latitude || ''}</latitude>
      <longitude>${business.longitude || ''}</longitude>
      <rating>${business.rating || ''}</rating>
      <reviewCount>${business.reviewCount || ''}</reviewCount>
      <imageUrl>${this.escapeXml(business.imageUrl || '')}</imageUrl>
      <dataQuality>${business.dataQuality || ''}</dataQuality>
      <source>${this.escapeXml(business.source || '')}</source>
      <createdAt>${business.createdAt ? new Date(business.createdAt).toISOString() : ''}</createdAt>
      <updatedAt>${business.updatedAt ? new Date(business.updatedAt).toISOString() : ''}</updatedAt>
    </business>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<businesses>
${businessElements}
</businesses>`;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}