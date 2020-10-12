"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var COLORS;
(function (COLORS) {
    COLORS[COLORS["black"] = 0] = "black";
    COLORS[COLORS["red"] = 1] = "red";
    COLORS[COLORS["green"] = 2] = "green";
    COLORS[COLORS["yellow"] = 3] = "yellow";
    COLORS[COLORS["blue"] = 4] = "blue";
    COLORS[COLORS["magenta"] = 5] = "magenta";
    COLORS[COLORS["cyan"] = 6] = "cyan";
    COLORS[COLORS["white"] = 7] = "white";
})(COLORS || (COLORS = {}));
var ANSI;
(function (ANSI) {
    ANSI[ANSI["b"] = 1] = "b";
    ANSI[ANSI["f"] = 2] = "f";
    ANSI[ANSI["i"] = 3] = "i";
    ANSI[ANSI["u"] = 4] = "u";
    ANSI[ANSI["l"] = 5] = "l";
    ANSI[ANSI["h"] = 6] = "h";
    ANSI[ANSI["n"] = 7] = "n";
    ANSI[ANSI["c"] = 8] = "c";
    ANSI[ANSI["s"] = 9] = "s";
})(ANSI || (ANSI = {}));
const esc = (s) => '\x1b[' + s + '\x1b[0m';
const stylize = (styleString, val) => {
    const styles = styleString.split(',');
    for (const style of styles) {
        if (style.length === 1) {
            const code = ANSI[style];
            if (code) {
                val = esc(code + 'm' + val);
            }
        }
        else {
            const colors = style.split('/');
            const textColor = COLORS[colors[0]];
            const bgColor = COLORS[colors[1]];
            if (typeof textColor !== 'undefined') {
                val = esc('3' + textColor + 'm' + val);
            }
            if (typeof bgColor !== 'undefined') {
                val = esc('4' + bgColor + 'm' + val);
            }
        }
    }
    return val;
};
const tag = styles => (strings, ...values) => {
    if (typeof strings === 'string') {
        return stylize(styles, strings);
    }
    const result = [strings[0]];
    let i = 1;
    for (const val of values) {
        const str = strings[i++];
        result.push(val, str);
    }
    return stylize(styles, result.join(''));
};
const theme = tags => {
    const styles = (strings, ...values) => {
        const result = [strings[0]];
        let i = 1;
        for (const val of values) {
            const str = strings[i++];
            const styled = Object.entries(val).map(([k, v]) => styles[k](v));
            result.push(...styled, str);
        }
        return result.join('');
    };
    for (const name in tags) {
        styles[name] = tag(tags[name]);
    }
    return styles;
};
const stylizer = (strings, ...values) => {
    if (typeof strings === 'string') {
        return tag(strings);
    }
    if (!Array.isArray(strings)) {
        return theme(strings);
    }
    const result = [strings[0]];
    let i = 1;
    for (const val of values) {
        const str = strings[i++];
        if (str.startsWith('(')) {
            const pos = str.indexOf(')');
            const styles = str.substring(1, pos);
            const value = stylize(styles, val);
            const rest = str.substring(pos + 1);
            result.push(value, rest);
        }
    }
    return result.join('');
};
stylizer.b = stylizer('b');
stylizer.i = stylizer('i');
stylizer.u = stylizer('u');
stylizer.error = stylizer('b,red');
stylizer.info = stylizer('b,green');
stylizer.warn = stylizer('b,yellow');
stylizer.debug = stylizer('b,blue');
stylizer.red = stylizer('red');
stylizer.green = stylizer('green');
stylizer.yellow = stylizer('yellow');
stylizer.blue = stylizer('blue');
stylizer.magenta = stylizer('magenta');
stylizer.cyan = stylizer('cyan');
stylizer.white = stylizer('white');
exports.default = stylizer;
//# sourceMappingURL=Stylizer.js.map