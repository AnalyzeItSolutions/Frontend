"""Run every formula, query and script published on /metrics and /methods against the sample data and check it returns the
figure printed on the page. Nothing ships if this fails.

    pip install pandas duckdb formulas openpyxl
    node scripts/seo/export_snippets.mjs /tmp/pseo && python -I scripts/seo/verify_snippets.py /tmp/pseo

SQL runs on SQLite and DuckDB, pandas code is executed as written, and Excel formulas are evaluated by the `formulas` engine
in a workbook laid out exactly like the downloadable CSV (headers in row 1, data from row 2).
"""
import contextlib
import io
import json
import math
import sqlite3
import sys
from pathlib import Path

import duckdb
import formulas
import openpyxl
import pandas as pd

out = Path(sys.argv[1])
items = json.loads((out / "snippets.json").read_text())
frames = {name: pd.read_csv(out / f"{name}.csv") for name in ("monthly", "daily")}
failures: list[str] = []


def close(a, b, tol, relative=False):
    if a is None or b is None:
        return a is None and b is None
    a, b = float(a), float(b)
    if math.isnan(a) or math.isnan(b):
        return math.isnan(a) and math.isnan(b)
    # Below 1 the tolerance is absolute, except for p-values, where 0.0001 and 0.0002 are different answers.
    return abs(a - b) <= tol * (abs(b) if relative else max(1.0, abs(b)))


RELATIVE = {it["id"] for it in items if it.get("relative")}


def check(label, got, want, tol):
    if not close(got, want, tol, label.split(" ")[0] in RELATIVE):
        failures.append(f"{label}: got {got!r}, page says {want!r}")


# ---------- SQL ----------
lite = sqlite3.connect(":memory:")
duck = duckdb.connect()
for name, df in frames.items():
    df.to_sql(name, lite, index=False)
    duck.register(name, df)


def run_sql(con, q):
    cur = con.execute(q)
    return cur.fetchall()


for it in items:
    s = it.get("sql")
    if not s:
        continue
    tol = it.get("tolerance", 0.006)
    for engine, con in (("sqlite", lite), ("duckdb", duck)):
        if engine not in s.get("engines", ["sqlite", "duckdb"]):
            continue
        try:
            rows = run_sql(con, s["overall"])
            check(f"{it['id']} sql/{engine} overall", rows[0][-1], round(it["expected"], 2) if "tolerance" not in it else it["expected"], tol)
            if s.get("perMonth"):
                rows = run_sql(con, s["perMonth"])
                got = [r[-1] for r in rows]
                want = [None if v is None else round(v, 2) for v in it["perMonth"]]
                for i, (g, w) in enumerate(zip(got, want)):
                    check(f"{it['id']} sql/{engine} month {i + 1}", g, w, tol)
        except Exception as e:  # noqa: BLE001 - every failure is reported, none stops the run
            failures.append(f"{it['id']} sql/{engine}: {type(e).__name__}: {e}")

# ---------- pandas ----------
import os

for it in items:
    p = it.get("pandas")
    if not p:
        continue
    cwd = os.getcwd()
    os.chdir(out)
    try:
        scope: dict = {}
        with contextlib.redirect_stdout(io.StringIO()):
            exec(p["code"], scope)  # our own generated code, run against our own sample file
        if p.get("total"):
            check(f"{it['id']} pandas total", scope[p["total"]], it["expected"], it.get("tolerance", 1e-9))
        if p.get("column") and it.get("perMonth"):
            got = list(scope["df"][p["column"]])
            for i, (g, w) in enumerate(zip(got, it["perMonth"])):
                check(f"{it['id']} pandas month {i + 1}", None if (isinstance(g, float) and math.isnan(g)) else g, w, 1e-9)
    except Exception as e:  # noqa: BLE001
        failures.append(f"{it['id']} pandas: {type(e).__name__}: {e}")
    finally:
        os.chdir(cwd)

# ---------- Excel ----------
def excel_eval(dataset, cells):
    """Write the dataset and the formulas into a workbook, compute it, return the formula cells' values."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    df = frames[dataset]
    ws.append(list(df.columns))
    for row in df.itertuples(index=False):
        ws.append([v.item() if hasattr(v, "item") else v for v in row])
    for ref, f in cells.items():
        ws[ref] = f
    path = out / "check.xlsx"
    wb.save(path)
    model = formulas.ExcelModel().loads(str(path)).finish()
    sol = model.calculate()
    res = {}
    for ref in cells:
        key = next(k for k in sol if k.upper().endswith(f"SHEET1'!{ref}"))
        v = sol[key].value[0][0]
        res[ref] = None if isinstance(v, str) or v is None else float(v)
    return res


for it in items:
    x = it.get("excel")
    if not x:
        continue
    df = frames[it["dataset"]]
    free = openpyxl.utils.get_column_letter(len(df.columns) + 1)
    total_cell = openpyxl.utils.get_column_letter(len(df.columns) + 3) + "2"
    cells = {total_cell: x["overall"]}
    month_cells = []
    if x.get("perMonth"):
        start = x["perMonthStartRow"]
        base = x["perMonth"]
        for r in range(start, len(df) + 2):
            # fill down: shift every relative row reference by (r - start); $-anchored rows stay put
            import re

            f = re.sub(r"(?<![$A-Z])([A-Z]{1,2})(\d+)", lambda m: f"{m.group(1)}{int(m.group(2)) + r - start}", base)
            cells[f"{free}{r}"] = f
            month_cells.append(f"{free}{r}")
    try:
        res = excel_eval(it["dataset"], cells)
        tol = it.get("tolerance", 1e-9)
        check(f"{it['id']} excel overall", None if res[total_cell] is None else res[total_cell] * x["scale"], it["expected"], tol)
        for i, ref in enumerate(month_cells):
            want = it["perMonth"][x["perMonthStartRow"] - 2 + i]
            check(f"{it['id']} excel {ref}", None if res[ref] is None else res[ref] * x["scale"], want, tol)
    except Exception as e:  # noqa: BLE001
        failures.append(f"{it['id']} excel: {type(e).__name__}: {e}")

print(f"checked {len(items)} items")
if failures:
    print(f"{len(failures)} FAILURES")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("all snippets match the published figures")
