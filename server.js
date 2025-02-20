const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

const suits = ['★', '♥', '♣', '♠', '♦'];
const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let gameState = {
    round: 1,
    players: {}, // { id: { score: 0, hand: [], name: '' } }
    deck: [],
    discard: [],
    currentPlayer: null
};

let playerCount = 0;

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            playerCount++;
            const assignedName = playerCount === 1 ? 'Dinosaur' :
                playerCount === 2 ? 'Sloth' : data.name || `Player${playerCount}`;
            
            gameState.players[data.playerId] = { score: 0, hand: [], name: assignedName };
            console.log(`${assignedName} joined the game!`);

            if (Object.keys(gameState.players).length === 2) {
                startRound();
            }

            broadcastState();
        }

        if (data.type === 'draw' && data.playerId === gameState.currentPlayer) {
            let card;
            if (data.source === 'deck' && gameState.deck.length > 0) {
                card = gameState.deck.pop();
            } else if (data.source === 'discard' && gameState.discard.length > 0) {
                card = gameState.discard.pop();
            }
            if (card) {
                gameState.players[data.playerId].hand.push(card);
            }
            broadcastState();
        }

        if (data.type === 'discard' && data.playerId === gameState.currentPlayer) {
            const hand = gameState.players[data.playerId].hand;
            const cardIndex = hand.indexOf(data.card);
            if (cardIndex > -1) {
                hand.splice(cardIndex, 1);
                gameState.discard.push(data.card);
                nextPlayer();
            }
            broadcastState();
        }

        if (data.type === 'goOut' && data.playerId === gameState.currentPlayer) {
            if (isValidHand(gameState.players[data.playerId].hand, gameState.round)) {
                endRound(data.playerId);
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid hand to go out' }));
            }
        }
    });
});

function startRound() {
    if (Object.keys(gameState.players).length < 2) {
        console.log("Waiting for at least 2 players to start...");
        return;
    }

    gameState.deck = [];
    for (let i = 0; i < 2; i++) {
        suits.forEach(suit => ranks.forEach(rank => gameState.deck.push(rank + suit)));
        for (let j = 0; j < 3; j++) gameState.deck.push('Joker');
    }
    shuffle(gameState.deck);
    gameState.discard = [gameState.deck.pop()];

    const cardsToDeal = gameState.round + 2;
    Object.values(gameState.players).forEach(player => {
        player.hand = gameState.deck.splice(0, cardsToDeal);
    });

    gameState.currentPlayer = Object.keys(gameState.players)[0];

    console.log("Game has started!");
    broadcastState();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function nextPlayer() {
    const playerIds = Object.keys(gameState.players);
    const currentIndex = playerIds.indexOf(gameState.currentPlayer);
    gameState.currentPlayer = playerIds[(currentIndex + 1) % playerIds.length];
}

function endRound(goingOutPlayer) {
    const scores = {};
    const wild = ranks[gameState.round - 1];

    Object.entries(gameState.players).forEach(([id, player]) => {
        scores[player.name] = calculateScore(player.hand, wild);
        player.score += scores[player.name];
    });

    gameState.round++;
    if (gameState.round > 11) {
        declareWinner();
    } else {
        startRound();
    }

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'endRound', scores }));
        }
    });

    broadcastState();
}

function calculateScore(hand, wild) {
    return hand.reduce((sum, card) => {
        if (card === 'Joker') return sum + 50;
        if (card.startsWith(wild)) return sum + 20;
        const rank = card.slice(0, -1);
        if (rank === 'J') return sum + 11;
        if (rank === 'Q') return sum + 12;
        if (rank === 'K') return sum + 13;
        return sum + parseInt(rank);
    }, 0);
}

function isValidHand(hand, round) {
    const wild = ranks[round - 1];
    const cards = hand.map(card => ({
        rank: card === 'Joker' ? 'Joker' : card.slice(0, -1),
        suit: card === 'Joker' ? null : card.slice(-1),
        isWild: card === 'Joker' || card.startsWith(wild)
    }));

    const books = findBooks(cards);
    const remainingCards = cards.filter(c => !books.some(b => b.includes(c)));
    const runs = findRuns(remainingCards);

    return books.concat(runs).flat().length === cards.length;
}

function findBooks(cards) {
    const rankCount = {};
    cards.forEach(card => {
        rankCount[card.rank] = (rankCount[card.rank] || 0) + 1;
    });
    return Object.entries(rankCount)
        .filter(([_, count]) => count >= 3)
        .map(([rank]) => cards.filter(c => c.rank === rank || c.isWild));
}

function findRuns(cards) {
    const suits = ['★', '♥', '♣', '♠', '♦'];
    const rankOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const runs = [];

    suits.forEach(suit => {
        const suitCards = cards.filter(c => c.suit === suit || c.isWild)
            .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
        let currentRun = [];
        
        for (let i = 0; i < suitCards.length; i++) {
            if (currentRun.length === 0 || 
                (rankOrder.indexOf(suitCards[i].rank) === rankOrder.indexOf(currentRun[currentRun.length - 1].rank) + 1) || 
                suitCards[i].isWild) {
                currentRun.push(suitCards[i]);
            } else if (currentRun.length >= 3) {
                runs.push([...currentRun]);
                currentRun = [suitCards[i]];
            } else {
                currentRun = [suitCards[i]];
            }
        }
        if (currentRun.length >= 3) runs.push(currentRun);
    });
    return runs;
}

function declareWinner() {
    const winner = Object.entries(gameState.players)
        .reduce((min, [id, player]) => player.score < min.score ? player : min);
    console.log(`${winner.name} wins with ${winner.score} points!`);
}

function broadcastState() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'state', state: gameState }));
        }
    });
}

console.log('Server running on port 3000');