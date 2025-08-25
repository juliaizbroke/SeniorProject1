import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('template') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Save uploaded file to public/templates/ with its original name
  const buffer = Buffer.from(await file.arrayBuffer());
  const templatesDir = path.join(process.cwd(), 'public', 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  const filename = file.name || `template_${Date.now()}.docx`;
  const savePath = path.join(templatesDir, filename);

  try {
    fs.writeFileSync(savePath, buffer);
    return NextResponse.json({ success: true, filename });
  } catch {
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
