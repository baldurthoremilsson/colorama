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
const FADE_TIME = 100;

const randomGenerator = (seed) => {
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const boardSeed_el = document.querySelector("#board-seed");
    const getSize = () => document.querySelector("#size-selector").value.split("x");
    const getPicker = () => {
        let boardSeed = boardSeed_el.value;
        let random = Math.random;
        if(boardSeed.length !== 0) {
            random = randomGenerator(0);
            boardSeed.split("").map(letter => letter.charCodeAt()).forEach(num => {
                let seed = num + random() * 1000;
                random = randomGenerator(seed);
            });
        }
        return array => array[Math.floor(random() * array.length)];
    }
    const board = new Board(
        document.querySelector("#game"),
        document.querySelector("#controls"),
        document.querySelector("#click-counter")
    );
    const colorama = new Colorama(getSize, getPicker, COLORS, board);
    colorama.initialize();
    window.colorama = colorama;


    document.querySelector("#new-game").addEventListener("click", event => colorama.initialize());
    document.querySelector("#random-game").addEventListener("click", event => {
        let randomString = Math.random().toString(16).substring(2, 10);
        boardSeed_el.value = randomString;
        colorama.initialize();
    })
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

    array() {
        return Object.values(this.positions);
    }
}


class GreedySolverState {
    constructor(state, history) {
        this.state = state;
        this.history = history;
        this.tilesLeft = state.tilesLeft;
        this.children = null;
    }

    step() {
        if(this.children === null) {
            this.children = [];
            let colors = new Set();
            this.state.frontier.array().forEach(pos => colors.add(this.state.getColor(pos)));

            for(let color of colors) {
                let child = this.state.child(color);
                let history = [...this.history, color];
                this.children.push(new GreedySolverState(child, history));
            }
        } else {
            for(let child of this.children) {
                child.step();
            }
        }
    }

    minPath() {
        let min = {
            path: [this],
            tilesLeft: this.tilesLeft,
        };

        if(this.children === null) {
            return min;
        }

        for(let child of this.children) {
            let childPath = child.minPath();
            if(childPath.tilesLeft < min.tilesLeft) {
                min = {
                    path: [this, ...childPath.path],
                    tilesLeft: childPath.tilesLeft,
                };
            }
        }
        return min;
    }
}


class GreedySolver {
    constructor(colorama, lookahead) {
        this.lookahead = lookahead || 1;
        this.root = new GreedySolverState(colorama, []);

        for(let i = 0; i < this.lookahead; i++) {
            this.root.step();
        }
    }

    solve() {
        while(true) {
            let minPath = this.root.minPath();
            window.minPath = minPath;
            if(minPath.tilesLeft === 0) {
                let lastState = minPath.path.pop();
                return lastState.history;
            }
            this.root = minPath.path[1];
            this.root.step();
        }
    }
}


class Colorama {
    constructor(sizeCallback, pickerCallback, colors, board) {
        this.sizeCallback = sizeCallback
        this.pickerCallback = pickerCallback;
        this.height = 0;
        this.width = 0;
        this.colors = colors;
        this.board = board;
        this.tiles = null;
        this.frontier = null;
        this.color = null;
        this.clicks = 0;
        this.parent = null;
        this.tilesLeft = 0;
    }

    initialize() {
        let size = this.sizeCallback();
        let picker = this.pickerCallback();
        this.width = size[0];
        this.height = size[1];
        this.tiles = {};
        for(let i = 0; i < this.height; i++) {
            for(let j = 0; j < this.width; j++) {
                this.tiles[new Pos(i,j)] = picker(this.colors);
            }
        }
        this.tilesLeft = this.width * this.height;
        let startPos = new Pos(0,0);
        let color = this.getColor(startPos);
        this.color = null;
        this.removeColor(startPos);
        this.frontier = new Frontier(...this.neighbors(startPos));
        this.pick(color);
        this.clicks = 0;

        this.board.initialize(this);
    }

    initializeChild(parent) {
        this.parent = parent;
        this.width = parent.width;
        this.height = parent.height;
        this.tilesLeft = parent.tilesLeft;
        this.tiles = {};
        this.color = parent.color;
        this.frontier = new Frontier(...parent.frontier.array());
        this.clicks = parent.clicks;
    }

    getColor(pos) {
        if(this.tiles.hasOwnProperty(pos)) {
            return this.tiles[pos];
        }
        if(this.parent !== null) {
            return this.parent.getColor(pos);
        }
        return null;
    }

    removeColor(pos) {
        if(this.getColor(pos) !== null) {
            this.tiles[pos] = null;
            this.tilesLeft--;
        }
    }

    pick(color) {
        if(this.color === color) {
            return;
        }
        this.color = color;
        const stack = this.frontier;
        this.frontier = new Frontier();
        while(!stack.isEmpty()) {
            let pos = stack.pop();
            if(this.getColor(pos) === color) {
                this.removeColor(pos);
                stack.push(...this.neighbors(pos));
            } else if(this.getColor(pos) !== null) {
                this.frontier.push(pos);
            }
        }
        this.clicks += 1;
    }

    child(color) {
        const child = new Colorama(
            this.sizeCallback,
            this.pickerCallback,
            this.colors,
            this.board
        );
        child.initializeChild(this);
        child.pick(color);
        return child;
    }

    neighbors(pos) {
        return pos.neighbors().filter(pos => (
            pos.x >= 0 && pos.x < this.width &&
            pos.y >= 0 && pos.y < this.height &&
            this.getColor(pos) !== null
        ));
    }
}


class Board {
    constructor(table_el, controls_el, click_counter_el) {
        this.table_el = table_el;
        this.controls_el = controls_el;
        this.click_counter_el = click_counter_el;
        this.interactive = false;
        this.colorama = null;
    }

    initialize(colorama) {
        this.colorama = colorama;
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
        this.table_el.style.transitionDuration = `${FADE_TIME}ms`;

        while(this.controls_el.lastChild) {
            this.controls_el.removeChild(this.controls_el.lastChild);
        }

        for(let color of colorama.colors) {
            let button = document.createElement("span");
            button.classList.add("button");
            button.style.backgroundColor = color;
            button.addEventListener("click", event => {
                if(!this.interactive) {
                    return;
                }
                this.interactive = false;
                this.setColor(color);
                colorama.pick(color);
                setTimeout(() => {
                    this.updateTiles()
                    this.interactive = true;
                }, FADE_TIME);
            });
            this.controls_el.appendChild(button);
        }

        this.click_counter_el.innerHTML = `Skref: 0`;
        this.interactive = true;
    }

    setColor(color) {
        this.table_el.style.backgroundColor = color;
    }

    updateTiles() {
        let row_els = this.table_el.querySelectorAll("tr");
        for(let y = 0; y < this.colorama.height; y++) {
            let row_el = row_els[y];
            for(let x = 0; x < this.colorama.width; x++) {
                let color = this.colorama.getColor(new Pos(x, y));
                let cell_el = row_el.childNodes[x];
                cell_el.style.backgroundColor = color;
            }
        }

        this.click_counter_el.innerHTML = `Skref: ${this.colorama.clicks}`;
    }
}