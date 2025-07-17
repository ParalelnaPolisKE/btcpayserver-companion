'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isEnabled: boolean;
}

export function QRScanner({ onScan, isEnabled }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isEnabled) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
          // Ignore errors during cleanup
        });
        scannerRef.current = null;
        setIsScanning(false);
        isInitialized.current = false;
      }
      return;
    }

    // Prevent double initialization in React strict mode
    if (isInitialized.current) {
      return;
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_CAMERA,
            Html5QrcodeScanType.SCAN_TYPE_FILE,
          ],
        },
        false
      );

      scannerRef.current = scanner;
      isInitialized.current = true;

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner.clear().catch(() => {
            // Ignore errors during cleanup
          });
          setIsScanning(false);
          isInitialized.current = false;
        },
        (errorMessage) => {
          // Only show persistent errors, not scanning failures
          if (errorMessage.includes('NotAllowedError')) {
            setError('Camera permission denied. Please allow camera access to scan QR codes.');
          } else if (errorMessage.includes('NotFoundError')) {
            setError('No camera found. Please ensure your device has a camera.');
          }
        }
      );

      setIsScanning(true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current && isInitialized.current) {
        scannerRef.current.clear().catch(() => {
          // Ignore errors during cleanup
        });
        scannerRef.current = null;
        isInitialized.current = false;
      }
    };
  }, [isEnabled, onScan]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="p-4">
        <div id="qr-reader" className="w-full" />
        {isScanning && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Position the QR code within the frame to scan
          </p>
        )}
      </Card>
    </div>
  );
}