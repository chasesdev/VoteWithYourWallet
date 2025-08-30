#!/usr/bin/env python3

"""
Fetch company logos only - PNG format, unmodified

This script focuses solely on downloading company logos from Wikipedia
in their original PNG format without any modifications.

Usage: 
    source venv/bin/activate
    python3 fetch-logos-only.py "Company Name" "Another Company"
"""

import os
import sys
import requests
import wikipediaapi
import time
from pathlib import Path

class LogoFetcher:
    def __init__(self):
        # Initialize Wikipedia API
        self.wiki_wiki = wikipediaapi.Wikipedia('VoteWithYourWallet/1.0 (contact@example.com)', 'en')
        
        # Create logo directory
        self.logo_dir = Path('./company_logos')
        self.logo_dir.mkdir(exist_ok=True)
        
        print(f"📁 Logos will be saved to: {self.logo_dir.absolute()}")
        
        # Statistics
        self.stats = {
            'companies_processed': 0,
            'logos_found': 0,
            'logos_downloaded': 0
        }

    def sanitize_filename(self, name):
        """Create safe filename from company name"""
        import re
        safe_name = re.sub(r'[^\w\s-]', '', name)
        safe_name = re.sub(r'[-\s]+', '_', safe_name)
        return safe_name[:50]

    def is_logo_file(self, filename):
        """Check if file is a company logo"""
        filename_lower = filename.lower()
        
        # Must contain logo-related keywords
        logo_keywords = [
            'logo', 'wordmark', 'emblem', 'symbol', 'brand',
            'trademark', 'corporate', 'company_logo', 'logotype',
            'mark', 'insignia'
        ]
        
        has_logo_keyword = any(keyword in filename_lower for keyword in logo_keywords)
        
        # Must be PNG or SVG (we'll convert SVG to PNG)
        is_png_svg = filename_lower.endswith('.png') or filename_lower.endswith('.svg')
        
        # Skip generic/system files
        skip_keywords = [
            'commons-logo', 'wiki', 'wikidata', 'wikimedia', 
            'edit-icon', 'ambox', 'merge', 'disambig'
        ]
        
        has_skip_keyword = any(skip in filename_lower for skip in skip_keywords)
        
        return has_logo_keyword and is_png_svg and not has_skip_keyword

    def download_logo_to_folder(self, url, filename, folder_path):
        """Download logo file without modification to specific folder"""
        try:
            headers = {
                'User-Agent': 'VoteWithYourWallet/1.0 (contact@example.com)'
            }
            
            response = requests.get(url, headers=headers, stream=True, timeout=30)
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            if 'image' not in content_type:
                print(f"❌ Not an image file: {content_type}")
                return False
            
            # Save file as-is (no modifications)
            filepath = folder_path / filename
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            file_size = filepath.stat().st_size
            print(f"✅ Downloaded: {folder_path.name}/{filename} ({file_size:,} bytes)")
            return True
            
        except Exception as e:
            print(f"❌ Failed to download {filename}: {str(e)}")
            return False

    def get_logo_info(self, file_title):
        """Get logo file info from Wikimedia Commons"""
        try:
            api_url = "https://commons.wikimedia.org/w/api.php"
            params = {
                'action': 'query',
                'format': 'json',
                'titles': file_title,
                'prop': 'imageinfo',
                'iiprop': 'url|size|mime|extmetadata'
            }
            
            headers = {
                'User-Agent': 'VoteWithYourWallet/1.0 (contact@example.com)'
            }
            
            response = requests.get(api_url, params=params, headers=headers, timeout=15)
            
            if response.status_code != 200:
                return None
                
            data = response.json()
            pages = data.get('query', {}).get('pages', {})
            
            for page_id, page_data in pages.items():
                if 'imageinfo' in page_data and page_data['imageinfo']:
                    image_info = page_data['imageinfo'][0]
                    
                    # Only return PNG files or high-quality SVGs
                    mime_type = image_info.get('mime', '')
                    width = image_info.get('width', 0)
                    height = image_info.get('height', 0)
                    
                    if 'png' in mime_type or ('svg' in mime_type and width >= 100):
                        return {
                            'url': image_info.get('url'),
                            'width': width,
                            'height': height,
                            'mime': mime_type,
                            'size': image_info.get('size', 0),
                            'filename': file_title.replace('File:', '')
                        }
            return None
            
        except Exception as e:
            print(f"❌ Error getting logo info: {str(e)}")
            return None

    def find_company_logos(self, company_name):
        """Find logos for a specific company"""
        try:
            print(f"\n🔍 Searching Wikipedia for: {company_name}")
            
            # Try different variations of the company name
            search_variations = [
                company_name,
                f"{company_name}, Inc.",
                f"{company_name} Inc.",
                f"The {company_name} Company"
            ]
            
            page = None
            for variation in search_variations:
                test_page = self.wiki_wiki.page(variation)
                if test_page.exists():
                    page = test_page
                    break
            
            if not page:
                print(f"❌ No Wikipedia page found for {company_name}")
                return []
            
            print(f"📄 Found page: {page.title}")
            
            # Get images from the page
            api_url = "https://en.wikipedia.org/w/api.php"
            params = {
                'action': 'query',
                'format': 'json',
                'titles': page.title,
                'prop': 'images',
                'imlimit': 50  # Check more images for better logo coverage
            }
            
            headers = {
                'User-Agent': 'VoteWithYourWallet/1.0 (contact@example.com)'
            }
            
            response = requests.get(api_url, params=params, headers=headers, timeout=15)
            
            if response.status_code != 200:
                print(f"❌ API request failed with status {response.status_code}")
                return []
                
            data = response.json()
            pages = data.get('query', {}).get('pages', {})
            
            logos = []
            for page_id, page_data in pages.items():
                if 'images' in page_data:
                    images_list = page_data['images']
                    print(f"🖼️  Scanning {len(images_list)} images for logos...")
                    
                    for img_data in images_list:
                        img_title = img_data['title']
                        
                        if self.is_logo_file(img_title):
                            print(f"🏷️  Found potential logo: {img_title}")
                            
                            logo_info = self.get_logo_info(img_title)
                            if logo_info:
                                logos.append(logo_info)
                                print(f"✅ Logo confirmed: {logo_info['width']}x{logo_info['height']} ({logo_info['mime']})")
                else:
                    print("❌ No images found on page")
            
            return logos
            
        except Exception as e:
            print(f"❌ Error finding logos for {company_name}: {str(e)}")
            return []

    def process_company(self, company_name):
        """Process a single company to find and download logos"""
        self.stats['companies_processed'] += 1
        
        print(f"\n{'='*60}")
        print(f"Processing: {company_name}")
        print('='*60)
        
        logos = self.find_company_logos(company_name)
        
        if not logos:
            print(f"❌ No logos found for {company_name}")
            return
        
        self.stats['logos_found'] += len(logos)
        print(f"🏷️  Found {len(logos)} logo(s) for {company_name}")
        
        company_safe_name = self.sanitize_filename(company_name)
        
        # Create company-specific subfolder
        company_dir = self.logo_dir / company_safe_name
        company_dir.mkdir(exist_ok=True)
        print(f"📁 Created folder: {company_dir.name}/")
        
        for i, logo_info in enumerate(logos):
            try:
                # Create filename preserving original format
                original_filename = logo_info['filename']
                ext = 'png' if 'png' in logo_info['mime'] else 'svg'
                filename = f"logo_{i+1}.{ext}"
                
                print(f"\n📥 Downloading logo {i+1}/{len(logos)}")
                print(f"   Original: {original_filename}")
                print(f"   Size: {logo_info['width']}x{logo_info['height']}")
                print(f"   Format: {logo_info['mime']}")
                
                if self.download_logo_to_folder(logo_info['url'], filename, company_dir):
                    self.stats['logos_downloaded'] += 1
                
                # Rate limiting
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Error downloading logo {i+1}: {str(e)}")

    def run(self, companies):
        """Main execution function"""
        print("🏷️  Company Logo Fetcher")
        print("=" * 50)
        print(f"Target format: PNG (original, unmodified)")
        print(f"Companies to process: {len(companies)}")
        
        for company in companies:
            self.process_company(company)
            # Rate limiting between companies
            time.sleep(3)
        
        self.print_summary()

    def print_summary(self):
        """Print final summary"""
        print("\n" + "="*60)
        print("📊 FINAL SUMMARY")
        print("="*60)
        print(f"✅ Companies processed: {self.stats['companies_processed']}")
        print(f"🏷️  Logos found: {self.stats['logos_found']}")
        print(f"📥 Logos downloaded: {self.stats['logos_downloaded']}")
        
        if self.stats['logos_found'] > 0:
            success_rate = (self.stats['logos_downloaded'] / self.stats['logos_found']) * 100
            print(f"📈 Download success rate: {success_rate:.1f}%")
        
        print(f"\n📁 All logos saved to: {self.logo_dir.absolute()}")

def main():
    if len(sys.argv) < 2:
        print("""
🏷️  Company Logo Fetcher

Usage: python3 fetch-logos-only.py "Company1" "Company2" ...

Examples:
  python3 fetch-logos-only.py "Apple" "Microsoft" "Google"
  python3 fetch-logos-only.py "Coca-Cola"

Features:
• Downloads original PNG/SVG logos from Wikipedia
• No modifications - preserves original files
• Focuses only on official company logos
• Smart filtering to avoid generic images
        """)
        return
    
    companies = sys.argv[1:]
    fetcher = LogoFetcher()
    fetcher.run(companies)

if __name__ == "__main__":
    main()