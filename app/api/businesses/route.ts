// Temporarily use mock data for demo purposes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Mock business data
    const mockBusinesses = [
      {
        id: 1,
        name: "Patagonia",
        description: "Outdoor clothing company focused on environmental responsibility",
        category: "Retail",
        website: "https://patagonia.com",
        address: "Ventura, CA",
        latitude: 34.2746,
        longitude: -119.2290,
        imageUrl: null,
        alignment: {
          liberal: 8,
          conservative: 2,
          libertarian: 3,
          green: 9,
          centrist: 4,
        }
      },
      {
        id: 2,
        name: "Chick-fil-A",
        description: "Fast food restaurant chain specializing in chicken",
        category: "Food",
        website: "https://chick-fil-a.com",
        address: "Atlanta, GA",
        latitude: 33.7490,
        longitude: -84.3880,
        imageUrl: null,
        alignment: {
          liberal: 2,
          conservative: 8,
          libertarian: 4,
          green: 3,
          centrist: 5,
        }
      },
      {
        id: 3,
        name: "Ben & Jerry's",
        description: "Ice cream company known for social activism",
        category: "Food",
        website: "https://benjerry.com",
        address: "Burlington, VT",
        latitude: 44.4759,
        longitude: -73.2121,
        imageUrl: null,
        alignment: {
          liberal: 9,
          conservative: 1,
          libertarian: 2,
          green: 8,
          centrist: 3,
        }
      },
      {
        id: 4,
        name: "Tesla",
        description: "Electric vehicle and clean energy company",
        category: "Technology",
        website: "https://tesla.com",
        address: "Austin, TX",
        latitude: 30.2672,
        longitude: -97.7431,
        imageUrl: null,
        alignment: {
          liberal: 6,
          conservative: 4,
          libertarian: 7,
          green: 9,
          centrist: 5,
        }
      },
      {
        id: 5,
        name: "Walmart",
        description: "Multinational retail corporation",
        category: "Retail",
        website: "https://walmart.com",
        address: "Bentonville, AR",
        latitude: 36.3729,
        longitude: -94.2088,
        imageUrl: null,
        alignment: {
          liberal: 3,
          conservative: 6,
          libertarian: 5,
          green: 2,
          centrist: 7,
        }
      }
    ];

    // Filter based on search query or category
    let filteredBusinesses = mockBusinesses;
    
    if (query) {
      filteredBusinesses = mockBusinesses.filter(business => 
        business.name.toLowerCase().includes(query.toLowerCase()) ||
        business.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (category) {
      filteredBusinesses = filteredBusinesses.filter(business => 
        business.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBusinesses = filteredBusinesses.slice(startIndex, endIndex);

    return new Response(JSON.stringify({
      businesses: paginatedBusinesses,
      pagination: {
        page,
        limit,
        total: filteredBusinesses.length,
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch businesses', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}