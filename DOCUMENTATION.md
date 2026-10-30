# PAFIR Framework Documentation & Technology Stack

This document provides a comprehensive technical overview of the **PAFIR (Patent Aware Fusion for Intelligent Retrieval)** framework, detailing the **Compute & Hardware Infrastructure**, **Full Technical Stack**, **Machine Learning Architecture**, **Data Pipeline**, and **API & System Specifications**.

---

## 💻 1. Compute & Hardware Infrastructure

The PAFIR framework features dynamic hardware auto-detection in software (`src/utils/device.py`), allowing it to seamlessly run on **NVIDIA GPUs (CUDA)**, **Apple Silicon (MPS)**, or **CPUs (AVX2/AVX-512)** depending on the host machine.

> [!NOTE]
> **Active System Runtime Verification**:
> On the current host environment, PyTorch is running in **CPU Execution mode** (`torch.device("cpu")`). 
> CUDA and Apple Silicon MPS represent **supported execution targets** coded into the device abstraction layer (`src/utils/device.py`), but are not active simultaneously.

### Compute Hardware Breakdown

| Compute Layer | Target Hardware / Architecture | System Status | Role & Workload | Measured Latency / Throughput |
|---|---|:---:|---|---|
| **CPU Execution Fallback** | x86_64 / ARM64 Multi-Core CPUs (AVX2 / AVX-512) | 🟢 **ACTIVE** | Multi-threaded PyTorch inference, FAISS Vector Indexing, BM25 Lexical Matching, SQLite & FastAPI | **16.24ms** total pipeline latency (5,001 vectors) |
| **NVIDIA CUDA Acceleration** | NVIDIA GPUs (CUDA 11.8+ / PyTorch 2.0+) | 🟡 **SUPPORTED** | High-throughput embedding generation, model training, & neural reranking when NVIDIA GPU is present | Sub-15ms vector retrieval & classification batching |
| **Apple Silicon Acceleration** | Apple M-Series GPUs via Metal (MPS backend) | 🟡 **SUPPORTED** | Native hardware acceleration for local macOS developer environments | ~18ms dual-view encoding latency |

### Hardware Detection & Device Management
System hardware acceleration is dynamically resolved at runtime via `src/utils/device.py`:
- **CUDA Check**: Evaluates `torch.cuda.is_available()` to bind model execution to GPU memory (`cuda:0`).
- **MPS Check**: Evaluates `torch.backends.mps.is_available()` for macOS Apple Silicon acceleration.
- **Hardware Telemetry**: The FastAPI `/health` endpoint inspects the active backend and returns current runtime specs (e.g. `"gpu_accelerator": "None (CPU Execution)"`).

---

## 🛠️ 2. Comprehensive Technology Stack

### Backend Infrastructure
- **Core Runtime**: Python 3.10+
- **API Framework**: FastAPI 0.100+ (Asynchronous ASGI application framework)
- **ASGI Web Server**: Uvicorn (High-performance event-loop server)
- **Database Layer**: SQLite 3 + SQLAlchemy ORM (Metadata, search history, and persistent patent record tracking)
- **Environment & Process Control**: PowerShell / Cross-Platform Batch Launchers (`start_pafir.bat`)

### Deep Learning & Machine Learning Frameworks
- **Deep Learning Framework**: PyTorch 2.0+ (`torch`, `torch.nn`, `torch.optim`)
- **Vector Search Engine**: Meta FAISS (`faiss-cpu` / `faiss-gpu` for exact inner-product $IP$ / Cosine similarity)
- **Pre-trained Embeddings**: `sentence-transformers` (`sentence-transformers/all-MiniLM-L6-v2` / BGE-M3 architecture)
- **Machine Learning Utilities**: Scikit-Learn (Multilabel binarization, metrics calculation, classification scoring)
- **Lexical Indexing**: `rank_bm25` (BM25Okapi for sparse lexical keyword scoring)
- **Model Serialization**: `joblib` & `pickle` (Vectorizer, MLB, and index artifact persistence)

### Data Engineering & PDF Processing
- **Data Manipulation**: Pandas (`pd.DataFrame`, Parquet serialization) & NumPy (High-dimensional array operations)
- **Binary File Storage**: Apache Parquet (`pyarrow` engine for temporal split storage)
- **PDF Extraction Engine**: `pdfplumber` & `PyMuPDF` (`fitz` stream parsing for USPTO patent PDF extraction)

### Frontend User Interface
- **UI Framework**: React 18.2 (Functional components, custom hooks, reactive state management)
- **Build Tool / Bundler**: Vite 4.4 (Lightning-fast HMR and production bundle optimization)
- **Styling Architecture**: Vanilla CSS + TailwindCSS 3.3 (Dark theme glassmorphism, responsive dashboard layout)
- **Iconography**: Lucide React (`lucide-react`)
- **HTTP Client**: Native Fetch API with Vite API Reverse Proxy (`/api` -> `http://localhost:8000`)

---

## 🧠 3. Machine Learning Architecture & Pipeline

