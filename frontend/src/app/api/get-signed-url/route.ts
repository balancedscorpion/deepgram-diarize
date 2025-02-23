import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Handling get-signed-url request');
  try {
    console.log('Fetching signed URL from ElevenLabs API...');
    console.log('Using agent ID:', process.env.NEXT_PUBLIC_AGENT_ID);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.NEXT_PUBLIC_AGENT_ID}`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
      }
    );

    console.log('ElevenLabs API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to get signed URL:', errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to get signed URL' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Successfully got signed URL');
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('Error in get-signed-url:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
} 