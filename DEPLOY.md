# Stepy — Deployment Guide

Deploying Stepy to a VPS: **nginx (static frontend :80) + nginx (API proxy :8000) → uvicorn (127.0.0.1:8080, systemd) → PostgreSQL (127.0.0.1:5432)**, IP-only access (no domain/HTTPS), Linux user `stepy`.

> `stepy` has **no password and no sudo rights** — the VPS needs no changes: SSH in as **root**, run privileged steps as root, and switch with `su - stepy` (no password needed) for user-level steps. See the table below.

## Placeholders used in this guide

| Placeholder | Meaning |
|---|---|
| `YOUR_VPS_IP` | Public IP address of the VPS |
| `DB_PASSWORD` | Generated PostgreSQL password (`openssl rand -hex 16`) |
| `SECRET_KEY` | Generated JWT secret (`openssl rand -hex 32`) |

## Which user runs what

| Step | Run as |
|---|---|
| Step 1 — system packages | **root** |
| Step 2 — PostgreSQL | **root** (`sudo -u postgres` works from root without a password prompt) |
| Steps 3–6 — clone, venv, `src/.env`, first run | **`stepy`** (via `su - stepy`, no sudo needed) |
| Steps 7–9 — systemd, nginx, firewall | **root** |
| Steps 10–12 — hosts.env, smoke test, git pull | **`stepy`** (via `su - stepy`) |

> **Never run steps 3–6 as root**: the clone, venv and config files would end up root-owned, breaking the systemd service (which runs as `stepy`) and later `git pull` (Step 12).

---

## Step 0 — Local repo prep (your machine, then push to main)

### 0.1 Convert UTF-16 `req.txt` to UTF-8 `requirements.txt`

```bash
python -c "from pathlib import Path; Path('requirements.txt').write_text(Path('req.txt').read_text(encoding='utf-16'), encoding='utf-8')"
```

### 0.2 Make `js/api.js` read the API address from `hosts.env`

Replace line 1 of `js/api.js`:

```js
const API_URL = 'http://127.0.0.1:8000'
```

with:

```js
const API_URL = (() => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/hosts.env', false); // same-origin, static file
    xhr.send();
    if (xhr.status === 200) {
      const m = xhr.responseText.match(/^API_URL=(.+)$/m);
      if (m) return m[1].trim();
    }
  } catch (e) {}
  return 'http://127.0.0.1:8000'; // local dev fallback
})();
```

The rest of `js/api.js` stays untouched.

### 0.3 Create `hosts.env` in the project root

```env
API_URL=http://YOUR_VPS_IP:8000
```

> Note: `.gitignore` contains `*.env`, so `hosts.env` must be force-added (`git add -f`). It contains only an IP — no secrets.

### 0.4 Never commit private files

- `message.txt` (personal chat log) — **must NOT go into the repo.** Add it to `.gitignore`:

  ```bash
  echo "message.txt" >> .gitignore
  ```

- `src/.env` (DB password + JWT secret) — already covered by the `*.env` rule in `.gitignore`. Never force-add it.

### 0.5 Commit and push

```bash
git add requirements.txt js/api.js .gitignore
git add -f hosts.env
git commit -m "deployment: requirements.txt, api.js reads hosts.env"
git push origin main
```

---

## Step 1 — VPS system packages (as root)

SSH into the VPS as **root**, then:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-venv python3-pip nginx postgresql ufw git openssl
```

## Step 2 — PostgreSQL database (as root)

```bash
openssl rand -hex 16   # -> use the output as DB_PASSWORD below
sudo -u postgres psql -c "CREATE USER stepy WITH PASSWORD 'DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE stepy OWNER stepy;"
```

> As root, `sudo -u postgres` never prompts for a password — these commands work verbatim. Equivalent without sudo: `runuser -u postgres -- psql -c "..."`.

## Step 3 — Get the code (as `stepy`)

From your root session, switch to `stepy` (no password needed) and stay in this user for Steps 3–6:

```bash
su - stepy
```

```bash
git clone https://github.com/ATLASO4EK/TASKILLS-Stepy.git ~/app
cd ~/app
```

> If the repo is private: clone locally with a token, then
> `rsync -av --exclude .git ./ stepy@YOUR_VPS_IP:~/app/`

## Step 4 — Python environment + dependencies (as `stepy`)

```bash
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

