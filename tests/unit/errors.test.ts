import { describe, it, expect } from 'vitest';
import {
  LogReaderError,
  NetworkError,
  ContractError,
  ConfigurationError,
  ParsingError,
} from '../../src/types/errors';

describe('Error Classes', () => {
  describe('LogReaderError', () => {
    it('should create error with message, code, and context', () => {
      const error = new LogReaderError('Test error', 'TEST_ERROR', { key: 'value' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogReaderError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('LogReaderError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toEqual({ key: 'value' });
    });

    it('should create error without context', () => {
      const error = new LogReaderError('Test error', 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toBeUndefined();
    });

    it('should have a stack trace', () => {
      const error = new LogReaderError('Test error', 'TEST_ERROR');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('LogReaderError');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with correct code', () => {
      const error = new NetworkError('Connection failed', { endpoint: 'http://localhost:8545' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogReaderError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.context).toEqual({ endpoint: 'http://localhost:8545' });
    });

    it('should create network error without context', () => {
      const error = new NetworkError('Timeout');

      expect(error.message).toBe('Timeout');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.context).toBeUndefined();
    });

    it('should have a stack trace', () => {
      const error = new NetworkError('Connection failed');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NetworkError');
    });
  });

  describe('ContractError', () => {
    it('should create contract error with correct code', () => {
      const error = new ContractError('Invalid address', { address: '0xinvalid' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogReaderError);
      expect(error).toBeInstanceOf(ContractError);
      expect(error.message).toBe('Invalid address');
      expect(error.name).toBe('ContractError');
      expect(error.code).toBe('CONTRACT_ERROR');
      expect(error.context).toEqual({ address: '0xinvalid' });
    });

    it('should create contract error without context', () => {
      const error = new ContractError('ABI not found');

      expect(error.message).toBe('ABI not found');
      expect(error.code).toBe('CONTRACT_ERROR');
      expect(error.context).toBeUndefined();
    });

    it('should have a stack trace', () => {
      const error = new ContractError('Invalid address');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ContractError');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error with correct code', () => {
      const error = new ConfigurationError('Missing RPC endpoint', { field: 'rpcEndpoint' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogReaderError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toBe('Missing RPC endpoint');
      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.context).toEqual({ field: 'rpcEndpoint' });
    });

    it('should create configuration error without context', () => {
      const error = new ConfigurationError('Invalid config');

      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.context).toBeUndefined();
    });

    it('should have a stack trace', () => {
      const error = new ConfigurationError('Missing RPC endpoint');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ConfigurationError');
    });
  });

  describe('ParsingError', () => {
    it('should create parsing error with correct code', () => {
      const error = new ParsingError('Failed to decode log', { rawLog: '0xdata' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogReaderError);
      expect(error).toBeInstanceOf(ParsingError);
      expect(error.message).toBe('Failed to decode log');
      expect(error.name).toBe('ParsingError');
      expect(error.code).toBe('PARSING_ERROR');
      expect(error.context).toEqual({ rawLog: '0xdata' });
    });

    it('should create parsing error without context', () => {
      const error = new ParsingError('ABI mismatch');

      expect(error.message).toBe('ABI mismatch');
      expect(error.code).toBe('PARSING_ERROR');
      expect(error.context).toBeUndefined();
    });

    it('should have a stack trace', () => {
      const error = new ParsingError('Failed to decode log');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ParsingError');
    });
  });

  describe('Error inheritance', () => {
    it('should allow catching specific error types', () => {
      const throwNetworkError = () => {
        throw new NetworkError('Connection failed');
      };

      expect(throwNetworkError).toThrow(NetworkError);
      expect(throwNetworkError).toThrow(LogReaderError);
      expect(throwNetworkError).toThrow(Error);
    });

    it('should allow catching base LogReaderError', () => {
      const errors = [
        new NetworkError('Network error'),
        new ContractError('Contract error'),
        new ConfigurationError('Config error'),
        new ParsingError('Parsing error'),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(LogReaderError);
        expect(error).toBeInstanceOf(Error);
      });
    });

    it('should distinguish between error types', () => {
      const networkError = new NetworkError('Network error');
      const contractError = new ContractError('Contract error');

      expect(networkError).toBeInstanceOf(NetworkError);
      expect(networkError).not.toBeInstanceOf(ContractError);
      expect(contractError).toBeInstanceOf(ContractError);
      expect(contractError).not.toBeInstanceOf(NetworkError);
    });
  });

  describe('Error context', () => {
    it('should support complex context objects', () => {
      const context = {
        endpoint: 'http://localhost:8545',
        chainId: 1,
        timeout: 30000,
        retries: 3,
        metadata: {
          timestamp: Date.now(),
          requestId: 'abc123',
        },
      };

      const error = new NetworkError('Connection failed', context);

      expect(error.context).toEqual(context);
      expect(error.context.endpoint).toBe('http://localhost:8545');
      expect(error.context.metadata.requestId).toBe('abc123');
    });

    it('should support primitive context values', () => {
      const error1 = new NetworkError('Error', 'simple string');
      const error2 = new ContractError('Error', 42);
      const error3 = new ParsingError('Error', true);

      expect(error1.context).toBe('simple string');
      expect(error2.context).toBe(42);
      expect(error3.context).toBe(true);
    });

    it('should support null context', () => {
      const error = new ConfigurationError('Error', null);

      expect(error.context).toBeNull();
    });
  });
});
