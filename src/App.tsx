"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  IconPhoto,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
} from "@tabler/icons-react"

interface ImageItem {
  id: string
  name: string
  url: string
  size: string
  type: string
  dimensions?: string
}

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  const activeImage = images.find((img) => img.id === activeId)

  return (
    <div className="flex h-svh w-full gap-6 overflow-hidden bg-background p-6">
      <div className="relative flex-1 overflow-hidden border bg-muted/30 shadow-inner">
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {activeImage ? (
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-12">
            {/* The "Artboard" */}
            <div
              style={{ transform: `scale(${zoom / 100})` }}
              className="transition-transform duration-200 ease-out"
            >
              <div className="group relative border-4 border-black/5 bg-white p-1 shadow-2xl">
                <img
                  // src={activeImage.url}
                  className="block max-h-[60vh] max-w-full"
                  alt="Canvas target"
                />
              </div>
            </div>

            {/* Floating Zoom Controls */}
            <div className="absolute bottom-6 flex items-center gap-2 border bg-background/80 p-2 shadow-xl backdrop-blur-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.max(20, z - 10))}
                className="h-8 w-8"
              >
                <IconZoomOut size={16} />
              </Button>
              <span className="min-w-12 text-center text-[10px] font-bold tabular-nums">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                className="h-8 w-8"
              >
                <IconZoomIn size={16} />
              </Button>
              <div className="mx-1 h-4 w-px bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(100)}
                className="h-8 w-8"
              >
                <IconMaximize size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="p-4">
              <IconPhoto size={32} stroke={1.5} />
            </div>
            <p className="text-sm font-medium">
              Select an image to view on canvas
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
