const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH ||
    "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core",
);
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const dir = path.resolve(__dirname, ".."),
  kind = "jane";
let server, browser;
(async () => {
  try {
    server = spawn(
      "python3",
      ["-m", "http.server", "3188", "--bind", "127.0.0.1"],
      { cwd: dir, stdio: "ignore" },
    );
    for (let i = 0; i < 80; i++) {
      try {
        await fetch("http://127.0.0.1:3188");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    browser = await chromium.launch({
      executablePath:
        process.env.CHROMIUM_PATH ||
        "/tmp/web-chrome136/chrome-headless-shell-linux64/chrome-headless-shell",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    let results = [];
    for (const width of [1440, 390]) {
      const p = await browser.newPage({ viewport: { width, height: 950 } });
      let errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("dialog", (d) => d.accept());
      await p.goto("http://127.0.0.1:3188");
      if (kind === "gemhub") {
        await p.locator("#search").fill("handbook");
        assert.equal(await p.locator("#gems article").count(), 1);
        await p.locator("#search").fill("");
        await p.locator("[name=title]").fill("Browser acceptance gem");
        await p.locator("[name=url]").fill("https://example.com/check");
        await p.locator("[name=notes]").fill("<script>safe text</script>");
        await p.locator("#add button").click();
        assert.equal(await p.locator("#count").innerText(), "5");
        await p.locator("[data-save]").first().click();
        await p.reload();
        assert.equal(await p.locator("#count").innerText(), "5");
        await p.locator("#view").selectOption("saved");
        assert.equal(await p.locator("#gems article").count(), 3);
        const dl = p.waitForEvent("download");
        await p.locator("#export").click();
        const d = await dl;
        const file = await d.path();
        const backup = JSON.parse(fs.readFileSync(file, "utf8"));
        assert.equal(backup.length, 5);
        await p
          .locator("#import")
          .setInputFiles({
            name: "backup.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(backup)),
          });
        await p.waitForFunction(() =>
          document.getElementById("status").textContent.includes("restored"),
        );
        await p.locator("#view").selectOption("all");
        await p.locator("[data-delete]").first().click();
        assert.equal(await p.locator("#count").innerText(), "4");
      }
      if (kind === "insurance") {
        const before = await p.locator("#plans .metric").first().innerText();
        await p.locator("[name=coverage]").fill("600000");
        await p.locator("#scenario button").click();
        assert.notEqual(
          await p.locator("#plans .metric").first().innerText(),
          before,
        );
        await p.locator("[data-save]").first().click();
        await p.reload();
        assert.equal(await p.locator("[name=coverage]").inputValue(), "600000");
        assert.equal(await p.locator("#shortCount").innerText(), "1");
        const dl = p.waitForEvent("download");
        await p.locator("#export").click();
        const d = await dl;
        const data = JSON.parse(fs.readFileSync(await d.path(), "utf8"));
        assert.equal(data.scenario.coverage, 600000);
        assert.match(data.disclaimer, /Fictional/);
        await p.locator("#reset").click();
        assert.equal(await p.locator("[name=coverage]").inputValue(), "300000");
      }
      if (kind === "jane") {
        await p.locator("[name=price]").fill("100.00");
        await p.locator("#quote button").click();
        assert.equal(await p.locator("#bids [data-cancel]").count(), 1);
        await p.locator("#run").click();
        assert.equal(await p.locator("#tick").innerText(), "TICK 20");
        assert.ok((await p.locator("#fills tr").count()) > 0);
        const before = await p.locator("#pnl").innerText();
        await p.locator("#replay").click();
        assert.equal(await p.locator("#pnl").innerText(), before);
        await p.reload();
        assert.equal(await p.locator("#tick").innerText(), "TICK 20");
        assert.equal(await p.locator("#pnl").innerText(), before);
        await p.locator("[name=quantity]").fill("1000");
        await p.locator("#quote button").click();
        await p.waitForFunction(() =>
          document.getElementById("status").textContent.includes("limit"),
        );
        const dl = p.waitForEvent("download");
        await p.locator("#export").click();
        const d = await dl;
        const data = JSON.parse(fs.readFileSync(await d.path(), "utf8"));
        assert.equal(data.summary.tick, 20);
        assert.ok(data.actions.length >= 21);
        await p.locator("#cancel").click();
        assert.equal(await p.locator("[data-cancel]").count(), 0);
      }
      assert.deepEqual(errors, []);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2,
        ),
        false,
      );
      await p.screenshot({
        path: `/tmp/phase3-${kind}-${width}.png`,
        fullPage: true,
      });
      results.push({ width, pass: true, pageErrors: errors, overflow: false });
      await p.close();
    }
    console.log(JSON.stringify({ repo: dir, pass: true, results }));
  } catch (e) {
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
  }
})();
