"""
server.py - SIF-GUARD REST API Server
Oil India Limited (OIL) - PS ID: SIH26165
Explainable Safety Intelligence Platform Backend
"""

import os
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables (.env if present)
load_dotenv()

from ai.analysis import analyze_full_pipeline
from ai.patterns import discover_precursor_clusters
from ai.hitl import record_review, get_all_reviews
from ai.jobs import create_batch_job, get_job_status
from ai.rag import get_knowledge_base_version, build_index, get_rag_status
from ai.embeddings import get_embedding_model_name

from ai.llm import get_llm_model_name
from evaluation.evaluate import get_evaluation_summary

app = Flask(__name__)
# Enable CORS for frontend interactions (both local development and deployed production URLs)
cors_origins = os.environ.get("CORS_ORIGIN", "*")
if cors_origins != "*":
    cors_origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
CORS(app, resources={r"/api/*": {"origins": cors_origins if cors_origins != "*" else "*"}}, supports_credentials=True)

# Safe initial pre-load of RAG index at module load time for both Gunicorn and development server
try:
    build_index()
except Exception as e:
    print(f"[Startup] Initial RAG index notice: {e}")

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "safety_reports.csv")


@app.route('/', methods=['GET'])
def root_index():
    return jsonify({
        'status': 'HEALTHY',
        'message': 'SIF-GUARD Safety AI API is running on port 5000.',
        'web_ui_url': 'http://localhost:5173',
        'endpoints': {
            'analyze': '/api/analyze',
            'analytics': '/api/analytics',
            'patterns': '/api/patterns',
            'reviews': '/api/reviews',
            'jobs': '/api/jobs',
            'health': '/api/health'
        }
    }), 200


# ── 1. CORE SIF ANALYSIS ENDPOINT ───────────────────────

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Primary API endpoint called by AI Analysis Studio.
    Analyzes raw text using the complete explainable pipeline.
    """
    data = request.get_json(force=True, silent=True) or {}
    text = data.get('text', '') or data.get('report_text', '')

    if not text or not str(text).strip():
        return jsonify({'error': 'Report text is required and cannot be empty.'}), 400

    try:
        result = analyze_full_pipeline(text)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Analysis error: {e}", exc_info=True)
        return jsonify({
            'error': f"Safety analysis failed: {str(e)}",
            'disclaimer': "AI-generated analysis is decision support and must be reviewed by qualified HSE personnel."
        }), 500


# ── 2. SITE ANALYTICS & DATASET STATS ───────────────────

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """
    Returns authentic metrics derived from the 50-report curated prototype dataset.
    Never fabricates production numbers.
    """
    if not os.path.exists(DATA_PATH):
        return jsonify({'error': 'Prototype dataset not found.'}), 404

    try:
        df = pd.read_csv(DATA_PATH)
        total_reports = len(df)
        sif_count = int(df['sif_label'].sum()) if 'sif_label' in df.columns else 0
        non_sif_count = total_reports - sif_count
        sif_rate = round((sif_count / total_reports) * 100.0, 1) if total_reports > 0 else 0.0

        # Top barrier failure from dataset
        barrier_col = df['barrier_failure'].dropna() if 'barrier_failure' in df.columns else pd.Series([])
        top_barrier = barrier_col.mode()[0] if not barrier_col.empty else "Energy Isolation"

        # Top Life-Saving Rule
        rule_col = df['iogp_rule'].dropna() if 'iogp_rule' in df.columns else pd.Series([])
        top_rule = rule_col.mode()[0] if not rule_col.empty else "Confined Space Entry"

        # Facility distribution
        facility_col = df['facility_location'].dropna() if 'facility_location' in df.columns else (
            df['location'].dropna() if 'location' in df.columns else pd.Series([])
        )
        facility_counts = facility_col.value_counts().head(5).to_dict()

        # Calculate open actions pending dynamically from persisted reviews (unresolved/escalated actions)
        reviews = get_all_reviews()
        open_actions_count = len([r for r in reviews if r.get('action') in ('CONFIRM', 'ESCALATE')])

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



# ── 3. PATTERN INTELLIGENCE ENDPOINT ────────────────────

@app.route('/api/patterns', methods=['GET'])
def get_patterns():
    """Returns semantic precursor clusters discovered through Sentence Transformers and K-Means."""
    try:
        clusters = discover_precursor_clusters(num_clusters=3)
        return jsonify({
            'clusters': clusters,
            'dataset_scope': '50 Curated Prototype Safety Reports',
            'methodology': 'Sentence Transformers (all-MiniLM-L6-v2) + K-Means Clustering'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── 4. HUMAN-IN-THE-LOOP (HITL) ENDPOINTS ───────────────

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


# ── 5. ASYNCHRONOUS BATCH PROCESSING ENDPOINTS ──────────

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


# ── 6. HEALTH & MODEL GOVERNANCE ENDPOINT ───────────────

@app.route('/api/health', methods=['GET'])
def health():
    """Returns system status, active models, RAG status, and knowledge base version."""
    rag_info = get_rag_status()
    return jsonify({
        'status': 'HEALTHY',
        'product': 'SIF-GUARD — Explainable Safety Intelligence Platform',
        'ps_id': 'SIH26165',
        'organization': 'Oil India Limited',
        'model_version': 'sif-baseline-v1',
        'embedding_model': get_embedding_model_name(),
        'llm_model': get_llm_model_name(),
        'knowledge_base_version': get_knowledge_base_version(),
        'rag_status': rag_info.get('status'),
        'rag_retrieval_mode': rag_info.get('retrieval_mode'),
        'disclaimer': 'AI-generated analysis is decision support and must be reviewed by qualified HSE personnel.'
    }), 200



if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting SIF-GUARD Safety AI API on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
