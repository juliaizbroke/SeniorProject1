import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params Promise in Next.js 15
    const resolvedParams = await params
    
    // Extract the path from the dynamic route
    const path = resolvedParams.path.join('/')
    
    // Construct the backend URL
    const backendUrl = `${BACKEND_URL}/preview/${path}`
    
    console.log(`[Proxy] Forwarding request to: ${backendUrl}`)
    
    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        // Forward relevant headers from the original request
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[Proxy] Backend responded with ${response.status}: ${response.statusText}`)
      return NextResponse.json(
        { error: 'File not found or has been cleaned up' },
        { status: response.status }
      )
    }

    // Get the response data
    const data = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Create the response with appropriate headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'",
        // Add cache headers for better performance
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[Proxy] Error forwarding request:', error)
    return NextResponse.json(
      { error: 'Internal server error while proxying request' },
      { status: 500 }
    )
  }
}

// Export other HTTP methods if needed
export async function POST(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ path: string[] }> }
) {
  return NextResponse.json(
    { error: 'POST method not supported for preview proxy' },
    { status: 405 }
  )
}
