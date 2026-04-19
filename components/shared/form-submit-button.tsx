"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  ...props
}: ButtonProps & {
  idleLabel: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? pendingLabel ?? `${idleLabel}中...` : idleLabel}
    </Button>
  );
}
