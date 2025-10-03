/*
 * forceGold_and_heart_bruteforce.js - NightmarketServer
 * - Merge an toàn vào response RevenueCat
 * - Bật Gold + nhiều entitlement/subscription để đảm bảo hiển huy hiệu trái tim (heart/watch)
 * - Thêm viewer/local flags để force hiển thị nếu app đọc các flag cục bộ
 *
 * Usage: add this as an http-response script for api.revenuecat.com
 */

var specificDate = "2025-09-02T00:00:00Z";

(function(){
  if (!$response || !$response.body) {
    $done({});
    return;
  }

  var obj;
  try {
    obj = JSON.parse($response.body);
  } catch (e) {
    console.log("forceGold_and_heart_bruteforce: parse error", e);
    $done({});
    return;
  }

  // Ensure shapes
  if (!obj.subscriber) obj.subscriber = {};
  if (!obj.subscriber.subscriptions || typeof obj.subscriber.subscriptions !== "object") obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};
  if (!obj.subscriber.entitlements || typeof obj.subscriber.entitlements !== "object") obj.subscriber.entitlements = obj.subscriber.entitlements || {};
  if (!obj.viewer || typeof obj.viewer !== "object") obj.viewer = obj.viewer || {};

  // Helpers
  function makeSub() {
    return {
      is_sandbox: false,
      ownership_type: "PURCHASED",
      billing_issues_detected_at: null,
      period_type: "normal",
      expires_date: "2099-12-31T23:59:59Z",
      grace_period_expires_date: null,
      unsubscribe_detected_at: null,
      original_purchase_date: specificDate,
      purchase_date: specificDate,
      store: "app_store"
    };
  }

  function makeEnt(productId){
    return {
      grace_period_expires_date: null,
      purchase_date: specificDate,
      product_identifier: productId || "locket.premium",
      expires_date: "2099-12-31T23:59:59Z"
    };
  }

  // -------------- product IDs (common variations) --------------
  var productIds = [
    "locket.premium",
    "com.locket.gold.yearly",
    "com.locket02.premium.yearly",
    "com.xunn.premium.yearly",
    "com.hoangvanbao.premium.yearly",
    "com.locket.watch_vip.yearly",
    "com.locket.heart.yearly",
    "com.locket.plus.yearly",
    "com.locket.pro.yearly"
  ];

  // Merge subscriptions safely
  productIds.forEach(function(pid){
    if (!obj.subscriber.subscriptions[pid]) {
      obj.subscriber.subscriptions[pid] = makeSub();
    } else {
      var s = obj.subscriber.subscriptions[pid];
      s.expires_date = s.expires_date || "2099-12-31T23:59:59Z";
      s.purchase_date = s.purchase_date || specificDate;
      s.original_purchase_date = s.original_purchase_date || specificDate;
      s.ownership_type = s.ownership_type || "PURCHASED";
    }
  });

  // -------------- entitlement keys mapping (brute force) --------------
  var entMap = {
    // Gold / premium keys
    "Gold": "locket.premium",
    "premium": "locket.premium",
    "pro": "locket.premium",
    // Heart/watch related keys (common guesses)
    "vip+watch_vip": "com.locket.watch_vip.yearly",
    "watch_vip": "com.locket.watch_vip.yearly",
    "vip_watch": "com.locket.watch_vip.yearly",
    "heart": "com.locket.heart.yearly",
    "locket_heart": "com.locket.heart.yearly",
    "heart_vip": "com.locket.heart.yearly",
    "locket_gold": "com.locket.gold.yearly",
    "gold_tier": "com.locket.gold.yearly",
    "premium_v2": "com.locket.plus.yearly",
    // legacy / other variants
    "vip": "locket.premium",
    "watch": "com.locket.watch_vip.yearly",
    "heart_plus": "com.locket.heart.yearly"
  };

  Object.keys(entMap).forEach(function(entKey){
    var pid = entMap[entKey] || "locket.premium";
    if (!obj.subscriber.entitlements[entKey]) {
      obj.subscriber.entitlements[entKey] = makeEnt(pid);
    } else {
      var e = obj.subscriber.entitlements[entKey];
      e.product_identifier = e.product_identifier || pid;
      e.expires_date = e.expires_date || "2099-12-31T23:59:59Z";
      e.purchase_date = e.purchase_date || specificDate;
    }
  });

  // -------------- viewer/local flags (some apps respect these) --------------
  // Add local badge ids so UI that reads viewer.local_badges will show hearts/awards
  obj.viewer.local_badges = obj.viewer.local_badges || [];

  // Try to push a couple of badge ids that some clients/UI use
  var suggestedBadges = [
    "vip+watch_vip",
    "watch_vip",
    "heart",
    "locket_heart",
    "nightmarket_heart" // custom
  ];

  suggestedBadges.forEach(function(bid){
    if (obj.viewer.local_badges.indexOf(bid) === -1) obj.viewer.local_badges.push(bid);
  });

  // Also add a lightweight field some versions check
  obj.subscriber.badge_flags = obj.subscriber.badge_flags || {};
  obj.subscriber.badge_flags.heart = true;
  obj.subscriber.badge_flags.gold = true;

  // Debug flags so you can confirm script ran
  obj.__nightmarket = obj.__nightmarket || {};
  obj.__nightmarket.forceGold_heart = true;
  obj.__nightmarket.timestamp = new Date().toISOString();

  $done({ body: JSON.stringify(obj) });
})();
