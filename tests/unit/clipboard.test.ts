import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../../lib/clipboard';

// Node has no DOM, so provide just what copyText uses.
const makeDom = (clipboard: unknown) => {
  const textarea = { value: '', style: {} as Record<string, string>, setAttribute: vi.fn(), select: vi.fn() };
  const execCommand = vi.fn(() => true);
  vi.stubGlobal('navigator', { clipboard });
  vi.stubGlobal('document', {
    createElement: vi.fn(() => textarea),
    body: { appendChild: vi.fn(), removeChild: vi.fn() },
    execCommand,
  });
  return { textarea, execCommand };
};

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('copyText', () => {
  it('uses the Clipboard API when it is available', async () => {
    const writeText = vi.fn(async () => undefined);
    makeDom({ writeText });
    expect(await copyText('hello')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand on insecure origins where the Clipboard API is missing', async () => {
    const { textarea, execCommand } = makeDom(undefined);
    expect(await copyText('lan text')).toBe(true);
    expect(textarea.value).toBe('lan text');
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('falls back when writeText is refused', async () => {
    const { execCommand } = makeDom({ writeText: vi.fn(async () => { throw new Error('denied'); }) });
    expect(await copyText('x')).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('reports failure when both routes fail', async () => {
    makeDom({ writeText: vi.fn(async () => { throw new Error('denied'); }) });
    vi.stubGlobal('document', { createElement: () => { throw new Error('no DOM'); } });
    expect(await copyText('x')).toBe(false);
  });
});
