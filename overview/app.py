"""Serve the existing pages. Data scripts are built from the repository so the map keeps its current look."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response

from .charts import grant_records_html
from .repository import get_repository

ROOT = Path(__file__).resolve().parent.parent
PAGES = {
    "": "index.html",
    "index.html": "index.html",
    "ecosystem.html": "ecosystem.html",
    "multi-agent-risks.html": "multi-agent-risks.html",
}
DATA_JS = {
    "ecosystem-data.js": ("ECOSYSTEM", "ecosystem"),
    "size-data.js": ("ECO_SIZE", "size"),
    "field-data.js": ("FIELD", "field"),
    "control-data.js": ("CONTROL", "control"),
}
STATIC_SUFFIX = {".css", ".js", ".svg", ".png", ".ico", ".jpg", ".webp", ".woff2", ".map"}


@lru_cache(maxsize=1)
def dataset():
    return get_repository().load()


app = FastAPI(title="AI Safety Overview", docs_url=None, redoc_url=None)


@app.get("/api/{part}")
def api_part(part: str):
    if part not in ("ecosystem", "size", "field", "control"):
        raise HTTPException(404)
    return JSONResponse(getattr(dataset(), part).to_json())


@app.get("/charts/grants")
def charts_grants():
    return HTMLResponse(grant_records_html(dataset()))


@app.get("/")
@app.get("/{name:path}")
def page_or_file(name: str = ""):
    if name in DATA_JS:
        global_name, attr = DATA_JS[name]
        payload = json.dumps(getattr(dataset(), attr).to_json(), ensure_ascii=False, separators=(",", ":"))
        return Response(f"window.{global_name} = {payload};\n", media_type="application/javascript; charset=utf-8")
    if name in PAGES:
        return FileResponse(ROOT / PAGES[name], media_type="text/html; charset=utf-8")
    path = (ROOT / name).resolve()
    relative = path.relative_to(ROOT) if ROOT in path.parents or path == ROOT else None
    if relative is None or not path.is_file() or path.suffix not in STATIC_SUFFIX:
        raise HTTPException(404)
    if any(part.startswith(".") for part in relative.parts):
        raise HTTPException(404)
    return FileResponse(path)
