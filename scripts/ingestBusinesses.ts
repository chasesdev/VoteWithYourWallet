import { dataIngestionService } from '../services/dataIngestion';

async function main() {
  console.log('Starting business data ingestion test...');
  
  try {
    // Get initial statistics
    console.log('\n=== Initial Statistics ===');
    const initialStats = await dataIngestionService.getBusinessStatistics();
    console.log('Initial business count:', initialStats.totalBusinesses);
    
    // Import Orange County businesses
    console.log('\n=== Importing Orange County Businesses ===');
    const result = await dataIngestionService.importOrangeCountyBusinesses(10);
    
    console.log('\n=== Import Results ===');
    console.log('Success:', result.success);
    console.log('Records Processed:', result.recordsProcessed);
    console.log('Records Added:', result.recordsAdded);
    console.log('Records Updated:', result.recordsUpdated);
    console.log('Records Failed:', result.recordsFailed);
    console.log('Duration:', result.duration, 'ms');
    
    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Get final statistics
    console.log('\n=== Final Statistics ===');
    const finalStats = await dataIngestionService.getBusinessStatistics();
    console.log('Final business count:', finalStats.totalBusinesses);
    
    console.log('\n=== Businesses by Category ===');
    finalStats.businessesByCategory?.forEach((category: any) => {
      console.log(`${category.category}: ${category.count}`);
    });
    
    console.log('\n=== Businesses by City ===');
    finalStats.businessesByCity?.forEach((city: any) => {
      console.log(`${city.city}: ${city.count}`);
    });
    
    console.log('\n=== Test Completed Successfully ===');
  } catch (error) {
    console.error('Error during ingestion test:', error);
    process.exit(1);
  }
}

// Run the script
main();