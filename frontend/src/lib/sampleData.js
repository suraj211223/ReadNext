/**
 * Static sample papers used purely for the marketing "scrolling papers" band
 * (UI_INSTRUCTIONS §8). Real recommendations come from the gateway at runtime.
 */
export const samplePapers = [
  {
    paperId: '204e3073870fae3d05bcbc2f6a8e263d9b72e776',
    title: 'Attention Is All You Need',
    authors: [{ name: 'Ashish Vaswani' }, { name: 'Noam Shazeer' }],
    year: 2017,
    venue: 'NeurIPS',
    citationCount: 98423
  },
  {
    paperId: 'df2b0e26d0599ce3e70df8a9da02e51594e0e992',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: [{ name: 'Jacob Devlin' }, { name: 'Ming-Wei Chang' }],
    year: 2019,
    venue: 'NAACL',
    citationCount: 76210
  },
  {
    paperId: '6b85b63579a916f705a8e10a49bd8d849d91b1fc',
    title: 'Deep Residual Learning for Image Recognition',
    authors: [{ name: 'Kaiming He' }, { name: 'Xiangyu Zhang' }],
    year: 2016,
    venue: 'CVPR',
    citationCount: 180342
  },
  {
    paperId: 'a6cb366736791bcccc5c8639de5a8f9636bf87e8',
    title: 'Adam: A Method for Stochastic Optimization',
    authors: [{ name: 'Diederik P. Kingma' }, { name: 'Jimmy Ba' }],
    year: 2015,
    venue: 'ICLR',
    citationCount: 152904
  },
  {
    paperId: 'cd18800a0fe0b668a1cc19f2ec95b5003d0a5035',
    title: 'GloVe: Global Vectors for Word Representation',
    authors: [{ name: 'Jeffrey Pennington' }, { name: 'Richard Socher' }],
    year: 2014,
    venue: 'EMNLP',
    citationCount: 38120
  },
  {
    paperId: '9405cc0d6169988371b2755e573cc28650d14dfe',
    title: 'Language Models are Few-Shot Learners',
    authors: [{ name: 'Tom B. Brown' }, { name: 'Benjamin Mann' }],
    year: 2020,
    venue: 'NeurIPS',
    citationCount: 41980
  }
];

export const sources = [
  {
    name: 'Semantic Scholar',
    role: '200M+ indexed papers, relevance-ranked search',
    tag: 'S2AG'
  },
  { name: 'KeyBERT', role: 'Transformer keyphrase distillation', tag: 'KEYWORDS' },
  { name: 'PyMuPDF', role: 'Fast, ordered PDF text extraction', tag: 'PDF' },
  { name: 'EasyOCR / Tesseract', role: 'OCR for screenshots & images', tag: 'OCR' },
  { name: 'sentence-transformers', role: 'all-MiniLM-L6-v2 embeddings', tag: 'EMBEDDINGS' },
  { name: 'spaCy', role: 'Stop-word filtering & n-grams', tag: 'NLP' }
];

export const pipeline = [
  { n: '01', title: 'Document Ingestion', body: 'Upload a PDF or a screenshot of what you are reading.' },
  { n: '02', title: 'Text Extraction', body: 'PyMuPDF parses PDFs; OCR reads images — into one unified text.' },
  { n: '03', title: 'Keyword Distillation', body: 'KeyBERT compresses the text to 5–7 keyphrases.' },
  { n: '04', title: 'S2AG Search', body: 'Keyphrases query the Semantic Scholar graph for ideal matches.' },
  { n: '05', title: 'Card Recommendation', body: 'Ranked papers render as a structured card grid.' }
];
