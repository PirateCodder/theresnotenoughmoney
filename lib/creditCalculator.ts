export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface CreditResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationTable: AmortizationRow[];
}

/**
 * Hesaplar aylık taksit tutarını (PMT formülü)
 * @param principal - Kredi tutarı (TL)
 * @param monthlyRate - Aylık faiz oranı (% olarak, örn: 1.5)
 * @param months - Vade (ay)
 */
export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  months: number
): number {
  if (principal <= 0 || months <= 0) return 0;

  const r = monthlyRate / 100;

  if (r === 0) {
    return principal / months;
  }

  const payment =
    (principal * r * Math.pow(1 + r, months)) /
    (Math.pow(1 + r, months) - 1);

  return payment;
}

/**
 * Amortisman tablosu oluşturur
 */
export function calculateAmortization(
  principal: number,
  monthlyRate: number,
  months: number
): CreditResult {
  if (principal <= 0 || months <= 0 || monthlyRate < 0) {
    return {
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
      amortizationTable: [],
    };
  }

  const monthlyPayment = calculateMonthlyPayment(principal, monthlyRate, months);
  const r = monthlyRate / 100;
  const table: AmortizationRow[] = [];

  let balance = principal;

  for (let month = 1; month <= months; month++) {
    const interestAmount = balance * r;
    const principalAmount = monthlyPayment - interestAmount;
    const newBalance = Math.max(0, balance - principalAmount);

    table.push({
      month,
      payment: monthlyPayment,
      principal: principalAmount,
      interest: interestAmount,
      balance: month === months ? 0 : newBalance,
    });

    balance = newBalance;
  }

  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - principal;

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    amortizationTable: table,
  };
}

/**
 * Sayıyı Türk Lirası formatında biçimlendirir
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Sayıyı Türkçe format ile yüzde olarak biçimlendirir
 */
export function formatPercent(value: number): string {
  return `%${value.toFixed(2)}`;
}