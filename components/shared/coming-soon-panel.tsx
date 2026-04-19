import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function ComingSoonPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-card/85">
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/applications">
            先回到申请看板
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
