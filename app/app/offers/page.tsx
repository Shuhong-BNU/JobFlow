import { requireUser } from '@/lib/auth-helpers';
import { listOffers } from '@/features/offers/queries';
import { OfferCard } from '@/features/offers/components/offer-card';
import { EmptyState } from '@/components/empty-state';
import { getServerDictionary } from '@/lib/i18n/server';

export default async function OffersPage() {
  const user = await requireUser();
  const t = getServerDictionary();
  const offers = await listOffers(user.id);

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t.offers.pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.offers.pageSubtitle}</p>
      </header>

      {offers.length === 0 ? (
        <EmptyState title={t.offers.listEmpty.title} description={t.offers.listEmpty.desc} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      )}
    </div>
  );
}
