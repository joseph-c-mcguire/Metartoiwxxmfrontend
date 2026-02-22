import { describe, expect, it, vi } from 'vitest';
import { convertMetarToIwxxm } from '@/utils/api';

describe('convertMetarToIwxxm request contract', () => {
  it('sends supported version, metadata, and validation controls', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [],
        errors: [],
        issues: [],
        total_processed: 0,
        successful: 0,
        failed: 0,
      }),
    } as Response);

    await convertMetarToIwxxm({
      manualText: 'METAR KJFK 161200Z 12012KT 10SM CLR 22/14 A3015',
      iwxxmVersion: '2025-2',
      validateOutput: true,
      validationLevel: 'comprehensive',
      stopOnError: true,
      bulletinId: 'saaa00',
      issuingCenter: 'kwbc',
      accessToken: 'token',
    });

    const request = fetchMock.mock.calls[0];
    const formData = request[1]?.body as FormData;

    expect(formData.get('iwxxm_version')).toBe('2025-2');
    expect(formData.get('validation_level')).toBe('comprehensive');
    expect(formData.get('validate_output')).toBe('true');
    expect(formData.get('stop_on_error')).toBe('true');
    expect(formData.get('bulletin_id')).toBe('SAAA00');
    expect(formData.get('issuing_center')).toBe('KWBC');

    fetchMock.mockRestore();
  });
});
