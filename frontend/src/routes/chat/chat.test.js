import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';

// SvelteKit app modules used by the page (via urlSync + theme). Stub them.
vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ replaceState: vi.fn() }));

// The gateway client is mocked so the test is hermetic: the "search" always
// returns the same unfiltered corpus, and we assert the chat renders/attributes
// only the subset that survives the active filters.
const CORPUS = [
  { paperId: 'a', title: 'IEEE Paper On Vision', venue: 'IEEE', year: 2020, authors: [{ name: 'John Smith' }] },
  { paperId: 'b', title: 'NeurIPS Paper On NLP', venue: 'NeurIPS', year: 2021, authors: [{ name: 'Ada Lovelace' }] },
];
const searchByKeyword = vi.fn().mockResolvedValue({ status: 'success', keyphrases: ['x'], papers: CORPUS });

vi.mock('$lib/api', () => ({
  searchByKeyword: (...args) => searchByKeyword(...args),
  processFile: vi.fn(),
  validateFile: () => null,
  ApiError: class ApiError extends Error {},
}));

import Page from './+page.svelte';
import { filters } from '$lib/filters/store.js';

beforeEach(() => {
  searchByKeyword.mockClear();
  window.history.replaceState({}, '', '/chat');
  filters.clear();
});
afterEach(() => filters.clear());

describe('chat integration: filters drive what the chat operates on', () => {
  it('renders and attributes only the filtered subset when a publisher filter is active', async () => {
    render(Page);

    // Activate a Publisher (venue) filter AFTER mount (onMount seeds from the URL).
    filters.togglePublisher('IEEE');

    // Send a keyword query.
    const textarea = screen.getByPlaceholderText(/type a keyword/i);
    await fireEvent.input(textarea, { target: { value: 'deep learning' } });
    await fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));

    // The IEEE paper is shown; the NeurIPS paper is filtered out of the result.
    await waitFor(() => expect(screen.getByText('IEEE Paper On Vision')).toBeInTheDocument());
    expect(screen.queryByText('NeurIPS Paper On NLP')).not.toBeInTheDocument();

    // The filter state was included in the outbound request (attribution).
    expect(searchByKeyword).toHaveBeenCalledTimes(1);
    const [, opts] = searchByKeyword.mock.calls[0];
    expect(opts.filters.publishers).toEqual(['IEEE']);

    // The live count reflects the filtered subset (1 of 2).
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/Showing 1 of 2 papers/i)
    );
  });

  it('shows an explicit empty state (not a silent fallback) when filters match nothing', async () => {
    render(Page);
    filters.togglePublisher('Elsevier'); // matches no paper in the corpus

    const textarea = screen.getByPlaceholderText(/type a keyword/i);
    await fireEvent.input(textarea, { target: { value: 'deep learning' } });
    await fireEvent.click(screen.getByRole('button', { name: /^Send$/ }));

    await waitFor(() =>
      expect(screen.getByText(/no papers match these filters/i)).toBeInTheDocument()
    );
    // Neither paper leaks through the empty state.
    expect(screen.queryByText('IEEE Paper On Vision')).not.toBeInTheDocument();
    expect(screen.queryByText('NeurIPS Paper On NLP')).not.toBeInTheDocument();
  });
});
