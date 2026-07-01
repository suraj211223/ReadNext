You are a Senior Technical Writer. Create a production-grade `README.md` file for my repository that outlines our Keyword-Driven Smart Reading Companion Recommendation System.

### Technical Details to Blueprint:
- System Purpose: An AI reading assistant that uses real-time NLP keyword extraction on active documents (via PDF uploads or digital screen captures) to dynamically search the S2AG network and find the closest relevant academic papers.
- System Components: Svelte, Express.js backend, FastAPI processing node (featuring OCR, PDF parsing, and NLP Keyword Extraction), and the Semantic Scholar Academic Graph (S2AG) Search API.
- Core Pipeline: 
  - User Document Ingestion -> OCR/PDF Text Extraction -> NLP Concept/Keyword Distillation -> S2AG Keyword-Based Vector Search -> Clean JSON Response Schema -> Svelte Card Grid UI.
- Target Output Schema: For every close match paper found, the system displays Title, Abstract, Authors, and the direct Paper Link.

### Required Markdown Sections:
1. Title & High-Level System Overview (Emphasizing the real-time keyword distillation pipeline).
2. Architecture Diagram: Use a Markdown Mermaid graph (`graph TD`) to visualize the flow of data across boundaries (Client-side Svelte -> Node/Express Gateway -> Python FastAPI Node [Parser -> Keyword Extractor] -> External S2AG Search API).
3. Installation Blueprint: Detail how to configure environment variables across components, highlighting where to insert the `S2AG_API_KEY`.
4. API Layout Spec: Show sample JSON inputs for file processing endpoints and the final structured response schema featuring the title, abstract, authors, and link fields.

Make sure the tone is polished and highly professional, utilizing clean Markdown tables and blockquotes for warnings or special configuration notes.

claude --resume e63b58a7-6908-4041-85df-c208aa0a110e