import { useEffect, useRef, useState } from "react";
import { useAppContext, type ImageItem } from "@/context/app-context";
import {
  IconDownload,
  IconMaximize,
  IconTrash,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { saveAs } from "file-saver";

import { CM_TO_PX, PX_TO_CM } from "@/lib/image-packer-util";

import { ImageControls } from "./image-controls";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

interface ImageViewerProps {
  image: ImageItem;
}

export function ImageViewer({ image }: ImageViewerProps) {
  const { deleteImage, updateImageCrop } = useAppContext();

  // Zoom states
  const [scale, setScale] = useState(1);
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setScale(1);

  // Crop states
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMeasured, setIsMeasured] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Input string states
  const [xInput, setXInput] = useState("");
  const [yInput, setYInput] = useState("");
  const [wInput, setWInput] = useState("");
  const [hInput, setHInput] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, cropX: 0, cropY: 0 });
  const displayScale =
    containerSize.width > 0 && image.naturalWidth > 0
      ? containerSize.width / image.naturalWidth
      : 1;

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) return;

    // Decide initial crop from context or full container
    let initialCrop = {
      x: 0,
      y: 0,
      w: image.naturalWidth,
      h: image.naturalHeight,
    };

    // If the image already has stored crop dimensions (from previous session / edit)
    if (image.cropWidth > 0 && image.cropHeight > 0) {
      // Clamp stored values to current container size (in case window was resized)
      const clampedW = Math.min(image.cropWidth, image.naturalWidth);
      const clampedH = Math.min(image.cropHeight, image.naturalHeight);
      const clampedX = Math.min(image.cropX, image.naturalWidth - clampedW);
      const clampedY = Math.min(image.cropY, image.naturalHeight - clampedH);

      initialCrop = {
        x: Math.max(0, clampedX),
        y: Math.max(0, clampedY),
        w: clampedW,
        h: clampedH,
      };
    }

    /* eslint-disable react-hooks/set-state-in-effect */
    setCrop(initialCrop);
    setXInput((initialCrop.x * PX_TO_CM).toFixed(2));
    setYInput((initialCrop.y * PX_TO_CM).toFixed(2));
    setWInput((initialCrop.w * PX_TO_CM).toFixed(2));
    setHInput((initialCrop.h * PX_TO_CM).toFixed(2));
    setIsMeasured(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Only update context if the crop actually changed from stored values
    const needsUpdate =
      image.cropX !== initialCrop.x ||
      image.cropY !== initialCrop.y ||
      image.cropWidth !== initialCrop.w ||
      image.cropHeight !== initialCrop.h;

    if (needsUpdate) {
      updateImageCrop(
        image.id,
        initialCrop.w,
        initialCrop.h,
        initialCrop.x,
        initialCrop.y
      );
    }
  }, [
    image.id,
    image.naturalWidth,
    image.naturalHeight,
    image.cropWidth,
    image.cropHeight,
    image.cropX,
    image.cropY,
    updateImageCrop,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = (e.clientX - dragStart.current.mouseX) / scale / displayScale;
    const dy = (e.clientY - dragStart.current.mouseY) / scale / displayScale;

    let newX = dragStart.current.cropX + dx;
    let newY = dragStart.current.cropY + dy;

    newX = Math.max(0, Math.min(newX, image.naturalWidth - crop.w));
    newY = Math.max(0, Math.min(newY, image.naturalHeight - crop.h));

    setCrop({ ...crop, x: newX, y: newY });

    setXInput((newX * PX_TO_CM).toFixed(2));
    setYInput((newY * PX_TO_CM).toFixed(2));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      updateImageCrop(image.id, crop.w, crop.h, crop.x, crop.y);
    }
  };

  const handleChange = (field: "x" | "y" | "w" | "h", val: string) => {
    const cw = image.naturalWidth;
    const ch = image.naturalHeight;
    const parsed = parseFloat(val);

    if (field === "x") setXInput(val);
    if (field === "y") setYInput(val);
    if (field === "w") setWInput(val);
    if (field === "h") setHInput(val);

    if (!isNaN(parsed) && parsed >= 0) {
      const pxVal = parsed * CM_TO_PX;

      setCrop((prev) => {
        const next = { ...prev };

        if (field === "x") {
          next.x = Math.max(0, Math.min(pxVal, cw - prev.w));
        }
        if (field === "y") {
          next.y = Math.max(0, Math.min(pxVal, ch - prev.h));
        }
        if (field === "w") {
          next.w = Math.min(pxVal, cw);
          next.x = Math.min(prev.x, cw - next.w);
          if (next.x !== prev.x) setXInput((next.x * PX_TO_CM).toFixed(2));
        }
        if (field === "h") {
          next.h = Math.min(pxVal, ch);
          next.y = Math.min(prev.y, ch - next.h); // Shift Y if H pushes out of bounds
          if (next.y !== prev.y) setYInput((next.y * PX_TO_CM).toFixed(2));
        }

        updateImageCrop(image.id, next.w, next.h, next.x, next.y);
        return next;
      });
    }
  };

  const formatInputsOnSubmit = () => {
    setXInput((crop.x * PX_TO_CM).toFixed(2));
    setYInput((crop.y * PX_TO_CM).toFixed(2));
    setWInput((crop.w * PX_TO_CM).toFixed(2));
    setHInput((crop.h * PX_TO_CM).toFixed(2));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") formatInputsOnSubmit();
  };

  const handleDownload = async (format: "png" | "jpeg") => {
    const imgElement = new Image();
    imgElement.crossOrigin = "anonymous";
    imgElement.src = image.url;

    await new Promise((resolve) => {
      imgElement.onload = resolve;
    });

    const ratioX = imgElement.naturalWidth / image.naturalWidth;
    const ratioY = imgElement.naturalHeight / image.naturalHeight;

    const actualX = crop.x * ratioX;
    const actualY = crop.y * ratioY;
    const actualW = crop.w * ratioX;
    const actualH = crop.h * ratioY;

    const canvas = document.createElement("canvas");
    canvas.width = actualW;
    canvas.height = actualH;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    if (format === "jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, actualW, actualH);
    }

    ctx.drawImage(
      imgElement,
      actualX,
      actualY,
      actualW,
      actualH,
      0,
      0,
      actualW,
      actualH
    );

    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const quality = format === "jpeg" ? 0.92 : undefined;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        // Strip original extension from image.name, then add desired format
        const baseName = image.name?.replace(/\.[^/.]+$/, "") || "image";
        const fileName = `downloaded-${baseName}.${format}`;

        saveAs(blob, fileName);
      },
      mimeType,
      quality
    );
  };

  const resetCrop = () => {
    const cw = image.naturalWidth;
    const ch = image.naturalHeight;

    setCrop({ x: 0, y: 0, w: cw, h: ch });
    setXInput("0.00");
    setYInput("0.00");
    setWInput((cw * PX_TO_CM).toFixed(2));
    setHInput((ch * PX_TO_CM).toFixed(2));
    updateImageCrop(image.id, cw, ch, 0, 0);
  };

  return (
    <>
      <div
        className="flex h-full items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex h-2/3 w-full items-center justify-center">
          <div
            ref={containerRef}
            className="relative transition-transform duration-200"
            style={{
              aspectRatio: `${image.naturalWidth} / ${image.naturalHeight}`,
              maxHeight: "100%",
              maxWidth: "100%",
              transform: `scale(${scale})`,
            }}
          >
            <img
              src={image.url}
              className="block h-full w-full select-none"
              alt={image.name}
              draggable={false}
            />

            {/* Grid overlay*/}
            {isMeasured && (
              <div
                className="absolute z-10 cursor-move border-2 border-primary"
                style={{
                  left: crop.x * displayScale,
                  top: crop.y * displayScale,
                  width: crop.w * displayScale,
                  height: crop.h * displayScale,
                }}
                onMouseDown={handleMouseDown}
              >
                {/* 3x3 Grid Lines */}
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-evenly">
                  <div className="w-full border-b border-primary/40" />
                  <div className="w-full border-b border-primary/40" />
                </div>
                <div className="pointer-events-none absolute inset-0 flex flex-row justify-evenly">
                  <div className="h-full border-r border-primary/40" />
                  <div className="h-full border-r border-primary/40" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageControls>
        {/* Zoom Controls */}
        <div className="flex flex-row items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            title="Zoom out"
            onClick={handleZoomOut}
            disabled={scale <= 0.25}
          >
            <IconZoomOut />
          </Button>

          <Button variant="link" onClick={handleResetZoom} title="Reset zoom">
            {Math.round(scale * 100)}%
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Zoom in"
            onClick={handleZoomIn}
            disabled={scale >= 4}
          >
            <IconZoomIn />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-2 my-auto h-4" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">CROP:</span>
          <div className="flex border p-2 text-xs">
            {/* X / Y Position Inputs */}
            <div className="flex items-center gap-3 px-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">X:</span>
                <Input
                  value={xInput}
                  onChange={(e) => handleChange("x", e.target.value)}
                  onBlur={formatInputsOnSubmit}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-16 px-2 text-center"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Y:</span>
                <Input
                  value={yInput}
                  onChange={(e) => handleChange("y", e.target.value)}
                  onBlur={formatInputsOnSubmit}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-16 px-2 text-center"
                />
              </div>
            </div>

            <Separator orientation="vertical" className="my-auto h-4" />

            {/* W / H Dimension Inputs */}
            <div className="flex items-center gap-3 px-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">W:</span>
                <Input
                  value={wInput}
                  onChange={(e) => handleChange("w", e.target.value)}
                  onBlur={formatInputsOnSubmit}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-16 px-2 text-center"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">H:</span>
                <Input
                  value={hInput}
                  onChange={(e) => handleChange("h", e.target.value)}
                  onBlur={formatInputsOnSubmit}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-16 px-2 text-center"
                />
                <span className="text-muted-foreground">cm</span>
              </div>
            </div>

            {/* Reset Crop Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={resetCrop}
              title="Reset crop to full image"
            >
              <IconMaximize />
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-2 my-auto h-4" />

        {/* Action Buttons */}
        <div className="flex">
          {/* Download */}
          <DropdownMenu>
            <DropdownMenuTrigger title="Download image as" asChild>
              <Button variant="ghost" size="icon">
                <IconDownload />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload("png")}>
                PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("jpeg")}>
                JPEG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            title="Delete Image"
            onClick={() => deleteImage(image.id)}
          >
            <IconTrash className="text-destructive" />
          </Button>
        </div>
      </ImageControls>
    </>
  );
}
