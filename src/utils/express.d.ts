import "express";

declare module "express-serve-static-core" {
  interface Request {
    admin?: {
      id: string;
      email: string;
      name: string;
    };
  }
}