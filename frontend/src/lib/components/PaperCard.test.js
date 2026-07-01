import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PaperCard from './PaperCard.svelte';

const paper = {
  paperId: 'abc123def456ghi',
  title: 'Attention Is All You Need',
  abstract: 'We propose the Transformer.',
  authors: [{ name: 'Ashish Vaswani' }, { name: 'Noam Shazeer' }, { name: 'Niki Parmar' }, { name: 'Extra Author' }],
  year: 2017,
  venue: 'NeurIPS',
  citationCount: 98423,
  url: 'https://www.semanticscholar.org/paper/abc123'
};

describe('PaperCard', () => {
  it('renders the title as a link to the paper', () => {
    render(PaperCard, { paper });
    const link = screen.getByRole('link', { name: /Attention Is All You Need/i });
    expect(link).toHaveAttribute('href', paper.url);
  });

  it('shows at most three authors', () => {
    render(PaperCard, { paper });
    const authors = screen.getByText(/Ashish Vaswani/);
    expect(authors.textContent).toContain('Niki Parmar');
    expect(authors.textContent).not.toContain('Extra Author');
  });

  it('formats large citation counts as k', () => {
    render(PaperCard, { paper });
    expect(screen.getByText(/98k cites/)).toBeInTheDocument();
  });

  it('renders year and venue tags', () => {
    render(PaperCard, { paper });
    expect(screen.getByText('2017')).toBeInTheDocument();
    expect(screen.getByText('NeurIPS')).toBeInTheDocument();
  });

  it('hides the abstract in compact mode', () => {
    render(PaperCard, { paper, compact: true });
    expect(screen.queryByText(/We propose the Transformer/)).not.toBeInTheDocument();
  });
});
