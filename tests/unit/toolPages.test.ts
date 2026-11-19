import { describe, expect, it } from 'vitest';
import data from '../../lib/toolPages.json';

// Data behind the prerendered tool pages (scripts/prerender.mjs).
const tools = (data as { tools: Array<Record<string, any>> }).tools;

describe('tool page data', () => {
  it('has the ten tools', () => {
    expect(tools).toHaveLength(10);
  });

  it('gives every tool a unique slug and name', () => {
    expect(new Set(tools.map(t => t.slug)).size).toBe(tools.length);
    expect(new Set(tools.map(t => t.name)).size).toBe(tools.length);
  });

  it('keeps titles and descriptions within search-result lengths', () => {
    for (const t of tools) {
      expect(t.title.length, `${t.slug} title`).toBeLessThanOrEqual(70);
      expect(t.description.length, `${t.slug} description`).toBeGreaterThanOrEqual(50);
      expect(t.description.length, `${t.slug} description`).toBeLessThanOrEqual(160);
    }
  });

  it('gives every tool a heading, steps and FAQ entries', () => {
    for (const t of tools) {
      expect(t.h1, `${t.slug} h1`).toBeTruthy();
      expect(t.steps.length, `${t.slug} steps`).toBeGreaterThanOrEqual(3);
      expect(t.faqs.length, `${t.slug} faqs`).toBeGreaterThanOrEqual(2);
    }
  });
});
