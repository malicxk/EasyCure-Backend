export function isValidName(name:string):boolean{  
   return /^[A-z ]+$/.test(name);
}