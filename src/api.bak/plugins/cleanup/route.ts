import { type NextRequest, NextResponse } from "next/server";
import { getEncryptedDatabase } from "@/lib/encrypted-indexeddb";

export async function POST(request: NextRequest) {
  try {
    const db = getEncryptedDatabase();
    const removedCount = await db.cleanupInvalidPlugins();

    return NextResponse.json({
      success: true,
      removedCount,
    });
  } catch (error) {
    console.error("Failed to cleanup plugins:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to cleanup plugins",
      },
      { status: 500 },
    );
  }
}
