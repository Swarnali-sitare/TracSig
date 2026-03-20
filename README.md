# TracSig

TracSig helps students and faculty keep track of assignments in one place.

---

## What you need on your computer

Before you start, install **Node.js** (version 18 or newer). Node.js is free software that lets this project run on your machine.

1. Go to [https://nodejs.org](https://nodejs.org) and download the **LTS** (“Long Term Support”) version for your system.
2. Run the installer and follow the prompts. When it finishes, **npm** is included automatically—you do not need to install anything else for that.

**How to check it worked:** Open a terminal (Command Prompt on Windows, or Terminal on Mac/Linux), type `node --version`, and press Enter. You should see a version number like `v20.x.x`.

---

## How to run TracSig (two windows)

TracSig has two parts: a **backend** (the server) and a **frontend** (what you see in the browser). You run both at the same time, using **two separate terminal windows or tabs**.

### Step 1 — Install the project files (do this once)

Open a terminal, go to the folder where you saved this project, then run these commands one after the other:

```bash
cd backend
npm install
```

```bash
cd ../frontend
npm install
```

The first time, this may take a few minutes. It downloads the pieces the app needs to run. You only need to repeat this if you delete those folders or get a fresh copy of the project.

---

### Step 2 — Start the backend (first terminal)

1. Open a terminal and go to the `backend` folder inside the project.
2. Create a settings file by copying the example:

   ```bash
   cp env.example .env
   ```

3. Open the new file named `.env` in a text editor. Find the lines for **`JWT_ACCESS_SECRET`** and **`JWT_REFRESH_SECRET`**. Replace the placeholder text with **two long random phrases** (at least 32 characters each). You can use a password manager or type random letters and numbers—they just need to be secret and hard to guess.

4. Save the file.

5. Start the server:

   ```bash
   npm run dev
   ```

Leave this terminal **open** while you use the app. The server address is **http://localhost:4000** (that means “this computer, port 4000”). If you open [http://localhost:4000/health](http://localhost:4000/health) in a browser and see a short “ok” style message, the backend is running.

---

### Step 3 — Start the website (second terminal)

1. Open a **new** terminal (keep the first one running).
2. Go to the `frontend` folder:

   ```bash
   cd path/to/TracSig/frontend
   ```

   Replace `path/to/TracSig` with the real location of the project on your computer.

3. Start the site:

   ```bash
   npm run dev
   ```

4. The terminal will show a link, usually **http://localhost:5173**. Open that link in **Chrome, Firefox, or Edge**.

You should see the TracSig interface. Log in and sign-up screens may work with **demo-style behavior** on your computer (not always the full server login until the app is fully connected to the backend).

---

### Quick checklist

| Step | What to do |
|------|----------------|
| 1 | Install Node.js (LTS) from nodejs.org |
| 2 | Run `npm install` in `backend`, then in `frontend` |
| 3 | Copy `backend/env.example` to `backend/.env` and fill in the two long secrets |
| 4 | Terminal A: in `backend`, run `npm run dev` |
| 5 | Terminal B: in `frontend`, run `npm run dev` |
| 6 | Browser: open **http://localhost:5173** |

---

## If something goes wrong

- **“Command not found” for `node` or `npm`:** Node.js is not installed correctly, or the terminal was opened before you finished installing. Close the terminal, open a new one, and try again.
- **Port already in use:** Another program is using the same port. Close other copies of this app or change the port in the backend `.env` file (ask a developer if you are unsure).
- **Blank page or errors in the browser:** Make sure **both** terminals are still running (backend and frontend) and you used the address the frontend terminal printed (usually port **5173**).

---

## Optional: building for production

This is only needed if you are **deploying** the app to a real server, not for everyday use on your own computer.

- **Website:** In the `frontend` folder, run `npm run build`. The built files appear in the `frontend/dist` folder.
- **Server:** In the `backend` folder, run `npm run build`, then `npm start`.

---

## More technical details

For deeper notes on authentication and the API, see [SETUP.md](./SETUP.md). If you connect the UI to the Express auth API, use the role mapping in [`frontend/src/app/types/apiRoles.ts`](./frontend/src/app/types/apiRoles.ts) so signup/JWT roles stay **`Student` / `Teacher` / `Admin`** on the backend while the app keeps using **student / faculty / admin** in the browser.
