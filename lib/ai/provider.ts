/**
 * AI provider abstraction.
 *
 * Phase 1: declares the surface area only. All methods throw NotImplemented
 * so feature flags / call sites can wire up gracefully without crashing the
 * core CRUD experience. Phase 3 fills in the OpenAI-compatible implementation.
 */

export type ParseJdInput = { text: string };
export type ParseJdOutput = {
  company: string | null;
  title: string | null;
  location: string | null;
  skills: string[];
  deadline: string | null;
  keywords: string[];
};

export type NextActionInput = { applicationSnapshot: Record<string, unknown> };
export type NextActionOutput = {
  next: string;
  risks: string[];
  prep: string[];
};

export interface AiProvider {
  parseJd(input: ParseJdInput): Promise<ParseJdOutput>;
  suggestNextAction(input: NextActionInput): Promise<NextActionOutput>;
}

class NotImplementedProvider implements AiProvider {
  async parseJd(): Promise<ParseJdOutput> {
    throw new Error('AI provider not configured (Phase 3).');
  }
  async suggestNextAction(): Promise<NextActionOutput> {
    throw new Error('AI provider not configured (Phase 3).');
  }
}

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (!cached) cached = new NotImplementedProvider();
  return cached;
}

export function isAiAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
