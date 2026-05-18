/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface ImageItem {
  id: string;
  name: string;
  url: string;

  naturalHeight: number;
  naturalWidth: number;

  cropHeight: number;
  cropWidth: number;
  cropX: number;
  cropY: number;
}

function createImageItem(file: File): ImageItem {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    url: URL.createObjectURL(file),
    naturalHeight: 0,
    naturalWidth: 0,
    cropHeight: 0,
    cropWidth: 0,
    cropX: 0,
    cropY: 0,
  };
}

interface AppContextValue {
  images: ImageItem[];
  activeImage: ImageItem | null;
  activeImageId: string | null;
  setActiveImageId: (imageId: string | null) => void;

  activeCanvas: "image" | "tile" | null;
  addImages: (files: FileList | File[]) => void;
  deleteImage: (imageId: string) => void;
  updateImage: (id: string, width: number, height: number) => void;
  updateImageCrop: (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => void;

  selectImage: (imageId: string | null) => void;
  selectTileCanvas: () => void;
}

type ITCV = AppContextValue;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeCanvas, setActiveCanvas] = useState<ITCV["activeCanvas"]>(null);

  const activeImage = useMemo(
    () =>
      activeCanvas === "image"
        ? (images.find((image) => image.id === activeImageId) ?? null)
        : null,
    [activeImageId, activeCanvas, images]
  );

  const imageUrlsRef = useRef<string[]>([]);

  const addImages = useCallback((files: FileList | File[]) => {
    const newImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map(createImageItem);

    if (newImages.length === 0) {
      return;
    }

    imageUrlsRef.current = [
      ...imageUrlsRef.current,
      ...newImages.map((image) => image.url),
    ];

    setImages((prev) => [...prev, ...newImages]);
    setActiveImageId(null);
    setActiveCanvas("tile");

    newImages.forEach((image) => {
      const preview = new Image();
      preview.onload = () => {
        setImages((currentImages) =>
          currentImages.map((currentImage) => {
            if (currentImage.id !== image.id || preview.naturalWidth === 0)
              return currentImage;

            return {
              ...currentImage,
              naturalHeight: preview.naturalHeight,
              naturalWidth: preview.naturalWidth,
            };
          })
        );
      };
      preview.src = image.url;
    });
  }, []);

  /**
   * 1. Revokes image object URL.
   * 2. Deletes the image url from ```imageUrlsRef```.
   * 3. Updates the images state variable.
   * 4. Sets the new active image if deleting the current active image.
   */
  const deleteImage = useCallback((imageId: string) => {
    setImages((currentImages) => {
      const imageIndex = currentImages.findIndex(
        (image) => image.id === imageId
      );

      if (imageIndex === -1) {
        return currentImages;
      }

      const imageToDelete = currentImages[imageIndex];
      URL.revokeObjectURL(imageToDelete.url);
      imageUrlsRef.current = imageUrlsRef.current.filter(
        (url) => url !== imageToDelete.url
      );

      const nextImages = currentImages.filter((image) => image.id !== imageId);

      setActiveImageId((currentActiveImageId) => {
        if (currentActiveImageId !== imageId) {
          return currentActiveImageId;
        }

        const nextActiveImageId =
          nextImages[imageIndex]?.id ?? nextImages[imageIndex - 1]?.id ?? null;

        if (!nextActiveImageId) {
          setActiveCanvas(null);
        }

        return nextActiveImageId;
      });

      return nextImages;
    });
  }, []);

  const updateImage = useCallback(
    (id: string, width: number, height: number) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, naturalWidth: width, naturalHeight: height }
            : img
        )
      );
    },
    []
  );

  const updateImageCrop = useCallback(
    (id: string, width: number, height: number, x: number, y: number) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? {
                ...img,
                cropWidth: width > 0 ? width : img.cropWidth,
                cropHeight: height > 0 ? height : img.cropHeight,
                cropX: x,
                cropY: y,
              }
            : img
        )
      );
    },
    []
  );

  /**
   * Selects an image as the active view
   */
  const selectImage = useCallback((imageId: string | null) => {
    setActiveImageId(imageId);
    setActiveCanvas(imageId ? "image" : null);
  }, []);

  /**
   * Selects the canvas as the active view
   */
  const selectTileCanvas = useCallback(() => {
    setActiveImageId(null);
    setActiveCanvas("tile");
  }, []);

  const value = useMemo(
    () => ({
      images,
      activeImage,

      activeImageId,
      setActiveImageId,

      activeCanvas,

      addImages,
      deleteImage,
      updateImage,
      updateImageCrop,

      selectImage,
      selectTileCanvas,
    }),
    [
      activeCanvas,
      activeImage,
      activeImageId,
      addImages,
      deleteImage,
      images,
      selectImage,
      selectTileCanvas,
      updateImage,
      updateImageCrop,
    ]
  );

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }

  return context;
}
