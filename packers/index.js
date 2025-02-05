let MaxRectsPacker = require("./MaxRectsPacker");
let MaxRectsBin = require("./MaxRectsBin");

const list = [
    MaxRectsBin,
    MaxRectsPacker
];

function getPackerByType(type) {
    type = type.toLowerCase();
    
    for(let item of list) {
        if(item.type.toLowerCase() === type) {
            return item;
        }
    }
    return null;
}

module.exports.getPackerByType = getPackerByType;
module.exports.list = list;