import os
from collections import Counter

import pytest

from overview.graph import LABELS, from_graph, to_graph


def test_graph_holds_the_whole_dataset(ds):
    assert from_graph(to_graph(ds)).to_json() == ds.to_json()


def test_every_value_is_one_neo4j_can_store(ds):
    flat = (str, bool, int, float)
    for item in [*to_graph(ds).nodes, *to_graph(ds).rels]:
        for k, v in item.props.items():
            assert v is not None, (item.key, k)
            assert isinstance(v, flat) or (isinstance(v, list) and all(isinstance(x, flat) for x in v)), (item.key, k)


def test_keys_are_unique_and_every_relationship_has_both_ends(ds):
    g = to_graph(ds)
    assert {n.label for n in g.nodes} == set(LABELS)
    counts = Counter((n.label, n.key) for n in g.nodes)
    assert [k for k, c in counts.items() if c > 1] == []
    for r in g.rels:
        assert r.start in counts and r.end in counts, (r.type, r.start, r.end)
    rel_keys = Counter((r.type, r.start, r.end, r.key) for r in g.rels)
    assert [k for k, c in rel_keys.items() if c > 1] == []


def test_order_survives_shuffling(ds):
    g = to_graph(ds)
    g.nodes.reverse()
    g.rels.reverse()
    assert from_graph(g).to_json() == ds.to_json()


@pytest.mark.neo4j
@pytest.mark.skipif(not os.environ.get("NEO4J_TEST_URI"), reason="set NEO4J_TEST_URI to a database this test may overwrite")
def test_neo4j_round_trip(ds, monkeypatch):
    from overview.neo4j_store import Neo4jRepository

    monkeypatch.setenv("NEO4J_URI", os.environ["NEO4J_TEST_URI"])
    db = Neo4jRepository.from_env()
    try:
        db.write(ds, replace=True)
        assert db.load().to_json() == ds.to_json()
        db.write(ds)
        assert db.load().to_json() == ds.to_json()
    finally:
        db.close()
