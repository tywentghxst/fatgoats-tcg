import { test, expect } from "@playwright/test";
const deck = Array.from(
  { length: 16 },
  (_, i) => `fg-${String(i + 1).padStart(2, "0")}`,
);
test("desktop command, deck editing and playable bot turn", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Legends aren't born/ }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/fatgoats-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Deck forge", exact: true }).click();
  await expect(page.locator(".forge-card")).toHaveCount(47);
  await page
    .getByRole("button", { name: "Remove Donovan", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Test deck" })).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Deck forge", exact: true }).click();
  await expect(page.locator(".deck-counter")).toContainText("15");
  await page.getByRole("button", { name: "Add Donovan", exact: true }).click();
  await page.getByRole("button", { name: "Test deck" }).click();
  await expect(
    page.getByRole("heading", { name: "Your move, duelist." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /End turn/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your move, duelist." }),
  ).toBeVisible({ timeout: 15000 });
  const summon = page
    .getByRole("button", { name: "Summon", exact: true })
    .filter({ visible: true });
  for (let i = 0; i < (await summon.count()); i++) {
    if (await summon.nth(i).isEnabled()) {
      await summon.nth(i).click();
      break;
    }
  }
  await expect(page.locator(".own-core")).toContainText("1000");
  await page.screenshot({ path: "/tmp/fatgoats-arena.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("mobile layout, rules dialog, tag duel and bracket", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "/tmp/fatgoats-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Learn to duel" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /2 VS 2 Tag team/ }).click();
  await expect(page.locator(".battle-row")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Tournaments", exact: true }).click();
  await page.getByRole("button", { name: "Create bracket" }).click();
  await page
    .getByRole("button", { name: "Record You as winner", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record Donovan as winner", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record You as winner", exact: true })
    .click();
  await expect(page.locator(".bracket section").last()).toContainText("You");
});
test("authoritative room supports joins, hidden hands, stale moves and tag bots", async ({
  request,
}) => {
  let res = await request.post("/api/rooms", {
    data: { name: "Host", deck, mode: "tag" },
  });
  expect(res.ok()).toBeTruthy();
  const host = await res.json();
  res = await request.post(`/api/rooms/${host.code}/join`, {
    data: { name: "Friend", deck },
  });
  const guest = await res.json();
  expect(guest.seat).toBe(1);
  res = await request.post(`/api/rooms/${host.code}/start`, {
    headers: { "X-Room-Token": guest.token },
    data: {},
  });
  expect(res.status()).toBe(400);
  res = await request.post(`/api/rooms/${host.code}/start`, {
    headers: { "X-Room-Token": host.token },
    data: {},
  });
  const started = await res.json();
  expect(started.game.seats).toHaveLength(4);
  expect(started.game.seats[1].hand).toEqual(["?", "?", "?", "?"]);
  expect(started.game.seats[2].bot).toBe(true);
  expect((await request.get(`/api/rooms/${host.code}`)).status()).toBe(403);
  res = await request.post(`/api/rooms/${host.code}/action`, {
    headers: { "X-Room-Token": guest.token },
    data: { revision: 0, action: { type: "end" } },
  });
  expect(res.status()).toBe(400);
  res = await request.post(`/api/rooms/${host.code}/action`, {
    headers: { "X-Room-Token": host.token },
    data: { revision: 0, action: { type: "end" } },
  });
  expect(res.ok()).toBeTruthy();
  res = await request.post(`/api/rooms/${host.code}/action`, {
    headers: { "X-Room-Token": host.token },
    data: { revision: 0, action: { type: "end" } },
  });
  expect(res.status()).toBe(409);
  res = await request.get(`/api/rooms/${host.code}`, {
    headers: { "X-Room-Token": guest.token },
  });
  expect((await res.json()).game.seats[0].hand).toEqual(["?", "?", "?", "?"]);
  expect((await request.get("/api/save")).status()).toBe(400);
  expect(
    (
      await request.post("/api/rooms", {
        headers: { Origin: "https://evil.example" },
        data: { deck },
      })
    ).status(),
  ).toBe(403);
});

test("two browser players join and synchronize a duel", async ({ browser }) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const host = await a.newPage(),
    guest = await b.newPage();
  await host.goto("http://127.0.0.1:3180");
  await guest.goto("http://127.0.0.1:3180");
  await host.getByRole("button", { name: "Friends", exact: true }).click();
  await host
    .getByRole("button", { name: "Create private room", exact: true })
    .click();
  const invite = await host.locator(".room-code").innerText();
  await guest.getByRole("button", { name: "Friends", exact: true }).click();
  await guest.getByLabel("Invite code").fill(invite);
  await guest.getByRole("button", { name: "Join friend", exact: true }).click();
  await expect(host.locator(".player-row")).toHaveCount(2);
  await host
    .getByRole("button", {
      name: "Start · fill empty seats with bots",
      exact: true,
    })
    .click();
  await guest
    .getByRole("button", { name: "Return to duel", exact: true })
    .click();
  await expect(guest.getByRole("button", { name: /End turn/ })).toBeDisabled();
  await host.getByRole("button", { name: /End turn/ }).click();
  await expect(guest.getByRole("button", { name: /End turn/ })).toBeEnabled();
  await guest.reload();
  await guest.getByRole("button", { name: "Resume duel", exact: true }).click();
  await expect(guest.getByRole("button", { name: /End turn/ })).toBeEnabled();
  await a.close();
  await b.close();
});
