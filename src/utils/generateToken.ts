import jwt from "jsonwebtoken";

type TokenPayload = {
    adminId: string;
};

export const generateToken = (payload: TokenPayload) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT is not defined");
    }

    return jwt.sign(payload, secret, {
        expiresIn:"7d",
    });
};