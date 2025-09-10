from pathlib import Path
import PyPDF2

SECTIONS = ("BS", "PL", "CF")

def extract_pdf_text(pdf_path: str) -> str:
    text_chunks = []
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        total = len(reader.pages)
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            text_chunks.append(f"\n\n===== PAGE {i+1} / {total} =====\n{text}")
    return "".join(text_chunks)

def _process_scope_dir(scope_dir: Path) -> None:
    """Process a Standalone/<year> folder: expects BS.pdf / PL.pdf / CF.pdf and writes text_extractions/.txt"""
    
    if not scope_dir.exists() or not scope_dir.is_dir():
        return
    processing_dir = scope_dir / "text_extractions"
    processing_dir.mkdir(parents=True, exist_ok=True)

    for sec in SECTIONS:
        pdf_path = scope_dir / f"{sec}.pdf"
        if not pdf_path.exists():
            print(f"[skip] {pdf_path} not found")
            continue
        txt_path = processing_dir / f"{sec}.txt"
        try:
            text_content = extract_pdf_text(str(pdf_path))
            txt_path.write_text(text_content, encoding="utf-8")
            print(f"[ok]  {pdf_path} -> {txt_path}")
        except Exception as e:
            print(f"[err] {pdf_path}: {e}")

    

def process_company_pdfs(target_path: str) -> None:
    """
    Accepts <Company> directory (e.g., Data/Infosys).
    Iterates <Company>/Standalone/<year>/ and writes
    TXT into <Company>/Standalone/<year>/text_extractions/{BS,PL,CF}.txt
    """
    p = Path(target_path)
    if not p.exists():
        raise FileNotFoundError(f"Path not found: {target_path}")

    standalone_root = p / "Standalone"
    if not standalone_root.exists() or not standalone_root.is_dir():
        print(f"[warn] Standalone folder not found under: {target_path}")
        return

    # Each subdir under Standalone is a year block: 2024-25, 2023-24, etc.
    for year_dir in [d for d in standalone_root.iterdir() if d.is_dir()]:
        _process_scope_dir(year_dir)