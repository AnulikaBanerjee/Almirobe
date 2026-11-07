import { Crown } from 'lucide-react';
import AppPageShell from '@/components/pages/AppPageShell';

interface MembershipPageProps {
  currentLevel: string;
  onBack: () => void;
}

export default function MembershipPage({ currentLevel, onBack }: MembershipPageProps) {
  return (
    <AppPageShell
      title="Membership"
      subtitle="Plans and billing will live here"
      icon={Crown}
      onBack={onBack}
    >
      <div className="space-y-4 text-[#3d2f24]">
        <p className="text-sm text-[#5c4d3d]">
          You are currently on <strong>{currentLevel}</strong>. Changing plans will be available in a later update.
        </p>
        <div className="rounded-xl border border-[#e4d5be] bg-[#f8f1e4]/80 p-4 space-y-2 text-sm">
          <p className="font-medium">Coming soon</p>
          <ul className="list-disc pl-5 text-[#5c4d3d] space-y-1">
            <li>Upgrade or downgrade membership</li>
            <li>Payment method and invoices</li>
            <li>Family plan sharing</li>
          </ul>
        </div>
      </div>
    </AppPageShell>
  );
}
