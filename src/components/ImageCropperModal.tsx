"use client";

import { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { motion } from "motion/react";
import { getCroppedImg } from "@/utils/cropImage";

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropTitle?: string;
}

export default function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 3 / 4,
  cropTitle,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApply = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const { file, url } = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(file, url);
    } catch (err) {
      console.error("Failed to crop image:", err);
      alert("Could not process image crop. Try another image or cancel.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[540px] bg-[#121212] border border-[#27272a] rounded-[10px] overflow-hidden text-white shadow-2xl flex flex-col z-10"
      >
        {/* Header */}
        <div className="h-[52px] px-5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em]">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>{cropTitle || "ADJUST & CROP PHOTO"}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 rounded-full border border-[#3f3f46] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white flex items-center justify-center font-mono text-[12px] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cropper Workspace */}
        <div className="relative w-full h-[360px] sm:h-[420px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape="rect"
            showGrid={true}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Zoom Controls Bar */}
        <div className="px-5 py-3 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between gap-4 font-mono text-[10px] uppercase text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <span>ZOOM</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-32 sm:w-44 accent-white cursor-pointer"
            />
            <span className="text-white w-8">{zoom.toFixed(1)}x</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setCrop({ x: 0, y: 0 });
            }}
            className="hover:text-white underline underline-offset-2"
          >
            RESET
          </button>
        </div>

        {/* Footer Actions */}
        <div className="h-[56px] px-5 bg-[#121212] border-t border-[#27272a] flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#71717a] uppercase">
            DRAG TO POSITION // SLIDER TO ZOOM
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="h-[34px] px-4 rounded-[5px] border border-[#3f3f46] hover:bg-[#27272a] text-[#d4d4d8] font-mono text-[10px] uppercase tracking-[0.04em] transition-colors"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing}
              className="h-[34px] px-5 rounded-[5px] bg-white hover:bg-[#e4e4e7] text-black font-mono text-[10px] uppercase tracking-[0.06em] font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing && (
                <span className="animate-spin inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
              )}
              <span>{isProcessing ? "PROCESSING..." : "APPLY CROP"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
