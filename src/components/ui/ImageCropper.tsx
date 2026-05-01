"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
};

type Position = { x: number; y: number };

const CONTAINER_SIZE = 400;
const MIN_CROP_SIZE = 60;
const RESIZE_HANDLE_SIZE = 16;
const OUTPUT_SIZE = 600;

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [cropBox, setCropBox] = useState({ x: 50, y: 50, size: 200 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const getRelativePos = (event: React.MouseEvent | React.TouchEvent): Position => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;

    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (event: React.MouseEvent) => {
    event.preventDefault();
    const pos = getRelativePos(event);
    const { x, y, size } = cropBox;

    const onResizeHandle =
      pos.x >= x + size - RESIZE_HANDLE_SIZE &&
      pos.x <= x + size &&
      pos.y >= y + size - RESIZE_HANDLE_SIZE &&
      pos.y <= y + size;

    if (onResizeHandle) {
      setResizing(true);
      return;
    }

    const insideCropBox =
      pos.x >= x && pos.x <= x + size && pos.y >= y && pos.y <= y + size;

    if (insideCropBox) {
      setDragging(true);
      setDragStart({ x: pos.x - x, y: pos.y - y });
    }
  };

  const handlePointerMove = useCallback(
    (event: React.MouseEvent) => {
      if (!dragging && !resizing) return;

      event.preventDefault();
      const pos = getRelativePos(event);

      if (dragging) {
        const nextX = clamp(pos.x - dragStart.x, 0, CONTAINER_SIZE - cropBox.size);
        const nextY = clamp(pos.y - dragStart.y, 0, CONTAINER_SIZE - cropBox.size);
        setCropBox((prev) => ({ ...prev, x: nextX, y: nextY }));
      }

      if (resizing) {
        const nextSize = clamp(
          Math.max(pos.x - cropBox.x, pos.y - cropBox.y),
          MIN_CROP_SIZE,
          Math.min(CONTAINER_SIZE - cropBox.x, CONTAINER_SIZE - cropBox.y),
        );

        setCropBox((prev) => ({ ...prev, size: nextSize }));
      }
    },
    [cropBox, dragStart.x, dragStart.y, dragging, resizing],
  );

  const handlePointerUp = () => {
    setDragging(false);
    setResizing(false);
  };

  const handleCrop = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!image || !canvas || !container) return;

    const imageRect = image.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const displayedWidth = imageRect.width;
    const displayedHeight = imageRect.height;

    if (displayedWidth === 0 || displayedHeight === 0) return;

    const offsetX = imageRect.left - containerRect.left;
    const offsetY = imageRect.top - containerRect.top;
    const scaleX = image.naturalWidth / displayedWidth;
    const scaleY = image.naturalHeight / displayedHeight;

    const sourceX = clamp((cropBox.x - offsetX) * scaleX, 0, image.naturalWidth);
    const sourceY = clamp((cropBox.y - offsetY) * scaleY, 0, image.naturalHeight);
    const sourceWidth = Math.min(cropBox.size * scaleX, image.naturalWidth - sourceX);
    const sourceHeight = Math.min(
      cropBox.size * scaleY,
      image.naturalHeight - sourceY,
    );
    const sourceSize = Math.min(sourceWidth, sourceHeight);

    if (sourceSize <= 0) return;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onCropComplete(blob);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/70 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-float">
        <h3 className="mb-1 font-semibold text-foreground">Crop Photo</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Drag to reposition · Drag corner to resize
        </p>

        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-[1.5rem] bg-foreground select-none"
          style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            className="absolute inset-0 m-auto h-full w-full pointer-events-none"
            style={{ objectFit: "contain" }}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />

          {imageLoaded && (
            <>
              <div className="absolute inset-0 bg-primary/55 pointer-events-none" />

              <div
                className="absolute overflow-hidden border-2 border-white"
                style={{
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.size,
                  height: cropBox.size,
                  cursor: dragging ? "grabbing" : "grab",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt=""
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    width: CONTAINER_SIZE,
                    height: CONTAINER_SIZE,
                    objectFit: "contain",
                    transform: `translate(-${cropBox.x}px, -${cropBox.y}px)`,
                    transformOrigin: "top left",
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                  draggable={false}
                />

                <div className="absolute inset-0 opacity-40">
                  <div
                    className="absolute w-full border-t border-white"
                    style={{ top: "33.3%" }}
                  />
                  <div
                    className="absolute w-full border-t border-white"
                    style={{ top: "66.6%" }}
                  />
                  <div
                    className="absolute h-full border-l border-white"
                    style={{ left: "33.3%" }}
                  />
                  <div
                    className="absolute h-full border-l border-white"
                    style={{ left: "66.6%" }}
                  />
                </div>

                <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-white" />
                <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-white" />
                <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize border-r-2 border-b-2 border-white" />
              </div>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            onClick={handleCrop}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!imageLoaded}
          >
            Use This Crop
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
