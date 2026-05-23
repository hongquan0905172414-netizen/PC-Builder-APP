# Setup — Beginner Guide

Written for people who have **never coded before**. Read every line if
that's you. By the end you'll have the project running on your laptop.

---

## What we're doing

The project has two parts:
- A **backend** (in the `server` folder) — runs with Express.
- A **frontend** (in the `client` folder) — the website, built with
  React.

Both run on your computer at the same time, in two terminal windows.

To do any of this, your computer needs **Node.js** (runs the code),
**Git** (shares code with the team), and a **code editor** (VS Code).

---

## Step 1 — Install Node.js

1. Go to [nodejs.org](https://nodejs.org)
2. Click the big **"LTS"** button to download the installer.
3. Run it. Click Next / Agree / Install — all defaults are fine.

## Step 2 — Install Git

- **Mac:** open the Terminal app, type `git --version`, press Enter.
  If Git isn't installed, Mac offers to install it — say yes.
- **Windows:** download from
  [git-scm.com/download/win](https://git-scm.com/download/win) and run
  the installer (defaults are fine).

## Step 3 — Install VS Code

Download from [code.visualstudio.com](https://code.visualstudio.com)
and install it.

---

## Step 4 — Open a terminal

The terminal is where you type commands.

- **Mac:** press `Cmd + Space`, type "Terminal", press Enter.
- **Windows:** press the Windows key, type "PowerShell", press Enter.

Test that Node.js works — type this and press Enter:
```
node --version
```
You should see a version number like `v20.x.x`.

---

## Step 5 — Download the project

```
cd ~
mkdir Projects
cd Projects
git clone https://github.com/hongquan0905172414-netizen/PC-Builder-APP.git
cd PC-Builder-APP
```

(`cd` = go into a folder. `mkdir` = make a folder. `git clone` =
download the project from GitHub.)

---

## Step 6 — Install and run the BACKEND

In your terminal, from inside the project folder:

```
cd server
npm install
npm run dev
```

`npm install` downloads what the backend needs (takes a minute).
`npm run dev` starts the backend. You should see:
```
Server running on http://localhost:3001
```

**Leave this terminal open and running.** The backend stays on while
you work.

---

## Step 7 — Install and run the FRONTEND

Open a **second** terminal window (don't close the first one).

- **Mac Terminal:** `Cmd + N` for a new window.
- **Windows PowerShell:** open another PowerShell window.

In the new terminal:

```
cd ~/Projects/PC-Builder-APP/client
npm install
npm run dev
```

You should see a message with a URL like `http://localhost:3000`.

**Open that URL in your web browser.** You should see a page that
says "PC Builder — Skeleton in place." 🎉

---

## Step 8 — Open the project in VS Code

1. Open VS Code
2. File → Open Folder
3. Choose the `PC-Builder-APP` folder

---

## Daily workflow

Each time you work on the project:

```
cd ~/Projects/PC-Builder-APP
git pull                 # get teammates' latest changes
```

Then two terminals: one runs `cd server && npm run dev`, the other
runs `cd client && npm run dev`. Work in VS Code. Stop a server with
`Ctrl + C`.

---

## Sharing your work — the Git workflow

1. Make a branch:
   ```
   git checkout -b feature/what-you-are-doing
   ```
2. Make changes in VS Code, save the files.
3. Save to Git:
   ```
   git add .
   git commit -m "short description of what you did"
   ```
4. Push to GitHub:
   ```
   git push -u origin feature/what-you-are-doing
   ```
5. On GitHub.com, open a Pull Request. Someone reviews it, then it
   gets merged.

Avoid pushing straight to `main` — always use a branch and a PR.

---

## Running the tests

The frontend has a testing tool (Vitest) set up. To run tests, from
the `client` folder:
```
npm test
```
Right now there's just one example test that checks `1 + 1 === 2` —
it's only there to prove the testing tool works. Real tests get
written later, once there's real code worth testing.

---

## Using Claude Code (optional, good for learning)

Install it once:
```
npm install -g @anthropic-ai/claude-code
```
Run it from inside the project folder:
```
claude
```
It reads `CLAUDE.md` automatically, so it knows about the project.
Ask it questions, have it help with code — and try to understand the
code it gives you, don't just paste it.

Note: when committing, don't add AI co-author lines to commit
messages — commits should be credited to you.

---

## When you get stuck

1. Read the error message slowly — it usually says what's wrong.
2. Google the error.
3. Ask Claude Code.
4. Ask the team chat.
5. Ask Quân.

Don't stay stuck more than ~30 minutes without asking.

---

## Quick glossary

- **Terminal** — the window where you type commands.
- **Backend / server** — the part in `/server`, runs with Express.
- **Frontend / client** — the part in `/client`, the website.
- **Repo** — the project, tracked by Git.
- **Clone** — download the repo.
- **Commit** — save a snapshot of your changes.
- **Push / pull** — upload / download changes to/from GitHub.
- **Branch** — your own copy of the code to work in safely.
- **PR (Pull Request)** — a request to merge your branch into `main`.
- **npm** — the tool that installs dependencies and runs commands.
- **localhost:3000 / 3001** — your own computer acting as a server.
  3000 is the frontend, 3001 is the backend.
