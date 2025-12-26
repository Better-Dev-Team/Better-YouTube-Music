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



;// ./Extensions/combined/popup.js


/*   Config   */
const popup_config = {
  advanced: false,
  disableVoteSubmission: false,
  disableLogging: true,
  coloredThumbs: false,
  coloredBar: false,
  colorTheme: "classic",
  numberDisplayFormat: "compactShort",
  showTooltipPercentage: false,
  tooltipPercentageMode: "dash_like",
  numberDisplayReformatLikes: false,
  hidePremiumTeaser: false,
  showAdvancedMessage:
    '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><rect fill="none" height="24" width="24"/><path d="M19.5,12c0-0.23-0.01-0.45-0.03-0.68l1.86-1.41c0.4-0.3,0.51-0.86,0.26-1.3l-1.87-3.23c-0.25-0.44-0.79-0.62-1.25-0.42 l-2.15,0.91c-0.37-0.26-0.76-0.49-1.17-0.68l-0.29-2.31C14.8,2.38,14.37,2,13.87,2h-3.73C9.63,2,9.2,2.38,9.14,2.88L8.85,5.19 c-0.41,0.19-0.8,0.42-1.17,0.68L5.53,4.96c-0.46-0.2-1-0.02-1.25,0.42L2.41,8.62c-0.25,0.44-0.14,0.99,0.26,1.3l1.86,1.41 C4.51,11.55,4.5,11.77,4.5,12s0.01,0.45,0.03,0.68l-1.86,1.41c-0.4,0.3-0.51,0.86-0.26,1.3l1.87,3.23c0.25,0.44,0.79,0.62,1.25,0.42 l2.15-0.91c0.37,0.26,0.76,0.49,1.17,0.68l0.29,2.31C9.2,21.62,9.63,22,10.13,22h3.73c0.5,0,0.93-0.38,0.99-0.88l0.29-2.31 c0.41-0.19,0.8-0.42,1.17-0.68l2.15,0.91c0.46,0.2,1,0.02,1.25-0.42l1.87-3.23c0.25-0.44,0.14-0.99-0.26-1.3l-1.86-1.41 C19.49,12.45,19.5,12.23,19.5,12z M12.04,15.5c-1.93,0-3.5-1.57-3.5-3.5s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.97,15.5,12.04,15.5z"/></svg>',
  hideAdvancedMessage:
    '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none" opacity=".87"/><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm4.3 14.3c-.39.39-1.02.39-1.41 0L12 13.41 9.11 16.3c-.39.39-1.02.39-1.41 0-.39-.39-.39-1.02 0-1.41L10.59 12 7.7 9.11c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L12 10.59l2.89-2.89c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41L13.41 12l2.89 2.89c.38.38.38 1.02 0 1.41z"/></svg>',
  links: config.links,
};

/*   Change language   */
function localizeHtmlPage() {
  //Localize by replacing __MSG_***__ meta tags
  var objects = document.getElementsByTagName("html");
  for (var j = 0; j < objects.length; j++) {
    var obj = objects[j];

    var valStrH = obj.innerHTML.toString();
    var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
      return v1 ? chrome.i18n.getMessage(v1) : "";
    });

    if (valNewH != valStrH) {
      obj.innerHTML = valNewH;
    }
  }
}

localizeHtmlPage();

/*   Links   */
createLink(popup_config.links.website, "link_website");
createLink(popup_config.links.github, "link_github");
createLink(popup_config.links.discord, "link_discord");
createLink(popup_config.links.faq, "link_faq");
createLink(popup_config.links.donate, "link_donate");
createLink(popup_config.links.help, "link_help");
createLink(popup_config.links.changelog, "link_changelog");

function createLink(url, id) {
  document.getElementById(id).addEventListener("click", () => {
    chrome.tabs.create({ url: url });
  });
}

document.getElementById("disable_vote_submission").addEventListener("click", (ev) => {
  chrome.storage.sync.set({ disableVoteSubmission: ev.target.checked });
});

document.getElementById("disable_logging").addEventListener("click", (ev) => {
  chrome.storage.sync.set({ disableLogging: ev.target.checked });
});

document.getElementById("colored_thumbs").addEventListener("click", (ev) => {
  chrome.storage.sync.set({ coloredThumbs: ev.target.checked });
});

document.getElementById("colored_bar").addEventListener("click", (ev) => {
  chrome.storage.sync.set({ coloredBar: ev.target.checked });
});

document.getElementById("color_theme").addEventListener("click", (ev) => {
  chrome.storage.sync.set({ colorTheme: ev.target.value });
});

document.getElementById("number_format").addEventListener("change", (ev) => {
  chrome.storage.sync.set({ numberDisplayFormat: ev.target.value });
});

document.getElementById("show_tooltip_percentage").addEventListener("click", (ev) => {
  chrome.storage.sync.set({ showTooltipPercentage: ev.target.checked });
});

document.getElementById("tooltip_percentage_mode").addEventListener("change", (ev) => {
  chrome.storage.sync.set({ tooltipPercentageMode: ev.target.value });
});

document.getElementById("number_reformat_likes").addEventListener("click", (ev) => {
  chrome.storage.sync.set({ numberDisplayReformatLikes: ev.target.checked });
});

document.getElementById("hide_premium_teaser").addEventListener("click", (ev) => {
  chrome.storage.sync.set({ hidePremiumTeaser: ev.target.checked });
});

function initPatreonAuth() {
  const loggedOutView = document.getElementById("patreon-logged-out");
  const loggedInView = document.getElementById("patreon-logged-in");
  const loginBtn = document.getElementById("patreon-login-btn");
  const logoutBtn = document.getElementById("patreon-logout-btn");
  const userAvatar = document.getElementById("patreon-user-avatar");
  const userName = document.getElementById("patreon-user-name");
  const userTier = document.getElementById("patreon-tier");

  chrome.storage.sync.get(["patreonUser", "patreonSessionToken"], (data) => {
    const cachedUser = data.patreonUser;
    const sessionToken = data.patreonSessionToken;

    if (sessionToken && cachedUser) {
      // Show cached state immediately to avoid flicker on popup reopen.
      showLoggedInView(cachedUser);

      verifySession(sessionToken).then((result) => {
        if (result.status === "valid") {
          if (result.membershipTier && result.membershipTier !== cachedUser.membershipTier) {
            const updatedUser = { ...cachedUser, membershipTier: result.membershipTier, hasActiveMembership: true };
            showLoggedInView(updatedUser);
            chrome.storage.sync.set({ patreonUser: updatedUser });
          } else if (cachedUser.hasActiveMembership !== true) {
            const updatedUser = { ...cachedUser, hasActiveMembership: true };
            showLoggedInView(updatedUser);
            chrome.storage.sync.set({ patreonUser: updatedUser });
          }
        } else if (result.status === "inactive") {
          const updatedUser = {
            ...cachedUser,
            hasActiveMembership: false,
            membershipTier: result.membershipTier || cachedUser.membershipTier || "none",
          };
          showLoggedInView(updatedUser);
          chrome.storage.sync.set({ patreonUser: updatedUser });
        } else if (result.status === "error") {
          console.warn("Patreon session verification skipped:", result.reason || "network_error");
        } else {
          showLoggedOutView();
          chrome.storage.sync.remove(["patreonUser", "patreonSessionToken"]);
        }
      });
    } else {
      showLoggedOutView();
    }
  });

  function showLoggedOutView() {
    loggedOutView.style.display = "block";
    loggedInView.style.display = "none";
  }

  function showLoggedInView(user) {
    loggedOutView.style.display = "none";
    loggedInView.style.display = "block";

    userName.textContent = user.fullName || user.email || chrome.i18n.getMessage("patreonUserFallback");

    if (user.imageUrl) {
      userAvatar.src = user.imageUrl;
      userAvatar.style.display = "block";
    } else {
      userAvatar.src = "";
      userAvatar.style.display = "none";
    }

    const tierLabels = {
      premium: chrome.i18n.getMessage("patreonTierPremium"),
      supporter: chrome.i18n.getMessage("patreonTierSupporter"),
      basic: chrome.i18n.getMessage("patreonTierBasic"),
      none: chrome.i18n.getMessage("patreonTierNone"),
    };

    userTier.textContent = tierLabels[user.membershipTier] || chrome.i18n.getMessage("patreonTierChecking");

    if (user.hasActiveMembership) {
      userTier.style.color = "#f96854";
    } else {
      userTier.style.color = "var(--lightGrey)";
    }
  }

  async function verifySession(token) {
    try {
      const response = await fetch(getApiEndpoint("/api/auth/verify"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionToken: token }),
      });

      const data = await response.json().catch(() => null);
      if (!data) {
        return { status: "error", reason: "invalid_response" };
      }

      const failureReason = typeof data.failureReason === "string" ? data.failureReason : null;
      const membershipTier = typeof data.membershipTier === "string" ? data.membershipTier : null;

      if (data.valid === true) {
        return { status: "valid", membershipTier };
      }

      if (failureReason === "membershipinactive") {
        return { status: "inactive", membershipTier };
      }

      if (failureReason === "expired" || failureReason === "legacyformat") {
        return { status: "expired", membershipTier };
      }

      if (failureReason === "invalid") {
        return { status: "invalid", membershipTier, failureReason };
      }

      if (!failureReason) {
        return { status: "error", reason: "unknown_failure" };
      }

      return { status: "error", reason: failureReason };
    } catch (error) {
      console.error("Session verification failed:", error);
      return { status: "error", reason: "network_error" };
    }
  }

  // Wrapper for cross-browser identity API
  function getIdentityApi() {
    if (typeof browser !== "undefined" && browser.identity) return browser.identity; // prefer Firefox promise API
    if (typeof chrome !== "undefined" && chrome.identity) return chrome.identity;
    return null;
  }

  function launchWebAuthFlow(url) {
    try {
      if (
        typeof browser !== "undefined" &&
        browser.identity &&
        typeof browser.identity.launchWebAuthFlow === "function"
      ) {
        // Promise-based API (Firefox)
        return browser.identity.launchWebAuthFlow({ url, interactive: true });
      }
    } catch (_) {}

    const chromeId = (typeof chrome !== "undefined" && chrome.identity) || null;
    if (!chromeId || typeof chromeId.launchWebAuthFlow !== "function") {
      return Promise.reject(new Error("identity API not available"));
    }
    // Callback-based API (Chrome)
    return new Promise((resolve, reject) => {
      chromeId.launchWebAuthFlow({ url, interactive: true }, (responseUrl) => {
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

  // Request identity permission immediately within the user click (no awaits prior)
  function ensureIdentityPermission(onResult) {
    try {
      const mf = chrome && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest() : null;
      // If manifest cannot request identity dynamically (e.g., Firefox), proceed if API is available
      if (mf && (!Array.isArray(mf.optional_permissions) || !mf.optional_permissions.includes("identity"))) {
        const id = getIdentityApi();
        onResult(Boolean(id && typeof id.getRedirectURL === "function"));
        return;
      }

      const perms =
        (typeof chrome !== "undefined" && chrome.permissions) ||
        (typeof browser !== "undefined" && browser.permissions);
      if (!perms || !perms.contains) return onResult(false);
      const afterContains = (has) => {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError) has = false;
        if (has) return onResult(true);
        if (!perms.request) return onResult(false);
        const reqResult = perms.request({ permissions: ["identity"] }, (granted) => {
          if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError) return onResult(false);
          onResult(Boolean(granted));
        });
        // Firefox may return a promise
        if (reqResult && typeof reqResult.then === "function") {
          reqResult.then((granted) => onResult(Boolean(granted))).catch(() => onResult(false));
        }
      };
      const result = perms.contains({ permissions: ["identity"] }, afterContains);
      if (result && typeof result.then === "function") {
        result.then(afterContains).catch(() => onResult(false));
      }
    } catch (_) {
      onResult(false);
    }
  }

  loginBtn.addEventListener("click", () => {
    // Request permission immediately within this user gesture
    ensureIdentityPermission(async (granted) => {
      const identityNow = getIdentityApi();
      if (!granted || !identityNow || typeof identityNow.getRedirectURL !== "function") {
        alert(chrome.i18n.getMessage("patreonPermissionRequired"));
        return;
      }
      // Delegate OAuth to background so it persists if the popup closes
      chrome.runtime.sendMessage({ message: "patreon_oauth_login" }, (resp) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          console.error("Login failed:", chrome.runtime.lastError.message);
          alert(chrome.i18n.getMessage("patreonLoginStartFailed"));
          return;
        }
        if (resp && resp.success) {
          const user = resp.user;
          showLoggedInView(user);
        } else {
          console.error("Login failed:", resp && resp.error);
          alert(chrome.i18n.getMessage("patreonLoginCompleteFailed"));
        }
      });
    });
  });

  logoutBtn.addEventListener("click", () => {
    chrome.storage.sync.remove(["patreonUser", "patreonSessionToken"], () => {
      showLoggedOutView();
      chrome.runtime.sendMessage({ message: "patreon_logout" });
    });
  });
}

