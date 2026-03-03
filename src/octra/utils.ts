export const OCTRA_DECIMALS = 6;

export const formatOctRaw = (raw: string | number): string => {
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return '0 OCT';
  }

  const oct = value / 10 ** OCTRA_DECIMALS;
  return `${oct.toLocaleString(undefined, { maximumFractionDigits: OCTRA_DECIMALS })} OCT`;
};

export const parseAmountToRaw = (amount: string, decimals = OCTRA_DECIMALS): string => {
  const trimmed = amount.trim();
  if (!trimmed) {
    return '0';
  }

  const [integerPart = '0', fractionPart = ''] = trimmed.split('.');
  const normalizedInteger = integerPart.replace(/[^0-9]/g, '') || '0';
  const normalizedFraction = fractionPart.replace(/[^0-9]/g, '').slice(0, decimals);
  const fraction = normalizedFraction.padEnd(decimals, '0');
  const raw = `${normalizedInteger}${fraction}`.replace(/^0+/, '');

  return raw || '0';
};

export const shortHash = (value: string, start = 6, end = 6): string => {
  if (!value || value.length <= start + end) {
    return value;
  }
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

export const isOctraAddress = (value: string): boolean => {
  return /^oct[a-zA-Z0-9]{44}$/.test(value.trim());
};
