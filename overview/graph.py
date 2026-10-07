"""The dataset laid out as a property graph, the shape it takes in Neo4j.

Kept free of any database code so the layout can be checked in memory: `from_graph(to_graph(d)) == d`.

Nodes (each has a `key`, unique within its label, and an `idx` that keeps list order):
  Meta              one per dataset, for its top-level fields
  Category, Actor, Source, Financial            the stakeholder dataset
  Figure            one size figure for one actor under one measure (people, money, worth)
  FieldCategory, FieldEntry, GrantRecord        the AI safety field
  Flow              one funder's record for one recipient; its total covers that record only
  Grant             one row of a Flow
  Person, ControlRow                            the control evidence

Relationships that carry data, read back as the ends they join:
  (Actor)-[:TIE]->(Actor)
  (Actor|FieldEntry)-[:COMPANY_MONEY]->(Actor|FieldEntry)
  (Actor|Person)-[:CONTROL_TIE]->(Actor|Person)

Relationships written for querying only; on reading, the node properties they mirror are what counts:
  IN_CATEGORY, CITES, ABOUT, SIZES, USES_FINANCIAL, IN_FIELD_CATEGORY, SAME_AS,
  FUNDER, RECIPIENT, IN_RECORD, PART_OF

Neo4j stores only flat values and lists of them, so a nested value is kept as a JSON string under `<name>__json`.
A missing value is simply not stored, never stored as zero.
"""
from __future__ import annotations

import json
import math
from collections import defaultdict
from dataclasses import dataclass, field

from pydantic import BaseModel

from .models import CompanyTie, ControlTie, Dataset, Financial, Tie

LABELS = ("Meta", "Category", "Actor", "Source", "Financial", "Figure", "FieldCategory", "FieldEntry",
          "GrantRecord", "Flow", "Grant", "Person", "ControlRow")
DATA_RELS = ("TIE", "COMPANY_MONEY", "CONTROL_TIE")
MEASURES = ("people", "money", "worth")
CONTROL_TABLES = ("decision_rights", "funding_shares", "in_kind_and_contracts", "people", "rules_and_positions")
JSON_SUFFIX = "__json"


@dataclass(frozen=True)
class Node:
    label: str
    key: str
    props: dict


@dataclass(frozen=True)
class Rel:
    type: str
    start: tuple[str, str]  # (label, key)
    end: tuple[str, str]
    key: str
    props: dict = field(default_factory=dict)


@dataclass
class Graph:
    nodes: list[Node]
    rels: list[Rel]


# ---------- dataset to graph ----------

def to_graph(ds: Dataset) -> Graph:
    nodes: list[Node] = []
    rels: list[Rel] = []
    eco, size, fld, ctl = ds.ecosystem, ds.size, ds.field, ds.control

    label_of = {n.id: "Actor" for n in eco.nodes}
    label_of |= {e.id: "FieldEntry" for e in fld.entries}
    label_of |= {p.id: "Person" for p in ctl.graph.people}

    def end(key: str) -> tuple[str, str]:
        return (label_of[key], key)

    def link(type_: str, start: tuple[str, str], stop: tuple[str, str]) -> None:
        rels.append(Rel(type_, start, stop, f"{start[1]}->{stop[1]}"))

    nodes += [
        Node("Meta", "ecosystem", props({"asOf": eco.as_of, "version": eco.version})),
        Node("Meta", "size", props({"retrieved": size.retrieved, "fx": size.fx, "time100": size.time100.to_json()})),
        Node("Meta", "field", props({"source": fld.source.to_json()})),
        Node("Meta", "control", props({"cutoff": ctl.cutoff, "retrieved": ctl.retrieved, "status": ctl.status})),
    ]

    nodes += [Node("Category", k, props({"label": v}, i)) for i, (k, v) in enumerate(eco.categories.items())]
    nodes += [Node("Source", k, props(s.to_json(), i)) for i, (k, s) in enumerate(eco.sources.items())]
    for i, a in enumerate(eco.nodes):
        nodes.append(Node("Actor", a.id, props(a.to_json(), i)))
        link("IN_CATEGORY", ("Actor", a.id), ("Category", str(a.cat)))
        for s in a.sources:
            link("CITES", ("Actor", a.id), ("Source", s))
    for i, t in enumerate(eco.edges):
        rels.append(Rel("TIE", end(t.from_), end(t.to), t.id, props(_without_ends(t), i)))
    for i, f in enumerate(eco.financials):
        nodes.append(Node("Financial", f.id, props(f.to_json(), i)))
        if f.actor:
            link("ABOUT", ("Financial", f.id), ("Actor", f.actor))
        for s in f.sources:
            link("CITES", ("Financial", f.id), ("Source", s))

    for measure in MEASURES:
        for i, (actor, fig) in enumerate(getattr(size, measure).items()):
            key = f"{measure}:{actor}"
            nodes.append(Node("Figure", key, props({"measure": measure, "actor": actor, **fig.to_json()}, i)))
            link("SIZES", ("Figure", key), ("Actor", actor))
            if fig.fin:
                link("USES_FINANCIAL", ("Figure", key), ("Financial", fig.fin))

    nodes += [Node("FieldCategory", c.id, props(c.to_json(), i)) for i, c in enumerate(fld.cats)]
    for i, e in enumerate(fld.entries):
        nodes.append(Node("FieldEntry", e.id, props(e.to_json(), i)))
        for c in e.cats:
            link("IN_FIELD_CATEGORY", ("FieldEntry", e.id), ("FieldCategory", c))
        if e.node:
            link("SAME_AS", ("FieldEntry", e.id), ("Actor", e.node))
    nodes += [Node("GrantRecord", k, props(r.to_json(), i)) for i, (k, r) in enumerate(fld.records.items())]
    for i, f in enumerate(fld.flows):
        row = f.to_json()
        grants = row.pop("grants")
        nodes.append(Node("Flow", f.key, props(row, i)))
        link("FUNDER", ("Flow", f.key), end(f.from_))
        link("RECIPIENT", ("Flow", f.key), end(f.to))
        link("IN_RECORD", ("Flow", f.key), ("GrantRecord", f.src))
        for gi, g in enumerate(grants):
            key = f"{f.key}:{gi}"
            grant = {"flow": f.key, "date": g[0], "amount": g[1], "purpose": g[2]}
            if len(g) > 3:
                grant["pledged"] = g[3]
            nodes.append(Node("Grant", key, props(grant, gi)))
            link("PART_OF", ("Grant", key), ("Flow", f.key))
    for i, c in enumerate(fld.company):
        rels.append(Rel("COMPANY_MONEY", end(c.from_), end(c.to), f"company:{i}", props(_without_ends(c), i)))

    nodes += [Node("Person", p.id, props(p.to_json(), i)) for i, p in enumerate(ctl.graph.people)]
    for i, t in enumerate(ctl.graph.edges):
        rels.append(Rel("CONTROL_TIE", end(t.from_), end(t.to), f"control:{i}", props(_without_ends(t), i)))
    for table in CONTROL_TABLES:
        for i, r in enumerate(getattr(ctl.tables, table)):
            nodes.append(Node("ControlRow", f"{table}:{i}", props({"table": table, **r.to_json()}, i)))

    return Graph(nodes, rels)


