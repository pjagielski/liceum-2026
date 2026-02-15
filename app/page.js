"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 25;

function comparePoints(a, b, direction) {
  if (a.minPoints === null && b.minPoints === null) {
    return 0;
  }
  if (a.minPoints === null) {
    return 1;
  }
  if (b.minPoints === null) {
    return -1;
  }
  return (a.minPoints - b.minPoints) * direction;
}

function compareGroupPoints(a, b, direction, collator) {
  const aValues = a.rows.filter((row) => row.minPoints !== null).map((row) => row.minPoints);
  const bValues = b.rows.filter((row) => row.minPoints !== null).map((row) => row.minPoints);

  const aValue =
    aValues.length === 0 ? null : direction === -1 ? Math.max(...aValues) : Math.min(...aValues);
  const bValue =
    bValues.length === 0 ? null : direction === -1 ? Math.max(...bValues) : Math.min(...bValues);

  if (aValue === null && bValue === null) {
    return collator.compare(a.school, b.school);
  }
  if (aValue === null) {
    return 1;
  }
  if (bValue === null) {
    return -1;
  }
  return (aValue - bValue) * direction || collator.compare(a.school, b.school);
}

function sortRows(rows, mode) {
  const collator = new Intl.Collator("pl", { sensitivity: "base" });
  const groupsMap = new Map();

  for (const row of rows) {
    const key = `${row.district}|||${row.school}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        district: row.district,
        school: row.school,
        rows: [],
      });
    }
    groupsMap.get(key).rows.push(row);
  }

  const groups = [...groupsMap.values()];

  for (const group of groups) {
    if (mode === "points-asc") {
      group.rows.sort((a, b) => comparePoints(a, b, 1) || collator.compare(a.symbol, b.symbol));
    } else {
      group.rows.sort((a, b) => comparePoints(a, b, -1) || collator.compare(a.symbol, b.symbol));
    }
  }

  groups.sort((a, b) => {
    if (mode === "district-asc") {
      return collator.compare(a.district, b.district) || collator.compare(a.school, b.school);
    }

    if (mode === "school-asc") {
      return collator.compare(a.school, b.school) || collator.compare(a.district, b.district);
    }

    if (mode === "points-desc") {
      return compareGroupPoints(a, b, -1, collator);
    }

    if (mode === "points-asc") {
      return compareGroupPoints(a, b, 1, collator);
    }

    return 0;
  });

  return groups.flatMap((group) => group.rows);
}

function toPageGroups(pageRows) {
  const groups = [];

  for (const row of pageRows) {
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup || lastGroup.district !== row.district || lastGroup.school !== row.school) {
      groups.push({ district: row.district, school: row.school, rows: [row] });
      continue;
    }
    lastGroup.rows.push(row);
  }

  return groups;
}

export default function HomePage() {
  const [allRows, setAllRows] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [sortMode, setSortMode] = useState("district-asc");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [includeNoData, setIncludeNoData] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("./data/schools-2025.json");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const rows = await response.json();
        setAllRows(rows);
      } catch {
        setError("Nie udało się załadować danych.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const districts = useMemo(
    () => [...new Set(allRows.map((row) => row.district))].sort((a, b) => a.localeCompare(b, "pl")),
    [allRows]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const parsedMin = Number.parseFloat(minPoints);
    const parsedMax = Number.parseFloat(maxPoints);

    const rows = allRows.filter((row) => {
      const searchable = `${row.school} ${row.profile} ${row.symbol} ${row.district}`.toLowerCase();
      if (query && !searchable.includes(query)) {
        return false;
      }

      if (district && row.district !== district) {
        return false;
      }

      if (row.minPoints === null) {
        return includeNoData;
      }

      if (!Number.isNaN(parsedMin) && row.minPoints < parsedMin) {
        return false;
      }

      if (!Number.isNaN(parsedMax) && row.minPoints > parsedMax) {
        return false;
      }

      return true;
    });

    return sortRows(rows, sortMode);
  }, [allRows, search, district, minPoints, maxPoints, includeNoData, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, district, sortMode, minPoints, maxPoints, includeNoData]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const pageGroups = useMemo(() => toPageGroups(pageRows), [pageRows]);
  const schoolCount = useMemo(() => new Set(filteredRows.map((row) => row.school)).size, [filteredRows]);
  const districtCount = useMemo(
    () => new Set(filteredRows.map((row) => row.district)).size,
    [filteredRows]
  );

  return (
    <>
      <div className="bg-shape bg-shape-a" />
      <div className="bg-shape bg-shape-b" />

      <main className="container">
        <header className="hero">
          <p className="eyebrow">Rekrutacja 2025</p>
          <h1>Minimalna liczba punktów kandydatów zakwalifikowanych</h1>
          <p className="subtitle">Interaktywna tabela na podstawie danych z PDF miasta st. Warszawy.</p>
        </header>

        <section className="panel filters" aria-label="Filtry">
          <div className="field field-wide">
            <label htmlFor="search">Szukaj (szkoła, profil, symbol)</label>
            <input
              id="search"
              type="search"
              placeholder="np. Reytan, informatyk, 1A"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="district">Dzielnica</label>
            <select id="district" value={district} onChange={(event) => setDistrict(event.target.value)}>
              <option value="">Wszystkie</option>
              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="sort">Sortowanie</label>
            <select id="sort" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="school-asc">Szkoła A-Z</option>
              <option value="district-asc">Dzielnica A-Z</option>
              <option value="points-desc">Najwyższy próg w szkole</option>
              <option value="points-asc">Najniższy próg w szkole</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="minPoints">Punkty od</label>
            <input
              id="minPoints"
              type="number"
              min="0"
              max="300"
              step="0.01"
              placeholder="0"
              value={minPoints}
              onChange={(event) => setMinPoints(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="maxPoints">Punkty do</label>
            <input
              id="maxPoints"
              type="number"
              min="0"
              max="300"
              step="0.01"
              placeholder="300"
              value={maxPoints}
              onChange={(event) => setMaxPoints(event.target.value)}
            />
          </div>

          <label className="toggle" htmlFor="includeNoData">
            <input
              id="includeNoData"
              type="checkbox"
              checked={includeNoData}
              onChange={(event) => setIncludeNoData(event.target.checked)}
            />
            <span>Pokaż profile z n.d.</span>
          </label>
        </section>

        <section className="stats" aria-label="Podsumowanie">
          <article className="stat-card">
            <p className="stat-label">Widoczne profile</p>
            <p className="stat-value">{filteredRows.length.toLocaleString("pl-PL")}</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">Liczba szkół</p>
            <p className="stat-value">{schoolCount.toLocaleString("pl-PL")}</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">Liczba dzielnic</p>
            <p className="stat-value">{districtCount.toLocaleString("pl-PL")}</p>
          </article>
        </section>

        <section className="panel table-wrap" aria-label="Tabela progów">
          <table>
            <thead>
              <tr>
                <th>Dzielnica</th>
                <th>Szkoła</th>
                <th>Symbol</th>
                <th>Profil</th>
                <th>Punkty</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={5}>{error}</td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={5}>Ładowanie danych...</td>
                </tr>
              ) : pageGroups.length === 0 ? (
                <tr>
                  <td colSpan={5}>Brak wyników dla podanych filtrów.</td>
                </tr>
              ) : (
                pageGroups.map((group) =>
                  group.rows.map((row, index) => (
                    <tr key={`${row.district}-${row.school}-${row.symbol}-${index}`}>
                      {index === 0 && (
                        <>
                          <td className="group-cell" rowSpan={group.rows.length}>
                            {row.district}
                          </td>
                          <td className="group-cell" rowSpan={group.rows.length}>
                            {row.school}
                          </td>
                        </>
                      )}
                      <td>{row.symbol}</td>
                      <td>{row.profile}</td>
                      <td className={row.minPointsRaw === "n.d." ? "nd" : ""}>{row.minPointsRaw}</td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </section>

        <section className="pager" aria-label="Stronicowanie">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
            Poprzednia
          </button>
          <p>Strona {page} z {totalPages}</p>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page >= totalPages}
          >
            Następna
          </button>
        </section>
      </main>
    </>
  );
}
