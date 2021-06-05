dump = function(){
    towers.forEach(t => {
        console.log(t);
    });
    console.log(hand);
}

getTower = function(i){
    return $(`.tower[data-i="${i}"]`);
}

getDisc = function(r){
    return $(`.disc[data-r="${r}"]`);
}

init = function(n){
    towers=[[...Array(n).keys()].reverse(),[],[]];
    hand = null;
    for (let i = 0; i < n; i++) {
        getTower(0).append(`<div data-r="${i}" class="disc" style="width:${i+1}0%;">${i}</div>`);
        
    }
}

lift = function(i){
    if (hand == null){
        if (towers[i].length > 0){
            hand = towers[i].pop();
            getDisc(hand).addClass('lift');
        }
    }
}

drop = function(i){
    if (hand != null)
        if (towers[i][towers[i].length - 1] > hand || towers[i].length == 0){
            towers[i].push(hand);
            disc = getDisc(hand).detach();
            getTower(i).prepend(disc);
            disc.removeClass('lift');
            hand = null;
        }
}
