"""Reading and writing the dataset in Neo4j. The layout itself is in graph.py.

Settings come from the environment: NEO4J_URI, NEO4J_USER (default "neo4j"), NEO4J_PASSWORD and,
optionally, NEO4J_DATABASE. Only nodes with the labels in graph.LABELS are read, written or replaced,
so the database can hold other data alongside this.
"""
from __future__ import annotations

import os
from collections import defaultdict

from neo4j import Driver, GraphDatabase, ManagedTransaction

from .graph import DATA_RELS, LABELS, Graph, Node, Rel, from_graph, to_graph
from .models import Dataset


class Neo4jRepository:
    def __init__(self, driver: Driver, database: str | None = None):
        self.driver = driver
        self.database = database

    @classmethod
    def from_env(cls) -> Neo4jRepository:
        auth = (os.environ.get("NEO4J_USER", "neo4j"), os.environ["NEO4J_PASSWORD"])
        driver = GraphDatabase.driver(os.environ["NEO4J_URI"], auth=auth)
        return cls(driver, os.environ.get("NEO4J_DATABASE") or None)

    def close(self) -> None:
        self.driver.close()

    def load(self) -> Dataset:
        return from_graph(self.read_graph())

    def read_graph(self) -> Graph:
        with self.driver.session(database=self.database) as session:
            return session.execute_read(_read)

    def write(self, ds: Dataset, replace: bool = False) -> None:
        """Upsert every node and relationship by key. With replace, first delete what is there under these labels."""
        graph = to_graph(ds)
        for label in LABELS:
            self.driver.execute_query(
                f"CREATE CONSTRAINT {label.lower()}_key IF NOT EXISTS FOR (n:{label}) REQUIRE n.key IS UNIQUE",
                database_=self.database,
            )
        with self.driver.session(database=self.database) as session:
            session.execute_write(_write, graph, replace)


def _read(tx: ManagedTransaction) -> Graph:
    nodes = [
        Node(_our_label(r["labels"]), r["props"]["key"], r["props"])
        for r in tx.run(
            "MATCH (n) WHERE any(l IN labels(n) WHERE l IN $labels) RETURN labels(n) AS labels, properties(n) AS props",
            labels=list(LABELS),
        )
    ]
    rels = [
        Rel(r["type"], (_our_label(r["al"]), r["ak"]), (_our_label(r["bl"]), r["bk"]), r["props"].get("key", ""), r["props"])
        for r in tx.run(
            "MATCH (a)-[r]->(b) WHERE type(r) IN $types "
            "RETURN type(r) AS type, labels(a) AS al, a.key AS ak, labels(b) AS bl, b.key AS bk, properties(r) AS props",
            types=list(DATA_RELS),
        )
    ]
    return Graph(nodes, rels)


def _write(tx: ManagedTransaction, graph: Graph, replace: bool) -> None:
    if replace:
        tx.run("MATCH (n) WHERE any(l IN labels(n) WHERE l IN $labels) DETACH DELETE n", labels=list(LABELS))

    nodes: dict[str, list[dict]] = defaultdict(list)
    for n in graph.nodes:
        nodes[n.label].append({"key": n.key, "props": n.props})
    for label, rows in nodes.items():
        tx.run(f"UNWIND $rows AS row MERGE (n:{label} {{key: row.key}}) SET n = row.props, n.key = row.key", rows=rows)

    rels: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for r in graph.rels:
        rels[(r.type, r.start[0], r.end[0])].append({"start": r.start[1], "end": r.end[1], "key": r.key, "props": r.props})
    for (type_, start, end), rows in rels.items():
        tx.run(
            f"UNWIND $rows AS row "
            f"MATCH (a:{start} {{key: row.start}}) MATCH (b:{end} {{key: row.end}}) "
            f"MERGE (a)-[r:{type_} {{key: row.key}}]->(b) SET r = row.props, r.key = row.key",
            rows=rows,
        )


def _our_label(labels: list[str]) -> str:
    return next(label for label in labels if label in LABELS)
