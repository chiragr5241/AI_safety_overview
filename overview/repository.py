"""Where the dataset is read from. Pages and the API ask a repository and never read files or databases themselves."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Protocol

from .models import Dataset

DATA_DIR = Path(os.environ.get("OVERVIEW_DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
DATA_FILES = {"ecosystem": "ecosystem.json", "size": "size.json", "field": "field.json", "control": "control.json"}


class Repository(Protocol):
    def load(self) -> Dataset: ...


class FileRepository:
    """The JSON files in data/, which are the dataset as published."""

    def __init__(self, data_dir: Path = DATA_DIR):
        self.data_dir = Path(data_dir)

    def raw(self) -> dict:
        return {part: json.loads((self.data_dir / name).read_text(encoding="utf-8")) for part, name in DATA_FILES.items()}

    def load(self) -> Dataset:
        return Dataset.model_validate(self.raw())

    def save(self, ds: Dataset) -> None:
        for part, name in DATA_FILES.items():
            text = json.dumps(getattr(ds, part).to_json(), ensure_ascii=False, indent=1) + "\n"
            (self.data_dir / name).write_text(text, encoding="utf-8")


def get_repository() -> Repository:
    """Neo4j when NEO4J_URI is set, otherwise the files in data/."""
    if os.environ.get("NEO4J_URI"):
        from .neo4j_store import Neo4jRepository

        return Neo4jRepository.from_env()
    return FileRepository()
