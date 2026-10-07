"""Typed records for every dataset the site shows.

Field names in Python are snake_case; the JSON keeps the names the browser code already uses.
The rules the site makes to its readers are enforced here, so that data breaking them cannot load:
- an unknown amount is empty, never zero (a zero is allowed only where the source itself states it);
- a total only ever adds up the rows of one funder's record for one recipient;
- every size figure says where it comes from;
- every reference points at something that exists.
"""
from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

# Amounts are kept as stated, so a whole number stays an int and a stated fraction stays a float.
Amount = Annotated[int | float, Field(gt=0)]


class Record(BaseModel):
    """A record whose JSON keys are camelCase."""

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True, alias_generator=to_camel)

    def to_json(self) -> dict:
        return self.model_dump(mode="json", by_alias=True, exclude_unset=True)


class SnakeRecord(Record):
    """A record whose JSON keys are already snake_case, as delivered in the control evidence."""

    model_config = ConfigDict(alias_generator=None)


class Link(Record):
    title: str
    url: str


# ---------- ecosystem: the stakeholder dataset, version 1.0 ----------

class Source(Record):
    title: str
    url: str
    date: str
    type: str
    access: str
    older: str


class Actor(Record):
    id: str
    name: str
    cat: int
    subtype: str
    country: str
    org_type: str
    detail: str
    mission: str
    stake: str
    governance: str
    external: str
    integration: str
    funding_dependence: str
    regulatory_role: str
    self_regulation: str
    personnel_overlap: str
    figures: str
    confidence: str
    confidence_reason: str
    older_evidence: bool
    sources: list[str]


class Tie(Record):
    id: str
    from_: str = Field(alias="from")
    to: str
    type: str
    amount: Amount | None
    currency: str
    date: str
    date_basis: str
    status: str
    note: str
    confidence: str
    confidence_reason: str
    personnel_overlap: bool
    policy_target: str
    older_evidence: bool
    sources: list[str]


class Financial(Record):
    id: str
    actor: str  # empty when the organisation is not profiled on the map
    metric: str
    amount: Annotated[int | float, Field(ge=0)] | None
    currency: str
    period: str
    basis: str
    scope: str
    confidence: str
    confidence_reason: str
    caveat: str
    sources: list[str]

    @model_validator(mode="after")
    def zero_only_when_stated(self) -> Financial:
        if self.amount == 0 and "zero" not in self.caveat.lower():
            raise ValueError(f"{self.id}: a zero amount must say in its caveat that the source states zero")
        return self


class Ecosystem(Record):
    as_of: str
    version: str
    categories: dict[str, str]
    nodes: list[Actor]
    edges: list[Tie]
    financials: list[Financial]
    sources: dict[str, Source]

    @model_validator(mode="after")
    def references_resolve(self) -> Ecosystem:
        actors = {n.id for n in self.nodes}
        problems = [f"actor {n.id}: unknown category {n.cat}" for n in self.nodes if str(n.cat) not in self.categories]
        problems += [f"tie {e.id}: unknown end" for e in self.edges if e.from_ not in actors or e.to not in actors]
        problems += [f"financial {f.id}: unknown actor {f.actor}" for f in self.financials if f.actor and f.actor not in actors]
        cited = [(r.id, s) for r in (*self.nodes, *self.edges, *self.financials) for s in r.sources]
        problems += [f"{rid}: unknown source {s}" for rid, s in cited if s not in self.sources]
        _raise_if(problems)
        return self


# ---------- size: what a bubble's size can stand for ----------

class SizeFigure(Record):
    v: Amount | None = None
    text: str | None = None
    kind: str | None = None
    cur: str | None = None
    when: str | None = None
    basis: str | None = None
    url: str | None = None
    est: bool | None = None
    note: str | None = None
    fin: str | None = None  # points at a financial observation instead of repeating it
    times: int | None = None

    @model_validator(mode="after")
    def says_where_it_comes_from(self) -> SizeFigure:
        if self.v is None and self.fin is None:
            raise ValueError("a figure needs a value or a financial observation to point at")
        if self.v is not None and not (self.url and self.basis and self.when):
            raise ValueError("a figure with a value needs its source, basis and date")
        return self


class Time100(Record):
    title: str
    publisher: str
    date: str
    url: str
    people: int
    matches: dict[str, list[str]]
    group_actors: list[str]


class Size(Record):
    retrieved: str
    fx: dict[str, float]
    people: dict[str, SizeFigure]
    money: dict[str, SizeFigure]
    worth: dict[str, SizeFigure]
    time100: Time100


# ---------- field: the AI safety field and its money ----------

class FieldSource(Record):
    name: str
    url: str
    licence: str
    retrieved: str
    note: str


class FieldCategory(Record):
    id: str
    label: str


class StatedAmount(Record):
    v: Amount
    text: str


class FieldEntry(Record):
    id: str
    rec: str | None = None  # the AISafety.com record id; absent for programmes this map added
    name: str
    short: str
    url: str
    desc: str
    cats: list[str]
    scale: Literal["S", "M", "L"]
    added: str | None = None
    modified: str | None = None
    node: str | None = None  # the industry-map actor this entry is the same organisation as
    gone: bool | None = None
    own: bool | None = None
    src: Link | None = None
    stated: StatedAmount | None = None


class GrantRecord(Record):
    funder: str
    title: str
    url: str
    kind: str
    note: str
    rows: int
    listed: int
    matched: int
    matched_total: int


# A row is (date, amount, purpose) or, for a matching pledge, (date, amount, purpose, pledged).
GrantRow = tuple[str, int, str] | tuple[str, int, str, int]


