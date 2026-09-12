import { ShoppingBag } from 'lucide-react';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import AppPageShell from '@/components/pages/AppPageShell';
import PurchaseReportPanel from '@/components/menu/PurchaseReportPanel';

interface PurchaseReportPageProps {
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  onBack: () => void;
}

export default function PurchaseReportPage({ items, collections, onBack }: PurchaseReportPageProps) {
  return (
    <AppPageShell
      title="Cloth Purchase Report"
      subtitle="Spending and wardrobe breakdown"
      icon={ShoppingBag}
      iconClassName="text-emerald-400"
      onBack={onBack}
      wide
    >
      <PurchaseReportPanel items={items} collections={collections} />
    </AppPageShell>
  );
}
