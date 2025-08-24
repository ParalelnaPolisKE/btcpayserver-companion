import { type NextRequest, NextResponse } from "next/server";
import { PluginExtractor } from "@/services/plugin-extractor";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pluginId: string }> },
) {
  try {
    const { pluginId } = await params;

    // Use the PluginExtractor to remove plugin files
    const extractor = new PluginExtractor();
    const result = await extractor.removePlugin(pluginId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Plugin "${result.manifest?.name || "Unknown Plugin"}" has been completely removed`,
    });
  } catch (error) {
    console.error("Failed to remove plugin:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove plugin",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
