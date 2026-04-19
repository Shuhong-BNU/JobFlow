import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex min-h-56 flex-col items-start justify-center gap-4 border-dashed bg-card/80",
        className,
      )}
    >
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-xl">{description}</CardDescription>
      </div>
      {action}
    </Card>
  );
}
