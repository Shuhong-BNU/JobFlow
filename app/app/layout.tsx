import { requireUser } from '@/lib/auth-helpers';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopbar } from '@/components/app-topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={{ name: user.name, email: user.email }} />
        <main className="flex-1 overflow-x-hidden bg-background">{children}</main>
      </div>
    </div>
  );
}
