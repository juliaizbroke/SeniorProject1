import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params object in Next.js 15+
    const { path } = await params;
    
    // Reconstruct the full path
    const fullPath = path.join('/');
    
    // Construct the backend URL
    const backendUrl = `http://127.0.0.1:5000/preview/${fullPath}`;
    
    console.log('Proxying request to:', backendUrl);
    
    // Fetch from the backend
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    const content = await response.text();
    
    // Return the content with appropriate headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors *",
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Failed to fetch preview', { status: 500 });
  }
}
