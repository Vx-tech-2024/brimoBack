"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNonNegativeInteger = exports.isNonEmptyString = void 0;
const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
};
exports.isNonEmptyString = isNonEmptyString;
const isValidNonNegativeInteger = (value) => {
    return Number.isInteger(value) && Number(value) >= 0;
};
exports.isValidNonNegativeInteger = isValidNonNegativeInteger;
