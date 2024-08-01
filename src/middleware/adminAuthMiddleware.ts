import { Request, Response } from 'express';
import jwt, { VerifyErrors, Secret } from 'jsonwebtoken';

interface User {
    _id: string;
}

// Extend the Express request interface
declare global {
    namespace Express {
        interface Request {
            user_id?: string;
        }
    }
}

const authenticateAdminToken = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers['authorization-doctor'];
    if (typeof authHeader !== 'string') {
        return res.sendStatus(401); // If there's no token, return 401 (Unauthorized)
    }
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.sendStatus(401); // If there's no token, return 401 (Unauthorized)
    }
    // Ensure the secret is defined and of the correct type
    const secret: Secret = process.env.JWT_SECRET as string;
    jwt.verify(token, secret, (err: VerifyErrors | null, decoded: User | any) => {
        if (err) {
            return res.sendStatus(403);
        } else {
            req.user_id = decoded.id;
            next();
        }
    });
};
export default authenticateAdminToken;