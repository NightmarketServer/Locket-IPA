// deleteHeader.js - remove certain headers to avoid server detection
var req = $request;
var headers = req.headers || {};

// Remove potentially sensitive headers
delete headers['x-revenuecat-etag'];
delete headers['x-revenuecat-signature'];
delete headers['if-none-match'];
delete headers['if-modified-since'];
delete headers['x-platform'];
delete headers['user-agent']; // optional: nếu bạn set UA ở config, client sẽ dùng giá trị đó

$done({ headers: headers });
