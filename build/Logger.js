"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiLogger = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const Stylizer_1 = __importDefault(require("./stylizer/Stylizer"));
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const LOG_TYPES = [
    'system',
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'access',
    'slow',
    'db',
];
const typeColor = Stylizer_1.default({
    system: 'b,white/blue',
    fatal: 'b,yellow/red',
    error: 'black/red',
    warn: 'black/yellow',
    info: 'blue/white',
    debug: 'black/green',
    access: 'black/white',
    slow: 'b,yellow/blue',
    db: 'b,white/green',
});
const textColor = Stylizer_1.default({
    system: 'b,white',
    fatal: 'b,red',
    error: 'red',
    warn: 'b,yellow',
    info: 'white',
    debug: 'b,green',
    access: 'white',
    slow: 'b,blue',
    db: 'green',
});
const add0 = (n) => (n < 10 ? '0' + n : '' + n);
const getFormDt = (d = new Date()) => `${d.getUTCFullYear()}-${add0(d.getUTCMonth() + 1)}-${add0(d.getUTCDate())}`;
class MultiLogger extends events_1.EventEmitter {
    constructor({ path = '', appName = '', keepDays = 0, writeOptions = { flags: 'a' }, toFile = [], toStdout = LOG_TYPES, writeInterval = 3000, homePath = null }) {
        super();
        this.active = false;
        this.file = '';
        this.reopenTimer = null;
        this.flushTimer = null;
        this.stream = null;
        this.lock = false;
        this.buffer = [];
        this.homePath = null;
        this.path = path;
        this.app = `APP-${appName}`;
        this.keepDays = keepDays;
        this.toFile = toFile.reduce((res, t) => (Object.assign(Object.assign({}, res), { [t]: true })), {});
        this.fsEnabled = Object.keys(this.toFile).length !== 0;
        this.toStdout = toStdout.reduce((res, t) => (Object.assign(Object.assign({}, res), { [t]: true })), {});
        this.writeInterval = writeInterval;
        this.options = writeOptions;
        this.homePath = homePath;
        this.buffer = [];
        this.open();
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.active)
                return this;
            this.active = true;
            if (!this.fsEnabled) {
                process.nextTick(() => this.emit('open'));
                return this;
            }
            this.file = `${this.path}/${getFormDt()}-${this.app}.log`;
            const dayStart = new Date();
            dayStart.setUTCHours(0, 0, 0, 0);
            const nextReopen = +dayStart - Date.now() + DAY_MILLISECONDS;
            this.reopenTimer = setTimeout(() => {
                this.once('close', () => this.open());
                this.close();
            }, nextReopen);
            if (this.keepDays)
                this.rotate();
            this.stream = fs_1.createWriteStream(this.file, this.options);
            this.flushTimer = setInterval(() => this.flush(), this.writeInterval);
            this.stream.on('open', () => this.emit('open'));
            this.stream.on('error', () => this.emit('error', new Error(`Can't open log file: ${this.file}`)));
            yield events_1.once(this, 'open');
            return this;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.active)
                return Promise.resolve();
            if (!this.fsEnabled) {
                this.active = false;
                this.emit('close');
                return Promise.resolve();
            }
            if (!this.stream || !this.stream.writable) {
                this.flushTimer && clearInterval(this.flushTimer);
                this.reopenTimer && clearTimeout(this.reopenTimer);
                this.flushTimer = null;
                this.reopenTimer = null;
                this.emit('close');
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => this.flush(err => {
                if (err) {
                    process.stdout.write(`${err.stack}\n`);
                    this.emit('error', err);
                    reject(err);
                    return;
                }
                this.active = false;
                this.stream.end(() => {
                    this.flushTimer && clearInterval(this.flushTimer);
                    this.reopenTimer && clearTimeout(this.reopenTimer);
                    this.flushTimer = null;
                    this.reopenTimer = null;
                    this.emit('close');
                    const fileName = this.file;
                    resolve();
                    fs_1.stat(fileName, (err, stats) => {
                        if (err)
                            return;
                        if (stats.size > 0)
                            return;
                        fs_1.unlink(fileName, () => { });
                    });
                });
            }));
        });
    }
    flush(callback) {
        if (this.lock) {
            if (callback)
                this.once('unlocked', callback);
            return;
        }
        if (this.buffer.length === 0) {
            if (callback)
                callback();
            return;
        }
        if (!this.active) {
            const err = new Error('Cannot flush log buffer: logger is not opened');
            this.emit('error', err);
            if (callback)
                callback(err);
            return;
        }
        this.lock = true;
        const buffer = Buffer.concat(this.buffer);
        this.buffer.length = 0;
        this.stream.write(buffer, () => {
            this.lock = false;
            this.emit('unlocked');
            if (callback)
                callback();
        });
    }
    write(type, message) {
        const date = new Date();
        const dateTime = date.toISOString();
        if (this.toStdout[type]) {
            const normalColor = textColor[type];
            const markColor = typeColor[type];
            const time = normalColor(dateTime);
            const app = normalColor(this.app);
            const mark = markColor(' ' + type.toUpperCase().padEnd(7));
            const msg = normalColor(message);
            const line = `${time}  ${app}  ${mark}  ${msg}\n`;
            process.stdout.write(line);
        }
        if (this.toFile[type]) {
            const msg = message.replace(/[\n\r]\s*/g, '; ');
            const line = `${dateTime} [${type.toUpperCase()}] ${msg}\n`;
            const buffer = Buffer.from(line);
            this.buffer.push(buffer);
        }
    }
    rotate() {
        if (!this.keepDays)
            return;
        fs_1.readdir(this.path, (err, files) => {
            if (err) {
                process.stdout.write(`${err.stack}\n`);
                this.emit('error', err);
                return;
            }
            const now = new Date();
            const year = now.getUTCFullYear();
            const month = now.getUTCMonth();
            const day = now.getUTCDate();
            const date = new Date(year, month, day, 0, 0, 0, 0);
            const time = date.getTime();
            for (const fileName of files) {
                const fileTime = new Date(fileName.substring(0, 10)).getTime();
                const fileAge = Math.floor((time - fileTime) / DAY_MILLISECONDS);
                if (fileAge > 1 && fileAge > this.keepDays - 1) {
                    fs_1.unlink(this.path + '/' + fileName, err => {
                        if (err) {
                            process.stdout.write(`${err.stack}\n`);
                            this.emit('error', err);
                        }
                    });
                }
            }
        });
    }
    normalizeStack(stack) {
        if (!stack)
            return 'no data to log';
        let res = stack.replace(/\s+at\s+/g, '\n\t');
        if (this.homePath)
            res = res.replace(this.homePath, '');
        return res;
    }
    system(message) {
        console.log(123);
        this.write('system', message);
    }
    fatal(message) {
        const msg = this.normalizeStack(message);
        this.write('fatal', msg);
    }
    error(message) {
        const msg = this.normalizeStack(message);
        this.write('error', msg);
    }
    warn(message) {
        this.write('warn', message);
    }
    info(message) {
        this.write('info', message);
    }
    debug(message) {
        const msg = this.normalizeStack(message);
        this.write('debug', msg);
    }
    access(message) {
        this.write('access', message);
    }
    slow(message) {
        this.write('slow', message);
    }
    db(message) {
        this.write('db', message);
    }
}
exports.MultiLogger = MultiLogger;
//# sourceMappingURL=Logger.js.map