def props(values: dict, idx: int | None = None) -> dict:
    """Flatten one record into values Neo4j can store."""
    out = {}
    for k, v in values.items():
        if v is None:
            continue
        if _storable(v):
            out[k] = v
        else:
            out[k + JSON_SUFFIX] = json.dumps(v, ensure_ascii=False)
    if idx is not None:
        out["idx"] = idx
    return out


def _storable(v) -> bool:
    flat = (str, bool, int, float)
    if isinstance(v, flat):
        return True
    if isinstance(v, list):
        kinds = {type(x) for x in v}
        return len(kinds) <= 1 and all(isinstance(x, flat) for x in v)
    return False


def _without_ends(record: BaseModel) -> dict:
    row = record.to_json()
    del row["from"], row["to"]
    return row


# ---------- graph to dataset ----------

def from_graph(g: Graph) -> Dataset:
    by_label: dict[str, list[Node]] = defaultdict(list)
    for n in g.nodes:
        by_label[n.label].append(n)
    for ns in by_label.values():
        ns.sort(key=_order)
    by_type: dict[str, list[Rel]] = defaultdict(list)
    for r in g.rels:
        if r.type in DATA_RELS:
            by_type[r.type].append(r)
    for rs in by_type.values():
        rs.sort(key=_order)

    meta = {n.key: unflatten(n.props) for n in by_label["Meta"]}
    rows = lambda label: [unflatten(n.props) for n in by_label[label]]  # noqa: E731
    keyed = lambda label: {n.key: unflatten(n.props) for n in by_label[label]}  # noqa: E731

    def joined(type_: str, model: type[BaseModel]) -> list[dict]:
        return [_restore(model, {"from": r.start[1], "to": r.end[1], **unflatten(r.props)}) for r in by_type[type_]]

    size = {**meta["size"], **{m: {} for m in MEASURES}}
    for fig in rows("Figure"):
        size[fig.pop("measure")][fig.pop("actor")] = fig

    grants: dict[str, list[list]] = defaultdict(list)
    for gr in rows("Grant"):
        row = [gr["date"], gr["amount"], gr["purpose"]]
        if "pledged" in gr:
            row.append(gr["pledged"])
        grants[gr["flow"]].append(row)
    flows = [{**f, "grants": grants[f"{f['src']}:{f['from']}:{f['to']}"]} for f in rows("Flow")]

    tables: dict[str, list[dict]] = {t: [] for t in CONTROL_TABLES}
    for r in rows("ControlRow"):
        tables[r.pop("table")].append(r)

    return Dataset.model_validate({
        "ecosystem": {
            **meta["ecosystem"],
            "categories": {k: v["label"] for k, v in keyed("Category").items()},
            "nodes": rows("Actor"),
            "edges": joined("TIE", Tie),
            "financials": [_restore(Financial, f) for f in rows("Financial")],
            "sources": keyed("Source"),
        },
        "size": size,
        "field": {
            **meta["field"],
            "cats": rows("FieldCategory"),
            "entries": rows("FieldEntry"),
            "records": keyed("GrantRecord"),
            "flows": flows,
            "company": joined("COMPANY_MONEY", CompanyTie),
        },
        "control": {
            **meta["control"],
            "tables": tables,
            "graph": {"people": rows("Person"), "edges": joined("CONTROL_TIE", ControlTie)},
        },
    })


def unflatten(stored: dict) -> dict:
    out = {}
    for k, v in stored.items():
        if k in ("key", "idx"):
            continue
        if k.endswith(JSON_SUFFIX):
            out[k.removesuffix(JSON_SUFFIX)] = json.loads(v)
        else:
            out[k] = v
    return out


def _restore(model: type[BaseModel], row: dict) -> dict:
    """Put back the fields that are always present but were empty, since an empty value is not stored."""
    for name, f in model.model_fields.items():
        alias = f.alias or name
        if f.is_required() and alias not in row:
            row[alias] = None
    return row


def _order(item: Node | Rel) -> tuple:
    idx = item.props.get("idx")
    return (math.inf if idx is None else idx, item.key)
