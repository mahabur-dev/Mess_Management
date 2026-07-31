export type FundBalanceInputs = {
  approvedPayments: number;
  directDeposits: number;
  messExpenseDebits: number;
  collectedFundCredits: number;
  collectedFundDebits: number;
};

function money(value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError('Fund balance inputs must be finite numbers');
  }
  return Number(value.toFixed(2));
}

export function calculateFundBalances(inputs: FundBalanceInputs) {
  return {
    messDepositBalance: money(
      inputs.approvedPayments +
        inputs.directDeposits -
        inputs.messExpenseDebits,
    ),
    collectedFundBalance: money(
      inputs.collectedFundCredits - inputs.collectedFundDebits,
    ),
  };
}
