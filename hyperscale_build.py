"""Build hyperscale-data.js from the standalone atlas in ../Hyperscale_Atlas/index.html.

Reads the project records (P), the contract documents (C), the three HTML tables (contracts, Epoch campuses,
capital by country) and the Natural Earth basemap, which the atlas drew in plate carree (x = (180 + lon) * 3,
y = (85 - lat) * 3). The basemap is reprojected to Equal Earth here; hyperscale.html projects the points with the
same formula and the same constants.

    python3 hyperscale_build.py
"""
import html, json, math, re, shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "Hyperscale_Atlas" / "index.html"
s = SRC.read_text()

# ---------- records ----------
dec = json.JSONDecoder()
P, end = dec.raw_decode(s, s.find("const P=") + 8)
C, _ = dec.raw_decode(s, s.index("C=", end) + 2)

# ---------- tables ----------
def section(start_marker, end_marker):
    a = s.index(start_marker)
    return s[a:s.index(end_marker, a)]

def rows(chunk):
    body = chunk[chunk.index("<tbody"):]
    out = []
    for tr in re.findall(r"<tr>(.*?)</tr>", body, re.S):
        cells = []
        for td in re.findall(r"<td>(.*?)</td>", tr, re.S):
            m = re.search(r'href="([^"]+)"', td)
            text = html.unescape(re.sub(r"<[^>]+>", "", td)).strip()
            cells.append([text, html.unescape(m.group(1))] if m else text)
        out.append(cells)
    return out

deals = rows(section("<h2 id=deals>", "</tbody>"))
campuses = rows(section("<h2 id=chips>", "</tbody>"))
capital = rows(section("<h2 id=capital>", "</tbody>"))

# ---------- Equal Earth ----------
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
M = math.sqrt(3) / 2
S = 180.0  # scale; must match hyperscale.html

def ee(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    th = math.asin(M * math.sin(phi))
    t2 = th * th; t6 = t2 ** 3
    x = lam * math.cos(th) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))
    y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    return x * S, -y * S

X0 = ee(-180, 0)[0]
W = 2 * -X0
Y_TOP, Y_BOT = ee(0, 84)[1], ee(0, -58)[1]

def proj(lon, lat):
    x, y = ee(lon, lat)
    return x - X0, y - Y_TOP

m = re.search(r"<svg id=mapview[^>]*>(.*?)</svg>", s, re.S)
land_d = " ".join(re.findall(r'<path d="([^"]+)"', m.group(1)))
rings = []
for sub in re.findall(r"M[^MZ]+Z?", land_d):
    pts = [tuple(map(float, p.split(","))) for p in re.findall(r"-?[\d.]+,-?[\d.]+", sub)]
    ll = [(x / 3 - 180, 85 - y / 3) for x, y in pts]
    out = []
    for i, (lo, la) in enumerate(ll):
        if i:
            plo, pla = ll[i - 1]
            n = int(max(abs(lo - plo), abs(la - pla)) / 1.5)
            for k in range(1, n + 1):
                out.append(proj(plo + (lo - plo) * k / (n + 1), pla + (la - pla) * k / (n + 1)))
        out.append(proj(lo, la))
    keep = [out[0]]
    for p in out[1:]:
        if abs(p[0] - keep[-1][0]) + abs(p[1] - keep[-1][1]) > 0.35:
            keep.append(p)
    if len(keep) > 2:
        rings.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in keep) + "Z")
land = "".join(rings)

def line(points):
    return "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in points)

grat = []
for lon in range(-180, 181, 30):
    grat.append(line([proj(lon, la) for la in range(-58, 85, 2)]))
for lat in range(-30, 85, 30):
    grat.append(line([proj(lo, lat) for lo in range(-180, 181, 3)]))
sphere = line([proj(-180, la) for la in range(-90, 91, 2)] + [proj(180, la) for la in range(90, -91, -2)]) + "Z"

data = {
    "map": {"w": round(W, 1), "h": round(Y_BOT - Y_TOP, 1), "x0": X0, "y0": Y_TOP, "s": S,
            "land": land, "grat": "".join(grat), "sphere": sphere},
    "P": P, "C": C, "deals": deals, "campuses": campuses, "capital": capital,
}
(HERE / "hyperscale-data.js").write_text(
    "/* Built by hyperscale_build.py from the Hyperscale_Atlas snapshot. Data: Data Center Atlas (Kian Kyars) and Epoch AI, CC BY 4.0. */\n"
    "window.HS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")

pdf = HERE.parent / "Hyperscale_Atlas" / "reports" / "NVIDIA_Financial_Due_Diligence.pdf"
(HERE / "hyperscale").mkdir(exist_ok=True)
shutil.copy2(pdf, HERE / "hyperscale" / pdf.name)
print(f"{len(P)} records, {len(C)} documents, {len(deals)} contracts, {len(campuses)} campuses, {len(capital)} countries; "
      f"land {len(land)//1024} KB; map {W:.0f} x {Y_BOT - Y_TOP:.0f}")
