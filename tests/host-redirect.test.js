const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const nextConfig = require('../next.config.js');

const PRODUCTION_ALIAS = 'kiwipop.vercel.app';
const PREVIEW_HOSTS = [
  'kiwipop-git-agent-baseline-hardening-tennysonmilesperhour.vercel.app',
  'kiwipop-abc123-tennysonmilesperhour.vercel.app',
  'www.kiwipop.fun',
  'kiwipop.fun',
];

describe('kiwipop.vercel.app host redirect', () => {
  it('permanently redirects only the exact production alias, preserving path', async () => {
    const redirects = await nextConfig.redirects();
    const hostRedirects = redirects.filter((rule) =>
      (rule.has || []).some((condition) => condition.type === 'host'),
    );

    assert.equal(hostRedirects.length, 1);
    const rule = hostRedirects[0];
    assert.equal(rule.permanent, true);
    assert.equal(rule.source, '/:path*');
    assert.equal(rule.destination, 'https://www.kiwipop.fun/:path*');
    assert.deepEqual(rule.has, [{ type: 'host', value: PRODUCTION_ALIAS }]);

    const matchedHosts = rule.has
      .filter((condition) => condition.type === 'host')
      .map((condition) => condition.value);
    assert.deepEqual(matchedHosts, [PRODUCTION_ALIAS]);
    for (const host of PREVIEW_HOSTS) {
      assert.equal(matchedHosts.includes(host), false, `${host} must not redirect`);
    }
  });
});
