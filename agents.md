## Cursor Cloud specific instructions

If you (the setup agent) read this file, you must immediately begin the project refactoring task as defined in the instructions below. The environment setup and initialization phase is NOT considered complete until the full refactoring (Step 1 to 5) is finished.

[System Context]

You are an expert game developer and software architect. Rebuild the existing primitive prototype of "Academia Arena", a 2-player strategic browser-based card game. Read the existing prototype directory to extract the raw material: Card data (Traits, Characters, Events) and Synergy definitions.

[Tech Stack & Architecture]

Use React and TypeScript for the entire application.
Use boardgame.io for the core game logic, state machine, turn/phase management, and move validation.
Use Tailwind CSS and shadcn/ui for building the frontend components.
Plan for eventual multiplayer state synchronization via WebSockets (e.g., PartyKit), but start with local pass-and-play logic using boardgame.io's local setup.

[UI/UX Design Specifications]

Ensure high-quality CJK typography layout.
Rely exclusively on clean lines, solid colors, and subtle native shadow depths. Exclude emojis, glowing effects, and bright/neon palettes.
**Read `DESIGN.md` and the reference images in `docs/stitch/` to understand the visual language (Institutional Brutalism, sharp 90-degree angles, specific color palette, and layering principles).**

[Game Mechanics Integration]

Implement the core rulebook within the boardgame.io setup:
1. Three lanes: Presentations, Assignments, Exams.
2. Random starting Traits allocation (Background, Physiological, Psychological).
3. Dynamic Stamina System: Assign initial Stamina based on the inverse weight of the rolled Traits.
4. Stamina Actions: Provide UI components for players to spend Stamina on "Probability Lock" (guarantees synergy success), "Status Override", and "Draw Card" during their turn.
5. Best-of-3 round system. Ensure hand and Stamina resources persist across rounds.

[Execution Steps]

1. **Extraction**: Parse `index.html` to extract `cardLibrary` and `traitLibrary`. Save them as clean TypeScript constants in `src/data/entities.ts`.
2. **Scaffold**: Initialize the project environment (Non-interactive mode preferred):
   ```bash
   # Initialize Vite (Force install in current directory)
   npm create vite@latest ./ -- --template react-ts
   
   # Install Dependencies
   npm install boardgame.io lucide-react clsx tailwind-merge
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   
   # Initialize shadcn/ui (Use default prompts)
   npx shadcn-ui@latest init -d
   ```
3. **Core Logic**: Build `src/game/game.ts` using `boardgame.io`. Define the `G` state, `moves` (playCard, useStaminaAction, pass), and `phases`.
4. **UI Components**: Create high-fidelity components based on `DESIGN.md` and `screen.png`.
5. **Integration**: Connect the `Board` component to the `boardgame.io` Client.

[Architectural File Structure]

```
Academia-Arena/
├── src/
│   ├── data/
│   │   └── entities.ts       # Extracted card/trait data
│   ├── game/
│   │   ├── game.ts           # boardgame.io Game definition
│   │   └── types.ts          # Game state & Move types
│   ├── components/
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── Arena.tsx         # Main game board container
│   │   ├── Card.tsx          # Specialized brutalist card component
│   │   ├── Lane.tsx          # Presentation/Assignment/Exam containers
│   │   └── StaminaAction.tsx # Stamina-spending interface
│   ├── App.tsx               # Client entry point
│   └── main.tsx
├── DESIGN.md                 # Design system reference
└── agents.md                 # This instruction file
```

Provide the initialization commands and the detailed architectural file structure above to begin.
