/**
 * Class representing a custom logger with color-coded and styled output.
 */
class ElizaLogger {
/**
 * Constructor for ElizaLogger class.
 * Initializes the instance with information about the environment.
 * Sets `isNode` to true if in a Node.js environment, false otherwise.
 * Sets `verbose` based on the environment, true if VERBOSE environment variable is "true" in Node.js.
 * Logs initialization settings including isNode, verbose, VERBOSE env, and NODE_ENV.
 */
    constructor() {
        // Check if we're in Node.js environment
        this.isNode =
            typeof process !== "undefined" &&
            process.versions != null &&
            process.versions.node != null;

        // Set verbose based on environment
        this.verbose = this.isNode ? process.env.VERBOSE === "true" : false;

        // Add initialization logging
        console.log(`[ElizaLogger] Initializing with:
            isNode: ${this.isNode}
            verbose: ${this.verbose}
            VERBOSE env: ${process.env.VERBOSE}
            NODE_ENV: ${process.env.NODE_ENV}
        `);
    }

    private isNode: boolean;
    verbose = false;
    closeByNewLine = true;
    useIcons = true;
    logsTitle = "LOGS";
    warningsTitle = "WARNINGS";
    errorsTitle = "ERRORS";
    informationsTitle = "INFORMATIONS";
    successesTitle = "SUCCESS";
    debugsTitle = "DEBUG";
    assertsTitle = "ASSERT";

/**
 * Gets the styling for console.log based on the specified foreground color and background color.
 * If running in a browser environment, it uses CSS color values.
 * If running in Node.js, it uses ANSI escape codes for colors.
 * @param { string } foregroundColor - The desired foreground color. Defaults to an empty string.
 * @param { string } backgroundColor - The desired background color. Defaults to an empty string.
 * @returns { string } The styling string to be used in console.log.
 */
    #getColor(foregroundColor = "", backgroundColor = "") {
        if (!this.isNode) {
            // Browser console styling
            const colors: { [key: string]: string } = {
                black: "#000000",
                red: "#ff0000",
                green: "#00ff00",
                yellow: "#ffff00",
                blue: "#0000ff",
                magenta: "#ff00ff",
                cyan: "#00ffff",
                white: "#ffffff",
            };

            const fg = colors[foregroundColor.toLowerCase()] || colors.white;
            const bg = colors[backgroundColor.toLowerCase()] || "transparent";
            return `color: ${fg}; background: ${bg};`;
        }

        // Node.js console colors
        let fgc = "\x1b[37m";
        switch (foregroundColor.trim().toLowerCase()) {
            case "black":
                fgc = "\x1b[30m";
                break;
            case "red":
                fgc = "\x1b[31m";
                break;
            case "green":
                fgc = "\x1b[32m";
                break;
            case "yellow":
                fgc = "\x1b[33m";
                break;
            case "blue":
                fgc = "\x1b[34m";
                break;
            case "magenta":
                fgc = "\x1b[35m";
                break;
            case "cyan":
                fgc = "\x1b[36m";
                break;
            case "white":
                fgc = "\x1b[37m";
                break;
        }

        let bgc = "";
        switch (backgroundColor.trim().toLowerCase()) {
            case "black":
                bgc = "\x1b[40m";
                break;
            case "red":
                bgc = "\x1b[44m";
                break;
            case "green":
                bgc = "\x1b[44m";
                break;
            case "yellow":
                bgc = "\x1b[43m";
                break;
            case "blue":
                bgc = "\x1b[44m";
                break;
            case "magenta":
                bgc = "\x1b[45m";
                break;
            case "cyan":
                bgc = "\x1b[46m";
                break;
            case "white":
                bgc = "\x1b[47m";
                break;
        }

        return `${fgc}${bgc}`;
    }

/**
 * Returns the color reset string based on whether the code is running in Node.js or not.
 *
 * @returns {string} The color reset string.
 */
    #getColorReset() {
        return this.isNode ? "\x1b[0m" : "";
    }

/**
 * Clears the console.
 */
    clear() {
        console.clear();
    }

