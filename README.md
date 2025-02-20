# Five Crowns Online

This is an online multiplayer card game inspired by **Five Crowns**, created for a friend I met on **X** (formerly Twitter). The game is played in real-time using WebSockets, allowing two players to compete in forming valid books and runs to win rounds and achieve the lowest score by the end of the game.

## 🎴 Game Rules
- The game consists of **11 rounds**.
- Each round, players are dealt a number of cards equal to the round number plus 2 (e.g., Round 1 → 3 cards, Round 2 → 4 cards, etc.).
- The **wild card** in each round is the rank that matches the round number (e.g., Round 3 → 3s are wild).
- Players take turns drawing from the **deck** or **discard pile** and then discarding one card.
- A player can **"Go Out"** if all their cards form valid **books (same rank, different suits)** or **runs (same suit, sequential ranks)**.
- When a player goes out, the opponent’s remaining cards are scored based on face values:
  - **Wild cards = 20 points**
  - **Jokers = 50 points**
  - **Face cards (J, Q, K) = 10-13 points**
  - **Number cards = Face value**
- The player with the **lowest score after 11 rounds** wins!

## 🚀 How to Play
### 1️⃣ Setup
- Install **Node.js** and **WebSockets**:
  ```sh
  npm install ws
  ```
- Run the server:
  ```sh
  node server.js
  ```
- Open `index.html` in two browser tabs or share the game with a friend.

### 2️⃣ Playing
- The game will wait for **two players** before starting.
- Players take turns drawing and discarding cards.
- If a player forms a complete **book** or **run**, the **"Go Out"** button will appear.
- Clicking **"Go Out"** ends the round, and scores update.
- The game continues for **11 rounds**, and the lowest scorer wins!

## 🎨 Features
✅ **Real-time multiplayer** with WebSockets.  
✅ **Dynamic UI updates** to reflect card changes.  
✅ **Automatic score tracking** across rounds.  
✅ **Custom card suits & colors** for a unique feel.  

## 👥 Credits
This game was made as a fun project for a friend I met on **X**. Hope you enjoy playing it! 🚀

---
✨ Happy playing! 🎴

