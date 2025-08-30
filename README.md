# VoteWithYourWallet - Political Business Alignment App

A React Native app that helps users find businesses aligned with their political values. Users can set their political alignment and discover businesses that match their political views.

## Features

- 🗳️ **Political Alignment Selection**: Choose from predefined political alignments or customize your own
- 🏪 **Business Discovery**: Browse businesses with their political alignment scores
- 🔍 **Search & Filter**: Find businesses by name, category, or location
- 📊 **Alignment Visualization**: See detailed political alignment breakdowns
- 💝 **Donation History**: View political donations made by businesses
- 🌐 **Web & Mobile**: Available on both web and mobile platforms

## Tech Stack

- **Frontend**: React Native with Expo Router
- **Database**: Turso (PostgreSQL-compatible)
- **ORM**: Drizzle ORM
- **API**: Next.js API Routes
- **UI Components**: Custom React Native components with Expo Vector Icons

## Project Structure

```
VoteWithYourWallet/
├── app/                    # Expo Router app directory
│   ├── api/               # API routes
│   │   ├── businesses/    # Business-related endpoints
│   │   ├── user-alignment/ # User alignment management
│   │   └── business-alignment/ # Alignment calculation
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   ├── political-alignment.tsx # Political alignment screen
│   └── business-detail.tsx # Business detail screen
├── components/            # Reusable UI components
├── db/                   # Database schema and connection
├── utils/                # Utility functions
└── test-app-flow.js      # Test script
```

## Database Schema

The app uses the following main tables:

- **businesses**: Business information and details
- **business_alignments**: Political alignment scores for businesses
- **user_alignments**: User political alignment preferences
- **donations**: Political donations made by businesses

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Turso database account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd VoteWithYourWallet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Turso database credentials
```

4. Set up the database:
```bash
# Push schema to Turso
npx drizzle-kit push:sqlite

# Seed initial data
npx ts-node scripts/seed.ts
```

5. Start the development server:
```bash
npx expo start
```

## API Endpoints

### Businesses
- `GET /api/businesses` - Get all businesses with search and filter options
- `GET /api/businesses/[id]` - Get detailed information about a specific business

### User Alignment
- `POST /api/user-alignment` - Set or update user political alignment

### Business Alignment
- `GET /api/business-alignment/[businessId]/[userId]` - Calculate alignment between user and business

## Deployment

### Web Deployment

The application can be deployed to EAS Hosting for web access:

1. Ensure you have Expo account and are logged in:
```bash
npx expo login
```

2. Build the web version:
```bash
npx expo export -p web
```

3. Deploy to EAS Hosting:
```bash
npx eas build --platform web --profile preview
```

### Manual Web Deployment

For manual deployment, you can use the exported static files:

1. Export the web build:
```bash
npx expo export -p web
```

2. The static files will be available in the `dist/` directory
3. Deploy these files to any static hosting service (Vercel, Netlify, etc.)

### Mobile Deployment

For mobile deployment:

```bash
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview
```

## Usage

1. **Set Your Political Alignment**: Open the app and select your political alignment using the quick select options or customize with sliders.

2. **Browse Businesses**: View businesses with their alignment scores based on your political preferences.

3. **Search and Filter**: Use the search bar and filters to find specific businesses or categories.

4. **View Business Details**: Tap on any business to see detailed information, including political alignment breakdowns and donation history.

5. **Get Directions**: Use the built-in maps integration to find directions to businesses.

## Development

### Adding New Businesses

To add new businesses to the database:

1. Update the `scripts/seed.ts` file with new business data
2. Run the seed script:
```bash
npx ts-node scripts/seed.ts
```

### Customizing UI Components

All UI components are located in the `components/` directory and can be customized as needed.

### Database Migrations

To create and apply database migrations:

```bash
# Generate migration files
npx drizzle-kit generate:sqlite

# Apply migrations
npx drizzle-kit push:sqlite
```

## Environment Variables

Required environment variables:

- `TURSO_DATABASE_URL`: Your Turso database URL
- `TURSO_AUTH_TOKEN`: Your Turso authentication token
- `EAS_PROJECT_ID`: Your Expo project ID (for EAS builds)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

---

**Note**: This app is designed to help users make informed decisions based on political alignment data. The alignment scores are calculated based on available data and may not reflect the complete political stance of any business.