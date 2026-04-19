'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, isLocale } from './config';

/**
 * Server Action：写入 locale cookie 并刷新当前路径。
 * 客户端的语言切换器调用这个。
 */
export async function setLocaleAction(locale: string, pathname: string) {
  if (!isLocale(locale)) return { ok: false as const };
  cookies().set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    // 一年
    maxAge: 60 * 60 * 24 * 365,
  });
  void pathname;
  return { ok: true as const };
}
