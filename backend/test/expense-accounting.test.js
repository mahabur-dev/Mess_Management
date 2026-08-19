const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  calculateMemberFoodBill,
  isCommunalMealExpense,
  isUtilitySplitAllowed,
} = require('../dist/app/module/expense/expense-accounting.js');

describe('expense accounting classification', () => {
  it('treats only all-member meal-count food as communal', () => {
    assert.equal(
      isCommunalMealExpense({
        category: 'FOOD',
        used_by: 'ALL_MEMBERS',
        split_method: 'MEAL_COUNT',
      }),
      true,
    );
    assert.equal(
      isCommunalMealExpense({
        category: 'GROCERY',
        used_by: 'ALL_MEMBERS',
        split_method: 'MEAL_COUNT',
      }),
      true,
    );
  });

  it('keeps every non-default food allocation out of the communal pool', () => {
    const advancedRules = [
      ['ALL_MEMBERS', 'EQUAL'],
      ['SELECTED_MEMBERS', 'MEAL_COUNT'],
      ['SELECTED_MEMBERS', 'CUSTOM'],
      ['MEAL_ON_MEMBERS', 'EQUAL'],
      ['SELF_ONLY', 'EQUAL'],
    ];

    for (const [used_by, split_method] of advancedRules) {
      assert.equal(
        isCommunalMealExpense({ category: 'FOOD', used_by, split_method }),
        false,
      );
    }
  });

  it('separates regular meal charge from assigned food while preserving total due', () => {
    assert.deepEqual(
      calculateMemberFoodBill({
        memberMeals: 30,
        communalMealRate: 50,
        assignedFoodExpense: 300,
      }),
      {
        regularMealCharge: 1500,
        assignedFoodExpense: 300,
        totalFoodBill: 1800,
      },
    );
  });

  it('rejects meal-member and meal-count rules for utilities', () => {
    assert.equal(isUtilitySplitAllowed('ALL_MEMBERS', 'EQUAL'), true);
    assert.equal(isUtilitySplitAllowed('SELECTED_MEMBERS', 'CUSTOM'), true);
    assert.equal(isUtilitySplitAllowed('MEAL_ON_MEMBERS', 'EQUAL'), false);
    assert.equal(isUtilitySplitAllowed('ALL_MEMBERS', 'MEAL_COUNT'), false);
  });
});
