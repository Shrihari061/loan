from pathlib import Path
import PyPDF2

SECTIONS = ("BS", "PL", "CF")
SCOPES = ("Standalone", "Consolidated")

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
    """Process a Standalone/Consolidated folder: expects BS.pdf / PL.pdf / CF.pdf and writes processing/*.txt"""
    if not scope_dir.exists() or not scope_dir.is_dir():
        return
    processing_dir = scope_dir / "processing"
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
    Accepts any of:
      - <root>                       (contains many <Company>/...)
      - <root>/<Company>             (contains Standalone/Consolidated)
      - <root>/<Company>/<Scope>     (process exactly this scope)  <-- current use case
    Writes TXT into <Scope>/processing/{BS,PL,CF}.txt
    """
    p = Path(target_path)
    if not p.exists():
        raise FileNotFoundError(f"Path not found: {target_path}")

    # Case 1: a scope folder (Standalone or Consolidated)
    if p.is_dir() and p.name in SCOPES:
        _process_scope_dir(p)
        return

    # Case 2: a company folder (contains Standalone/Consolidated)
    if p.is_dir() and any((p / s).is_dir() for s in SCOPES):
        for s in SCOPES:
            scope_dir = p / s
            if scope_dir.is_dir():
                _process_scope_dir(scope_dir)
        return

    # Case 3: a root folder with many companies
    if p.is_dir():
        for company_dir in [c for c in p.iterdir() if c.is_dir()]:
            for s in SCOPES:
                scope_dir = company_dir / s
                if scope_dir.is_dir():
                    _process_scope_dir(scope_dir)
        return

    # Fallback
    print(f"[warn] Nothing to process under: {target_path}")
