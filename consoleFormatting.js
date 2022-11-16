//Dependency-less console timestamps: https://stackoverflow.com/a/36887315
//Dependency-less console colours: https://stackoverflow.com/a/40560590

const colours = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        crimson: "\x1b[38m"
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        crimson: "\x1b[48m"
    }
};

module.exports = {
    async info() {
        var info = console.info;
        console.info = function () {
            var first_parameter = arguments[0];
            var other_parameters = Array.prototype.slice.call(arguments, 1);
            function formatConsoleDate(date) {
                var hour = date.getHours();
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();
                var milliseconds = date.getMilliseconds();
                return colours.bright + colours.fg.blue + '[' + ((hour < 10) ? '0' + hour : hour) + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds) + '.' + ('00' + milliseconds).slice(-3) + ']' + colours.reset + ' ';
            }
            info.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
        };
    },
    async log() {
        var log = console.log;
        console.log = function () {
            var first_parameter = arguments[0];
            var other_parameters = Array.prototype.slice.call(arguments, 1);
            function formatConsoleDate(date) {
                var hour = date.getHours();
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();
                var milliseconds = date.getMilliseconds();
                return colours.bright + colours.fg.white + '[' + ((hour < 10) ? '0' + hour : hour) + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds) + '.' + ('00' + milliseconds).slice(-3) + ']' + colours.reset + ' ';
            }
            log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
        };
    },
    async warn() {
        var warn = console.warn;
        console.warn = function () {
            var first_parameter = arguments[0];
            var other_parameters = Array.prototype.slice.call(arguments, 1);
            function formatConsoleDate(date) {
                var hour = date.getHours();
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();
                var milliseconds = date.getMilliseconds();
                return colours.bright + colours.fg.yellow + '[' + ((hour < 10) ? '0' + hour : hour) + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds) + '.' + ('00' + milliseconds).slice(-3) + ']' + colours.reset + ' ';
            }
            warn.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
        };
    },
    async error() {
        var error = console.error;
        console.error = function () {
            var first_parameter = arguments[0];
            var other_parameters = Array.prototype.slice.call(arguments, 1);
            function formatConsoleDate(date) {
                var hour = date.getHours();
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();
                var milliseconds = date.getMilliseconds();
                return colours.bright + colours.fg.red + '[' + ((hour < 10) ? '0' + hour : hour) + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds) + '.' + ('00' + milliseconds).slice(-3) + ']' + colours.reset + ' ';
            }
            error.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
        };
    },
    colours: colours
}