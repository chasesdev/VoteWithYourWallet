import axios from 'axios';
import { JSDOM } from 'jsdom';
import { ScrapingConfig } from './types';

// Default scraping configuration
const DEFAULT_CONFIG: ScrapingConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  rateLimitDelay: 2000,
  maxConcurrent: 5
};

/**
 * HTTP client with retry logic and rate limiting
 */
export class HttpClient {
  private config: ScrapingConfig;
  private requestQueue: Promise<any>[] = [];

  constructor(config: ScrapingConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Make HTTP GET request with retry logic
   */
  async get(url: string, options: any = {}): Promise<any> {
    return this.retryRequest(() => 
      axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...options.headers
        },
        ...options
      })
    );
  }

  /**
   * Make HTTP POST request with retry logic
   */
  async post(url: string, data: any, options: any = {}): Promise<any> {
    return this.retryRequest(() => 
      axios.post(url, data, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })
    );
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest(requestFn: () => Promise<any>): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Apply rate limiting
        if (this.requestQueue.length >= this.config.maxConcurrent) {
          await Promise.race(this.requestQueue);
        }

        const promise = requestFn()
          .finally(() => {
            this.requestQueue = this.requestQueue.filter(p => p !== promise);
          });

        this.requestQueue.push(promise);
        return await promise;
      } catch (error: any) {
        lastError = error;
        
        if (attempt === this.config.maxRetries) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * DOM parsing utilities
 */
export class DOMParser {
  /**
   * Parse HTML string and return JSDOM instance
   */
  static parse(html: string): JSDOM {
    return new JSDOM(html);
  }

  /**
   * Extract text content from element
   */
  static extractText(element: Element | null, defaultValue: string = ''): string {
    return element?.textContent?.trim() || defaultValue;
  }

  /**
   * Extract attribute from element
   */
  static extractAttribute(element: Element | null, attribute: string, defaultValue: string = ''): string {
    return element?.getAttribute(attribute) || defaultValue;
  }

  /**
   * Extract all elements matching selector
   */
  static extractElements(dom: JSDOM, selector: string): Element[] {
    const document = dom.window.document;
    return Array.from(document.querySelectorAll(selector));
  }

  /**
   * Extract first element matching selector
   */
  static extractElement(dom: JSDOM, selector: string): Element | null {
    const document = dom.window.document;
    return document.querySelector(selector);
  }

  /**
   * Extract business name from various possible selectors
   */
  static extractBusinessName(dom: JSDOM): string {
    const selectors = [
      'h1', '.business-name', '.company-name', '.org', 
      '[itemprop="name"]', '.title', '.heading'
    ];
    
    for (const selector of selectors) {
      const element = this.extractElement(dom, selector);
      if (element) {
        const text = this.extractText(element);
        if (text.length > 2 && text.length < 200) {
          return text;
        }
      }
    }
    
    return '';
  }

  /**
   * Extract address from various possible selectors
   */
  static extractAddress(dom: JSDOM): string {
    const selectors = [
      '.address', '.location', '.street-address',
      '[itemprop="address"]', '.contact-info'
    ];
    
    for (const selector of selectors) {
      const element = this.extractElement(dom, selector);
      if (element) {
        const text = this.extractText(element);
        if (text.includes(',') || text.includes('St') || text.includes('Ave')) {
          return text;
        }
      }
    }
    
    return '';
  }

  /**
   * Extract phone number from various possible selectors
   */
  static extractPhone(dom: JSDOM): string {
    const selectors = [
      '.phone', '.tel', '[itemprop="telephone"]', '.contact-phone'
    ];
    
    for (const selector of selectors) {
      const element = this.extractElement(dom, selector);
      if (element) {
        const text = this.extractText(element);
        const phoneRegex = /\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/;
        const match = text.match(phoneRegex);
        if (match) {
          return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
      }
    }
    
    return '';
  }

  /**
   * Extract website URL from various possible selectors
   */
  static extractWebsite(dom: JSDOM): string {
    const selectors = [
      '.website', '.url', '[itemprop="url"]', '.site'
    ];
    
    for (const selector of selectors) {
      const element = this.extractElement(dom, selector);
      if (element) {
        const href = this.extractAttribute(element, 'href');
        if (href && href.startsWith('http')) {
          return href;
        }
      }
    }
    
    return '';
  }

  /**
   * Extract category/industry from various possible selectors
   */
  static extractCategory(dom: JSDOM): string {
    const selectors = [
      '.category', '.industry', '.sector',
      '[itemprop="category"]', '.type'
    ];
    
    for (const selector of selectors) {
      const element = this.extractElement(dom, selector);
      if (element) {
        const text = this.extractText(element);
        if (text.length > 2 && text.length < 100) {
          return text;
        }
      }
    }
    
    return '';
  }
}

/**
 * URL utilities
 */
export class URLUtils {
  /**
   * Generate search URL for a city and industry
   */
  static generateSearchURL(city: string, industry: string, source: string = 'google'): string {
    const encodedCity = encodeURIComponent(city);
    const encodedIndustry = encodeURIComponent(industry);
    
    switch (source) {
      case 'google':
        return `https://www.google.com/search?q=${encodedIndustry}+${encodedCity}+business`;
      case 'bing':
        return `https://www.bing.com/search?q=${encodedIndustry}+${encodedCity}+business`;
      case 'yahoo':
        return `https://search.yahoo.com/search?p=${encodedIndustry}+${encodedCity}+business`;
      default:
        return `https://www.google.com/search?q=${encodedIndustry}+${encodedCity}+business`;
    }
  }

  /**
   * Generate business directory URL
   */
  static generateDirectoryURL(city: string, industry: string, directory: string = 'yellowpages'): string {
    const encodedCity = encodeURIComponent(city);
    const encodedIndustry = encodeURIComponent(industry);
    
    switch (directory) {
      case 'yellowpages':
        return `https://www.yellowpages.com/search?search_terms=${encodedIndustry}&geo_location_terms=${encodedCity}`;
      case 'yelp':
        return `https://www.yelp.com/search?find_desc=${encodedIndustry}&find_loc=${encodedCity}`;
      case 'manta':
        return `https://www.manta.com/search?q=${encodedIndustry}&loc=${encodedCity}`;
      default:
        return `https://www.yellowpages.com/search?search_terms=${encodedIndustry}&geo_location_terms=${encodedCity}`;
    }
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }
}

/**
 * Search engine scraper
 */
export class SearchEngineScraper {
  private httpClient: HttpClient;

  constructor(config: ScrapingConfig = DEFAULT_CONFIG) {
    this.httpClient = new HttpClient(config);
  }

  /**
   * Search Google for businesses in a city and industry
   */
  async searchGoogle(city: string, industry: string): Promise<string[]> {
    const url = URLUtils.generateSearchURL(city, industry, 'google');
    const response = await this.httpClient.get(url);
    const dom = DOMParser.parse(response.data);
    
    const selectors = [
      '.g', '.rc', 'div[role="article"]', '.search-result'
    ];
    
    const businessLinks: string[] = [];
    
    for (const selector of selectors) {
      const elements = DOMParser.extractElements(dom, selector);
      for (const element of elements) {
        const link = DOMParser.extractAttribute(element, 'href');
        if (link && URLUtils.isValidURL(link)) {
          const domain = URLUtils.extractDomain(link);
          if (domain && !businessLinks.includes(domain)) {
            businessLinks.push(domain);
          }
        }
      }
    }
    
    return businessLinks.slice(0, 10); // Limit to first 10 results
  }

  /**
   * Search business directory for businesses in a city and industry
   */
  async searchDirectory(city: string, industry: string, directory: string = 'yellowpages'): Promise<string[]> {
    const url = URLUtils.generateDirectoryURL(city, industry, directory);
    const response = await this.httpClient.get(url);
    const dom = DOMParser.parse(response.data);
    
    const selectors = [
      '.business-name', '.company-name', 'a[href*="/profile/"]',
      '.listing-title', '.result-title'
    ];
    
    const businessLinks: string[] = [];
    
    for (const selector of selectors) {
      const elements = DOMParser.extractElements(dom, selector);
      for (const element of elements) {
        const link = DOMParser.extractAttribute(element, 'href');
        if (link && URLUtils.isValidURL(link)) {
          const domain = URLUtils.extractDomain(link);
          if (domain && !businessLinks.includes(domain)) {
            businessLinks.push(domain);
          }
        }
      }
    }
    
    return businessLinks.slice(0, 10); // Limit to first 10 results
  }
}

/**
 * Business detail scraper
 */
export class BusinessDetailScraper {
  private httpClient: HttpClient;

  constructor(config: ScrapingConfig = DEFAULT_CONFIG) {
    this.httpClient = new HttpClient(config);
  }

  /**
   * Scrape business details from a URL
   */
  async scrapeBusinessDetails(url: string): Promise<{
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
    website?: string;
    category: string;
    source: string;
    dataQuality: number;
  }> {
    const response = await this.httpClient.get(url);
    const dom = DOMParser.parse(response.data);
    
    const name = DOMParser.extractBusinessName(dom);
    const address = DOMParser.extractAddress(dom);
    const phone = DOMParser.extractPhone(dom);
    const website = DOMParser.extractWebsite(dom);
    const category = DOMParser.extractCategory(dom);
    
    // Extract city, state, zip from address
    const { city, state, zipCode } = this.parseAddress(address);
    
    // Calculate data quality score
    const dataQuality = this.calculateDataQuality(name, address, phone, website, category);
    
    return {
      name,
      address,
      city,
      state,
      zipCode,
      phone,
      website,
      category: category || 'Unknown',
      source: URLUtils.extractDomain(url),
      dataQuality
    };
  }

  /**
   * Parse address to extract city, state, and zip code
   */
  private parseAddress(address: string): { city: string; state: string; zipCode: string } {
    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length >= 3) {
      const city = parts[0];
      const stateZip = parts[1].split(' ');
      const state = stateZip[0];
      const zipCode = stateZip[1] || '';
      
      return { city, state, zipCode };
    }
    
    return { city: '', state: '', zipCode: '' };
  }

  /**
   * Calculate data quality score based on available information
   */
  private calculateDataQuality(
    name: string,
    address: string,
    phone: string,
    website: string,
    category: string
  ): number {
    let score = 0;
    
    if (name.length > 0) score += 20;
    if (address.length > 10) score += 20;
    if (phone.length > 0) score += 20;
    if (website.length > 0) score += 20;
    if (category !== 'Unknown') score += 20;
    
    return Math.min(score, 100);
  }
}

// Export default instances
export const httpClient = new HttpClient();
export const searchEngineScraper = new SearchEngineScraper();
export const businessDetailScraper = new BusinessDetailScraper();