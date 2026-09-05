import {
  Shirt,
  Footprints,
  Gem,
  Watch,
  Glasses,
  Briefcase,
  Backpack,
  Umbrella,
  Sparkles,
  Crown,
  Package,
  Layers,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  shirt: Shirt,
  shoes: Footprints,
  jewelry: Gem,
  watch: Watch,
  glasses: Glasses,
  bag: Briefcase,
  backpack: Backpack,
  umbrella: Umbrella,
  sparkles: Sparkles,
  crown: Crown,
  package: Package,
  layers: Layers,
};

export const DEFAULT_ICONS = Object.keys(ICON_MAP);

export function getWardrobeIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Package;
}