/**
 * Print the provided strings with specified foreground and background colors.
 * If the environment is Node.js, the colors will be applied directly to the console output.
 * If not, a CSS style will be applied to the console output.
 * 
 * @param {string} foregroundColor - The color of the text (default is "white").
 * @param {string} backgroundColor - The background color of the text (default is "black").
 * @param {Array} strings - The strings to be printed.
 * @returns {void}
 */
    print(foregroundColor = "white", backgroundColor = "black", ...strings) {
        // Convert objects to strings
        const processedStrings = strings.map((item) => {
            if (typeof item === "object") {
                return JSON.stringify(item, (key, value) =>
                    typeof value === "bigint" ? value.toString() : value
                );
            }
            return item;
        });

        if (this.isNode) {
            const c = this.#getColor(foregroundColor, backgroundColor);
            console.log(c, processedStrings.join(""), this.#getColorReset());
        } else {
            const style = this.#getColor(foregroundColor, backgroundColor);
            console.log(`%c${processedStrings.join("")}`, style);
        }

        if (this.closeByNewLine) console.log("");
    }

/**
 * Log messages with specified style options.
 * 
 * @param {any[]} strings - Array of strings to be logged.
 * @param {object} options - Options for styling the log message.
 * @param {string} options.fg - Foreground color for log message.
 * @param {string} options.bg - Background color for log message.
 * @param {string} options.icon - Icon to be displayed with log message.
 * @param {string} options.groupTitle - Title for the log message group.
 */
    #logWithStyle(
        strings: any[],
        options: {
            fg: string;
            bg: string;
            icon: string;
            groupTitle: string;
        }
    ) {
        const { fg, bg, icon, groupTitle } = options;

        if (strings.length > 1) {
            if (this.isNode) {
                const c = this.#getColor(fg, bg);
                console.group(c, (this.useIcons ? icon : "") + groupTitle);
            } else {
                const style = this.#getColor(fg, bg);
                console.group(
                    `%c${this.useIcons ? icon : ""}${groupTitle}`,
                    style
                );
            }

            const nl = this.closeByNewLine;
            this.closeByNewLine = false;
            strings.forEach((item) => {
                this.print(fg, bg, item);
            });
            this.closeByNewLine = nl;
            console.groupEnd();
            if (nl) console.log();
        } else {
            this.print(
                fg,
                bg,
                strings.map((item) => {
                    return `${this.useIcons ? `${icon} ` : ""}${item}`;
                })
            );
        }
    }

/**
 * Logs messages with specified style settings.
 * 
 * @param {...string} strings - The messages to be logged.
 */
    log(...strings) {
        this.#logWithStyle(strings, {
            fg: "white",
            bg: "",
            icon: "\u25ce",
            groupTitle: ` ${this.logsTitle}`,
        });
    }

/**
 * Logs a warning message with a yellow foreground color and an exclamation icon.
 * 
 * @param {...string} strings The warning message(s) to be logged
 */
    warn(...strings) {
        this.#logWithStyle(strings, {
            fg: "yellow",
            bg: "",
            icon: "\u26a0",
            groupTitle: ` ${this.warningsTitle}`,
        });
    }

/**
* Logs an error message with red text and an error icon.
* 
* @param {...string} strings - The error message to be logged.
*/
    error(...strings) {
        this.#logWithStyle(strings, {
            fg: "red",
            bg: "",
            icon: "\u26D4",
            groupTitle: ` ${this.errorsTitle}`,
        });
    }

/**
 * Logs information to the console with a specified style.
 * 
 * @param {...string} strings - The information to be logged.
 */
    info(...strings) {
        this.#logWithStyle(strings, {
            fg: "blue",
            bg: "",
            icon: "\u2139",
            groupTitle: ` ${this.informationsTitle}`,
        });
    }

/**
 * Debug function for logging messages with style if verbose mode is enabled.
 * @param {...string} strings - The message strings to be logged.
 */
    debug(...strings) {
        if (!this.verbose) {
            // for diagnosing verbose logging issues
            // console.log(
            //     "[ElizaLogger] Debug message suppressed (verbose=false):",
            //     ...strings
            // );
            return;
        }
        this.#logWithStyle(strings, {
            fg: "magenta",
            bg: "",
            icon: "\u1367",
            groupTitle: ` ${this.debugsTitle}`,
        });
    }

/**
 * Log success messages with the specified style.
 *
 * @param {...string} strings - The success messages to be logged.
 */
    success(...strings) {
        this.#logWithStyle(strings, {
            fg: "green",
            bg: "",
            icon: "\u2713",
            groupTitle: ` ${this.successesTitle}`,
        });
    }

/**
 * Function to log a message with a cyan foreground color and an exclamation icon.
 *
 * @param {...string} strings - The message strings to log.
 */
    assert(...strings) {
        this.#logWithStyle(strings, {
            fg: "cyan",
            bg: "",
            icon: "\u0021",
            groupTitle: ` ${this.assertsTitle}`,
        });
    }

/**
 * Display progress message in the console.
 * 
 * @param {string} message - The message to display as progress.
 */ 

    progress(message: string) {
        if (this.isNode) {
            // Clear the current line and move cursor to beginning
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(message);
        } else {
            console.log(message);
        }
    }
}

export const elizaLogger = new ElizaLogger();
elizaLogger.closeByNewLine = true;
elizaLogger.useIcons = true;

export default elizaLogger;
