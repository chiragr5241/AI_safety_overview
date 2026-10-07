import json

from fastapi.testclient import TestClient

from overview.app import app
from overview.charts import grant_records_html, usd
from overview.models import Dataset

client = TestClient(app)


def test_pages_are_the_existing_ones():
    home = client.get("/")
    assert home.status_code == 200
    assert b"AI safety, for" in home.content
    eco = client.get("/ecosystem.html")
    assert eco.status_code == 200
    assert b"Who has a" in eco.content
    assert b"grant-records" in eco.content


def test_data_scripts_match_the_typed_dataset(raw):
    for name, (global_name, part) in {
        "ecosystem-data.js": ("ECOSYSTEM", "ecosystem"),
        "size-data.js": ("ECO_SIZE", "size"),
        "field-data.js": ("FIELD", "field"),
        "control-data.js": ("CONTROL", "control"),
    }.items():
        js = client.get(f"/{name}")
        assert js.status_code == 200
        prefix = f"window.{global_name} = "
        assert js.text.startswith(prefix)
        assert json.loads(js.text[len(prefix):].rstrip(";\n")) == raw[part]


def test_grant_chart_keeps_records_apart(ds: Dataset):
    html = grant_records_html(ds)
    assert html.count("qblock") == 5
    assert "not added together" in html
    assert usd(ds.field.records["cg"].matched_total) in html
    page = client.get("/charts/grants")
    assert page.status_code == 200
    assert "Coefficient Giving" in page.text
