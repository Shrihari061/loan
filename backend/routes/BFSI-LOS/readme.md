# BFSI_LOS Credit Risk Pipeline

This feature consists of an LLM parser pipeline which extracts financials from financial statements (PNG), calculates key ratios, and assesses credit risk.

## 📦 Folder Structure

- `modules/` - Contains all modular logic (parsing, extraction, scoring)
- `config/` - Environment and model config
- `Data/` - Input financials PDF of each company in discrete folders (Eg: comapany_name/Standalone/BS.pdf)
- `run_pipeline.py` - CLI runner

## 🚀 How to Run

create .env file with OPEN_API_KEY = "sk-....."

```bash
python run_pipeline.py Data/Infosys/Standalone
```
