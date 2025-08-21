"use client";

export interface UploadResult {
  success: boolean;
  message: string;
  plugin?: {
    id: string;
    name: string;
    version: string;
    description?: string;
  };
}

export async function uploadPluginZip(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/plugins/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `Upload failed with status ${response.status}`,
      );
    }

    return result;
  } catch (error) {
    console.error("Plugin upload failed:", error);
    throw error;
  }
}

export async function removePlugin(pluginId: string): Promise<UploadResult> {
  try {
    const response = await fetch(`/api/plugins/upload?id=${pluginId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `Removal failed with status ${response.status}`,
      );
    }

    return result;
  } catch (error) {
    console.error("Plugin removal failed:", error);
    throw error;
  }
}
