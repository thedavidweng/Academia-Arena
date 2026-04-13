## 🏫 Introduction
**Academia Arena** is a two-player strategic card game inspired by *Gwent* and *Hearthstone*, where players battle for academic dominance in a university-themed battlefield. This project is a passion-driven board game prototype created for a German Media Studies course GMST 475 and is now available as an open-source project.

[English](readme.md) | [简体中文](readme.zh-CN.md)

<div align="center">
  <a href="https://thedavidweng.github.io/Academia-Arena/" target="_blank">
    <img src="https://img.shields.io/badge/Start%20Game-Play%20Now-brightgreen?style=for-the-badge&logo=githubpages" alt="Start Game Button">
  </a>
</div>

## 📖 Game Rulebook
[Check the Game Rulebook](assets/game-handbook.pdf) for detailed rules and mechanics.

## 🧑‍🎨 Designer Statement
[Read the Designer Statement](assets/designer-statement.md) to see how this game engages with the frameworks of the GMST 475 course.

## 🎥 Game Intro Video

[![Introducing Academia Arena](https://img.youtube.com/vi/TH1QRsdxSWI/0.jpg)](https://www.youtube.com/watch?v=TH1QRsdxSWI)

---

## 🧠 Core Concept
Academia Arena revolves around deploying Character and Event cards across three Academic Fields:
- **Presentations**
- **Assignments**
- **Exams**

Players accumulate **Credits** (points) and activate abilities through strategic placement and trait-based synergies.

---

## 🧬 Trait System
At the beginning of the game, each player is randomly assigned a unique combination of three **Traits**:
- **Background**: e.g., Domestic, International, Minority
- **Physiological**: e.g., Gym Bro, Skinny Nerd, Physically Impaired
- **Psychological**: e.g., ADHD, Tourette's, Depression

These traits affect gameplay through passive buffs or active abilities that shape each match’s strategy. The system evaluates the implicit strength of the trait combination; weaker combinations receive a higher initial **Stamina** reserve.

---

## 🎴 Card Types

### Character Cards
- Represent students, faculty, or staff
- Core source of Credits
- Credit value varies depending on Academic Field placement

### Event Cards
- Trigger immediate effects
- Discarded after use

### Card Synergy
- Special effects when compatible cards are played side-by-side
- Example: Two "Rich International Kid" cards can trigger the *Essay Ghostwriting* synergy

---

## ⚡ Stamina System
Stamina is a core resource used to manipulate outcomes or optimize player performance:
- **Probability Lock (2 Stamina)**: Consumes 2 Stamina to force a positive outcome for random card synergies (e.g., locking a 50% chance to double credits).
- **Status Suppression (1 Stamina)**: Consumes 1 Stamina to negate one's own negative trait effects for the current turn.
- **Resource Exchange (3 Stamina)**: Consumes 3 Stamina to draw an extra card from the deck.

---

## 🕹️ Game Flow
1. **Start**: Each player receives Traits and a hand of cards
2. **Turn Actions**:
   - Play a Card & Resolve (can optionally declare **Probability Lock**)
   - Execute **Status Suppression** or **Resource Exchange**
   - Pass
3. **End of Round**:
   - Triggered when both players pass
   - Calculate total Credits to determine winner of the round (called a *Semester*)
4. **Victory**:
   - First player to win **2 Semesters** wins the game (*Academic Year*)

---

## 🗂️ Resource Management
Players don’t fully redraw each round, and **remaining Stamina carries over** between semesters—careful planning and resource conservation are key. You might have to **sacrifice a semester** to **win the war**.

---

## 🔧 Installation & Usage
This is currently a design prototype. You can try out the live prototype to experience the gameplay, but please be aware that the game logic is not complete and cannot run fully.
