// Units for /convert. Each factor is how many of the category's base unit one unit equals, taken from the unit's legal
// definition (SI, the 1959 international yard and pound, US customary and UK imperial measures). scripts/seo/verify_units.py
// checks every pair against the Pint unit library. `def` is shown on the page and must stay factual.

export const CATEGORIES = [
  {
    slug: 'length', name: 'Length', base: 'meter',
    units: [
      { id: 'meters', name: 'meter', plural: 'meters', symbol: 'm', factor: 1, def: 'The SI unit of length, defined since 1983 as the distance light travels in a vacuum in 1/299,792,458 of a second.' },
      { id: 'kilometers', name: 'kilometer', plural: 'kilometers', symbol: 'km', factor: 1000, def: 'One thousand meters.' },
      { id: 'centimeters', name: 'centimeter', plural: 'centimeters', symbol: 'cm', factor: 0.01, def: 'One hundredth of a meter.' },
      { id: 'millimeters', name: 'millimeter', plural: 'millimeters', symbol: 'mm', factor: 0.001, def: 'One thousandth of a meter.' },
      { id: 'micrometers', name: 'micrometer', plural: 'micrometers', symbol: 'µm', factor: 1e-6, def: 'One millionth of a meter, also called a micron.' },
      { id: 'nanometers', name: 'nanometer', plural: 'nanometers', symbol: 'nm', factor: 1e-9, def: 'One billionth of a meter, the scale used for light wavelengths and chip features.' },
      { id: 'miles', name: 'mile', plural: 'miles', symbol: 'mi', factor: 1609.344, def: 'The international mile: 5,280 feet, exactly 1,609.344 meters since the 1959 international yard and pound agreement.' },
      { id: 'yards', name: 'yard', plural: 'yards', symbol: 'yd', factor: 0.9144, def: 'Three feet, defined as exactly 0.9144 meters since 1959.' },
      { id: 'feet', name: 'foot', plural: 'feet', symbol: 'ft', factor: 0.3048, def: 'Twelve inches, exactly 0.3048 meters.' },
      { id: 'inches', name: 'inch', plural: 'inches', symbol: 'in', factor: 0.0254, def: 'Exactly 25.4 millimeters, by the 1959 international definition.' },
      { id: 'nautical-miles', name: 'nautical mile', plural: 'nautical miles', symbol: 'nmi', factor: 1852, def: 'Exactly 1,852 meters, used at sea and in aviation; one minute of latitude, approximately.' },
    ],
  },
  {
    slug: 'weight', name: 'Weight and mass', base: 'kilogram',
    units: [
      { id: 'kilograms', name: 'kilogram', plural: 'kilograms', symbol: 'kg', factor: 1, def: 'The SI unit of mass, defined since 2019 by fixing the value of the Planck constant.' },
      { id: 'grams', name: 'gram', plural: 'grams', symbol: 'g', factor: 0.001, def: 'One thousandth of a kilogram.' },
      { id: 'milligrams', name: 'milligram', plural: 'milligrams', symbol: 'mg', factor: 1e-6, def: 'One thousandth of a gram, common on medicine and nutrition labels.' },
      { id: 'micrograms', name: 'microgram', plural: 'micrograms', symbol: 'µg', factor: 1e-9, def: 'One millionth of a gram.' },
      { id: 'metric-tons', name: 'metric ton', plural: 'metric tons', symbol: 't', factor: 1000, def: 'One thousand kilograms, also called a tonne.' },
      { id: 'pounds', name: 'pound', plural: 'pounds', symbol: 'lb', factor: 0.45359237, def: 'The avoirdupois pound, exactly 0.45359237 kilograms since 1959.' },
      { id: 'ounces', name: 'ounce', plural: 'ounces', symbol: 'oz', factor: 0.028349523125, def: 'The avoirdupois ounce, one sixteenth of a pound. Not the troy ounce used for precious metals.' },
      { id: 'stones', name: 'stone', plural: 'stones', symbol: 'st', factor: 6.35029318, def: 'Fourteen pounds, still used in the UK and Ireland for body weight.' },
      { id: 'short-tons', name: 'short ton', plural: 'short tons', symbol: 'ton (US)', factor: 907.18474, def: 'The US ton: 2,000 pounds.' },
      { id: 'long-tons', name: 'long ton', plural: 'long tons', symbol: 'ton (UK)', factor: 1016.0469088, def: 'The imperial ton: 2,240 pounds.' },
    ],
  },
  {
    slug: 'volume', name: 'Volume', base: 'liter',
    units: [
      { id: 'liters', name: 'liter', plural: 'liters', symbol: 'L', factor: 1, def: 'One cubic decimeter: 1,000 cubic centimeters.' },
      { id: 'milliliters', name: 'milliliter', plural: 'milliliters', symbol: 'mL', factor: 0.001, def: 'One thousandth of a liter, the same as one cubic centimeter.' },
      { id: 'cubic-meters', name: 'cubic meter', plural: 'cubic meters', symbol: 'm³', factor: 1000, def: 'The SI unit of volume: 1,000 liters.' },
      { id: 'us-gallons', name: 'US gallon', plural: 'US gallons', symbol: 'gal (US)', factor: 3.785411784, def: 'Exactly 231 cubic inches, about 3.785 liters.' },
      { id: 'us-quarts', name: 'US quart', plural: 'US quarts', symbol: 'qt (US)', factor: 0.946352946, def: 'One quarter of a US gallon.' },
      { id: 'us-pints', name: 'US pint', plural: 'US pints', symbol: 'pt (US)', factor: 0.473176473, def: 'One eighth of a US gallon: 16 US fluid ounces.' },
      { id: 'us-cups', name: 'US cup', plural: 'US cups', symbol: 'cup', factor: 0.2365882365, def: 'The US customary cup: half a US pint, 8 US fluid ounces. Nutrition labels use a rounded 240 mL cup.' },
      { id: 'us-fluid-ounces', name: 'US fluid ounce', plural: 'US fluid ounces', symbol: 'fl oz (US)', factor: 0.0295735295625, def: 'One 128th of a US gallon.' },
      { id: 'tablespoons', name: 'US tablespoon', plural: 'US tablespoons', symbol: 'tbsp', factor: 0.01478676478125, def: 'Half a US fluid ounce. Metric tablespoons are 15 mL; Australian ones are 20 mL.' },
      { id: 'teaspoons', name: 'US teaspoon', plural: 'US teaspoons', symbol: 'tsp', factor: 0.00492892159375, def: 'One third of a US tablespoon. Metric teaspoons are 5 mL.' },
      { id: 'imperial-gallons', name: 'imperial gallon', plural: 'imperial gallons', symbol: 'gal (UK)', factor: 4.54609, def: 'The UK gallon, exactly 4.54609 liters, about 20% larger than the US gallon.' },
      { id: 'imperial-pints', name: 'imperial pint', plural: 'imperial pints', symbol: 'pt (UK)', factor: 0.56826125, def: 'One eighth of an imperial gallon: 20 imperial fluid ounces.' },
      { id: 'cubic-feet', name: 'cubic foot', plural: 'cubic feet', symbol: 'ft³', factor: 28.316846592, def: 'A cube one foot on each side.' },
      { id: 'cubic-inches', name: 'cubic inch', plural: 'cubic inches', symbol: 'in³', factor: 0.016387064, def: 'A cube one inch on each side: exactly 16.387064 cubic centimeters.' },
    ],
  },
  {
    slug: 'area', name: 'Area', base: 'square meter',
    units: [
      { id: 'square-meters', name: 'square meter', plural: 'square meters', symbol: 'm²', factor: 1, def: 'The SI unit of area: a square one meter on each side.' },
      { id: 'square-kilometers', name: 'square kilometer', plural: 'square kilometers', symbol: 'km²', factor: 1e6, def: 'One million square meters, or 100 hectares.' },
      { id: 'square-centimeters', name: 'square centimeter', plural: 'square centimeters', symbol: 'cm²', factor: 1e-4, def: 'One ten-thousandth of a square meter.' },
      { id: 'hectares', name: 'hectare', plural: 'hectares', symbol: 'ha', factor: 1e4, def: '10,000 square meters: a square 100 meters on each side.' },
      { id: 'acres', name: 'acre', plural: 'acres', symbol: 'ac', factor: 4046.8564224, def: 'The international acre: 43,560 square feet. The older US survey acre is very slightly larger.' },
      { id: 'square-feet', name: 'square foot', plural: 'square feet', symbol: 'ft²', factor: 0.09290304, def: 'A square one foot on each side.' },
      { id: 'square-inches', name: 'square inch', plural: 'square inches', symbol: 'in²', factor: 0.00064516, def: 'A square one inch on each side.' },
      { id: 'square-yards', name: 'square yard', plural: 'square yards', symbol: 'yd²', factor: 0.83612736, def: 'Nine square feet.' },
      { id: 'square-miles', name: 'square mile', plural: 'square miles', symbol: 'mi²', factor: 2589988.110336, def: '640 acres.' },
    ],
  },
  {
    slug: 'temperature', name: 'Temperature', base: 'kelvin', affine: true,
    units: [
      { id: 'celsius', name: 'degree Celsius', plural: 'degrees Celsius', symbol: '°C', def: 'Water freezes at 0 °C and boils at about 100 °C at sea level. A step of one degree Celsius equals one kelvin.' },
      { id: 'fahrenheit', name: 'degree Fahrenheit', plural: 'degrees Fahrenheit', symbol: '°F', def: 'Water freezes at 32 °F and boils at about 212 °F at sea level. One degree Fahrenheit is 5/9 of a kelvin.' },
      { id: 'kelvin', name: 'kelvin', plural: 'kelvins', symbol: 'K', def: 'The SI unit of temperature, measured from absolute zero. 0 °C is exactly 273.15 K.' },
    ],
  },
  {
    slug: 'speed', name: 'Speed', base: 'meter per second',
    units: [
      { id: 'meters-per-second', name: 'meter per second', plural: 'meters per second', symbol: 'm/s', factor: 1, def: 'The SI unit of speed.' },
      { id: 'kilometers-per-hour', name: 'kilometer per hour', plural: 'kilometers per hour', symbol: 'km/h', factor: 1000 / 3600, def: 'Used for road speeds in most of the world.' },
      { id: 'miles-per-hour', name: 'mile per hour', plural: 'miles per hour', symbol: 'mph', factor: 1609.344 / 3600, def: 'Used for road speeds in the US and the UK.' },
      { id: 'knots', name: 'knot', plural: 'knots', symbol: 'kn', factor: 1852 / 3600, def: 'One nautical mile per hour, used at sea and in aviation.' },
      { id: 'feet-per-second', name: 'foot per second', plural: 'feet per second', symbol: 'ft/s', factor: 0.3048, def: 'Common in engineering and ballistics.' },
    ],
  },
  {
    slug: 'time', name: 'Time', base: 'second',
    units: [
      { id: 'seconds', name: 'second', plural: 'seconds', symbol: 's', factor: 1, def: 'The SI unit of time, defined by the caesium-133 atom\'s hyperfine transition frequency.' },
      { id: 'milliseconds', name: 'millisecond', plural: 'milliseconds', symbol: 'ms', factor: 1e-3, def: 'One thousandth of a second, the usual unit for network latency.' },
      { id: 'microseconds', name: 'microsecond', plural: 'microseconds', symbol: 'µs', factor: 1e-6, def: 'One millionth of a second.' },
      { id: 'nanoseconds', name: 'nanosecond', plural: 'nanoseconds', symbol: 'ns', factor: 1e-9, def: 'One billionth of a second, the scale of CPU cycles.' },
      { id: 'minutes', name: 'minute', plural: 'minutes', symbol: 'min', factor: 60, def: 'Sixty seconds.' },
      { id: 'hours', name: 'hour', plural: 'hours', symbol: 'h', factor: 3600, def: 'Sixty minutes.' },
      { id: 'days', name: 'day', plural: 'days', symbol: 'd', factor: 86400, def: '24 hours. Days with a leap second or a daylight-saving change are longer or shorter.' },
      { id: 'weeks', name: 'week', plural: 'weeks', symbol: 'wk', factor: 604800, def: 'Seven days.' },
      { id: 'years', name: 'year (365 days)', plural: 'years (365 days)', symbol: 'yr', factor: 31536000, def: 'A common calendar year of 365 days. Leap years have 366; the average Gregorian year is 365.2425 days.' },
    ],
  },
  {
    slug: 'data', name: 'Data size', base: 'byte',
    units: [
      { id: 'bits', name: 'bit', plural: 'bits', symbol: 'bit', factor: 0.125, def: 'A single binary digit, 0 or 1. Network speeds are quoted in bits per second.' },
      { id: 'bytes', name: 'byte', plural: 'bytes', symbol: 'B', factor: 1, def: 'Eight bits. File sizes and memory are counted in bytes.' },
      { id: 'kilobytes', name: 'kilobyte', plural: 'kilobytes', symbol: 'kB', factor: 1e3, def: '1,000 bytes in the SI sense. Some software uses "KB" for 1,024 bytes, which is properly a kibibyte (KiB).' },
      { id: 'megabytes', name: 'megabyte', plural: 'megabytes', symbol: 'MB', factor: 1e6, def: 'One million bytes. Windows shows sizes in units of 1,048,576 bytes but labels them MB.' },
      { id: 'gigabytes', name: 'gigabyte', plural: 'gigabytes', symbol: 'GB', factor: 1e9, def: 'One billion bytes, the unit drive makers use on the box.' },
      { id: 'terabytes', name: 'terabyte', plural: 'terabytes', symbol: 'TB', factor: 1e12, def: 'One trillion bytes.' },
      { id: 'petabytes', name: 'petabyte', plural: 'petabytes', symbol: 'PB', factor: 1e15, def: 'One quadrillion bytes.' },
      { id: 'kibibytes', name: 'kibibyte', plural: 'kibibytes', symbol: 'KiB', factor: 1024, def: '1,024 bytes (2¹⁰), the binary unit defined by the IEC in 1998.' },
      { id: 'mebibytes', name: 'mebibyte', plural: 'mebibytes', symbol: 'MiB', factor: 1048576, def: '1,048,576 bytes (2²⁰).' },
      { id: 'gibibytes', name: 'gibibyte', plural: 'gibibytes', symbol: 'GiB', factor: 1073741824, def: '1,073,741,824 bytes (2³⁰). A "1 TB" drive shows as about 931 GiB.' },
      { id: 'tebibytes', name: 'tebibyte', plural: 'tebibytes', symbol: 'TiB', factor: 1099511627776, def: '2⁴⁰ bytes.' },
    ],
  },
  {
    slug: 'energy', name: 'Energy', base: 'joule',
    units: [
      { id: 'joules', name: 'joule', plural: 'joules', symbol: 'J', factor: 1, def: 'The SI unit of energy: one newton acting over one meter.' },
      { id: 'kilojoules', name: 'kilojoule', plural: 'kilojoules', symbol: 'kJ', factor: 1000, def: 'One thousand joules; food labels outside the US often give energy in kJ.' },
      { id: 'calories', name: 'calorie', plural: 'calories', symbol: 'cal', factor: 4.184, def: 'The thermochemical calorie, exactly 4.184 joules. Food "Calories" are kilocalories.' },
      { id: 'kilocalories', name: 'kilocalorie', plural: 'kilocalories', symbol: 'kcal', factor: 4184, def: 'One thousand calories: the "Calorie" on food labels.' },
      { id: 'watt-hours', name: 'watt-hour', plural: 'watt-hours', symbol: 'Wh', factor: 3600, def: 'One watt for one hour: 3,600 joules. Battery capacities are given in Wh.' },
      { id: 'kilowatt-hours', name: 'kilowatt-hour', plural: 'kilowatt-hours', symbol: 'kWh', factor: 3.6e6, def: 'One kilowatt for one hour: the "unit" on an electricity bill.' },
      { id: 'btu', name: 'British thermal unit', plural: 'British thermal units', symbol: 'BTU', factor: 1055.05585262, def: 'The International Table BTU, used for heating and air-conditioning ratings.' },
      { id: 'electronvolts', name: 'electronvolt', plural: 'electronvolts', symbol: 'eV', factor: 1.602176634e-19, def: 'The energy an electron gains across one volt; exactly 1.602176634 × 10⁻¹⁹ joules since 2019.' },
    ],
  },
  {
    slug: 'pressure', name: 'Pressure', base: 'pascal',
    units: [
      { id: 'pascals', name: 'pascal', plural: 'pascals', symbol: 'Pa', factor: 1, def: 'The SI unit of pressure: one newton per square meter.' },
      { id: 'kilopascals', name: 'kilopascal', plural: 'kilopascals', symbol: 'kPa', factor: 1000, def: 'One thousand pascals; tyre pressures are often given in kPa.' },
      { id: 'bars', name: 'bar', plural: 'bars', symbol: 'bar', factor: 1e5, def: 'Exactly 100,000 pascals, close to atmospheric pressure at sea level.' },
      { id: 'psi', name: 'pound per square inch', plural: 'pounds per square inch', symbol: 'psi', factor: 6894.757293168361, def: 'One pound-force on one square inch; used for US tyre pressures.' },
      { id: 'atmospheres', name: 'standard atmosphere', plural: 'standard atmospheres', symbol: 'atm', factor: 101325, def: 'Exactly 101,325 pascals: average air pressure at sea level.' },
      { id: 'mmhg', name: 'millimeter of mercury', plural: 'millimeters of mercury', symbol: 'mmHg', factor: 133.322387415, def: 'The conventional value, 133.322387415 pascals; blood pressure is measured in mmHg.' },
      { id: 'inhg', name: 'inch of mercury', plural: 'inches of mercury', symbol: 'inHg', factor: 3386.388640341, def: 'The conventional value at 0 °C; US weather reports give barometric pressure in inHg.' },
    ],
  },
  {
    slug: 'power', name: 'Power', base: 'watt',
    units: [
      { id: 'watts', name: 'watt', plural: 'watts', symbol: 'W', factor: 1, def: 'The SI unit of power: one joule per second.' },
      { id: 'kilowatts', name: 'kilowatt', plural: 'kilowatts', symbol: 'kW', factor: 1000, def: 'One thousand watts.' },
      { id: 'horsepower', name: 'horsepower', plural: 'horsepower', symbol: 'hp', factor: 745.6998715822702, def: 'Mechanical (imperial) horsepower: 550 foot-pounds per second. Metric horsepower (PS) is slightly smaller.' },
      { id: 'btu-per-hour', name: 'BTU per hour', plural: 'BTU per hour', symbol: 'BTU/h', factor: 1055.05585262 / 3600, def: 'Used for air-conditioner and heater ratings.' },
    ],
  },
  {
    slug: 'angle', name: 'Angle', base: 'radian',
    units: [
      { id: 'degrees', name: 'degree', plural: 'degrees', symbol: '°', factor: Math.PI / 180, def: 'One 360th of a full turn.' },
      { id: 'radians', name: 'radian', plural: 'radians', symbol: 'rad', factor: 1, def: 'The angle at which the arc equals the radius; a full turn is 2π radians. Programming maths libraries use radians.' },
      { id: 'gradians', name: 'gradian', plural: 'gradians', symbol: 'gon', factor: Math.PI / 200, def: 'One 400th of a full turn, used in some surveying.' },
      { id: 'arcminutes', name: 'arcminute', plural: 'arcminutes', symbol: '′', factor: Math.PI / 10800, def: 'One sixtieth of a degree.' },
      { id: 'arcseconds', name: 'arcsecond', plural: 'arcseconds', symbol: '″', factor: Math.PI / 648000, def: 'One sixtieth of an arcminute.' },
    ],
  },
];

