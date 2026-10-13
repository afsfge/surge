const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/meituan-dns-simple.js'), 'utf8');
const internal = { servers: ['11.11.11.12', '11.11.11.11'] };
const domestic = { servers: ['223.6.6.6', '119.29.29.29'] };
function resolve(globals) {
  const results = [];
  vm.runInNewContext(source, {
    ...globals,
    $done: result => results.push(JSON.parse(JSON.stringify(result))),
  }, { timeout: 1000 });
  assert.equal(results.length, 1, '每次查询必须且只能调用一次 $done');
  return results[0];
}

let count = 0;
const networks = [
  [{ wifi: { ssid: 'Meituan' } }, true],
  [{ wifi: { ssid: 'Home' } }, false],
  [{ wifi: { ssid: 'meituan' } }, false],
  [{ wifi: { ssid: '' } }, false],
  [{ wifi: null }, false],
  [{}, false],
  [null, false],
  [undefined, false],
];
const domains = [
  ['sankuai.com', true], ['km.sankuai.com', true],
  ['51ping.com', true], ['a.b.51ping.com', true],
  ['KM.SANKUAI.COM.', true], ['51PING.COM.', true],
  ['evilsankuai.com', false], ['sankuai.com.example.org', false],
  ['evil51ping.com', false], ['example.org', false],
  ['', false], [undefined, false],
];
for (const [network, atOffice] of networks) {
  for (const [domain, company] of domains) {
    for (const argument of ['domestic', 'default', undefined, 'unknown']) {
      const globals = {};
      if (network !== undefined) globals.$network = network;
      if (domain !== undefined) globals.$domain = domain;
      if (argument !== undefined) globals.$argument = argument;
      const expected = atOffice && company ? internal : argument === 'domestic' ? domestic : {};
      assert.deepEqual(resolve(globals), expected, JSON.stringify({ network, domain, argument }));
      count++;
    }
  }
}

const moduleText = fs.readFileSync(path.join(root, 'Meituan-DNS-Simple.sgmodule'), 'utf8');
assert.ok(!/^#!system=mac\s*$/m.test(moduleText), '模块不能仅限制 macOS');
assert.match(moduleText, /RULE-SET:https:\/\/raw\.githubusercontent\.com\/Loyalsoldier\/surge-rules\/release\/ruleset\/direct\.txt = script:meituan-dns-domestic/);
assert.ok(moduleText.indexOf('*.local = server:system') < moduleText.indexOf('RULE-SET:'));
assert.ok(moduleText.indexOf('RULE-SET:') < moduleText.indexOf('* = script:meituan-dns-default'));
for (const entry of ['domestic', 'default']) {
  assert.ok(moduleText.includes(`meituan-dns-${entry} = type=dns,engine=jsc,script-path=https://raw.githubusercontent.com/afsfge/surge/main/scripts/meituan-dns-simple.js,argument=${entry}`));
}
console.log(`通过 ${count} 组 DNS 分支测试及模块入口检查。`);
