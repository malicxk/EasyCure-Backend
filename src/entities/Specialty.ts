export class Specialty {
    constructor(
      public readonly specialtyImage: string,
      public readonly specialtyName: string,
      public readonly isDocAvailable: boolean,
      public readonly _id?: string
    ) { }
  }
  