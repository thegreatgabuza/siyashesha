import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

// @ts-ignore - expo-router internal builders
import { getRoutes } from 'expo-router/build/getRoutes';
// @ts-ignore - expo-router internal builders
import { getLinkingConfig } from 'expo-router/build/getLinkingConfig';

function buildMockContext() {
  const appDir = path.resolve(process.cwd(), 'src/app');
  const files: string[] = [];
  function walk(d: string, rel: string) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(full, r);
      } else {
        files.push('./' + r.replace(/\\/g, '/'));
      }
    }
  }
  walk(appDir, '');

  const ctx: any = () => ({});
  ctx.keys = () => files;
  ctx.resolve = (key: string) => key;
  ctx.id = 'src/app';
  return ctx;
}

describe('Universal Platform Routing & Entry Point Isolation', () => {
  it('ensures distinct root entry points exist for native mobile (index.tsx) and web (index.web.tsx)', () => {
    const nativeIndex = path.resolve(process.cwd(), 'src/app/index.tsx');
    const webIndex = path.resolve(process.cwd(), 'src/app/index.web.tsx');

    assert.ok(fs.existsSync(nativeIndex), 'src/app/index.tsx must exist for native mobile launch');
    assert.ok(fs.existsSync(webIndex), 'src/app/index.web.tsx must exist for web marketing landing');

    const nativeContent = fs.readFileSync(nativeIndex, 'utf8');
    assert.ok(
      nativeContent.includes('Redirect href="/(onboarding)"'),
      'Native mobile entry must route new/un-onboarded patients to onboarding'
    );
    assert.ok(
      nativeContent.includes('Redirect href="/(tabs)"'),
      'Native mobile entry must route authenticated patients to app tabs'
    );

    const webContent = fs.readFileSync(webIndex, 'utf8');
    assert.ok(
      webContent.includes('LandingPage'),
      'Web entry must serve the LandingPage component for visitors'
    );
  });

  it('verifies (auth) directory has no index route to prevent root route hijacking', () => {
    const authIndex = path.resolve(process.cwd(), 'src/app/(auth)/index.tsx');
    const authIndexWeb = path.resolve(process.cwd(), 'src/app/(auth)/index.web.tsx');

    assert.equal(
      fs.existsSync(authIndex),
      false,
      'src/app/(auth)/index.tsx must NOT exist to prevent mobile route hijacking'
    );
    assert.equal(
      fs.existsSync(authIndexWeb),
      false,
      'src/app/(auth)/index.web.tsx must NOT exist to prevent mobile route hijacking'
    );
  });

  it('resolves root "/" to native mobile index.tsx on Android without web conflicts', () => {
    const ctx = buildMockContext();
    const routes = getRoutes(ctx, { platform: 'android' });
    assert.ok(routes, 'Should construct route tree for android');

    const indexRoute = routes.children.find((c: any) => c.route === 'index');
    assert.ok(indexRoute, 'Route "index" must be present in route tree');
    assert.equal(indexRoute.contextKey, './index.tsx');

    const linking = getLinkingConfig(routes, ctx, {} as any);
    const state = linking.getStateFromPath('/', linking.config);

    const rootState = state?.routes?.[0]?.state;
    const initialRoute = rootState?.routes?.[0];
    assert.equal(initialRoute?.name, 'index', 'Android root "/" must resolve directly to "index"');
  });

  it('resolves root "/" to web index.web.tsx on Web platform', () => {
    const ctx = buildMockContext();
    const routes = getRoutes(ctx, { platform: 'web' });
    assert.ok(routes, 'Should construct route tree for web');

    const indexRoute = routes.children.find((c: any) => c.route === 'index');
    assert.ok(indexRoute, 'Route "index" must be present in web route tree');
    assert.equal(indexRoute.contextKey, './index.web.tsx');

    const linking = getLinkingConfig(routes, ctx, {} as any);
    const state = linking.getStateFromPath('/', linking.config);

    const rootState = state?.routes?.[0]?.state;
    const initialRoute = rootState?.routes?.[0];
    assert.equal(initialRoute?.name, 'index', 'Web root "/" must resolve directly to "index"');
  });
});
