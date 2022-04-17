function game() {
  const xy = [
    "0-0",
    "1-0",
    "2-0",
    "3-0",
    "0-1",
    "1-1",
    "2-1",
    "3-1",
    "0-2",
    "1-2",
    "2-2",
    "3-2",
    "0-3",
    "1-3",
    "2-3",
    "3-3",
  ];

  return {
    best: JSON.parse(
      localStorage.getItem("best-score") ?? '{"normal": 0, "lucky": 0 }'
    ),
    score: { normal: 0, lucky: 0 },
    luckyMode: false,

    cells: [],
    xDown: null,
    yDown: null,

    reset() {
      this.cells = [];
    },

    move(dir, axe) {
      let rows = [...this.cells]
        .reduce(
          (p, c) => {
            p[axe === "x" ? c.y : c.x].push({ ...c });
            return p;
          },
          [[], [], [], []]
        )
        .map((r) =>
          r.sort((p, v) => (dir === -1 ? p[axe] > v[axe] : p[axe] < v[axe]))
        );

      let _possible = xy;
      let _has_moved = false;
      let _best_cell = 0;

      for (let row of rows) {
        let _index = dir === -1 ? 0 : 3;
        let _moved = new Set();

        for (let x = 0; x < 4; x++) {
          let cell = row[x];
          let prevCell = row[x - 1];
          if (!cell) continue;
          _best_cell += cell.number;

          while (dir === -1 ? cell[axe] > _index : cell[axe] < _index) {
            _has_moved = true;
            cell[axe] = cell[axe] + dir;
          }
          _index = cell[axe] - dir;

          if (!prevCell) continue;

          if (cell.number === prevCell.number && !_moved.has(prevCell.id)) {
            cell[axe] = prevCell[axe];
            cell.number *= 2;
            _index = prevCell[axe] - dir;
            _moved.add(cell.id);
            _has_moved = true;

            delete row[x - 1];
          }
        }
      }

      this.score[this.luckyMode ? "lucky" : "normal"] = _best_cell;

      if (this.best[this.luckyMode ? "lucky" : "normal"] < _best_cell) {
        this.best[this.luckyMode ? "lucky" : "normal"] = _best_cell;
        localStorage.setItem("best-score", JSON.stringify(this.best));
      }

      let flatRows = rows.flat(2);
      let hashRow = Object.fromEntries(flatRows.map((r) => [r.id, r]));

      for (let i = 0; i < this.cells.length; i++) {
        if (hashRow[this.cells[i].id]) {
          if (this.cells[i].class === "spawn") {
            this.cells[i].class = "";
          }

          if (hashRow[this.cells[i].id].x !== this.cells[i].x) {
            this.cells[i].x = hashRow[this.cells[i].id].x;
          } else {
            this.cells[i].y = hashRow[this.cells[i].id].y;
          }

          if (hashRow[this.cells[i].id].number !== this.cells[i].number) {
            this.cells[i].number = hashRow[this.cells[i].id].number;
            this.cells[i].class = "bubble";

            setTimeout(() => {
              if (this.cells[i]) this.cells[i].class = "";
            }, 250);
          } else {
            this.cells[i].class = "";
          }
        } else {
          this.cells.splice(i, 1);
          i--;
        }
      }

      if (!_has_moved) return;

      _possible = _possible.filter(
        (e) => !flatRows.map((cell) => `${cell.x}-${cell.y}`).includes(e)
      );

      this.spawn(_possible);
    },

    spawn(_possible = xy) {
      if (_possible.length === 0) return;

      let index = Math.floor(Math.random() * _possible.length);
      let [x, y] = _possible[index].split("-").map((e) => parseInt(e));

      this.cells.push({
        number: this.luckyMode ? 2048 : 1,
        x,
        y,
        class: "spawn",
        id: Date.now(),
      });
    },

    init() {
      this.spawn();
    },

    touchStart(e) {
      let { clientX, clientY } = e.touches[0];

      this.xDown = clientX;
      this.yDown = clientY;
    },

    handleTouch(e) {
      if (!this.xDown || !this.yDown) return;

      let xUp = e.touches[0].clientX;
      let yUp = e.touches[0].clientY;

      let xDiff = this.xDown - xUp;
      let yDiff = this.yDown - yUp;

      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
          // left
          this.move(-1, "x");
        } else {
          // right
          this.move(1, "x");
        }
      } else {
        if (yDiff > 0) {
          // up
          this.move(-1, "y");
        } else {
          // down
          this.move(1, "y");
        }
      }

      this.xDown = null;
      this.yDown = null;
    },

    handleMove(e) {
      switch (e.key) {
        case "d":
        case "ArrowRight":
          this.move(1, "x");
          break;

        case "a":
        case "ArrowLeft":
          this.move(-1, "x");
          break;

        case "s":
        case "ArrowDown":
          this.move(1, "y");
          break;

        case "w":
        case "ArrowUp":
          this.move(-1, "y");
          break;

        default:
          console.log("use directional keys or wasd");
      }
    },
  };
}
