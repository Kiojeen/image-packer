"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAppContext } from "@/context/app-context"
import {
  IconPhoto,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconTrash,
} from "@tabler/icons-react"

export default function App() {
  const [zoom, setZoom] = useState(100)
  const { activeImage, deleteImage } = useAppContext()

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
              <img
                src={activeImage.url}
                className="block max-h-[60vh] max-w-full"
                alt={activeImage.name}
              />
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
              <div className="mx-1 h-4 w-px bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteImage(activeImage.id)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete image"
              >
                <IconTrash size={16} />
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
