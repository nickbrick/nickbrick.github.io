
dump = function () {
    towers.forEach(t => {
        console.log(t);
    });
    console.log(hand);
}

getTower = function (i) {
    return $(`.tower[data-i="${i}"]`);
}

getDisc = function (r) {
    return $(`.disc[data-r="${r}"]`);
}

init = function (n) {
    towers = [[...Array(n).keys()].reverse(), [], []];
    hand = null;
    for (let i = 0; i < n; i++) {
        width = n > 10 ? (i + 1) * 100 / n : (i + 1) * 10;
        getTower(0).append(`<div data-r="${i}" class="disc ${mode==1?"print":""}" style="width:${width}%;">${i}</div>`);
    }
}

lift = function (i) {
    if (hand == null) {
        if (towers[i].length > 0) {
            hand = towers[i].pop();
            getDisc(hand).addClass('lift');
        }
    }
}

drop = function (i) {
    if (hand != null)
        if (validateDrop(i, hand)) {
            towers[i].push(hand);
            disc = getDisc(hand).detach();
            getTower(i).prepend(disc);
            disc.removeClass('lift');
            hand = null;
            moves++;
        }
}


act = function (i) {
    if (moves == 0) t0 = performance.now();
    if (hand == null)
        lift(i);
    else
        drop(i);
    checkWin();
}

checkWin = function () {
    if ((towers[1].length == n) || (towers[2].length == n)) {
        t1 = performance.now();
        setTimeout(() => {
            alert(`Win. Moves: ${moves}/${minMoves(parseInt(n), mode)} Time: ${Math.round((t1 - t0)) / 1000} s`);
            window.location = window.location;
        }, 10);
    }
}

validateDrop = function (i, hand) {
    if (mode == 0) return (towers[i][towers[i].length - 1] > hand || towers[i].length == 0);
    if (mode == 1) return [...towers[i], hand].reverse().map((x, i) => x >= i).every(x => x == true);
}

minMoves = function (n, mode) {
    if (mode == 0) return 2 ** n - 1;
    if (mode == 1) return n > 2 ? minMoves(n-2, 1)*3+4 : n == 2 ? 3 : 1;
}