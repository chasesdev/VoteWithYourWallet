/**
 * Test script for VoteWithYourWallet application flow
 * This script tests the complete flow from alignment selection to business discovery
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  appDir: './VoteWithYourWallet',
  requiredFiles: [
    'app/index.tsx',
    'app/business-detail.tsx', 
    'app/political-alignment.tsx',
    'app/_layout.tsx',
    'components/BusinessCard.tsx',
    'components/SearchBar.tsx',
    'components/FilterSection.tsx',
    'utils/api.ts',
    'db/schema.ts',
    'db/connection.ts',
    'app/api/businesses/route.ts',
    'app/api/businesses/[id]/route.ts',
    'app/api/user-alignment/route.ts',
    'app/api/business-alignment/[businessId]/[userId]/route.ts'
  ],
  requiredDependencies: [
    'expo',
    'react',
    'react-native',
    '@expo/vector-icons',
    'expo-router',
    'drizzle-orm',
    'postgres'
  ]
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, passed, error = null) {
  if (passed) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}`);
    testResults.failed++;
    if (error) {
      testResults.errors.push(error);
    }
  }
}

function checkFileExists(filePath) {
  const fullPath = path.join(TEST_CONFIG.appDir, filePath);
  return fs.existsSync(fullPath);
}

function checkFileContains(filePath, content) {
  const fullPath = path.join(TEST_CONFIG.appDir, filePath);
  if (!fs.existsSync(fullPath)) return false;
  
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  return fileContent.includes(content);
}

function checkPackageJson() {
  const packageJsonPath = path.join(TEST_CONFIG.appDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logTest('Check package.json exists', false, 'package.json not found');
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check required dependencies
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    TEST_CONFIG.requiredDependencies.forEach(dep => {
      const passed = dependencies[dep] !== undefined;
      logTest(`Check dependency: ${dep}`, passed);
    });

    // Check if it's an Expo app
    const isExpoApp = dependencies.expo !== undefined;
    logTest('Check Expo app setup', isExpoApp);

    // Check TypeScript support
    const hasTypeScript = dependencies.typescript !== undefined;
    logTest('Check TypeScript support', hasTypeScript);

  } catch (error) {
    logTest('Check package.json', false, `Error reading package.json: ${error.message}`);
  }
}

function checkAppStructure() {
  console.log('\n🔍 Testing App Structure...');
  
  // Check required files
  TEST_CONFIG.requiredFiles.forEach(filePath => {
    const exists = checkFileExists(filePath);
    logTest(`Check file exists: ${filePath}`, exists);
  });

  // Check for key components
  const hasBusinessCard = checkFileContains('components/BusinessCard.tsx', 'BusinessCard');
  const hasSearchBar = checkFileContains('components/SearchBar.tsx', 'SearchBar');
  const hasFilterSection = checkFileContains('components/FilterSection.tsx', 'FilterSection');
  
  logTest('Check BusinessCard component', hasBusinessCard);
  logTest('Check SearchBar component', hasSearchBar);
  logTest('Check FilterSection component', hasFilterSection);

  // Check for API routes
  const hasBusinessesApi = checkFileContains('app/api/businesses/route.ts', 'export async function GET');
  const hasUserAlignmentApi = checkFileContains('app/api/user-alignment/route.ts', 'export async function POST');
  const hasBusinessAlignmentApi = checkFileContains('app/api/business-alignment/[businessId]/[userId]/route.ts', 'export async function GET');
  
  logTest('Check businesses API route', hasBusinessesApi);
  logTest('Check user alignment API route', hasUserAlignmentApi);
  logTest('Check business alignment API route', hasBusinessAlignmentApi);
}

function checkDatabaseSchema() {
  console.log('\n🗄️ Testing Database Schema...');
  
  const hasSchema = checkFileExists('db/schema.ts');
  const hasConnection = checkFileExists('db/connection.ts');
  const hasDrizzleConfig = checkFileExists('drizzle.config.ts');
  
  logTest('Check database schema file', hasSchema);
  logTest('Check database connection file', hasConnection);
  logTest('Check Drizzle configuration', hasDrizzleConfig);

  if (hasSchema) {
    const schemaContent = fs.readFileSync(path.join(TEST_CONFIG.appDir, 'db/schema.ts'), 'utf8');
    
    const hasBusinessesTable = schemaContent.includes('businesses');
    const hasUsersTable = schemaContent.includes('users');
    const hasAlignmentsTable = schemaContent.includes('user_alignments');
    const hasDonationsTable = schemaContent.includes('donations');
    
    logTest('Check businesses table schema', hasBusinessesTable);
    logTest('Check users table schema', hasUsersTable);
    logTest('Check alignments table schema', hasAlignmentsTable);
    logTest('Check donations table schema', hasDonationsTable);
  }
}

function checkAppScreens() {
  console.log('\n📱 Testing App Screens...');
  
  const hasHomeScreen = checkFileExists('app/index.tsx');
  const hasBusinessDetailScreen = checkFileExists('app/business-detail.tsx');
  const hasPoliticalAlignmentScreen = checkFileExists('app/political-alignment.tsx');
  const hasLayout = checkFileExists('app/_layout.tsx');
  
  logTest('Check Home Screen', hasHomeScreen);
  logTest('Check Business Detail Screen', hasBusinessDetailScreen);
  logTest('Check Political Alignment Screen', hasPoliticalAlignmentScreen);
  logTest('Check App Layout', hasLayout);

  if (hasHomeScreen) {
    const homeContent = fs.readFileSync(path.join(TEST_CONFIG.appDir, 'app/index.tsx'), 'utf8');
    
    const hasSearchFunctionality = homeContent.includes('searchQuery') && homeContent.includes('setSearchQuery');
    const hasFilterFunctionality = homeContent.includes('selectedCategory') && homeContent.includes('setSelectedCategory');
    const hasAlignmentCalculation = homeContent.includes('calculateAlignmentScore');
    
    logTest('Check search functionality', hasSearchFunctionality);
    logTest('Check filter functionality', hasFilterFunctionality);
    logTest('Check alignment calculation', hasAlignmentCalculation);
  }

  if (hasPoliticalAlignmentScreen) {
    const alignmentContent = fs.readFileSync(path.join(TEST_CONFIG.appDir, 'app/political-alignment.tsx'), 'utf8');
    
    const hasQuickSelect = alignmentContent.includes('selectedAlignment') && alignmentContent.includes('handleAlignmentSelect');
    const hasCustomSliders = alignmentContent.includes('customAlignment') && alignmentContent.includes('handleCustomAlignmentChange');
    const hasSaveFunctionality = alignmentContent.includes('setUserAlignment');
    
    logTest('Check quick select functionality', hasQuickSelect);
    logTest('Check custom sliders functionality', hasCustomSliders);
    logTest('Check save functionality', hasSaveFunctionality);
  }

  if (hasBusinessDetailScreen) {
    const detailContent = fs.readFileSync(path.join(TEST_CONFIG.appDir, 'app/business-detail.tsx'), 'utf8');
    
    const hasAlignmentVisualization = detailContent.includes('alignmentBar') && detailContent.includes('getAlignmentColor');
    const hasDonationHistory = detailContent.includes('donations') && detailContent.includes('donationItem');
    const hasActionButtons = detailContent.includes('actionButtons') && detailContent.includes('openWebsite');
    
    logTest('Check alignment visualization', hasAlignmentVisualization);
    logTest('Check donation history', hasDonationHistory);
    logTest('Check action buttons', hasActionButtons);
  }
}

function checkApiIntegration() {
  console.log('\n🌐 Testing API Integration...');
  
  const hasApiUtils = checkFileExists('utils/api.ts');
  logTest('Check API utilities', hasApiUtils);

  if (hasApiUtils) {
    const apiContent = fs.readFileSync(path.join(TEST_CONFIG.appDir, 'utils/api.ts'), 'utf8');
    
    const hasFetchBusinesses = apiContent.includes('fetchBusinesses');
    const hasSetUserAlignment = apiContent.includes('setUserAlignment');
    const hasGetBusinessAlignment = apiContent.includes('getBusinessAlignment');
    const hasErrorHandling = apiContent.includes('try') && apiContent.includes('catch');
    
    logTest('Check fetchBusinesses function', hasFetchBusinesses);
    logTest('Check setUserAlignment function', hasSetUserAlignment);
    logTest('Check getBusinessAlignment function', hasGetBusinessAlignment);
    logTest('Check error handling', hasErrorHandling);
  }
}

function checkEnvironmentSetup() {
  console.log('\n⚙️ Testing Environment Setup...');
  
  const hasEnvFile = checkFileExists('.env');
  logTest('Check environment file', hasEnvFile);

  if (hasEnvFile) {
    const envContent = fs.readFileSync(path.join(TEST_CONFIG.appDir, '.env'), 'utf8');
    
    const hasDatabaseUrl = envContent.includes('TURSO_DATABASE_URL');
    const hasAuthToken = envContent.includes('TURSO_AUTH_TOKEN');
    
    logTest('Check database URL configuration', hasDatabaseUrl);
    logTest('Check auth token configuration', hasAuthToken);
  }

  const hasAppJson = checkFileExists('app.json');
  logTest('Check app.json configuration', hasAppJson);
}

function runTests() {
  console.log('🚀 Starting VoteWithYourWallet Application Flow Tests\n');
  
  checkPackageJson();
  checkAppStructure();
  checkDatabaseSchema();
  checkAppScreens();
  checkApiIntegration();
  checkEnvironmentSetup();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total Tests: ${testResults.passed + testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔴 Errors Found:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  const successRate = testResults.passed / (testResults.passed + testResults.failed) * 100;
  console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 90) {
    console.log('🎉 Excellent! The application flow is well implemented.');
  } else if (successRate >= 70) {
    console.log('👍 Good! The application flow is mostly implemented with some areas for improvement.');
  } else {
    console.log('⚠️  Needs attention. Several components of the application flow need to be implemented.');
  }
}

// Run the tests
runTests();
