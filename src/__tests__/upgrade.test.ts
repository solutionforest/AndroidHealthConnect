import { checkLibraryUpdate, compareSemver, LIBRARY_VERSION } from '../upgrade';

describe('compareSemver', () => {
  it('orders patch versions', () => {
    expect(compareSemver('0.2.0', '0.2.2')).toBe(-1);
    expect(compareSemver('0.2.2', '0.2.2')).toBe(0);
    expect(compareSemver('0.2.3', '0.2.2')).toBe(1);
  });

  it('strips v prefix and ignores pre-release for core compare', () => {
    expect(compareSemver('v0.2.1', '0.2.2')).toBe(-1);
    expect(compareSemver('1.2.0-alpha06', '1.2.0')).toBe(0);
  });
});

describe('checkLibraryUpdate', () => {
  it('exposes package version', () => {
    expect(LIBRARY_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('returns upgrade advice when a newer release exists', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: '0.9.9',
        name: '0.9.9',
        html_url:
          'https://github.com/solutionforest/AndroidHealthConnect/releases/tag/0.9.9',
      }),
    });

    const info = await checkLibraryUpdate({
      currentVersion: '0.2.2',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(info.updateAvailable).toBe(true);
    expect(info.latestVersion).toBe('0.9.9');
    expect(info.advice).toContain('建议升级');
    expect(info.advice).toContain('0.2.2 → 0.9.9');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.github.com/repos/solutionforest/AndroidHealthConnect/releases/latest',
      expect.any(Object)
    );
  });

  it('reports up to date when current matches latest', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v0.2.2',
        name: '0.2.2 update',
        html_url:
          'https://github.com/solutionforest/AndroidHealthConnect/releases/tag/0.2.2',
      }),
    });

    const info = await checkLibraryUpdate({
      currentVersion: '0.2.2',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(info.updateAvailable).toBe(false);
    expect(info.latestVersion).toBe('0.2.2');
    expect(info.advice).toContain('latest version');
  });

  it('handles GitHub errors without throwing', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const info = await checkLibraryUpdate({
      currentVersion: '0.2.2',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(info.updateAvailable).toBe(false);
    expect(info.latestVersion).toBeNull();
    expect(info.advice).toContain('HTTP 404');
  });
});
