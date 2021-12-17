
"use strict";
// if testing = true, some names will be typed in advance to make testing faster
let testing = true;

const Direction = {
    CW: 0,
    CCW: 1
}

const CardColor = {
    Red: "Red",
    Green: "Green",
    Yellow: "Yellow",
    Blue: "Blue",
    Wild: "Wild",
    Black: "Black"
};

const CardFace = {
    Zero: 0,
    One: 1,
    Two: 2,
    Three: 3,
    Four: 4,
    Five: 5,
    Six: 6,
    Seven: 7,
    Eight: 8,
    Nine: 9,
    Draw2: 10,
    Skip: 11,
    Reverse: 12,
    Draw4: 13,
    ChangeColor: 14
};

// setting player as object
let players = [{
    Name: null,
    Score: null,
    Cards: [{
        Color: CardColor.Wild,
        Value: CardFace.Zero,
        Score: 0
    }]
}];

// setting server response as object
let serverState = {
    id: null,
    TopCard: null,
    Player: null,
    NextPlayer: null,
    chosenColor: null,
    direction: Direction.CW
};

// setting up Modal Choose Color
let chooseColorState = {
    Dialog: null,
    Card: null,
    show: null
}

// setting up WinnerDialog
let winnerDialog = null;

// to save old Top Card
let oldTopCard = null;

// initializes game when clicking on Start Button
function initializeGame() {
    document.getElementById('start-button')
        .addEventListener('click', function () {
            showPlayerNameInput();
        });
}

// SETTING UP NAMES
// shows Modal where you type players name, checks if they're unique, transfers names into divs
function showPlayerNameInput() {
    let playerInputDialog = new bootstrap.Modal(document.getElementById('playerNames'));
    playerInputDialog.show();

    // autocompleting names for testing
    if (testing) {
        document.getElementById("player-input-0").value = "BugsBunny";
        document.getElementById("player-input-1").value = "RogerRabbit";
        document.getElementById("player-input-2").value = "WhiteRabbit";
        document.getElementById("player-input-3").value = "Thumper";
    }

    // submit form
    document.getElementById('playerNamesForm')
        .addEventListener('submit', function (evt) {
            let names = getPlayerNames();

            if (uniqueNames(names)) {
                initPlayers(names);
                setupPlayersUI();

                // creating new elements to put player names
                const p1p = document.createElement("p");
                document.querySelector("#player-name-0").appendChild(p1p);

                // changing background image
                let a = document.getElementById("background");
                a.style = "background-image: url('img/backgrounds/PLAYGROUND_NEU.jpg')"
                let b = document.getElementById("start-button");
                b.style = "display: none";
                evt.preventDefault();

                playerInputDialog.hide();

                // start Game
                startGameServer(false).then();
            } else {
                evt.preventDefault();
            }
        });
}

// returns player names
function getPlayerNames() {
    return [document.getElementById("player-input-0").value, document.getElementById("player-input-1").value, document.getElementById("player-input-2").value, document.getElementById("player-input-3").value];
}

// checks whether names are unique
function uniqueNames(names) {
    if (checksNamesNotEmpty(names)) {
        return false;
    }

    for (let i = 0; i < names.length - 1; i++) {
        for (let j = i + 1; j < names.length; j++) {
            if (names[i] === names[j]) {
                alert("Namen müssen einzigartig sein!");
                return false;
            }
        }
    }

    return true;
}

// ensures the name fields are not empty
function checksNamesNotEmpty(names) {
    for (let i = 0; i < names.length; i++) {
        if (names[i] === "") {
            alert("Bitte vier Namen eingeben!")
            console.log(names)
            return true;
        }
    }

    console.log("vier Namen wurden eingegeben!")
    return false;
}

// initialized players with names, score 0 and empty arrays
function initPlayers(names) {
    players = [{
        Name: names[0], Score: 0, Cards: []
    }, {
        Name: names[1], Score: 0, Cards: []
    }, {
        Name: names[2], Score: 0, Cards: []
    }, {
        Name: names[3], Score: 0, Cards: []
    }];
}

// creates elements for players in UI
function setupPlayersUI() {
    for (let playerId = 0; playerId <= 3; playerId++) {
        const b1 = document.createElement("div");
        b1.className = "back";
        const p1p = document.createElement("p");
        let p1pText = document.createTextNode(players[playerId].Name);
        p1p.appendChild(p1pText);
        document.querySelector("#player-name-" + playerId).appendChild(b1);
        b1.appendChild(p1p);
    }
}
// --SETTING UP NAMES

