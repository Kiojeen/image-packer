"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  IconUpload,
  IconX,
  IconPhoto,
  IconInfoCircle,
  IconCalendar,
  IconFileDescription,
  IconWeight,
  type Icon,
} from "@tabler/icons-react"
import React, { useState } from "react"
import { ThemeToggle } from "./theme-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

// Define the structure for our uploaded images and metadata
interface ImageItem {
  id: string
  name: string
  url: string
  size: string
  type: string
  lastModified: string
  dimensions?: string
}

export function AppSidebar() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [activeImageId, setActiveImageId] = useState<string | null>(null)

  // Find the currently selected image object
  const activeImage = images.find((img) => img.id === activeImageId)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a local URL for the image preview
      const imageUrl = URL.createObjectURL(file)

      const newImage: ImageItem = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        url: imageUrl,
        size: (file.size / 1024).toFixed(2) + " KB",
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleDateString(),
      }

      setImages((prev) => [...prev, newImage])
      setActiveImageId(newImage.id) // Automatically select the new image
    }
  }

  return (
    <div className="flex h-dvh bg-background">
      {/* Primary Sidebar: List of uploaded images */}
      <Sidebar
        side="left"
        variant="sidebar"
        collapsible="none"
        className="w-64 border-r"
      >
        <SidebarHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Image Tiler
          </h2>

          <ThemeToggle />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {images.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No images uploaded yet.
                  </div>
                )}
                {images.map((image) => (
                  <SidebarMenuItem key={image.id}>
                    <SidebarMenuButton
                      isActive={activeImageId === image.id}
                      className="h-12 w-full px-3"
                      onClick={() => setActiveImageId(image.id)}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="h-8 w-8 shrink-0 overflow-hidden border bg-muted">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <Tooltip>
                          <TooltipTrigger className="truncate font-medium">
                            {image.name}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{image.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <label className="group flex w-full cursor-pointer items-center justify-center border border-dashed border-muted-foreground/50 p-4 transition-colors hover:border-primary hover:bg-accent">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-2">
                  <IconUpload className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  <span className="text-xs font-medium">Upload Image</span>
                </div>
              </label>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Secondary Sidebar: Image Metadata */}
      {activeImage && (
        <Sidebar
          side="left"
          variant="sidebar"
          collapsible="none"
          className="w-80 animate-in border-r duration-200 slide-in-from-left-5"
        >
          <SidebarHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Image Details
            </h3>
            <button
              onClick={() => setActiveImageId(null)}
              className="flex h-6 w-6 items-center justify-center hover:bg-accent"
            >
              <IconX className="size-4" />
            </button>
          </SidebarHeader>

          <SidebarContent>
            {/* Image Preview in secondary menu */}
            <div className="p-4">
              <div className="aspect-video w-full overflow-hidden border bg-muted">
                <img
                  src={activeImage.url}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
                  {/* File Name */}
                  <MetadataRow
                    icon={IconFileDescription}
                    label="Name"
                    value={activeImage.name}
                  />
                  {/* File Size */}
                  <MetadataRow
                    icon={IconWeight}
                    label="Size"
                    value={activeImage.size}
                  />
                  {/* File Type */}
                  <MetadataRow
                    icon={IconPhoto}
                    label="Format"
                    value={activeImage.type.split("/")[1].toUpperCase()}
                  />
                  {/* Modified Date */}
                  <MetadataRow
                    icon={IconCalendar}
                    label="Uploaded"
                    value={activeImage.lastModified}
                  />
                  {/* Info */}
                  <MetadataRow
                    icon={IconInfoCircle}
                    label="MIME Type"
                    value={activeImage.type}
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </div>
  )
}

// Helper component for the metadata rows
function MetadataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: Icon
  label: string
  value: string
}) {
  return (
    <SidebarMenuItem>
      <div className="flex items-start gap-3 px-3 py-2 text-sm">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
            {label}
          </span>
          <span className="truncate font-medium">{value}</span>
        </div>
      </div>
    </SidebarMenuItem>
  )
}
