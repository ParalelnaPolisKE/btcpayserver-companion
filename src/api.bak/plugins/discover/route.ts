import { type NextRequest, NextResponse } from "next/server";
import { loadAvailablePlugins } from "@/lib/plugin-loader";

export async function GET(request: NextRequest) {
  try {
    const plugins = await loadAvailablePlugins();

    return NextResponse.json({
      success: true,
      plugins,
    });
  } catch (error) {
    console.error("Failed to discover plugins:", error);
    return NextResponse.json(
      {
        success: false,
        plugins: [],
        error:
          error instanceof Error ? error.message : "Failed to discover plugins",
      },
      { status: 500 },
    );
  }
}
