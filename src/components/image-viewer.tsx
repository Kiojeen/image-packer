import type { ImageItem } from "@/context/app-context";

interface ImageViewerProps {
  image: ImageItem;
}

export function ImageViewer({ image }: ImageViewerProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-2/3">
        <img
          src={image.url}
          className="block h-full w-full object-contain select-none"
          alt={image.name}
          draggable={false}
        />
      </div>
    </div>
  );
}
