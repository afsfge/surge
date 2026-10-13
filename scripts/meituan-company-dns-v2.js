// 仅由模块中明确列出的公司域名触发；公司清单在模块中维护。
const isMeituan = typeof $network !== "undefined" && $network != null &&
  $network.wifi != null && $network.wifi.ssid === "Meituan";

// 不先请求内网再回退：离开公司 Wi-Fi 时直接使用公网 DNS。
$done({ servers: isMeituan
  ? ["11.11.11.12", "11.11.11.11"]
  : ["223.6.6.6", "119.29.29.29"] });
