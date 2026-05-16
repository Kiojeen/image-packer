import { IconPhoto } from "@tabler/icons-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function EmptyCanvas() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <IconPhoto />
        </EmptyMedia>
        <EmptyTitle>No selected images yet</EmptyTitle>
        <EmptyDescription>Select an image to view on canvas</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
