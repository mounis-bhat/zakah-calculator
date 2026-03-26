export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "SAR", name: "Saudi Riyal", symbol: "\uFDFC", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "AED", name: "UAE Dirham", symbol: "\u062F.\u0625", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "GBP", name: "British Pound", symbol: "\u00A3", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "EUR", name: "Euro", symbol: "\u20AC", flag: "\u{1F1EA}\u{1F1FA}" },
  { code: "INR", name: "Indian Rupee", symbol: "\u20B9", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "\u20A8", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "\u09F3", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "TRY", name: "Turkish Lira", symbol: "\u20BA", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E\u00A3", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "\u062F.\u0643", flag: "\u{1F1F0}\u{1F1FC}" },
  { code: "QAR", name: "Qatari Riyal", symbol: "\uFDFC", flag: "\u{1F1F6}\u{1F1E6}" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BD", flag: "\u{1F1E7}\u{1F1ED}" },
  { code: "OMR", name: "Omani Rial", symbol: "\uFDFC", flag: "\u{1F1F4}\u{1F1F2}" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "\u062F.\u0627", flag: "\u{1F1EF}\u{1F1F4}" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "NGN", name: "Nigerian Naira", symbol: "\u20A6", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "\u062F.\u0645.", flag: "\u{1F1F2}\u{1F1E6}" },
];

export function getCurrencySymbol(code: string): string {
  return currencies.find((c) => c.code === code)?.symbol ?? code;
}
