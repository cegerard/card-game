import { validatePowerIdConsistency } from '../power-id-consistency';

describe('validatePowerIdConsistency', () => {
  it('accepts skills without powerId', () => {
    expect(() =>
      validatePowerIdConsistency([
        { event: 'turn-end' },
        { event: 'next-action' },
      ]),
    ).not.toThrow();
  });

  it('accepts skills with distinct powerIds', () => {
    expect(() =>
      validatePowerIdConsistency([
        { powerId: 'power-a', event: 'turn-end', terminationEvent: 'end-a' },
        { powerId: 'power-b', event: 'next-action', terminationEvent: 'end-b' },
      ]),
    ).not.toThrow();
  });

  it('accepts skills sharing the same powerId with matching event and terminationEvent', () => {
    expect(() =>
      validatePowerIdConsistency([
        { powerId: 'power-a', event: 'turn-end', terminationEvent: 'end-a' },
        { powerId: 'power-a', event: 'turn-end', terminationEvent: 'end-a' },
      ]),
    ).not.toThrow();
  });

  it('rejects skills with same powerId but different events', () => {
    expect(() =>
      validatePowerIdConsistency([
        { powerId: 'my-power', event: 'turn-end' },
        { powerId: 'my-power', event: 'next-action' },
      ]),
    ).toThrow(/same event/);
  });

  it('rejects skills with same powerId but different terminationEvents', () => {
    expect(() =>
      validatePowerIdConsistency([
        {
          powerId: 'my-power',
          event: 'turn-end',
          terminationEvent: 'end-a',
        },
        {
          powerId: 'my-power',
          event: 'turn-end',
          terminationEvent: 'end-b',
        },
      ]),
    ).toThrow(/same terminationEvent/);
  });
});