initPatreonAuth();

/*   Advanced Toggle   */
const advancedToggle = document.getElementById("advancedToggle");
advancedToggle.addEventListener("click", () => {
  const adv = document.getElementById("advancedSettings");
  if (popup_config.advanced) {
    adv.style.transform = "scale(1.1)";
    adv.style.pointerEvents = "none";
    adv.style.opacity = "0";
    advancedToggle.innerHTML = popup_config.showAdvancedMessage;
  } else {
    adv.style.transform = "scale(1)";
    adv.style.pointerEvents = "auto";
    adv.style.opacity = "1";
    advancedToggle.innerHTML = popup_config.hideAdvancedMessage;
  }
  popup_config.advanced = !popup_config.advanced;
});

initConfig();

function initConfig() {
  initializeDisableVoteSubmission();
  initializeDisableLogging();
  initializeVersionNumber();
  initializeColoredThumbs();
  initializeColoredBar();
  initializeColorTheme();
  initializeNumberDisplayFormat();
  initializeTooltipPercentage();
  initializeTooltipPercentageMode();
  initializeNumberDisplayReformatLikes();
  initializeHidePremiumTeaser();
}

function initializeVersionNumber() {
  const version = chrome.runtime.getManifest().version;
  document.getElementById("ext-version").innerHTML = "v" + version;

  fetch(
    "https://raw.githubusercontent.com/Anarios/return-youtube-dislike/main/Extensions/combined/manifest-chrome.json",
  )
    .then((response) => response.json())
    .then((json) => {
      if (compareVersions(json.version, version)) {
        document.getElementById("ext-update").innerHTML = chrome.i18n.getMessage("textUpdate") + " v" + json.version;
        document.getElementById("ext-update").style.padding = ".25rem .5rem";
      }
    });
  // .catch(console.error);
}

// returns whether current < latest
function compareVersions(latestStr, currentStr) {
  let latestarr = latestStr.split(".");
  let currentarr = currentStr.split(".");
  let outdated = false;
  // goes through version numbers from left to right from greatest to least significant
  for (let i = 0; i < Math.max(latestarr.length, currentarr.length); i++) {
    let latest = i < latestarr.length ? parseInt(latestarr[i]) : 0;
    let current = i < currentarr.length ? parseInt(currentarr[i]) : 0;
    if (latest > current) {
      outdated = true;
      break;
    } else if (latest < current) {
      outdated = false;
      break;
    }
  }
  return outdated;
}

function initializeDisableVoteSubmission() {
  chrome.storage.sync.get(["disableVoteSubmission"], (res) => {
    handleDisableVoteSubmissionChangeEvent(res.disableVoteSubmission);
  });
}

function initializeDisableLogging() {
  chrome.storage.sync.get(["disableLogging"], (res) => {
    handleDisableLoggingChangeEvent(res.disableLogging);
  });
}

function initializeColoredThumbs() {
  chrome.storage.sync.get(["coloredThumbs"], (res) => {
    handleColoredThumbsChangeEvent(res.coloredThumbs);
  });
}

function initializeColoredBar() {
  chrome.storage.sync.get(["coloredBar"], (res) => {
    handleColoredBarChangeEvent(res.coloredBar);
  });
}

function initializeColorTheme() {
  chrome.storage.sync.get(["colorTheme"], (res) => {
    handleColorThemeChangeEvent(res.colorTheme);
  });
}

function initializeTooltipPercentage() {
  chrome.storage.sync.get(["showTooltipPercentage"], (res) => {
    handleShowTooltipPercentageChangeEvent(res.showTooltipPercentage);
  });
}

function initializeTooltipPercentageMode() {
  chrome.storage.sync.get(["tooltipPercentageMode"], (res) => {
    handleTooltipPercentageModeChangeEvent(res.tooltipPercentageMode);
  });
}

function initializeNumberDisplayFormat() {
  chrome.storage.sync.get(["numberDisplayFormat"], (res) => {
    handleNumberDisplayFormatChangeEvent(res.numberDisplayFormat);
  });
  updateNumberDisplayFormatContent();
}

function updateNumberDisplayFormatContent() {
  let testValue = 123456;
  document.getElementById("number_format_compactShort").innerHTML =
    getNumberFormatter("compactShort").format(testValue);
  document.getElementById("number_format_compactLong").innerHTML = getNumberFormatter("compactLong").format(testValue);
  document.getElementById("number_format_standard").innerHTML = getNumberFormatter("standard").format(testValue);
}

function initializeNumberDisplayReformatLikes() {
  chrome.storage.sync.get(["numberDisplayReformatLikes"], (res) => {
    handleNumberDisplayReformatLikesChangeEvent(res.numberDisplayReformatLikes);
  });
}

function initializeHidePremiumTeaser() {
  chrome.storage.sync.get(["hidePremiumTeaser"], (res) => {
    handleHidePremiumTeaserChangeEvent(res.hidePremiumTeaser);
  });
}

chrome.storage.onChanged.addListener(storageChangeHandler);

