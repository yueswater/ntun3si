// src/components/CountrySelect.jsx
import countries from "../data/countries.json";

/**
 * CountrySelect Component
 * Nationality selection drop-down menu, only displays Chinese, sorted by English code
 * @param {string} value - currently selected value
 * @param {function} onChange - Callback function when selection changes
 * @param {boolean} required - Is this a required field?
 */
export default function CountrySelect({ value, onChange, required = false }) {
  return (
    <select
      name="nationality"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="select select-bordered"
      required={required}
    >
      {/* Default placeholder */}
      <option value="">請選擇國籍</option>

      {/* Dynamically render from countries.json */}
      {countries
        .sort((a, b) => a.countryName_en.localeCompare(b.countryName_en))
        .map((c) => (
          <option key={c.countryCode} value={c.countryName_zh}>
            {c.countryName_zh}
          </option>
        ))}

      {/* Manual special options */}
      <option value="中華民國">中華民國</option>
      <option value="其他">其他</option>
    </select>
  );
}
