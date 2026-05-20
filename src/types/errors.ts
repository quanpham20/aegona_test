/**
 * Base error class for all LayerZero Log Reader errors.
 * Provides structured error information with error codes and context.
 */
export class LogReaderError extends Error {
  /**
   * Machine-readable error code for programmatic error handling
   */
  public readonly code: string;

  /**
   * Additional context information about the error
   */
  public readonly context?: any;

  /**
   * Creates a new LogReaderError
   * @param message - Human-readable error description
   * @param code - Machine-readable error code
   * @param context - Additional context data (optional)
   */
  constructor(message: string, code: string, context?: any) {
    super(message);
    this.name = 'LogReaderError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when network or RPC operations fail.
 * Examples: connection failures, timeouts, rate limiting
 */
export class NetworkError extends LogReaderError {
  /**
   * Creates a new NetworkError
   * @param message - Human-readable error description
   * @param context - Additional context data (optional)
   */
  constructor(message: string, context?: any) {
    super(message, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when contract operations fail.
 * Examples: invalid contract addresses, missing ABIs, contract call failures
 */
export class ContractError extends LogReaderError {
  /**
   * Creates a new ContractError
   * @param message - Human-readable error description
   * @param context - Additional context data (optional)
   */
  constructor(message: string, context?: any) {
    super(message, 'CONTRACT_ERROR', context);
    this.name = 'ContractError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when configuration is invalid or missing.
 * Examples: invalid config files, missing required fields, validation failures
 */
export class ConfigurationError extends LogReaderError {
  /**
   * Creates a new ConfigurationError
   * @param message - Human-readable error description
   * @param context - Additional context data (optional)
   */
  constructor(message: string, context?: any) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'ConfigurationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when event log parsing fails.
 * Examples: log decoding failures, ABI mismatches, data corruption
 */
export class ParsingError extends LogReaderError {
  /**
   * Creates a new ParsingError
   * @param message - Human-readable error description
   * @param context - Additional context data (optional)
   */
  constructor(message: string, context?: any) {
    super(message, 'PARSING_ERROR', context);
    this.name = 'ParsingError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
