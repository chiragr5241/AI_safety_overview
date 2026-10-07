"""Figures for the ecosystem page, drawn with the page's own bar markup so they inherit its type and colour."""
from __future__ import annotations

from html import escape

from .models import Dataset

TOP_N = 8


def usd(amount: int | float) -> str:
    n = float(amount)
    if n >= 1_000_000_000:
        return f"USD {n / 1_000_000_000:.2g}bn"
    if n >= 1_000_000:
        return f"USD {n / 1_000_000:.3g}m"
    if n >= 1_000:
        return f"USD {n / 1_000:.3g}k"
    return f"USD {n:.3g}"


def grant_records_html(ds: Dataset) -> str:
    """One block per grant record. Totals from different records are never drawn on the same scale."""
    names = {n.id: n.name for n in ds.ecosystem.nodes}
    names.update({e.id: e.name for e in ds.field.entries})
    parts = [
        '<p class="small" style="max-width:var(--measure)">Each block is one funder\'s published record. '
        "A bar is that record's total for one recipient, which adds up only the rows in that record. "
        "The five blocks are not on one scale, and they are not added together: the records count different things, "
        "and one funder's grant can be passed on by another.</p>"
    ]
    for key, record in ds.field.records.items():
        flows = sorted((f for f in ds.field.flows if f.src == key), key=lambda f: f.total, reverse=True)
        shown, rest = flows[:TOP_N], flows[TOP_N:]
        rest_total = sum(f.total for f in rest)
        scale = max((f.total for f in shown), default=1)
        rows = []
        for f in shown:
            width = max(f.total / scale * 100, 0.4)
            label = names.get(f.to, f.to)
            rows.append(
                '<div class="bar-row">'
                f'<span class="bar-label">{escape(label)}</span>'
                f'<div class="bar-track"><div class="bar-fill" style="width:{width:.1f}%"></div></div>'
                f'<span class="bar-val">{escape(usd(f.total))}</span>'
                "</div>"
            )
        if rest:
            rows.append(
                '<div class="bar-row">'
                f'<span class="bar-label">{len(rest)} other recipients in this record</span>'
                "<div class=\"bar-track\"></div>"
                f'<span class="bar-val">{escape(usd(rest_total))}</span>'
                "</div>"
            )
        parts.append(
            '<div class="qblock">'
            f"<h3>{escape(record.title)}</h3>"
            f'<p class="small"><a href="{escape(record.url)}" rel="noopener">{escape(record.kind)}</a>. '
            f"{escape(record.note)} "
            f"This record lists {record.rows:,} rows; {record.matched:,} of them reach an organisation on the map, "
            f"totalling {escape(usd(record.matched_total))}.</p>"
            f'<div class="bars">{"".join(rows)}</div>'
            "</div>"
        )
    return "\n".join(parts)
