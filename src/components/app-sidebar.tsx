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
} from "@tabler/icons-react"
import React from "react"
import { useAppContext } from "@/context/app-context"
import { ThemeToggle } from "./theme-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function AppSidebar() {
  const { images, activeImageId, addImages, selectImage } = useAppContext()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    addImages(e.target.files)
    e.target.value = ""
  }

  return (
    <div className="flex h-dvh bg-background">
      {/* Primary Sidebar: List of uploaded images */}
      <Sidebar
        side="left"
        variant="sidebar"
        collapsible="none"
        className="w-80 border-r"
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
                      onClick={() => selectImage(image.id)}
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
                  multiple
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
    </div>
  )
}