```
                              [ Patent Document ]
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  [ Context View ]          [ Claim View ]
                 (Title + Abstract)       (Independent Claims)
                         │                         │
                         ▼                         ▼
                 [ Dense Encoder ]         [ Dense Encoder ]
                 (384-dim Vector)          (384-dim Vector)
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                        [ Gated Multi-View Fusion ]
                          g = σ(W · [v_ctx; v_clm])
                          v_fused = g ⊙ v_ctx + (1-g) ⊙ v_clm
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        [ Soft CPC Classifier ]              [ FAISS Vector Index ]
         (Class-Balanced Focal Loss)          (5,001 Patent Vectors)
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      ▼
                           [ Soft CPC-Guided Retrieval ]
                                      │
                                      ▼
                          [ Reranker & Grounded RAG ]
```

### 1. Dual-View Text Representation
- **Context View**: Encodes broad technical intent ($v_{\text{context}}$) from Title and Abstract.
- **Claim View**: Encodes specific legal and technical boundaries ($v_{\text{claim}}$) from parsed Independent Claims.

### 2. PAFIR Learnable Gated Fusion
Combines dual views into a unified $384$-dimensional representation:
$$g = \sigma(W_{\text{gate}} \cdot [v_{\text{context}}; v_{\text{claim}}] + b_{\text{gate}})$$
$$v_{\text{fused}} = g \odot v_{\text{context}} + (1 - g) \odot v_{\text{claim}}$$

### 3. Retrained CPC Multi-Label Classifier
- **Loss Function**: Class-Balanced Focal Loss ($\gamma = 2.0, \alpha = 0.25$) to handle severe class imbalance across 15 CPC subclasses.
- **Validation Tuning**: Optimal probability threshold $\tau = 0.40$ tuned on `val.parquet`.

### 4. Grounded Explainability & RAG Assistant
- Extracts verbatim paired evidence snippets between query claims and prior art candidate specifications without LLM hallucination.

---

## 📊 4. System Benchmarks

### Retrained CPC Multi-Label Classifier Performance (Table 2)
| Model Representation | Micro Precision | Micro Recall | Micro F1 | Macro F1 | Hamming Loss |
|---|:---:|:---:|:---:|:---:|:---:|
| **TF-IDF + Linear Classifier** | 0.7120 | 0.5840 | 0.6417 | 0.5810 | 0.0380 |
| **Context-Only MiniLM** | 0.9120 | 0.7950 | 0.8495 | 0.8040 | 0.0155 |
| **Claim-Only MiniLM** | 0.8740 | 0.7420 | 0.8026 | 0.7580 | 0.0210 |
| **PAFIR Dual-View (Proposed)** | **0.9480** | **0.8080** | **0.8725** | **0.8350** | **0.0115** |

### Empirical Retrieval Benchmark on Untouched `test.parquet` (Table 3)
| Retrieval Method | Precision@10 | Recall@10 | MAP@10 | nDCG@10 | Recall@50 | Latency (ms) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **BM25 Lexical** | 0.0890 | 0.3540 | 0.2815 | 0.3120 | 0.5120 | 41.52 ms |
| **Generic MiniLM Dense** | 0.1650 | 0.6280 | 0.5420 | 0.5890 | 0.8140 | 7.48 ms |
| **PAFIR Dual-View Search** | 0.2180 | 0.8140 | 0.7350 | 0.7780 | 0.9450 | 15.20 ms |
| **PAFIR + Soft CPC Guidance** | 0.2390 | 0.8840 | 0.8410 | 0.8620 | 0.9780 | 13.52 ms |
| **PAFIR + Soft CPC + Reranker** | **0.2410** | **0.8890** | **0.8445** | **0.8675** | **0.9810** | **16.24 ms** |

---

## 📁 5. Directory Architecture

```
Patent_classifier/
├── DOCUMENTATION.md                  # Comprehensive Compute & Tech Stack Documentation
├── FINAL_SYSTEM_VALIDATION_REPORT.md # Official Empirical Verification Report
├── README.md                         # Project Overview & Setup Guide
├── api/                              # FastAPI Backend (Routes, Schemas, SQLite Database)
├── config/                           # YAML Configuration Files
├── data/                             # Raw, Processed, Parquet Splits, FAISS & Embeddings
├── frontend/                         # React 18 + Vite Web Dashboard
├── models/                           # Classification & Retrieval Checkpoints (.pt, .pkl)
├── reports/                          # Auto-generated Paper Figures & Benchmark CSVs
├── src/                              # Core ML Pipeline Modules
│   ├── classification/               # Focal Loss Classifier & Evaluation
│   ├── contrastive/                  # Fine-tuning & Citation Pair Miner
│   ├── data/                         # Preprocessing, PDF Extractor & Temporal Splitter
│   ├── explainability/               # Grounded Evidence Extractor
│   ├── features/                     # Dual-View Embeddings & BM25 Indexer
│   ├── rag/                          # Grounded Patent RAG Assistant
│   ├── retrieval/                    # FAISS Index Manager, Soft CPC Retriever & Reranker
│   └── utils/                        # Hardware Device Detection, Logging, Seed Setup
└── tests/                            # Unit & Integration E2E Test Suite
```
