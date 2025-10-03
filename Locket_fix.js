/*
 * Locket_fix.js - NightmarketServer
 * Robust merged fixer for RevenueCat responses: add/merge common subscriptions & entitlements
 * Use as an http-response script for api.revenuecat.com
 */

var specificDate = "2025-09-02T00:00:00Z";

(function () {
  if (!$response || !$response.body) {
    $done({});
    return;
  }

  var obj;
  try {
    obj = JSON.parse($response.body);
  } catch (e) {
    console.log("Locket_fix: JSON parse error:", e);
    $done({});
    return;
  }

  if (!obj.subscriber) obj.subscriber = {};
  if (!obj.subscriber.subscriptions || typeof obj.subscriber.subscriptions !== "object") obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};
  if (!obj.subscriber.entitlements || typeof obj.subscriber.entitlements !== "object") obj.subscriber.entitlements = obj.subscriber.entitlements || {};

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

  function makeEnt(productId) {
    return {
      grace_period_expires_date: null,
      purchase_date: specificDate,
      product_identifier: productId || "locket.premium",
      expires_date: "2099-12-31T23:59:59Z"
    };
  }

  // Common product ids and subscription keys
  var subs = [
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

  subs.forEach(function (k) {
    if (!obj.subscriber.subscriptions[k]) {
      obj.subscriber.subscriptions[k] = makeSub();
    } else {
      var s = obj.subscriber.subscriptions[k];
      s.expires_date = s.expires_date || "2099-12-31T23:59:59Z";
      s.purchase_date = s.purchase_date || specificDate;
      s.original_purchase_date = s.original_purchase_date || specificDate;
      s.ownership_type = s.ownership_type || "PURCHASED";
    }
  });

  // Entitlement mapping - many common keys
  var entMap = {
    "Gold": "locket.premium",
    "premium": "locket.premium",
    "pro": "locket.premium",
    "vip+watch_vip": "com.locket.watch_vip.yearly",
    "watch_vip": "com.locket.watch_vip.yearly",
    "vip_watch": "com.locket.watch_vip.yearly",
    "heart": "com.locket.heart.yearly",
    "locket_heart": "com.locket.heart.yearly",
    "heart_vip": "com.locket.heart.yearly",
    "locket_gold": "com.locket.gold.yearly",
    "gold_tier": "com.locket.gold.yearly",
    "premium_v2": "com.locket.plus.yearly",
    "vip": "locket.premium",
    "watch": "com.locket.watch_vip.yearly",
    "heart_plus": "com.locket.heart.yearly",
    "vip+pro": "locket.premium"
  };

  Object.keys(entMap).forEach(function (entKey) {
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

  // Add safe debug marker
  obj.__nightmarket = obj.__nightmarket || {};
  obj.__nightmarket.fix_applied = true;
  obj.__nightmarket.ts = new Date().toISOString();

  $done({ body: JSON.stringify(obj) });
})();
