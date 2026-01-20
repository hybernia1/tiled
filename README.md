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

### Požadavky
- Node.js 18+ a npm.
- SQLite databáze (soubor), případně vlastní cesta přes `DATABASE_URL`.

### Spuštění serveru
```bash
cd server
npm install
```

Zkopírujte si `.env.example` do `.env` a upravte proměnné podle potřeby:

```bash
cp ../.env.example .env
```

Nastavte (volitelně) připojení k databázi přes `DATABASE_URL`. Pokud proměnná není nastavená, použije se lokální SQLite databáze v `server/data/tiled.sqlite`.

```bash
npm run migrate
npm start
```

Server běží na `http://localhost:4000` a podporuje CORS (výchozí origin `http://localhost:5173`, lze změnit přes `CORS_ORIGIN`).

### Migrace a vytvoření DB tabulek
- Migrace se spouští při startu serveru (`npm start`) i ručně přes `npm run migrate`.
- Každá migrace je `.sql` soubor ve složce `server/migrations` a je aplikována jen jednou.

Postup pro vytvoření nové tabulky:
1. Přidejte nový soubor do `server/migrations`, např. `20250101120000_add_inventory.sql`.
2. Vložte SQL příkazy pro vytvoření/úpravu tabulek.
3. Spusťte `npm run migrate`.

### Proměnné prostředí
Backend používá tyto proměnné (viz `.env.example`):
- `PORT` – port serveru (výchozí 4000).
- `DATABASE_URL` – cesta k SQLite databázi (např. `server/data/tiled.sqlite`, `file:server/data/tiled.sqlite`, `sqlite:server/data/tiled.sqlite`).
- `CORS_ORIGIN` – povolený origin pro CORS (výchozí `http://localhost:5173`).
- `JWT_SECRET` – rezervované pro budoucí JWT autentizaci (aktuálně se nepoužívá).

### Struktura API
Base URL: `http://localhost:4000`

**Autorizace**
- Token vrácený z `/auth/register` nebo `/auth/login` posílejte v hlavičce:
  `Authorization: Bearer <token>`

#### POST `/auth/register`
Registrace nového uživatele.

**Payload**
```json
{
  "email": "player@example.com",
  "password": "secret123"
}
```

**Response 201**
```json
{
  "token": "<session-token>",
  "expiresAt": "2025-01-01T12:00:00.000Z"
}
```

#### POST `/auth/login`
Přihlášení existujícího uživatele.

**Payload**
```json
{
  "email": "player@example.com",
  "password": "secret123"
}
```

**Response 200**
```json
{
  "token": "<session-token>",
  "expiresAt": "2025-01-01T12:00:00.000Z"
}
```

#### POST `/characters`
Vytvoří postavu pro přihlášeného uživatele (pokud již existuje, vrací ji).

**Headers**
`Authorization: Bearer <token>`

**Payload**
```json
{
  "nickname": "PlayerOne"
}
```

**Response 201/200**
```json
{
  "character": {
    "id": 1,
    "user_id": 1,
    "nickname": "PlayerOne",
    "created_at": "2025-01-01 12:00:00"
  }
}
```

#### GET `/player/state`
Načte uložený stav postavy. Pokud stav neexistuje, vytvoří výchozí stav.

**Headers**
`Authorization: Bearer <token>`

**Response 200**
```json
{
  "state": {
    "player": {
      "nickname": "PlayerOne",
      "position": { "x": 0, "y": 0 }
    },
    "world": {}
  }
}
```

#### PUT `/player/state`
Uloží stav postavy. API akceptuje payload buď ve tvaru `{ "state": { ... } }`, nebo přímo objekt se stavem.

**Headers**
`Authorization: Bearer <token>`

**Payload (varianta 1)**
```json
{
  "state": {
    "player": {
      "position": { "x": 12, "y": 8 }
    },
    "world": {}
  }
}
```

**Payload (varianta 2)**
```json
{
  "player": {
    "position": { "x": 12, "y": 8 }
  },
  "world": {}
}
```

**Response 200**
```json
{
  "state": {
    "player": {
      "nickname": "PlayerOne",
      "position": { "x": 12, "y": 8 }
    },
    "world": {}
  }
}
```

#### GET `/health`
Základní health-check.

**Response 200**
```json
{ "ok": true }
```

### Použití z klienta
Klient načítá a ukládá stav hráče přes `VITE_API_URL` (výchozí `http://localhost:4000`). Pro autorizované požadavky uložíte token ze `/auth/register` nebo `/auth/login` do `localStorage` pod klíčem `tiled:sessionToken`.
