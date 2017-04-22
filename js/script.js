"use strict";
const container = document.querySelector("#container"),
    search = document.querySelector("#searchbar"),
    button = document.querySelector("button");

const config = new Config(container);

const getCols = () => Array.from(document.querySelectorAll(".column")),
    columnChildren = col => col.firstChild.childNodes[1].childNodes;

const item = document.querySelector("#new-item"),
    protocol = document.querySelector("select"),
    url = document.querySelector("#url"),
    name = document.querySelector("#name");

const COL_MAX = 4,
    ITEM_MAX = 10,
    CHAR_MAX = [18, 25]

button.onclick = function (e) {
    button.disabled = true;

    const cols = getCols();
    cols.map(function (col) {
        col.classList.add("editable");

        if (columnChildren(col).length < ITEM_MAX) {
            col.onclick = function (e) {
                e.stopPropagation();
                columnClick(e, col, cols, newItem);
            };
        }
    });

    if (cols.length < COL_MAX) {
        e.stopPropagation();
        document.addEventListener("click", newColumn);
    }
};

search.onkeypress = e => {
    if (e.keyCode == 13) {
        let url = "http://",
            query = search.value.trim();

        if (query.includes(" ") || query.includes(",") ||
            !query.includes(".") && query.indexOf("localhost") < 0) {
                url += "google.com/search?q=";
        }

        window.open(url + query, "_self");
    }
};

name.maxLength = Column.icons ? CHAR_MAX[0] : CHAR_MAX[1];

function columnClick(e, col, cols, callback, row) {
    name.maxLength = CHAR_MAX[0];

    let selectedColumn = null;
    for (let i = 0; i < cols.length; i++) {
        cols[i].onclick = () => false;
        cols[i].firstChild.firstChild.onclick = () => false;

        if (col == cols[i]) {
            selectedColumn = config.columns[i];
            continue;
        } else {
            cols[i].classList.remove("editable");
        }
    }

    if (row) {
        callback(selectedColumn, row);
    } else {
        callback(selectedColumn);
    }
}

function clear() {
    item.style.display = "none";
    document.querySelector("#delete").style.display = "none";

    protocol.selectedIndex = 0;
    url.value = name.value = "";

    url.required = true;

    name.maxLength = Column.icons ? CHAR_MAX[0] : CHAR_MAX[1];

    button.disabled = false;
}

function clearColumnClick() {
    const once = function (e) {
        e.stopPropagation();

        if (e.target == document.documentElement) {
            item.style.display = "none";
            document.querySelector("#delete").style.display = "none";

            document.removeEventListener(e.type, once);
            getCols().map(function (col) {
                col.classList.remove("editable");
                col.onclick = () => false;
                col.firstChild.firstChild.onclick = () => false;
            });

            name.value = "";

            button.disabled = false;
        }
    };

    document.addEventListener("click", once);
}

function newColumn() {
    document.removeEventListener("click", newColumn);

    protocol.style.display = "none";
    url.style.display = "none";
    url.required = false;

    item.style.display = "flex";

    document.querySelector("form").onsubmit = function (e) {
        e.preventDefault();

        config.addColumn(name.value.trim());
        name.value = "";

        const col = config.columns[config.columns.length - 1];
        col.column.onclick = function (e) {
            e.stopPropagation();

            clear();
            columnClick(e, col.column, getCols(), newItem);
        };

        col.column.classList.add("editable");
        config.localize();

        if (getCols().length == COL_MAX) {
            clear();
        }
    };

    clearColumnClick();
}

function changeColumn(col) {
    name.value = "";

    protocol.style.display = "none";
    url.style.display = "none";

    url.required = false;

    item.style.display = "flex";
    document.querySelector("#delete").style.display = "initial";

    document.querySelector("form").onsubmit = function (e) {
        e.preventDefault();

        const trimmed = name.value.trim();
        const replace = {};

        for (const key in config.config) {
            if (key == col.header.innerHTML) {
                replace[trimmed] = config.config[key];
            } else {
                replace[key] = config.config[key];
            }
        }

        config.config = replace;

        config.localize();
        col.header = trimmed;
    };

    document.querySelector("#delete").onclick = function (e) {
        for (let i = 0; i < config.columns.length; i++) {
            if (config.columns[i].header.innerHTML == col.header.innerHTML) {
                config.columns.splice(i, 1);
            }
        }

        delete config.config[col.header.innerHTML];
        col.column.parentNode.removeChild(col.column);

        col.reload();
        config.localize();

        clear();
    }

    clearColumnClick();
}

function newItem(col) {
    document.removeEventListener("click", newColumn);
    item.classList.remove("new-column");

    item.style.display = "flex";
    protocol.style.display = "initial";
    url.style.display = "initial";

    document.querySelector("form").onsubmit = function (e) {
        e.preventDefault();

        let header = col.header;
        if (Column.icons) {
            header = header.firstChild;
        }

        const trimVal = elem => elem.value.trim();
        config.add(header.innerHTML, protocol.value + trimVal(url), trimVal(name));

        col.reload();
        config.localize();

        if (columnChildren(col.column).length == ITEM_MAX) {
            clear();
            col.column.classList.remove("editable");
        }
    };

    const once = function (e) {
        if (!e.target.closest("#new-item")) {
            clear();
            col.column.classList.remove("editable");

            document.removeEventListener(e.type, once);
        }
    };

    document.addEventListener("click", once);
}

function changeItem(col, row) {
    item.style.display = "flex";
    protocol.style.display = "initial";
    url.style.display = "initial";
    document.querySelector("#delete").style.display = "initial";

    name.value = "";

    const rowIndex = Array.prototype.indexOf.call(row.parentNode.children, row);
    const header = col.header.innerHTML;

    document.querySelector("form").onsubmit = function (e) {
        e.preventDefault();

        const trimVal = elem => elem.value.trim();
        const trimmedUrl = protocol.value + trimVal(url);

        config.change(header, rowIndex, trimmedUrl, trimVal(name));
        row.firstChild.innerHTML = trimVal(name);
        row.onclick = () => window.open(trimmedUrl, "_self");

        config.localize();
    };

    document.querySelector("#delete").onclick = function (e) {
        col.config.splice(rowIndex, 1);

        col.reload();
        config.localize();

        clear();
    }

    clearColumnClick();
}


config.load(false, () => {
    for (const col of getCols()) {
        let head = col.firstChild.firstChild;
        head.oncontextmenu = function (e) {
            e.preventDefault();
            e.stopPropagation();

            columnClick(e, col, getCols(), changeColumn);
        };

        for (const row of columnChildren(col)) {
            row.oncontextmenu = function (e) {
                e.preventDefault();
                e.stopPropagation();

                columnClick(e, col, getCols(), changeItem, row);
            };
        }
    }
});
