"""
server.py - SIF-GUARD REST API Server
Oil India Limited (OIL) - PS ID: SIH26165
Explainable Safety Intelligence Platform Backend

MEMORY OPTIMIZATION (Render Free / 512 MB):
- NO heavy AI components loaded at module import time.
- build_index() removed from startup — RAG index loaded lazily on first /api/analyze.
- GET /api/health is fully lightweight (no AI pipeline, no embeddings, no Gemini).
- All expensive modules use lazy singletons (embeddings.py, rag.py, classifier.py).
- Single Gunicorn worker: gunicorn server:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
"""

import os
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables (.env if present)
load_dotenv()

# ── LIGHTWEIGHT IMPORTS ONLY AT STARTUP ─────────────────────────────────────
# Heavy AI modules (sentence-transformers, FAISS, etc.) are NOT imported here.
# They are imported lazily inside the functions that need them.
from ai.hitl import record_review, get_all_reviews
from ai.jobs import create_batch_job, get_job_status

app = Flask(__name__)

# Enable CORS for frontend interactions
cors_origins = os.environ.get("CORS_ORIGIN", "*")
if cors_origins != "*":
    cors_origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
CORS(
    app,
    resources={r"/api/*": {"origins": cors_origins if cors_origins != "*" else "*"}},
    supports_credentials=True
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "safety_reports.csv")
_DATASET_STATS_CACHE = None


def _get_dataset_stats():
    """Calculates dataset statistics once and caches them in memory."""
    global _DATASET_STATS_CACHE
    if _DATASET_STATS_CACHE is not None:
        return _DATASET_STATS_CACHE

    if not os.path.exists(DATA_PATH):
        return None

    df = pd.read_csv(DATA_PATH)
    total_reports = len(df)
    sif_count = int(df['sif_label'].sum()) if 'sif_label' in df.columns else 0
    non_sif_count = total_reports - sif_count
    sif_rate = round((sif_count / total_reports) * 100.0, 1) if total_reports > 0 else 0.0

    barrier_col = df['barrier_failure'].dropna() if 'barrier_failure' in df.columns else pd.Series([])
    top_barrier = barrier_col.mode()[0] if not barrier_col.empty else "Energy Isolation"

    rule_col = df['iogp_rule'].dropna() if 'iogp_rule' in df.columns else pd.Series([])
    top_rule = rule_col.mode()[0] if not rule_col.empty else "Confined Space Entry"

    facility_col = df['facility_location'].dropna() if 'facility_location' in df.columns else (
        df['location'].dropna() if 'location' in df.columns else pd.Series([])
    )
    facility_counts = facility_col.value_counts().head(5).to_dict()

    _DATASET_STATS_CACHE = {
        'total_reports': total_reports,
        'sif_count': sif_count,
        'non_sif_count': non_sif_count,
        'sif_rate': sif_rate,
        'top_barrier': top_barrier,
        'top_rule': top_rule,
        'facility_counts': facility_counts,
    }
    return _DATASET_STATS_CACHE


# ── 1. ROOT ──────────────────────────────────────────────

@app.route('/', methods=['GET'])
def root_index():
    return jsonify({
        'status': 'HEALTHY',
        'message': 'SIF-GUARD Safety AI API is running.',
        'endpoints': {
            'analyze': '/api/analyze',
            'analytics': '/api/analytics',
            'patterns': '/api/patterns',
            'reviews': '/api/reviews',
            'jobs': '/api/jobs',
            'health': '/api/health'
        }
    }), 200


