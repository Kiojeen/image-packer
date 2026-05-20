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
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

const ImagePacker: React.FC = () => {
  const { images, updateImage } = useAppContext();

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isSavingCmyk, setIsSavingCmyk] = useState(false);

  const [isLabled, setIsLabled] = useState(false);

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
      await savePackedImagesAsCmykJpeg(packedImages, canvasHeight, isLabled);
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
  }, [canvasHeight, isSavingCmyk, packedImages, isLabled]);

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
            <React.Fragment key={img.id}>
              <div
                onClick={() => setSelectedImageId(img.id)}
                style={{
                  position: "absolute",
                  left: img.left,
                  top: img.top,
                  width: img.renderW,
                  height: img.renderH,
                  overflow: "hidden",
                  cursor: "pointer",
                  outline: isSelected ? "12px solid #3b82f6" : "1px solid #eee",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: img.sourceW,
                    height: img.sourceH,
                    overflow: "hidden",
                    transformOrigin: "top left",
                    transform: img.isRotated
                      ? `translate(${img.renderW}px, 0) rotate(90deg)`
                      : "none",
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    style={{
                      position: "absolute",
                      left: -img.sourceX,
                      top: -img.sourceY,
                      display: "block",
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                      maxWidth: "none",
                    }}
                  />
                </div>
              </div>
              {isLabled && (
                <div
                  key={`${img.id}-label`}
                  style={{
                    position: "absolute",
                    left: img.left,
                    top: img.top + img.renderH + 4,
                    fontSize: "42px",
                    color: "black",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 5,
                    fontFamily: "monospace",
                    lineHeight: 1.2,
                  }}
                >
                  W: {pxToDisplayCm(img.sourceW)} cm | H:{" "}
                  {pxToDisplayCm(img.sourceH)} cm
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {packedImages.length > 0 && (
        <ImageControls>
          {selectedImage && (
            <>
              <div className="flex gap-2 text-xs">
                {/* height */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">H:</span>
                  <Input
                    type="number"
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
                </div>

                {/* width */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">W:</span>
                  <Input
                    type="number"
                    value={pxToDisplayCm(selectedImage.naturalWidth)}
                    className="h-8 w-24 px-2"
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

          <Checkbox
            checked={isLabled}
            onCheckedChange={(checked) => setIsLabled(checked === true)}
          />
        </ImageControls>
      )}
    </div>
  );
};

export default ImagePacker;
