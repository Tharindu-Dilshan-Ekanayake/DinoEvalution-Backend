function generateId(prefix = "") {

    const randomPart = Math.random()
        .toString(36)
        .substring(2, 10);

    const timePart = Date.now()
        .toString(36);

    return `${prefix}${timePart}${randomPart}`;
}


module.exports = generateId;