class Flow(Record):
    """One funder's record for one recipient."""

    from_: str = Field(alias="from")
    to: str
    src: str  # the record this flow comes from
    n: int
    total: int
    cond: int  # matching pledges, kept out of total
    first: str
    last: str
    grants: list[GrantRow]

    @model_validator(mode="after")
    def total_is_this_record_only(self) -> Flow:
        if self.n != len(self.grants):
            raise ValueError(f"flow {self.key}: n is {self.n} but {len(self.grants)} rows are listed")
        if self.total != sum(g[1] for g in self.grants):
            raise ValueError(f"flow {self.key}: total is not the sum of its own rows")
        if self.cond != sum(g[3] for g in self.grants if len(g) > 3):
            raise ValueError(f"flow {self.key}: cond is not the sum of its matching pledges")
        return self

    @property
    def key(self) -> str:
        return f"{self.src}:{self.from_}:{self.to}"


class CompanyTie(Record):
    from_: str = Field(alias="from")
    to: str
    kind: Literal["grant", "commitment", "credits", "equity", "pool", "open"]
    amount: Amount | None
    currency: str
    date: str
    what: str
    src: Link


class SafetyField(Record):
    source: FieldSource
    cats: list[FieldCategory]
    entries: list[FieldEntry]
    records: dict[str, GrantRecord]
    flows: list[Flow]
    company: list[CompanyTie]

    @model_validator(mode="after")
    def references_resolve(self) -> SafetyField:
        cats = {c.id for c in self.cats}
        problems = [f"entry {e.id}: unknown category {c}" for e in self.entries for c in e.cats if c not in cats]
        problems += [f"flow {f.key}: unknown record" for f in self.flows if f.src not in self.records]
        keys = [f.key for f in self.flows]
        if len(keys) != len(set(keys)):
            problems.append("a funder has more than one flow to the same recipient in the same record")
        _raise_if(problems)
        return self


# ---------- control: who decides ----------

class DecisionRight(SnakeRecord):
    decision: str
    body_holding_right: str
    formal_power: str
    who_appoints_body: str
    ever_exercised: str
    source_url: str
    date: str
    confidence: str


class FundingShare(SnakeRecord):
    recipient: str
    source: str
    year: str
    amount: str  # as delivered, often a range or a phrase
    currency: str
    status: str
    share_of_recipient_budget: str
    source_url: str
    confidence: str


class InKind(SnakeRecord):
    provider: str
    recipient: str
    what: str
    terms: str
    restrictions_on_publication: str
    source_url: str
    date: str
    confidence: str


class PersonRole(SnakeRecord):
    person: str
    organisation: str
    role: str
    start: str
    end: str
    type: str
    disclosed_financial_interest: str
    source_url: str
    confidence: str


class RulePosition(SnakeRecord):
    rule: str
    binding: str
    enforcer: str
    effective_date: str
    actor: str
    position: str
    spend_if_filed: str
    source_url: str
    confidence: str


class ControlTables(SnakeRecord):
    decision_rights: list[DecisionRight]
    funding_shares: list[FundingShare]
    in_kind_and_contracts: list[InKind]
    people: list[PersonRole]
    rules_and_positions: list[RulePosition]


class Person(Record):
    id: str
    name: str


class ControlTie(Record):
    from_: str = Field(alias="from")
    to: str
    type: str
    note: str
    date: str
    amount: Amount | None
    currency: str
    confidence: str
    url: str
    ext: bool


class ControlGraph(Record):
    people: list[Person]
    edges: list[ControlTie]


class Control(Record):
    cutoff: str
    retrieved: str
    status: str
    tables: ControlTables
    graph: ControlGraph


# ---------- everything together ----------

class Dataset(Record):
    ecosystem: Ecosystem
    size: Size
    field: SafetyField
    control: Control

    @model_validator(mode="after")
    def references_resolve(self) -> Dataset:
        actors = {n.id for n in self.ecosystem.nodes}
        entries = {e.id for e in self.field.entries}
        people = {p.id for p in self.control.graph.people}
        financials = {f.id for f in self.ecosystem.financials}
        overlap = (actors & entries) | (actors & people) | (entries & people)
        problems = [f"id used by more than one kind of thing: {sorted(overlap)}"] if overlap else []
        for measure in ("people", "money", "worth"):
            figures = getattr(self.size, measure)
            problems += [f"size {measure}: unknown actor {a}" for a in figures if a not in actors]
            problems += [f"size {measure} {a}: unknown financial {f.fin}" for a, f in figures.items()
                         if f.fin and f.fin not in financials]
        problems += [f"time100: unknown actor {a}" for a in self.size.time100.matches if a not in actors]
        problems += [f"entry {e.id}: unknown actor {e.node}" for e in self.field.entries if e.node and e.node not in actors]
        orgs = actors | entries
        money = [*self.field.flows, *self.field.company]
        problems += [f"field money {m.from_} -> {m.to}: unknown end" for m in money if m.from_ not in orgs or m.to not in orgs]
        problems += [f"record {r}: unknown funder {g.funder}" for r, g in self.field.records.items() if g.funder not in orgs]
        problems += [f"control tie {e.from_} -> {e.to}: unknown end" for e in self.control.graph.edges
                     if e.from_ not in actors | people or e.to not in actors | people]
        _raise_if(problems)
        return self


def _raise_if(problems: list[str]) -> None:
    if problems:
        shown = "\n  ".join(problems[:20])
        more = f"\n  ... and {len(problems) - 20} more" if len(problems) > 20 else ""
        raise ValueError(f"{len(problems)} broken references:\n  {shown}{more}")
