import { describe, it, expect, vi, beforeEach } from 'vitest';

const TOTAL_QUOTES = 45;
const MOCK_QUOTES = Array.from({ length: TOTAL_QUOTES }, (_, index) => ({
    id: `quote-${index + 1}`,
    name: `Quote ${index + 1}`,
    updated_at: new Date(2026, 0, index + 1).toISOString(),
    last_modified_by: 'Test User'
}));

const fetchRecentQuotesMock = vi.fn(async ({ offset = 0, limit = 20 } = {}) => {
    return MOCK_QUOTES.slice(offset, offset + limit);
});

const fetchQuotesCountMock = vi.fn(async () => TOTAL_QUOTES);

vi.mock('../src/js/services/supabase.js', () => ({
    fetchRecentQuotes: fetchRecentQuotesMock,
    fetchQuotesCount: fetchQuotesCountMock,
    deleteQuote: vi.fn()
}));

vi.mock('../src/js/components/modals.js', () => ({
    hideHistory: vi.fn()
}));

describe('Quote History Infinite Scroll', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="historyList" class="history-list"></div>';
        window.lucide = { createIcons: vi.fn() };
        fetchRecentQuotesMock.mockClear();
        fetchQuotesCountMock.mockClear();
    });

    it('loads quote rows until the UI count matches the database count', async () => {
        const { renderQuoteHistory } = await import('../src/js/components/quoteForm.js');
        const { fetchQuotesCount } = await import('../src/js/services/supabase.js');

        const dbCount = await fetchQuotesCount();
        await renderQuoteHistory();

        const container = document.getElementById('historyList');

        Object.defineProperty(container, 'clientHeight', {
            configurable: true,
            value: 300
        });

        Object.defineProperty(container, 'scrollHeight', {
            configurable: true,
            get: () => 1200
        });

        for (let i = 0; i < 10; i += 1) {
            const loadedRows = container.querySelectorAll('.history-item').length;
            if (loadedRows >= dbCount) break;

            container.scrollTop = 1000;
            container.dispatchEvent(new Event('scroll'));
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const loadedRows = container.querySelectorAll('.history-item').length;

        expect(dbCount).toBe(TOTAL_QUOTES);
        expect(loadedRows).toBe(dbCount);
        expect(fetchRecentQuotesMock).toHaveBeenCalledWith({ offset: 0, limit: 20 });
        expect(fetchRecentQuotesMock).toHaveBeenCalledWith({ offset: 20, limit: 20 });
        expect(fetchRecentQuotesMock).toHaveBeenCalledWith({ offset: 40, limit: 20 });
    });
});