// starts game. if first time, restart = false. if restarting, restart = true
async function startGameServer(restart = false) {
    let response = await fetch("http://nowaunoweb.azurewebsites.net/api/Game/Start", {
        method: "POST",
        body: JSON.stringify([players[0].Name, players[1].Name, players[2].Name, players[3].Name]),
        headers: {
            "Content-type": "application/json; charset=UTF-8",
        }
    });

    if (response.ok) {
        let result = await response.json();

        // save server response
        saveStartGameServerResponse(result);
        // setup UI only once: for first game
        if (!restart) {
            setupUI();
        }
        proceedToNextPlayer();
        // update all elements on User Interface
        updateUI();

    } else {
        alert("HTTP-Error: " + response.status);
    }
}

// saves response from start game request
function saveStartGameServerResponse(result) {
    if (testing) {
        console.log(result);
    }

    serverState.id = result.Id;
    serverState.TopCard = result.TopCard;
    serverState.chosenColor = result.TopCard.Color;

    if (serverState.TopCard.Value === CardFace.Reverse) {
        reverseDirection();
    }

    console.log("topCard at beginning: " + serverState.TopCard);

    for (let playerId = 0; playerId <= 3; playerId++) {
        players[playerId].Cards = result.Players[playerId].Cards;
        players[playerId].Cards.sort(compareCard);
        players[playerId].Score = result.Players[playerId].Score;
    }

    serverState.Player = result.Player;
    serverState.NextPlayer = result.NextPlayer;
}

// compares card to sort player arrays
function compareCard(a, b) {
    if (a.Color < b.Color) {
        return 1;
    }
    if (a.Color > b.Color) {
        return -1;
    }
    return 0;
}

// saves player and nextPlayer into variable
function proceedToNextPlayer() {
    if (serverState.NextPlayer == null) {
        alert("serverState.nextPlayer undefined, cannot switch");
    }

    serverState.Player = serverState.NextPlayer;
    serverState.NextPlayer = null;
}

// SETTING UP USER INTERFACE
// set up all elements on User Interface
function setupUI() {
    setupDrawPileUI();
    setupDirectionDonut();
    setupChooseColor();
    setupWinnerDialog();
}

// create elements and show card for Draw Pile
function setupDrawPileUI() {   //Draw Pile
    const drawPile = document.getElementById("draw-pile");
    let img = document.createElement("img");
    img.src = "img/cards/back.png";
    drawPile.appendChild(img);
    drawPile.addEventListener('click', function () {
        animateDrawPile(img);
        drawCardServer().then();
    })
}

// set up visual signal for direction
function setupDirectionDonut() {
    const divWanted = document.getElementById("direction-donut");
    let img = document.createElement("img");
    divWanted.appendChild(img);
}

// set up modal window for choosing color (Wild Card or Draw4)
function setupChooseColor() {
    chooseColorState.Card = null;

    let element = document.getElementById('chooseColor');

    chooseColorState.Dialog = new bootstrap.Modal(element);
    chooseColorState.show = function () {
        chooseColorState.Dialog.show();
    }

    for (const wildColor in CardColor) {
        let element = document.getElementById(wildColor);
        if (element) {
            element.addEventListener('click', function () {
                chooseColorState.Dialog.hide();
                playCardServer(chooseColorState.Card, wildColor).then();
            });
        }
    }
}

// prepare winner modal window
function setupWinnerDialog() {
    document.getElementById("winnerDialog-restart-game")
        .addEventListener('click', function () {
            restartGame();
            winnerDialog.hide();
        });
    document.getElementById("winnerDialog-end-game")
        .addEventListener('click', function () {
            endGame();
            winnerDialog.hide();
        });
}

// restart game if Player wants to play another round
function restartGame() {
    startGameServer(true).then();
}

// end game and return to main window
function endGame() {
    window.location.href = ""
}
// --SETTING UP USER INTERFACE

// UPDATING USER INTERFACE
// update all elements of User Interface after each modification
function updateUI() {
    reCalculateScore();
    updateTopCardUI();
    updateScoreUI();
    showCurrentPlayerUI();
    updateDirectionDonut();
    checkWinner();
}

// recalculate score for each player
function reCalculateScore() {
    for (let playerId = 0; playerId <= 3; playerId++) {
        players[playerId].Score = 0;
        for (let cardId = 0; cardId < players[playerId].Cards.length; cardId++) {
            let card = players[playerId].Cards[cardId];
            players[playerId].Score += card.Score;
        }
    }
}

