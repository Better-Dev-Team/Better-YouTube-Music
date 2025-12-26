/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./Extensions/combined/src/config.js
const DEV_API_URL = "https://localhost:7258";
const PROD_API_URL = "https://returnyoutubedislikeapi.com";

const runtime = typeof chrome !== "undefined" ? chrome.runtime : null;
const manifest = typeof runtime?.getManifest === "function" ? runtime.getManifest() : null;
const isDevelopment = false;

const extensionChangelogUrl =
  runtime && typeof runtime.getURL === "function"
    ? runtime.getURL("changelog/4/changelog_4.0.html")
    : "https://returnyoutubedislike.com/changelog/4/changelog_4.0.html";

const config = {
  apiUrl: isDevelopment ? DEV_API_URL : PROD_API_URL,

  voteDisabledIconName: "icon_hold128.png",
  defaultIconName: "icon128.png",

  links: {
    website: "https://returnyoutubedislike.com",
    github: "https://github.com/Anarios/return-youtube-dislike",
    discord: "https://discord.gg/mYnESY4Md5",
    donate: "https://returnyoutubedislike.com/donate",
    faq: "https://returnyoutubedislike.com/faq",
    help: "https://returnyoutubedislike.com/help",
    changelog: extensionChangelogUrl,
  },

  defaultExtConfig: {
    disableVoteSubmission: false,
    disableLogging: true,
    coloredThumbs: false,
    coloredBar: false,
    colorTheme: "classic",
    numberDisplayFormat: "compactShort",
    numberDisplayReformatLikes: false,
    hidePremiumTeaser: false,
  },
};

function getApiUrl() {
  return config.apiUrl;
}

function getApiEndpoint(endpoint) {
  return `${config.apiUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}

function getChangelogUrl() {
  return config.links?.changelog ?? extensionChangelogUrl;
}



;// ./Extensions/combined/ryd.background.js


const apiUrl = getApiUrl();
const voteDisabledIconName = config.voteDisabledIconName;
const defaultIconName = config.defaultIconName;
let api;
const CHANGELOG_STORAGE_KEY = "lastShownChangelogVersion";
const PENDING_CHANGELOG_STORAGE_KEY = "pendingChangelogVersion";

/** stores extension's global config */
let extConfig = { ...config.defaultExtConfig };

if (isChrome()) api = chrome;
else if (isFirefox()) api = browser;

initExtConfig();

function broadcastPatreonStatus(authenticated, user, sessionToken) {
  chrome.tabs.query({}, (tabs) => {
    tabs
      .filter((tab) => tab.url && tab.url.includes("youtube.com"))
      .forEach((tab) => {
        const maybePromise = chrome.tabs.sendMessage(
          tab.id,
          {
            message: "patreon_status_changed",
            authenticated,
            user: authenticated ? user : null,
            sessionToken: authenticated ? sessionToken : null,
          },
          () => {
            if (chrome.runtime.lastError) {
              console.debug("Patreon status broadcast skipped:", chrome.runtime.lastError.message);
            }
          },
        );

        if (maybePromise && typeof maybePromise.catch === "function") {
          maybePromise.catch((error) => {
            console.debug("Patreon status broadcast skipped:", error?.message ?? error);
          });
        }
      });
  });
}

function handlePatreonAuthComplete(user, sessionToken, done) {
  if (!user) {
    done?.();
    return;
  }

  chrome.storage.sync.set(
    {
      patreonAuthenticated: true,
      patreonUser: user,
      patreonSessionToken: sessionToken,
    },
    () => {
      broadcastPatreonStatus(true, user, sessionToken);
      done?.();
    },
  );
}

function getIdentityApi() {
  if (isFirefox() && browser.identity) return browser.identity;
  if (isChrome() && chrome.identity) return chrome.identity;
  return null;
}

function launchWebAuthFlow(url) {
  try {
    if (isFirefox() && browser.identity && typeof browser.identity.launchWebAuthFlow === "function") {
      return browser.identity.launchWebAuthFlow({ url, interactive: true });
    }
  } catch (_) {}
  return new Promise((resolve, reject) => {
    if (!isChrome() || !chrome.identity || typeof chrome.identity.launchWebAuthFlow !== "function") {
      reject(new Error("identity API not available"));
      return;
    }
    chrome.identity.launchWebAuthFlow({ url, interactive: true }, (responseUrl) => {
      const err = chrome.runtime && chrome.runtime.lastError;
      if (err) reject(err);
      else resolve(responseUrl);
    });
  });
}

function extractOAuthParams(responseUrl) {
  try {
    const u = new URL(responseUrl);
    let code = u.searchParams.get("code");
    let state = u.searchParams.get("state");
    if (!code && u.hash) {
      const hashParams = new URLSearchParams(u.hash.startsWith("#") ? u.hash.substring(1) : u.hash);
      code = hashParams.get("code");
      state = state || hashParams.get("state");
    }
    return { code, state };
  } catch (_) {
    return { code: null, state: null };
  }
}

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "get_auth_token") {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      console.log(token);
      chrome.identity.getProfileUserInfo(function (userInfo) {
        console.log(JSON.stringify(userInfo));
      });
    });
  } else if (request.message === "log_off") {
    // chrome.identity.clearAllCachedAuthTokens(() => console.log("logged off"));
  } else if (request.message === "patreon_auth_complete") {
    handlePatreonAuthComplete(request.user, request.sessionToken);
  } else if (request.message === "patreon_logout") {
    // Clear Patreon authentication
    chrome.storage.sync.remove(["patreonAuthenticated", "patreonUser", "patreonSessionToken"], () => {
      broadcastPatreonStatus(false, null, null);
    });
  } else if (request.message === "ryd_open_tab") {
    const targetUrl = typeof request?.url === "string" ? request.url : null;
    if (!targetUrl) {
      sendResponse?.({ success: false, error: "invalid_url" });
      return;
    }

    try {
      if (api?.tabs?.create) {
        api.tabs.create({ url: targetUrl }, () => {
          if (api.runtime?.lastError) {
            console.debug("Tab open failed:", api.runtime.lastError.message);
          }
        });
        sendResponse?.({ success: true });
        return;
      }
    } catch (error) {
      console.debug("Tab open threw:", error?.message ?? error);
    }

    sendResponse?.({ success: false, error: "tabs_api_unavailable" });
    return;
  } else if (request.message == "set_state") {
    // chrome.identity.getAuthToken({ interactive: true }, function (token) {
    let token = "";
    fetch(getApiEndpoint(`/votes?videoId=${request.videoId}&likeCount=${request.likeCount || ""}`), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        sendResponse(response);
      })
      .catch();
    return true;
  } else if (request.message == "send_links") {
    toSend = toSend.concat(request.videoIds.filter((x) => !sentIds.has(x)));
    if (toSend.length >= 20) {
      fetch(getApiEndpoint("/votes"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toSend),
      });
      for (const toSendUrl of toSend) {
        sentIds.add(toSendUrl);
      }
      toSend = [];
    }
  } else if (request.message == "register") {
    register();
    return true;
  } else if (request.message == "send_vote") {
    sendVote(request.videoId, request.vote);
    return true;
  } else if (request.message === "patreon_oauth_login") {
    (async () => {
      try {
        const idApi = getIdentityApi();
        if (
          !idApi ||
          typeof (idApi.getRedirectURL || (isChrome() && chrome.identity && chrome.identity.getRedirectURL)) !==
            "function"
        ) {
          sendResponse({ success: false, error: "identity API not available" });
          return;
        }
        const redirectUri =
          isFirefox() && browser.identity.getRedirectURL
            ? browser.identity.getRedirectURL()
            : isChrome() && chrome.identity.getRedirectURL
              ? chrome.identity.getRedirectURL()
              : "";

        const startRes = await fetch(
          getApiEndpoint(`/api/auth/oauth/login?redirectUri=${encodeURIComponent(redirectUri)}`),
        );
        const startData = await startRes.json();

        const responseUrl = await launchWebAuthFlow(startData.authUrl);
        const { code, state } = extractOAuthParams(responseUrl);
        if (!code) {
          sendResponse({ success: false, error: "No authorization code received" });
          return;
        }

        const exchangeRes = await fetch(getApiEndpoint("/api/auth/oauth/exchange"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            state,
            expectedState: startData.state,
            redirectUri: startData.redirectUri || redirectUri,
          }),
        });
        const authData = await exchangeRes.json();
        if (authData && authData.success) {
          handlePatreonAuthComplete(authData.user, authData.sessionToken, () => {
            sendResponse({ success: true, user: authData.user });
          });
        } else {
          sendResponse({ success: false, error: (authData && authData.error) || "OAuth exchange failed" });
        }
      } catch (e) {
        console.error("patreon_oauth_login error", e);
        sendResponse({ success: false, error: String((e && e.message) || e) });
      }
    })();
    return true;
  }
});

function openChangelogTab(version) {
  try {
    const url = getChangelogUrl();
    api.tabs.create({ url }, () => {
      if (api.runtime.lastError) {
        console.debug("Changelog tab could not open:", api.runtime.lastError.message);
      }
      persistChangelogVersion(version);
    });
  } catch (error) {
    console.debug("Failed to open changelog tab", error);
  }
}

function scheduleChangelogVersion(version) {
  const storage = api?.storage?.local;
  if (!storage || typeof storage.set !== "function") {
    return false;
  }
  try {
    const valueToStore = version || true;
    storage.set({ [PENDING_CHANGELOG_STORAGE_KEY]: valueToStore }, () => {
      if (api.runtime.lastError) {
        console.debug("Failed to persist pending changelog version:", api.runtime.lastError.message);
      }
    });
    return true;
  } catch (error) {
    console.debug("Storage set failed for pending changelog version", error);
    return false;
  }
}

function clearPendingChangelogVersion() {
  const storage = api?.storage?.local;
  if (!storage || typeof storage.remove !== "function") {
    return;
  }
  try {
    storage.remove(PENDING_CHANGELOG_STORAGE_KEY, () => {
      if (api.runtime.lastError) {
        console.debug("Failed to clear pending changelog version:", api.runtime.lastError.message);
      }
    });
  } catch (error) {
    console.debug("Storage remove failed for pending changelog version", error);
  }
}

function showPendingChangelogIfNeeded() {
  const storage = api?.storage?.local;
  if (!storage || typeof storage.get !== "function") {
    return;
  }

  try {
    storage.get([PENDING_CHANGELOG_STORAGE_KEY, CHANGELOG_STORAGE_KEY], (result) => {
      if (api.runtime.lastError) {
        console.debug("Changelog storage read failed:", api.runtime.lastError.message);
        return;
      }

      const pendingValue = result?.[PENDING_CHANGELOG_STORAGE_KEY];
      if (pendingValue === undefined || pendingValue === null || pendingValue === "") {
        return;
      }

      const lastShownValue = result?.[CHANGELOG_STORAGE_KEY];
      if (lastShownValue !== undefined && lastShownValue !== null && lastShownValue !== "") {
        clearPendingChangelogVersion();
        return;
      }

      openChangelogTab(typeof pendingValue === "string" ? pendingValue : null);
    });
  } catch (error) {
    console.debug("Storage get failed for pending changelog version", error);
  }
}

function persistChangelogVersion(version) {
  const storage = api?.storage?.local;
  if (!storage || typeof storage.set !== "function") {
    clearPendingChangelogVersion();
    return;
  }
  try {
    const valueToStore = version || true;
    storage.set({ [CHANGELOG_STORAGE_KEY]: valueToStore }, () => {
      if (api.runtime.lastError) {
        console.debug("Failed to persist changelog version:", api.runtime.lastError.message);
        return;
      }
      clearPendingChangelogVersion();
    });
  } catch (error) {
    console.debug("Storage set failed for changelog version", error);
  }
}

function maybeShowChangelog(details) {
  const reason = details?.reason;
  if (!reason) {
    return;
  }

  if (reason === "browser_update" || reason === "chrome_update") {
    return;
  }

  if (reason !== "install" && reason !== "update") {
    return;
  }

  const manifest = api.runtime.getManifest();
  const currentVersion = manifest?.version;
  const storage = api?.storage?.local;
  const isInstall = reason === "install";

  const showChangelog = () => {
    openChangelogTab(currentVersion || null);
  };

  if (!storage || typeof storage.get !== "function") {
    showChangelog();
    return;
  }

  try {
    storage.get([CHANGELOG_STORAGE_KEY, PENDING_CHANGELOG_STORAGE_KEY], (result) => {
      if (api.runtime.lastError) {
        console.debug("Changelog storage read failed:", api.runtime.lastError.message);
        showChangelog();
        return;
      }

      const hasStoredValue = (value) => value !== undefined && value !== null && value !== "";
      const lastShownValue = result?.[CHANGELOG_STORAGE_KEY];
      const pendingValue = result?.[PENDING_CHANGELOG_STORAGE_KEY];

      if (isInstall) {
        if (hasStoredValue(pendingValue)) {
          clearPendingChangelogVersion();
        }
        if (!hasStoredValue(lastShownValue)) {
          showChangelog();
        }
        return;
      }

      if (hasStoredValue(lastShownValue)) {
        return;
      }

      if (hasStoredValue(pendingValue)) {
        if (currentVersion && pendingValue !== currentVersion) {
          scheduleChangelogVersion(currentVersion);
        }
        return;
      }

      if (!scheduleChangelogVersion(currentVersion || null)) {
        showChangelog();
      }
    });
  } catch (error) {
    console.debug("Storage get failed for changelog version", error);
    showChangelog();
  }
}

api.runtime.onInstalled.addListener((details) => {
  maybeShowChangelog(details);
});

if (api?.runtime?.onStartup && typeof api.runtime.onStartup.addListener === "function") {
  api.runtime.onStartup.addListener(() => {
    showPendingChangelogIfNeeded();
  });
}

// api.storage.sync.get(['lastShowChangelogVersion'], (details) => {
//   if (extConfig.showUpdatePopup === true &&
//     details.lastShowChangelogVersion !== chrome.runtime.getManifest().version
//     ) {
//     // keep it inside get to avoid race condition
//     api.storage.sync.set({'lastShowChangelogVersion ': chrome.runtime.getManifest().version});
//     // wait until async get runs & don't steal tab focus
//     api.tabs.create({url: api.runtime.getURL("/changelog/4/changelog_4.0.html"), active: false});
//   }
// });

async function sendVote(videoId, vote, depth = 1) {
  api.storage.sync.get(null, async (storageResult) => {
    if (!storageResult.userId || !storageResult.registrationConfirmed) {
      await register();
    }
    let voteResponse = await fetch(getApiEndpoint("/interact/vote"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: storageResult.userId,
        videoId,
        value: vote,
      }),
    });

    if (voteResponse.status == 401 && depth > 0) {
      await register();
      await sendVote(videoId, vote, depth - 1);
      return;
    } else if (voteResponse.status == 401) {
      // We have already tried registering
      return;
    }

    const voteResponseJson = await voteResponse.json();
    const solvedPuzzle = await solvePuzzle(voteResponseJson);
    if (!solvedPuzzle.solution) {
      await sendVote(videoId, vote);
      return;
    }

    await fetch(getApiEndpoint("/interact/confirmVote"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...solvedPuzzle,
        userId: storageResult.userId,
        videoId,
      }),
    });
  });
}

async function register() {
  const userId = generateUserID();
  api.storage.sync.set({ userId });
  const registrationResponse = await fetch(getApiEndpoint(`/puzzle/registration?userId=${userId}`), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  }).then((response) => response.json());
  const solvedPuzzle = await solvePuzzle(registrationResponse);
  if (!solvedPuzzle.solution) {
    await register();
    return;
  }
  const result = await fetch(getApiEndpoint(`/puzzle/registration?userId=${userId}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(solvedPuzzle),
  }).then((response) => response.json());
  if (result === true) {
    return api.storage.sync.set({ registrationConfirmed: true });
  }
}

