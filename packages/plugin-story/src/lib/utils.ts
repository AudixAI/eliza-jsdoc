/**
 * Takes a given string and converts it to camelCase format.
 * @param {string} str - The string to be converted to camelCase
 * @returns {string} The camelCase formatted string
 */
export function camelize(str: string) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}
