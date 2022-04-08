const HEIGHT = 10;
const WIDTH = 10;
const COLORS = [
    "red",
    "yellow",
    "green",
    "blue",
    "purple",
    "orange",
    "pink",];x=[
    "black",
    "gray",
    "white",
    "brown",
    "mediumspringgreen",
    "olive",
    "seagreen",
    "maroon",
    "magenta",
    "darkslateblue",
    "firebrick"
];
const random = array => array[Math.floor(Math.random() * array.length)];

document.addEventListener("DOMContentLoaded", () => {
    const getSize = () => document.querySelector("#size-selector").value.split("x");
    const board = new Board(
        document.querySelector("#game"),
        document.querySelector("#controls"),
        document.querySelector("#click-counter")
    );
    const colorama = new Colorama(getSize, COLORS, board);
    colorama.initialize();


    document.querySelector("#new-game").addEventListener("click", event => colorama.initialize());
    document.querySelector("#size-selector").addEventListener("change", event => colorama.initialize());
});


class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return `${this.x}:${this.y}`;
    }

    neighbors() {
        let up = new Pos(this.x, this.y-1);
        let down = new Pos(this.x, this.y+1);
        let left = new Pos(this.x-1, this.y);
        let right = new Pos(this.x+1, this.y);
        return [up, down, left, right];
    }
}

class Frontier {
    constructor(...positions) {
        this.positions = {};
        this.push(...positions);
    }

    push(...positions) {
        for(let pos of positions) {
            this.positions[pos] = pos;
        }
    }

    pop() {
        const key = Object.keys(this.positions).pop()
        const value = this.positions[key];
        delete this.positions[key];
        return value;
    }

    isEmpty() {
        return Object.keys(this.positions).length === 0;
    }
}


class Colorama {
    constructor(sizeCallback, colors, board) {
        this.sizeCallback = sizeCallback
        this.height = 0;
        this.width = 0;
        this.colors = colors;
        this.board = board;
        this.tiles = [];
        this.frontier = null;
        this.color = null;
        this.clicks = 0;
        this.interactive = false;
    }

    initialize() {
        let size = this.sizeCallback();
        this.width = size[0];
        this.height = size[1];
        this.tiles = [];
        for(let i = 0; i < this.height; i++) {
            let row = []
            for(let j = 0; j < this.width; j++) {
                row.push(random(this.colors));
            }
            this.tiles.push(row);
        }
        let startPos = new Pos(0,0);
        this.color = this.tiles[startPos.x][startPos.y];
        this.tiles[startPos.x][startPos.y] = null;
        this.frontier = new Frontier(...this.neighbors(startPos));
        this.interactive = true;
        this.pick(this.color, true);
        this.clicks = 0;

        this.board.initialize(this);
    }

    pick(color, init) {
        if(!this.interactive) {
            return;
        }
        if(this.color === color && !init) {
            return;
        }
        this.interactive = false;
        this.color = color;
        setTimeout(() => {
            const stack = this.frontier;
            this.frontier = new Frontier();
            while(!stack.isEmpty()) {
                let tile = stack.pop();
                if(this.tiles[tile.x][tile.y] === color) {
                    this.tiles[tile.x][tile.y] = null;
                    stack.push(...this.neighbors(tile));
                } else if(this.tiles[tile.x][tile.y] !== null) {
                    this.frontier.push(tile);
                }
            }
            this.interactive = true;
        }, 100);
        this.clicks += 1;
    }

    neighbors(tile) {
        return tile.neighbors().filter(tile => (
            tile.x >= 0 && tile.x < this.width &&
            tile.y >= 0 && tile.y < this.height &&
            this.tiles[tile.x][tile.y] !== null
        ));
    }
}


class Board {
    constructor(table_el, controls_el, click_counter_el) {
        this.table_el = table_el;
        this.controls_el = controls_el;
        this.click_counter_el = click_counter_el;
    }

    initialize(colorama) {
        while(this.table_el.lastChild) {
            this.table_el.removeChild(this.table_el.lastChild);
        }

        for(let row of colorama.tiles) {
            let row_el = document.createElement("tr");
            for(let tile of row) {
                let col_el = document.createElement("td");
                col_el.style.backgroundColor = tile;
                row_el.appendChild(col_el);
            }
            this.table_el.appendChild(row_el);
        }

        this.table_el.style.backgroundColor = colorama.color;

        while(this.controls_el.lastChild) {
            this.controls_el.removeChild(this.controls_el.lastChild);
        }

        for(let color of colorama.colors) {
            let button = document.createElement("span");
            button.classList.add("button");
            button.style.backgroundColor = color;
            button.addEventListener("click", event => {
                colorama.pick(color);
                this.update(colorama);
            });
            this.controls_el.appendChild(button);
        }

        this.click_counter_el.innerHTML = `Skref: 0`;
    }

    update(colorama) {
        this.table_el.style.backgroundColor = colorama.color;

        let row_els = this.table_el.querySelectorAll("tr");
        for(let i = 0; i < colorama.tiles.length; i++) {
            let row = colorama.tiles[i];
            let row_el = row_els[i];
            for(let j = 0; j < row.length; j++) {
                let color = row[j];
                let cell_el = row_el.childNodes[j];
                cell_el.style.backgroundColor = color;
            }
        }

        this.click_counter_el.innerHTML = `Skref: ${colorama.clicks}`;
    }
}