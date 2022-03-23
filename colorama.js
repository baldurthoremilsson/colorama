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
    const colorama = new Colorama(HEIGHT, WIDTH, COLORS);
    colorama.initialize();

    const board = new Board(
        document.querySelector("#game"),
        document.querySelector("#controls"),
        document.querySelector("#click-counter")
    );
    board.initialize(colorama);

    document.querySelector("#new-game").addEventListener("click", event => {
        colorama.initialize();
        board.initialize(colorama);
    });
});


class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    valueOf() {
        console.log("yolo");
        return `${this.x}x${this.y}`;
    }

    neighbors() {
        let up = new Tile(this.x, this.y-1);
        let down = new Tile(this.x, this.y+1);
        let left = new Tile(this.x-1, this.y);
        let right = new Tile(this.x+1, this.y);
        return [up, down, left, right];
    }
}


class Colorama {
    constructor(height, width, colors) {
        this.height = height;
        this.width = width;
        this.colors = colors;
        this.board = [];
        this.frontier = [];
        this.color = null;
        this.clicks = 0;
    }

    initialize() {
        this.board = [];
        for(let i = 0; i < this.height; i++) {
            let row = []
            for(let j = 0; j < this.width; j++) {
                row.push(random(this.colors));
            }
            this.board.push(row);
        }
        let startPos = new Tile(0,0);
        this.color = this.board[startPos.x][startPos.y];
        this.board[startPos.x][startPos.y] = null;
        this.frontier = this.neighbors(startPos);
        this.pick(this.color);
        this.clicks = 0;
    }

    pick(color) {
        const stack = this.frontier;
        this.frontier = [];
        while(stack.length > 0) {
            let tile = stack.pop();
            if(this.board[tile.x][tile.y] === color) {
                this.board[tile.x][tile.y] = null;
                stack.push(...this.neighbors(tile));
            } else if(this.board[tile.x][tile.y] !== null) {
                this.frontier.push(tile);
            }
        }
        this.color = color;
        this.clicks += 1;
    }

    neighbors(tile) {
        return tile.neighbors().filter(tile => (
            tile.x >= 0 && tile.x < this.width &&
            tile.y >= 0 && tile.y < this.height &&
            this.board[tile.x][tile.y] !== null
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

        for(let row of colorama.board) {
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
        for(let i = 0; i < colorama.board.length; i++) {
            let row = colorama.board[i];
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