/*
 * forcegold.js - NightmarketServer (local-only)
 * Apply Gold + Heart only when User-Agent contains UNIQUE_UA_SUBSTRING
 */

var UNIQUE_UA_SUBSTRING = "REPLACE_WITH_YOUR_UNIQUE_UA"; // <<< replace this with your unique UA substring
var specificDate = "2025-09-02T00:00:00Z";
var FAKE_EXPIRES = "2099-12-31T23:59:59Z";

(function(){
  var ua = "";
  try {
    ua = ($request && ($request.headers["User-Agent"] || $request.headers["user-agent"])) || "";
    if (!ua && $response && $response.request && $response.request.headers) {
      ua = $response.request.headers["User-Agent"] || $response.request.headers["user-agent"] || "";
    }
  } catch(e){}

  if (!$response || !$response.body) {
    $done({});
    return;
  }

  var obj;
  try {
    obj = JSON.parse($response.body);
  } catch (e) {
    console.log("forcegold: parse error", e);
    $done({});
    return;
  }

  if (!obj.subscriber) obj.subscriber = {};
  if (!obj.subscriber.subscriptions || typeof obj.subscriber.subscriptions !== "object") obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};
  if (!obj.subscriber.entitlements || typeof obj.subscriber.entitlements !== "object") obj.subscriber.entitlements = obj.subscriber.entitlements || {};
  if (!obj.viewer || typeof obj.viewer !== "object") obj.viewer = obj.viewer || {};

  function makeSub() {
    return {
      is_sandbox: false,
      ownership_type: "PURCHASED",
      billing_issues_detected_at: null,
      period_type: "normal",
      expires_date: FAKE_EXPIRES,
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
      expires_date: FAKE_EXPIRES
    };
  }

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
    "heart_plus": "com.locket.heart.yearly"
  };

  function applyFake() {
    productIds.forEach(function(pid){
      if (!obj.subscriber.subscriptions[pid]) obj.subscriber.subscriptions[pid] = makeSub();
      else {
        var s = obj.subscriber.subscriptions[pid];
        s.expires_date = s.expires_date || FAKE_EXPIRES;
        s.purchase_date = s.purchase_date || specificDate;
        s.original_purchase_date = s.original_purchase_date || specificDate;
        s.ownership_type = s.ownership_type || "PURCHASED";
      }
    });

    Object.keys(entMap).forEach(function(entKey){
      var pid = entMap[entKey] || "locket.premium";
      if (!obj.subscriber.entitlements[entKey]) obj.subscriber.entitlements[entKey] = makeEnt(pid);
      else {
        var e = obj.subscriber.entitlements[entKey];
        e.product_identifier = e.product_identifier || pid;
        e.expires_date = e.expires_date || FAKE_EXPIRES;
        e.purchase_date = e.purchase_date || specificDate;
      }
    });

    obj.viewer.local_badges = obj.viewer.local_badges || [];
    var suggestedBadges = ["vip+watch_vip","watch_vip","heart","locket_heart","nightmarket_heart"];
    suggestedBadges.forEach(function(bid){
      if (obj.viewer.local_badges.indexOf(bid) === -1) obj.viewer.local_badges.push(bid);
    });

    obj.subscriber.badge_flags = obj.subscriber.badge_flags || {};
    obj.subscriber.badge_flags.heart = true;
    obj.subscriber.badge_flags.gold = true;

    obj.__nightmarket = obj.__nightmarket || {};
    obj.__nightmarket.local_only = true;
    obj.__nightmarket.applied_by = "forcegold.js";
    obj.__nightmarket.ts = new Date().toISOString();
  }

  function removeFake() {
    // remove subs with our FAKE_EXPIRES
    Object.keys(obj.subscriber.subscriptions).forEach(function(k){
      try {
        var s = obj.subscriber.subscriptions[k];
        if (s && s.expires_date === FAKE_EXPIRES) delete obj.subscriber.subscriptions[k];
      } catch(e){}
    });

    Object.keys(obj.subscriber.entitlements).forEach(function(k){
      try {
        var e = obj.subscriber.entitlements[k];
        if (e && e.expires_date === FAKE_EXPIRES) delete obj.subscriber.entitlements[k];
      } catch(e){}
    });

    if (Array.isArray(obj.viewer.local_badges)) {
      obj.viewer.local_badges = obj.viewer.local_badges.filter(function(bid){
        return ["vip+watch_vip","watch_vip","heart","locket_heart","nightmarket_heart"].indexOf(bid) === -1;
      });
      if (obj.viewer.local_badges.length === 0) delete obj.viewer.local_badges;
    }

    if (obj.subscriber.badge_flags) {
      try {
        if (obj.subscriber.badge_flags.heart === true) delete obj.subscriber.badge_flags.heart;
        if (obj.subscriber.badge_flags.gold === true) delete obj.subscriber.badge_flags.gold;
        if (Object.keys(obj.subscriber.badge_flags).length === 0) delete obj.subscriber.badge_flags;
      } catch(e){}
    }

    if (obj.__nightmarket) delete obj.__nightmarket;
  }

  try {
    if (ua && ua.indexOf(UNIQUE_UA_SUBSTRING) !== -1) {
      applyFake();
    } else {
      removeFake();
    }
  } catch(e){
    console.log("forcegold: apply/remove error", e);
  }

  $done({ body: JSON.stringify(obj) });
})();
