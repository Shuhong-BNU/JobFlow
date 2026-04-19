import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function serializeValue(value: unknown): unknown {
  if (value instanceof Error) {
    const ownEntries = Object.fromEntries(
      Object.getOwnPropertyNames(value).map((key) => [
        key,
        serializeValue((value as unknown as Record<string, unknown>)[key]),
      ]),
    );

    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...ownEntries,
    };
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)]),
    );
  }

  return value;
}

function toLogLine(level: LogLevel, event: string, payload: LogPayload) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    payload: serializeValue(payload),
  });
}

function writeConsole(level: LogLevel, event: string, payload: LogPayload) {
  const prefix = `[jobflow] ${event}`;

  if (level === "error") {
    console.error(prefix, payload);
    return;
  }

  if (level === "warn") {
    console.warn(prefix, payload);
    return;
  }

  console.info(prefix, payload);
}

async function appendRuntimeLog(line: string) {
  if (process.env.JOBFLOW_FILE_LOGGING !== "1") {
    return;
  }

  const logDir = path.join(process.cwd(), ".runtime", "logs");
  const filePath = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`);

  try {
    await mkdir(logDir, { recursive: true });
    await appendFile(filePath, `${line}\n`, "utf8");
  } catch (error) {
    console.error("[jobflow] runtime-log.write.failed", serializeValue(error));
  }
}

export async function logServerEvent(level: LogLevel, event: string, payload: LogPayload = {}) {
  const line = toLogLine(level, event, payload);
  writeConsole(level, event, payload);
  await appendRuntimeLog(line);
}

export async function measureServerOperation<T>(
  event: string,
  payload: LogPayload,
  operation: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  await logServerEvent("info", `${event}.start`, payload);

  try {
    const result = await operation();

    await logServerEvent("info", `${event}.success`, {
      ...payload,
      durationMs: Date.now() - startedAt,
    });

    return result;
  } catch (error) {
    await logServerEvent("error", `${event}.error`, {
      ...payload,
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  }
}
