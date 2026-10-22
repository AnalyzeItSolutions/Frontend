"""Check every /convert pair against the Pint unit library (an independent set of definitions).

    pip install pint && node scripts/seo/export_units.mjs /tmp/u.json && python -I scripts/seo/verify_units.py /tmp/u.json
"""
import json
import sys

import pint

u = pint.UnitRegistry()
u.define("common_year = 365 * day")  # the page uses a 365-day year; Pint's own "year" is 365.25 days
PINT = {
    "meters": "m", "kilometers": "km", "centimeters": "cm", "millimeters": "mm", "micrometers": "um", "nanometers": "nm", "miles": "mile", "yards": "yard",
    "feet": "foot", "inches": "inch", "nautical-miles": "nautical_mile",
    "kilograms": "kg", "grams": "g", "milligrams": "mg", "micrograms": "ug", "metric-tons": "metric_ton", "pounds": "lb", "ounces": "oz", "stones": "stone",
    "short-tons": "short_ton", "long-tons": "long_ton",
    "liters": "L", "milliliters": "mL", "cubic-meters": "m**3", "us-gallons": "gallon", "us-quarts": "quart", "us-pints": "pint", "us-cups": "cup",
    "us-fluid-ounces": "fluid_ounce", "tablespoons": "tablespoon", "teaspoons": "teaspoon", "imperial-gallons": "imperial_gallon", "imperial-pints": "imperial_pint",
    "cubic-feet": "ft**3", "cubic-inches": "in**3",
    "square-meters": "m**2", "square-kilometers": "km**2", "square-centimeters": "cm**2", "hectares": "hectare", "acres": "acre", "square-feet": "ft**2",
    "square-inches": "in**2", "square-yards": "yd**2", "square-miles": "mi**2",
    "celsius": "degC", "fahrenheit": "degF", "kelvin": "K",
    "meters-per-second": "m/s", "kilometers-per-hour": "km/h", "miles-per-hour": "mph", "knots": "knot", "feet-per-second": "ft/s",
    "seconds": "s", "milliseconds": "ms", "microseconds": "us", "nanoseconds": "ns", "minutes": "minute", "hours": "hour", "days": "day", "weeks": "week", "years": "common_year",
    "bits": "bit", "bytes": "byte", "kilobytes": "kB", "megabytes": "MB", "gigabytes": "GB", "terabytes": "TB", "petabytes": "PB", "kibibytes": "KiB",
    "mebibytes": "MiB", "gibibytes": "GiB", "tebibytes": "TiB",
    "joules": "J", "kilojoules": "kJ", "calories": "calorie", "kilocalories": "kilocalorie", "watt-hours": "Wh", "kilowatt-hours": "kWh", "btu": "Btu_it", "electronvolts": "eV",
    "pascals": "Pa", "kilopascals": "kPa", "bars": "bar", "psi": "psi", "atmospheres": "atm", "mmhg": "mmHg", "inhg": "inHg",
    "watts": "W", "kilowatts": "kW", "horsepower": "hp", "btu-per-hour": "Btu_it/hour",
    "degrees": "degree", "radians": "radian", "gradians": "gradian", "arcminutes": "arcminute", "arcseconds": "arcsecond",
}

bad, n = [], 0
for p in json.load(open(sys.argv[1])):
    for v, got in p["values"]:
        expected = u.Quantity(v, u(PINT[p["from"]]).units).to(u(PINT[p["to"]]).units).magnitude
        n += 1
        if abs(got - expected) > 1e-9 * max(1.0, abs(expected)):
            bad.append(f"{p['slug']} {v}: page {got!r}, pint {expected!r}")
print(f"checked {n} conversions against pint {pint.__version__}")
if bad:
    print(len(bad), "FAILURES"); print("\n".join(bad[:30])); sys.exit(1)
print("all conversions match")
