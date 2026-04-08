export const isNonEmptyString = (value: unknown): value is string => {
    return typeof value === "string" && value.trim().length > 0;
};

export const isValidNonNegativeInteger = (value:unknown): boolean => {
    return Number.isInteger(value) && Number(value) >= 0;
};