const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/meituan-company-dns-v2.js'), 'utf8');
const moduleText = fs.readFileSync(path.join(root, 'DNS-Routing.sgmodule'), 'utf8');
const cases = [
  [{ wifi: { ssid: 'Meituan' } }, true],
  [{ wifi: { ssid: 'Home' } }, false],
  [{ wifi: { ssid: 'meituan' } }, false],
  [{ wifi: { ssid: '' } }, false],
  [{ wifi: null }, false], [{}, false], [null, false], [undefined, false],
];
for (const [network, internal] of cases) {
  const results = [];
  const context = { $done: v => results.push(JSON.parse(JSON.stringify(v))) };
  if (network !== undefined) context.$network = network;
  vm.runInNewContext(source, context, { timeout: 1000 });
  assert.deepEqual(results, [{ servers: internal ? ['11.11.11.12', '11.11.11.11'] : ['223.6.6.6', '119.29.29.29'] }]);
}
const hosts = moduleText.split('[Host]')[1].split('[Script]')[0];
const mappings = hosts.split('\n').filter(l => l.includes(' = script:'));
assert.deepEqual(mappings.map(l => l.split(' = ')[0]), ['RULE-SET:https://raw.githubusercontent.com/afsfge/surge/main/meituan_dns.list']);
assert.ok(mappings.every(l => l.endsWith('script:meituan-company-dns-v2')));
assert.ok(!/^\*\s*=/m.test(hosts));
assert.match(hosts, /RULE-SET:.*direct\.txt = server:223\.6\.6\.6,119\.29\.29\.29/);
assert.ok(hosts.indexOf('meituan_dns.list = script:') < hosts.indexOf('RULE-SET:https://raw.githubusercontent.com/Loyalsoldier/'));
for (const domain of ['apple.com.cn', 'icloud.com', 'weixin.com', 'tencent.com', 'apple.com']) {
  assert.ok(hosts.includes(`*.${domain} = server:119.29.29.29`));
}
assert.match(moduleText, /meituan-company-dns-v2 = type=dns,engine=jsc,script-path=https:\/\/raw\.githubusercontent\.com\/afsfge\/surge\/main\/scripts\/meituan-company-dns-v2\.js/);
console.log('通过 8 组网络分支测试；确认仅公司域名进入脚本、无通配脚本兜底、原生 DNS 规则完整。');

assert.equal(moduleText, fs.readFileSync(path.join(root, 'Meituan-DNS-V2.sgmodule'), 'utf8'), '旧订阅地址应与新版一致');
const firstRule = hosts.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#'));
assert.equal(firstRule, 'RULE-SET:https://raw.githubusercontent.com/afsfge/surge/refs/heads/main/force_doh.list = server:https://j16nfj6elr.cloudflare-gateway.com/dns-query');
console.log('确认旧订阅兼容、强制 DoH 入口优先匹配。');
