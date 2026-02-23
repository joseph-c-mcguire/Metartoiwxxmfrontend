import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConversionApiError,
  convertMetarToIwxxm,
  convertMetarToIwxxmZip,
  downloadBlob,
} from '@/utils/api';

describe('api utilities edge cases', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('trims manual input and normalizes empty issues in successful conversion responses', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [],
        errors: [],
        total_processed: 0,
        successful: 0,
        failed: 0,
      }),
    } as Response);

    const response = await convertMetarToIwxxm({
      manualText: '  METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015  ',
      accessToken: 'test-token',
    });

    const request = fetchMock.mock.calls[0];
    const formData = request[1]?.body as FormData;

    expect(formData.get('manual_text')).toBe('METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015');
    expect(response.issues).toEqual([]);
  });

  it('throws ConversionApiError with parsed detail payload for non-2xx responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () =>
        JSON.stringify({
          detail: {
            message: 'Validation failed',
            errors: ['invalid METAR'],
            issues: [
              {
                source: 'manual_input',
                message: 'Could not parse token',
                severity: 'error',
                code: 'PARSER_ERROR',
              },
            ],
            total_errors: 1,
          },
        }),
    } as Response);

    await expect(
      convertMetarToIwxxm({
        manualText: 'NOT_A_VALID_METAR',
        accessToken: 'test-token',
      })
    ).rejects.toMatchObject({
      name: 'ConversionApiError',
      message: 'Validation failed',
      status: 400,
      errors: ['invalid METAR'],
    });
  });

  it('falls back to status text when error payload is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: async () => 'gateway timeout upstream',
    } as Response);

    await expect(
      convertMetarToIwxxm({
        manualText: 'METAR KDEN 161200Z 27005KT 10SM CLR 10/M02 A3010',
        accessToken: 'test-token',
      })
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConversionApiError>>({
        name: 'ConversionApiError',
        message: 'Conversion failed: Service Unavailable',
        status: 503,
        errors: [],
        issues: [],
      })
    );
  });

  it('uses stored token and trims manual text for zip conversion requests', async () => {
    localStorage.setItem('supabase_access_token', 'stored-token');
    const expectedBlob = new Blob(['zip content'], { type: 'application/zip' });

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => expectedBlob,
    } as Response);

    const result = await convertMetarToIwxxmZip({
      manualText: '  METAR KLAX 161200Z 25008KT 10SM FEW015 19/13 A2998  ',
      files: [new File(['SPECI'], 'test.tac', { type: 'text/plain' })],
    });

    expect(result).toBe(expectedBlob);

    const request = fetchMock.mock.calls[0];
    const requestOptions = request[1];
    const formData = requestOptions?.body as FormData;

    expect(requestOptions?.headers).toEqual({ Authorization: 'Bearer stored-token' });
    expect(formData.get('manual_text')).toBe('METAR KLAX 161200Z 25008KT 10SM FEW015 19/13 A2998');
    expect(formData.getAll('files')).toHaveLength(1);
  });

  it('throws a fallback zip conversion error message when response JSON cannot be parsed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('invalid json');
      },
    } as unknown as Response);

    await expect(convertMetarToIwxxmZip({ manualText: 'METAR EGLL 161200Z AUTO 18009KT 9999 FEW020 16/09 Q1018' })).rejects.toThrow(
      'ZIP conversion failed: Internal Server Error'
    );
  });

  it('downloads blob content by creating and revoking an object URL', () => {
    const blob = new Blob(['xml content'], { type: 'application/xml' });
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURLMock,
    });
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadBlob(blob, 'result.xml');

    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });
});
