export class Subscription {
    constructor(
        public readonly plan: string,
        public readonly price: number,
        public readonly features: string[],
        public readonly active: boolean,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly userId: string,
        public readonly _id?: string
    ) {}
}
