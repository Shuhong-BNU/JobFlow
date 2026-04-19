import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  value: Date | string | null | undefined,
  pattern = "yyyy-MM-dd",
) {
  if (!value) {
    return "未设置";
  }

  return format(new Date(value), pattern, { locale: zhCN });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "未设置";
  }

  return format(new Date(value), "yyyy-MM-dd HH:mm", { locale: zhCN });
}

export function formatRelativeTime(value: Date | string | null | undefined) {
  if (!value) {
    return "未设置";
  }

  return formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
    locale: zhCN,
  });
}

export function describeDeadline(value: Date | string | null | undefined) {
  if (!value) {
    return "暂无截止日期";
  }

  const date = new Date(value);

  if (isToday(date)) {
    return "今天截止";
  }

  if (isTomorrow(date)) {
    return "明天截止";
  }

  if (isPast(date)) {
    return "已逾期";
  }

  return `${formatDistanceToNowStrict(date, { locale: zhCN })}后截止`;
}

export function getInitials(name: string | null | undefined) {
  if (!name) {
    return "JF";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
