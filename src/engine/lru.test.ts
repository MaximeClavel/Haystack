import { describe, expect, it } from 'vitest';
import { LruCache } from './lru';

describe('LruCache', () => {
  it('évince la moins récemment utilisée et la libère', () => {
    const freed: string[] = [];
    const c = new LruCache<string, number>(3, (k) => freed.push(k));
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.get('a'); // a devient la plus récente
    c.set('d', 4);
    expect(freed).toEqual(['b']);
    expect([...c.keys()]).toEqual(['c', 'a', 'd']);
    expect(c.size).toBe(3);
  });

  it('peek ne modifie pas l’ordre', () => {
    const freed: string[] = [];
    const c = new LruCache<string, number>(2, (k) => freed.push(k));
    c.set('a', 1);
    c.set('b', 2);
    expect(c.peek('a')).toBe(1);
    c.set('c', 3);
    expect(freed).toEqual(['a']);
  });

  it('les clés épinglées ne sont jamais évincées', () => {
    const freed: string[] = [];
    const c = new LruCache<string, number>(2, (k) => freed.push(k));
    c.pin('root');
    c.set('root', 0);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    expect(c.has('root')).toBe(true);
    expect(freed).toEqual(['a', 'b']);
    c.unpin('root');
    c.set('d', 4);
    expect(c.has('root')).toBe(false);
    expect(freed).toEqual(['a', 'b', 'root']);
  });

  it('remplacer une valeur libère l’ancienne', () => {
    const freed: number[] = [];
    const c = new LruCache<string, number>(4, (_k, v) => freed.push(v));
    c.set('a', 1);
    c.set('a', 2);
    expect(freed).toEqual([1]);
    expect(c.get('a')).toBe(2);
  });

  it('réduire la capacité évince immédiatement', () => {
    const freed: string[] = [];
    const c = new LruCache<string, number>(5, (k) => freed.push(k));
    for (const k of ['a', 'b', 'c', 'd', 'e']) c.set(k, 0);
    c.capacity = 2;
    expect(freed).toEqual(['a', 'b', 'c']);
    expect(c.size).toBe(2);
  });

  it('clear libère tout, delete libère une entrée', () => {
    const freed: string[] = [];
    const c = new LruCache<string, number>(5, (k) => freed.push(k));
    c.set('a', 1);
    c.set('b', 2);
    expect(c.delete('a')).toBe(true);
    expect(c.delete('zz')).toBe(false);
    c.clear();
    expect(freed).toEqual(['a', 'b']);
    expect(c.size).toBe(0);
  });

  it('la valeur qu’on vient d’insérer n’est pas évincée même si tout le reste est épinglé', () => {
    const c = new LruCache<string, number>(1);
    c.pin('r');
    c.set('r', 0);
    c.set('x', 1);
    expect(c.has('x')).toBe(true);
    expect(c.has('r')).toBe(true);
    c.set('y', 2);
    expect(c.has('x')).toBe(false);
    expect(c.has('y')).toBe(true);
  });
});
