import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

const VIRTUAL_MOCKS = new Map([
  [
    'react-native',
    `export const Alert = { alert: () => {} };
export const Platform = { OS: 'ios', select: (obj) => obj.ios ?? obj.default };
export default { Alert, Platform };`,
  ],
  [
    'expo-router',
    `export const router = { push: () => {}, replace: () => {}, back: () => {} };
export const useRouter = () => router;`,
  ],
]);

function tryResolveFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (VIRTUAL_MOCKS.has(specifier)) {
    return {
      shortCircuit: true,
      url: `virtual-mock:${specifier}`,
    };
  }

  if (specifier.startsWith('@/')) {
    const targetPath = path.join(SRC_DIR, specifier.slice(2));
    const resolved = tryResolveFile(targetPath);
    if (resolved) {
      return {
        shortCircuit: true,
        url: resolved,
      };
    }
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const targetPath = path.resolve(parentDir, specifier);
    const resolved = tryResolveFile(targetPath);
    if (resolved) {
      return {
        shortCircuit: true,
        url: resolved,
      };
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('virtual-mock:')) {
    const name = url.slice('virtual-mock:'.length);
    return {
      format: 'module',
      shortCircuit: true,
      source: VIRTUAL_MOCKS.get(name),
    };
  }
  return nextLoad(url, context);
}
