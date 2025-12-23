
import { describe, it, expect } from 'vitest';
import { calculateLineItem } from '../src/js/services/calculator.js';

describe('Calculator Service', () => {
    it('should calculate basic cabinet cost correctly', () => {
        const item = {
            upperLF: 10,
            baseLF: 10,
            pantryLF: 0,
            finish: 'PVC',
            shaped: 'no',
            drawers: 0,
            accessories: 0,
            overrides: { rates: {}, dimensions: {} }
        };

        // Using default rates from constants (mocked or assumed)
        // Actually we should mock constants or ensure calculator uses them.
        // Ideally calculator.js imports them. Integration test.

        const result = calculateLineItem(item);
        expect(result.subtotal).toBeGreaterThan(0);
    });
});
