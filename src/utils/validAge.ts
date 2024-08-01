export function validAge(dob: Date): number {
    const now = new Date();
    const diff = now.getTime() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}