function storageChangeHandler(changes, area) {
  if (changes.disableVoteSubmission !== undefined) {
    handleDisableVoteSubmissionChangeEvent(changes.disableVoteSubmission.newValue);
  }
  if (changes.disableLogging !== undefined) {
    handleDisableLoggingChangeEvent(changes.disableLogging.newValue);
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
  popup_config.disableVoteSubmission = value;
  document.getElementById("disable_vote_submission").checked = value;
}

function handleDisableLoggingChangeEvent(value) {
  popup_config.disableLogging = value;
  document.getElementById("disable_logging").checked = value;
}

function handleColoredThumbsChangeEvent(value) {
  popup_config.coloredThumbs = value;
  document.getElementById("colored_thumbs").checked = value;
}

function handleColoredBarChangeEvent(value) {
  popup_config.coloredBar = value;
  document.getElementById("colored_bar").checked = value;
}

function handleColorThemeChangeEvent(value) {
  if (!value) {
    value = "classic";
  }
  popup_config.colorTheme = value;
  document.getElementById("color_theme").querySelector('option[value="' + value + '"]').selected = true;
  updateColorThemePreviewContent(value);
}

function updateColorThemePreviewContent(themeName) {
  document.getElementById("color_theme_example_like").style.backgroundColor = getColorFromTheme(themeName, true);
  document.getElementById("color_theme_example_dislike").style.backgroundColor = getColorFromTheme(themeName, false);
}

function handleNumberDisplayFormatChangeEvent(value) {
  popup_config.numberDisplayFormat = value;
  document.getElementById("number_format").querySelector('option[value="' + value + '"]').selected = true;
}

function handleShowTooltipPercentageChangeEvent(value) {
  popup_config.showTooltipPercentage = value;
  document.getElementById("show_tooltip_percentage").checked = value;
}

function handleTooltipPercentageModeChangeEvent(value) {
  if (!value) {
    value = "dash_like";
  }
  popup_config.tooltipPercentageMode = value;

  document.getElementById("tooltip_percentage_mode").querySelector('option[value="' + value + '"]').selected = true;
}

function handleNumberDisplayReformatLikesChangeEvent(value) {
  popup_config.numberDisplayReformatLikes = value;
  document.getElementById("number_reformat_likes").checked = value;
}

function handleHidePremiumTeaserChangeEvent(value) {
  const normalized = value === true;
  popup_config.hidePremiumTeaser = normalized;
  document.getElementById("hide_premium_teaser").checked = normalized;
}

function getNumberFormatter(optionSelect) {
  let formatterNotation;
  let formatterCompactDisplay;
  let userLocales;
  try {
    userLocales = new URL(
      Array.from(document.querySelectorAll("head > link[rel='search']"))
        ?.find((n) => n?.getAttribute("href")?.includes("?locale="))
        ?.getAttribute("href"),
    )?.searchParams?.get("locale");
  } catch {}

  switch (optionSelect) {
    case "compactLong":
      formatterNotation = "compact";
      formatterCompactDisplay = "long";
      break;
    case "standard":
      formatterNotation = "standard";
      formatterCompactDisplay = "short";
      break;
    case "compactShort":
    default:
      formatterNotation = "compact";
      formatterCompactDisplay = "short";
  }
  const formatter = Intl.NumberFormat(document.documentElement.lang || userLocales || navigator.language, {
    notation: formatterNotation,
    compactDisplay: formatterCompactDisplay,
  });
  return formatter;
}

(async function getStatus() {
  let status = document.getElementById("status");
  let serverStatus = document.getElementById("server-status");
  let resp = await fetch("https://returnyoutubedislikeapi.com/votes?videoId=YbJOTdZBX1g");
  let result = await resp.status;
  if (result === 200) {
    status.innerText = chrome.i18n.getMessage("apiStatusOnline");
    status.style.color = "green";
    serverStatus.style.filter =
      "invert(58%) sepia(81%) saturate(2618%) hue-rotate(81deg) brightness(119%) contrast(129%)";
  } else {
    status.innerText = chrome.i18n.getMessage("apiStatusOffline");
    status.style.color = "red";
    serverStatus.style.filter =
      "invert(11%) sepia(100%) saturate(6449%) hue-rotate(3deg) brightness(116%) contrast(115%)";
  }
})();

function getColorFromTheme(colorTheme, voteIsLike) {
  let colorString;
  switch (colorTheme) {
    case "accessible":
      if (voteIsLike === true) {
        colorString = "dodgerblue";
      } else {
        colorString = "gold";
      }
      break;
    case "neon":
      if (voteIsLike === true) {
        colorString = "aqua";
      } else {
        colorString = "magenta";
      }
      break;
    case "classic":
    default:
      if (voteIsLike === true) {
        colorString = "lime";
      } else {
        colorString = "red";
      }
  }
  return colorString;
}

/* popup-script.js
document.querySelector('#login')
.addEventListener('click', function () {
  chrome.runtime.sendMessage({ message: 'get_auth_token' });
});


document.querySelector("#log_off").addEventListener("click", function () {
  chrome.runtime.sendMessage({ message: "log_off" });
});
*/

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRSxZQUFNO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFLFlBQU07QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUUsWUFBTTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRSxZQUFNO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFLFlBQU07QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUUsWUFBTTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRSxZQUFNO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFLFlBQU07QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRSxZQUFNO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUUsWUFBTTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsMkJBQTJCO0FBQzFELENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSwrQkFBK0Isb0JBQW9CO0FBQ25ELENBQUM7QUFDRCIsInNvdXJjZXMiOlsid2VicGFjazovL3JldHVybi15b3V0dWJlLWRpc2xpa2UvLi9FeHRlbnNpb25zL2NvbWJpbmVkL3NyYy9jb25maWcuanMiLCJ3ZWJwYWNrOi8vcmV0dXJuLXlvdXR1YmUtZGlzbGlrZS8uL0V4dGVuc2lvbnMvY29tYmluZWQvcG9wdXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgREVWX0FQSV9VUkwgPSBcImh0dHBzOi8vbG9jYWxob3N0OjcyNThcIjtcclxuY29uc3QgUFJPRF9BUElfVVJMID0gXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlYXBpLmNvbVwiO1xyXG5cclxuY29uc3QgcnVudGltZSA9IHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgPyBjaHJvbWUucnVudGltZSA6IG51bGw7XHJcbmNvbnN0IG1hbmlmZXN0ID0gdHlwZW9mIHJ1bnRpbWU/LmdldE1hbmlmZXN0ID09PSBcImZ1bmN0aW9uXCIgPyBydW50aW1lLmdldE1hbmlmZXN0KCkgOiBudWxsO1xyXG5jb25zdCBpc0RldmVsb3BtZW50ID0gZmFsc2U7XHJcblxyXG5jb25zdCBleHRlbnNpb25DaGFuZ2Vsb2dVcmwgPVxyXG4gIHJ1bnRpbWUgJiYgdHlwZW9mIHJ1bnRpbWUuZ2V0VVJMID09PSBcImZ1bmN0aW9uXCJcclxuICAgID8gcnVudGltZS5nZXRVUkwoXCJjaGFuZ2Vsb2cvNC9jaGFuZ2Vsb2dfNC4wLmh0bWxcIilcclxuICAgIDogXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbS9jaGFuZ2Vsb2cvNC9jaGFuZ2Vsb2dfNC4wLmh0bWxcIjtcclxuXHJcbmNvbnN0IGNvbmZpZyA9IHtcclxuICBhcGlVcmw6IGlzRGV2ZWxvcG1lbnQgPyBERVZfQVBJX1VSTCA6IFBST0RfQVBJX1VSTCxcclxuXHJcbiAgdm90ZURpc2FibGVkSWNvbk5hbWU6IFwiaWNvbl9ob2xkMTI4LnBuZ1wiLFxyXG4gIGRlZmF1bHRJY29uTmFtZTogXCJpY29uMTI4LnBuZ1wiLFxyXG5cclxuICBsaW5rczoge1xyXG4gICAgd2Vic2l0ZTogXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbVwiLFxyXG4gICAgZ2l0aHViOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9BbmFyaW9zL3JldHVybi15b3V0dWJlLWRpc2xpa2VcIixcclxuICAgIGRpc2NvcmQ6IFwiaHR0cHM6Ly9kaXNjb3JkLmdnL21ZbkVTWTRNZDVcIixcclxuICAgIGRvbmF0ZTogXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbS9kb25hdGVcIixcclxuICAgIGZhcTogXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbS9mYXFcIixcclxuICAgIGhlbHA6IFwiaHR0cHM6Ly9yZXR1cm55b3V0dWJlZGlzbGlrZS5jb20vaGVscFwiLFxyXG4gICAgY2hhbmdlbG9nOiBleHRlbnNpb25DaGFuZ2Vsb2dVcmwsXHJcbiAgfSxcclxuXHJcbiAgZGVmYXVsdEV4dENvbmZpZzoge1xyXG4gICAgZGlzYWJsZVZvdGVTdWJtaXNzaW9uOiBmYWxzZSxcclxuICAgIGRpc2FibGVMb2dnaW5nOiB0cnVlLFxyXG4gICAgY29sb3JlZFRodW1iczogZmFsc2UsXHJcbiAgICBjb2xvcmVkQmFyOiBmYWxzZSxcclxuICAgIGNvbG9yVGhlbWU6IFwiY2xhc3NpY1wiLFxyXG4gICAgbnVtYmVyRGlzcGxheUZvcm1hdDogXCJjb21wYWN0U2hvcnRcIixcclxuICAgIG51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzOiBmYWxzZSxcclxuICAgIGhpZGVQcmVtaXVtVGVhc2VyOiBmYWxzZSxcclxuICB9LFxyXG59O1xyXG5cclxuZnVuY3Rpb24gZ2V0QXBpVXJsKCkge1xyXG4gIHJldHVybiBjb25maWcuYXBpVXJsO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBcGlFbmRwb2ludChlbmRwb2ludCkge1xyXG4gIHJldHVybiBgJHtjb25maWcuYXBpVXJsfSR7ZW5kcG9pbnQuc3RhcnRzV2l0aChcIi9cIikgPyBcIlwiIDogXCIvXCJ9JHtlbmRwb2ludH1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRDaGFuZ2Vsb2dVcmwoKSB7XHJcbiAgcmV0dXJuIGNvbmZpZy5saW5rcz8uY2hhbmdlbG9nID8/IGV4dGVuc2lvbkNoYW5nZWxvZ1VybDtcclxufVxyXG5cclxuZXhwb3J0IHsgY29uZmlnLCBnZXRBcGlVcmwsIGdldEFwaUVuZHBvaW50LCBnZXRDaGFuZ2Vsb2dVcmwgfTtcclxuIiwiaW1wb3J0IHsgY29uZmlnIGFzIGFwcENvbmZpZywgZ2V0QXBpVXJsLCBnZXRBcGlFbmRwb2ludCB9IGZyb20gXCIuL3NyYy9jb25maWcuanNcIjtcclxuXHJcbi8qICAgQ29uZmlnICAgKi9cclxuY29uc3QgY29uZmlnID0ge1xyXG4gIGFkdmFuY2VkOiBmYWxzZSxcclxuICBkaXNhYmxlVm90ZVN1Ym1pc3Npb246IGZhbHNlLFxyXG4gIGRpc2FibGVMb2dnaW5nOiB0cnVlLFxyXG4gIGNvbG9yZWRUaHVtYnM6IGZhbHNlLFxyXG4gIGNvbG9yZWRCYXI6IGZhbHNlLFxyXG4gIGNvbG9yVGhlbWU6IFwiY2xhc3NpY1wiLFxyXG4gIG51bWJlckRpc3BsYXlGb3JtYXQ6IFwiY29tcGFjdFNob3J0XCIsXHJcbiAgc2hvd1Rvb2x0aXBQZXJjZW50YWdlOiBmYWxzZSxcclxuICB0b29sdGlwUGVyY2VudGFnZU1vZGU6IFwiZGFzaF9saWtlXCIsXHJcbiAgbnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXM6IGZhbHNlLFxyXG4gIGhpZGVQcmVtaXVtVGVhc2VyOiBmYWxzZSxcclxuICBzaG93QWR2YW5jZWRNZXNzYWdlOlxyXG4gICAgJzxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGVuYWJsZS1iYWNrZ3JvdW5kPVwibmV3IDAgMCAyNCAyNFwiIGhlaWdodD1cIjI0cHhcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgd2lkdGg9XCIyNHB4XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPjxyZWN0IGZpbGw9XCJub25lXCIgaGVpZ2h0PVwiMjRcIiB3aWR0aD1cIjI0XCIvPjxwYXRoIGQ9XCJNMTkuNSwxMmMwLTAuMjMtMC4wMS0wLjQ1LTAuMDMtMC42OGwxLjg2LTEuNDFjMC40LTAuMywwLjUxLTAuODYsMC4yNi0xLjNsLTEuODctMy4yM2MtMC4yNS0wLjQ0LTAuNzktMC42Mi0xLjI1LTAuNDIgbC0yLjE1LDAuOTFjLTAuMzctMC4yNi0wLjc2LTAuNDktMS4xNy0wLjY4bC0wLjI5LTIuMzFDMTQuOCwyLjM4LDE0LjM3LDIsMTMuODcsMmgtMy43M0M5LjYzLDIsOS4yLDIuMzgsOS4xNCwyLjg4TDguODUsNS4xOSBjLTAuNDEsMC4xOS0wLjgsMC40Mi0xLjE3LDAuNjhMNS41Myw0Ljk2Yy0wLjQ2LTAuMi0xLTAuMDItMS4yNSwwLjQyTDIuNDEsOC42MmMtMC4yNSwwLjQ0LTAuMTQsMC45OSwwLjI2LDEuM2wxLjg2LDEuNDEgQzQuNTEsMTEuNTUsNC41LDExLjc3LDQuNSwxMnMwLjAxLDAuNDUsMC4wMywwLjY4bC0xLjg2LDEuNDFjLTAuNCwwLjMtMC41MSwwLjg2LTAuMjYsMS4zbDEuODcsMy4yM2MwLjI1LDAuNDQsMC43OSwwLjYyLDEuMjUsMC40MiBsMi4xNS0wLjkxYzAuMzcsMC4yNiwwLjc2LDAuNDksMS4xNywwLjY4bDAuMjksMi4zMUM5LjIsMjEuNjIsOS42MywyMiwxMC4xMywyMmgzLjczYzAuNSwwLDAuOTMtMC4zOCwwLjk5LTAuODhsMC4yOS0yLjMxIGMwLjQxLTAuMTksMC44LTAuNDIsMS4xNy0wLjY4bDIuMTUsMC45MWMwLjQ2LDAuMiwxLDAuMDIsMS4yNS0wLjQybDEuODctMy4yM2MwLjI1LTAuNDQsMC4xNC0wLjk5LTAuMjYtMS4zbC0xLjg2LTEuNDEgQzE5LjQ5LDEyLjQ1LDE5LjUsMTIuMjMsMTkuNSwxMnogTTEyLjA0LDE1LjVjLTEuOTMsMC0zLjUtMS41Ny0zLjUtMy41czEuNTctMy41LDMuNS0zLjVzMy41LDEuNTcsMy41LDMuNVMxMy45NywxNS41LDEyLjA0LDE1LjV6XCIvPjwvc3ZnPicsXHJcbiAgaGlkZUFkdmFuY2VkTWVzc2FnZTpcclxuICAgICc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBoZWlnaHQ9XCIyNHB4XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIHdpZHRoPVwiMjRweFwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj48cGF0aCBkPVwiTTAgMGgyNHYyNEgwVjB6XCIgZmlsbD1cIm5vbmVcIiBvcGFjaXR5PVwiLjg3XCIvPjxwYXRoIGQ9XCJNMTIgMkM2LjQ3IDIgMiA2LjQ3IDIgMTJzNC40NyAxMCAxMCAxMCAxMC00LjQ3IDEwLTEwUzE3LjUzIDIgMTIgMnptNC4zIDE0LjNjLS4zOS4zOS0xLjAyLjM5LTEuNDEgMEwxMiAxMy40MSA5LjExIDE2LjNjLS4zOS4zOS0xLjAyLjM5LTEuNDEgMC0uMzktLjM5LS4zOS0xLjAyIDAtMS40MUwxMC41OSAxMiA3LjcgOS4xMWMtLjM5LS4zOS0uMzktMS4wMiAwLTEuNDEuMzktLjM5IDEuMDItLjM5IDEuNDEgMEwxMiAxMC41OWwyLjg5LTIuODljLjM5LS4zOSAxLjAyLS4zOSAxLjQxIDAgLjM5LjM5LjM5IDEuMDIgMCAxLjQxTDEzLjQxIDEybDIuODkgMi44OWMuMzguMzguMzggMS4wMiAwIDEuNDF6XCIvPjwvc3ZnPicsXHJcbiAgbGlua3M6IGFwcENvbmZpZy5saW5rcyxcclxufTtcclxuXHJcbi8qICAgQ2hhbmdlIGxhbmd1YWdlICAgKi9cclxuZnVuY3Rpb24gbG9jYWxpemVIdG1sUGFnZSgpIHtcclxuICAvL0xvY2FsaXplIGJ5IHJlcGxhY2luZyBfX01TR18qKipfXyBtZXRhIHRhZ3NcclxuICB2YXIgb2JqZWN0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaHRtbFwiKTtcclxuICBmb3IgKHZhciBqID0gMDsgaiA8IG9iamVjdHMubGVuZ3RoOyBqKyspIHtcclxuICAgIHZhciBvYmogPSBvYmplY3RzW2pdO1xyXG5cclxuICAgIHZhciB2YWxTdHJIID0gb2JqLmlubmVySFRNTC50b1N0cmluZygpO1xyXG4gICAgdmFyIHZhbE5ld0ggPSB2YWxTdHJILnJlcGxhY2UoL19fTVNHXyhcXHcrKV9fL2csIGZ1bmN0aW9uIChtYXRjaCwgdjEpIHtcclxuICAgICAgcmV0dXJuIHYxID8gY2hyb21lLmkxOG4uZ2V0TWVzc2FnZSh2MSkgOiBcIlwiO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHZhbE5ld0ggIT0gdmFsU3RySCkge1xyXG4gICAgICBvYmouaW5uZXJIVE1MID0gdmFsTmV3SDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmxvY2FsaXplSHRtbFBhZ2UoKTtcclxuXHJcbi8qICAgTGlua3MgICAqL1xyXG5jcmVhdGVMaW5rKGNvbmZpZy5saW5rcy53ZWJzaXRlLCBcImxpbmtfd2Vic2l0ZVwiKTtcclxuY3JlYXRlTGluayhjb25maWcubGlua3MuZ2l0aHViLCBcImxpbmtfZ2l0aHViXCIpO1xyXG5jcmVhdGVMaW5rKGNvbmZpZy5saW5rcy5kaXNjb3JkLCBcImxpbmtfZGlzY29yZFwiKTtcclxuY3JlYXRlTGluayhjb25maWcubGlua3MuZmFxLCBcImxpbmtfZmFxXCIpO1xyXG5jcmVhdGVMaW5rKGNvbmZpZy5saW5rcy5kb25hdGUsIFwibGlua19kb25hdGVcIik7XHJcbmNyZWF0ZUxpbmsoY29uZmlnLmxpbmtzLmhlbHAsIFwibGlua19oZWxwXCIpO1xyXG5jcmVhdGVMaW5rKGNvbmZpZy5saW5rcy5jaGFuZ2Vsb2csIFwibGlua19jaGFuZ2Vsb2dcIik7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVMaW5rKHVybCwgaWQpIHtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybDogdXJsIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpc2FibGVfdm90ZV9zdWJtaXNzaW9uXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXYpID0+IHtcclxuICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IGRpc2FibGVWb3RlU3VibWlzc2lvbjogZXYudGFyZ2V0LmNoZWNrZWQgfSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkaXNhYmxlX2xvZ2dpbmdcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldikgPT4ge1xyXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgZGlzYWJsZUxvZ2dpbmc6IGV2LnRhcmdldC5jaGVja2VkIH0pO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29sb3JlZF90aHVtYnNcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldikgPT4ge1xyXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgY29sb3JlZFRodW1iczogZXYudGFyZ2V0LmNoZWNrZWQgfSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb2xvcmVkX2JhclwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2KSA9PiB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoeyBjb2xvcmVkQmFyOiBldi50YXJnZXQuY2hlY2tlZCB9KTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbG9yX3RoZW1lXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXYpID0+IHtcclxuICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IGNvbG9yVGhlbWU6IGV2LnRhcmdldC52YWx1ZSB9KTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm51bWJlcl9mb3JtYXRcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZXYpID0+IHtcclxuICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IG51bWJlckRpc3BsYXlGb3JtYXQ6IGV2LnRhcmdldC52YWx1ZSB9KTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob3dfdG9vbHRpcF9wZXJjZW50YWdlXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXYpID0+IHtcclxuICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IHNob3dUb29sdGlwUGVyY2VudGFnZTogZXYudGFyZ2V0LmNoZWNrZWQgfSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b29sdGlwX3BlcmNlbnRhZ2VfbW9kZVwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChldikgPT4ge1xyXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgdG9vbHRpcFBlcmNlbnRhZ2VNb2RlOiBldi50YXJnZXQudmFsdWUgfSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJudW1iZXJfcmVmb3JtYXRfbGlrZXNcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldikgPT4ge1xyXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgbnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXM6IGV2LnRhcmdldC5jaGVja2VkIH0pO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGlkZV9wcmVtaXVtX3RlYXNlclwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2KSA9PiB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoeyBoaWRlUHJlbWl1bVRlYXNlcjogZXYudGFyZ2V0LmNoZWNrZWQgfSk7XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gaW5pdFBhdHJlb25BdXRoKCkge1xyXG4gIGNvbnN0IGxvZ2dlZE91dFZpZXcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhdHJlb24tbG9nZ2VkLW91dFwiKTtcclxuICBjb25zdCBsb2dnZWRJblZpZXcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhdHJlb24tbG9nZ2VkLWluXCIpO1xyXG4gIGNvbnN0IGxvZ2luQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXRyZW9uLWxvZ2luLWJ0blwiKTtcclxuICBjb25zdCBsb2dvdXRCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhdHJlb24tbG9nb3V0LWJ0blwiKTtcclxuICBjb25zdCB1c2VyQXZhdGFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXRyZW9uLXVzZXItYXZhdGFyXCIpO1xyXG4gIGNvbnN0IHVzZXJOYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXRyZW9uLXVzZXItbmFtZVwiKTtcclxuICBjb25zdCB1c2VyVGllciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGF0cmVvbi10aWVyXCIpO1xyXG5cclxuICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChbXCJwYXRyZW9uVXNlclwiLCBcInBhdHJlb25TZXNzaW9uVG9rZW5cIl0sIChkYXRhKSA9PiB7XHJcbiAgICBjb25zdCBjYWNoZWRVc2VyID0gZGF0YS5wYXRyZW9uVXNlcjtcclxuICAgIGNvbnN0IHNlc3Npb25Ub2tlbiA9IGRhdGEucGF0cmVvblNlc3Npb25Ub2tlbjtcclxuXHJcbiAgICBpZiAoc2Vzc2lvblRva2VuICYmIGNhY2hlZFVzZXIpIHtcclxuICAgICAgLy8gU2hvdyBjYWNoZWQgc3RhdGUgaW1tZWRpYXRlbHkgdG8gYXZvaWQgZmxpY2tlciBvbiBwb3B1cCByZW9wZW4uXHJcbiAgICAgIHNob3dMb2dnZWRJblZpZXcoY2FjaGVkVXNlcik7XHJcblxyXG4gICAgICB2ZXJpZnlTZXNzaW9uKHNlc3Npb25Ub2tlbikudGhlbigocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09IFwidmFsaWRcIikge1xyXG4gICAgICAgICAgaWYgKHJlc3VsdC5tZW1iZXJzaGlwVGllciAmJiByZXN1bHQubWVtYmVyc2hpcFRpZXIgIT09IGNhY2hlZFVzZXIubWVtYmVyc2hpcFRpZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgdXBkYXRlZFVzZXIgPSB7IC4uLmNhY2hlZFVzZXIsIG1lbWJlcnNoaXBUaWVyOiByZXN1bHQubWVtYmVyc2hpcFRpZXIsIGhhc0FjdGl2ZU1lbWJlcnNoaXA6IHRydWUgfTtcclxuICAgICAgICAgICAgc2hvd0xvZ2dlZEluVmlldyh1cGRhdGVkVXNlcik7XHJcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgcGF0cmVvblVzZXI6IHVwZGF0ZWRVc2VyIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChjYWNoZWRVc2VyLmhhc0FjdGl2ZU1lbWJlcnNoaXAgIT09IHRydWUpIHtcclxuICAgICAgICAgICAgY29uc3QgdXBkYXRlZFVzZXIgPSB7IC4uLmNhY2hlZFVzZXIsIGhhc0FjdGl2ZU1lbWJlcnNoaXA6IHRydWUgfTtcclxuICAgICAgICAgICAgc2hvd0xvZ2dlZEluVmlldyh1cGRhdGVkVXNlcik7XHJcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgcGF0cmVvblVzZXI6IHVwZGF0ZWRVc2VyIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LnN0YXR1cyA9PT0gXCJpbmFjdGl2ZVwiKSB7XHJcbiAgICAgICAgICBjb25zdCB1cGRhdGVkVXNlciA9IHtcclxuICAgICAgICAgICAgLi4uY2FjaGVkVXNlcixcclxuICAgICAgICAgICAgaGFzQWN0aXZlTWVtYmVyc2hpcDogZmFsc2UsXHJcbiAgICAgICAgICAgIG1lbWJlcnNoaXBUaWVyOiByZXN1bHQubWVtYmVyc2hpcFRpZXIgfHwgY2FjaGVkVXNlci5tZW1iZXJzaGlwVGllciB8fCBcIm5vbmVcIixcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBzaG93TG9nZ2VkSW5WaWV3KHVwZGF0ZWRVc2VyKTtcclxuICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgcGF0cmVvblVzZXI6IHVwZGF0ZWRVc2VyIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LnN0YXR1cyA9PT0gXCJlcnJvclwiKSB7XHJcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJQYXRyZW9uIHNlc3Npb24gdmVyaWZpY2F0aW9uIHNraXBwZWQ6XCIsIHJlc3VsdC5yZWFzb24gfHwgXCJuZXR3b3JrX2Vycm9yXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzaG93TG9nZ2VkT3V0VmlldygpO1xyXG4gICAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5yZW1vdmUoW1wicGF0cmVvblVzZXJcIiwgXCJwYXRyZW9uU2Vzc2lvblRva2VuXCJdKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2hvd0xvZ2dlZE91dFZpZXcoKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgZnVuY3Rpb24gc2hvd0xvZ2dlZE91dFZpZXcoKSB7XHJcbiAgICBsb2dnZWRPdXRWaWV3LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XHJcbiAgICBsb2dnZWRJblZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gc2hvd0xvZ2dlZEluVmlldyh1c2VyKSB7XHJcbiAgICBsb2dnZWRPdXRWaWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgIGxvZ2dlZEluVmlldy5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG5cclxuICAgIHVzZXJOYW1lLnRleHRDb250ZW50ID0gdXNlci5mdWxsTmFtZSB8fCB1c2VyLmVtYWlsIHx8IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJwYXRyZW9uVXNlckZhbGxiYWNrXCIpO1xyXG5cclxuICAgIGlmICh1c2VyLmltYWdlVXJsKSB7XHJcbiAgICAgIHVzZXJBdmF0YXIuc3JjID0gdXNlci5pbWFnZVVybDtcclxuICAgICAgdXNlckF2YXRhci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdXNlckF2YXRhci5zcmMgPSBcIlwiO1xyXG4gICAgICB1c2VyQXZhdGFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0aWVyTGFiZWxzID0ge1xyXG4gICAgICBwcmVtaXVtOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwicGF0cmVvblRpZXJQcmVtaXVtXCIpLFxyXG4gICAgICBzdXBwb3J0ZXI6IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJwYXRyZW9uVGllclN1cHBvcnRlclwiKSxcclxuICAgICAgYmFzaWM6IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJwYXRyZW9uVGllckJhc2ljXCIpLFxyXG4gICAgICBub25lOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwicGF0cmVvblRpZXJOb25lXCIpLFxyXG4gICAgfTtcclxuXHJcbiAgICB1c2VyVGllci50ZXh0Q29udGVudCA9IHRpZXJMYWJlbHNbdXNlci5tZW1iZXJzaGlwVGllcl0gfHwgY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcInBhdHJlb25UaWVyQ2hlY2tpbmdcIik7XHJcblxyXG4gICAgaWYgKHVzZXIuaGFzQWN0aXZlTWVtYmVyc2hpcCkge1xyXG4gICAgICB1c2VyVGllci5zdHlsZS5jb2xvciA9IFwiI2Y5Njg1NFwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdXNlclRpZXIuc3R5bGUuY29sb3IgPSBcInZhcigtLWxpZ2h0R3JleSlcIjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGZ1bmN0aW9uIHZlcmlmeVNlc3Npb24odG9rZW4pIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZ2V0QXBpRW5kcG9pbnQoXCIvYXBpL2F1dGgvdmVyaWZ5XCIpLCB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc2Vzc2lvblRva2VuOiB0b2tlbiB9KSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpLmNhdGNoKCgpID0+IG51bGwpO1xyXG4gICAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgICByZXR1cm4geyBzdGF0dXM6IFwiZXJyb3JcIiwgcmVhc29uOiBcImludmFsaWRfcmVzcG9uc2VcIiB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBmYWlsdXJlUmVhc29uID0gdHlwZW9mIGRhdGEuZmFpbHVyZVJlYXNvbiA9PT0gXCJzdHJpbmdcIiA/IGRhdGEuZmFpbHVyZVJlYXNvbiA6IG51bGw7XHJcbiAgICAgIGNvbnN0IG1lbWJlcnNoaXBUaWVyID0gdHlwZW9mIGRhdGEubWVtYmVyc2hpcFRpZXIgPT09IFwic3RyaW5nXCIgPyBkYXRhLm1lbWJlcnNoaXBUaWVyIDogbnVsbDtcclxuXHJcbiAgICAgIGlmIChkYXRhLnZhbGlkID09PSB0cnVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBcInZhbGlkXCIsIG1lbWJlcnNoaXBUaWVyIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChmYWlsdXJlUmVhc29uID09PSBcIm1lbWJlcnNoaXBpbmFjdGl2ZVwiKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBcImluYWN0aXZlXCIsIG1lbWJlcnNoaXBUaWVyIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChmYWlsdXJlUmVhc29uID09PSBcImV4cGlyZWRcIiB8fCBmYWlsdXJlUmVhc29uID09PSBcImxlZ2FjeWZvcm1hdFwiKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBcImV4cGlyZWRcIiwgbWVtYmVyc2hpcFRpZXIgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZhaWx1cmVSZWFzb24gPT09IFwiaW52YWxpZFwiKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBcImludmFsaWRcIiwgbWVtYmVyc2hpcFRpZXIsIGZhaWx1cmVSZWFzb24gfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFmYWlsdXJlUmVhc29uKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiBcImVycm9yXCIsIHJlYXNvbjogXCJ1bmtub3duX2ZhaWx1cmVcIiB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4geyBzdGF0dXM6IFwiZXJyb3JcIiwgcmVhc29uOiBmYWlsdXJlUmVhc29uIH07XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiU2Vzc2lvbiB2ZXJpZmljYXRpb24gZmFpbGVkOlwiLCBlcnJvcik7XHJcbiAgICAgIHJldHVybiB7IHN0YXR1czogXCJlcnJvclwiLCByZWFzb246IFwibmV0d29ya19lcnJvclwiIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBXcmFwcGVyIGZvciBjcm9zcy1icm93c2VyIGlkZW50aXR5IEFQSVxyXG4gIGZ1bmN0aW9uIGdldElkZW50aXR5QXBpKCkge1xyXG4gICAgaWYgKHR5cGVvZiBicm93c2VyICE9PSBcInVuZGVmaW5lZFwiICYmIGJyb3dzZXIuaWRlbnRpdHkpIHJldHVybiBicm93c2VyLmlkZW50aXR5OyAvLyBwcmVmZXIgRmlyZWZveCBwcm9taXNlIEFQSVxyXG4gICAgaWYgKHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgY2hyb21lLmlkZW50aXR5KSByZXR1cm4gY2hyb21lLmlkZW50aXR5O1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBsYXVuY2hXZWJBdXRoRmxvdyh1cmwpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICB0eXBlb2YgYnJvd3NlciAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICAgIGJyb3dzZXIuaWRlbnRpdHkgJiZcclxuICAgICAgICB0eXBlb2YgYnJvd3Nlci5pZGVudGl0eS5sYXVuY2hXZWJBdXRoRmxvdyA9PT0gXCJmdW5jdGlvblwiXHJcbiAgICAgICkge1xyXG4gICAgICAgIC8vIFByb21pc2UtYmFzZWQgQVBJIChGaXJlZm94KVxyXG4gICAgICAgIHJldHVybiBicm93c2VyLmlkZW50aXR5LmxhdW5jaFdlYkF1dGhGbG93KHsgdXJsLCBpbnRlcmFjdGl2ZTogdHJ1ZSB9KTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoXykge31cclxuXHJcbiAgICBjb25zdCBjaHJvbWVJZCA9ICh0eXBlb2YgY2hyb21lICE9PSBcInVuZGVmaW5lZFwiICYmIGNocm9tZS5pZGVudGl0eSkgfHwgbnVsbDtcclxuICAgIGlmICghY2hyb21lSWQgfHwgdHlwZW9mIGNocm9tZUlkLmxhdW5jaFdlYkF1dGhGbG93ICE9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcImlkZW50aXR5IEFQSSBub3QgYXZhaWxhYmxlXCIpKTtcclxuICAgIH1cclxuICAgIC8vIENhbGxiYWNrLWJhc2VkIEFQSSAoQ2hyb21lKVxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY2hyb21lSWQubGF1bmNoV2ViQXV0aEZsb3coeyB1cmwsIGludGVyYWN0aXZlOiB0cnVlIH0sIChyZXNwb25zZVVybCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVyciA9IGNocm9tZS5ydW50aW1lICYmIGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcjtcclxuICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtcclxuICAgICAgICBlbHNlIHJlc29sdmUocmVzcG9uc2VVcmwpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZXh0cmFjdE9BdXRoUGFyYW1zKHJlc3BvbnNlVXJsKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCB1ID0gbmV3IFVSTChyZXNwb25zZVVybCk7XHJcbiAgICAgIGxldCBjb2RlID0gdS5zZWFyY2hQYXJhbXMuZ2V0KFwiY29kZVwiKTtcclxuICAgICAgbGV0IHN0YXRlID0gdS5zZWFyY2hQYXJhbXMuZ2V0KFwic3RhdGVcIik7XHJcbiAgICAgIGlmICghY29kZSAmJiB1Lmhhc2gpIHtcclxuICAgICAgICBjb25zdCBoYXNoUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh1Lmhhc2guc3RhcnRzV2l0aChcIiNcIikgPyB1Lmhhc2guc3Vic3RyaW5nKDEpIDogdS5oYXNoKTtcclxuICAgICAgICBjb2RlID0gaGFzaFBhcmFtcy5nZXQoXCJjb2RlXCIpO1xyXG4gICAgICAgIHN0YXRlID0gc3RhdGUgfHwgaGFzaFBhcmFtcy5nZXQoXCJzdGF0ZVwiKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4geyBjb2RlLCBzdGF0ZSB9O1xyXG4gICAgfSBjYXRjaCAoXykge1xyXG4gICAgICByZXR1cm4geyBjb2RlOiBudWxsLCBzdGF0ZTogbnVsbCB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUmVxdWVzdCBpZGVudGl0eSBwZXJtaXNzaW9uIGltbWVkaWF0ZWx5IHdpdGhpbiB0aGUgdXNlciBjbGljayAobm8gYXdhaXRzIHByaW9yKVxyXG4gIGZ1bmN0aW9uIGVuc3VyZUlkZW50aXR5UGVybWlzc2lvbihvblJlc3VsdCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgbWYgPSBjaHJvbWUgJiYgY2hyb21lLnJ1bnRpbWUgJiYgY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QgPyBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpIDogbnVsbDtcclxuICAgICAgLy8gSWYgbWFuaWZlc3QgY2Fubm90IHJlcXVlc3QgaWRlbnRpdHkgZHluYW1pY2FsbHkgKGUuZy4sIEZpcmVmb3gpLCBwcm9jZWVkIGlmIEFQSSBpcyBhdmFpbGFibGVcclxuICAgICAgaWYgKG1mICYmICghQXJyYXkuaXNBcnJheShtZi5vcHRpb25hbF9wZXJtaXNzaW9ucykgfHwgIW1mLm9wdGlvbmFsX3Blcm1pc3Npb25zLmluY2x1ZGVzKFwiaWRlbnRpdHlcIikpKSB7XHJcbiAgICAgICAgY29uc3QgaWQgPSBnZXRJZGVudGl0eUFwaSgpO1xyXG4gICAgICAgIG9uUmVzdWx0KEJvb2xlYW4oaWQgJiYgdHlwZW9mIGlkLmdldFJlZGlyZWN0VVJMID09PSBcImZ1bmN0aW9uXCIpKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHBlcm1zID1cclxuICAgICAgICAodHlwZW9mIGNocm9tZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjaHJvbWUucGVybWlzc2lvbnMpIHx8XHJcbiAgICAgICAgKHR5cGVvZiBicm93c2VyICE9PSBcInVuZGVmaW5lZFwiICYmIGJyb3dzZXIucGVybWlzc2lvbnMpO1xyXG4gICAgICBpZiAoIXBlcm1zIHx8ICFwZXJtcy5jb250YWlucykgcmV0dXJuIG9uUmVzdWx0KGZhbHNlKTtcclxuICAgICAgY29uc3QgYWZ0ZXJDb250YWlucyA9IChoYXMpID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIGNocm9tZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjaHJvbWUucnVudGltZSAmJiBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIGhhcyA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChoYXMpIHJldHVybiBvblJlc3VsdCh0cnVlKTtcclxuICAgICAgICBpZiAoIXBlcm1zLnJlcXVlc3QpIHJldHVybiBvblJlc3VsdChmYWxzZSk7XHJcbiAgICAgICAgY29uc3QgcmVxUmVzdWx0ID0gcGVybXMucmVxdWVzdCh7IHBlcm1pc3Npb25zOiBbXCJpZGVudGl0eVwiXSB9LCAoZ3JhbnRlZCkgPT4ge1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgY2hyb21lLnJ1bnRpbWUgJiYgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSByZXR1cm4gb25SZXN1bHQoZmFsc2UpO1xyXG4gICAgICAgICAgb25SZXN1bHQoQm9vbGVhbihncmFudGVkKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gRmlyZWZveCBtYXkgcmV0dXJuIGEgcHJvbWlzZVxyXG4gICAgICAgIGlmIChyZXFSZXN1bHQgJiYgdHlwZW9mIHJlcVJlc3VsdC50aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgIHJlcVJlc3VsdC50aGVuKChncmFudGVkKSA9PiBvblJlc3VsdChCb29sZWFuKGdyYW50ZWQpKSkuY2F0Y2goKCkgPT4gb25SZXN1bHQoZmFsc2UpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHBlcm1zLmNvbnRhaW5zKHsgcGVybWlzc2lvbnM6IFtcImlkZW50aXR5XCJdIH0sIGFmdGVyQ29udGFpbnMpO1xyXG4gICAgICBpZiAocmVzdWx0ICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgcmVzdWx0LnRoZW4oYWZ0ZXJDb250YWlucykuY2F0Y2goKCkgPT4gb25SZXN1bHQoZmFsc2UpKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoXykge1xyXG4gICAgICBvblJlc3VsdChmYWxzZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsb2dpbkJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgLy8gUmVxdWVzdCBwZXJtaXNzaW9uIGltbWVkaWF0ZWx5IHdpdGhpbiB0aGlzIHVzZXIgZ2VzdHVyZVxyXG4gICAgZW5zdXJlSWRlbnRpdHlQZXJtaXNzaW9uKGFzeW5jIChncmFudGVkKSA9PiB7XHJcbiAgICAgIGNvbnN0IGlkZW50aXR5Tm93ID0gZ2V0SWRlbnRpdHlBcGkoKTtcclxuICAgICAgaWYgKCFncmFudGVkIHx8ICFpZGVudGl0eU5vdyB8fCB0eXBlb2YgaWRlbnRpdHlOb3cuZ2V0UmVkaXJlY3RVUkwgIT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgIGFsZXJ0KGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJwYXRyZW9uUGVybWlzc2lvblJlcXVpcmVkXCIpKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgLy8gRGVsZWdhdGUgT0F1dGggdG8gYmFja2dyb3VuZCBzbyBpdCBwZXJzaXN0cyBpZiB0aGUgcG9wdXAgY2xvc2VzXHJcbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgbWVzc2FnZTogXCJwYXRyZW9uX29hdXRoX2xvZ2luXCIgfSwgKHJlc3ApID0+IHtcclxuICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUgJiYgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTG9naW4gZmFpbGVkOlwiLCBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICBhbGVydChjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwicGF0cmVvbkxvZ2luU3RhcnRGYWlsZWRcIikpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVzcCAmJiByZXNwLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgIGNvbnN0IHVzZXIgPSByZXNwLnVzZXI7XHJcbiAgICAgICAgICBzaG93TG9nZ2VkSW5WaWV3KHVzZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTG9naW4gZmFpbGVkOlwiLCByZXNwICYmIHJlc3AuZXJyb3IpO1xyXG4gICAgICAgICAgYWxlcnQoY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcInBhdHJlb25Mb2dpbkNvbXBsZXRlRmFpbGVkXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGxvZ291dEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5yZW1vdmUoW1wicGF0cmVvblVzZXJcIiwgXCJwYXRyZW9uU2Vzc2lvblRva2VuXCJdLCAoKSA9PiB7XHJcbiAgICAgIHNob3dMb2dnZWRPdXRWaWV3KCk7XHJcbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgbWVzc2FnZTogXCJwYXRyZW9uX2xvZ291dFwiIH0pO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmluaXRQYXRyZW9uQXV0aCgpO1xyXG5cclxuLyogICBBZHZhbmNlZCBUb2dnbGUgICAqL1xyXG5jb25zdCBhZHZhbmNlZFRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWR2YW5jZWRUb2dnbGVcIik7XHJcbmFkdmFuY2VkVG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgY29uc3QgYWR2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhZHZhbmNlZFNldHRpbmdzXCIpO1xyXG4gIGlmIChjb25maWcuYWR2YW5jZWQpIHtcclxuICAgIGFkdi5zdHlsZS50cmFuc2Zvcm0gPSBcInNjYWxlKDEuMSlcIjtcclxuICAgIGFkdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCI7XHJcbiAgICBhZHYuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xyXG4gICAgYWR2YW5jZWRUb2dnbGUuaW5uZXJIVE1MID0gY29uZmlnLnNob3dBZHZhbmNlZE1lc3NhZ2U7XHJcbiAgfSBlbHNlIHtcclxuICAgIGFkdi5zdHlsZS50cmFuc2Zvcm0gPSBcInNjYWxlKDEpXCI7XHJcbiAgICBhZHYuc3R5bGUucG9pbnRlckV2ZW50cyA9IFwiYXV0b1wiO1xyXG4gICAgYWR2LnN0eWxlLm9wYWNpdHkgPSBcIjFcIjtcclxuICAgIGFkdmFuY2VkVG9nZ2xlLmlubmVySFRNTCA9IGNvbmZpZy5oaWRlQWR2YW5jZWRNZXNzYWdlO1xyXG4gIH1cclxuICBjb25maWcuYWR2YW5jZWQgPSAhY29uZmlnLmFkdmFuY2VkO1xyXG59KTtcclxuXHJcbmluaXRDb25maWcoKTtcclxuXHJcbmZ1bmN0aW9uIGluaXRDb25maWcoKSB7XHJcbiAgaW5pdGlhbGl6ZURpc2FibGVWb3RlU3VibWlzc2lvbigpO1xyXG4gIGluaXRpYWxpemVEaXNhYmxlTG9nZ2luZygpO1xyXG4gIGluaXRpYWxpemVWZXJzaW9uTnVtYmVyKCk7XHJcbiAgaW5pdGlhbGl6ZUNvbG9yZWRUaHVtYnMoKTtcclxuICBpbml0aWFsaXplQ29sb3JlZEJhcigpO1xyXG4gIGluaXRpYWxpemVDb2xvclRoZW1lKCk7XHJcbiAgaW5pdGlhbGl6ZU51bWJlckRpc3BsYXlGb3JtYXQoKTtcclxuICBpbml0aWFsaXplVG9vbHRpcFBlcmNlbnRhZ2UoKTtcclxuICBpbml0aWFsaXplVG9vbHRpcFBlcmNlbnRhZ2VNb2RlKCk7XHJcbiAgaW5pdGlhbGl6ZU51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzKCk7XHJcbiAgaW5pdGlhbGl6ZUhpZGVQcmVtaXVtVGVhc2VyKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVWZXJzaW9uTnVtYmVyKCkge1xyXG4gIGNvbnN0IHZlcnNpb24gPSBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLnZlcnNpb247XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHQtdmVyc2lvblwiKS5pbm5lckhUTUwgPSBcInZcIiArIHZlcnNpb247XHJcblxyXG4gIGZldGNoKFxyXG4gICAgXCJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vQW5hcmlvcy9yZXR1cm4teW91dHViZS1kaXNsaWtlL21haW4vRXh0ZW5zaW9ucy9jb21iaW5lZC9tYW5pZmVzdC1jaHJvbWUuanNvblwiLFxyXG4gIClcclxuICAgIC50aGVuKChyZXNwb25zZSkgPT4gcmVzcG9uc2UuanNvbigpKVxyXG4gICAgLnRoZW4oKGpzb24pID0+IHtcclxuICAgICAgaWYgKGNvbXBhcmVWZXJzaW9ucyhqc29uLnZlcnNpb24sIHZlcnNpb24pKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHQtdXBkYXRlXCIpLmlubmVySFRNTCA9IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJ0ZXh0VXBkYXRlXCIpICsgXCIgdlwiICsganNvbi52ZXJzaW9uO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXh0LXVwZGF0ZVwiKS5zdHlsZS5wYWRkaW5nID0gXCIuMjVyZW0gLjVyZW1cIjtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgLy8gLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG59XHJcblxyXG4vLyByZXR1cm5zIHdoZXRoZXIgY3VycmVudCA8IGxhdGVzdFxyXG5mdW5jdGlvbiBjb21wYXJlVmVyc2lvbnMobGF0ZXN0U3RyLCBjdXJyZW50U3RyKSB7XHJcbiAgbGV0IGxhdGVzdGFyciA9IGxhdGVzdFN0ci5zcGxpdChcIi5cIik7XHJcbiAgbGV0IGN1cnJlbnRhcnIgPSBjdXJyZW50U3RyLnNwbGl0KFwiLlwiKTtcclxuICBsZXQgb3V0ZGF0ZWQgPSBmYWxzZTtcclxuICAvLyBnb2VzIHRocm91Z2ggdmVyc2lvbiBudW1iZXJzIGZyb20gbGVmdCB0byByaWdodCBmcm9tIGdyZWF0ZXN0IHRvIGxlYXN0IHNpZ25pZmljYW50XHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1heChsYXRlc3RhcnIubGVuZ3RoLCBjdXJyZW50YXJyLmxlbmd0aCk7IGkrKykge1xyXG4gICAgbGV0IGxhdGVzdCA9IGkgPCBsYXRlc3RhcnIubGVuZ3RoID8gcGFyc2VJbnQobGF0ZXN0YXJyW2ldKSA6IDA7XHJcbiAgICBsZXQgY3VycmVudCA9IGkgPCBjdXJyZW50YXJyLmxlbmd0aCA/IHBhcnNlSW50KGN1cnJlbnRhcnJbaV0pIDogMDtcclxuICAgIGlmIChsYXRlc3QgPiBjdXJyZW50KSB7XHJcbiAgICAgIG91dGRhdGVkID0gdHJ1ZTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9IGVsc2UgaWYgKGxhdGVzdCA8IGN1cnJlbnQpIHtcclxuICAgICAgb3V0ZGF0ZWQgPSBmYWxzZTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBvdXRkYXRlZDtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZURpc2FibGVWb3RlU3VibWlzc2lvbigpIHtcclxuICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChbXCJkaXNhYmxlVm90ZVN1Ym1pc3Npb25cIl0sIChyZXMpID0+IHtcclxuICAgIGhhbmRsZURpc2FibGVWb3RlU3VibWlzc2lvbkNoYW5nZUV2ZW50KHJlcy5kaXNhYmxlVm90ZVN1Ym1pc3Npb24pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0aWFsaXplRGlzYWJsZUxvZ2dpbmcoKSB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoW1wiZGlzYWJsZUxvZ2dpbmdcIl0sIChyZXMpID0+IHtcclxuICAgIGhhbmRsZURpc2FibGVMb2dnaW5nQ2hhbmdlRXZlbnQocmVzLmRpc2FibGVMb2dnaW5nKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvbG9yZWRUaHVtYnMoKSB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoW1wiY29sb3JlZFRodW1ic1wiXSwgKHJlcykgPT4ge1xyXG4gICAgaGFuZGxlQ29sb3JlZFRodW1ic0NoYW5nZUV2ZW50KHJlcy5jb2xvcmVkVGh1bWJzKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvbG9yZWRCYXIoKSB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoW1wiY29sb3JlZEJhclwiXSwgKHJlcykgPT4ge1xyXG4gICAgaGFuZGxlQ29sb3JlZEJhckNoYW5nZUV2ZW50KHJlcy5jb2xvcmVkQmFyKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvbG9yVGhlbWUoKSB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoW1wiY29sb3JUaGVtZVwiXSwgKHJlcykgPT4ge1xyXG4gICAgaGFuZGxlQ29sb3JUaGVtZUNoYW5nZUV2ZW50KHJlcy5jb2xvclRoZW1lKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZVRvb2x0aXBQZXJjZW50YWdlKCkge1xyXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KFtcInNob3dUb29sdGlwUGVyY2VudGFnZVwiXSwgKHJlcykgPT4ge1xyXG4gICAgaGFuZGxlU2hvd1Rvb2x0aXBQZXJjZW50YWdlQ2hhbmdlRXZlbnQocmVzLnNob3dUb29sdGlwUGVyY2VudGFnZSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVUb29sdGlwUGVyY2VudGFnZU1vZGUoKSB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoW1widG9vbHRpcFBlcmNlbnRhZ2VNb2RlXCJdLCAocmVzKSA9PiB7XHJcbiAgICBoYW5kbGVUb29sdGlwUGVyY2VudGFnZU1vZGVDaGFuZ2VFdmVudChyZXMudG9vbHRpcFBlcmNlbnRhZ2VNb2RlKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZU51bWJlckRpc3BsYXlGb3JtYXQoKSB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoW1wibnVtYmVyRGlzcGxheUZvcm1hdFwiXSwgKHJlcykgPT4ge1xyXG4gICAgaGFuZGxlTnVtYmVyRGlzcGxheUZvcm1hdENoYW5nZUV2ZW50KHJlcy5udW1iZXJEaXNwbGF5Rm9ybWF0KTtcclxuICB9KTtcclxuICB1cGRhdGVOdW1iZXJEaXNwbGF5Rm9ybWF0Q29udGVudCgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVOdW1iZXJEaXNwbGF5Rm9ybWF0Q29udGVudCgpIHtcclxuICBsZXQgdGVzdFZhbHVlID0gMTIzNDU2O1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibnVtYmVyX2Zvcm1hdF9jb21wYWN0U2hvcnRcIikuaW5uZXJIVE1MID1cclxuICAgIGdldE51bWJlckZvcm1hdHRlcihcImNvbXBhY3RTaG9ydFwiKS5mb3JtYXQodGVzdFZhbHVlKTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm51bWJlcl9mb3JtYXRfY29tcGFjdExvbmdcIikuaW5uZXJIVE1MID0gZ2V0TnVtYmVyRm9ybWF0dGVyKFwiY29tcGFjdExvbmdcIikuZm9ybWF0KHRlc3RWYWx1ZSk7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJudW1iZXJfZm9ybWF0X3N0YW5kYXJkXCIpLmlubmVySFRNTCA9IGdldE51bWJlckZvcm1hdHRlcihcInN0YW5kYXJkXCIpLmZvcm1hdCh0ZXN0VmFsdWUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0aWFsaXplTnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXMoKSB7XHJcbiAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoW1wibnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXNcIl0sIChyZXMpID0+IHtcclxuICAgIGhhbmRsZU51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzQ2hhbmdlRXZlbnQocmVzLm51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZUhpZGVQcmVtaXVtVGVhc2VyKCkge1xyXG4gIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KFtcImhpZGVQcmVtaXVtVGVhc2VyXCJdLCAocmVzKSA9PiB7XHJcbiAgICBoYW5kbGVIaWRlUHJlbWl1bVRlYXNlckNoYW5nZUV2ZW50KHJlcy5oaWRlUHJlbWl1bVRlYXNlcik7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmNocm9tZS5zdG9yYWdlLm9uQ2hhbmdlZC5hZGRMaXN0ZW5lcihzdG9yYWdlQ2hhbmdlSGFuZGxlcik7XHJcblxyXG5mdW5jdGlvbiBzdG9yYWdlQ2hhbmdlSGFuZGxlcihjaGFuZ2VzLCBhcmVhKSB7XHJcbiAgaWYgKGNoYW5nZXMuZGlzYWJsZVZvdGVTdWJtaXNzaW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGhhbmRsZURpc2FibGVWb3RlU3VibWlzc2lvbkNoYW5nZUV2ZW50KGNoYW5nZXMuZGlzYWJsZVZvdGVTdWJtaXNzaW9uLm5ld1ZhbHVlKTtcclxuICB9XHJcbiAgaWYgKGNoYW5nZXMuZGlzYWJsZUxvZ2dpbmcgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgaGFuZGxlRGlzYWJsZUxvZ2dpbmdDaGFuZ2VFdmVudChjaGFuZ2VzLmRpc2FibGVMb2dnaW5nLm5ld1ZhbHVlKTtcclxuICB9XHJcbiAgaWYgKGNoYW5nZXMuY29sb3JlZFRodW1icyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBoYW5kbGVDb2xvcmVkVGh1bWJzQ2hhbmdlRXZlbnQoY2hhbmdlcy5jb2xvcmVkVGh1bWJzLm5ld1ZhbHVlKTtcclxuICB9XHJcbiAgaWYgKGNoYW5nZXMuY29sb3JlZEJhciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBoYW5kbGVDb2xvcmVkQmFyQ2hhbmdlRXZlbnQoY2hhbmdlcy5jb2xvcmVkQmFyLm5ld1ZhbHVlKTtcclxuICB9XHJcbiAgaWYgKGNoYW5nZXMuY29sb3JUaGVtZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBoYW5kbGVDb2xvclRoZW1lQ2hhbmdlRXZlbnQoY2hhbmdlcy5jb2xvclRoZW1lLm5ld1ZhbHVlKTtcclxuICB9XHJcbiAgaWYgKGNoYW5nZXMubnVtYmVyRGlzcGxheUZvcm1hdCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBoYW5kbGVOdW1iZXJEaXNwbGF5Rm9ybWF0Q2hhbmdlRXZlbnQoY2hhbmdlcy5udW1iZXJEaXNwbGF5Rm9ybWF0Lm5ld1ZhbHVlKTtcclxuICB9XHJcbiAgaWYgKGNoYW5nZXMuc2hvd1Rvb2x0aXBQZXJjZW50YWdlICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGhhbmRsZVNob3dUb29sdGlwUGVyY2VudGFnZUNoYW5nZUV2ZW50KGNoYW5nZXMuc2hvd1Rvb2x0aXBQZXJjZW50YWdlLm5ld1ZhbHVlKTtcclxuICB9XHJcbiAgaWYgKGNoYW5nZXMubnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgaGFuZGxlTnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXNDaGFuZ2VFdmVudChjaGFuZ2VzLm51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzLm5ld1ZhbHVlKTtcclxuICB9XHJcbiAgaWYgKGNoYW5nZXMuaGlkZVByZW1pdW1UZWFzZXIgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgaGFuZGxlSGlkZVByZW1pdW1UZWFzZXJDaGFuZ2VFdmVudChjaGFuZ2VzLmhpZGVQcmVtaXVtVGVhc2VyLm5ld1ZhbHVlKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZURpc2FibGVWb3RlU3VibWlzc2lvbkNoYW5nZUV2ZW50KHZhbHVlKSB7XHJcbiAgY29uZmlnLmRpc2FibGVWb3RlU3VibWlzc2lvbiA9IHZhbHVlO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGlzYWJsZV92b3RlX3N1Ym1pc3Npb25cIikuY2hlY2tlZCA9IHZhbHVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVEaXNhYmxlTG9nZ2luZ0NoYW5nZUV2ZW50KHZhbHVlKSB7XHJcbiAgY29uZmlnLmRpc2FibGVMb2dnaW5nID0gdmFsdWU7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkaXNhYmxlX2xvZ2dpbmdcIikuY2hlY2tlZCA9IHZhbHVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVDb2xvcmVkVGh1bWJzQ2hhbmdlRXZlbnQodmFsdWUpIHtcclxuICBjb25maWcuY29sb3JlZFRodW1icyA9IHZhbHVlO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29sb3JlZF90aHVtYnNcIikuY2hlY2tlZCA9IHZhbHVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVDb2xvcmVkQmFyQ2hhbmdlRXZlbnQodmFsdWUpIHtcclxuICBjb25maWcuY29sb3JlZEJhciA9IHZhbHVlO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29sb3JlZF9iYXJcIikuY2hlY2tlZCA9IHZhbHVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYW5kbGVDb2xvclRoZW1lQ2hhbmdlRXZlbnQodmFsdWUpIHtcclxuICBpZiAoIXZhbHVlKSB7XHJcbiAgICB2YWx1ZSA9IFwiY2xhc3NpY1wiO1xyXG4gIH1cclxuICBjb25maWcuY29sb3JUaGVtZSA9IHZhbHVlO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29sb3JfdGhlbWVcIikucXVlcnlTZWxlY3Rvcignb3B0aW9uW3ZhbHVlPVwiJyArIHZhbHVlICsgJ1wiXScpLnNlbGVjdGVkID0gdHJ1ZTtcclxuICB1cGRhdGVDb2xvclRoZW1lUHJldmlld0NvbnRlbnQodmFsdWUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVDb2xvclRoZW1lUHJldmlld0NvbnRlbnQodGhlbWVOYW1lKSB7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb2xvcl90aGVtZV9leGFtcGxlX2xpa2VcIikuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gZ2V0Q29sb3JGcm9tVGhlbWUodGhlbWVOYW1lLCB0cnVlKTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbG9yX3RoZW1lX2V4YW1wbGVfZGlzbGlrZVwiKS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBnZXRDb2xvckZyb21UaGVtZSh0aGVtZU5hbWUsIGZhbHNlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlTnVtYmVyRGlzcGxheUZvcm1hdENoYW5nZUV2ZW50KHZhbHVlKSB7XHJcbiAgY29uZmlnLm51bWJlckRpc3BsYXlGb3JtYXQgPSB2YWx1ZTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm51bWJlcl9mb3JtYXRcIikucXVlcnlTZWxlY3Rvcignb3B0aW9uW3ZhbHVlPVwiJyArIHZhbHVlICsgJ1wiXScpLnNlbGVjdGVkID0gdHJ1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlU2hvd1Rvb2x0aXBQZXJjZW50YWdlQ2hhbmdlRXZlbnQodmFsdWUpIHtcclxuICBjb25maWcuc2hvd1Rvb2x0aXBQZXJjZW50YWdlID0gdmFsdWU7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG93X3Rvb2x0aXBfcGVyY2VudGFnZVwiKS5jaGVja2VkID0gdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZVRvb2x0aXBQZXJjZW50YWdlTW9kZUNoYW5nZUV2ZW50KHZhbHVlKSB7XHJcbiAgaWYgKCF2YWx1ZSkge1xyXG4gICAgdmFsdWUgPSBcImRhc2hfbGlrZVwiO1xyXG4gIH1cclxuICBjb25maWcudG9vbHRpcFBlcmNlbnRhZ2VNb2RlID0gdmFsdWU7XHJcblxyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9vbHRpcF9wZXJjZW50YWdlX21vZGVcIikucXVlcnlTZWxlY3Rvcignb3B0aW9uW3ZhbHVlPVwiJyArIHZhbHVlICsgJ1wiXScpLnNlbGVjdGVkID0gdHJ1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlTnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXNDaGFuZ2VFdmVudCh2YWx1ZSkge1xyXG4gIGNvbmZpZy5udW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlcyA9IHZhbHVlO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibnVtYmVyX3JlZm9ybWF0X2xpa2VzXCIpLmNoZWNrZWQgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlSGlkZVByZW1pdW1UZWFzZXJDaGFuZ2VFdmVudCh2YWx1ZSkge1xyXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSB2YWx1ZSA9PT0gdHJ1ZTtcclxuICBjb25maWcuaGlkZVByZW1pdW1UZWFzZXIgPSBub3JtYWxpemVkO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGlkZV9wcmVtaXVtX3RlYXNlclwiKS5jaGVja2VkID0gbm9ybWFsaXplZDtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TnVtYmVyRm9ybWF0dGVyKG9wdGlvblNlbGVjdCkge1xyXG4gIGxldCBmb3JtYXR0ZXJOb3RhdGlvbjtcclxuICBsZXQgZm9ybWF0dGVyQ29tcGFjdERpc3BsYXk7XHJcbiAgbGV0IHVzZXJMb2NhbGVzO1xyXG4gIHRyeSB7XHJcbiAgICB1c2VyTG9jYWxlcyA9IG5ldyBVUkwoXHJcbiAgICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcImhlYWQgPiBsaW5rW3JlbD0nc2VhcmNoJ11cIikpXHJcbiAgICAgICAgPy5maW5kKChuKSA9PiBuPy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpPy5pbmNsdWRlcyhcIj9sb2NhbGU9XCIpKVxyXG4gICAgICAgID8uZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSxcclxuICAgICk/LnNlYXJjaFBhcmFtcz8uZ2V0KFwibG9jYWxlXCIpO1xyXG4gIH0gY2F0Y2gge31cclxuXHJcbiAgc3dpdGNoIChvcHRpb25TZWxlY3QpIHtcclxuICAgIGNhc2UgXCJjb21wYWN0TG9uZ1wiOlxyXG4gICAgICBmb3JtYXR0ZXJOb3RhdGlvbiA9IFwiY29tcGFjdFwiO1xyXG4gICAgICBmb3JtYXR0ZXJDb21wYWN0RGlzcGxheSA9IFwibG9uZ1wiO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJzdGFuZGFyZFwiOlxyXG4gICAgICBmb3JtYXR0ZXJOb3RhdGlvbiA9IFwic3RhbmRhcmRcIjtcclxuICAgICAgZm9ybWF0dGVyQ29tcGFjdERpc3BsYXkgPSBcInNob3J0XCI7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImNvbXBhY3RTaG9ydFwiOlxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgZm9ybWF0dGVyTm90YXRpb24gPSBcImNvbXBhY3RcIjtcclxuICAgICAgZm9ybWF0dGVyQ29tcGFjdERpc3BsYXkgPSBcInNob3J0XCI7XHJcbiAgfVxyXG4gIGNvbnN0IGZvcm1hdHRlciA9IEludGwuTnVtYmVyRm9ybWF0KGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nIHx8IHVzZXJMb2NhbGVzIHx8IG5hdmlnYXRvci5sYW5ndWFnZSwge1xyXG4gICAgbm90YXRpb246IGZvcm1hdHRlck5vdGF0aW9uLFxyXG4gICAgY29tcGFjdERpc3BsYXk6IGZvcm1hdHRlckNvbXBhY3REaXNwbGF5LFxyXG4gIH0pO1xyXG4gIHJldHVybiBmb3JtYXR0ZXI7XHJcbn1cclxuXHJcbihhc3luYyBmdW5jdGlvbiBnZXRTdGF0dXMoKSB7XHJcbiAgbGV0IHN0YXR1cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhdHVzXCIpO1xyXG4gIGxldCBzZXJ2ZXJTdGF0dXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlcnZlci1zdGF0dXNcIik7XHJcbiAgbGV0IHJlc3AgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vcmV0dXJueW91dHViZWRpc2xpa2VhcGkuY29tL3ZvdGVzP3ZpZGVvSWQ9WWJKT1RkWkJYMWdcIik7XHJcbiAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlc3Auc3RhdHVzO1xyXG4gIGlmIChyZXN1bHQgPT09IDIwMCkge1xyXG4gICAgc3RhdHVzLmlubmVyVGV4dCA9IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJhcGlTdGF0dXNPbmxpbmVcIik7XHJcbiAgICBzdGF0dXMuc3R5bGUuY29sb3IgPSBcImdyZWVuXCI7XHJcbiAgICBzZXJ2ZXJTdGF0dXMuc3R5bGUuZmlsdGVyID1cclxuICAgICAgXCJpbnZlcnQoNTglKSBzZXBpYSg4MSUpIHNhdHVyYXRlKDI2MTglKSBodWUtcm90YXRlKDgxZGVnKSBicmlnaHRuZXNzKDExOSUpIGNvbnRyYXN0KDEyOSUpXCI7XHJcbiAgfSBlbHNlIHtcclxuICAgIHN0YXR1cy5pbm5lclRleHQgPSBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiYXBpU3RhdHVzT2ZmbGluZVwiKTtcclxuICAgIHN0YXR1cy5zdHlsZS5jb2xvciA9IFwicmVkXCI7XHJcbiAgICBzZXJ2ZXJTdGF0dXMuc3R5bGUuZmlsdGVyID1cclxuICAgICAgXCJpbnZlcnQoMTElKSBzZXBpYSgxMDAlKSBzYXR1cmF0ZSg2NDQ5JSkgaHVlLXJvdGF0ZSgzZGVnKSBicmlnaHRuZXNzKDExNiUpIGNvbnRyYXN0KDExNSUpXCI7XHJcbiAgfVxyXG59KSgpO1xyXG5cclxuZnVuY3Rpb24gZ2V0Q29sb3JGcm9tVGhlbWUoY29sb3JUaGVtZSwgdm90ZUlzTGlrZSkge1xyXG4gIGxldCBjb2xvclN0cmluZztcclxuICBzd2l0Y2ggKGNvbG9yVGhlbWUpIHtcclxuICAgIGNhc2UgXCJhY2Nlc3NpYmxlXCI6XHJcbiAgICAgIGlmICh2b3RlSXNMaWtlID09PSB0cnVlKSB7XHJcbiAgICAgICAgY29sb3JTdHJpbmcgPSBcImRvZGdlcmJsdWVcIjtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb2xvclN0cmluZyA9IFwiZ29sZFwiO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcIm5lb25cIjpcclxuICAgICAgaWYgKHZvdGVJc0xpa2UgPT09IHRydWUpIHtcclxuICAgICAgICBjb2xvclN0cmluZyA9IFwiYXF1YVwiO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbG9yU3RyaW5nID0gXCJtYWdlbnRhXCI7XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwiY2xhc3NpY1wiOlxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgaWYgKHZvdGVJc0xpa2UgPT09IHRydWUpIHtcclxuICAgICAgICBjb2xvclN0cmluZyA9IFwibGltZVwiO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbG9yU3RyaW5nID0gXCJyZWRcIjtcclxuICAgICAgfVxyXG4gIH1cclxuICByZXR1cm4gY29sb3JTdHJpbmc7XHJcbn1cclxuXHJcbi8qIHBvcHVwLXNjcmlwdC5qc1xyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9naW4nKVxyXG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBtZXNzYWdlOiAnZ2V0X2F1dGhfdG9rZW4nIH0pO1xyXG59KTtcclxuXHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvZ19vZmZcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IG1lc3NhZ2U6IFwibG9nX29mZlwiIH0pO1xyXG59KTtcclxuKi9cclxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==