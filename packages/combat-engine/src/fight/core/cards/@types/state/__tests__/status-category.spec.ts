import { statusCategoryOf } from '../status-category';

describe('statusCategoryOf', () => {
  it('classes freeze as control', () => {
    expect(statusCategoryOf('freeze')).toBe('control');
  });

  it('classes stunt as control', () => {
    expect(statusCategoryOf('stunt')).toBe('control');
  });

  it('classes poison as damage over time', () => {
    expect(statusCategoryOf('poison')).toBe('damage-over-time');
  });

  it('classes burn as damage over time', () => {
    expect(statusCategoryOf('burn')).toBe('damage-over-time');
  });
});