api.storage.sync.get(null, async (res) => {
  if (!res || !res.userId || !res.registrationConfirmed) {
    await register();
  }
});

const sentIds = new Set();
let toSend = [];

function countLeadingZeroes(uInt8View, limit) {
  let zeroes = 0;
  let value = 0;
  for (let i = 0; i < uInt8View.length; i++) {
    value = uInt8View[i];
    if (value === 0) {
      zeroes += 8;
    } else {
      let count = 1;
      if (value >>> 4 === 0) {
        count += 4;
        value <<= 4;
      }
      if (value >>> 6 === 0) {
        count += 2;
        value <<= 2;
      }
      zeroes += count - (value >>> 7);
      break;
    }
    if (zeroes >= limit) {
      break;
    }
  }
  return zeroes;
}

async function solvePuzzle(puzzle) {
  let challenge = Uint8Array.from(atob(puzzle.challenge), (c) => c.charCodeAt(0));
  let buffer = new ArrayBuffer(20);
  let uInt8View = new Uint8Array(buffer);
  let uInt32View = new Uint32Array(buffer);
  let maxCount = Math.pow(2, puzzle.difficulty) * 3;
  for (let i = 4; i < 20; i++) {
    uInt8View[i] = challenge[i - 4];
  }

  for (let i = 0; i < maxCount; i++) {
    uInt32View[0] = i;
    let hash = await crypto.subtle.digest("SHA-512", buffer);
    let hashUint8 = new Uint8Array(hash);
    if (countLeadingZeroes(hashUint8) >= puzzle.difficulty) {
      return {
        solution: btoa(String.fromCharCode.apply(null, uInt8View.slice(0, 4))),
      };
    }
  }
  return {};
}

function generateUserID(length = 36) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  if (crypto && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  } else {
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
    return result;
  }
}

function storageChangeHandler(changes, area) {
  if (changes.disableVoteSubmission !== undefined) {
    handleDisableVoteSubmissionChangeEvent(changes.disableVoteSubmission.newValue);
  }
  if (changes.coloredThumbs !== undefined) {
    handleColoredThumbsChangeEvent(changes.coloredThumbs.newValue);
  }
  if (changes.coloredBar !== undefined) {
    handleColoredBarChangeEvent(changes.coloredBar.newValue);
  }
  if (changes.colorTheme !== undefined) {
    handleColorThemeChangeEvent(changes.colorTheme.newValue);
  }
  if (changes.numberDisplayFormat !== undefined) {
    handleNumberDisplayFormatChangeEvent(changes.numberDisplayFormat.newValue);
  }
  if (changes.numberDisplayReformatLikes !== undefined) {
    handleNumberDisplayReformatLikesChangeEvent(changes.numberDisplayReformatLikes.newValue);
  }
  if (changes.disableLogging !== undefined) {
    handleDisableLoggingChangeEvent(changes.disableLogging.newValue);
  }
  if (changes.showTooltipPercentage !== undefined) {
    handleShowTooltipPercentageChangeEvent(changes.showTooltipPercentage.newValue);
  }
  if (changes.numberDisplayReformatLikes !== undefined) {
    handleNumberDisplayReformatLikesChangeEvent(changes.numberDisplayReformatLikes.newValue);
  }
  if (changes.hidePremiumTeaser !== undefined) {
    handleHidePremiumTeaserChangeEvent(changes.hidePremiumTeaser.newValue);
  }
}

function handleDisableVoteSubmissionChangeEvent(value) {
  extConfig.disableVoteSubmission = value;
  if (value === true) {
    changeIcon(voteDisabledIconName);
  } else {
    changeIcon(defaultIconName);
  }
}

function handleDisableLoggingChangeEvent(value) {
  extConfig.disableLogging = value;
}

function handleNumberDisplayFormatChangeEvent(value) {
  extConfig.numberDisplayFormat = value;
}

function handleShowTooltipPercentageChangeEvent(value) {
  extConfig.showTooltipPercentage = value;
}

function handleTooltipPercentageModeChangeEvent(value) {
  if (!value) {
    value = "dash_like";
  }
  extConfig.tooltipPercentageMode = value;
}

function changeIcon(iconName) {
  if (api.action !== undefined) api.action.setIcon({ path: "/icons/" + iconName });
  else if (api.browserAction !== undefined) api.browserAction.setIcon({ path: "/icons/" + iconName });
  else console.log("changing icon is not supported");
}

function handleColoredThumbsChangeEvent(value) {
  extConfig.coloredThumbs = value;
}

function handleColoredBarChangeEvent(value) {
  extConfig.coloredBar = value;
}

function handleColorThemeChangeEvent(value) {
  if (!value) {
    value = "classic";
  }
  extConfig.colorTheme = value;
}

function handleNumberDisplayReformatLikesChangeEvent(value) {
  extConfig.numberDisplayReformatLikes = value;
}

function handleHidePremiumTeaserChangeEvent(value) {
  extConfig.hidePremiumTeaser = value === true;
}

api.storage.onChanged.addListener(storageChangeHandler);

function initExtConfig() {
  initializeDisableVoteSubmission();
  initializeDisableLogging();
  initializeColoredThumbs();
  initializeColoredBar();
  initializeColorTheme();
  initializeNumberDisplayFormat();
  initializeNumberDisplayReformatLikes();
  initializeTooltipPercentage();
  initializeTooltipPercentageMode();
  initializeHidePremiumTeaser();
}

function initializeDisableVoteSubmission() {
  api.storage.sync.get(["disableVoteSubmission"], (res) => {
    if (res.disableVoteSubmission === undefined) {
      api.storage.sync.set({ disableVoteSubmission: false });
    } else {
      extConfig.disableVoteSubmission = res.disableVoteSubmission;
      if (res.disableVoteSubmission) changeIcon(voteDisabledIconName);
    }
  });
}

