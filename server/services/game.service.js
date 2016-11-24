var Immutable = require('immutable')
var utils = require('../utils')
var messageService = require('../services/message.service');
var Player = require('../models/player')
var Card = require('../models/card')
var Game = require('../models/game')

const MAX_SCORE = 30
const DECK_AMOUNT = 84
var playerNo = 0;
var game = new Game('starting', '');
var players = Immutable.Map({});
var deck = [];
var players_list = [];

var gameTick = function (data) {

};

var fillDeck = function () {
    var deck = [DECK_AMOUNT];
    for (var i = 0; i < DECK_AMOUNT; i++) {
        deck.push(new Card())
    }
    for (var i = 0; i < DECK_AMOUNT; i++) {
        var card = new Card();
        card.img = utils.generateCardImg(i);
        deck = utils.addCard(card, deck);
    }
    return deck;
};

var returnCardsToDeck = function (cards) {
    for (var i = 0; i < cards.length; i++) {
        deck.push(cards[i]);
    }
}

var startGame = function () {
    if (players.size > 2) {
        if (!game.started) {
            game.started = true;
            deck = fillDeck();
            game.id = utils.createRandomGameId(7)

            utils.dealCards(deck, players, 6);
            players.forEach(function (value, key) {
                players_list.push(value.name);
            })

        }
    }
};

var updateGameStatus = function () {
    if (game.status === 'starting') {
        if (game.started) {
            game.status = 'playing';
        }
    } else if (game.status === 'playing') {
        players.forEach(function (value, key) {
            if (value.score >= MAX_SCORE) {
                game.status = 'over'
            }
        })
    }
    console.log(game.status);
}

var newGame = function () {
    game.status = 'starting';
    game.id = '';
    game.phase = '';
    game.started = false
    players.forEach(function (value, key) {
        value.score = 0;
        value.cards = []
    })
    players_list = [];
};

module.exports = {
    addPlayer: function (io, id, name) {
        var player = new Player({});
        player.name = name;
        player.no = playerNo;
        player.score = 0;
        player.cards = []
        player.handActive = false;
        player.tableActive = false;
        if (0 === playerNo) {
            player.active = true;
        } else {
            player.active = false;
        }
        for (var i = 0; i < players_list.length; i++) {
            if (name === players_list[i] && game.status === 'playing') {
                player.cards = utils.dealCardsForPlayer(deck);
            }
        }
        players = players.set(id, player)
        playerNo++;
        //updateGameStatus();
        //messageService.send(io,players,game,"Add",player)
    },
    removePlayer: function (io, id) {
        var player = players.get(id)
        var removedPlayerNumber = player.no;
        var isRemovedPlayerActive = player.active;
        returnCardsToDeck(player.cards);
        players = players.delete(id);
        playerNo--;
        players.forEach(function (value, key) {
            if (value.no > removedPlayerNumber) {
                value.no = value.no - 1
            }
            if (isRemovedPlayerActive) {
                value.active = true
                isRemovedPlayerActive = false
            }
            players = players.set(key, value)

        })
        // updateGameStatus();
        //   messageService.send(io,players,game,"Remove",player)

    },
    update: function (data) {
        if (game.status === 'playing') {
            if (players.size > 2) {
                gameTick(data);
            }

        } else if (game.status === 'over') {
            newGame();
        } else if (game.status === 'starting' && 'Start' === data.command) {
            startGame();
        }
        updateGameStatus();
    },
    reset: function () {
        newGame();
        console.log("reset")
    },
    started: function () {
        return game.started;
    },
    game: function () {
        return game;
    },
    players: function () {
        return players;
    },
    isPlayerWasInGame: function (name) {
        for (var i = 0; i < players_list.length; i++) {
            if (name === players_list[i]) {
                return true;
            }
        }
        return false;
    }
}