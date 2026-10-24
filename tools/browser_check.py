# Real-browser check. Needs: pip install playwright && playwright install chromium
# Run: python3 tools/browser_check.py   (checks the interruption flow, then a random-click stress; fails on any page error)
from playwright.sync_api import sync_playwright
import random
import os, pathlib
root=pathlib.Path(__file__).resolve().parent.parent; out=str(root/"tools")+"/"
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1400,"height":900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto((root/"index.html").as_uri()); pg.wait_for_timeout(400)
    pg.click("[data-do='origin:0']"); pg.wait_for_timeout(100)
    # real interruption through the real action: seclude until one happens
    hit=False
    for i in range(60):
        pg.evaluate("WB.S.age=20; WB.S.lifespan=500")
        if pg.evaluate("WB.S.forced"): hit=True; break
        pg.evaluate("WBUI.go('seclude:10')"); pg.wait_for_timeout(15)
    dis=pg.evaluate("[...document.querySelectorAll('#actions button')].map(b=>[b.textContent.slice(0,22), b.disabled])")
    print("interrupted by real seclusion:", hit, "| event:", pg.evaluate("WB.S.ev"), "| buttons:", dis)
    pg.screenshot(path="/tmp/worldbound_forced.png")
    pg.evaluate("WBUI.go('seclude:3')"); print("toast after blocked seclude:", pg.inner_text("#toast"))
    # random-click stress over many lives
    random.seed(7); lives0=pg.evaluate("WB.M.lives")
    for i in range(500):
        sel="#choices button:not([disabled]), #actions button:not([disabled]), #panel button:not([disabled])"
        els=pg.locator(sel); n=els.count()
        if n==0: break
        try: els.nth(random.randrange(n)).click(timeout=500)
        except Exception: pass
        if i%400==0 and pg.evaluate("document.querySelector('#moment') && !document.querySelector('#moment').hidden"): pg.evaluate("document.querySelector('#moment').click()")
    print("lives completed during stress:", pg.evaluate("WB.M.lives")-lives0, "| page errors:", errs or "none")
    b.close()
import sys; sys.exit(1 if errs else 0)
