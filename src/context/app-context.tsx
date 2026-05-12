"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

export interface ImageItem {
  id: string
  name: string
  url: string
  size: string
  type: string
  lastModified: string
  dimensions?: string
}

interface AppContextValue {
  images: ImageItem[]
  activeImage: ImageItem | null
  activeImageId: string | null
  addImages: (files: FileList | File[]) => void
  deleteImage: (imageId: string) => void
  selectImage: (imageId: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function createImageItem(file: File): ImageItem {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    url: URL.createObjectURL(file),
    size: formatFileSize(file.size),
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleDateString(),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [activeImageId, setActiveImageId] = useState<string | null>(null)
  const imageUrlsRef = useRef<string[]>([])

  const activeImage = useMemo(
    () => images.find((image) => image.id === activeImageId) ?? null,
    [activeImageId, images]
  )

  const addImages = useCallback((files: FileList | File[]) => {
    const newImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map(createImageItem)

    if (newImages.length === 0) {
      return
    }

    imageUrlsRef.current = [
      ...imageUrlsRef.current,
      ...newImages.map((image) => image.url),
    ]
    setImages((currentImages) => [...currentImages, ...newImages])
    setActiveImageId(newImages[0].id)
  }, [])

  const deleteImage = useCallback((imageId: string) => {
    setImages((currentImages) => {
      const imageIndex = currentImages.findIndex((image) => image.id === imageId)

      if (imageIndex === -1) {
        return currentImages
      }

      const imageToDelete = currentImages[imageIndex]
      URL.revokeObjectURL(imageToDelete.url)
      imageUrlsRef.current = imageUrlsRef.current.filter(
        (url) => url !== imageToDelete.url
      )

      const nextImages = currentImages.filter((image) => image.id !== imageId)

      setActiveImageId((currentActiveImageId) => {
        if (currentActiveImageId !== imageId) {
          return currentActiveImageId
        }

        return (
          nextImages[imageIndex]?.id ??
          nextImages[imageIndex - 1]?.id ??
          null
        )
      })

      return nextImages
    })
  }, [])

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const value = useMemo(
    () => ({
      images,
      activeImage,
      activeImageId,
      addImages,
      deleteImage,
      selectImage: setActiveImageId,
    }),
    [activeImage, activeImageId, addImages, deleteImage, images]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider")
  }

  return context
}
