import type { MetalItemType } from "@/types/zakah";

export interface KaratOption {
  value: number;
  label: string;
  purity: number;
}

export const goldKaratOptions: KaratOption[] = [
  { value: 24, label: "24K", purity: 0.999 },
  { value: 22, label: "22K", purity: 0.916 },
  { value: 21, label: "21K", purity: 0.875 },
  { value: 18, label: "18K", purity: 0.75 },
  { value: 14, label: "14K", purity: 0.583 },
  { value: 9, label: "9K", purity: 0.375 },
];

export const silverFinenessOptions: KaratOption[] = [
  { value: 999, label: "999", purity: 0.999 },
  { value: 925, label: "925 Sterling", purity: 0.925 },
  { value: 800, label: "800", purity: 0.8 },
];

export const goldDefaultKarat: Record<MetalItemType, number> = {
  jewelry: 18,
  biscuit: 24,
  coin: 22,
  bar: 24,
};

export const silverDefaultFineness: Record<MetalItemType, number> = {
  jewelry: 925,
  biscuit: 999,
  coin: 999,
  bar: 999,
};

export const metalItemTypeLabels: Record<MetalItemType, string> = {
  jewelry: "Jewelry",
  biscuit: "Biscuit",
  coin: "Coin",
  bar: "Bar",
};