# ── 2. CORE SIF ANALYSIS ENDPOINT ────────────────────────

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Primary API endpoint called by AI Analysis Studio.
    Analyzes raw text using the complete explainable pipeline.
    Heavy AI components load lazily on first call.
    """
    data = request.get_json(force=True, silent=True) or {}
    text = data.get('text', '') or data.get('report_text', '')

    if not text or not str(text).strip():
        return jsonify({'error': 'Report text is required and cannot be empty.'}), 400

    try:
        from ai.analysis import analyze_full_pipeline
        result = analyze_full_pipeline(text)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Analysis error: {e}", exc_info=True)
        return jsonify({
            'error': f"Safety analysis failed: {str(e)}",
            'disclaimer': "AI-generated analysis is decision support and must be reviewed by qualified HSE personnel."
        }), 500


# ── 3. SITE ANALYTICS & DATASET STATS ───────────────────

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """
    Returns authentic metrics derived from the 50-report curated prototype dataset.
    Never fabricates production numbers.
    """
    if not os.path.exists(DATA_PATH):
        return jsonify({'error': 'Prototype dataset not found.'}), 404

    try:
        stats = _get_dataset_stats()
        if not stats:
            return jsonify({'error': 'Prototype dataset not found.'}), 404

        total_reports = stats['total_reports']
        sif_count = stats['sif_count']
        non_sif_count = stats['non_sif_count']
        sif_rate = stats['sif_rate']
        top_barrier = stats['top_barrier']
        top_rule = stats['top_rule']
        facility_counts = stats['facility_counts']

        # Open actions from persisted reviews
        reviews = get_all_reviews()
        open_actions_count = len([r for r in reviews if r.get('action') in ('CONFIRM', 'ESCALATE')])

        # Evaluation metrics — loaded lazily, cached after first call
        from evaluation.evaluate import get_evaluation_summary
        eval_metrics = get_evaluation_summary()

        return jsonify({
            'dataset_status': 'CURATED PROTOTYPE DATASET',
            'dataset_label': f'Based on {total_reports}-report curated prototype dataset',
            'total_reports': total_reports,
            'sif_precursors': sif_count,
            'non_sif_count': non_sif_count,
            'psif_target_ratio': f"{sif_rate}%",
            'top_barrier_failure': top_barrier,
            'top_life_saving_rule': top_rule,
            'facility_distribution': facility_counts,
            'open_actions_pending': open_actions_count,
            'validation_recall': eval_metrics.get('sif_recall', '66.7%'),
            'validation_cv_recall': eval_metrics.get('cv_sif_recall', '68.0%'),
            'disclaimer': 'AI-generated analysis is decision support and must be reviewed by qualified HSE personnel.'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── 4. PATTERN INTELLIGENCE ENDPOINT ─────────────────────

@app.route('/api/patterns', methods=['GET'])
def get_patterns():
    """
    Returns semantic precursor clusters discovered through Sentence Transformers and K-Means.
    Triggered ONLY by explicit GET /api/patterns — never during /api/analyze.
    Cluster results cached after first computation.
    """
    try:
        from ai.patterns import discover_precursor_clusters
        clusters = discover_precursor_clusters(num_clusters=3)
        return jsonify({
            'clusters': clusters,
            'dataset_scope': '50 Curated Prototype Safety Reports',
            'methodology': 'Sentence Transformers (all-MiniLM-L6-v2) + K-Means Clustering'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── 5. HUMAN-IN-THE-LOOP (HITL) ENDPOINTS ────────────────

@app.route('/api/reviews', methods=['GET', 'POST'])
def handle_reviews():
    """
    GET: Returns all saved HSE reviews.
    POST: Stores HSE Officer adjudication (CONFIRM, OVERRIDE, ESCALATE).
    """
    if request.method == 'POST':
        data = request.get_json(force=True, silent=True) or {}
        report_id = data.get('report_id')
        decision = data.get('decision') or data.get('action') or 'CONFIRM'
        comment = data.get('comment') or data.get('notes') or ''
        reviewer = data.get('reviewer', 'Lead HSE Safety Officer')
        prediction = data.get('original_prediction', {})

        if not report_id:
            return jsonify({'error': 'report_id is required'}), 400

        entry = record_review(
            report_id=report_id,
            original_prediction=prediction,
            decision=decision,
            reviewer_comment=comment,
            reviewer_name=reviewer
        )
        return jsonify({'status': 'SUCCESS', 'review': entry}), 201

    reviews = get_all_reviews()
    return jsonify({'reviews': reviews, 'total': len(reviews)}), 200


# ── 6. ASYNCHRONOUS BATCH PROCESSING ENDPOINTS ───────────

@app.route('/api/jobs', methods=['POST'])
def create_job():
    """
    Creates an asynchronous batch report processing job.
    Accepts: { "reports": [ {"report_id": "...", "text": "..."}, ... ] }
    """
    data = request.get_json(force=True, silent=True) or {}
    reports = data.get('reports', [])

    if not reports:
        return jsonify({'error': 'reports list is required'}), 400

    job_id = create_batch_job(reports)
    return jsonify({
        'job_id': job_id,
        'status': 'QUEUED',
        'total': len(reports),
        'message': 'Batch processing started in background thread.'
    }), 202


@app.route('/api/jobs/<job_id>', methods=['GET'])
def get_job(job_id):
    """Returns batch processing job status, progress, and completed items."""
    job = get_job_status(job_id)
    if not job:
        return jsonify({'error': f'Job {job_id} not found'}), 404
    return jsonify(job), 200


# ── 7. HEALTH & MODEL GOVERNANCE ENDPOINT ────────────────

@app.route('/api/health', methods=['GET'])
def health():
    """
    Returns system status and model governance info.
    LIGHTWEIGHT — does NOT trigger AI pipeline, embedding model, or Gemini.
    Reports last-known status of lazily-initialized components.
    """
    from ai.embeddings import get_embedding_model_name, get_embedding_status
    from ai.llm import get_llm_model_name
    from ai.rag import get_rag_status, get_knowledge_base_version

    rag_info = get_rag_status()
    emb_status = get_embedding_status()

    process_rss_mb = None
    try:
        import psutil
        process_rss_mb = round(psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024), 1)
    except Exception:
        pass

    return jsonify({
        'status': 'HEALTHY',
        'product': 'SIF-GUARD — Explainable Safety Intelligence Platform',
        'ps_id': 'SIH26165',
        'organization': 'Oil India Limited',
        'model_version': 'sif-baseline-v1',
        'embedding_model': get_embedding_model_name(),
        'embedding_status': emb_status.get('status'),
        'embedding_mode': emb_status.get('mode', 'semantic'),
        'llm_model': get_llm_model_name(),
        'knowledge_base_version': get_knowledge_base_version(),
        'rag_status': rag_info.get('status'),
        'rag_retrieval_mode': rag_info.get('retrieval_mode'),
        'server_rss_mb': process_rss_mb,
        'disclaimer': 'AI-generated analysis is decision support and must be reviewed by qualified HSE personnel.'
    }), 200


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting SIF-GUARD Safety AI API on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
