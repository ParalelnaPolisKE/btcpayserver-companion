"use client";

import { AlertCircle, CheckCircle, FileArchive, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PluginDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export default function PluginDropzone({
  onUpload,
  disabled,
}: PluginDropzoneProps) {
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.name.endsWith(".zip")) {
        setErrorMessage("Please upload a ZIP file");
        setUploadStatus("error");
        return;
      }

      setUploadedFile(file);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setErrorMessage(null);

      // Simulate progress (in real implementation, this would track actual upload)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      try {
        await onUpload(file);
        setUploadProgress(100);
        setUploadStatus("success");
        clearInterval(progressInterval);

        // Reset after 3 seconds
        setTimeout(() => {
          setUploadStatus("idle");
          setUploadedFile(null);
          setUploadProgress(0);
        }, 3000);
      } catch (error) {
        clearInterval(progressInterval);
        setUploadStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to upload plugin",
        );
        setUploadProgress(0);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
    },
    maxFiles: 1,
    disabled: disabled || uploadStatus === "uploading",
  });

  const clearUpload = () => {
    setUploadStatus("idle");
    setUploadedFile(null);
    setUploadProgress(0);
    setErrorMessage(null);
  };

  return (
    <div className="w-full">
      {uploadStatus === "idle" && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-accent/50",
            isDragActive && "border-primary bg-accent",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop the plugin ZIP file here</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Drag & drop a plugin ZIP file here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </>
          )}
        </div>
      )}

      {uploadStatus === "uploading" && uploadedFile && (
        <div className="border-2 border-primary rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileArchive className="h-8 w-8 text-primary mr-3" />
            <div className="flex-1">
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Progress value={uploadProgress} className="mb-2" />
          <p className="text-sm text-muted-foreground">Uploading plugin...</p>
        </div>
      )}

      {uploadStatus === "success" && uploadedFile && (
        <div className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div className="flex-1">
              <p className="font-medium text-green-900 dark:text-green-100">
                Plugin uploaded successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {uploadedFile.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="h-8 w-8 text-red-500 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-900 dark:text-red-100">
                Upload failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {errorMessage || "An unexpected error occurred"}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearUpload}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={clearUpload}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
