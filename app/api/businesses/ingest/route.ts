import { dataIngestionService } from '../../../../services/dataIngestion';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { batchSize?: number };
    const { batchSize = 10 } = body;

    // Validate batch size
    if (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 100) {
      return Response.json({ error: 'Batch size must be a number between 1 and 100' }, { status: 400 });
    }

    // Start the ingestion process
    const result = await dataIngestionService.importOrangeCountyBusinesses(batchSize);

    return Response.json({
      success: true,
      message: 'Data ingestion completed',
      result
    });
  } catch (error) {
    console.error('Error in data ingestion API:', error);
    return Response.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Get business statistics
    const stats = await dataIngestionService.getBusinessStatistics();
    
    return Response.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in data ingestion API:', error);
    return Response.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}