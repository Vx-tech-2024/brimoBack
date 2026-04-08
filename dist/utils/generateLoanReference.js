"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLoanReference = void 0;
const generateLoanReference = () => {
    const timestamp = Date.now();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `LN-${timestamp}-${randomPart}`;
};
exports.generateLoanReference = generateLoanReference;
