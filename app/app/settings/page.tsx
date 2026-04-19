import { ComingSoon } from '@/components/coming-soon';
import { getServerDictionary } from '@/lib/i18n/server';
export default function Page() {
  const t = getServerDictionary();
  return <ComingSoon title={t.comingSoon.pages.settings} phase={t.comingSoon.phase2} />;
}
