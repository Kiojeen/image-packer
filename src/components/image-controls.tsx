import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function ImageControlsRoot() {
  return (
    <div
      id="image-controls-root"
      className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center border bg-background/90 p-2 backdrop-blur-md empty:hidden"
    />
  );
}

interface ImageControlsProps {
  children: React.ReactNode;
}

function ImageControls({ children }: ImageControlsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = document.getElementById("image-controls-root");

  if (!target) return null;

  return createPortal(children, target);
}

export { ImageControlsRoot, ImageControls };