function initializeDisableLogging() {
  api.storage.sync.get(["disableLogging"], (res) => {
    if (res.disableLogging === undefined) {
      api.storage.sync.set({ disableLogging: true });
    } else {
      extConfig.disableLogging = res.disableLogging;
    }
  });
}

function initializeColoredThumbs() {
  api.storage.sync.get(["coloredThumbs"], (res) => {
    if (res.coloredThumbs === undefined) {
      api.storage.sync.set({ coloredThumbs: false });
    } else {
      extConfig.coloredThumbs = res.coloredThumbs;
    }
  });
}

function initializeColoredBar() {
  api.storage.sync.get(["coloredBar"], (res) => {
    if (res.coloredBar === undefined) {
      api.storage.sync.set({ coloredBar: false });
    } else {
      extConfig.coloredBar = res.coloredBar;
    }
  });
}

function initializeColorTheme() {
  api.storage.sync.get(["colorTheme"], (res) => {
    if (res.colorTheme === undefined) {
      api.storage.sync.set({ colorTheme: false });
    } else {
      extConfig.colorTheme = res.colorTheme;
    }
  });
}

function initializeNumberDisplayFormat() {
  api.storage.sync.get(["numberDisplayFormat"], (res) => {
    if (res.numberDisplayFormat === undefined) {
      api.storage.sync.set({ numberDisplayFormat: "compactShort" });
    } else {
      extConfig.numberDisplayFormat = res.numberDisplayFormat;
    }
  });
}

function initializeTooltipPercentage() {
  api.storage.sync.get(["showTooltipPercentage"], (res) => {
    if (res.showTooltipPercentage === undefined) {
      api.storage.sync.set({ showTooltipPercentage: false });
    } else {
      extConfig.showTooltipPercentage = res.showTooltipPercentage;
    }
  });
}

function initializeTooltipPercentageMode() {
  api.storage.sync.get(["tooltipPercentageMode"], (res) => {
    if (res.tooltipPercentageMode === undefined) {
      api.storage.sync.set({ tooltipPercentageMode: "dash_like" });
    } else {
      extConfig.tooltipPercentageMode = res.tooltipPercentageMode;
    }
  });
}

function initializeNumberDisplayReformatLikes() {
  api.storage.sync.get(["numberDisplayReformatLikes"], (res) => {
    if (res.numberDisplayReformatLikes === undefined) {
      api.storage.sync.set({ numberDisplayReformatLikes: false });
    } else {
      extConfig.numberDisplayReformatLikes = res.numberDisplayReformatLikes;
    }
  });
}

function initializeHidePremiumTeaser() {
  api.storage.sync.get(["hidePremiumTeaser"], (res) => {
    if (res.hidePremiumTeaser === undefined) {
      api.storage.sync.set({ hidePremiumTeaser: false });
      extConfig.hidePremiumTeaser = false;
    } else {
      extConfig.hidePremiumTeaser = res.hidePremiumTeaser === true;
    }
  });
}

function isChrome() {
  return typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined";
}

