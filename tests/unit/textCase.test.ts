import { describe, expect, it } from 'vitest';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from '../../lib/textCase';

describe('text case conversions', () => {
  it('converts a phrase to all styles', () => {
    expect(toCamelCase('hello world again')).toBe('helloWorldAgain');
    expect(toPascalCase('hello world again')).toBe('HelloWorldAgain');
    expect(toSnakeCase('hello world again')).toBe('hello_world_again');
    expect(toKebabCase('hello world again')).toBe('hello-world-again');
  });

  it('drops hyphens and underscores when building camelCase (regression D-08)', () => {
    expect(toCamelCase('hello-world_value')).toBe('helloWorldValue');
  });

  it('keeps acronyms together', () => {
    expect(toSnakeCase('XMLHttpRequest userID')).toBe('xml_http_request_user_id');
  });
});
