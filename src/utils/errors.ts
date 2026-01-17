export class PaplaApiError extends Error {
  constructor(
    public statusCode: number,
    public body: string
  ) {
    super(`Papla API error (${statusCode}): ${body}`);
    this.name = "PaplaApiError";
  }
}

export class FileOutputError extends Error {
  constructor(
    message: string,
    public path: string
  ) {
    super(message);
    this.name = "FileOutputError";
  }
}
