# AI_safety_overview

## Data

The dataset lives in `data/` as four JSON files: `ecosystem.json` (the stakeholder dataset, version 1.0), `size.json` (what a bubble's size can stand for), `field.json` (the AI safety field and its grant records) and `control.json` (who decides). `overview/models.py` describes every record and refuses data that breaks the site's rules: an unknown amount is empty, never zero; a total adds up one record only; every figure has a source; every reference resolves.

The pages keep the original look. Python serves them and builds the data files the map already loads.

    uv sync --extra neo4j
    uv run uvicorn overview.app:app --reload --port 8765

Then open http://localhost:8765/. The map still reads `ecosystem-data.js` and the other data scripts; the app writes those from `data/` (or from Neo4j when `NEO4J_URI` is set). On the ecosystem page, "Each grant record, on its own" draws one bar block per funder record, using the page's existing bars, and never puts two records on the same scale.

    uv run pytest

`field.json` is written by `../evidence/field/build.py`. The data tests fail if `data/` and the old `*-data.js` files disagree.

## Neo4j

The same dataset can live in Neo4j. `overview/graph.py` sets out the layout: actors, sources, figures, field entries, grant records, flows and single grants as nodes; ties, company money and control ties as relationships. Copy `.env.example` to `.env`, fill in the connection, then:

    uv run --env-file .env python -m overview.load_neo4j --replace

This loads the files, reads them back and checks that nothing changed. With `NEO4J_URI` set, `overview.repository.get_repository()` reads from Neo4j instead of `data/`.

To test against a database the test may overwrite: `NEO4J_TEST_URI=bolt://... NEO4J_PASSWORD=... uv run pytest -m neo4j`.
