interface ImageControlsProps {
  children?: React.ReactNode;
}

export default function ImageControlsContainer({
  children,
}: ImageControlsProps) {
  return (
    <div className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center gap-2 border bg-background/90 p-2 backdrop-blur-md">
      {children}
    </div>
  );
}
