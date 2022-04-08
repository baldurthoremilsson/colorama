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
        this.tiles = null;
        this.frontier = null;
        this.color = null;
        this.clicks = 0;
        this.interactive = false;
    }

    initialize() {
        let size = this.sizeCallback();
        this.width = size[0];
        this.height = size[1];
        this.tiles = {};
        for(let i = 0; i < this.height; i++) {
            for(let j = 0; j < this.width; j++) {
                this.tiles[new Pos(i,j)] = random(this.colors);
            }
        }
        let startPos = new Pos(0,0);
        this.color = this.tiles[startPos];
        this.tiles[startPos] = null;
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
                let pos = stack.pop();
                if(this.tiles[pos] === color) {
                    this.tiles[pos] = null;
                    stack.push(...this.neighbors(pos));
                } else if(this.tiles[pos] !== null) {
                    this.frontier.push(pos);
                }
            }
            this.interactive = true;
        }, 100);
        this.clicks += 1;
    }

    neighbors(pos) {
        return pos.neighbors().filter(pos => (
            pos.x >= 0 && pos.x < this.width &&
            pos.y >= 0 && pos.y < this.height &&
            this.tiles[pos] !== null
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

        for(let y = 0; y < colorama.height; y++) {
            let row = document.createElement("tr");
            for(let x = 0; x < colorama.width; x++) {
                let col = document.createElement("td");
                col.style.backgroundColor = colorama.tiles[new Pos(x, y)];
                row.appendChild(col);
            }
            this.table_el.appendChild(row);
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
        for(let y = 0; y < colorama.height; y++) {
            let row_el = row_els[y];
            for(let x = 0; x < colorama.width; x++) {
                let color = colorama.tiles[new Pos(x, y)];
                let cell_el = row_el.childNodes[x];
                cell_el.style.backgroundColor = color;
            }
        }

        this.click_counter_el.innerHTML = `Skref: ${colorama.clicks}`;
    }
}