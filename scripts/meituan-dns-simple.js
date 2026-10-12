// 每项匹配根域名和以点分隔的子域名；公司域名只在这里维护。
const companyDomains = ["sankuai.com", "51ping.com"];
const companyServers = ["11.11.11.12", "11.11.11.11"];
const domesticServers = ["223.6.6.6", "119.29.29.29"];

const domain = typeof $domain === "string"
  ? $domain.toLowerCase().replace(/\.$/, "")
  : "";
const isCompany = companyDomains.some(suffix =>
  domain === suffix || domain.endsWith("." + suffix)
);
const isMeituan = typeof $network !== "undefined" && $network != null &&
  $network.wifi != null && $network.wifi.ssid === "Meituan";

if (isMeituan && isCompany) {
  $done({ servers: companyServers });
} else if (typeof $argument !== "undefined" && $argument === "domestic") {
  $done({ servers: domesticServers });
} else {
  // 标准解析使用主配置的默认 DNS；主配置需保持启用 DoH。
  // 返回空对象不会继续匹配后面的 Host 规则。
  $done({});
}
