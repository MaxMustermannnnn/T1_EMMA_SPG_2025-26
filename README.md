# T1_EMMA_SPG_2025-26

🚗 Fahrzeug-Wartungsbuch - Setup-Anleitung für Team
Willkommen im Team!

Diese Anleitung hilft dir, das Projekt auf deinem Computer einzurichten, damit du mitentwickeln kannst.
✅ Was du brauchst (Voraussetzungen)

    Node.js (Version 20.19 oder höher)

        Download: https://nodejs.org

        Nimm die LTS-Version (empfohlen)

        Nach Installation prüfen: Öffne Terminal/CMD und tippe node -v

    Git (falls noch nicht installiert)

        Download: https://git-scm.com

    GitHub Desktop (optional, aber einfacher)

        Download: https://desktop.github.com

    Code-Editor (z.B. VS Code)

        Download: https://code.visualstudio.com

📥 Schritt 1: Projekt klonen
Mit GitHub Desktop (einfacher):

    Öffne GitHub Desktop

    Klicke auf "Clone a repository"

    Wähle T1_EMMA_SPG_2025-26 aus

    Wähle einen Zielordner (z.B. D:\Programmieren\Git\)

    Klicke auf "Clone"

Mit Terminal/CMD:

text
git clone https://github.com/[USERNAME]/T1_EMMA_SPG_2025-26.git
cd T1_EMMA_SPG_2025-26

🎨 Schritt 2: Frontend einrichten

    Öffne Terminal/CMD (in VS Code: Terminal → New Terminal)

    Gehe in den Frontend-Ordner:

text
cd frontend

Installiere alle Pakete (dauert ca. 30-60 Sekunden):

text
npm install

Starte den Frontend-Server:

    text
    npm run dev

    Teste im Browser:

        Öffne: http://localhost:5173

        Du solltest die Startseite sehen

✅ Frontend läuft jetzt! Lass dieses Terminal-Fenster offen.
⚙️ Schritt 3: Backend einrichten

    Öffne ein NEUES Terminal (das alte mit Frontend läuft weiter!)

    Gehe zurück ins Hauptverzeichnis und dann ins Backend:

text
cd ..
cd backend

(Oder direkt: cd backend wenn du im Hauptordner bist)

Installiere alle Pakete:

text
npm install



Starte den Backend-Server:

    text
    npm run dev

    Teste im Browser:

        Öffne: http://localhost:5000

        Du solltest eine JSON-Nachricht sehen: {"message": "Fahrzeug-Wartungsbuch API", "status": "running"}

✅ Backend läuft jetzt! Lass auch dieses Terminal-Fenster offen.
🎉 Schritt 4: Teste die Verbindung

    Gehe zurück zu: http://localhost:5173

    Du solltest sehen: "✅ Verbunden" (Backend Status)

    Falls "❌ offline": Prüfe, ob Backend auf Port 5000 läuft

🎊 Perfekt! Alles funktioniert - du kannst jetzt entwickeln!
📁 Projektstruktur (zur Orientierung)

text
T1_EMMA_SPG_2025-26/
├── frontend/           # React + Vite + Tailwind
│   ├── src/           # Hier arbeitest du am UI
│   ├── package.json
│   └── ...
├── backend/           # Node.js + Express
│   ├── src/          # Hier arbeitest du an der API
│   ├── .env          # WICHTIG: Niemals ins Git committen!
│   ├── package.json
│   └── ...
└── README.md

🛠️ Täglicher Workflow
Beim Start (jeden Tag):

    Öffne 2 Terminals

    Terminal 1 - Frontend:

text
cd frontend
npm run dev

Terminal 2 - Backend:

    text
    cd backend
    npm run dev

Vor dem Entwickeln:

text
git pull

(Holt die neuesten Änderungen vom Team)
Nach dem Entwickeln:

Mit GitHub Desktop:

    Öffne GitHub Desktop

    Siehst du deine Änderungen links

    Schreibe eine Commit-Nachricht (z.B. "feat: add vehicle form")

    Klicke "Commit to main"

    Klicke "Push origin"

Oder mit Terminal:

text
git add .
git commit -m "feat: deine beschreibung hier"
git push

⚠️ WICHTIGE REGELN

    NIEMALS die .env Datei ins Git committen!

        Steht schon in .gitignore, aber trotzdem aufpassen

        Enthält geheime Database-Zugangsdaten

    Die node_modules/ Ordner NICHT ins Git committen

        Sind automatisch ignoriert

        Werden mit npm install neu erstellt

    Vor dem Pushen immer pullen:

    text
    git pull

    Gute Commit-Nachrichten schreiben:

        ✅ "feat: add vehicle list component"

        ✅ "fix: resolve date formatting bug"

        ❌ "changes" oder "update"

🆘 Häufige Probleme & Lösungen
Problem: npm install funktioniert nicht

Lösung: Prüfe Node.js Version:

text
node -v

Muss mindestens 20.19 sein. Falls älter: Node.js neu installieren.