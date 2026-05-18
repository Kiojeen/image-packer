import React, { useCallback, useMemo, useState } from "react";
import { useAppContext } from "@/context/app-context";
import { IconDownload, IconLoader2 } from "@tabler/icons-react";

import {
  ARTBOARD_WIDTH_PX,
  CM_TO_PX,
  packImages,
  PX_TO_CM,
  savePackedImagesAsCmykJpeg,
  UI_PREVIEW_SCALE,
} from "@/lib/image-packer-util";
import { Button } from "@/components/ui/button";
import { ImageControls } from "./image-controls";

const ImagePacker: React.FC = () => {
  const { images, updateImage } = useAppContext();

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isSavingCmyk, setIsSavingCmyk] = useState(false);

  const selectedImage =
    images.find((img) => img.id === selectedImageId) ?? null;

  const { packedImages, canvasHeight } = useMemo(
    () => packImages(images),
    [images]
  );

  const handleSaveCmykJpeg = useCallback(async () => {
    if (isSavingCmyk || packedImages.length === 0) {
      return;
    }

    setIsSavingCmyk(true);

    try {
      await savePackedImagesAsCmykJpeg(packedImages, canvasHeight);
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? `Could not save CMYK JPG: ${error.message}`
          : "Could not save CMYK JPG."
      );
    } finally {
      setIsSavingCmyk(false);
    }
  }, [canvasHeight, isSavingCmyk, packedImages]);

  function pxToDisplayCm(px: number) {
    return Number((px * PX_TO_CM).toFixed(2));
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <div
        className="relative shrink-0 bg-white"
        style={{
          width: ARTBOARD_WIDTH_PX,
          height: canvasHeight,
          transform: `scale(${UI_PREVIEW_SCALE})`,
          transformOrigin: "center center",
        }}
      >
        {packedImages.map((img) => {
          const isSelected = img.id === selectedImageId;

          return (
            <div
              key={img.id}
              onClick={() => setSelectedImageId(img.id)}
              style={{
                position: "absolute",
                left: img.left,
                top: img.top,
                width: img.renderW,
                height: img.renderH,
                overflow: "hidden",
                cursor: "pointer",
                outline: isSelected ? "8px solid #3b82f6" : "1px solid #eee",
              }}
            >
              <img
                src={img.url}
                alt={img.name}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  display: "block",
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  maxWidth: "none",
                  transformOrigin: "top left",
                  transform: img.isRotated
                    ? `matrix(0, 1, -1, 0, ${img.renderW}, 0)`
                    : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {packedImages.length > 0 && (
        <ImageControls>
          {selectedImage && (
            <>
              {/* height */}
              <div className="flex items-center gap-2">
                <span className="text-sm">H</span>

                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={pxToDisplayCm(selectedImage.naturalHeight)}
                  className="w-24 border bg-background px-2 py-1"
                  onChange={(e) => {
                    const cm = e.currentTarget.valueAsNumber;

                    if (!Number.isFinite(cm) || cm <= 0) {
                      return;
                    }

                    updateImage(
                      selectedImage.id,
                      selectedImage.naturalWidth,
                      cm * CM_TO_PX
                    );
                  }}
                />

                <span className="text-sm text-muted-foreground">cm</span>
              </div>

              {/* width */}
              <div className="flex items-center gap-2">
                <span className="text-sm">W</span>

                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={pxToDisplayCm(selectedImage.naturalWidth)}
                  className="w-24 border bg-background px-2 py-1"
                  onChange={(e) => {
                    const cm = e.currentTarget.valueAsNumber;

                    if (!Number.isFinite(cm) || cm <= 0) {
                      return;
                    }

                    updateImage(
                      selectedImage.id,
                      cm * CM_TO_PX,
                      selectedImage.naturalHeight
                    );
                  }}
                />

                <span className="text-sm text-muted-foreground">cm</span>
              </div>

              <div className="mx-1 h-4 w-px bg-border" />
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSaveCmykJpeg}
            disabled={isSavingCmyk}
          >
            {isSavingCmyk ? (
              <IconLoader2 className="animate-spin" />
            ) : (
              <IconDownload />
            )}
            {isSavingCmyk ? "Saving" : "CMYK JPG"}
          </Button>
        </ImageControls>
      )}
    </div>
  );
};


export default ImagePacker;
