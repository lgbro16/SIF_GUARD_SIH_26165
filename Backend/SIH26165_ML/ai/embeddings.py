"""
embeddings.py - Modern Semantic NLP Embedding Engine
Uses lightweight Sentence Transformers (all-MiniLM-L6-v2) for local prototype inference
with graceful fallback if model is unavailable.
"""

import numpy as np
from typing import List, Union

_MODEL = None
_MODEL_NAME = "all-MiniLM-L6-v2"
_EMBEDDING_DIM = 384


def get_embedding_model():
    """Lazy-loads the SentenceTransformer model once."""
    global _MODEL
    if _MODEL is not None:
        return _MODEL

    try:
        from sentence_transformers import SentenceTransformer
        # Load local or cached model (uses CPU for prototype safety)
        _MODEL = SentenceTransformer(_MODEL_NAME, device="cpu")
        print(f"[Embeddings] Loaded {_MODEL_NAME} successfully.")
    except Exception as e:
        print(f"[Embeddings] SentenceTransformer initialization note: {e}. Using fallback retrieval.")
        _MODEL = False

    return _MODEL


def is_sentence_transformer_available() -> bool:
    """Returns True if genuine SentenceTransformer model is loaded and operational."""
    model = get_embedding_model()
    return model is not None and model is not False


def get_embedding_status() -> dict:
    """Returns operational status of the embedding infrastructure."""
    available = is_sentence_transformer_available()
    return {
        "available": available,
        "model": _MODEL_NAME if available else "keyword_token_hash_fallback",
        "status": "Semantic embedding model active (all-MiniLM-L6-v2)" if available else "Semantic embedding model unavailable — using fallback retrieval."
    }


def _fallback_embed(text: str) -> np.ndarray:
    """
    Deterministic token-frequency hash vector for fallback representation
    when sentence-transformers is offline. Replaces pseudo-random generation
    with reproducible token bucket projection.
    """
    if not text or not str(text).strip():
        return np.zeros(_EMBEDDING_DIM, dtype=np.float32)

    vec = np.zeros(_EMBEDDING_DIM, dtype=np.float32)
    tokens = [t.strip().lower() for t in str(text).split() if len(t.strip()) > 1]
    if not tokens:
        return vec

    for tok in tokens:
        idx = abs(hash(tok)) % _EMBEDDING_DIM
        vec[idx] += 1.0

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec


def embed_text(text: str) -> np.ndarray:
    """Generates a normalized 1D embedding vector for a single text."""
    if not text or not str(text).strip():
        return np.zeros(_EMBEDDING_DIM, dtype=np.float32)

    model = get_embedding_model()
    if model:
        try:
            emb = model.encode(str(text), normalize_embeddings=True, show_progress_bar=False)
            return np.array(emb, dtype=np.float32)
        except Exception as e:
            print(f"[Embeddings] Inference error: {e}, using fallback.")
            return _fallback_embed(text)
    else:
        return _fallback_embed(text)


def embed_documents(documents: List[str]) -> np.ndarray:
    """Generates a 2D matrix of normalized embeddings for a list of document chunks."""
    if not documents:
        return np.empty((0, _EMBEDDING_DIM), dtype=np.float32)

    model = get_embedding_model()
    if model:
        try:
            embs = model.encode(documents, normalize_embeddings=True, show_progress_bar=False, batch_size=16)
            return np.array(embs, dtype=np.float32)
        except Exception as e:
            print(f"[Embeddings] Batch inference error: {e}, using fallback.")
            return np.array([_fallback_embed(doc) for doc in documents], dtype=np.float32)
    else:
        return np.array([_fallback_embed(doc) for doc in documents], dtype=np.float32)


def semantic_similarity(text1: str, text2: str) -> float:
    """
    Computes similarity between two texts.
    If Sentence Transformers is available, computes cosine similarity of dense embeddings.
    If unavailable, calculates keyword token overlap and does NOT present as semantic retrieval.
    """
    if not is_sentence_transformer_available():
        t1_words = set(w.lower() for w in str(text1).split() if len(w) > 2)
        t2_words = set(w.lower() for w in str(text2).split() if len(w) > 2)
        if not t1_words or not t2_words:
            return 0.0
        overlap = len(t1_words.intersection(t2_words))
        jaccard = overlap / float(len(t1_words.union(t2_words)))
        return round(float(jaccard), 4)

    v1 = embed_text(text1)
    v2 = embed_text(text2)
    dot = float(np.dot(v1, v2))
    # Rescale cosine [-1, 1] to [0, 1] for intuitive display
    sim = max(0.0, min(1.0, (dot + 1.0) / 2.0))
    return round(sim, 4)


def get_embedding_model_name() -> str:
    """Returns the identifier of the active embedding architecture."""
    return _MODEL_NAME if is_sentence_transformer_available() else "keyword_fallback"

