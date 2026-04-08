export const generateLoanReference = () => {
    const timestamp = Date.now();
    const randomPart = Math.floor(1000 + Math.random() * 9000);

    return `LN-${timestamp}-${randomPart}`;
}