"use client";

import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QRScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
  onToggleScanning: () => void;
}

export default function QRScanner({
  onScan,
  isScanning,
  onToggleScanning,
}: QRScannerProps) {
  const qrReaderId = useId();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(qrReaderId);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (isScanning && scannerRef.current && !scannerRef.current.isScanning) {
      startScanning();
    } else if (!isScanning && scannerRef.current?.isScanning) {
      stopScanning();
    }
  }, [isScanning]);

  const startScanning = async () => {
    if (!scannerRef.current) return;

    try {
      setError(null);
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          // Auto-stop after successful scan
          onToggleScanning();
        },
        (_errorMessage) => {
          // Ignore frequent scan errors
        },
      );
      setHasPermission(true);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setHasPermission(false);
      setError(err instanceof Error ? err.message : "Failed to start camera");
      onToggleScanning(); // Turn off scanning on error
    }
  };

  const stopScanning = async () => {
    if (!scannerRef.current?.isScanning) return;

    try {
      await scannerRef.current.stop();
    } catch (err) {
      console.error("Failed to stop scanner:", err);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">QR Scanner</h3>
            <Button
              onClick={onToggleScanning}
              variant={isScanning ? "destructive" : "default"}
              size="sm"
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div
              id={qrReaderId}
              className={`w-full ${isScanning ? "min-h-[300px]" : "h-[300px] bg-muted rounded-lg flex items-center justify-center"}`}
            >
              {!isScanning && (
                <div className="text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Click "Start Scanning" to begin</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {hasPermission === false && (
            <div className="p-3 bg-warning/10 text-warning rounded-lg text-sm">
              Camera permission denied. Please enable camera access in your
              browser settings.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
