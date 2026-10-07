import json
import shutil
import subprocess
from pathlib import Path

import pytest
from pydantic import ValidationError

from overview.models import Dataset
from overview.repository import DATA_FILES

ROOT = Path(__file__).resolve().parent.parent
LEGACY = {"ecosystem": ("ecosystem-data.js", "ECOSYSTEM"), "size": ("size-data.js", "ECO_SIZE"),
          "field": ("field-data.js", "FIELD"), "control": ("control-data.js", "CONTROL")}


def test_counts_match_what_the_pages_state(ds):
    eco, fld = ds.ecosystem, ds.field
    assert (len(eco.nodes), len(eco.edges), len(eco.financials), len(eco.sources)) == (100, 116, 48, 114)
    assert len(eco.categories) == 11
    assert sum(1 for e in fld.entries if not e.own) == 373
    assert sum(1 for e in fld.entries if e.own) == 8
    assert sum(1 for e in fld.entries if e.node) == 32
    assert (len(fld.flows), len(fld.company), len(fld.records)) == (239, 22, 5)
    assert (len(ds.control.graph.people), len(ds.control.graph.edges)) == (11, 46)


def test_loading_keeps_every_value_as_written(ds, raw):
    for part in DATA_FILES:
        assert getattr(ds, part).to_json() == raw[part], part


@pytest.mark.skipif(not shutil.which("node"), reason="needs node to read the browser data files")
def test_json_matches_the_browser_data_files(raw):
    for part, (file, name) in LEGACY.items():
        if not (ROOT / file).exists():
            pytest.skip(f"{file} has been retired")
        script = (f"const w={{}};require('vm').runInNewContext(require('fs').readFileSync({json.dumps(file)},'utf8'),{{window:w}});"
                  f"process.stdout.write(JSON.stringify(w.{name}))")
        out = subprocess.run(["node", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True).stdout
        assert json.loads(out) == raw[part], f"data/{DATA_FILES[part]} and {file} differ; rerun scripts/legacy_js_to_json.mjs"


# ---------- the rules the site makes to its readers ----------

def rejects(raw: dict, match: str) -> None:
    with pytest.raises(ValidationError, match=match):
        Dataset.model_validate(raw)


def test_unknown_amount_is_never_zero(raw):
    raw["ecosystem"]["edges"][0]["amount"] = 0
    rejects(raw, "greater than 0")


def test_zero_allowed_only_where_the_source_states_it(raw):
    zero = next(f for f in raw["ecosystem"]["financials"] if f["amount"] == 0)
    zero["caveat"] = "Dataset-specific."
    rejects(raw, "source states zero")


def test_flow_total_covers_its_own_rows_only(raw):
    raw["field"]["flows"][0]["total"] += 1
    rejects(raw, "total is not the sum of its own rows")


def test_matching_pledges_stay_out_of_the_total(raw):
    flow = next(f for f in raw["field"]["flows"] if f["cond"])
    flow["total"] += flow["cond"]
    rejects(raw, "total is not the sum of its own rows")


def test_one_flow_per_funder_record_and_recipient(raw):
    raw["field"]["flows"].append(raw["field"]["flows"][0])
    rejects(raw, "more than one flow")


def test_every_size_figure_says_where_it_comes_from(raw):
    figure = next(iter(raw["size"]["people"].values()))
    del figure["url"]
    rejects(raw, "needs its source")


def test_a_figure_needs_a_value(raw):
    raw["size"]["money"]["nvidia"] = {"kind": "Revenue"}
    rejects(raw, "needs a value")


@pytest.mark.parametrize("change, match", [
    (lambda r: r["ecosystem"]["edges"][0].update(to="nobody"), "unknown end"),
    (lambda r: r["ecosystem"]["nodes"][0]["sources"].append("nowhere"), "unknown source"),
    (lambda r: r["size"]["people"].update(nobody=r["size"]["people"]["nvidia"]), "unknown actor"),
    (lambda r: r["field"]["flows"][0].update(src="elsewhere"), "unknown record"),
    (lambda r: r["field"]["company"][0].update(to="nobody"), "unknown end"),
    (lambda r: r["control"]["graph"]["edges"][0].update(to="nobody"), "unknown end"),
])
def test_every_reference_resolves(raw, change, match):
    change(raw)
    rejects(raw, match)


def test_unexpected_fields_are_refused(raw):
    raw["ecosystem"]["nodes"][0]["rank"] = 1
    rejects(raw, "Extra inputs are not permitted")
