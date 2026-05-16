import EmptyCanvas from "./components/empty-canvas";
import TiledCanvas from "./components/image-packer";
import { ImageViewer } from "./components/image-viewer";
import { useAppContext } from "./context/app-context";

export default function App() {
  const { activeImage, activeCanvas } = useAppContext();

  return (
    <div className="relative flex h-full w-full gap-6 overflow-hidden bg-background p-4">
      <div className="relative flex-1 overflow-hidden overflow-y-auto border bg-muted/30 shadow-inner">
        {activeCanvas === "image" && activeImage ? (
          <ImageViewer image={activeImage} />
        ) : activeCanvas === "tile" ? (
          <TiledCanvas />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <EmptyCanvas />
          </div>
        )}
      </div>
    </div>
  );
}
