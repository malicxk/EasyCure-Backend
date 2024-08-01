export class Doctor {
  constructor(
    public readonly doctorname: string,
    public readonly email: string,
    public readonly password: string,
    public readonly dateOfbirth: string,
    public readonly specialty: string,
    public readonly description: string,
    public readonly workExperience:string,
    public readonly isBlocked: boolean,
    public readonly _id?: string
  ) {}
}   
