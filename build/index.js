"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANSI = exports.COLORS = void 0;
const Stylizer_1 = require("./stylizer/Stylizer");
Object.defineProperty(exports, "COLORS", { enumerable: true, get: function () { return Stylizer_1.COLORS; } });
Object.defineProperty(exports, "ANSI", { enumerable: true, get: function () { return Stylizer_1.ANSI; } });
console.log(Stylizer_1.COLORS[0]);
