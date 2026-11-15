import { jest } from '@jest/globals';
import { random, withRandomSource } from '../random-source';

describe('random source', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('draws from Math.random() by default', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.25);

    expect(random()).toBe(0.25);
  });

  it('draws from the given source while the run lasts', () => {
    expect(
      withRandomSource(
        () => 0.5,
        () => random(),
      ),
    ).toBe(0.5);
  });

  it('restores the previous source once the run is over', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.25);
    withRandomSource(
      () => 0.5,
      () => random(),
    );

    expect(random()).toBe(0.25);
  });

  it('restores the previous source when the run throws', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.25);
    expect(() =>
      withRandomSource(
        () => 0.5,
        () => {
          throw new Error('boom');
        },
      ),
    ).toThrow('boom');

    expect(random()).toBe(0.25);
  });

  it('refuses an asynchronous run, which would escape the source', () => {
    expect(() =>
      withRandomSource(
        () => 0.5,
        async () => random(),
      ),
    ).toThrow('must run synchronously');
  });
});
