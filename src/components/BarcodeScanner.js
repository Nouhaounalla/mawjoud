"use client";

import { useEffect, useRef, useState } from "react";

// Opens the phone camera and reads barcodes with the "html5-qrcode" library.
//   onDetected(code): called ONCE with the barcode number as text
//
// Remember: browsers only allow camera access on HTTPS pages
// (or on http://localhost while developing).
export default function BarcodeScanner({ onDetected }) {
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  const scannerRef = useRef(null); // the Html5Qrcode instance
  const alreadyDetectedRef = useRef(false); // avoids calling onDetected many times
  const onDetectedRef = useRef(onDetected); // always points to the latest callback

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let cancelled = false; // becomes true if the component closes before the camera starts

    async function startScanner() {
      // The library is loaded only now, in the browser (it needs "window").
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode("barcode-reader", {
        verbose: false,
        // Only look for the formats found on medicine boxes: faster and more accurate.
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        // Use the phone's built-in detector when it exists (much faster).
        useBarCodeDetectorIfSupported: true,
      });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" }, // the back camera
          {
            fps: 10, // scan 10 times per second
            qrbox: { width: 280, height: 140 }, // a wide box, barcodes are wide
          },
          (decodedText) => {
            if (alreadyDetectedRef.current) return;
            alreadyDetectedRef.current = true;
            onDetectedRef.current(decodedText);
          },
          () => {
            // Called for every frame without a barcode: nothing to do.
          }
        );
        if (cancelled) {
          // The user closed the scanner while the camera was starting.
          scanner.stop().then(() => scanner.clear()).catch(() => {});
        } else {
          setStarting(false);
        }
      } catch (err) {
        if (cancelled) return;
        setStarting(false);
        setError(
          "Impossible d'accéder à la caméra. Autorisez l'accès dans votre navigateur " +
            "(la page doit être en HTTPS), ou recherchez le médicament par son nom."
        );
        console.error("Scanner error:", err);
      }
    }

    startScanner();

    // Cleanup: turn the camera off when the scanner is closed.
    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="rounded-xl border border-brand-200 bg-white p-3">
      {/* The library draws the camera video inside this div */}
      <div id="barcode-reader" className="overflow-hidden rounded-lg bg-black/5" />

      {starting && !error && (
        <p className="mt-2 text-center text-sm text-brand-900/70">Démarrage de la caméra...</p>
      )}
      {!starting && !error && (
        <p className="mt-2 text-center text-sm text-brand-900/70">
          Placez le code à barres dans le cadre.
        </p>
      )}
      {error && <p className="mt-2 text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}
