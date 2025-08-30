import type { VercelRequest, VercelResponse } from '@vercel/node';

const RUNPOD_API_URL = 'https://api.runpod.ai/v2/kodxana/whisperx-worker/runsync';
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key is configured
    if (!RUNPOD_API_KEY) {
      return res.status(500).json({ success: false, error: 'RunPod API key not configured' });
    }

    // For Vercel, we need to handle the request differently
    // Since req.body is already parsed, we need to handle multipart data
    const formData = req.body;
    const audioFile = formData?.audio;

    if (!audioFile) {
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    // Convert the audio file to a buffer
    let buffer: Buffer;
    if (typeof audioFile === 'string') {
      // If it's already base64 encoded
      buffer = Buffer.from(audioFile, 'base64');
    } else if (audioFile instanceof Buffer) {
      buffer = audioFile;
    } else {
      // Handle ArrayBuffer or other formats
      buffer = Buffer.from(audioFile);
    }

    // Prepare the request to RunPod WhisperX
    const runpodRequest = {
      input: {
        audio: buffer.toString('base64'),
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
        temperature: 0.0,
      },
    };

    const response = await fetch(RUNPOD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      },
      body: JSON.stringify(runpodRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunPod API error:', errorText);
      return res.status(500).json({ success: false, error: 'Failed to transcribe audio' });
    }

    const result = await response.json();

    // Extract the transcription from the RunPod response
    let transcription = '';
    if (result.output && result.output.text) {
      transcription = result.output.text;
    } else if (result.output && result.output.segments) {
      // If segments are provided, concatenate them
      transcription = result.output.segments
        .map((segment: any) => segment.text)
        .join(' ');
    }

    return res.status(200).json({
      success: true,
      data: {
        transcription: transcription.trim(),
        language: 'en',
        duration: result.output?.duration || 0,
      },
    });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process speech-to-text request' });
  }
}