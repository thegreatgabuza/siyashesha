declare module 'node:test' {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
}

declare module 'node:assert/strict' {
  const assert: {
    ok(value: unknown, message?: string): void;
    equal<T>(actual: T, expected: T, message?: string): void;
    deepEqual<T>(actual: T, expected: T, message?: string): void;
  };
  export default assert;
}

declare module 'node:fs' {
  export interface Dirent {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }
  const fs: {
    readdirSync(dir: string, options: { withFileTypes: true }): Dirent[];
    readFileSync(file: string, encoding: 'utf8'): string;
    existsSync(file: string): boolean;
  };
  export default fs;
}

declare module 'node:path' {
  const path: {
    resolve(...segments: string[]): string;
    dirname(p: string): string;
    join(...segments: string[]): string;
    relative(from: string, to: string): string;
  };
  export default path;
}

declare module 'node:url' {
  export function fileURLToPath(url: string): string;
}
