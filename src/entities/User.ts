export class User {
    constructor(
        public readonly username: string,
        public readonly email: string,
        public readonly password: string,
        public readonly dateOfbirth: Date,
        public readonly isBlocked: boolean,
        public readonly profilePhoto?: string,
        public readonly medCertificate?: string,
        public readonly _id?: string,
    ) { }
}