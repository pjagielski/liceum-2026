# Progi punktowe 2025 - tabela z filtrowaniem

Aplikacja Next.js pokazująca dane z PDF miasta st. Warszawy jako tabelę z filtrowaniem.

## Uruchomienie

1. Zainstaluj zależności:

```bash
npm install
```

2. Uruchom serwer developerski:

```bash
npm run dev
```

3. Otwórz `http://localhost:3000` w przeglądarce.

## Hosting na GitHub Pages

Projekt jest skonfigurowany do statycznego eksportu Next.js (`output: "export"`) i automatycznego wdrożenia przez GitHub Actions.

1. W repozytorium na GitHub przejdź do **Settings -> Pages**.
2. W sekcji **Build and deployment** ustaw **Source: GitHub Actions**.
3. Wypchnij zmiany do gałęzi `main`.

Workflow `.github/workflows/deploy-pages.yml` zbuduje stronę i opublikuje katalog `out/`.

## Odswiezenie danych z PDF

```bash
python3 scripts/extract_data.py
```

Skrypt pobiera PDF, wyciąga tekst i buduje plik `data/schools-2025.json`.
