# Embedding Research for Smart Offers

## Options Evaluated

### OpenAI text-embedding-3-small
- 1536 dimensions, $0.02/1M tokens
- Best quality for English, decent multilingual
- Latency: ~50ms per batch of 100

### Cohere embed-multilingual-v3
- 1024 dimensions, similar pricing
- Better multilingual support (important for JP, KR, DE markets)
- Latency: ~40ms per batch of 100

### Local: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- 384 dimensions, free (self-hosted)
- Good multilingual, lower quality than commercial options
- Would need GPU instance (~$200/mo)

## Recommendation
Start with Cohere for multilingual support. We can always switch later since we're storing raw text alongside vectors.

## Next Steps
- Build proof-of-concept with 1000 offers from US market
- Measure cosine similarity distribution to set matching threshold
- Compare with collaborative filtering baseline

## Related
- This connects to Marc's idea about using embeddings for ad creative matching too
- See also: project-brief.md for full Smart Offers spec
