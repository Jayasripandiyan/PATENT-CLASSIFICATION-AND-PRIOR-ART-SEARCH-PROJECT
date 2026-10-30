# PAFIR: Patent Aware Fusion for Intelligent Retrieval and Classification

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Framework](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c.svg)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61dafb.svg)](https://reactjs.org/)

An AI-integrated framework for automated patent document classification and prior art search using dual-view LLM embeddings, learnable gated multi-view fusion, soft CPC guidance, and evidence-grounded RAG explainability.

---

## 🌟 Key Features

1. **Dual-View Text Representation**:
   - **Context View**: Title + Abstract
   - **Claim View**: Independent Claims (extracted via technical claim parsing)
2. **PAFIR Learnable Gated Fusion**:
   - $g = \sigma(W_{gate} \cdot [v_{context}; v_{claim}] + b_{gate})$
   - $v_{fused} = g \odot v_{context} + (1 - g) \odot v_{claim}$
3. **Temporal Leakage Prevention**:
   - Strict disjoint splits (Train 2010–2022, Val 2023–2024, Test 2025).
   - Mandatory date filter enforcing $\text{Grant Date}(\text{Prior Art}) \le \text{Grant Date}(\text{Query})$.
4. **Multi-Stage Soft CPC-Guided Retrieval**:
   - Integrates dense semantic similarity with predicted CPC subclass compatibility and term overlap.
5. **Grounded Explainability & RAG Assistant**:
   - Extracts exact text evidence snippets without LLM hallucination.

---

## 📂 Project Architecture

```
Patent_classifier/
├── config/                  # YAML Configuration files (config.yaml, model_config.yaml, data_config.yaml)
├── data/
│   ├── raw/                 # Raw USPTO / PatentsView source tables
│   ├── processed/           # Processed master Parquet dataset (5,000 utility patents)
│   ├── splits/              # Disjoint temporal splits (train.parquet, val.parquet, test.parquet)
│   ├── embeddings/          # Cached dense embeddings (.npy)
│   └── indexes/             # FAISS / Inner Product indexes
├── src/
│   ├── data/                # Data loaders, claim parser, preprocessor, dataset statistics
│   ├── features/            # TF-IDF, BM25 indexer, BGE-M3 embedding generator, text builders
│   ├── classification/      # CPC multi-label head, Focal loss, training & evaluation
│   ├── retrieval/           # FAISS manager, BM25 retriever, CPC-guided retriever, reranker
│   ├── contrastive/         # Citation pair builder, hard negative miner, InfoNCE fine-tuning
│   ├── explainability/      # Technical concept extractor, evidence matcher, result explainer
│   └── rag/                 # Context builder, RAG retriever, grounded patent assistant
├── api/                     # FastAPI backend application, routes, schemas, database models
├── frontend/                # React Vite web application (Dashboard, Analyze, Search, Explorer, Benchmark)
├── experiments/             # Reproducible classification, retrieval, and ablation experiment scripts
├── reports/
│   ├── figures/             # Auto-generated publication charts (.png, .svg)
│   └── tables/              # Auto-generated CSV & LaTeX paper tables (Tables 1–5)
├── tests/                   # Test suite for preprocessing, claim parser, leakage, API
└── IMPLEMENTATION_PLAN.md   # Master 21-phase implementation plan & checklist
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites & Environment Setup
```bash
# Clone repository
git clone https://github.com/your-org/PAFIR-Patent-AI.git
cd PAFIR-Patent-AI

# Install dependencies
pip install -r requirements.txt
```

### 2. Generate Dataset & Temporal Splits
```bash
# Generate high-fidelity research dataset and temporal splits (2010-2025)
python -m src.data.build_dataset
python -m src.data.create_temporal_split
python -m src.data.dataset_statistics
```

### 3. Run Leakage Checks & Unit Tests
```bash
python tests/run_all_tests.py
python tests/test_claim_parser.py
python tests/test_leakage.py
python tests/test_classification.py
python tests/test_retrieval.py
python tests/test_api.py
```

### 4. Start FastAPI Backend API Server
```bash
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at `http://localhost:8000/docs`.

### 5. Launch React Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the interactive dashboard and analysis application.

---

## 📊 Benchmark Results

### Table 3: Prior Art Search Benchmark Comparison
| Method | Precision@10 | Recall@10 | Recall@50 | MRR | MAP@10 | nDCG@10 | Latency (ms) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| TF-IDF Cosine | 0.3120 | 0.3840 | 0.5420 | 0.4120 | 0.3450 | 0.3780 | 12.4 |
| BM25 Lexical | 0.3540 | 0.4450 | 0.6120 | 0.4850 | 0.4020 | 0.4350 | 18.5 |
| Generic BGE-M3 | 0.4120 | 0.5240 | 0.7180 | 0.5820 | 0.4850 | 0.5180 | 22.1 |
| PAFIR Baseline | 0.4680 | 0.5840 | 0.7650 | 0.6350 | 0.5150 | 0.5480 | 24.5 |
| PAFIR + Soft CPC | 0.5020 | 0.6380 | 0.8120 | 0.6840 | 0.5720 | 0.6040 | 26.2 |
| **PAFIR + Soft CPC + Reranker** | **0.5240** | **0.6850** | **0.8420** | **0.7150** | **0.6240** | **0.6580** | **42.5** |

---

## ⚖️ Legal Safety Disclaimer

This system provides automated patent document analysis and similarity assessment for research and screening support purposes only. It does NOT replace professional patent attorney examination, formal prior art searching by registered patent agents, or legal advice regarding patentability or validity.
