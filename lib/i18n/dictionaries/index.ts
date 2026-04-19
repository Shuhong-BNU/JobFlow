import { en } from './en';
import { zh, type Dictionary } from './zh';
import type { Locale } from '../config';

export type { Dictionary };

const ALL: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale): Dictionary {
  return ALL[locale];
}
