import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  helper,
  trend,
}: {
  label: string;
  value: string;
  helper: string;
  trend?: "up" | "down" | "flat";
}) {
  return (
    <Card className="space-y-4 bg-card/85">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            trend === "up" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
            trend === "down" && "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
            trend === "flat" && "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
          )}
        >
          {trend === "up" ? (
            <ArrowUpRight className="size-4" />
          ) : trend === "down" ? (
            <ArrowDownRight className="size-4" />
          ) : (
            <Minus className="size-4" />
          )}
        </div>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{helper}</p>
    </Card>
  );
}
