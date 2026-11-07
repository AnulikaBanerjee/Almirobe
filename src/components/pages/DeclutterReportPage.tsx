import { ClipboardList } from 'lucide-react';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import AppPageShell from '@/components/pages/AppPageShell';
import DeclutterSwipePanel from '@/components/menu/DeclutterSwipePanel';

interface DeclutterReportPageProps {
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  onBack: () => void;
  onKeep: (item: WardrobeItem) => void;
  onDonate: (item: WardrobeItem) => void;
}

export default function DeclutterReportPage({
  items,
  collections,
  onBack,
  onKeep,
  onDonate,
}: DeclutterReportPageProps) {
  return (
    <AppPageShell
      title="Declutter Report"
      subtitle="Keep what you wear — donate the rest to your donation box"
      icon={ClipboardList}
      iconClassName="text-violet-400"
      onBack={onBack}
      wide
    >
      <DeclutterSwipePanel
        items={items}
        collections={collections}
        onKeep={onKeep}
        onDonate={onDonate}
      />
    </AppPageShell>
  );
}
