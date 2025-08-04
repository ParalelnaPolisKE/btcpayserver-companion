import { NextRequest, NextResponse } from 'next/server';
import { PluginExtractor } from '@/services/plugin-extractor';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { success: false, message: 'File must be a ZIP archive' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract and install the plugin
    const extractor = new PluginExtractor();
    const result = await extractor.extractPlugin(buffer, file.name);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      plugin: {
        id: result.pluginId,
        name: result.manifest?.name,
        version: result.manifest?.version,
        description: result.manifest?.description,
      },
    });
    
  } catch (error) {
    console.error('Plugin upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload plugin',
      },
      { status: 500 }
    );
  }
}

// Also create DELETE endpoint for removing plugins
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('id');
    
    if (!pluginId) {
      return NextResponse.json(
        { success: false, message: 'Plugin ID is required' },
        { status: 400 }
      );
    }
    
    const extractor = new PluginExtractor();
    const result = await extractor.removePlugin(pluginId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
    });
    
  } catch (error) {
    console.error('Plugin removal error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove plugin',
      },
      { status: 500 }
    );
  }
}