// update the Top Card in the User Interface
function updateTopCardUI() {
    const discardPile = document.getElementById("discard-pile");
    console.log(oldTopCard);

    discardPile.querySelectorAll('*').forEach(n => n.remove());//https://medium.com/front-end-weekly/remove-all-children-of-the-node-in-javascript-968ad8f120eb

    let oldImg = document.createElement("img");
    let oldCard = getCardImage(oldTopCard, null);
    let oldUrl = "img/cards/"
    oldImg.src = `${oldUrl}${oldCard}.png`;
    discardPile.appendChild(oldImg);

    let img = document.createElement("img");
    let card = getCardImage(serverState.TopCard, serverState.chosenColor);
    let url = "img/cards/"
    img.src = `${url}${card}.png`;
    discardPile.appendChild(img);
}

// replaces image of top card
function getCardImage(card, overwriteColor = null) {
    // overwriteColor : used to change color of top card in case draw4 or wild color was played
    // default : color and value of card
    // switch case: if draw4 or wild color was played.

    if(card === null) {
        return "back";
    }

    switch (card.Value) {
        case CardFace.Draw4:
            if (overwriteColor === null) {
                return "w13";
            } else {
                return "w13" + mapColor(overwriteColor);
            }
        case CardFace.ChangeColor:
            if (overwriteColor === null) {
                return "w14";
            } else {
                return "w14" + mapColor(overwriteColor);
            }
        default:
            return mapColor(card.Color) + card.Value;
    }
}

// translate server response into naming convention for cards in img folder
function mapColor(color) {
    switch (color) {
        case "Red":
            return "r";
        case "Green":
            return "g";
        case "Blue":
            return "b";
        case "Yellow":
            return "y";
        case "Black":
            return "w";
    }
}

// update scores on User Interface
function updateScoreUI() {
    for (let playerId = 0; playerId <= 3; playerId++) {
        const s1 = document.createElement("div");
        s1.className = "back";
        const sp1p = document.createElement("p");
        let sp1pText = document.createTextNode(players[playerId].Score + " Pkt.");
        sp1p.appendChild(sp1pText);

        let scoreDiv = document.querySelector("#player-score" + playerId);
        scoreDiv.querySelectorAll('*').forEach(n => n.remove());//https://medium.com/front-end-weekly/remove-all-children-of-the-node-in-javascript-968ad8f120eb
        scoreDiv.appendChild(s1);
        s1.appendChild(sp1p);
    }
}

// visual signal for who's currently playing -> highligh score in orange and turn cards
function showCurrentPlayerUI() {
    let playerIndex = getCurrentPlayerId();
    console.log("It's now player " + serverState.Player + "' turn (index: " + playerIndex + ")");

    for (let playerId = 0; playerId <= 3; playerId++) {
        let playerScore = document.getElementById(("player-score" + playerId));
        if (playerId === playerIndex) {
            playerScore.classList.add("highlight");
            showPlayerCards(playerId);

        } else {
            playerScore.classList.remove("highlight");
            hidePlayerCards(playerId);
        }
    }
}

// show current player cards
function showPlayerCards(playerId) {
    let cardDiv = document.getElementById("player-cards-" + playerId);
    cardDiv.querySelectorAll('*').forEach(n => n.remove());//https://medium.com/front-end-weekly/remove-all-children-of-the-node-in-javascript-968ad8f120eb

    for (let cardId = 0; cardId < players[playerId].Cards.length; cardId++) {
        let img = document.createElement("img");
        let card = players[playerId].Cards[cardId];
        let cardImg = getCardImage(card);
        let url = "img/cards/";
        img.src = `${url}${cardImg}.png`;
        cardDiv.appendChild(img);

        img.addEventListener('click', function () {
            playCard(card);
        })
    }
}

// hide cards of other players while it's not their turn
function hidePlayerCards(playerId) {
    let cardDiv = document.getElementById("player-cards-" + playerId);
    cardDiv.querySelectorAll('*').forEach(n => n.remove());//https://medium.com/front-end-weekly/remove-all-children-of-the-node-in-javascript-968ad8f120eb


    for (let i = 0; i < players[playerId].Cards.length; i++) {
        let img = document.createElement("img");
        img.src = "img/cards/back.png";
        cardDiv.appendChild(img);
    }
}

