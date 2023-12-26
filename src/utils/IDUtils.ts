import { v4 as uuidv4 } from "uuid";

export class IDUtils {
  public static generateNewSalt(): string {
    return uuidv4();
  }
}
