import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDB } from '../db/connection';
import { businesses } from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Note: This is a simplified version. In production, you'd want:
    // 1. Proper file upload handling (multipart/form-data)
    // 2. File validation (size, type, etc.)
    // 3. Authentication/authorization
    // 4. Better error handling
    
    const { businessId, businessName, logoData } = req.body;
    
    if (!businessId || !logoData) {
      return res.status(400).json({ error: 'Missing businessId or logoData' });
    }

    // Sanitize filename
    const sanitizedName = businessName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    
    const filename = `${sanitizedName}.png`;
    const logoDir = path.join(process.cwd(), 'public', 'images', 'businesses');
    const logoPath = path.join(logoDir, filename);
    const publicUrl = `/images/businesses/${filename}`;

    // Ensure directory exists
    await mkdir(logoDir, { recursive: true });

    // Save logo file (assuming base64 data)
    const base64Data = logoData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    await writeFile(logoPath, buffer);
    
    // Update database with logo URL
    const db = getDB();
    await db
      .update(businesses)
      .set({ 
        logoUrl: publicUrl,
        updatedAt: new Date()
      })
      .where(eq(businesses.id, parseInt(businessId)));

    console.log(`✅ Logo saved for ${businessName}: ${publicUrl}`);
    
    return res.status(200).json({
      success: true,
      message: `Logo uploaded successfully for ${businessName}`,
      logoUrl: publicUrl
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return res.status(500).json({ 
      error: 'Failed to upload logo',
      details: error.message 
    });
  }
}
