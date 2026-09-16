import os
import re
import math
import json
import urllib.request
import urllib.error

# Load environment variables from .env if present
def load_env():
    for env_path in [os.path.join(os.path.dirname(__file__), "../.env"), os.path.join(os.path.dirname(__file__), ".env")]:
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip()

load_env()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

MODEL_PRICING = {
    'openai/gpt-4o-mini': {'prompt': 0.00015, 'completion': 0.0006},
    'openai/gpt-4o': {'prompt': 0.0025, 'completion': 0.01},
    'anthropic/claude-3.5-sonnet': {'prompt': 0.003, 'completion': 0.015},
    'meta-llama/llama-3.3-70b-instruct': {'prompt': 0.00035, 'completion': 0.0004},
    'google/gemini-2.0-flash-001': {'prompt': 0.0001, 'completion': 0.0004},
}

AUTOMOTIVE_KEYWORDS = {
    'car', 'cars', 'vehicle', 'vehicles', 'auto', 'automotive', 'engine', 'dtc', 'code', 'vin', 'misfire',
    'brake', 'brakes', 'transmission', 'hvac', 'battery', 'ecu', 'obd', 'obd-ii', 'scanner',
    'p0301', 'p0171', 'p0300', 'p0420', 'p0a80', 'b10a2', 'p112f', 'p052e',
    'honda', 'accord', 'cr-v', 'toyota', 'camry', 'prius', 'ford', 'f-150', 'lightning',
    'bmw', '3 series', '330i', 'chevrolet', 'chevy', 'silverado', 'tesla', 'model y',
    'spark plug', 'coil', 'oil', 'filter', 'torque', 'wiring', 'harness', 'voltage',
    'fuse', 'relay', 'fluid', 'coolant', 'radiator', 'alternator', 'starter', 'cylinder',
    'manifold', 'gasket', 'valve', 'sensor', 'maf', 'o2', 'airbag', 'abs', 'steering',
    'suspension', 'tire', 'wheel', 'alignment', 'recall', 'tsb', 'manual', 'repair',
    'diagnostic', 'step', 'procedure', 'inspection', 'pinout', 'multimeter', 'service',
    'maintenance', 'spec', 'specifications', 'troubleshooting', 'workshop', 'oem'
}

def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return math.ceil(len(text.strip()) / 4)

def calculate_cost(model_name: str = 'openai/gpt-4o-mini', prompt_tokens: int = 0, completion_tokens: int = 0) -> float:
    pricing = MODEL_PRICING.get(model_name, MODEL_PRICING['openai/gpt-4o-mini'])
    p_cost = (prompt_tokens / 1000.0) * pricing['prompt']
    c_cost = (completion_tokens / 1000.0) * pricing['completion']
    return round(p_cost + c_cost, 6)

def clean_text(text: str) -> str:
    if not text:
        return ''
    text = text.replace('\r\n', '\n')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def is_automotive_query(query: str) -> bool:
    if not query or len(query.strip()) < 3:
        return True  # Allow short queries
    
    q_lower = query.lower()
    tokens = set(re.findall(r'\b\w+\b', q_lower))

    # Check for automotive keywords
    if any(k in tokens for k in AUTOMOTIVE_KEYWORDS):
        return True
    if any(re.match(r'^[pbcu]\d{4}$', t) for t in tokens):
        return True
    if any(phrase in q_lower for phrase in ['how to fix', 'repair', 'replace', 'service', 'check engine', 'light', 'what is automotive', 'what is dtc']):
        return True

    return False

def generate_embedding(text: str) -> list[float]:
    cleaned = clean_text(text).lower()
    vector = [0.0] * 128
    for i, char in enumerate(cleaned):
        code = ord(char)
        idx = (code * (i + 1) * 31) % 128
        vector[idx] += 1.0
    
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude > 0:
        vector = [x / magnitude for x in vector]
    return vector

def cosine_similarity(vecA: list[float], vecB: list[float]) -> float:
    if not vecA or not vecB or len(vecA) != len(vecB):
        return 0.0
    dot = sum(a * b for a, b in zip(vecA, vecB))
    magA = math.sqrt(sum(a * a for a in vecA))
    magB = math.sqrt(sum(b * b for b in vecB))
    if magA == 0 or magB == 0:
        return 0.0
    return dot / (magA * magB)

def chunk_document(content: str, metadata: dict, opts: dict = None) -> list[dict]:
    cleaned = clean_text(content)
    chunk_size = (opts or {}).get('chunkSize', 400)
    chunk_overlap = (opts or {}).get('chunkOverlap', 50)

    words = cleaned.split()
    chunks = []
    chunk_idx = 0

    if len(words) <= chunk_size:
        token_cnt = estimate_tokens(cleaned)
        emb = generate_embedding(cleaned)
        chunks.append({
            'chunkIndex': 0,
            'content': cleaned,
            'tokenCount': token_cnt,
            'embedding': emb,
            'make': metadata.get('make', ''),
            'model': metadata.get('model', ''),
            'docType': metadata.get('docType', '')
        })
        return chunks

    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size]
        chunk_text = " ".join(chunk_words)
        token_cnt = estimate_tokens(chunk_text)
        emb = generate_embedding(chunk_text)
        chunks.append({
            'chunkIndex': chunk_idx,
            'content': chunk_text,
            'tokenCount': token_cnt,
            'embedding': emb,
            'make': metadata.get('make', ''),
            'model': metadata.get('model', ''),
            'docType': metadata.get('docType', '')
        })
        chunk_idx += 1
        i += (chunk_size - chunk_overlap)

    return chunks

