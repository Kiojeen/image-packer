import React from "react";
import { useAppContext } from "@/context/app-context";
import { IconUpload } from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import IPLogoTranparent from "./ip-logo-transparent";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    images,
    activeImage,
    activeCanvas,
    addImages,
    selectImage,
    selectTileCanvas,
  } = useAppContext();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    addImages(e.target.files);
    e.target.value = "";
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="flex h-(--header-height) flex-row items-center border-b px-4 py-3">
        <IPLogoTranparent className="size-6 text-foreground/80 dark:text-foreground" />
        <h2 className="text-sm font-semibold tracking-wider uppercase">
          Image Packer
        </h2>
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
                    isActive={activeImage?.id === image.id}
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
                      <span className="truncate font-medium">
                        <p>{image.name}</p>
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu className="gap-2">
          {images.length > 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeCanvas === "tile"}
                className="h-12 w-full px-3"
                onClick={selectTileCanvas}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 grid-cols-2 gap-px overflow-hidden border bg-muted p-0.5">
                    {images.slice(0, 4).map((image) => (
                      <img
                        key={image.id}
                        src={image.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ))}
                    {images.length < 4 &&
                      Array.from({ length: 4 - images.length }).map(
                        (_, index) => (
                          <div key={index} className="bg-background" />
                        )
                      )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">Tiled Canvas</span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {images.length} images
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
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
                <IconUpload className="h-5 w-5 group-hover:text-primary" />
                <span className="text-xs font-medium">Upload Image</span>
              </div>
            </label>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
