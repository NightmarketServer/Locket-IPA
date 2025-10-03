/*
 * forceGold_merged.js - NightmarketServer
 * Robust merge into RevenueCat response:
 * - đảm bảo nhiều key subscription + entitlement (Gold, premium, pro, vip+watch_vip)
 * - không ghi đè toàn bộ obj.subscriber (merge an toàn)
 * - dùng specificDate để đồng bộ
 */

var specificDate = "2025-09-02T00:00:00Z";

(function(){
  if (!$response || !$response.body) {
    $done({});
    return;
  }

  var body = $response.body;
  var obj;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    console.log("forceGold_merged: JSON parse error:", e);
    $done({});
    return;
  }

  // Ensure structures exist
  if (!obj.subscriber) obj.subscriber = {};
  if (!obj.subscriber.subscriptions || typeof obj.subscriber.subscriptions !== "object") obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};
  if (!obj.subscriber.entitlements || typeof obj.subscriber.entitlements !== "object") obj.subscriber.entitlements = obj.subscriber.entitlements || {};

  // Helper: create subscription object
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

  // Helper: create entitlement object
  function makeEnt(productId){
    return {
      grace_period_expires_date: null,
      purchase_date: specificDate,
      product_identifier: productId || "locket.premium",
      expires_date: "2099-12-31T23:59:59Z"
    };
  }

  // List of subscription keys to ensure (merge)
  var subsToAdd = [
    "locket.premium",
    "com.locket02.premium.yearly",
    "com.xunn.premium.yearly",
    "com.hoangvanbao.premium.yearly"
  ];

  subsToAdd.forEach(function(k){
    if (!obj.subscriber.subscriptions[k]) {
      obj.subscriber.subscriptions[k] = makeSub();
    } else {
      // merge dates if missing (keep server values if present)
      obj.subscriber.subscriptions[k].expires_date = obj.subscriber.subscriptions[k].expires_date || "2099-12-31T23:59:59Z";
      obj.subscriber.subscriptions[k].purchase_date = obj.subscriber.subscriptions[k].purchase_date || specificDate;
      obj.subscriber.subscriptions[k].original_purchase_date = obj.subscriber.subscriptions[k].original_purchase_date || specificDate;
    }
  });

  // List of entitlement keys to ensure (merge)
  var ents = {
    "Gold": "locket.premium",
    "premium": "locket.premium",
    "pro": "locket.premium",
    "vip+watch_vip": "com.xunn.premium.yearly"
  };

  Object.keys(ents).forEach(function(key){
    if (!obj.subscriber.entitlements[key]) {
      obj.subscriber.entitlements[key] = makeEnt(ents[key]);
    } else {
      obj.subscriber.entitlements[key].product_identifier = obj.subscriber.entitlements[key].product_identifier || ents[key];
      obj.subscriber.entitlements[key].expires_date = obj.subscriber.entitlements[key].expires_date || "2099-12-31T23:59:59Z";
      obj.subscriber.entitlements[key].purchase_date = obj.subscriber.entitlements[key].purchase_date || specificDate;
    }
  });

  // Add a small local flag for debugging
  obj.__nightmarket = obj.__nightmarket || {};
  obj.__nightmarket.forceGold_applied = true;
  obj.__nightmarket.timestamp = new Date().toISOString();

  $done({ body: JSON.stringify(obj) });
})();
