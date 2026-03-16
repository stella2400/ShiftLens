# ShiftLens SaaS v3

Questa versione sposta il focus da una lettura generica della tabella a una logica più coerente con il caso d'uso reale:

- registrazione con **nome e cognome, matricola, reparto, email, password**
- estrazione guidata prima dalla **matricola** e poi da nome/reparto come conferma
- dashboard privata
- modifica manuale dei turni dopo l'upload
- AI open-source via Hugging Face

## Stack

- **Frontend:** React, Vite, Tailwind, Framer Motion
- **Backend:** FastAPI, SQLModel, JWT Auth
- **AI:** modello VLM open-source da Hugging Face
- **DB:** SQLite per sviluppo

## Requisiti

- Python 3.14
- Node.js 20+
- un token Hugging Face con accesso al modello scelto

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Crea `.env` partendo da `.env.example` e imposta almeno:

```env
HF_TOKEN=your_token_here
HF_MODEL=Qwen/Qwen2.5-VL-7B-Instruct
JWT_SECRET_KEY=change_this_in_production
```

Avvio backend:

```bash
uvicorn app.main:app --reload
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

## Endpoint nuovi

- `POST /api/auth/register` → richiede anche `employee_code`
- `PUT /api/shifts/{shift_id}` → modifica manuale del turno

## Nota importante su database esistente

Questa versione introduce il nuovo campo `employee_code` nella tabella utenti.

Se stai usando il database SQLite della versione precedente, `create_all()` **non modifica automaticamente** la struttura esistente.
Per sviluppo locale la strada più semplice è cancellare il vecchio database e ripartire:

```bash
backend/shiftlens.db
```

oppure introdurre una migrazione vera con Alembic.

## Logica di estrazione

La pipeline ora è più restrittiva:

1. legge il foglio
2. cerca la **matricola** dell'utente autenticato
3. controlla nome/reparto come segnali secondari
4. salva solo i turni della riga corrispondente
5. blocca il salvataggio se la matricola riconosciuta non coincide

Questo non rende l'estrazione infallibile: una foto storta, sfocata o con matricole illeggibili può ancora fallire. Però evita il problema peggiore, cioè leggere la riga della persona sbagliata.