> If pip fails on any pinned version, install unpinned essentials instead:
> `venv/bin/pip install fastapi uvicorn sqlalchemy psycopg python-dotenv PyJWT python-multipart aiosqlite pydantic email-validator`

## Step 5 — Backend config `src/.env` (as `stepy`)

```bash
openssl rand -hex 32   # -> use the output as SECRET_KEY below
cat > src/.env <<EOF
DATABASE_CONN_STRING=postgresql+psycopg://stepy:DB_PASSWORD@127.0.0.1:5432/stepy
SECRET_KEY=SECRET_KEY
EOF
chmod 600 src/.env
```

`postgresql+psycopg://` is the async psycopg3 driver, matching SQLAlchemy 2.x.

## Step 6 — First backend run + create tables (one-time, as `stepy`)

```bash
venv/bin/uvicorn src.main:app --host 127.0.0.1 --port 8080
```

In a second terminal (root is fine for curl):

```bash
curl http://127.0.0.1:8080/docs                    # should return HTML
curl -X POST http://127.0.0.1:8080/setup_database  # creates tables (create_all only)
```

Stop uvicorn with `Ctrl+C`.

> **Warning:** `/setup_database` is only for this one-time table creation. Do not call it again later.

## Step 7 — systemd service (as root)

Leave the `stepy` shell first (`exit`), then:

Create `/etc/systemd/system/stepy-api.service` (`sudo nano /etc/systemd/system/stepy-api.service`):

```ini
[Unit]
Description=Stepy FastAPI backend
After=network.target postgresql.service

[Service]
User=stepy
Group=stepy
WorkingDirectory=/home/stepy/app
ExecStart=/home/stepy/app/venv/bin/uvicorn src.main:app --host 127.0.0.1 --port 8080
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now stepy-api
systemctl status stepy-api   # should be active (running)
```

## Step 8 — nginx (as root)

Create `/etc/nginx/sites-available/stepy`:

```nginx
server {
    listen 80;
    server_name _;
    root /home/stepy/app;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
server {
    listen 8000;                      # public API port
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

> Note: uvicorn binds `127.0.0.1:8080` internally; nginx exposes the API on `:8000`. They must not use the same port (bind conflict).

Enable it:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/stepy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
chmod o+x /home/stepy   # required, otherwise nginx returns 403 on /home/stepy
```

## Step 9 — Firewall (as root)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

## Step 10 — Point the frontend at the API (as `stepy`)

From root: `su - stepy`, then:

```bash
cd ~/app
printf 'API_URL=http://YOUR_VPS_IP:8000\n' > hosts.env
```

Do the same locally and push (`git add -f hosts.env && git commit && git push`).

## Step 11 — Smoke test (from your browser)

Open `http://YOUR_VPS_IP/index.html` in a browser:

1. Register a user → log in
2. Catalog loads without console errors (F12 → Network: requests go to `http://YOUR_VPS_IP:8000/...`)
3. Create a guide with 2 steps → mark steps complete → fork it

If something is broken (run from your **root** session):

```bash
sudo journalctl -u stepy-api -f
tail -f /var/log/nginx/error.log
```

## Step 12 — Wrap-up (as `stepy`)

- Add the live URL to `README.md` (locally)
- Push the deployment artifacts to `main` (hosts.env, this file, README changes — from your local machine)
- On the VPS (as `stepy`): `cd ~/app && git pull`

---

## Architecture recap

```
Browser
  │
  ├─ http://IP/            → nginx :80  → static files from ~/app (index, catalog, editor, guide, css/, js/, img/)
  │                             └─ js/api.js fetches /hosts.env → learns API_URL
  │
  └─ http://IP:8000/...    → nginx :8000 → proxy → uvicorn 127.0.0.1:8080 (systemd: stepy-api)
                                                     └→ PostgreSQL 127.0.0.1:5432 (db: stepy, user: stepy)
```

CORS is covered by `allow_origins=["*"]` in `src/main.py` (the frontend origin `http://IP` differs from the API origin `http://IP:8000`).

## Security checklist

- [x] `src/.env` (DB password, JWT secret) is gitignored — never committed
- [x] `hosts.env` contains only an IP — safe to commit (force-add required)
- [x] `message.txt` and other private files — gitignored, never in the repo
- [x] uvicorn is not exposed directly — only nginx ports 80/8000 are open
- [x] `/setup_database` called exactly once
- [ ] Optional hardening for later: domain + HTTPS (certbot), nginx rate limiting, DB backups
