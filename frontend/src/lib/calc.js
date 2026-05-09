// Financial calculator formulas

export function emi(principal, annualRatePct, years) {
  const P = Number(principal) || 0;
  const r = (Number(annualRatePct) || 0) / 100 / 12;
  const n = (Number(years) || 0) * 12;
  if (P <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0, schedule: [] };
  let emiVal;
  if (r === 0) emiVal = P / n;
  else emiVal = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emiVal * n;
  const totalInterest = totalPayment - P;
  return { emi: emiVal, totalInterest, totalPayment };
}

export function sip(monthly, annualRatePct, years) {
  const M = Number(monthly) || 0;
  const i = (Number(annualRatePct) || 0) / 100 / 12;
  const n = (Number(years) || 0) * 12;
  if (M <= 0 || n <= 0) return { futureValue: 0, invested: 0, returns: 0 };
  let fv;
  if (i === 0) fv = M * n;
  else fv = M * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  const invested = M * n;
  return { futureValue: fv, invested, returns: fv - invested };
}

export function compound(principal, annualRatePct, years, compoundsPerYear = 1) {
  const P = Number(principal) || 0;
  const r = (Number(annualRatePct) || 0) / 100;
  const t = Number(years) || 0;
  const m = Number(compoundsPerYear) || 1;
  if (P <= 0 || t <= 0) return { amount: P, interest: 0 };
  const amount = P * Math.pow(1 + r / m, m * t);
  return { amount, interest: amount - P };
}

export function simple(principal, annualRatePct, years) {
  const P = Number(principal) || 0;
  const r = (Number(annualRatePct) || 0) / 100;
  const t = Number(years) || 0;
  const interest = P * r * t;
  return { amount: P + interest, interest };
}

// Systematic Withdrawal Plan
// Initial corpus P, monthly withdrawal W, annual rate (post-tax expected), years
// Balance at end of n months: P*(1+r)^n - W*((1+r)^n - 1)/r
export function swp(initial, monthlyWithdrawal, annualRatePct, years) {
  const P = Number(initial) || 0;
  const W = Number(monthlyWithdrawal) || 0;
  const r = (Number(annualRatePct) || 0) / 100 / 12;
  const n = Math.round((Number(years) || 0) * 12);
  if (P <= 0 || n <= 0) return { finalBalance: P, totalWithdrawn: 0, totalReturns: 0, monthsUntilDepletion: null, depleted: false };
  const factor = Math.pow(1 + r, n);
  let finalBalance;
  if (r === 0) finalBalance = P - W * n;
  else finalBalance = P * factor - W * (factor - 1) / r;

  // Find depletion month (if any) by iterating month-by-month
  let bal = P;
  let depletedAt = null;
  let totalWithdrawn = 0;
  for (let m = 1; m <= n; m++) {
    bal = bal * (1 + r) - W;
    if (bal <= 0) {
      depletedAt = m;
      totalWithdrawn += (W + bal); // last partial withdrawal
      bal = 0;
      break;
    }
    totalWithdrawn += W;
  }
  if (depletedAt === null) totalWithdrawn = W * n;
  const totalReturns = (depletedAt === null ? finalBalance : 0) + totalWithdrawn - P;
  return {
    finalBalance: depletedAt === null ? finalBalance : 0,
    totalWithdrawn,
    totalReturns,
    monthsUntilDepletion: depletedAt,
    depleted: depletedAt !== null,
  };
}

export function calculatorPrimary(c) {
  if (c.type === 'emi') {
    const r = emi(c.principal, c.rate, c.years);
    return { primaryLabel: 'Total interest paid', primaryValue: r.totalInterest, all: r };
  }
  if (c.type === 'sip') {
    const r = sip(c.monthly, c.rate, c.years);
    return { primaryLabel: 'Total returns', primaryValue: r.returns, all: r };
  }
  if (c.type === 'compound') {
    const r = compound(c.principal, c.rate, c.years, c.compoundsPerYear);
    return { primaryLabel: 'Total interest earned', primaryValue: r.interest, all: r };
  }
  if (c.type === 'simple') {
    const r = simple(c.principal, c.rate, c.years);
    return { primaryLabel: 'Total interest paid', primaryValue: r.interest, all: r };
  }
  if (c.type === 'swp') {
    const r = swp(c.initial, c.monthly, c.rate, c.years);
    return {
      primaryLabel: r.depleted ? 'Depletes after ' + r.monthsUntilDepletion + ' months' : 'Final balance',
      primaryValue: r.depleted ? r.totalWithdrawn : r.finalBalance,
      all: r,
    };
  }
  return { primaryLabel: '', primaryValue: 0, all: {} };
}
