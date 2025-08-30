import { VercelRequest, VercelResponse } from '@vercel/node';
import { dataIngestionService } from '../../../../services/dataIngestion';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const body = req.body as { batchSize?: number };
      const { batchSize = 10 } = body;

      // Validate batch size
      if (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 100) {
        return res.status(400).json({ error: 'Batch size must be a number between 1 and 100' });
      }

      // Start the ingestion process
      const result = await dataIngestionService.importOrangeCountyBusinesses(batchSize);

      return res.status(200).json({
        success: true,
        message: 'Data ingestion completed',
        result
      });
    } else if (req.method === 'GET') {
      // Get business statistics
      const stats = await dataIngestionService.getBusinessStatistics();
      
      return res.status(200).json({
        success: true,
        stats
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in data ingestion API:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}