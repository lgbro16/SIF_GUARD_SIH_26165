"""
preprocessing.py - Safety Report Text Preprocessing Pipeline
Preserves critical negation and failure terms while standardizing oilfield abbreviations.
"""

import re
import nltk

# Auto-download required NLTK corpuses if missing
for resource in ['stopwords', 'wordnet', 'punkt', 'punkt_tab']:
    try:
        nltk.data.find(f'corpora/{resource}' if resource in ['stopwords', 'wordnet'] else f'tokenizers/{resource}')
    except (LookupError, ValueError):
        try:
            nltk.download(resource, quiet=True)
        except Exception:
            pass

try:
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tokenize import word_tokenize
    lemmatizer = WordNetLemmatizer()
    standard_stopwords = set(stopwords.words('english'))
except Exception:
    lemmatizer = None
    standard_stopwords = {
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
        'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'it', 'its', 'itself', 'they',
        'them', 'their', 'theirs', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
        'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
        'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
        'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about',
        'between', 'into', 'through', 'during', 'before', 'after', 'to', 'from', 'up', 'down',
        'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
        'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
        'most', 'other', 'some', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
        's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
    }

# Domain-specific oilfield abbreviations
SAFETY_ABBREVIATIONS = {
    'ua': 'unsafe act',
    'uc': 'unsafe condition',
    'ptw': 'permit to work',
    'loto': 'lockout tagout energy isolation',
    'ppe': 'personal protective equipment',
    'h2s': 'hydrogen sulfide toxic gas',
    'lel': 'lower explosive limit flammable',
    'sif': 'serious injury fatality',
    'psif': 'potential serious injury fatality',
    'jsa': 'job safety analysis',
    'tbm': 'toolbox meeting',
    'nm': 'near miss',
    'moc': 'management of change',
    'hsse': 'health safety security environment',
    'msds': 'material safety data sheet',
    'awp': 'aerial work platform',
    'esd': 'emergency shutdown',
    'scba': 'self contained breathing apparatus',
    'agt': 'authorized gas tester',
    'bop': 'blowout preventer',
    'dbb': 'double block and bleed',
}

# CRITICAL: Preserve safety negation and barrier status tokens
SAFETY_PRESERVE_WORDS = {
    'not', 'no', 'without', 'never', 'none',
    'absent', 'missing', 'failed', 'bypassed',
    'ignored', 'disabled', 'removed', 'above',
    'below', 'near', 'against', 'unbolted',
    'cracked', 'leak', 'fault', 'stopped'
}

FINAL_STOPWORDS = standard_stopwords - SAFETY_PRESERVE_WORDS


def expand_abbreviations(text: str) -> str:
    """Expands oil & gas industry abbreviations while respecting word boundaries."""
    if not text:
        return ""
    text_lower = text.lower()
    for short, full in SAFETY_ABBREVIATIONS.items():
        text_lower = re.sub(r'\b' + re.escape(short) + r'\b', full, text_lower)
    return text_lower


def preprocess(text: str) -> str:
    """
    Cleans raw report text:
    1. Expands safety abbreviations
    2. Strips punctuation while preserving words
    3. Filters generic stopwords (keeping critical negations)
    4. Applies lemmatization where available
    """
    if not text:
        return ""

    # 1. Expand abbreviations
    text = expand_abbreviations(text)

    # 2. Normalize whitespace and remove special characters
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    # 3. Tokenize
    tokens = text.split()

    # 4. Remove standard stopwords (preserving safety negations)
    filtered = [w for w in tokens if w not in FINAL_STOPWORDS]

    # 5. Lemmatize
    if lemmatizer:
        try:
            processed = [lemmatizer.lemmatize(w) for w in filtered]
        except Exception:
            processed = filtered
    else:
        processed = filtered

    return ' '.join(processed)
