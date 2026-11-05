import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Check,
  Crop,
  FlipHorizontal,
  Maximize2,
  Move,
  RefreshCw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export interface AspectPreset {
  label: string;
  ratio: number | null; // null for freeform
  hint?: string;
}

export const DEFAULT_ASPECT_PRESETS: AspectPreset[] = [
  { label: '16:9', ratio: 16 / 9, hint: 'Hero Slider & Banners' },
  { label: '21:9', ratio: 21 / 9, hint: 'Ultra-wide Cinematic' },
  { label: '4:3', ratio: 4 / 3, hint: 'Standard Photo' },
  { label: '1:1', ratio: 1, hint: 'Square / Profile' },
  { label: '3:4', ratio: 3 / 4, hint: 'Book / Flyer Portrait' },
  { label: 'Original', ratio: null, hint: 'Keep Source Ratio' },
];

interface ImageCropperModalProps {
  imageSrc: string;
  fileName?: string;
  initialAspect?: number | null;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

export function ImageCropperModal({
  imageSrc,
  fileName = 'cropped-photograph.jpg',
  initialAspect = 16 / 9,
  onConfirm,
  onCancel,
}: ImageCropperModalProps) {
  const [selectedRatio, setSelectedRatio] = useState<number | null>(initialAspect);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // Transform states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Load image safely to prevent CORS tainted canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setImageLoaded(true);
      imageElementRef.current = img;
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Compute crop box aspect ratio
  const activeRatio = selectedRatio ?? (naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 16 / 9);

  // Mouse / Touch drag handlers for panning image inside crop frame
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(3.5, Math.max(0.6, Number((prev + delta).toFixed(2)))));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlip = () => {
    setFlipH((prev) => !prev);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setPan({ x: 0, y: 0 });
  };

  const handleFitCover = () => {
    setZoom(1.15);
    setPan({ x: 0, y: 0 });
  };

  // Generate cropped output at high resolution
  const handleApplyCrop = async () => {
    if (!imageElementRef.current || !containerRef.current) return;
    setProcessing(true);

    try {
      const img = imageElementRef.current;
      const cropContainer = containerRef.current;
      const containerRect = cropContainer.getBoundingClientRect();

      // Output resolution target (preserving high DPI up to 2048px width)
      const targetWidth = Math.min(2048, Math.max(1200, Math.round(naturalWidth)));
      const targetHeight = Math.round(targetWidth / activeRatio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context unavailable');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill background in case of transparent PNG/WebP
      ctx.fillStyle = '#060E24';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Save context for transform matrix
      ctx.save();

      // Move to center of canvas
      ctx.translate(targetWidth / 2, targetHeight / 2);

      // Apply pan scaled from screen container space to high-res canvas space
      const scaleToCanvas = targetWidth / containerRect.width;
      ctx.translate(pan.x * scaleToCanvas, pan.y * scaleToCanvas);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply flip
      if (flipH) {
        ctx.scale(-1, 1);
      }

      // Calculate base image size to match screen visual scale
      // In screen view, the image is rendered with width: 100% of its base bounds * zoom
      // We scale the draw size to match what was visible on screen
      const visualBaseWidth = containerRect.width;
      const visualBaseHeight = (containerRect.width / img.naturalWidth) * img.naturalHeight;

      const drawWidth = visualBaseWidth * zoom * scaleToCanvas;
      const drawHeight = visualBaseHeight * zoom * scaleToCanvas;

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

      ctx.restore();

      // Export canvas to high-quality JPEG Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });

      if (!blob) {
        throw new Error('Failed to generate cropped image blob.');
      }

      const cleanFileName = fileName.replace(/\.[^/.]+$/, '') + '.jpg';
      const file = new File([blob], cleanFileName, { type: 'image/jpeg' });
      onConfirm(file);
    } catch (err) {
      console.error('[Cropper] Export error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-[#081533] border border-white/15 text-white shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C6922C]/20 border border-[#C6922C]/40 text-[#DDB04F] flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 id="cropper-modal-title" className="font-serif text-lg font-semibold text-white">
                Crop & Fit Photograph
              </h3>
              <p className="text-[11px] text-slate-400">
                Drag to position · Use zoom & frame presets to fit perfectly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="px-6 py-3 border-b border-white/10 bg-[#060E24]/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs text-slate-300">
            <span className="font-semibold text-white mr-1">Frame Preset:</span>
            <div className="inline-flex flex-wrap items-center gap-1.5">
              {DEFAULT_ASPECT_PRESETS.map((preset) => {
                const isSelected = selectedRatio === preset.ratio;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSelectedRatio(preset.ratio);
                      handleReset();
                    }}
                    title={preset.hint}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C6922C] text-[#081533] font-bold shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-[11px] text-[#DDB04F] font-mono">
            {selectedRatio ? `${selectedRatio.toFixed(2)}:1 Ratio` : 'Original Ratio'}
          </span>
        </div>

        {/* Visual Crop Viewport */}
        <div
          className="relative flex-1 bg-black/60 overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[420px] p-4 select-none"
          onWheel={handleWheel}
        >
          {/* Crop Container with Target Aspect Ratio */}
          <div
            ref={containerRef}
            style={{
              aspectRatio: `${activeRatio}`,
              maxHeight: 'calc(95vh - 280px)',
              maxWidth: '100%',
              width: activeRatio >= 1 ? '100%' : 'auto',
              height: activeRatio < 1 ? '100%' : 'auto',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`relative rounded-lg overflow-hidden border-2 border-[#C6922C] shadow-2xl bg-[#060E24] cursor-grab active:cursor-grabbing flex items-center justify-center`}
          >
            {/* The Image being transformed */}
            {imageLoaded && (
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${
                    flipH ? -zoom : zoom
                  }, ${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  pointerEvents: 'none',
                }}
                className="select-none object-contain"
              />
            )}

            {/* Rule of Thirds Grid Overlay */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Move hint badge */}
            <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white/80">
              <Move className="w-3 h-3 text-[#DDB04F]" />
              <span>Drag image to position</span>
            </div>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#060E24] flex flex-wrap items-center justify-between gap-4 shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="text-slate-400 font-medium">Zoom:</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="0.6"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-24 sm:w-36 accent-[#C6922C] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] text-[#DDB04F] min-w-10">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Transform shortcuts */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRotate}
              title="Rotate 90 degrees clockwise"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rotate</span>
            </button>

            <button
              type="button"
              onClick={handleFlip}
              title="Flip horizontally"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flip</span>
            </button>

            <button
              type="button"
              onClick={handleFitCover}
              title="Fill frame"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fill Frame</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="Reset zoom and position"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-400 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={processing || !imageLoaded}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-[#C6922C] to-[#DDB04F] hover:from-[#B38222] hover:to-[#C6922C] text-[#081533] text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{processing ? 'Applying Crop...' : 'Apply & Save Crop'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
