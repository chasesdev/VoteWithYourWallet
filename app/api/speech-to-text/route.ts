import { NextRequest, NextResponse } from 'next/server';

const RUNPOD_API_URL = 'https://api.runpod.ai/v2/kodxana/whisperx-worker/runsync';
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!RUNPOD_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'RunPod API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert the audio file to a buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
      return NextResponse.json(
        { success: false, error: 'Failed to transcribe audio' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        transcription: transcription.trim(),
        language: 'en',
        duration: result.output?.duration || 0,
      },
    });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process speech-to-text request' },
      { status: 500 }
    );
  }
}