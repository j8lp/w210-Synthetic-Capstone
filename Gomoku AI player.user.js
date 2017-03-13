// ==UserScript==
// @name         Gomoku AI player
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       You
// @include			*boardgamearena.com*
// @grant        none
// @run-at document-end
// ==/UserScript==

var gamedatas_clone;

function extendFunction(t,f_orig,f_extend){
    return function(){
        f_orig.apply(t,arguments);
        f_extend.apply(t,arguments);
    };
}



function handleLog(log_entry){
    if(typeof(log_entry) == "string"){
        log_entry = JSON.parse(log_entry);
    }

    if(log_entry && log_entry.data){
        for (var i in log_entry.data){
            var event = log_entry.data[i];
            if(!event.type || !event.args){ continue;}
            var args = event.args;

            switch(event.type){
                case "updatePlayerTableStatus":
                case "playerstatus":
                case "tableDecision":
                case "yourturnack":
                case "tableInfosChanged":
                    break;
                case "gameStateChange":
                    if (args.type === "activeplayer" && args.active_player === gameui.player_id){
                        myTurn();
                    }
                    break;   
                default:
                    updateClone(event.type,args);
                    break;

            }
        }    
    }
}

function myTurn(){
    if (typeof gameui === "undefined") {
        alert("gameui is null");
    } else{
        if(gameui.getActivePlayerId() == gameui.player_id){
            var xhr = new XMLHttpRequest();
            var game_name = gameui.game_name;
            var action = "playStone";
            var gameURL = "/"+game_name+"/"+game_name+"/"+action + ".html";
            var args = computer_move();
            console.log("sending args");
            console.log(args);
            var response = gameui.ajaxcall(gameURL,args,
                                           this,function(){
                console.log("Error");
                console.log(arguments);
            }, function() {
                console.log("Success");

                console.log(arguments);
            });

        }
    }

}


function colorToHex(color) {
    // Convert any CSS color to a hex representation
    // Examples:
    // colorToHex('red')            # '#ff0000'
    // colorToHex('rgb(255, 0, 0)') # '#ff0000'
    var rgba, hex;
    var cvs, ctx;
    cvs = document.createElement('canvas');
    cvs.height = 1;
    cvs.width = 1;
    ctx = cvs.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    rgba = ctx.getImageData(0, 0, 1, 1).data;
    hex = [0,1,2].map(
        function(idx) { return ('0'+rgba[idx].toString(16)).slice(-2); }
    ).join('');
    return "#"+hex;
}

// The above returns "rgb(R, G, B)" on IE9/Chrome20/Firefox1

function data_transform_to_model(){
    var playercolor = "#" + gamedatas_clone.players[gameui.player_id].color;
    var data_transform_stone =  function(stone){
        if (!stone.stone_color)  return 0;
        var stonecolor = colorToHex(stone.stone_color);
        if (stonecolor === playercolor) return 1;
        return -1;};

    var stones = [];
    for (var i in gamedatas_clone.intersections){
        var stone = gamedatas_clone.intersections[i];
        var gameStateArgs = gameui.gamedatas.gamestate.args;
        //If tournamentOpening rule is in effect, skip illegal opening spaces
        if (gameStateArgs && gameStateArgs.tournamentOpening){
            var size = Math.sqrt(Object.keys(gameui.gamedatas.intersections).length);
            var middle = Math.floor(size/2);
            var diff_x = Math.abs(stone.coord_x - middle);
            var diff_y = Math.abs(stone.coord_y - middle);
            //First player plays center
            if ((gameStateArgs.numberOfStones == "0" && (diff_x ||diff_y)) ||
                //Second player plays next to first player
                (gameStateArgs.numberOfStones == "1" && (diff_x > 1 || diff_y > 1)) ||
                //First player now must play at least 3 spaces away from center (although typically people play exactly 3 spaces away from center) 
                (gameStateArgs.numberOfStones == "2" && ( Math.max(diff_x,diff_y) != 3))){
                continue;
            }
        }
        stones[i] = data_transform_stone(stone);
    }
    console.log(stones);
    return stones;


}