// update visual signal for direction
function updateDirectionDonut() {
    const divWanted = document.getElementById("direction-donut");
    let img = divWanted.children[0];

    if (serverState.direction === Direction.CW) {
        img.src = "img/DirectionDonuts/Donut_Clockwise.gif";
    } else {
        img.src = "img/DirectionDonuts/Donut_Counterclockwise.gif";
    }
}

// check who won the game and write their name
function checkWinner() {
    let winnerId = null;
    for (let playerId = 0; playerId <= 3; playerId++) {
        if (players[playerId].Cards.length === 0) {
            winnerId = playerId;
        }
    }
    if (winnerId !== null) {
        let winnerNameDiv = document.getElementById('winner-name');
        winnerDialog = new bootstrap.Modal(document.getElementById('winnerDialog'));
        winnerDialog.show();
        const snd = new Audio("soundfiles/winner.mp3")
        snd.play()
        let winnerName = players[winnerId].Name;
        winnerNameDiv.innerText = winnerName;
    }

}
// --UPDATING USER INTERFACE

// PLAYING CARD
// player plays card, check if card is playable or show error signal
function playCard(card) {

    if (validateCard(card)) {
        let currentPlayerId = getCurrentPlayerId();
        showCorrectCardAnimation(currentPlayerId, card).then();

        if (card.Color === CardColor.Black) {
            showChooseColor(card);

        } else {
            playCardServer(card, "").then();
        }
    } else {
        showCardErrorFeedback(card);
    }
}

// check whether card is playable before sending request to server
function validateCard(card) { //return true if card is allowed to be played
    console.log("validating: " + card);
    let topCard = serverState.TopCard;
    switch (card.Value) {

        case CardFace.Draw4:
            // if Player doesn't have the Color, he can play Draw4
            let noCardWithColor = !playerHasCardWithFittingColor(getCurrentPlayerId(), serverState.chosenColor);
            let draw4onTop = topCard.Value === CardFace.Draw4;
            let changeColorTop = topCard.Value === CardFace.ChangeColor;
            // if TopCard is Draw 4 or Wild card, you can't play a Draw4
            return noCardWithColor
                && !draw4onTop && !changeColorTop;

        case CardFace.ChangeColor:
            // you can always play a Wild Card / ChangeColor
            return true;
        default:
            // if player doesn't play wild card or +4, return the value and color of the card
            return card.Value === topCard.Value
                || card.Color === serverState.chosenColor;

    }
}

// returns true if player has card with fitting color
function playerHasCardWithFittingColor(playerId, color) {
    for (let cardId = 0; cardId < players[playerId].Cards.length; cardId++) {
        if (players[playerId].Cards[cardId].Color === color) {
            return true;
        }
    }

    return false;
}

// returns ID of Current Player
function getCurrentPlayerId() {
    for (let playerId = 0; playerId <= 3; playerId++) {
        if (serverState.Player === players[playerId].Name) {
            return playerId;
        }
    }

    debugger;
    alert("could not find current player");
}


// show modal chooseColor
function showChooseColor(card) {
    chooseColorState.Card = card;
    chooseColorState.show();
}

// if player clicks on a card they're allowed to play, send request to server
async function playCardServer(card, wildColor) {
    let id = serverState.id;
    let value = card.Value;
    let color = card.Color;

    oldTopCard = serverState.TopCard;
    console.log(oldTopCard);

    let url = `http://nowaunoweb.azurewebsites.net/api/Game/PlayCard/${id}?value=${value}&color=${color}&wildColor=${wildColor}`;

    let response = await fetch(url, {
        method: "PUT", headers: {
            "Content-type": "application/json; charset=UTF-8",
        }
    });

    if (response.ok) {
        let result = await response.json();
        console.log("result from playCard");
        console.log(result);

        if (catchError(result) === undefined) {
            let currentPlayerId = getCurrentPlayerId();

            removeOneCardFromPlayer(currentPlayerId, card);

            serverState.TopCard = card;

            if (card.Value === CardFace.Reverse) {
                reverseDirection();
            }

            if (card.Value === CardFace.Skip) {
                const snd = new Audio("soundfiles/cry.wav");
                await snd.play()
            }
            // if +2 or +4 is played, get all cards from server to update them and get the new drawn cards
            if (value === CardFace.Draw2 || value === CardFace.Draw4) {
                const snd = new Audio("soundfiles/evil-laugh.wav");
                await snd.play();
                await updateAllCardsFromServer();
            }

            if (value === CardFace.ChangeColor || value === CardFace.Draw4) {
                serverState.chosenColor = wildColor;
            } else {
                serverState.chosenColor = card.Color;
            }

            proceedToGivenPlayer(result.Player);

            updateUI();
            animateTopCard();

        } else {
            alert("card not played: " + catchError(result));
        }

    } else {
        alert("HTTP-Error: " + response.status);
    }
}

