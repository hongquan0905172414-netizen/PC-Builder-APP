# Setup — Beginner Guide

Welcome! This guide is written for people who have **never coded
before**. If you already know what a terminal is and how `npm` works,
you can skim. If you don't — read every line. It's all explained.

By the end of this guide you'll have RIG running on your own laptop.

---

## What we're about to do, in plain English

To work on RIG, your computer needs three things:

1. **Node.js** — the engine that runs RIG's code. Think of it like the
   "player" that opens our code, the way Spotify is the player that
   opens music files. We'll install it once.

2. **Git** — a tool that tracks changes to code, and lets multiple
   people work on the same project without overwriting each other.
   Think of it like Google Docs' version history, but for code.

3. **A code editor** — the program where you actually look at and edit
   the code. We'll use VS Code (it's free).

Then we'll **download the RIG project** to your computer, **install
the project's dependencies** (the libraries RIG needs to run), and
**start the project** so you can see it in your web browser.

---

## Step 1 — Install Node.js

Node.js is what runs RIG's code on your computer.

1. Go to [nodejs.org](https://nodejs.org)
2. Click the big green button that says **"LTS"** (Long Term Support).
   This downloads an installer file.
3. Open the file you downloaded. It'll be a normal installer like any
   other app — click Next, Next, Agree, Install. Use all the defaults.
4. When it's done, **close any terminal windows you have open** and
   open a fresh one. (We'll show you how to open a terminal in Step 4.)

You'll know it worked when, in the terminal, typing `node --version`
shows a version number like `v20.11.0` or higher.

---

## Step 2 — Install Git

Git is what we use to share code with the team.

**On Mac:**
- Open the Terminal app (it's in Applications → Utilities)
- Type `git --version` and press Enter
- If Git isn't installed, Mac will automatically offer to install it.
  Say yes. This may take a few minutes.

**On Windows:**
- Go to [git-scm.com/download/win](https://git-scm.com/download/win)
- Download and run the installer
- Click Next through all the screens (defaults are fine)

---

## Step 3 — Install VS Code

This is the program you'll use to look at and edit RIG's files.

1. Go to [code.visualstudio.com](https://code.visualstudio.com)
2. Download for your OS (Mac or Windows)
3. Install it like any other app

---

## Step 4 — Open the terminal

The terminal is a text-based way to give commands to your computer.
It looks scary but it's just a place where you type commands.

**On Mac:**
- Press `Cmd + Space` to open Spotlight
- Type "Terminal" and press Enter

**On Windows:**
- Press the Windows key
- Type "PowerShell" and press Enter
- (PowerShell is Windows' version of the terminal)

You'll see a window with some text and a blinking cursor. That's where
you type commands.

**Test that Node.js installed correctly:**

Type this and press Enter:

```
node --version
```

You should see something like `v20.11.0`. If you see "command not
found," Node.js didn't install correctly — close the terminal, open a
new one, and try again. Still broken? Ask Quân.

---

## Step 5 — Download the RIG project

This is called "cloning the repo." It downloads RIG's code from
GitHub to your computer.

1. **Pick where you want the project to live.** A common choice is a
   `Projects` folder inside your home folder. To get there in the
   terminal, type:

   ```
   cd ~
   mkdir Projects
   cd Projects
   ```

   `cd` means "change directory" (move into a folder). `mkdir` means
   "make directory" (create a folder). `~` is shorthand for your home
   folder.

2. **Get the repo URL from Quân.** It'll look like
   `https://github.com/[someone]/rig.git`

3. **Clone the repo:**

   ```
   git clone https://github.com/[someone]/rig.git
   ```

   (Replace the URL with the real one Quân gives you.)

   This downloads RIG into a folder called `rig` inside your Projects
   folder.

4. **Move into the project folder:**

   ```
   cd rig
   ```

---

## Step 6 — Install the project's dependencies

RIG uses other people's code libraries to work (React, Next.js,
Tailwind, etc.). These aren't included in the repo because they'd
take up too much space. You install them with one command.

Make sure your terminal is inside the `rig` folder (Step 5.4), then
type:

```
npm install
```

This will take 1-3 minutes and print a lot of text. That's normal.
When it's done, you'll see a new folder called `node_modules` in your
project — that's where all the downloaded libraries live. Don't worry
about it, it's automatic.

**If you see warnings (yellow text), that's usually fine.** If you see
errors (red text), copy the error and ask Quân.

---

## Step 7 — Run RIG

```
npm run dev
```

After a few seconds you'll see something like:

```
▲ Next.js 15.0.0
- Local: http://localhost:3000
```

**Open your web browser** and go to:

```
http://localhost:3000
```

You should see a page that says "RIG — Skeleton in place. Nothing
built yet." 🎉

**That's it. RIG is running on your computer.**

To stop it, go back to the terminal and press `Ctrl + C`.

---

## Step 8 — Open the project in VS Code

So you can actually see and edit the code:

1. Open VS Code
2. File → Open Folder
3. Pick the `rig` folder from your Projects folder
4. You'll see the whole project in the left sidebar

---

## Daily workflow

After the first-time setup, this is what working on RIG looks like
each day:

```
cd ~/Projects/rig    # go into the project folder
git pull             # get the latest code from teammates
npm run dev          # start the project running
```

Then open `http://localhost:3000` in your browser and work in VS
Code. Changes you make in the code show up in the browser
automatically.

When you're done, stop the server with `Ctrl + C`.

---

## Making changes — the Git workflow

Once you start contributing code, you'll use Git to share it. The
flow:

1. **Make a branch** (your own copy to work in, so you don't mess up
   the main version):

   ```
   git checkout -b feature/whatever-you-are-doing
   ```

   The name should describe what you're doing. Examples:
   `feature/add-cpu-data`, `fix/typo-in-readme`,
   `feature/home-screen-card`.

2. **Make your changes** in VS Code. Save the files.

3. **Save your changes to Git:**

   ```
   git add .
   git commit -m "describe what you did"
   ```

   The message should be a short description, like "added 5 Intel CPUs
   to parts catalog."

4. **Push to GitHub** (upload your changes):

   ```
   git push -u origin feature/whatever-you-are-doing
   ```

5. **Open a Pull Request on GitHub.** Go to the repo on GitHub.com,
   you'll see a yellow banner offering to make a PR from your branch.
   Click it, write a quick description, submit. Quân (or someone)
   reviews it, then merges it into the main project.

**Important: never push directly to `main`.** Always use a branch and
a Pull Request. This is how the team avoids breaking things.

---

## Using Claude Code

Claude Code is an AI coding assistant that runs in your terminal. It
can read RIG's files, write code, and explain things. Great for
learning.

**Install it:**

```
npm install -g @anthropic-ai/claude-code
```

(`-g` means "install it globally on your computer," not just inside
this one project.)

**Use it:** open a terminal, navigate to the RIG folder
(`cd ~/Projects/rig`), and type:

```
claude
```

It'll start a conversation. Ask it anything — "what is this project?",
"how does the rules engine work?", "help me add a button to the home
page." It automatically reads the `CLAUDE.md` file in the project, so
it has full context.

**Important when learning:** when Claude writes code for you, **try to
understand what it wrote** before pasting it in. Ask follow-up
questions: "why did you use `useState` here?" "what does this line
do?" That's how you actually learn instead of just copy-pasting.

---

## When you get stuck

Coding is mostly about getting stuck and unstuck. It's normal. Here's
the order to try:

1. **Read the error message carefully.** Most error messages tell you
   exactly what's wrong. They look intimidating, but read them slowly.
2. **Google the error.** Copy the error message into Google. Almost
   every error has been hit by someone before.
3. **Ask Claude Code.** Paste the error, ask "what does this mean and
   how do I fix it?"
4. **Ask in the team chat.** No question is too small.
5. **Ask Quân.**

Don't sit stuck for more than 20-30 minutes without asking for help.
That's a rule.

---

## Glossary — terms you'll hear

- **Terminal / command line / shell** — the text-based window where
  you type commands.
- **Repo / repository** — a project tracked by Git. The RIG project
  is a repo.
- **Clone** — download a repo from GitHub to your computer.
- **Commit** — save a snapshot of your changes to Git.
- **Push** — upload your commits to GitHub.
- **Pull** — download other people's commits from GitHub.
- **Branch** — your own separate copy of the code where you can work
  without affecting the main version.
- **PR / Pull Request** — a proposal to merge your branch into `main`.
  Reviewed by teammates before merging.
- **Dependencies** — other people's code libraries that RIG uses.
- **`npm`** — the Node Package Manager. The tool you use to install
  dependencies and run project commands.
- **`localhost:3000`** — your own computer, acting as a web server,
  on port 3000. Only you can see it. This is where RIG runs while
  you're developing it.

---

That's everything. Welcome to the project. 🚀
