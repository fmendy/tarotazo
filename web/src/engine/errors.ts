// Errores tipados del motor local: mismos `status`/`code`/`message` que los del API Java (§6), para que el
// frontend los trate igual que un ApiFailure.

export type EngineErrorCode = 'bad_request' | 'unavailable';

export class EngineError extends Error {
  constructor(readonly status: 400 | 503, readonly code: EngineErrorCode, message: string) {
    super(message);
    this.name = 'EngineError';
  }

  static badRequest(message: string): EngineError {
    return new EngineError(400, 'bad_request', message);
  }

  static unavailable(message: string): EngineError {
    return new EngineError(503, 'unavailable', message);
  }

  /** Cuerpo equivalente al del API: { error, message }. */
  toJSON(): { error: string; message: string } {
    return { error: this.code, message: this.message };
  }
}