// catches error in server response
function catchError(result) {
    return result.error;
}

// removes the played card from array (in case Player has 2 same cards, only one is removed)
function removeOneCardFromPlayer(playerId, card) {
    let cardId = getCardId(playerId, card);
    players[playerId].Cards.splice(cardId, 1);//https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
}

// returns id of card
function getCardId(playerId, card) {
    for (let cardId = 0; cardId < players[playerId].Cards.length; cardId++) {
        if (players[playerId].Cards[cardId].Color === card.Color && players[playerId].Cards[cardId].Value === card.Value) {
            return cardId;
        }
    }

    alert("card not found");
}

// shows error feedback for 2 seconds if player clicks on card they're not allowed to play
function showCardErrorFeedback(card) {
    const snd = new Audio("soundfiles/nope.ogg")
    const discardPile = document.getElementById("discard-pile");
    discardPile.classList.add("cardPlayedWrong");
    snd.play();

    let playerId = getCurrentPlayerId();
    let cardId = getCardId(playerId, card);
    const wrongCardDiv = document.getElementById('player-cards-' + playerId).children;
    const wrongCard = wrongCardDiv.item(cardId);
    wrongCard.classList.add("cardPlayedWrong");

    setTimeout(() => {
        wrongCard.classList.remove("cardPlayedWrong");
        discardPile.classList.remove("cardPlayedWrong");
    }, 2000);
}

// changes direction if player plays Reverse card
function reverseDirection() {
    if (serverState.direction === Direction.CW) {
        serverState.direction = Direction.CCW;
    } else {
        serverState.direction = Direction.CW
    }
}

// updates all cards from each player
async function updateAllCardsFromServer() {
    for (let playerId = 0; playerId <= 3; playerId++) {
        await getPlayerCardsFromServer(playerId);
    }
}

// gets cards from server for a given player
async function getPlayerCardsFromServer(playerId) {
    let id = serverState.id;
    let name = players[playerId].Name;
    let response = await fetch(`http://nowaunoweb.azurewebsites.net/api/Game/GetCards/${id}?playerName=${name}`, {
        method: "GET", headers: {
            "Content-type": "application/json; charset=UTF-8",
        }
    });

    if (response.ok) {
        let result = await response.json();
        console.log(response);
        console.log(players[playerId]);
        players[playerId].Cards = result.Cards;
        players[playerId].Cards.sort(compareCard);
        players[playerId].Score = result.Score;

    } else {
        alert("HTTP-Error: " + response.status);
    }
}

// saves player and next player
function proceedToGivenPlayer(playerName) {
    serverState.Player = playerName;
    serverState.NextPlayer = null;
}
// --PLAYING CARD

// DRAWING CARD
async function drawCardServer() {
    let response = await fetch("http://nowaunoweb.azurewebsites.net/api/Game/DrawCard/" + serverState.id, {
        method: "PUT",
        headers: {
            "Content-type": "application/json; charset=UTF-8",
        }
    });

    if (response.ok) {
        let result = await response.json();

        let playerId = getCurrentPlayerId()

        players[playerId].Cards.push(result.Card);
        players[playerId].Cards.sort(compareCard);

        serverState.NextPlayer = result.NextPlayer;
        proceedToNextPlayer();
        updateUI();

    } else {
        alert("HTTP-Error: " + response.status);
    }
}

// --DRAWING CARD

// ANIMATIONS
async function showCorrectCardAnimation(currentPlayerId, card) {
    let cardId = getCardId(currentPlayerId, card);
    const correctCardDiv = document.getElementById('player-cards-' + currentPlayerId).children;
    const correctCard = correctCardDiv.item(cardId);
    correctCard.classList.add("bigcard");

    setTimeout(() => {
        correctCard.classList.remove("bigcard");
    }, 2000);
}

function animateDrawPile(img) {
    img.classList.add("bigcard2");
    setTimeout(() => {
        img.classList.remove("bigcard2");
    }, 500);
}

function animateTopCard() {
    const correctCardDiv = document.getElementById('discard-pile').children;
    const correctCard = correctCardDiv.item(1);
    correctCard.classList.add("spin");

    setTimeout(() => {
        correctCard.classList.remove("spin");
    }, 2000);
}
// --ANIMATIONS

initializeGame();
