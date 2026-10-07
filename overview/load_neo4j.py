"""Copy the dataset in data/ into Neo4j, then read it back and check nothing changed.

    uv run --extra neo4j python -m overview.load_neo4j [--replace]

Without --replace, every node and relationship is upserted by key, and anything removed from the files stays in
the database. With --replace, this dataset's nodes are deleted first; other data in the database is left alone.
"""
from __future__ import annotations

import argparse
import sys
from collections import Counter

from .graph import to_graph
from .neo4j_store import Neo4jRepository
from .repository import FileRepository


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--replace", action="store_true", help="delete this dataset's nodes before loading")
    args = parser.parse_args()

    ds = FileRepository().load()
    graph = to_graph(ds)
    db = Neo4jRepository.from_env()
    try:
        db.write(ds, replace=args.replace)
        back = db.load()
    finally:
        db.close()

    counts = Counter(n.label for n in graph.nodes)
    print("Wrote", ", ".join(f"{v} {k}" for k, v in counts.items()), f"and {len(graph.rels)} relationships.")
    if back.to_json() != ds.to_json():
        print("Read back from Neo4j, the dataset differs from data/. Run with --replace to clear old rows.", file=sys.stderr)
        return 1
    print("Read back from Neo4j: identical to data/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