const TEMP = {
  toK: { celsius: (v) => v + 273.15, fahrenheit: (v) => ((v - 32) * 5) / 9 + 273.15, kelvin: (v) => v },
  fromK: { celsius: (k) => k - 273.15, fahrenheit: (k) => ((k - 273.15) * 9) / 5 + 32, kelvin: (k) => k },
};

export const PAIRS = CATEGORIES.flatMap((c) => c.units.flatMap((a) => c.units.filter((b) => b !== a).map((b) => ({ category: c, from: a, to: b, slug: `${a.id}-to-${b.id}` }))));
const bySlug = new Map(PAIRS.map((p) => [p.slug, p]));
export const pair = (slug) => bySlug.get(slug);
export const category = (slug) => CATEGORIES.find((c) => c.slug === slug);

export function convert(p, v) {
  if (p.category.affine) return TEMP.fromK[p.to.id](TEMP.toK[p.from.id](v));
  return (v * p.from.factor) / p.to.factor;
}

/** Multiplier from one unit to the other (not for temperature). */
export const factorOf = (p) => (p.category.affine ? null : p.from.factor / p.to.factor);

/** Round for display: up to 10 significant digits, no float noise (30.479999999999997 → 30.48). */
export function nice(v) {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const r = Number(v.toPrecision(10));
  const a = Math.abs(r);
  if (a >= 1e15 || a < 1e-6) return r.toExponential(6).replace(/\.?0+e/, 'e');
  return r.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

/** The formula in words, e.g. "multiply the length value by 30.48". */
export function formula(p) {
  if (p.category.affine) {
    const f = `${p.from.id}->${p.to.id}`;
    return {
      'celsius->fahrenheit': '°F = °C × 9/5 + 32', 'fahrenheit->celsius': '°C = (°F − 32) × 5/9', 'celsius->kelvin': 'K = °C + 273.15',
      'kelvin->celsius': '°C = K − 273.15', 'fahrenheit->kelvin': 'K = (°F − 32) × 5/9 + 273.15', 'kelvin->fahrenheit': '°F = (K − 273.15) × 9/5 + 32',
    }[f];
  }
  const k = factorOf(p);
  return k >= 1 ? `${p.to.symbol} = ${p.from.symbol} × ${nice(k)}` : `${p.to.symbol} = ${p.from.symbol} ÷ ${nice(1 / k)}`;
}

/** Example inputs for the conversion table, chosen so the outputs are readable numbers. */
export function tableInputs(p) {
  if (p.category.affine) return p.from.id === 'kelvin' ? [0, 200, 250, 273.15, 293.15, 300, 310.15, 373.15, 500, 1000] : [-40, -20, -10, 0, 10, 20, 25, 30, 37, 40, 50, 100];
  const k = factorOf(p);
  const scale = 10 ** Math.max(0, Math.floor(-Math.log10(k)) - 1);
  return [1, 2, 3, 4, 5, 10, 20, 25, 50, 100, 250, 500, 1000].map((x) => x * scale);
}
