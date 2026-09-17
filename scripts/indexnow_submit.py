"""IndexNow 提交脚本（无需账号）用法: python indexnow_submit.py"""
import json, os, sys, urllib.request, urllib.error

BASE = r"D:\code\image-watermark"
KEY_FILE = os.path.join(BASE, ".indexnow-key")
HOST = "haixiansheng.github.io"
SITE = f"https://{HOST}/image-watermark"

URLS = [f"{SITE}{p}" for p in [
    "/", "/blog/", "/blog/watermark-placement-guide.html", "/blog/crop-proof-watermark.html",
    "/about.html", "/privacy.html",
    "/en/", "/en/blog/", "/en/blog/watermark-placement-guide.html",
    "/en/blog/crop-proof-watermark.html", "/en/about.html", "/en/privacy.html",
]]
ENDPOINTS = ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow",
             "https://yandex.com/indexnow"]


def main():
    if not os.path.exists(KEY_FILE):
        print("找不到 .indexnow-key"); return 1
    key = open(KEY_FILE, encoding="utf-8").read().strip()
    kl = f"{SITE}/{key}.txt"
    print(f"校验 key: {kl}")
    try:
        with urllib.request.urlopen(kl, timeout=20) as r:
            body = r.read().decode("utf-8", "ignore").strip()
        if body != key:
            print("  内容不符"); return 1
        print(f"  HTTP {r.status} | OK")
    except Exception as e:
        print(f"  无法访问: {e}（请先部署）"); return 1
    data = json.dumps({"host": HOST, "key": key, "keyLocation": kl, "urlList": URLS}).encode("utf-8")
    print(f"提交 {len(URLS)} 个 URL")
    for ep in ENDPOINTS:
        try:
            req = urllib.request.Request(ep, data=data, method="POST",
                headers={"Content-Type": "application/json; charset=utf-8"})
            with urllib.request.urlopen(req, timeout=30) as r:
                st = r.status
            print(f"  {'OK' if st in (200, 202) else 'WARN'} {ep.split('/')[2]} -> HTTP {st}")
        except urllib.error.HTTPError as e:
            print(f"  WARN {ep.split('/')[2]} -> HTTP {e.code}")
        except Exception as e:
            print(f"  FAIL {ep.split('/')[2]} -> {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
