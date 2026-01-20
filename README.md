# tiled
Horror game using Phaser JS.

## Spuštění prototypu
```bash
npm install
npm run dev
```

Prototyp obsahuje jednoduchou mapu, generovaný tileset a NPC, které patroluje po obvodu mapy.

## Backend služby
Backend je umístěný ve složce `server/` a poskytuje API pro registraci, přihlášení a ukládání herního stavu.

### Spuštění serveru
```bash
cd server
npm install
```

Nastavte (volitelně) připojení k databázi přes `DATABASE_URL`. Pokud proměnná není nastavená, použije se lokální SQLite databáze v `server/data/tiled.sqlite`.

```bash
export DATABASE_URL=server/data/tiled.sqlite
npm run migrate
npm start
```

Server běží na `http://localhost:4000` a podporuje CORS (výchozí origin `http://localhost:5173`, lze změnit přes `CORS_ORIGIN`).

### Použití z klienta
Klient načítá a ukládá stav hráče přes `VITE_API_URL` (výchozí `http://localhost:4000`). Pro autorizované požadavky uložíte token ze `/auth/register` nebo `/auth/login` do `localStorage` pod klíčem `tiled:sessionToken`.