function data_transform_from_model(i) {
    return gamedatas_clone.intersections[i];
}

function computer_move() {

    var i, j, k, l, m, n, position, type, line, total_cells, consecutive_cells, empty_sides, best_score,
        cell_score, direction_score, score;

    var board_size = 19;
    var board = data_transform_to_model();
    // iterate through all the board's cells
    for (i = board_size * board_size + 1; i--;) {

        // skip to next cell if this cell is owned by the computer or marked to skip
        if (board[i] == 1 || board[i] === undefined) continue;

        // by default, the best move is the first free cell
        // (position, attack, defense)
        else if (board[i] === 0 && undefined === best_score) best_score = [i, 0, 0];

        // we will give a "score" to the position, based on its surroundings horizontally, vertically and
        // on both diagonals; for example: for a row like 000XXPXX000 (where "0" means empty, "X" represents
        // the opponent's pieces and "P" is the position for which we are determining the "score", we would
        // check 0|00XXP|XX000, 00|0XXPX|X000, 000|XXPXX|000, 000X|XPXX0|00, 000XX|PXX00|0, and then we would
        // do the same on the vertical, and on both diagonals)

        // cell's default score (attack and defense)
        cell_score = [0, 0];

        // the 4 directions to check: vertical, horizontal, diagonal /, diagonal \ (in this order)
        for (j = 4; j--;) {

            // the default score for the direction we're checking
            direction_score = [0, 0];

            // check the 5 possible outcomes, as described above
            // (if we're checking whether the player won, we'll do this iteration only once, checking for 5 in a row)
            for (k = (!board[i] ? 5 : 1); k--;) {

                // initialize the type of cells we're looking for,
                // and the array with the cells on the current direction
                type = board[i] || undefined; line = [];

                // check the 5 pieces for each possible outcome, plus the 2 sides
                for (l = 7; l--;) {

                    // used to compute position
                    m = -5 + k + l;
                    n = i % board_size;

                    if (

                        // vertical
                        ((j === 0 &&
                          (position = i + (board_size * m)) !== false &&
                          n == position % board_size) ||

                         // horizontal
                         (j == 1 &&
                          (position = i + m) !== false &&
                          ~~(position / board_size) == ~~(i / board_size)) ||

                         // diagonal /
                         (j == 2 &&
                          (position = i - (board_size * m) + m) !== false &&
                          ((position > i && position % board_size < n) ||
                           (position < i && position % board_size > n) ||
                           position == i)) ||

                         // diagonal \
                         (j == 3 &&
                          (position = i + (board_size * m) + m) !== false &&
                          ((position < i && position % board_size < n) ||
                           (position > i && position % board_size > n)) ||
                          position == i)) &&

                        // the position is not off-board
                        position >= 0 && position < board_size * board_size &&

                        // the cell is of the same type as the ones we are looking for
                        // or, we are checking the score for an empty cell, the current position is empty,
                        // or is "undefined" (meaning we didn't yet find any non-empty cells)
                        (board[position] == type || (!board[i] && (!board[position] || undefined === type)) ||

                         // or we're just checking the sides
                         !l || l == 6)

                    ) {

                        // add position to the line
                        line.push(position);

                        // if we're not just checking the sides,
                        // this is not an empty cell, and is of the same type as the ones we're looking for,
                        // update the type of cells we're looking for
                        // (we use ^ instead of !=)
                        if (l && l ^ 6 && undefined === type && board[position]) type = board[position];

                        // if the computed position is off-board, but this is a side-cell, save it as "undefined"
                    } else if (!l || l == 6) line.push(undefined);

                    // skip the rest of the test if we found this row to be "non-compliant"
                    // (a different type of cell than the ones we're looking for, one of the 5 cells is off-board)
                    else break;

                }

                // if we added exactly 7 position to our line, and the line is not containing *only* empty cells
                if (line.length == 7 && undefined !== type) {

                    // if we are checking whether the player won, set this flag so that later on we do not
                    // overwrite the value of the cell
                    m = (board[i] ? true : false);

                    // calculate the score when setting the current cell to the same type as the other ones we found
                    board[i] = type;

                    // calculate the number of consecutive cells we get like this
                    // (we'll do this by looking in our "line" array)
                    consecutive_cells = 0; total_cells = 0; empty_sides = 0;

                    // the total number of cells of the same type
                    for (l = 5; l--;) if (board[line[l + 1]] == type) total_cells++;

                    // look to the left of the current cell
                    for (l = line.indexOf(i) - 1; l >= 0; l--)

                        // if the cell is of the same type, increment the number of consecutive cells
                        if (board[line[l]] == type) consecutive_cells++;

                    // otherwise
                        else {

                            // if the adjacent cell is empty, increment the number of empty sides
                            // we have to use === 0 (instead of !) because it can also be "undefined"
                            if (board[line[l]] === 0) empty_sides++;

                            // don't look further
                            break;

                        }

                    // look to the right of the current cell
                    for (l = line.indexOf(i); l < line.length; l++)

                        // if the cell is of the same type, increment the number of consecutive cells
                        if (board[line[l]] == type) consecutive_cells++;

                    // otherwise
                        else {

                            // if the adjacent cell is empty, increment the number of empty sides
                            // we have to use === 0 (instead of !) because it can also be "undefined"
                            if (board[line[l]] === 0) empty_sides++;

                            // don't look further
                            break;

                        }

                    // give a score to the row based on the array below (number of cells/empty sides)
                    score = [[0, 1], [2, 3], [4, 12], [10, 64], [256, 256]][consecutive_cells >= total_cells ? Math.min(consecutive_cells, 5) - 1 : total_cells - 1][consecutive_cells >= total_cells ? (empty_sides ? empty_sides - 1 : 0) : 0];

                    // reset the cell's value (unless we are looking to see if the player won)
                    if (!m) board[i] = 0;

                    // if the player won, update the score
                    else if (score >= 256) score = 1024;

                    // if, so far, this is the best attack/defense score (depending on the value of "type")
                    // for this direction, update it
                    if (score > direction_score[type - 1]) direction_score[type - 1] = score;

                }

            }

            // update the cell's attack and defense score
            // (we simply sum the best scores of all 4 directions)
            for (k = 2; k--;) cell_score[k] += direction_score[k];

        }

        // used below
        j = cell_score[0] + cell_score[1];
        k = best_score[1] + best_score[2];

        if (

            // cell's attack + defense score is better than the current best attack and defense score
            (j > k ||

             // or, cell's score is equal to the best score, but computer's move is better or equal to the player's,
             // and the current best move is not *exactly* the same
             (j == k && cell_score[0] >= best_score[1])) &&

            // we're checking the score of an empty cell, or we're checking to see if the player won and he won
            // (we don't update the score when checking if the player won *unless* the player actually won)
            (board[i] === 0 || cell_score[1] >= 1024)

            // update best score (position, attack, defense)
        ) best_score = [i, cell_score[0], cell_score[1]];

    }
    // unless player won, play the best move
    return data_transform_from_model(best_score[0]);
}



// TODO Make this function generic to all games, not just gomoku
function updateClone(eventType,args){
    if(eventType === "stonePlayed" && gameui.game_name === "gomoku"){
        for (var i in gamedatas_clone.intersections){
            var space = gamedatas_clone.intersections[i];
            if (space.coord_x == args.coord_x && space.coord_y == args.coord_y){
                space.stone_color = args.color;
                break;
            }
        }
    }
}

(function() {
        'use strict';

    //Run script after 5 sseconds.  It's a hack, but will fix later
    window.setTimeout(function(){
    if (!gameui) {
        return;
    }
    gamedatas_clone = JSON.parse(JSON.stringify(gameui.gamedatas));
    gameui.notifqueue.onNotification = extendFunction(gameui.notifqueue,gameui.notifqueue.onNotification,handleLog);
    myTurn();
    }, 5000);
})();