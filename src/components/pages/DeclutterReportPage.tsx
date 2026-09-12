import { ClipboardList } from 'lucide-react';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import AppPageShell from '@/components/pages/AppPageShell';
import DeclutterSwipePanel from '@/components/menu/DeclutterSwipePanel';

interface DeclutterReportPageProps {
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  onBack: () => void;
  onKeep: (item: WardrobeItem) => void;
  onThrowAway: (itemId: string) => void;
}

export default function DeclutterReportPage({
  items,
  collections,
  onBack,
  onKeep,
  onThrowAway,
}: DeclutterReportPageProps) {
  return (
    <AppPageShell
      title="Declutter Report"
      subtitle="Review items you haven't worn in a while"
      icon={ClipboardList}
      iconClassName="text-violet-400"
      onBack={onBack}
      wide
    >
      <DeclutterSwipePanel
        items={items}
        collections={collections}
        onKeep={onKeep}
        onThrowAway={onThrowAway}
      />
    </AppPageShell>
  );
}
