import { NextRequest, NextResponse } from 'next/server';
import { dataIngestionService } from '../../../../services/dataIngestion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { batchSize?: number };
    const { batchSize = 10 } = body;

    // Validate batch size
    if (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 100) {
      return NextResponse.json({ error: 'Batch size must be a number between 1 and 100' }, { status: 400 });
    }

    // Start the ingestion process
    const result = await dataIngestionService.importOrangeCountyBusinesses(batchSize);

    return NextResponse.json({
      success: true,
      message: 'Data ingestion completed',
      result
    });
  } catch (error) {
    console.error('Error in data ingestion API:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get business statistics
    const stats = await dataIngestionService.getBusinessStatistics();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in data ingestion API:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}