function isFirefox() {
  return typeof browser !== "undefined" && typeof browser.runtime !== "undefined";
}

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QixtQ0FBbUM7QUFDaEUsTUFBTTtBQUNOO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QiwwQkFBMEI7QUFDdkQ7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9yZXR1cm4teW91dHViZS1kaXNsaWtlLy4vRXh0ZW5zaW9ucy9jb21iaW5lZC9zcmMvY29uZmlnLmpzIiwid2VicGFjazovL3JldHVybi15b3V0dWJlLWRpc2xpa2UvLi9FeHRlbnNpb25zL2NvbWJpbmVkL3J5ZC5iYWNrZ3JvdW5kLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IERFVl9BUElfVVJMID0gXCJodHRwczovL2xvY2FsaG9zdDo3MjU4XCI7XHJcbmNvbnN0IFBST0RfQVBJX1VSTCA9IFwiaHR0cHM6Ly9yZXR1cm55b3V0dWJlZGlzbGlrZWFwaS5jb21cIjtcclxuXHJcbmNvbnN0IHJ1bnRpbWUgPSB0eXBlb2YgY2hyb21lICE9PSBcInVuZGVmaW5lZFwiID8gY2hyb21lLnJ1bnRpbWUgOiBudWxsO1xyXG5jb25zdCBtYW5pZmVzdCA9IHR5cGVvZiBydW50aW1lPy5nZXRNYW5pZmVzdCA9PT0gXCJmdW5jdGlvblwiID8gcnVudGltZS5nZXRNYW5pZmVzdCgpIDogbnVsbDtcclxuY29uc3QgaXNEZXZlbG9wbWVudCA9IGZhbHNlO1xyXG5cclxuY29uc3QgZXh0ZW5zaW9uQ2hhbmdlbG9nVXJsID1cclxuICBydW50aW1lICYmIHR5cGVvZiBydW50aW1lLmdldFVSTCA9PT0gXCJmdW5jdGlvblwiXHJcbiAgICA/IHJ1bnRpbWUuZ2V0VVJMKFwiY2hhbmdlbG9nLzQvY2hhbmdlbG9nXzQuMC5odG1sXCIpXHJcbiAgICA6IFwiaHR0cHM6Ly9yZXR1cm55b3V0dWJlZGlzbGlrZS5jb20vY2hhbmdlbG9nLzQvY2hhbmdlbG9nXzQuMC5odG1sXCI7XHJcblxyXG5jb25zdCBjb25maWcgPSB7XHJcbiAgYXBpVXJsOiBpc0RldmVsb3BtZW50ID8gREVWX0FQSV9VUkwgOiBQUk9EX0FQSV9VUkwsXHJcblxyXG4gIHZvdGVEaXNhYmxlZEljb25OYW1lOiBcImljb25faG9sZDEyOC5wbmdcIixcclxuICBkZWZhdWx0SWNvbk5hbWU6IFwiaWNvbjEyOC5wbmdcIixcclxuXHJcbiAgbGlua3M6IHtcclxuICAgIHdlYnNpdGU6IFwiaHR0cHM6Ly9yZXR1cm55b3V0dWJlZGlzbGlrZS5jb21cIixcclxuICAgIGdpdGh1YjogXCJodHRwczovL2dpdGh1Yi5jb20vQW5hcmlvcy9yZXR1cm4teW91dHViZS1kaXNsaWtlXCIsXHJcbiAgICBkaXNjb3JkOiBcImh0dHBzOi8vZGlzY29yZC5nZy9tWW5FU1k0TWQ1XCIsXHJcbiAgICBkb25hdGU6IFwiaHR0cHM6Ly9yZXR1cm55b3V0dWJlZGlzbGlrZS5jb20vZG9uYXRlXCIsXHJcbiAgICBmYXE6IFwiaHR0cHM6Ly9yZXR1cm55b3V0dWJlZGlzbGlrZS5jb20vZmFxXCIsXHJcbiAgICBoZWxwOiBcImh0dHBzOi8vcmV0dXJueW91dHViZWRpc2xpa2UuY29tL2hlbHBcIixcclxuICAgIGNoYW5nZWxvZzogZXh0ZW5zaW9uQ2hhbmdlbG9nVXJsLFxyXG4gIH0sXHJcblxyXG4gIGRlZmF1bHRFeHRDb25maWc6IHtcclxuICAgIGRpc2FibGVWb3RlU3VibWlzc2lvbjogZmFsc2UsXHJcbiAgICBkaXNhYmxlTG9nZ2luZzogdHJ1ZSxcclxuICAgIGNvbG9yZWRUaHVtYnM6IGZhbHNlLFxyXG4gICAgY29sb3JlZEJhcjogZmFsc2UsXHJcbiAgICBjb2xvclRoZW1lOiBcImNsYXNzaWNcIixcclxuICAgIG51bWJlckRpc3BsYXlGb3JtYXQ6IFwiY29tcGFjdFNob3J0XCIsXHJcbiAgICBudW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlczogZmFsc2UsXHJcbiAgICBoaWRlUHJlbWl1bVRlYXNlcjogZmFsc2UsXHJcbiAgfSxcclxufTtcclxuXHJcbmZ1bmN0aW9uIGdldEFwaVVybCgpIHtcclxuICByZXR1cm4gY29uZmlnLmFwaVVybDtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QXBpRW5kcG9pbnQoZW5kcG9pbnQpIHtcclxuICByZXR1cm4gYCR7Y29uZmlnLmFwaVVybH0ke2VuZHBvaW50LnN0YXJ0c1dpdGgoXCIvXCIpID8gXCJcIiA6IFwiL1wifSR7ZW5kcG9pbnR9YDtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Q2hhbmdlbG9nVXJsKCkge1xyXG4gIHJldHVybiBjb25maWcubGlua3M/LmNoYW5nZWxvZyA/PyBleHRlbnNpb25DaGFuZ2Vsb2dVcmw7XHJcbn1cclxuXHJcbmV4cG9ydCB7IGNvbmZpZywgZ2V0QXBpVXJsLCBnZXRBcGlFbmRwb2ludCwgZ2V0Q2hhbmdlbG9nVXJsIH07XHJcbiIsImltcG9ydCB7IGNvbmZpZywgZ2V0QXBpVXJsLCBnZXRBcGlFbmRwb2ludCwgZ2V0Q2hhbmdlbG9nVXJsIH0gZnJvbSBcIi4vc3JjL2NvbmZpZ1wiO1xyXG5cclxuY29uc3QgYXBpVXJsID0gZ2V0QXBpVXJsKCk7XHJcbmNvbnN0IHZvdGVEaXNhYmxlZEljb25OYW1lID0gY29uZmlnLnZvdGVEaXNhYmxlZEljb25OYW1lO1xyXG5jb25zdCBkZWZhdWx0SWNvbk5hbWUgPSBjb25maWcuZGVmYXVsdEljb25OYW1lO1xyXG5sZXQgYXBpO1xyXG5jb25zdCBDSEFOR0VMT0dfU1RPUkFHRV9LRVkgPSBcImxhc3RTaG93bkNoYW5nZWxvZ1ZlcnNpb25cIjtcclxuY29uc3QgUEVORElOR19DSEFOR0VMT0dfU1RPUkFHRV9LRVkgPSBcInBlbmRpbmdDaGFuZ2Vsb2dWZXJzaW9uXCI7XHJcblxyXG4vKiogc3RvcmVzIGV4dGVuc2lvbidzIGdsb2JhbCBjb25maWcgKi9cclxubGV0IGV4dENvbmZpZyA9IHsgLi4uY29uZmlnLmRlZmF1bHRFeHRDb25maWcgfTtcclxuXHJcbmlmIChpc0Nocm9tZSgpKSBhcGkgPSBjaHJvbWU7XHJcbmVsc2UgaWYgKGlzRmlyZWZveCgpKSBhcGkgPSBicm93c2VyO1xyXG5cclxuaW5pdEV4dENvbmZpZygpO1xyXG5cclxuZnVuY3Rpb24gYnJvYWRjYXN0UGF0cmVvblN0YXR1cyhhdXRoZW50aWNhdGVkLCB1c2VyLCBzZXNzaW9uVG9rZW4pIHtcclxuICBjaHJvbWUudGFicy5xdWVyeSh7fSwgKHRhYnMpID0+IHtcclxuICAgIHRhYnNcclxuICAgICAgLmZpbHRlcigodGFiKSA9PiB0YWIudXJsICYmIHRhYi51cmwuaW5jbHVkZXMoXCJ5b3V0dWJlLmNvbVwiKSlcclxuICAgICAgLmZvckVhY2goKHRhYikgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1heWJlUHJvbWlzZSA9IGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKFxyXG4gICAgICAgICAgdGFiLmlkLFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBcInBhdHJlb25fc3RhdHVzX2NoYW5nZWRcIixcclxuICAgICAgICAgICAgYXV0aGVudGljYXRlZCxcclxuICAgICAgICAgICAgdXNlcjogYXV0aGVudGljYXRlZCA/IHVzZXIgOiBudWxsLFxyXG4gICAgICAgICAgICBzZXNzaW9uVG9rZW46IGF1dGhlbnRpY2F0ZWQgPyBzZXNzaW9uVG9rZW4gOiBudWxsLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJQYXRyZW9uIHN0YXR1cyBicm9hZGNhc3Qgc2tpcHBlZDpcIiwgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChtYXliZVByb21pc2UgJiYgdHlwZW9mIG1heWJlUHJvbWlzZS5jYXRjaCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICBtYXliZVByb21pc2UuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJQYXRyZW9uIHN0YXR1cyBicm9hZGNhc3Qgc2tpcHBlZDpcIiwgZXJyb3I/Lm1lc3NhZ2UgPz8gZXJyb3IpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlUGF0cmVvbkF1dGhDb21wbGV0ZSh1c2VyLCBzZXNzaW9uVG9rZW4sIGRvbmUpIHtcclxuICBpZiAoIXVzZXIpIHtcclxuICAgIGRvbmU/LigpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoXHJcbiAgICB7XHJcbiAgICAgIHBhdHJlb25BdXRoZW50aWNhdGVkOiB0cnVlLFxyXG4gICAgICBwYXRyZW9uVXNlcjogdXNlcixcclxuICAgICAgcGF0cmVvblNlc3Npb25Ub2tlbjogc2Vzc2lvblRva2VuLFxyXG4gICAgfSxcclxuICAgICgpID0+IHtcclxuICAgICAgYnJvYWRjYXN0UGF0cmVvblN0YXR1cyh0cnVlLCB1c2VyLCBzZXNzaW9uVG9rZW4pO1xyXG4gICAgICBkb25lPy4oKTtcclxuICAgIH0sXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SWRlbnRpdHlBcGkoKSB7XHJcbiAgaWYgKGlzRmlyZWZveCgpICYmIGJyb3dzZXIuaWRlbnRpdHkpIHJldHVybiBicm93c2VyLmlkZW50aXR5O1xyXG4gIGlmIChpc0Nocm9tZSgpICYmIGNocm9tZS5pZGVudGl0eSkgcmV0dXJuIGNocm9tZS5pZGVudGl0eTtcclxuICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gbGF1bmNoV2ViQXV0aEZsb3codXJsKSB7XHJcbiAgdHJ5IHtcclxuICAgIGlmIChpc0ZpcmVmb3goKSAmJiBicm93c2VyLmlkZW50aXR5ICYmIHR5cGVvZiBicm93c2VyLmlkZW50aXR5LmxhdW5jaFdlYkF1dGhGbG93ID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgcmV0dXJuIGJyb3dzZXIuaWRlbnRpdHkubGF1bmNoV2ViQXV0aEZsb3coeyB1cmwsIGludGVyYWN0aXZlOiB0cnVlIH0pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKF8pIHt9XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGlmICghaXNDaHJvbWUoKSB8fCAhY2hyb21lLmlkZW50aXR5IHx8IHR5cGVvZiBjaHJvbWUuaWRlbnRpdHkubGF1bmNoV2ViQXV0aEZsb3cgIT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICByZWplY3QobmV3IEVycm9yKFwiaWRlbnRpdHkgQVBJIG5vdCBhdmFpbGFibGVcIikpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjaHJvbWUuaWRlbnRpdHkubGF1bmNoV2ViQXV0aEZsb3coeyB1cmwsIGludGVyYWN0aXZlOiB0cnVlIH0sIChyZXNwb25zZVVybCkgPT4ge1xyXG4gICAgICBjb25zdCBlcnIgPSBjaHJvbWUucnVudGltZSAmJiBjaHJvbWUucnVudGltZS5sYXN0RXJyb3I7XHJcbiAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpO1xyXG4gICAgICBlbHNlIHJlc29sdmUocmVzcG9uc2VVcmwpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4dHJhY3RPQXV0aFBhcmFtcyhyZXNwb25zZVVybCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1ID0gbmV3IFVSTChyZXNwb25zZVVybCk7XHJcbiAgICBsZXQgY29kZSA9IHUuc2VhcmNoUGFyYW1zLmdldChcImNvZGVcIik7XHJcbiAgICBsZXQgc3RhdGUgPSB1LnNlYXJjaFBhcmFtcy5nZXQoXCJzdGF0ZVwiKTtcclxuICAgIGlmICghY29kZSAmJiB1Lmhhc2gpIHtcclxuICAgICAgY29uc3QgaGFzaFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXModS5oYXNoLnN0YXJ0c1dpdGgoXCIjXCIpID8gdS5oYXNoLnN1YnN0cmluZygxKSA6IHUuaGFzaCk7XHJcbiAgICAgIGNvZGUgPSBoYXNoUGFyYW1zLmdldChcImNvZGVcIik7XHJcbiAgICAgIHN0YXRlID0gc3RhdGUgfHwgaGFzaFBhcmFtcy5nZXQoXCJzdGF0ZVwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7IGNvZGUsIHN0YXRlIH07XHJcbiAgfSBjYXRjaCAoXykge1xyXG4gICAgcmV0dXJuIHsgY29kZTogbnVsbCwgc3RhdGU6IG51bGwgfTtcclxuICB9XHJcbn1cclxuXHJcbmFwaS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICBpZiAocmVxdWVzdC5tZXNzYWdlID09PSBcImdldF9hdXRoX3Rva2VuXCIpIHtcclxuICAgIGNocm9tZS5pZGVudGl0eS5nZXRBdXRoVG9rZW4oeyBpbnRlcmFjdGl2ZTogdHJ1ZSB9LCBmdW5jdGlvbiAodG9rZW4pIHtcclxuICAgICAgY29uc29sZS5sb2codG9rZW4pO1xyXG4gICAgICBjaHJvbWUuaWRlbnRpdHkuZ2V0UHJvZmlsZVVzZXJJbmZvKGZ1bmN0aW9uICh1c2VySW5mbykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHVzZXJJbmZvKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwibG9nX29mZlwiKSB7XHJcbiAgICAvLyBjaHJvbWUuaWRlbnRpdHkuY2xlYXJBbGxDYWNoZWRBdXRoVG9rZW5zKCgpID0+IGNvbnNvbGUubG9nKFwibG9nZ2VkIG9mZlwiKSk7XHJcbiAgfSBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwicGF0cmVvbl9hdXRoX2NvbXBsZXRlXCIpIHtcclxuICAgIGhhbmRsZVBhdHJlb25BdXRoQ29tcGxldGUocmVxdWVzdC51c2VyLCByZXF1ZXN0LnNlc3Npb25Ub2tlbik7XHJcbiAgfSBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwicGF0cmVvbl9sb2dvdXRcIikge1xyXG4gICAgLy8gQ2xlYXIgUGF0cmVvbiBhdXRoZW50aWNhdGlvblxyXG4gICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5yZW1vdmUoW1wicGF0cmVvbkF1dGhlbnRpY2F0ZWRcIiwgXCJwYXRyZW9uVXNlclwiLCBcInBhdHJlb25TZXNzaW9uVG9rZW5cIl0sICgpID0+IHtcclxuICAgICAgYnJvYWRjYXN0UGF0cmVvblN0YXR1cyhmYWxzZSwgbnVsbCwgbnVsbCk7XHJcbiAgICB9KTtcclxuICB9IGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJyeWRfb3Blbl90YWJcIikge1xyXG4gICAgY29uc3QgdGFyZ2V0VXJsID0gdHlwZW9mIHJlcXVlc3Q/LnVybCA9PT0gXCJzdHJpbmdcIiA/IHJlcXVlc3QudXJsIDogbnVsbDtcclxuICAgIGlmICghdGFyZ2V0VXJsKSB7XHJcbiAgICAgIHNlbmRSZXNwb25zZT8uKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBcImludmFsaWRfdXJsXCIgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAoYXBpPy50YWJzPy5jcmVhdGUpIHtcclxuICAgICAgICBhcGkudGFicy5jcmVhdGUoeyB1cmw6IHRhcmdldFVybCB9LCAoKSA9PiB7XHJcbiAgICAgICAgICBpZiAoYXBpLnJ1bnRpbWU/Lmxhc3RFcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiVGFiIG9wZW4gZmFpbGVkOlwiLCBhcGkucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc2VuZFJlc3BvbnNlPy4oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5kZWJ1ZyhcIlRhYiBvcGVuIHRocmV3OlwiLCBlcnJvcj8ubWVzc2FnZSA/PyBlcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgc2VuZFJlc3BvbnNlPy4oeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFwidGFic19hcGlfdW5hdmFpbGFibGVcIiB9KTtcclxuICAgIHJldHVybjtcclxuICB9IGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PSBcInNldF9zdGF0ZVwiKSB7XHJcbiAgICAvLyBjaHJvbWUuaWRlbnRpdHkuZ2V0QXV0aFRva2VuKHsgaW50ZXJhY3RpdmU6IHRydWUgfSwgZnVuY3Rpb24gKHRva2VuKSB7XHJcbiAgICBsZXQgdG9rZW4gPSBcIlwiO1xyXG4gICAgZmV0Y2goZ2V0QXBpRW5kcG9pbnQoYC92b3Rlcz92aWRlb0lkPSR7cmVxdWVzdC52aWRlb0lkfSZsaWtlQ291bnQ9JHtyZXF1ZXN0Lmxpa2VDb3VudCB8fCBcIlwifWApLCB7XHJcbiAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9KVxyXG4gICAgICAudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgc2VuZFJlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PSBcInNlbmRfbGlua3NcIikge1xyXG4gICAgdG9TZW5kID0gdG9TZW5kLmNvbmNhdChyZXF1ZXN0LnZpZGVvSWRzLmZpbHRlcigoeCkgPT4gIXNlbnRJZHMuaGFzKHgpKSk7XHJcbiAgICBpZiAodG9TZW5kLmxlbmd0aCA+PSAyMCkge1xyXG4gICAgICBmZXRjaChnZXRBcGlFbmRwb2ludChcIi92b3Rlc1wiKSwge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh0b1NlbmQpLFxyXG4gICAgICB9KTtcclxuICAgICAgZm9yIChjb25zdCB0b1NlbmRVcmwgb2YgdG9TZW5kKSB7XHJcbiAgICAgICAgc2VudElkcy5hZGQodG9TZW5kVXJsKTtcclxuICAgICAgfVxyXG4gICAgICB0b1NlbmQgPSBbXTtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PSBcInJlZ2lzdGVyXCIpIHtcclxuICAgIHJlZ2lzdGVyKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PSBcInNlbmRfdm90ZVwiKSB7XHJcbiAgICBzZW5kVm90ZShyZXF1ZXN0LnZpZGVvSWQsIHJlcXVlc3Qudm90ZSk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJwYXRyZW9uX29hdXRoX2xvZ2luXCIpIHtcclxuICAgIChhc3luYyAoKSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgaWRBcGkgPSBnZXRJZGVudGl0eUFwaSgpO1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICFpZEFwaSB8fFxyXG4gICAgICAgICAgdHlwZW9mIChpZEFwaS5nZXRSZWRpcmVjdFVSTCB8fCAoaXNDaHJvbWUoKSAmJiBjaHJvbWUuaWRlbnRpdHkgJiYgY2hyb21lLmlkZW50aXR5LmdldFJlZGlyZWN0VVJMKSkgIT09XHJcbiAgICAgICAgICAgIFwiZnVuY3Rpb25cIlxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBcImlkZW50aXR5IEFQSSBub3QgYXZhaWxhYmxlXCIgfSk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHJlZGlyZWN0VXJpID1cclxuICAgICAgICAgIGlzRmlyZWZveCgpICYmIGJyb3dzZXIuaWRlbnRpdHkuZ2V0UmVkaXJlY3RVUkxcclxuICAgICAgICAgICAgPyBicm93c2VyLmlkZW50aXR5LmdldFJlZGlyZWN0VVJMKClcclxuICAgICAgICAgICAgOiBpc0Nocm9tZSgpICYmIGNocm9tZS5pZGVudGl0eS5nZXRSZWRpcmVjdFVSTFxyXG4gICAgICAgICAgICAgID8gY2hyb21lLmlkZW50aXR5LmdldFJlZGlyZWN0VVJMKClcclxuICAgICAgICAgICAgICA6IFwiXCI7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXJ0UmVzID0gYXdhaXQgZmV0Y2goXHJcbiAgICAgICAgICBnZXRBcGlFbmRwb2ludChgL2FwaS9hdXRoL29hdXRoL2xvZ2luP3JlZGlyZWN0VXJpPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHJlZGlyZWN0VXJpKX1gKSxcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0RGF0YSA9IGF3YWl0IHN0YXJ0UmVzLmpzb24oKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2VVcmwgPSBhd2FpdCBsYXVuY2hXZWJBdXRoRmxvdyhzdGFydERhdGEuYXV0aFVybCk7XHJcbiAgICAgICAgY29uc3QgeyBjb2RlLCBzdGF0ZSB9ID0gZXh0cmFjdE9BdXRoUGFyYW1zKHJlc3BvbnNlVXJsKTtcclxuICAgICAgICBpZiAoIWNvZGUpIHtcclxuICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJObyBhdXRob3JpemF0aW9uIGNvZGUgcmVjZWl2ZWRcIiB9KTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGV4Y2hhbmdlUmVzID0gYXdhaXQgZmV0Y2goZ2V0QXBpRW5kcG9pbnQoXCIvYXBpL2F1dGgvb2F1dGgvZXhjaGFuZ2VcIiksIHtcclxuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgIGNvZGUsXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBleHBlY3RlZFN0YXRlOiBzdGFydERhdGEuc3RhdGUsXHJcbiAgICAgICAgICAgIHJlZGlyZWN0VXJpOiBzdGFydERhdGEucmVkaXJlY3RVcmkgfHwgcmVkaXJlY3RVcmksXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBhdXRoRGF0YSA9IGF3YWl0IGV4Y2hhbmdlUmVzLmpzb24oKTtcclxuICAgICAgICBpZiAoYXV0aERhdGEgJiYgYXV0aERhdGEuc3VjY2Vzcykge1xyXG4gICAgICAgICAgaGFuZGxlUGF0cmVvbkF1dGhDb21wbGV0ZShhdXRoRGF0YS51c2VyLCBhdXRoRGF0YS5zZXNzaW9uVG9rZW4sICgpID0+IHtcclxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgdXNlcjogYXV0aERhdGEudXNlciB9KTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IChhdXRoRGF0YSAmJiBhdXRoRGF0YS5lcnJvcikgfHwgXCJPQXV0aCBleGNoYW5nZSBmYWlsZWRcIiB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwicGF0cmVvbl9vYXV0aF9sb2dpbiBlcnJvclwiLCBlKTtcclxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFN0cmluZygoZSAmJiBlLm1lc3NhZ2UpIHx8IGUpIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIG9wZW5DaGFuZ2Vsb2dUYWIodmVyc2lvbikge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1cmwgPSBnZXRDaGFuZ2Vsb2dVcmwoKTtcclxuICAgIGFwaS50YWJzLmNyZWF0ZSh7IHVybCB9LCAoKSA9PiB7XHJcbiAgICAgIGlmIChhcGkucnVudGltZS5sYXN0RXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ2hhbmdlbG9nIHRhYiBjb3VsZCBub3Qgb3BlbjpcIiwgYXBpLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHBlcnNpc3RDaGFuZ2Vsb2dWZXJzaW9uKHZlcnNpb24pO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZGVidWcoXCJGYWlsZWQgdG8gb3BlbiBjaGFuZ2Vsb2cgdGFiXCIsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNjaGVkdWxlQ2hhbmdlbG9nVmVyc2lvbih2ZXJzaW9uKSB7XHJcbiAgY29uc3Qgc3RvcmFnZSA9IGFwaT8uc3RvcmFnZT8ubG9jYWw7XHJcbiAgaWYgKCFzdG9yYWdlIHx8IHR5cGVvZiBzdG9yYWdlLnNldCAhPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB2YWx1ZVRvU3RvcmUgPSB2ZXJzaW9uIHx8IHRydWU7XHJcbiAgICBzdG9yYWdlLnNldCh7IFtQRU5ESU5HX0NIQU5HRUxPR19TVE9SQUdFX0tFWV06IHZhbHVlVG9TdG9yZSB9LCAoKSA9PiB7XHJcbiAgICAgIGlmIChhcGkucnVudGltZS5sYXN0RXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKFwiRmFpbGVkIHRvIHBlcnNpc3QgcGVuZGluZyBjaGFuZ2Vsb2cgdmVyc2lvbjpcIiwgYXBpLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmRlYnVnKFwiU3RvcmFnZSBzZXQgZmFpbGVkIGZvciBwZW5kaW5nIGNoYW5nZWxvZyB2ZXJzaW9uXCIsIGVycm9yKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsZWFyUGVuZGluZ0NoYW5nZWxvZ1ZlcnNpb24oKSB7XHJcbiAgY29uc3Qgc3RvcmFnZSA9IGFwaT8uc3RvcmFnZT8ubG9jYWw7XHJcbiAgaWYgKCFzdG9yYWdlIHx8IHR5cGVvZiBzdG9yYWdlLnJlbW92ZSAhPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBzdG9yYWdlLnJlbW92ZShQRU5ESU5HX0NIQU5HRUxPR19TVE9SQUdFX0tFWSwgKCkgPT4ge1xyXG4gICAgICBpZiAoYXBpLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkZhaWxlZCB0byBjbGVhciBwZW5kaW5nIGNoYW5nZWxvZyB2ZXJzaW9uOlwiLCBhcGkucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmRlYnVnKFwiU3RvcmFnZSByZW1vdmUgZmFpbGVkIGZvciBwZW5kaW5nIGNoYW5nZWxvZyB2ZXJzaW9uXCIsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dQZW5kaW5nQ2hhbmdlbG9nSWZOZWVkZWQoKSB7XHJcbiAgY29uc3Qgc3RvcmFnZSA9IGFwaT8uc3RvcmFnZT8ubG9jYWw7XHJcbiAgaWYgKCFzdG9yYWdlIHx8IHR5cGVvZiBzdG9yYWdlLmdldCAhPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgc3RvcmFnZS5nZXQoW1BFTkRJTkdfQ0hBTkdFTE9HX1NUT1JBR0VfS0VZLCBDSEFOR0VMT0dfU1RPUkFHRV9LRVldLCAocmVzdWx0KSA9PiB7XHJcbiAgICAgIGlmIChhcGkucnVudGltZS5sYXN0RXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ2hhbmdlbG9nIHN0b3JhZ2UgcmVhZCBmYWlsZWQ6XCIsIGFwaS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHBlbmRpbmdWYWx1ZSA9IHJlc3VsdD8uW1BFTkRJTkdfQ0hBTkdFTE9HX1NUT1JBR0VfS0VZXTtcclxuICAgICAgaWYgKHBlbmRpbmdWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHBlbmRpbmdWYWx1ZSA9PT0gbnVsbCB8fCBwZW5kaW5nVmFsdWUgPT09IFwiXCIpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGxhc3RTaG93blZhbHVlID0gcmVzdWx0Py5bQ0hBTkdFTE9HX1NUT1JBR0VfS0VZXTtcclxuICAgICAgaWYgKGxhc3RTaG93blZhbHVlICE9PSB1bmRlZmluZWQgJiYgbGFzdFNob3duVmFsdWUgIT09IG51bGwgJiYgbGFzdFNob3duVmFsdWUgIT09IFwiXCIpIHtcclxuICAgICAgICBjbGVhclBlbmRpbmdDaGFuZ2Vsb2dWZXJzaW9uKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBvcGVuQ2hhbmdlbG9nVGFiKHR5cGVvZiBwZW5kaW5nVmFsdWUgPT09IFwic3RyaW5nXCIgPyBwZW5kaW5nVmFsdWUgOiBudWxsKTtcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmRlYnVnKFwiU3RvcmFnZSBnZXQgZmFpbGVkIGZvciBwZW5kaW5nIGNoYW5nZWxvZyB2ZXJzaW9uXCIsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBlcnNpc3RDaGFuZ2Vsb2dWZXJzaW9uKHZlcnNpb24pIHtcclxuICBjb25zdCBzdG9yYWdlID0gYXBpPy5zdG9yYWdlPy5sb2NhbDtcclxuICBpZiAoIXN0b3JhZ2UgfHwgdHlwZW9mIHN0b3JhZ2Uuc2V0ICE9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgIGNsZWFyUGVuZGluZ0NoYW5nZWxvZ1ZlcnNpb24oKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHZhbHVlVG9TdG9yZSA9IHZlcnNpb24gfHwgdHJ1ZTtcclxuICAgIHN0b3JhZ2Uuc2V0KHsgW0NIQU5HRUxPR19TVE9SQUdFX0tFWV06IHZhbHVlVG9TdG9yZSB9LCAoKSA9PiB7XHJcbiAgICAgIGlmIChhcGkucnVudGltZS5sYXN0RXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKFwiRmFpbGVkIHRvIHBlcnNpc3QgY2hhbmdlbG9nIHZlcnNpb246XCIsIGFwaS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY2xlYXJQZW5kaW5nQ2hhbmdlbG9nVmVyc2lvbigpO1xyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZGVidWcoXCJTdG9yYWdlIHNldCBmYWlsZWQgZm9yIGNoYW5nZWxvZyB2ZXJzaW9uXCIsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1heWJlU2hvd0NoYW5nZWxvZyhkZXRhaWxzKSB7XHJcbiAgY29uc3QgcmVhc29uID0gZGV0YWlscz8ucmVhc29uO1xyXG4gIGlmICghcmVhc29uKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAocmVhc29uID09PSBcImJyb3dzZXJfdXBkYXRlXCIgfHwgcmVhc29uID09PSBcImNocm9tZV91cGRhdGVcIikge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKHJlYXNvbiAhPT0gXCJpbnN0YWxsXCIgJiYgcmVhc29uICE9PSBcInVwZGF0ZVwiKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBtYW5pZmVzdCA9IGFwaS5ydW50aW1lLmdldE1hbmlmZXN0KCk7XHJcbiAgY29uc3QgY3VycmVudFZlcnNpb24gPSBtYW5pZmVzdD8udmVyc2lvbjtcclxuICBjb25zdCBzdG9yYWdlID0gYXBpPy5zdG9yYWdlPy5sb2NhbDtcclxuICBjb25zdCBpc0luc3RhbGwgPSByZWFzb24gPT09IFwiaW5zdGFsbFwiO1xyXG5cclxuICBjb25zdCBzaG93Q2hhbmdlbG9nID0gKCkgPT4ge1xyXG4gICAgb3BlbkNoYW5nZWxvZ1RhYihjdXJyZW50VmVyc2lvbiB8fCBudWxsKTtcclxuICB9O1xyXG5cclxuICBpZiAoIXN0b3JhZ2UgfHwgdHlwZW9mIHN0b3JhZ2UuZ2V0ICE9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgIHNob3dDaGFuZ2Vsb2coKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBzdG9yYWdlLmdldChbQ0hBTkdFTE9HX1NUT1JBR0VfS0VZLCBQRU5ESU5HX0NIQU5HRUxPR19TVE9SQUdFX0tFWV0sIChyZXN1bHQpID0+IHtcclxuICAgICAgaWYgKGFwaS5ydW50aW1lLmxhc3RFcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJDaGFuZ2Vsb2cgc3RvcmFnZSByZWFkIGZhaWxlZDpcIiwgYXBpLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgIHNob3dDaGFuZ2Vsb2coKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGhhc1N0b3JlZFZhbHVlID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSBcIlwiO1xyXG4gICAgICBjb25zdCBsYXN0U2hvd25WYWx1ZSA9IHJlc3VsdD8uW0NIQU5HRUxPR19TVE9SQUdFX0tFWV07XHJcbiAgICAgIGNvbnN0IHBlbmRpbmdWYWx1ZSA9IHJlc3VsdD8uW1BFTkRJTkdfQ0hBTkdFTE9HX1NUT1JBR0VfS0VZXTtcclxuXHJcbiAgICAgIGlmIChpc0luc3RhbGwpIHtcclxuICAgICAgICBpZiAoaGFzU3RvcmVkVmFsdWUocGVuZGluZ1ZhbHVlKSkge1xyXG4gICAgICAgICAgY2xlYXJQZW5kaW5nQ2hhbmdlbG9nVmVyc2lvbigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWhhc1N0b3JlZFZhbHVlKGxhc3RTaG93blZhbHVlKSkge1xyXG4gICAgICAgICAgc2hvd0NoYW5nZWxvZygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChoYXNTdG9yZWRWYWx1ZShsYXN0U2hvd25WYWx1ZSkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChoYXNTdG9yZWRWYWx1ZShwZW5kaW5nVmFsdWUpKSB7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRWZXJzaW9uICYmIHBlbmRpbmdWYWx1ZSAhPT0gY3VycmVudFZlcnNpb24pIHtcclxuICAgICAgICAgIHNjaGVkdWxlQ2hhbmdlbG9nVmVyc2lvbihjdXJyZW50VmVyc2lvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFzY2hlZHVsZUNoYW5nZWxvZ1ZlcnNpb24oY3VycmVudFZlcnNpb24gfHwgbnVsbCkpIHtcclxuICAgICAgICBzaG93Q2hhbmdlbG9nKCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmRlYnVnKFwiU3RvcmFnZSBnZXQgZmFpbGVkIGZvciBjaGFuZ2Vsb2cgdmVyc2lvblwiLCBlcnJvcik7XHJcbiAgICBzaG93Q2hhbmdlbG9nKCk7XHJcbiAgfVxyXG59XHJcblxyXG5hcGkucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoZGV0YWlscykgPT4ge1xyXG4gIG1heWJlU2hvd0NoYW5nZWxvZyhkZXRhaWxzKTtcclxufSk7XHJcblxyXG5pZiAoYXBpPy5ydW50aW1lPy5vblN0YXJ0dXAgJiYgdHlwZW9mIGFwaS5ydW50aW1lLm9uU3RhcnR1cC5hZGRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgYXBpLnJ1bnRpbWUub25TdGFydHVwLmFkZExpc3RlbmVyKCgpID0+IHtcclxuICAgIHNob3dQZW5kaW5nQ2hhbmdlbG9nSWZOZWVkZWQoKTtcclxuICB9KTtcclxufVxyXG5cclxuLy8gYXBpLnN0b3JhZ2Uuc3luYy5nZXQoWydsYXN0U2hvd0NoYW5nZWxvZ1ZlcnNpb24nXSwgKGRldGFpbHMpID0+IHtcclxuLy8gICBpZiAoZXh0Q29uZmlnLnNob3dVcGRhdGVQb3B1cCA9PT0gdHJ1ZSAmJlxyXG4vLyAgICAgZGV0YWlscy5sYXN0U2hvd0NoYW5nZWxvZ1ZlcnNpb24gIT09IGNocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KCkudmVyc2lvblxyXG4vLyAgICAgKSB7XHJcbi8vICAgICAvLyBrZWVwIGl0IGluc2lkZSBnZXQgdG8gYXZvaWQgcmFjZSBjb25kaXRpb25cclxuLy8gICAgIGFwaS5zdG9yYWdlLnN5bmMuc2V0KHsnbGFzdFNob3dDaGFuZ2Vsb2dWZXJzaW9uICc6IGNocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KCkudmVyc2lvbn0pO1xyXG4vLyAgICAgLy8gd2FpdCB1bnRpbCBhc3luYyBnZXQgcnVucyAmIGRvbid0IHN0ZWFsIHRhYiBmb2N1c1xyXG4vLyAgICAgYXBpLnRhYnMuY3JlYXRlKHt1cmw6IGFwaS5ydW50aW1lLmdldFVSTChcIi9jaGFuZ2Vsb2cvNC9jaGFuZ2Vsb2dfNC4wLmh0bWxcIiksIGFjdGl2ZTogZmFsc2V9KTtcclxuLy8gICB9XHJcbi8vIH0pO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2VuZFZvdGUodmlkZW9JZCwgdm90ZSwgZGVwdGggPSAxKSB7XHJcbiAgYXBpLnN0b3JhZ2Uuc3luYy5nZXQobnVsbCwgYXN5bmMgKHN0b3JhZ2VSZXN1bHQpID0+IHtcclxuICAgIGlmICghc3RvcmFnZVJlc3VsdC51c2VySWQgfHwgIXN0b3JhZ2VSZXN1bHQucmVnaXN0cmF0aW9uQ29uZmlybWVkKSB7XHJcbiAgICAgIGF3YWl0IHJlZ2lzdGVyKCk7XHJcbiAgICB9XHJcbiAgICBsZXQgdm90ZVJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZ2V0QXBpRW5kcG9pbnQoXCIvaW50ZXJhY3Qvdm90ZVwiKSwge1xyXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICB1c2VySWQ6IHN0b3JhZ2VSZXN1bHQudXNlcklkLFxyXG4gICAgICAgIHZpZGVvSWQsXHJcbiAgICAgICAgdmFsdWU6IHZvdGUsXHJcbiAgICAgIH0pLFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHZvdGVSZXNwb25zZS5zdGF0dXMgPT0gNDAxICYmIGRlcHRoID4gMCkge1xyXG4gICAgICBhd2FpdCByZWdpc3RlcigpO1xyXG4gICAgICBhd2FpdCBzZW5kVm90ZSh2aWRlb0lkLCB2b3RlLCBkZXB0aCAtIDEpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IGVsc2UgaWYgKHZvdGVSZXNwb25zZS5zdGF0dXMgPT0gNDAxKSB7XHJcbiAgICAgIC8vIFdlIGhhdmUgYWxyZWFkeSB0cmllZCByZWdpc3RlcmluZ1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgdm90ZVJlc3BvbnNlSnNvbiA9IGF3YWl0IHZvdGVSZXNwb25zZS5qc29uKCk7XHJcbiAgICBjb25zdCBzb2x2ZWRQdXp6bGUgPSBhd2FpdCBzb2x2ZVB1enpsZSh2b3RlUmVzcG9uc2VKc29uKTtcclxuICAgIGlmICghc29sdmVkUHV6emxlLnNvbHV0aW9uKSB7XHJcbiAgICAgIGF3YWl0IHNlbmRWb3RlKHZpZGVvSWQsIHZvdGUpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgYXdhaXQgZmV0Y2goZ2V0QXBpRW5kcG9pbnQoXCIvaW50ZXJhY3QvY29uZmlybVZvdGVcIiksIHtcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgLi4uc29sdmVkUHV6emxlLFxyXG4gICAgICAgIHVzZXJJZDogc3RvcmFnZVJlc3VsdC51c2VySWQsXHJcbiAgICAgICAgdmlkZW9JZCxcclxuICAgICAgfSksXHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXIoKSB7XHJcbiAgY29uc3QgdXNlcklkID0gZ2VuZXJhdGVVc2VySUQoKTtcclxuICBhcGkuc3RvcmFnZS5zeW5jLnNldCh7IHVzZXJJZCB9KTtcclxuICBjb25zdCByZWdpc3RyYXRpb25SZXNwb25zZSA9IGF3YWl0IGZldGNoKGdldEFwaUVuZHBvaW50KGAvcHV6emxlL3JlZ2lzdHJhdGlvbj91c2VySWQ9JHt1c2VySWR9YCksIHtcclxuICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgIH0sXHJcbiAgfSkudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmpzb24oKSk7XHJcbiAgY29uc3Qgc29sdmVkUHV6emxlID0gYXdhaXQgc29sdmVQdXp6bGUocmVnaXN0cmF0aW9uUmVzcG9uc2UpO1xyXG4gIGlmICghc29sdmVkUHV6emxlLnNvbHV0aW9uKSB7XHJcbiAgICBhd2FpdCByZWdpc3RlcigpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBmZXRjaChnZXRBcGlFbmRwb2ludChgL3B1enpsZS9yZWdpc3RyYXRpb24/dXNlcklkPSR7dXNlcklkfWApLCB7XHJcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgIH0sXHJcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShzb2x2ZWRQdXp6bGUpLFxyXG4gIH0pLnRoZW4oKHJlc3BvbnNlKSA9PiByZXNwb25zZS5qc29uKCkpO1xyXG4gIGlmIChyZXN1bHQgPT09IHRydWUpIHtcclxuICAgIHJldHVybiBhcGkuc3RvcmFnZS5zeW5jLnNldCh7IHJlZ2lzdHJhdGlvbkNvbmZpcm1lZDogdHJ1ZSB9KTtcclxuICB9XHJcbn1cclxuXHJcbmFwaS5zdG9yYWdlLnN5bmMuZ2V0KG51bGwsIGFzeW5jIChyZXMpID0+IHtcclxuICBpZiAoIXJlcyB8fCAhcmVzLnVzZXJJZCB8fCAhcmVzLnJlZ2lzdHJhdGlvbkNvbmZpcm1lZCkge1xyXG4gICAgYXdhaXQgcmVnaXN0ZXIoKTtcclxuICB9XHJcbn0pO1xyXG5cclxuY29uc3Qgc2VudElkcyA9IG5ldyBTZXQoKTtcclxubGV0IHRvU2VuZCA9IFtdO1xyXG5cclxuZnVuY3Rpb24gY291bnRMZWFkaW5nWmVyb2VzKHVJbnQ4VmlldywgbGltaXQpIHtcclxuICBsZXQgemVyb2VzID0gMDtcclxuICBsZXQgdmFsdWUgPSAwO1xyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdUludDhWaWV3Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICB2YWx1ZSA9IHVJbnQ4Vmlld1tpXTtcclxuICAgIGlmICh2YWx1ZSA9PT0gMCkge1xyXG4gICAgICB6ZXJvZXMgKz0gODtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxldCBjb3VudCA9IDE7XHJcbiAgICAgIGlmICh2YWx1ZSA+Pj4gNCA9PT0gMCkge1xyXG4gICAgICAgIGNvdW50ICs9IDQ7XHJcbiAgICAgICAgdmFsdWUgPDw9IDQ7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHZhbHVlID4+PiA2ID09PSAwKSB7XHJcbiAgICAgICAgY291bnQgKz0gMjtcclxuICAgICAgICB2YWx1ZSA8PD0gMjtcclxuICAgICAgfVxyXG4gICAgICB6ZXJvZXMgKz0gY291bnQgLSAodmFsdWUgPj4+IDcpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGlmICh6ZXJvZXMgPj0gbGltaXQpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB6ZXJvZXM7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNvbHZlUHV6emxlKHB1enpsZSkge1xyXG4gIGxldCBjaGFsbGVuZ2UgPSBVaW50OEFycmF5LmZyb20oYXRvYihwdXp6bGUuY2hhbGxlbmdlKSwgKGMpID0+IGMuY2hhckNvZGVBdCgwKSk7XHJcbiAgbGV0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcigyMCk7XHJcbiAgbGV0IHVJbnQ4VmlldyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcbiAgbGV0IHVJbnQzMlZpZXcgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyKTtcclxuICBsZXQgbWF4Q291bnQgPSBNYXRoLnBvdygyLCBwdXp6bGUuZGlmZmljdWx0eSkgKiAzO1xyXG4gIGZvciAobGV0IGkgPSA0OyBpIDwgMjA7IGkrKykge1xyXG4gICAgdUludDhWaWV3W2ldID0gY2hhbGxlbmdlW2kgLSA0XTtcclxuICB9XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4Q291bnQ7IGkrKykge1xyXG4gICAgdUludDMyVmlld1swXSA9IGk7XHJcbiAgICBsZXQgaGFzaCA9IGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFwiU0hBLTUxMlwiLCBidWZmZXIpO1xyXG4gICAgbGV0IGhhc2hVaW50OCA9IG5ldyBVaW50OEFycmF5KGhhc2gpO1xyXG4gICAgaWYgKGNvdW50TGVhZGluZ1plcm9lcyhoYXNoVWludDgpID49IHB1enpsZS5kaWZmaWN1bHR5KSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc29sdXRpb246IGJ0b2EoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCB1SW50OFZpZXcuc2xpY2UoMCwgNCkpKSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHt9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZVVzZXJJRChsZW5ndGggPSAzNikge1xyXG4gIGNvbnN0IGNoYXJzZXQgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5XCI7XHJcbiAgbGV0IHJlc3VsdCA9IFwiXCI7XHJcbiAgaWYgKGNyeXB0byAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XHJcbiAgICBjb25zdCB2YWx1ZXMgPSBuZXcgVWludDMyQXJyYXkobGVuZ3RoKTtcclxuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXModmFsdWVzKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgcmVzdWx0ICs9IGNoYXJzZXRbdmFsdWVzW2ldICUgY2hhcnNldC5sZW5ndGhdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9IGVsc2Uge1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICByZXN1bHQgKz0gY2hhcnNldFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFyc2V0Lmxlbmd0aCldO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3JhZ2VDaGFuZ2VIYW5kbGVyKGNoYW5nZXMsIGFyZWEpIHtcclxuICBpZiAoY2hhbmdlcy5kaXNhYmxlVm90ZVN1Ym1pc3Npb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgaGFuZGxlRGlzYWJsZVZvdGVTdWJtaXNzaW9uQ2hhbmdlRXZlbnQoY2hhbmdlcy5kaXNhYmxlVm90ZVN1Ym1pc3Npb24ubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5jb2xvcmVkVGh1bWJzICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGhhbmRsZUNvbG9yZWRUaHVtYnNDaGFuZ2VFdmVudChjaGFuZ2VzLmNvbG9yZWRUaHVtYnMubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5jb2xvcmVkQmFyICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGhhbmRsZUNvbG9yZWRCYXJDaGFuZ2VFdmVudChjaGFuZ2VzLmNvbG9yZWRCYXIubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5jb2xvclRoZW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGhhbmRsZUNvbG9yVGhlbWVDaGFuZ2VFdmVudChjaGFuZ2VzLmNvbG9yVGhlbWUubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5udW1iZXJEaXNwbGF5Rm9ybWF0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGhhbmRsZU51bWJlckRpc3BsYXlGb3JtYXRDaGFuZ2VFdmVudChjaGFuZ2VzLm51bWJlckRpc3BsYXlGb3JtYXQubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5udW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBoYW5kbGVOdW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlc0NoYW5nZUV2ZW50KGNoYW5nZXMubnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXMubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5kaXNhYmxlTG9nZ2luZyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBoYW5kbGVEaXNhYmxlTG9nZ2luZ0NoYW5nZUV2ZW50KGNoYW5nZXMuZGlzYWJsZUxvZ2dpbmcubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5zaG93VG9vbHRpcFBlcmNlbnRhZ2UgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgaGFuZGxlU2hvd1Rvb2x0aXBQZXJjZW50YWdlQ2hhbmdlRXZlbnQoY2hhbmdlcy5zaG93VG9vbHRpcFBlcmNlbnRhZ2UubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5udW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlcyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBoYW5kbGVOdW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlc0NoYW5nZUV2ZW50KGNoYW5nZXMubnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXMubmV3VmFsdWUpO1xyXG4gIH1cclxuICBpZiAoY2hhbmdlcy5oaWRlUHJlbWl1bVRlYXNlciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBoYW5kbGVIaWRlUHJlbWl1bVRlYXNlckNoYW5nZUV2ZW50KGNoYW5nZXMuaGlkZVByZW1pdW1UZWFzZXIubmV3VmFsdWUpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlRGlzYWJsZVZvdGVTdWJtaXNzaW9uQ2hhbmdlRXZlbnQodmFsdWUpIHtcclxuICBleHRDb25maWcuZGlzYWJsZVZvdGVTdWJtaXNzaW9uID0gdmFsdWU7XHJcbiAgaWYgKHZhbHVlID09PSB0cnVlKSB7XHJcbiAgICBjaGFuZ2VJY29uKHZvdGVEaXNhYmxlZEljb25OYW1lKTtcclxuICB9IGVsc2Uge1xyXG4gICAgY2hhbmdlSWNvbihkZWZhdWx0SWNvbk5hbWUpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlRGlzYWJsZUxvZ2dpbmdDaGFuZ2VFdmVudCh2YWx1ZSkge1xyXG4gIGV4dENvbmZpZy5kaXNhYmxlTG9nZ2luZyA9IHZhbHVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVOdW1iZXJEaXNwbGF5Rm9ybWF0Q2hhbmdlRXZlbnQodmFsdWUpIHtcclxuICBleHRDb25maWcubnVtYmVyRGlzcGxheUZvcm1hdCA9IHZhbHVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVTaG93VG9vbHRpcFBlcmNlbnRhZ2VDaGFuZ2VFdmVudCh2YWx1ZSkge1xyXG4gIGV4dENvbmZpZy5zaG93VG9vbHRpcFBlcmNlbnRhZ2UgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlVG9vbHRpcFBlcmNlbnRhZ2VNb2RlQ2hhbmdlRXZlbnQodmFsdWUpIHtcclxuICBpZiAoIXZhbHVlKSB7XHJcbiAgICB2YWx1ZSA9IFwiZGFzaF9saWtlXCI7XHJcbiAgfVxyXG4gIGV4dENvbmZpZy50b29sdGlwUGVyY2VudGFnZU1vZGUgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hhbmdlSWNvbihpY29uTmFtZSkge1xyXG4gIGlmIChhcGkuYWN0aW9uICE9PSB1bmRlZmluZWQpIGFwaS5hY3Rpb24uc2V0SWNvbih7IHBhdGg6IFwiL2ljb25zL1wiICsgaWNvbk5hbWUgfSk7XHJcbiAgZWxzZSBpZiAoYXBpLmJyb3dzZXJBY3Rpb24gIT09IHVuZGVmaW5lZCkgYXBpLmJyb3dzZXJBY3Rpb24uc2V0SWNvbih7IHBhdGg6IFwiL2ljb25zL1wiICsgaWNvbk5hbWUgfSk7XHJcbiAgZWxzZSBjb25zb2xlLmxvZyhcImNoYW5naW5nIGljb24gaXMgbm90IHN1cHBvcnRlZFwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlQ29sb3JlZFRodW1ic0NoYW5nZUV2ZW50KHZhbHVlKSB7XHJcbiAgZXh0Q29uZmlnLmNvbG9yZWRUaHVtYnMgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlQ29sb3JlZEJhckNoYW5nZUV2ZW50KHZhbHVlKSB7XHJcbiAgZXh0Q29uZmlnLmNvbG9yZWRCYXIgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlQ29sb3JUaGVtZUNoYW5nZUV2ZW50KHZhbHVlKSB7XHJcbiAgaWYgKCF2YWx1ZSkge1xyXG4gICAgdmFsdWUgPSBcImNsYXNzaWNcIjtcclxuICB9XHJcbiAgZXh0Q29uZmlnLmNvbG9yVGhlbWUgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlTnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXNDaGFuZ2VFdmVudCh2YWx1ZSkge1xyXG4gIGV4dENvbmZpZy5udW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlcyA9IHZhbHVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVIaWRlUHJlbWl1bVRlYXNlckNoYW5nZUV2ZW50KHZhbHVlKSB7XHJcbiAgZXh0Q29uZmlnLmhpZGVQcmVtaXVtVGVhc2VyID0gdmFsdWUgPT09IHRydWU7XHJcbn1cclxuXHJcbmFwaS5zdG9yYWdlLm9uQ2hhbmdlZC5hZGRMaXN0ZW5lcihzdG9yYWdlQ2hhbmdlSGFuZGxlcik7XHJcblxyXG5mdW5jdGlvbiBpbml0RXh0Q29uZmlnKCkge1xyXG4gIGluaXRpYWxpemVEaXNhYmxlVm90ZVN1Ym1pc3Npb24oKTtcclxuICBpbml0aWFsaXplRGlzYWJsZUxvZ2dpbmcoKTtcclxuICBpbml0aWFsaXplQ29sb3JlZFRodW1icygpO1xyXG4gIGluaXRpYWxpemVDb2xvcmVkQmFyKCk7XHJcbiAgaW5pdGlhbGl6ZUNvbG9yVGhlbWUoKTtcclxuICBpbml0aWFsaXplTnVtYmVyRGlzcGxheUZvcm1hdCgpO1xyXG4gIGluaXRpYWxpemVOdW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlcygpO1xyXG4gIGluaXRpYWxpemVUb29sdGlwUGVyY2VudGFnZSgpO1xyXG4gIGluaXRpYWxpemVUb29sdGlwUGVyY2VudGFnZU1vZGUoKTtcclxuICBpbml0aWFsaXplSGlkZVByZW1pdW1UZWFzZXIoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZURpc2FibGVWb3RlU3VibWlzc2lvbigpIHtcclxuICBhcGkuc3RvcmFnZS5zeW5jLmdldChbXCJkaXNhYmxlVm90ZVN1Ym1pc3Npb25cIl0sIChyZXMpID0+IHtcclxuICAgIGlmIChyZXMuZGlzYWJsZVZvdGVTdWJtaXNzaW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXBpLnN0b3JhZ2Uuc3luYy5zZXQoeyBkaXNhYmxlVm90ZVN1Ym1pc3Npb246IGZhbHNlIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXh0Q29uZmlnLmRpc2FibGVWb3RlU3VibWlzc2lvbiA9IHJlcy5kaXNhYmxlVm90ZVN1Ym1pc3Npb247XHJcbiAgICAgIGlmIChyZXMuZGlzYWJsZVZvdGVTdWJtaXNzaW9uKSBjaGFuZ2VJY29uKHZvdGVEaXNhYmxlZEljb25OYW1lKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZURpc2FibGVMb2dnaW5nKCkge1xyXG4gIGFwaS5zdG9yYWdlLnN5bmMuZ2V0KFtcImRpc2FibGVMb2dnaW5nXCJdLCAocmVzKSA9PiB7XHJcbiAgICBpZiAocmVzLmRpc2FibGVMb2dnaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXBpLnN0b3JhZ2Uuc3luYy5zZXQoeyBkaXNhYmxlTG9nZ2luZzogdHJ1ZSB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV4dENvbmZpZy5kaXNhYmxlTG9nZ2luZyA9IHJlcy5kaXNhYmxlTG9nZ2luZztcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvbG9yZWRUaHVtYnMoKSB7XHJcbiAgYXBpLnN0b3JhZ2Uuc3luYy5nZXQoW1wiY29sb3JlZFRodW1ic1wiXSwgKHJlcykgPT4ge1xyXG4gICAgaWYgKHJlcy5jb2xvcmVkVGh1bWJzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXBpLnN0b3JhZ2Uuc3luYy5zZXQoeyBjb2xvcmVkVGh1bWJzOiBmYWxzZSB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV4dENvbmZpZy5jb2xvcmVkVGh1bWJzID0gcmVzLmNvbG9yZWRUaHVtYnM7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVDb2xvcmVkQmFyKCkge1xyXG4gIGFwaS5zdG9yYWdlLnN5bmMuZ2V0KFtcImNvbG9yZWRCYXJcIl0sIChyZXMpID0+IHtcclxuICAgIGlmIChyZXMuY29sb3JlZEJhciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFwaS5zdG9yYWdlLnN5bmMuc2V0KHsgY29sb3JlZEJhcjogZmFsc2UgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBleHRDb25maWcuY29sb3JlZEJhciA9IHJlcy5jb2xvcmVkQmFyO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0aWFsaXplQ29sb3JUaGVtZSgpIHtcclxuICBhcGkuc3RvcmFnZS5zeW5jLmdldChbXCJjb2xvclRoZW1lXCJdLCAocmVzKSA9PiB7XHJcbiAgICBpZiAocmVzLmNvbG9yVGhlbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcGkuc3RvcmFnZS5zeW5jLnNldCh7IGNvbG9yVGhlbWU6IGZhbHNlIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXh0Q29uZmlnLmNvbG9yVGhlbWUgPSByZXMuY29sb3JUaGVtZTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZU51bWJlckRpc3BsYXlGb3JtYXQoKSB7XHJcbiAgYXBpLnN0b3JhZ2Uuc3luYy5nZXQoW1wibnVtYmVyRGlzcGxheUZvcm1hdFwiXSwgKHJlcykgPT4ge1xyXG4gICAgaWYgKHJlcy5udW1iZXJEaXNwbGF5Rm9ybWF0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXBpLnN0b3JhZ2Uuc3luYy5zZXQoeyBudW1iZXJEaXNwbGF5Rm9ybWF0OiBcImNvbXBhY3RTaG9ydFwiIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXh0Q29uZmlnLm51bWJlckRpc3BsYXlGb3JtYXQgPSByZXMubnVtYmVyRGlzcGxheUZvcm1hdDtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZVRvb2x0aXBQZXJjZW50YWdlKCkge1xyXG4gIGFwaS5zdG9yYWdlLnN5bmMuZ2V0KFtcInNob3dUb29sdGlwUGVyY2VudGFnZVwiXSwgKHJlcykgPT4ge1xyXG4gICAgaWYgKHJlcy5zaG93VG9vbHRpcFBlcmNlbnRhZ2UgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcGkuc3RvcmFnZS5zeW5jLnNldCh7IHNob3dUb29sdGlwUGVyY2VudGFnZTogZmFsc2UgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBleHRDb25maWcuc2hvd1Rvb2x0aXBQZXJjZW50YWdlID0gcmVzLnNob3dUb29sdGlwUGVyY2VudGFnZTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZVRvb2x0aXBQZXJjZW50YWdlTW9kZSgpIHtcclxuICBhcGkuc3RvcmFnZS5zeW5jLmdldChbXCJ0b29sdGlwUGVyY2VudGFnZU1vZGVcIl0sIChyZXMpID0+IHtcclxuICAgIGlmIChyZXMudG9vbHRpcFBlcmNlbnRhZ2VNb2RlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXBpLnN0b3JhZ2Uuc3luYy5zZXQoeyB0b29sdGlwUGVyY2VudGFnZU1vZGU6IFwiZGFzaF9saWtlXCIgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBleHRDb25maWcudG9vbHRpcFBlcmNlbnRhZ2VNb2RlID0gcmVzLnRvb2x0aXBQZXJjZW50YWdlTW9kZTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZU51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzKCkge1xyXG4gIGFwaS5zdG9yYWdlLnN5bmMuZ2V0KFtcIm51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzXCJdLCAocmVzKSA9PiB7XHJcbiAgICBpZiAocmVzLm51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXBpLnN0b3JhZ2Uuc3luYy5zZXQoeyBudW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlczogZmFsc2UgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBleHRDb25maWcubnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXMgPSByZXMubnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXM7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVIaWRlUHJlbWl1bVRlYXNlcigpIHtcclxuICBhcGkuc3RvcmFnZS5zeW5jLmdldChbXCJoaWRlUHJlbWl1bVRlYXNlclwiXSwgKHJlcykgPT4ge1xyXG4gICAgaWYgKHJlcy5oaWRlUHJlbWl1bVRlYXNlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFwaS5zdG9yYWdlLnN5bmMuc2V0KHsgaGlkZVByZW1pdW1UZWFzZXI6IGZhbHNlIH0pO1xyXG4gICAgICBleHRDb25maWcuaGlkZVByZW1pdW1UZWFzZXIgPSBmYWxzZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV4dENvbmZpZy5oaWRlUHJlbWl1bVRlYXNlciA9IHJlcy5oaWRlUHJlbWl1bVRlYXNlciA9PT0gdHJ1ZTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNDaHJvbWUoKSB7XHJcbiAgcmV0dXJuIHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGNocm9tZS5ydW50aW1lICE9PSBcInVuZGVmaW5lZFwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0ZpcmVmb3goKSB7XHJcbiAgcmV0dXJuIHR5cGVvZiBicm93c2VyICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBicm93c2VyLnJ1bnRpbWUgIT09IFwidW5kZWZpbmVkXCI7XHJcbn1cclxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==