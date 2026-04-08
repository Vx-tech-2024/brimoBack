"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParam = void 0;
const getParam = (param) => {
    return Array.isArray(param) ? param[0] : param;
};
exports.getParam = getParam;