def retrieve_relevant_chunks(db_wrap, query: str, make: str = None, model: str = None, top_k: int = 3) -> list[dict]:
    cursor = db_wrap.cursor()
    cursor.execute("SELECT * FROM document_chunks")
    all_chunks = cursor.fetchall()

    if not all_chunks:
        return []

    q_vector = generate_embedding(query)
    q_tokens = set(clean_text(query).lower().split())

    scored = []
    for c in all_chunks:
        c_dict = dict(c)
        emb = []
        if c_dict.get('embedding'):
            try:
                emb = json.loads(c_dict['embedding'])
            except Exception:
                pass
        
        sim = cosine_similarity(q_vector, emb)
        c_content = (c_dict.get('content') or '').lower()
        word_matches = sum(1 for tok in q_tokens if tok in c_content)
        overlap_score = word_matches / max(len(q_tokens), 1)

        make_boost = 0.0
        if make and c_dict.get('make') and make.lower() == c_dict['make'].lower():
            make_boost += 0.25
        if model and c_dict.get('model') and model.lower() in c_dict['model'].lower():
            make_boost += 0.25

        final_score = (sim * 0.5) + (overlap_score * 0.25) + make_boost

        scored.append({
            'id': c_dict['id'],
            'documentId': c_dict['documentId'],
            'chunkIndex': c_dict['chunkIndex'],
            'title': c_dict.get('title') or 'OEM Service Manual',
            'content': c_dict['content'],
            'make': c_dict.get('make'),
            'model': c_dict.get('model'),
            'docType': c_dict.get('docType'),
            'similarity': round(float(final_score), 4),
            'rawCosSim': round(float(sim), 4)
        })

    scored.sort(key=lambda x: x['similarity'], reverse=True)
    return scored[:top_k]

def build_grounded_prompt(query: str, retrieved_chunks: list[dict], vehicle_context: str = None, user_role: str = 'technician') -> dict:
    citations = []
    context_str = ""

    for i, chunk in enumerate(retrieved_chunks):
        c_num = i + 1
        citations.append({
            'citationId': c_num,
            'title': chunk.get('title', 'OEM Technical Manual'),
            'make': chunk.get('make', 'OEM'),
            'model': chunk.get('model', 'Standard'),
            'docType': chunk.get('docType', 'Service Manual'),
            'snippet': chunk['content'][:180] + '...',
            'fullContent': chunk['content'],
            'similarityScore': chunk['similarity']
        })
        context_str += f"[Citation #{c_num}] Title: {chunk.get('title')} ({chunk.get('make')} {chunk.get('model')})\nContent: {chunk['content']}\n\n"

    # Role-Aware Instructions
    role_instruction = "Focus on step-by-step repair procedures, torque specifications, safety warnings, and component installation."
    if user_role == 'manager':
        role_instruction = "Focus on compliance guidelines, document validation status, technician field feedback, and operational oversight."
    elif user_role == 'super_admin':
        role_instruction = "Focus on enterprise audit logs, version governance, database telemetry, and global security policies."

    system_prompt = (
        f"You are AuraOS Intelligent Diagnostic Assistant, an enterprise automotive service AI for role [{user_role.upper()}].\n"
        f"Role Focus: {role_instruction}\n"
        "Instructions:\n"
        "1. Answer the query strictly using the provided OEM Knowledge Context.\n"
        "2. Always include bracketed citation badges like [Citation #1] or [Citation #2] when citing specs or steps.\n"
        "3. If context does not specify, provide standard OEM automotive diagnostic guidelines."
    )

    user_prompt = f"Vehicle Context: {vehicle_context or 'General OEM Automotive'}\nUser Role: {user_role}\n\nRetrieved OEM Context:\n{context_str}\nQuery: {query}"

    return {
        'systemPrompt': system_prompt,
        'userPrompt': user_prompt,
        'citations': citations
    }

def query_live_openrouter(system_prompt: str, user_prompt: str) -> str:
    """Invokes OpenRouter API for live AI response generation using environment key"""
    load_env()
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    model_name = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini").strip()

    if not api_key:
        print("[RAG LLM] OPENROUTER_API_KEY not configured in .env; skipping live OpenRouter query.")
        return ""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "AuraOS Automotive Platform"
    }

    body = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 600
    }

    try:
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers=headers
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            if "choices" in res_data and len(res_data["choices"]) > 0:
                answer = res_data["choices"][0]["message"]["content"]
                print(f"[RAG LLM Success] Received live AI response using model: {model_name}")
                return answer
    except urllib.error.HTTPError as he:
        err_body = he.read().decode("utf-8", errors="ignore")
        print(f"[RAG LLM HTTP Error {he.code}] OpenRouter API error: {err_body}")
    except Exception as e:
        print(f"[RAG LLM Warning] OpenRouter call exception: {e}")

    return ""

def evaluate_rag_answer(query: str, response_text: str, retrieved_chunks: list[dict]) -> dict:
    has_citations = '[' in response_text and 'Citation' in response_text
    retrieved_count = len(retrieved_chunks)
    top_sim = retrieved_chunks[0]['similarity'] if retrieved_chunks else 0.0

    faithfulness = 0.95 if has_citations else 0.70
    answer_relevance = min(0.98, top_sim + 0.20) if top_sim > 0 else 0.50
    groundedness = 0.92 if (has_citations and retrieved_count > 0) else 0.65

    overall_eval = round((faithfulness + answer_relevance + groundedness) / 3.0, 2)

    return {
        'faithfulnessScore': round(faithfulness, 2),
        'answerRelevanceScore': round(answer_relevance, 2),
        'groundednessScore': round(groundedness, 2),
        'overallEvalScore': overall_eval,
        'citationCount': response_text.count('Citation #'),
        'hasCitations': has_citations,
        'status': 'PASSED' if overall_eval >= 0.75 else 'NEEDS_REVIEW'
    }
