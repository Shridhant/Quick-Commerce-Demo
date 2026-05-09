import { CustomCode } from "./CustomCode";
import { HttpStatusCode } from "./HttpStatusCode";

export class AppError extends Error {
  public status: number;
  public code: string | number;
  public errors: any[];

  constructor(
    message: string,
    status: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    code: string | number = CustomCode.ServerErrorCode,
    errors: any[] = []
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;

    Object.setPrototypeOf(this, AppError.prototype);
    this.name = this.constructor.name;
  }
}
