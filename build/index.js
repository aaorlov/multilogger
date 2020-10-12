"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiLogger = exports.stylizer = void 0;
const Stylizer_1 = __importDefault(require("./stylizer/Stylizer"));
exports.stylizer = Stylizer_1.default;
const Logger_1 = require("./Logger");
Object.defineProperty(exports, "MultiLogger", { enumerable: true, get: function () { return Logger_1.MultiLogger; } });
//# sourceMappingURL=index.js.map