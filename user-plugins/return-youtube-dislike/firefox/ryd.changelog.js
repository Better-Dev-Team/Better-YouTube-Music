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

function config_getApiEndpoint(endpoint) {
  return `${config.apiUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}

function getChangelogUrl() {
  return config.links?.changelog ?? extensionChangelogUrl;
}



;// ./Extensions/combined/src/buttons.js



function buttons_getButtons() {
  //---   If Watching Youtube Shorts:   ---//
  if (isShorts()) {
    let elements = isMobile()
      ? querySelectorAll(extConfig.selectors.buttons.shorts.mobile)
      : querySelectorAll(extConfig.selectors.buttons.shorts.desktop);

    for (let element of elements) {
      //YouTube Shorts can have multiple like/dislike buttons when scrolling through videos
      //However, only one of them should be visible (no matter how you zoom)
      if (isInViewport(element)) {
        return element;
      }
    }

    if (elements.length > 0) {
      return elements[0];
    }
  }
  //---   If Watching On Mobile:   ---//
  if (isMobile()) {
    return document.querySelector(extConfig.selectors.buttons.regular.mobile);
  }
  //---   If Menu Element Is Displayed:   ---//
  if (querySelector(extConfig.selectors.menuContainer)?.offsetParent === null) {
    return querySelector(extConfig.selectors.buttons.regular.desktopMenu);
    //---   If Menu Element Isn't Displayed:   ---//
  } else {
    return querySelector(extConfig.selectors.buttons.regular.desktopNoMenu);
  }
}

function buttons_getLikeButton() {
  return buttons_getButtons().children[0].tagName ===
    "YTD-SEGMENTED-LIKE-DISLIKE-BUTTON-RENDERER"
    ? querySelector(extConfig.selectors.buttons.likeButton.segmented) ??
        querySelector(
          extConfig.selectors.buttons.likeButton.segmentedGetButtons,
          buttons_getButtons(),
        )
    : querySelector(
        extConfig.selectors.buttons.likeButton.notSegmented,
        buttons_getButtons(),
      );
}

function buttons_getLikeTextContainer() {
  return querySelector(extConfig.selectors.likeTextContainer, buttons_getLikeButton());
}

function buttons_getDislikeButton() {
  if (
    buttons_getButtons().children[0].tagName ===
    "YTD-SEGMENTED-LIKE-DISLIKE-BUTTON-RENDERER"
  ) {
    return (
      querySelector(extConfig.selectors.buttons.dislikeButton.segmented) ??
      querySelector(
        extConfig.selectors.buttons.dislikeButton.segmentedGetButtons,
        buttons_getButtons(),
      )
    );
  }

  const notSegmentedMatch = querySelector(
    extConfig.selectors.buttons.dislikeButton.notSegmented,
    buttons_getButtons(),
  );

  if (notSegmentedMatch != null) {
    return notSegmentedMatch;
  }

  if (isShorts()) {
    return querySelector(["#dislike-button"], buttons_getButtons());
  }

  return null;
}

function createDislikeTextContainer() {
  const textNodeClone = (
    buttons_getLikeButton().querySelector(
      ".yt-spec-button-shape-next__button-text-content",
    ) ||
    buttons_getLikeButton().querySelector("button > div[class*='cbox']") ||
    (
      buttons_getLikeButton().querySelector('div > span[role="text"]') ||
      document.querySelector(
        'button > div.yt-spec-button-shape-next__button-text-content > span[role="text"]',
      )
    ).parentNode
  ).cloneNode(true);
  const insertPreChild = buttons_getDislikeButton().querySelector("button");
  insertPreChild.insertBefore(textNodeClone, null);
  buttons_getDislikeButton()
    .querySelector("button")
    .classList.remove("yt-spec-button-shape-next--icon-button");
  buttons_getDislikeButton()
    .querySelector("button")
    .classList.add("yt-spec-button-shape-next--icon-leading");
  if (textNodeClone.querySelector("span[role='text']") === null) {
    const span = document.createElement("span");
    span.setAttribute("role", "text");
    while (textNodeClone.firstChild) {
      textNodeClone.removeChild(textNodeClone.firstChild);
    }
    textNodeClone.appendChild(span);
  }
  textNodeClone.innerText = "";
  return textNodeClone;
}

function buttons_getDislikeTextContainer() {
  let result;
  for (const selector of extConfig.selectors.dislikeTextContainer) {
    result = buttons_getDislikeButton().querySelector(selector);
    if (result !== null) {
      break;
    }
  }
  if (result == null) {
    result = createDislikeTextContainer();
  }
  return result;
}

function checkForSignInButton() {
  if (
    document.querySelector(
      "a[href^='https://accounts.google.com/ServiceLogin']",
    )
  ) {
    return true;
  } else {
    return false;
  }
}



;// ./Extensions/combined/src/bar.js




function bar_createRateBar(likes, dislikes) {
  let rateBar = document.getElementById("ryd-bar-container");
  if (!isLikesDisabled()) {
    // sometimes rate bar is hidden
    if (rateBar && !isInViewport(rateBar)) {
      rateBar.remove();
      rateBar = null;
    }

    const widthPx =
      parseFloat(window.getComputedStyle(getLikeButton()).width) +
      parseFloat(window.getComputedStyle(getDislikeButton()).width) +
      (isRoundedDesign() ? 0 : 8);

    const widthPercent =
      likes + dislikes > 0 ? (likes / (likes + dislikes)) * 100 : 50;

    var likePercentage = parseFloat(widthPercent.toFixed(1));
    const dislikePercentage = (100 - likePercentage).toLocaleString();
    likePercentage = likePercentage.toLocaleString();

    if (extConfig.showTooltipPercentage) {
      var tooltipInnerHTML;
      switch (extConfig.tooltipPercentageMode) {
        case "dash_dislike":
          tooltipInnerHTML = `${likes.toLocaleString()}&nbsp;/&nbsp;${dislikes.toLocaleString()}&nbsp;&nbsp;-&nbsp;&nbsp;${dislikePercentage}%`;
          break;
        case "both":
          tooltipInnerHTML = `${likePercentage}%&nbsp;/&nbsp;${dislikePercentage}%`;
          break;
        case "only_like":
          tooltipInnerHTML = `${likePercentage}%`;
          break;
        case "only_dislike":
          tooltipInnerHTML = `${dislikePercentage}%`;
          break;
        default: // dash_like
          tooltipInnerHTML = `${likes.toLocaleString()}&nbsp;/&nbsp;${dislikes.toLocaleString()}&nbsp;&nbsp;-&nbsp;&nbsp;${likePercentage}%`;
      }
    } else {
      tooltipInnerHTML = `${likes.toLocaleString()}&nbsp;/&nbsp;${dislikes.toLocaleString()}`;
    }

    if (!isShorts()) {
      if (!rateBar && !isMobile()) {
        let colorLikeStyle = "";
        let colorDislikeStyle = "";
        if (extConfig.coloredBar) {
          colorLikeStyle = "; background-color: " + getColorFromTheme(true);
          colorDislikeStyle = "; background-color: " + getColorFromTheme(false);
        }
        let actions =
          isNewDesign() && getButtons().id === "top-level-buttons-computed"
            ? getButtons()
            : document.getElementById("menu-container");
        (
          actions ||
          document.querySelector("ytm-slim-video-action-bar-renderer")
        ).insertAdjacentHTML(
          "beforeend",
          `
              <div class="ryd-tooltip ryd-tooltip-${isNewDesign() ? "new" : "old"}-design" style="width: ${widthPx}px">
              <div class="ryd-tooltip-bar-container">
                <div
                    id="ryd-bar-container"
                    style="width: 100%; height: 2px;${colorDislikeStyle}"
                    >
                    <div
                      id="ryd-bar"
                      style="width: ${widthPercent}%; height: 100%${colorLikeStyle}"
                      ></div>
                </div>
              </div>
              <tp-yt-paper-tooltip position="top" id="ryd-dislike-tooltip" class="style-scope ytd-sentiment-bar-renderer" role="tooltip" tabindex="-1">
                <!--css-build:shady-->${tooltipInnerHTML}
              </tp-yt-paper-tooltip>
              </div>
      		`,
        );

        if (isNewDesign()) {
          // Add border between info and comments
          let descriptionAndActionsElement = document.getElementById("top-row");
          descriptionAndActionsElement.style.borderBottom =
            "1px solid var(--yt-spec-10-percent-layer)";
          descriptionAndActionsElement.style.paddingBottom = "10px";

          // Fix like/dislike ratio bar offset in new UI
          document.getElementById("actions-inner").style.width = "revert";
          if (isRoundedDesign()) {
            document.getElementById("actions").style.flexDirection =
              "row-reverse";
          }
        }
      } else {
        document.querySelector(`.ryd-tooltip`).style.width = widthPx + "px";
        document.getElementById("ryd-bar").style.width = widthPercent + "%";
        document.querySelector("#ryd-dislike-tooltip > #tooltip").innerHTML =
          tooltipInnerHTML;
        if (extConfig.coloredBar) {
          document.getElementById("ryd-bar-container").style.backgroundColor =
            getColorFromTheme(false);
          document.getElementById("ryd-bar").style.backgroundColor =
            getColorFromTheme(true);
        }
      }
    }
  } else {
    console.log("removing bar");
    if (rateBar) {
      rateBar.parentNode.removeChild(rateBar);
    }
  }
}



;// ./Extensions/combined/src/state.js




const LIKED_STATE = "LIKED_STATE";
const DISLIKED_STATE = "DISLIKED_STATE";
const NEUTRAL_STATE = "NEUTRAL_STATE";

let state_extConfig = {
  disableVoteSubmission: false,
  disableLogging: false,
  coloredThumbs: false,
  coloredBar: false,
  colorTheme: "classic",
  numberDisplayFormat: "compactShort",
  showTooltipPercentage: false,
  tooltipPercentageMode: "dash_like",
  numberDisplayReformatLikes: false,
  hidePremiumTeaser: false,
  selectors: {
    dislikeTextContainer: [],
    likeTextContainer: [],
    buttons: {
      shorts: {
        mobile: [],
        desktop: [],
      },
      regular: {
        mobile: [],
        desktopMenu: [],
        desktopNoMenu: [],
      },
      likeButton: {
        segmented: [],
        segmentedGetButtons: [],
        notSegmented: [],
      },
      dislikeButton: {
        segmented: [],
        segmentedGetButtons: [],
        notSegmented: [],
      },
    },
    menuContainer: [],
    roundedDesign: [],
  },
};

let storedData = {
  likes: 0,
  dislikes: 0,
  previousState: NEUTRAL_STATE,
};

function state_isMobile() {
  return location.hostname == "m.youtube.com";
}

function state_isShorts() {
  return location.pathname.startsWith("/shorts");
}

function state_isNewDesign() {
  return document.getElementById("comment-teaser") !== null;
}

function state_isRoundedDesign() {
  return querySelector(state_extConfig.selectors.roundedDesign) !== null;
}

let shortsObserver = null;

if (state_isShorts() && !shortsObserver) {
  console.log("Initializing shorts mutation observer");
  shortsObserver = createObserver(
    {
      attributes: true,
    },
    (mutationList) => {
      mutationList.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.target.nodeName === "TP-YT-PAPER-BUTTON" &&
          mutation.target.id === "button"
        ) {
          // console.log('Short thumb button status changed');
          if (mutation.target.getAttribute("aria-pressed") === "true") {
            mutation.target.style.color =
              mutation.target.parentElement.parentElement.id === "like-button"
                ? utils_getColorFromTheme(true)
                : utils_getColorFromTheme(false);
          } else {
            mutation.target.style.color = "unset";
          }
          return;
        }
        console.log("Unexpected mutation observer event: " + mutation.target + mutation.type);
      });
    },
  );
}

function state_isLikesDisabled() {
  // return true if the like button's text doesn't contain any number
  if (state_isMobile()) {
    return /^\D*$/.test(getButtons().children[0].querySelector(".button-renderer-text").innerText);
  }
  return /^\D*$/.test(getLikeTextContainer().innerText);
}

function isVideoLiked() {
  if (state_isMobile()) {
    return getLikeButton().querySelector("button").getAttribute("aria-label") === "true";
  }
  return (
    getLikeButton().classList.contains("style-default-active") ||
    getLikeButton().querySelector("button")?.getAttribute("aria-pressed") === "true"
  );
}

function isVideoDisliked() {
  if (state_isMobile()) {
    return getDislikeButton().querySelector("button").getAttribute("aria-label") === "true";
  }
  return (
    getDislikeButton().classList.contains("style-default-active") ||
    getDislikeButton().querySelector("button")?.getAttribute("aria-pressed") === "true"
  );
}

function getState(storedData) {
  if (isVideoLiked()) {
    return { current: LIKED_STATE, previous: storedData.previousState };
  }
  if (isVideoDisliked()) {
    return { current: DISLIKED_STATE, previous: storedData.previousState };
  }
  return { current: NEUTRAL_STATE, previous: storedData.previousState };
}

//---   Sets The Likes And Dislikes Values   ---//
function setLikes(likesCount) {
  console.log(`SET likes ${likesCount}`);
  getLikeTextContainer().innerText = likesCount;
}

function setDislikes(dislikesCount) {
  console.log(`SET dislikes ${dislikesCount}`);

  const _container = getDislikeTextContainer();
  _container?.removeAttribute("is-empty");

  let _dislikeText;
  if (!state_isLikesDisabled()) {
    if (state_isMobile()) {
      getButtons().children[1].querySelector(".button-renderer-text").innerText = dislikesCount;
      return;
    }
    _dislikeText = dislikesCount;
  } else {
    console.log("likes count disabled by creator");
    if (state_isMobile()) {
      getButtons().children[1].querySelector(".button-renderer-text").innerText = localize("TextLikesDisabled");
      return;
    }
    _dislikeText = localize("TextLikesDisabled");
  }

  if (_dislikeText != null && _container?.innerText !== _dislikeText) {
    _container.innerText = _dislikeText;
  }
}

function getLikeCountFromButton() {
  try {
    if (state_isShorts()) {
      //Youtube Shorts don't work with this query. It's not necessary; we can skip it and still see the results.
      //It should be possible to fix this function, but it's not critical to showing the dislike count.
      return false;
    }

    let likeButton =
      getLikeButton().querySelector("yt-formatted-string#text") ?? getLikeButton().querySelector("button");

    let likesStr = likeButton.getAttribute("aria-label").replace(/\D/g, "");
    return likesStr.length > 0 ? parseInt(likesStr) : false;
  } catch {
    return false;
  }
}

function processResponse(response, storedData) {
  const formattedDislike = numberFormat(response.dislikes);
  setDislikes(formattedDislike);
  if (state_extConfig.numberDisplayReformatLikes === true) {
    const nativeLikes = getLikeCountFromButton();
    if (nativeLikes !== false) {
      setLikes(numberFormat(nativeLikes));
    }
  }
  storedData.dislikes = parseInt(response.dislikes);
  storedData.likes = getLikeCountFromButton() || parseInt(response.likes);
  createRateBar(storedData.likes, storedData.dislikes);
  if (state_extConfig.coloredThumbs === true) {
    if (state_isShorts()) {
      // for shorts, leave deactivated buttons in default color
      let shortLikeButton = getLikeButton().querySelector("tp-yt-paper-button#button");
      let shortDislikeButton = getDislikeButton().querySelector("tp-yt-paper-button#button");
      if (shortLikeButton.getAttribute("aria-pressed") === "true") {
        shortLikeButton.style.color = getColorFromTheme(true);
      }
      if (shortDislikeButton.getAttribute("aria-pressed") === "true") {
        shortDislikeButton.style.color = getColorFromTheme(false);
      }
      shortsObserver.observe(shortLikeButton);
      shortsObserver.observe(shortDislikeButton);
    } else {
      getLikeButton().style.color = getColorFromTheme(true);
      getDislikeButton().style.color = getColorFromTheme(false);
    }
  }
  //Temporary disabling this - it breaks all places where getButtons()[1] is used
  // createStarRating(response.rating, isMobile());
}

// Tells the user if the API is down
function displayError(error) {
  getDislikeTextContainer().innerText = localize("textTempUnavailable");
}

async function setState(storedData) {
  if (typeof window !== "undefined") {
    window.__rydSetStateCalls = (window.__rydSetStateCalls || 0) + 1;
  }
  storedData.previousState = isVideoDisliked() ? DISLIKED_STATE : isVideoLiked() ? LIKED_STATE : NEUTRAL_STATE;
  let statsSet = false;
  console.log("Video is loaded. Adding buttons...");

  let videoId = getVideoId(window.location.href);
  let likeCount = getLikeCountFromButton() || null;

  let response = await fetch(getApiEndpoint(`/votes?videoId=${videoId}&likeCount=${likeCount || ""}`), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) displayError(response.error);
      return response;
    })
    .then((response) => response.json())
    .catch(displayError);
  console.log("response from api:");
  console.log(JSON.stringify(response));
  if (response !== undefined && !("traceId" in response) && !statsSet) {
    processResponse(response, storedData);
  }
}

async function setInitialState() {
  await setState(storedData);
}

async function initExtConfig() {
  initializeDisableVoteSubmission();
  initializeDisableLogging();
  initializeColoredThumbs();
  initializeColoredBar();
  initializeColorTheme();
  initializeNumberDisplayFormat();
  initializeTooltipPercentage();
  initializeTooltipPercentageMode();
  initializeNumberDisplayReformatLikes();
  initializeHidePremiumTeaser();
  await initializeSelectors();
}

async function initializeSelectors() {
  let result = await fetch(getApiEndpoint("/configs/selectors"), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error fetching selectors:", error);
    });
  state_extConfig.selectors = result ?? state_extConfig.selectors;
  console.log(result);
}

function initializeDisableVoteSubmission() {
  getBrowser().storage.sync.get(["disableVoteSubmission"], (res) => {
    if (res.disableVoteSubmission === undefined) {
      getBrowser().storage.sync.set({ disableVoteSubmission: false });
    } else {
      state_extConfig.disableVoteSubmission = res.disableVoteSubmission;
    }
  });
}

function initializeDisableLogging() {
  getBrowser().storage.sync.get(["disableLogging"], (res) => {
    if (res.disableLogging === undefined) {
      getBrowser().storage.sync.set({ disableLogging: true });
      state_extConfig.disableLogging = true;
    } else {
      state_extConfig.disableLogging = res.disableLogging;
    }
    // Initialize console methods based on logging config
    initializeLogging();
  });
}

function initializeColoredThumbs() {
  getBrowser().storage.sync.get(["coloredThumbs"], (res) => {
    if (res.coloredThumbs === undefined) {
      getBrowser().storage.sync.set({ coloredThumbs: false });
    } else {
      state_extConfig.coloredThumbs = res.coloredThumbs;
    }
  });
}

function initializeColoredBar() {
  getBrowser().storage.sync.get(["coloredBar"], (res) => {
    if (res.coloredBar === undefined) {
      getBrowser().storage.sync.set({ coloredBar: false });
    } else {
      state_extConfig.coloredBar = res.coloredBar;
    }
  });
}

function initializeColorTheme() {
  getBrowser().storage.sync.get(["colorTheme"], (res) => {
    if (res.colorTheme === undefined) {
      getBrowser().storage.sync.set({ colorTheme: false });
    } else {
      state_extConfig.colorTheme = res.colorTheme;
    }
  });
}

function initializeNumberDisplayFormat() {
  getBrowser().storage.sync.get(["numberDisplayFormat"], (res) => {
    if (res.numberDisplayFormat === undefined) {
      getBrowser().storage.sync.set({ numberDisplayFormat: "compactShort" });
    } else {
      state_extConfig.numberDisplayFormat = res.numberDisplayFormat;
    }
  });
}

function initializeTooltipPercentage() {
  getBrowser().storage.sync.get(["showTooltipPercentage"], (res) => {
    if (res.showTooltipPercentage === undefined) {
      getBrowser().storage.sync.set({ showTooltipPercentage: false });
    } else {
      state_extConfig.showTooltipPercentage = res.showTooltipPercentage;
    }
  });
}

function initializeTooltipPercentageMode() {
  getBrowser().storage.sync.get(["tooltipPercentageMode"], (res) => {
    if (res.tooltipPercentageMode === undefined) {
      getBrowser().storage.sync.set({ tooltipPercentageMode: "dash_like" });
    } else {
      state_extConfig.tooltipPercentageMode = res.tooltipPercentageMode;
    }
  });
}

function initializeNumberDisplayReformatLikes() {
  getBrowser().storage.sync.get(["numberDisplayReformatLikes"], (res) => {
    if (res.numberDisplayReformatLikes === undefined) {
      getBrowser().storage.sync.set({ numberDisplayReformatLikes: false });
    } else {
      state_extConfig.numberDisplayReformatLikes = res.numberDisplayReformatLikes;
    }
  });
}

function initializeHidePremiumTeaser() {
  getBrowser().storage.sync.get(["hidePremiumTeaser"], (res) => {
    if (res.hidePremiumTeaser === undefined) {
      getBrowser().storage.sync.set({ hidePremiumTeaser: false });
      state_extConfig.hidePremiumTeaser = false;
    } else {
      state_extConfig.hidePremiumTeaser = res.hidePremiumTeaser === true;
    }
  });
}



;// ./Extensions/combined/src/utils.js


function utils_numberFormat(numberState) {
  return getNumberFormatter(extConfig.numberDisplayFormat).format(numberState);
}

function getNumberFormatter(optionSelect) {
  let userLocales;
  if (document.documentElement.lang) {
    userLocales = document.documentElement.lang;
  } else if (navigator.language) {
    userLocales = navigator.language;
  } else {
    try {
      userLocales = new URL(
        Array.from(document.querySelectorAll("head > link[rel='search']"))
          ?.find((n) => n?.getAttribute("href")?.includes("?locale="))
          ?.getAttribute("href"),
      )?.searchParams?.get("locale");
    } catch {
      console.log("Cannot find browser locale. Use en as default for number formatting.");
      userLocales = "en";
    }
  }

  let formatterNotation;
  let formatterCompactDisplay;
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

  return Intl.NumberFormat(userLocales, {
    notation: formatterNotation,
    compactDisplay: formatterCompactDisplay,
  });
}

function utils_localize(localeString, substitutions) {
  try {
    if (typeof chrome !== "undefined" && chrome?.i18n?.getMessage) {
      const args = substitutions === undefined ? [localeString] : [localeString, substitutions];
      const message = chrome.i18n.getMessage(...args);
      if (message) {
        return message;
      }
    }
  } catch (error) {
    console.warn("Localization lookup failed for", localeString, error);
  }

  if (Array.isArray(substitutions)) {
    return substitutions.join(" ");
  }

  if (substitutions != null) {
    return `${substitutions}`;
  }

  return localeString;
}

function utils_getBrowser() {
  if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined") {
    return chrome;
  } else if (typeof browser !== "undefined" && typeof browser.runtime !== "undefined") {
    return browser;
  } else {
    console.log("browser is not supported");
    return false;
  }
}

function utils_getVideoId(url) {
  const urlObject = new URL(url);
  const pathname = urlObject.pathname;
  if (pathname.startsWith("/clip")) {
    return (document.querySelector("meta[itemprop='videoId']") || document.querySelector("meta[itemprop='identifier']"))
      .content;
  } else {
    if (pathname.startsWith("/shorts")) {
      return pathname.slice(8);
    }
    return urlObject.searchParams.get("v");
  }
}

function utils_isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const height = innerHeight || document.documentElement.clientHeight;
  const width = innerWidth || document.documentElement.clientWidth;
  return (
    // When short (channel) is ignored, the element (like/dislike AND short itself) is
    // hidden with a 0 DOMRect. In this case, consider it outside of Viewport
    !(rect.top == 0 && rect.left == 0 && rect.bottom == 0 && rect.right == 0) &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= height &&
    rect.right <= width
  );
}

function isShortsLoaded(videoId) {
  if (!videoId) return false;

  // Find all reel containers
  const reelContainers = document.querySelectorAll(".reel-video-in-sequence-new");

  for (const container of reelContainers) {
    // Check if this container's thumbnail matches our video ID
    const thumbnail = container.querySelector(".reel-video-in-sequence-thumbnail");
    if (thumbnail) {
      const bgImage = thumbnail.style.backgroundImage;
      // YouTube thumbnail URLs contain the video ID in the format: /vi/VIDEO_ID/
      if ((bgImage && bgImage.includes(`/${videoId}/`)) || (!bgImage && utils_isInViewport(container))) {
        // Check if this container has the renderer with visible experiment-overlay
        const renderer = container.querySelector("ytd-reel-video-renderer");
        if (renderer) {
          const experimentOverlay = renderer.querySelector("#experiment-overlay");
          if (
            experimentOverlay &&
            !experimentOverlay.hidden &&
            window.getComputedStyle(experimentOverlay).display !== "none" &&
            experimentOverlay.hasChildNodes()
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function isVideoLoaded() {
  const videoId = utils_getVideoId(window.location.href);

  // Check if this is a Shorts URL
  if (isShorts()) {
    return isShortsLoaded(videoId);
  }

  // Regular video checks
  return (
    // desktop: spring 2024 UI
    document.querySelector(`ytd-watch-grid[video-id='${videoId}']`) !== null ||
    // desktop: older UI
    document.querySelector(`ytd-watch-flexy[video-id='${videoId}']`) !== null ||
    // mobile: no video-id attribute
    document.querySelector('#player[loading="false"]:not([hidden])') !== null
  );
}

const originalConsole = {
  log: console.log.bind(console),
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function utils_initializeLogging() {
  if (extConfig.disableLogging) {
    console.log = () => {};
    console.debug = () => {};
  } else {
    console.log = originalConsole.log;
    console.debug = originalConsole.debug;
  }
}

function utils_getColorFromTheme(voteIsLike) {
  let colorString;
  switch (state_extConfig.colorTheme) {
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

function utils_querySelector(selectors, element) {
  let result;
  for (const selector of selectors) {
    result = (element ?? document).querySelector(selector);
    if (result !== null) {
      return result;
    }
  }
}

function utils_querySelectorAll(selectors) {
  let result;
  for (const selector of selectors) {
    result = document.querySelectorAll(selector);
    if (result.length !== 0) {
      return result;
    }
  }
  return result;
}

function createObserver(options, callback) {
  const observerWrapper = new Object();
  observerWrapper.options = options;
  observerWrapper.observer = new MutationObserver(callback);
  observerWrapper.observe = function (element) {
    this.observer.observe(element, this.options);
  };
  observerWrapper.disconnect = function () {
    this.observer.disconnect();
  };
  return observerWrapper;
}



;// ./Extensions/combined/src/changelog/index.js



const PATREON_JOIN_URL = "https://www.patreon.com/join/returnyoutubedislike/checkout?rid=8008649";
const SUPPORT_DOC_URL = config.links?.help ?? "https://returnyoutubedislike.com/help";
const COMMUNITY_URL = config.links?.discord ?? "https://discord.gg/mYnESY4Md5";

function initChangelogPage() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
}

function setup() {
  applyLocaleMetadata();
  localizeHtmlPage();
  decorateScreenshotPlaceholders();
  bindActions();
}

function applyLocaleMetadata() {
  try {
    const browserLocale = chrome?.i18n?.getMessage?.("@@ui_locale");
    if (browserLocale) {
      document.documentElement.lang = browserLocale;
    }
  } catch (error) {
    console.debug("Unable to resolve UI locale", error);
  }
}

function localizeHtmlPage() {
  const elements = document.getElementsByTagName("html");
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    const original = element.innerHTML.toString();
    const localized = original.replace(/__MSG_(\w+)__/g, (match, key) => {
      return key ? utils_localize(key) : "";
    });

    if (localized !== original) {
      element.innerHTML = localized;
    }
  }
}

function decorateScreenshotPlaceholders() {
  document.querySelectorAll("[data-screenshot]").forEach((wrapper) => {
    const type = wrapper.getAttribute("data-screenshot");
    const labelKey = getPlaceholderLabelKey(type);
    if (!labelKey) return;

    const placeholder = wrapper.querySelector(".ryd-feature-card__placeholder");
    if (!placeholder) return;

    const label = utils_localize(labelKey);
    placeholder.setAttribute("role", "img");
    placeholder.setAttribute("aria-label", label);
    placeholder.title = label;
  });
}

function getPlaceholderLabelKey(type) {
  switch (type) {
    case "timeline":
      return "changelog_screenshot_label_timeline";
    case "map":
      return "changelog_screenshot_label_map";
    case "teaser":
      return "changelog_screenshot_label_teaser";
    default:
      return null;
  }
}

function bindActions() {
  const browser = utils_getBrowser();

  const upgradeButton = document.getElementById("ryd-changelog-upgrade");
  if (upgradeButton) {
    upgradeButton.addEventListener("click", (event) => {
      event.preventDefault();
      openExternal(PATREON_JOIN_URL, browser);
    });
  }

  const supportButton = document.getElementById("ryd-changelog-support");
  if (supportButton) {
    supportButton.addEventListener("click", (event) => {
      event.preventDefault();
      openExternal(SUPPORT_DOC_URL, browser);
    });
  }

  const contactButton = document.getElementById("ryd-changelog-contact");
  if (contactButton) {
    contactButton.addEventListener("click", (event) => {
      event.preventDefault();
      openExternal(COMMUNITY_URL, browser);
    });
  }
}

function openExternal(url, browser) {
  if (!url) return;

  try {
    if (browser && browser.tabs && typeof browser.tabs.create === "function") {
      browser.tabs.create({ url });
      return;
    }
  } catch (error) {
    console.debug("tabs.create unavailable, falling back", error);
  }

  try {
    window.open(url, "_blank", "noopener");
  } catch (error) {
    console.warn("Failed to open external url", url, error);
  }
}

;// ./Extensions/combined/ryd.changelog.js


initChangelogPage();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixLQUFLO0FBQ2pDO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7OztBQzFIb0Q7QUFDcEQ7QUFDQSxpQkFBaUIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9yZXR1cm4teW91dHViZS1kaXNsaWtlLy4vRXh0ZW5zaW9ucy9jb21iaW5lZC9zcmMvY29uZmlnLmpzIiwid2VicGFjazovL3JldHVybi15b3V0dWJlLWRpc2xpa2UvLi9FeHRlbnNpb25zL2NvbWJpbmVkL3NyYy9idXR0b25zLmpzIiwid2VicGFjazovL3JldHVybi15b3V0dWJlLWRpc2xpa2UvLi9FeHRlbnNpb25zL2NvbWJpbmVkL3NyYy9iYXIuanMiLCJ3ZWJwYWNrOi8vcmV0dXJuLXlvdXR1YmUtZGlzbGlrZS8uL0V4dGVuc2lvbnMvY29tYmluZWQvc3JjL3N0YXRlLmpzIiwid2VicGFjazovL3JldHVybi15b3V0dWJlLWRpc2xpa2UvLi9FeHRlbnNpb25zL2NvbWJpbmVkL3NyYy91dGlscy5qcyIsIndlYnBhY2s6Ly9yZXR1cm4teW91dHViZS1kaXNsaWtlLy4vRXh0ZW5zaW9ucy9jb21iaW5lZC9zcmMvY2hhbmdlbG9nL2luZGV4LmpzIiwid2VicGFjazovL3JldHVybi15b3V0dWJlLWRpc2xpa2UvLi9FeHRlbnNpb25zL2NvbWJpbmVkL3J5ZC5jaGFuZ2Vsb2cuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgREVWX0FQSV9VUkwgPSBcImh0dHBzOi8vbG9jYWxob3N0OjcyNThcIjtcclxuY29uc3QgUFJPRF9BUElfVVJMID0gXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlYXBpLmNvbVwiO1xyXG5cclxuY29uc3QgcnVudGltZSA9IHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgPyBjaHJvbWUucnVudGltZSA6IG51bGw7XHJcbmNvbnN0IG1hbmlmZXN0ID0gdHlwZW9mIHJ1bnRpbWU/LmdldE1hbmlmZXN0ID09PSBcImZ1bmN0aW9uXCIgPyBydW50aW1lLmdldE1hbmlmZXN0KCkgOiBudWxsO1xyXG5jb25zdCBpc0RldmVsb3BtZW50ID0gZmFsc2U7XHJcblxyXG5jb25zdCBleHRlbnNpb25DaGFuZ2Vsb2dVcmwgPVxyXG4gIHJ1bnRpbWUgJiYgdHlwZW9mIHJ1bnRpbWUuZ2V0VVJMID09PSBcImZ1bmN0aW9uXCJcclxuICAgID8gcnVudGltZS5nZXRVUkwoXCJjaGFuZ2Vsb2cvNC9jaGFuZ2Vsb2dfNC4wLmh0bWxcIilcclxuICAgIDogXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbS9jaGFuZ2Vsb2cvNC9jaGFuZ2Vsb2dfNC4wLmh0bWxcIjtcclxuXHJcbmNvbnN0IGNvbmZpZyA9IHtcclxuICBhcGlVcmw6IGlzRGV2ZWxvcG1lbnQgPyBERVZfQVBJX1VSTCA6IFBST0RfQVBJX1VSTCxcclxuXHJcbiAgdm90ZURpc2FibGVkSWNvbk5hbWU6IFwiaWNvbl9ob2xkMTI4LnBuZ1wiLFxyXG4gIGRlZmF1bHRJY29uTmFtZTogXCJpY29uMTI4LnBuZ1wiLFxyXG5cclxuICBsaW5rczoge1xyXG4gICAgd2Vic2l0ZTogXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbVwiLFxyXG4gICAgZ2l0aHViOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9BbmFyaW9zL3JldHVybi15b3V0dWJlLWRpc2xpa2VcIixcclxuICAgIGRpc2NvcmQ6IFwiaHR0cHM6Ly9kaXNjb3JkLmdnL21ZbkVTWTRNZDVcIixcclxuICAgIGRvbmF0ZTogXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbS9kb25hdGVcIixcclxuICAgIGZhcTogXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbS9mYXFcIixcclxuICAgIGhlbHA6IFwiaHR0cHM6Ly9yZXR1cm55b3V0dWJlZGlzbGlrZS5jb20vaGVscFwiLFxyXG4gICAgY2hhbmdlbG9nOiBleHRlbnNpb25DaGFuZ2Vsb2dVcmwsXHJcbiAgfSxcclxuXHJcbiAgZGVmYXVsdEV4dENvbmZpZzoge1xyXG4gICAgZGlzYWJsZVZvdGVTdWJtaXNzaW9uOiBmYWxzZSxcclxuICAgIGRpc2FibGVMb2dnaW5nOiB0cnVlLFxyXG4gICAgY29sb3JlZFRodW1iczogZmFsc2UsXHJcbiAgICBjb2xvcmVkQmFyOiBmYWxzZSxcclxuICAgIGNvbG9yVGhlbWU6IFwiY2xhc3NpY1wiLFxyXG4gICAgbnVtYmVyRGlzcGxheUZvcm1hdDogXCJjb21wYWN0U2hvcnRcIixcclxuICAgIG51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzOiBmYWxzZSxcclxuICAgIGhpZGVQcmVtaXVtVGVhc2VyOiBmYWxzZSxcclxuICB9LFxyXG59O1xyXG5cclxuZnVuY3Rpb24gZ2V0QXBpVXJsKCkge1xyXG4gIHJldHVybiBjb25maWcuYXBpVXJsO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBcGlFbmRwb2ludChlbmRwb2ludCkge1xyXG4gIHJldHVybiBgJHtjb25maWcuYXBpVXJsfSR7ZW5kcG9pbnQuc3RhcnRzV2l0aChcIi9cIikgPyBcIlwiIDogXCIvXCJ9JHtlbmRwb2ludH1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRDaGFuZ2Vsb2dVcmwoKSB7XHJcbiAgcmV0dXJuIGNvbmZpZy5saW5rcz8uY2hhbmdlbG9nID8/IGV4dGVuc2lvbkNoYW5nZWxvZ1VybDtcclxufVxyXG5cclxuZXhwb3J0IHsgY29uZmlnLCBnZXRBcGlVcmwsIGdldEFwaUVuZHBvaW50LCBnZXRDaGFuZ2Vsb2dVcmwgfTtcclxuIiwiaW1wb3J0IHsgaXNNb2JpbGUsIGlzU2hvcnRzLCBleHRDb25maWcgfSBmcm9tIFwiLi9zdGF0ZVwiO1xyXG5pbXBvcnQgeyBpc0luVmlld3BvcnQsIHF1ZXJ5U2VsZWN0b3IsIHF1ZXJ5U2VsZWN0b3JBbGwgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuZnVuY3Rpb24gZ2V0QnV0dG9ucygpIHtcclxuICAvLy0tLSAgIElmIFdhdGNoaW5nIFlvdXR1YmUgU2hvcnRzOiAgIC0tLS8vXHJcbiAgaWYgKGlzU2hvcnRzKCkpIHtcclxuICAgIGxldCBlbGVtZW50cyA9IGlzTW9iaWxlKClcclxuICAgICAgPyBxdWVyeVNlbGVjdG9yQWxsKGV4dENvbmZpZy5zZWxlY3RvcnMuYnV0dG9ucy5zaG9ydHMubW9iaWxlKVxyXG4gICAgICA6IHF1ZXJ5U2VsZWN0b3JBbGwoZXh0Q29uZmlnLnNlbGVjdG9ycy5idXR0b25zLnNob3J0cy5kZXNrdG9wKTtcclxuXHJcbiAgICBmb3IgKGxldCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XHJcbiAgICAgIC8vWW91VHViZSBTaG9ydHMgY2FuIGhhdmUgbXVsdGlwbGUgbGlrZS9kaXNsaWtlIGJ1dHRvbnMgd2hlbiBzY3JvbGxpbmcgdGhyb3VnaCB2aWRlb3NcclxuICAgICAgLy9Ib3dldmVyLCBvbmx5IG9uZSBvZiB0aGVtIHNob3VsZCBiZSB2aXNpYmxlIChubyBtYXR0ZXIgaG93IHlvdSB6b29tKVxyXG4gICAgICBpZiAoaXNJblZpZXdwb3J0KGVsZW1lbnQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICByZXR1cm4gZWxlbWVudHNbMF07XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8vLS0tICAgSWYgV2F0Y2hpbmcgT24gTW9iaWxlOiAgIC0tLS8vXHJcbiAgaWYgKGlzTW9iaWxlKCkpIHtcclxuICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGV4dENvbmZpZy5zZWxlY3RvcnMuYnV0dG9ucy5yZWd1bGFyLm1vYmlsZSk7XHJcbiAgfVxyXG4gIC8vLS0tICAgSWYgTWVudSBFbGVtZW50IElzIERpc3BsYXllZDogICAtLS0vL1xyXG4gIGlmIChxdWVyeVNlbGVjdG9yKGV4dENvbmZpZy5zZWxlY3RvcnMubWVudUNvbnRhaW5lcik/Lm9mZnNldFBhcmVudCA9PT0gbnVsbCkge1xyXG4gICAgcmV0dXJuIHF1ZXJ5U2VsZWN0b3IoZXh0Q29uZmlnLnNlbGVjdG9ycy5idXR0b25zLnJlZ3VsYXIuZGVza3RvcE1lbnUpO1xyXG4gICAgLy8tLS0gICBJZiBNZW51IEVsZW1lbnQgSXNuJ3QgRGlzcGxheWVkOiAgIC0tLS8vXHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBxdWVyeVNlbGVjdG9yKGV4dENvbmZpZy5zZWxlY3RvcnMuYnV0dG9ucy5yZWd1bGFyLmRlc2t0b3BOb01lbnUpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TGlrZUJ1dHRvbigpIHtcclxuICByZXR1cm4gZ2V0QnV0dG9ucygpLmNoaWxkcmVuWzBdLnRhZ05hbWUgPT09XHJcbiAgICBcIllURC1TRUdNRU5URUQtTElLRS1ESVNMSUtFLUJVVFRPTi1SRU5ERVJFUlwiXHJcbiAgICA/IHF1ZXJ5U2VsZWN0b3IoZXh0Q29uZmlnLnNlbGVjdG9ycy5idXR0b25zLmxpa2VCdXR0b24uc2VnbWVudGVkKSA/P1xyXG4gICAgICAgIHF1ZXJ5U2VsZWN0b3IoXHJcbiAgICAgICAgICBleHRDb25maWcuc2VsZWN0b3JzLmJ1dHRvbnMubGlrZUJ1dHRvbi5zZWdtZW50ZWRHZXRCdXR0b25zLFxyXG4gICAgICAgICAgZ2V0QnV0dG9ucygpLFxyXG4gICAgICAgIClcclxuICAgIDogcXVlcnlTZWxlY3RvcihcclxuICAgICAgICBleHRDb25maWcuc2VsZWN0b3JzLmJ1dHRvbnMubGlrZUJ1dHRvbi5ub3RTZWdtZW50ZWQsXHJcbiAgICAgICAgZ2V0QnV0dG9ucygpLFxyXG4gICAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMaWtlVGV4dENvbnRhaW5lcigpIHtcclxuICByZXR1cm4gcXVlcnlTZWxlY3RvcihleHRDb25maWcuc2VsZWN0b3JzLmxpa2VUZXh0Q29udGFpbmVyLCBnZXRMaWtlQnV0dG9uKCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREaXNsaWtlQnV0dG9uKCkge1xyXG4gIGlmIChcclxuICAgIGdldEJ1dHRvbnMoKS5jaGlsZHJlblswXS50YWdOYW1lID09PVxyXG4gICAgXCJZVEQtU0VHTUVOVEVELUxJS0UtRElTTElLRS1CVVRUT04tUkVOREVSRVJcIlxyXG4gICkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgcXVlcnlTZWxlY3RvcihleHRDb25maWcuc2VsZWN0b3JzLmJ1dHRvbnMuZGlzbGlrZUJ1dHRvbi5zZWdtZW50ZWQpID8/XHJcbiAgICAgIHF1ZXJ5U2VsZWN0b3IoXHJcbiAgICAgICAgZXh0Q29uZmlnLnNlbGVjdG9ycy5idXR0b25zLmRpc2xpa2VCdXR0b24uc2VnbWVudGVkR2V0QnV0dG9ucyxcclxuICAgICAgICBnZXRCdXR0b25zKCksXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBub3RTZWdtZW50ZWRNYXRjaCA9IHF1ZXJ5U2VsZWN0b3IoXHJcbiAgICBleHRDb25maWcuc2VsZWN0b3JzLmJ1dHRvbnMuZGlzbGlrZUJ1dHRvbi5ub3RTZWdtZW50ZWQsXHJcbiAgICBnZXRCdXR0b25zKCksXHJcbiAgKTtcclxuXHJcbiAgaWYgKG5vdFNlZ21lbnRlZE1hdGNoICE9IG51bGwpIHtcclxuICAgIHJldHVybiBub3RTZWdtZW50ZWRNYXRjaDtcclxuICB9XHJcblxyXG4gIGlmIChpc1Nob3J0cygpKSB7XHJcbiAgICByZXR1cm4gcXVlcnlTZWxlY3RvcihbXCIjZGlzbGlrZS1idXR0b25cIl0sIGdldEJ1dHRvbnMoKSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlRGlzbGlrZVRleHRDb250YWluZXIoKSB7XHJcbiAgY29uc3QgdGV4dE5vZGVDbG9uZSA9IChcclxuICAgIGdldExpa2VCdXR0b24oKS5xdWVyeVNlbGVjdG9yKFxyXG4gICAgICBcIi55dC1zcGVjLWJ1dHRvbi1zaGFwZS1uZXh0X19idXR0b24tdGV4dC1jb250ZW50XCIsXHJcbiAgICApIHx8XHJcbiAgICBnZXRMaWtlQnV0dG9uKCkucXVlcnlTZWxlY3RvcihcImJ1dHRvbiA+IGRpdltjbGFzcyo9J2Nib3gnXVwiKSB8fFxyXG4gICAgKFxyXG4gICAgICBnZXRMaWtlQnV0dG9uKCkucXVlcnlTZWxlY3RvcignZGl2ID4gc3Bhbltyb2xlPVwidGV4dFwiXScpIHx8XHJcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICAgICAgJ2J1dHRvbiA+IGRpdi55dC1zcGVjLWJ1dHRvbi1zaGFwZS1uZXh0X19idXR0b24tdGV4dC1jb250ZW50ID4gc3Bhbltyb2xlPVwidGV4dFwiXScsXHJcbiAgICAgIClcclxuICAgICkucGFyZW50Tm9kZVxyXG4gICkuY2xvbmVOb2RlKHRydWUpO1xyXG4gIGNvbnN0IGluc2VydFByZUNoaWxkID0gZ2V0RGlzbGlrZUJ1dHRvbigpLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25cIik7XHJcbiAgaW5zZXJ0UHJlQ2hpbGQuaW5zZXJ0QmVmb3JlKHRleHROb2RlQ2xvbmUsIG51bGwpO1xyXG4gIGdldERpc2xpa2VCdXR0b24oKVxyXG4gICAgLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25cIilcclxuICAgIC5jbGFzc0xpc3QucmVtb3ZlKFwieXQtc3BlYy1idXR0b24tc2hhcGUtbmV4dC0taWNvbi1idXR0b25cIik7XHJcbiAgZ2V0RGlzbGlrZUJ1dHRvbigpXHJcbiAgICAucXVlcnlTZWxlY3RvcihcImJ1dHRvblwiKVxyXG4gICAgLmNsYXNzTGlzdC5hZGQoXCJ5dC1zcGVjLWJ1dHRvbi1zaGFwZS1uZXh0LS1pY29uLWxlYWRpbmdcIik7XHJcbiAgaWYgKHRleHROb2RlQ2xvbmUucXVlcnlTZWxlY3RvcihcInNwYW5bcm9sZT0ndGV4dCddXCIpID09PSBudWxsKSB7XHJcbiAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICBzcGFuLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJ0ZXh0XCIpO1xyXG4gICAgd2hpbGUgKHRleHROb2RlQ2xvbmUuZmlyc3RDaGlsZCkge1xyXG4gICAgICB0ZXh0Tm9kZUNsb25lLnJlbW92ZUNoaWxkKHRleHROb2RlQ2xvbmUuZmlyc3RDaGlsZCk7XHJcbiAgICB9XHJcbiAgICB0ZXh0Tm9kZUNsb25lLmFwcGVuZENoaWxkKHNwYW4pO1xyXG4gIH1cclxuICB0ZXh0Tm9kZUNsb25lLmlubmVyVGV4dCA9IFwiXCI7XHJcbiAgcmV0dXJuIHRleHROb2RlQ2xvbmU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldERpc2xpa2VUZXh0Q29udGFpbmVyKCkge1xyXG4gIGxldCByZXN1bHQ7XHJcbiAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBleHRDb25maWcuc2VsZWN0b3JzLmRpc2xpa2VUZXh0Q29udGFpbmVyKSB7XHJcbiAgICByZXN1bHQgPSBnZXREaXNsaWtlQnV0dG9uKCkucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuICBpZiAocmVzdWx0ID09IG51bGwpIHtcclxuICAgIHJlc3VsdCA9IGNyZWF0ZURpc2xpa2VUZXh0Q29udGFpbmVyKCk7XHJcbiAgfVxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrRm9yU2lnbkluQnV0dG9uKCkge1xyXG4gIGlmIChcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICAgIFwiYVtocmVmXj0naHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL1NlcnZpY2VMb2dpbiddXCIsXHJcbiAgICApXHJcbiAgKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IHtcclxuICBnZXRCdXR0b25zLFxyXG4gIGdldExpa2VCdXR0b24sXHJcbiAgZ2V0RGlzbGlrZUJ1dHRvbixcclxuICBnZXRMaWtlVGV4dENvbnRhaW5lcixcclxuICBnZXREaXNsaWtlVGV4dENvbnRhaW5lcixcclxuICBjaGVja0ZvclNpZ25JbkJ1dHRvbixcclxufTtcclxuIiwiaW1wb3J0IHsgZ2V0QnV0dG9ucywgZ2V0RGlzbGlrZUJ1dHRvbiwgZ2V0TGlrZUJ1dHRvbiB9IGZyb20gXCIuL2J1dHRvbnNcIjtcclxuaW1wb3J0IHtcclxuICBleHRDb25maWcsXHJcbiAgaXNNb2JpbGUsXHJcbiAgaXNMaWtlc0Rpc2FibGVkLFxyXG4gIGlzTmV3RGVzaWduLFxyXG4gIGlzUm91bmRlZERlc2lnbixcclxuICBpc1Nob3J0cyxcclxufSBmcm9tIFwiLi9zdGF0ZVwiO1xyXG5pbXBvcnQgeyBnZXRDb2xvckZyb21UaGVtZSwgaXNJblZpZXdwb3J0IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVJhdGVCYXIobGlrZXMsIGRpc2xpa2VzKSB7XHJcbiAgbGV0IHJhdGVCYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJ5ZC1iYXItY29udGFpbmVyXCIpO1xyXG4gIGlmICghaXNMaWtlc0Rpc2FibGVkKCkpIHtcclxuICAgIC8vIHNvbWV0aW1lcyByYXRlIGJhciBpcyBoaWRkZW5cclxuICAgIGlmIChyYXRlQmFyICYmICFpc0luVmlld3BvcnQocmF0ZUJhcikpIHtcclxuICAgICAgcmF0ZUJhci5yZW1vdmUoKTtcclxuICAgICAgcmF0ZUJhciA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgd2lkdGhQeCA9XHJcbiAgICAgIHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZ2V0TGlrZUJ1dHRvbigpKS53aWR0aCkgK1xyXG4gICAgICBwYXJzZUZsb2F0KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGdldERpc2xpa2VCdXR0b24oKSkud2lkdGgpICtcclxuICAgICAgKGlzUm91bmRlZERlc2lnbigpID8gMCA6IDgpO1xyXG5cclxuICAgIGNvbnN0IHdpZHRoUGVyY2VudCA9XHJcbiAgICAgIGxpa2VzICsgZGlzbGlrZXMgPiAwID8gKGxpa2VzIC8gKGxpa2VzICsgZGlzbGlrZXMpKSAqIDEwMCA6IDUwO1xyXG5cclxuICAgIHZhciBsaWtlUGVyY2VudGFnZSA9IHBhcnNlRmxvYXQod2lkdGhQZXJjZW50LnRvRml4ZWQoMSkpO1xyXG4gICAgY29uc3QgZGlzbGlrZVBlcmNlbnRhZ2UgPSAoMTAwIC0gbGlrZVBlcmNlbnRhZ2UpLnRvTG9jYWxlU3RyaW5nKCk7XHJcbiAgICBsaWtlUGVyY2VudGFnZSA9IGxpa2VQZXJjZW50YWdlLnRvTG9jYWxlU3RyaW5nKCk7XHJcblxyXG4gICAgaWYgKGV4dENvbmZpZy5zaG93VG9vbHRpcFBlcmNlbnRhZ2UpIHtcclxuICAgICAgdmFyIHRvb2x0aXBJbm5lckhUTUw7XHJcbiAgICAgIHN3aXRjaCAoZXh0Q29uZmlnLnRvb2x0aXBQZXJjZW50YWdlTW9kZSkge1xyXG4gICAgICAgIGNhc2UgXCJkYXNoX2Rpc2xpa2VcIjpcclxuICAgICAgICAgIHRvb2x0aXBJbm5lckhUTUwgPSBgJHtsaWtlcy50b0xvY2FsZVN0cmluZygpfSZuYnNwOy8mbmJzcDske2Rpc2xpa2VzLnRvTG9jYWxlU3RyaW5nKCl9Jm5ic3A7Jm5ic3A7LSZuYnNwOyZuYnNwOyR7ZGlzbGlrZVBlcmNlbnRhZ2V9JWA7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiYm90aFwiOlxyXG4gICAgICAgICAgdG9vbHRpcElubmVySFRNTCA9IGAke2xpa2VQZXJjZW50YWdlfSUmbmJzcDsvJm5ic3A7JHtkaXNsaWtlUGVyY2VudGFnZX0lYDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJvbmx5X2xpa2VcIjpcclxuICAgICAgICAgIHRvb2x0aXBJbm5lckhUTUwgPSBgJHtsaWtlUGVyY2VudGFnZX0lYDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJvbmx5X2Rpc2xpa2VcIjpcclxuICAgICAgICAgIHRvb2x0aXBJbm5lckhUTUwgPSBgJHtkaXNsaWtlUGVyY2VudGFnZX0lYDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6IC8vIGRhc2hfbGlrZVxyXG4gICAgICAgICAgdG9vbHRpcElubmVySFRNTCA9IGAke2xpa2VzLnRvTG9jYWxlU3RyaW5nKCl9Jm5ic3A7LyZuYnNwOyR7ZGlzbGlrZXMudG9Mb2NhbGVTdHJpbmcoKX0mbmJzcDsmbmJzcDstJm5ic3A7Jm5ic3A7JHtsaWtlUGVyY2VudGFnZX0lYDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdG9vbHRpcElubmVySFRNTCA9IGAke2xpa2VzLnRvTG9jYWxlU3RyaW5nKCl9Jm5ic3A7LyZuYnNwOyR7ZGlzbGlrZXMudG9Mb2NhbGVTdHJpbmcoKX1gO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghaXNTaG9ydHMoKSkge1xyXG4gICAgICBpZiAoIXJhdGVCYXIgJiYgIWlzTW9iaWxlKCkpIHtcclxuICAgICAgICBsZXQgY29sb3JMaWtlU3R5bGUgPSBcIlwiO1xyXG4gICAgICAgIGxldCBjb2xvckRpc2xpa2VTdHlsZSA9IFwiXCI7XHJcbiAgICAgICAgaWYgKGV4dENvbmZpZy5jb2xvcmVkQmFyKSB7XHJcbiAgICAgICAgICBjb2xvckxpa2VTdHlsZSA9IFwiOyBiYWNrZ3JvdW5kLWNvbG9yOiBcIiArIGdldENvbG9yRnJvbVRoZW1lKHRydWUpO1xyXG4gICAgICAgICAgY29sb3JEaXNsaWtlU3R5bGUgPSBcIjsgYmFja2dyb3VuZC1jb2xvcjogXCIgKyBnZXRDb2xvckZyb21UaGVtZShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBhY3Rpb25zID1cclxuICAgICAgICAgIGlzTmV3RGVzaWduKCkgJiYgZ2V0QnV0dG9ucygpLmlkID09PSBcInRvcC1sZXZlbC1idXR0b25zLWNvbXB1dGVkXCJcclxuICAgICAgICAgICAgPyBnZXRCdXR0b25zKClcclxuICAgICAgICAgICAgOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1lbnUtY29udGFpbmVyXCIpO1xyXG4gICAgICAgIChcclxuICAgICAgICAgIGFjdGlvbnMgfHxcclxuICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJ5dG0tc2xpbS12aWRlby1hY3Rpb24tYmFyLXJlbmRlcmVyXCIpXHJcbiAgICAgICAgKS5pbnNlcnRBZGphY2VudEhUTUwoXHJcbiAgICAgICAgICBcImJlZm9yZWVuZFwiLFxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyeWQtdG9vbHRpcCByeWQtdG9vbHRpcC0ke2lzTmV3RGVzaWduKCkgPyBcIm5ld1wiIDogXCJvbGRcIn0tZGVzaWduXCIgc3R5bGU9XCJ3aWR0aDogJHt3aWR0aFB4fXB4XCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJ5ZC10b29sdGlwLWJhci1jb250YWluZXJcIj5cclxuICAgICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgICAgICBpZD1cInJ5ZC1iYXItY29udGFpbmVyXCJcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6IDJweDske2NvbG9yRGlzbGlrZVN0eWxlfVwiXHJcbiAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgICAgICAgIGlkPVwicnlkLWJhclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZT1cIndpZHRoOiAke3dpZHRoUGVyY2VudH0lOyBoZWlnaHQ6IDEwMCUke2NvbG9yTGlrZVN0eWxlfVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICA+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8dHAteXQtcGFwZXItdG9vbHRpcCBwb3NpdGlvbj1cInRvcFwiIGlkPVwicnlkLWRpc2xpa2UtdG9vbHRpcFwiIGNsYXNzPVwic3R5bGUtc2NvcGUgeXRkLXNlbnRpbWVudC1iYXItcmVuZGVyZXJcIiByb2xlPVwidG9vbHRpcFwiIHRhYmluZGV4PVwiLTFcIj5cclxuICAgICAgICAgICAgICAgIDwhLS1jc3MtYnVpbGQ6c2hhZHktLT4ke3Rvb2x0aXBJbm5lckhUTUx9XHJcbiAgICAgICAgICAgICAgPC90cC15dC1wYXBlci10b29sdGlwPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICBcdFx0YCxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoaXNOZXdEZXNpZ24oKSkge1xyXG4gICAgICAgICAgLy8gQWRkIGJvcmRlciBiZXR3ZWVuIGluZm8gYW5kIGNvbW1lbnRzXHJcbiAgICAgICAgICBsZXQgZGVzY3JpcHRpb25BbmRBY3Rpb25zRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9wLXJvd1wiKTtcclxuICAgICAgICAgIGRlc2NyaXB0aW9uQW5kQWN0aW9uc0VsZW1lbnQuc3R5bGUuYm9yZGVyQm90dG9tID1cclxuICAgICAgICAgICAgXCIxcHggc29saWQgdmFyKC0teXQtc3BlYy0xMC1wZXJjZW50LWxheWVyKVwiO1xyXG4gICAgICAgICAgZGVzY3JpcHRpb25BbmRBY3Rpb25zRWxlbWVudC5zdHlsZS5wYWRkaW5nQm90dG9tID0gXCIxMHB4XCI7XHJcblxyXG4gICAgICAgICAgLy8gRml4IGxpa2UvZGlzbGlrZSByYXRpbyBiYXIgb2Zmc2V0IGluIG5ldyBVSVxyXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhY3Rpb25zLWlubmVyXCIpLnN0eWxlLndpZHRoID0gXCJyZXZlcnRcIjtcclxuICAgICAgICAgIGlmIChpc1JvdW5kZWREZXNpZ24oKSkge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFjdGlvbnNcIikuc3R5bGUuZmxleERpcmVjdGlvbiA9XHJcbiAgICAgICAgICAgICAgXCJyb3ctcmV2ZXJzZVwiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAucnlkLXRvb2x0aXBgKS5zdHlsZS53aWR0aCA9IHdpZHRoUHggKyBcInB4XCI7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyeWQtYmFyXCIpLnN0eWxlLndpZHRoID0gd2lkdGhQZXJjZW50ICsgXCIlXCI7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNyeWQtZGlzbGlrZS10b29sdGlwID4gI3Rvb2x0aXBcIikuaW5uZXJIVE1MID1cclxuICAgICAgICAgIHRvb2x0aXBJbm5lckhUTUw7XHJcbiAgICAgICAgaWYgKGV4dENvbmZpZy5jb2xvcmVkQmFyKSB7XHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJ5ZC1iYXItY29udGFpbmVyXCIpLnN0eWxlLmJhY2tncm91bmRDb2xvciA9XHJcbiAgICAgICAgICAgIGdldENvbG9yRnJvbVRoZW1lKGZhbHNlKTtcclxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicnlkLWJhclwiKS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPVxyXG4gICAgICAgICAgICBnZXRDb2xvckZyb21UaGVtZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgY29uc29sZS5sb2coXCJyZW1vdmluZyBiYXJcIik7XHJcbiAgICBpZiAocmF0ZUJhcikge1xyXG4gICAgICByYXRlQmFyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocmF0ZUJhcik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBjcmVhdGVSYXRlQmFyIH07XHJcbiIsImltcG9ydCB7IGdldExpa2VCdXR0b24sIGdldERpc2xpa2VCdXR0b24sIGdldEJ1dHRvbnMsIGdldExpa2VUZXh0Q29udGFpbmVyLCBnZXREaXNsaWtlVGV4dENvbnRhaW5lciB9IGZyb20gXCIuL2J1dHRvbnNcIjtcclxuaW1wb3J0IHsgY3JlYXRlUmF0ZUJhciB9IGZyb20gXCIuL2JhclwiO1xyXG5pbXBvcnQge1xyXG4gIGdldEJyb3dzZXIsXHJcbiAgZ2V0VmlkZW9JZCxcclxuICBpbml0aWFsaXplTG9nZ2luZyxcclxuICBudW1iZXJGb3JtYXQsXHJcbiAgZ2V0Q29sb3JGcm9tVGhlbWUsXHJcbiAgcXVlcnlTZWxlY3RvcixcclxuICBsb2NhbGl6ZSxcclxuICBjcmVhdGVPYnNlcnZlcixcclxufSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBjb25maWcsIGdldEFwaUVuZHBvaW50LCBERVZfQVBJX1VSTCwgUFJPRF9BUElfVVJMLCBpc0RldmVsb3BtZW50IH0gZnJvbSBcIi4vY29uZmlnXCI7XHJcbmNvbnN0IExJS0VEX1NUQVRFID0gXCJMSUtFRF9TVEFURVwiO1xyXG5jb25zdCBESVNMSUtFRF9TVEFURSA9IFwiRElTTElLRURfU1RBVEVcIjtcclxuY29uc3QgTkVVVFJBTF9TVEFURSA9IFwiTkVVVFJBTF9TVEFURVwiO1xyXG5cclxubGV0IGV4dENvbmZpZyA9IHtcclxuICBkaXNhYmxlVm90ZVN1Ym1pc3Npb246IGZhbHNlLFxyXG4gIGRpc2FibGVMb2dnaW5nOiBmYWxzZSxcclxuICBjb2xvcmVkVGh1bWJzOiBmYWxzZSxcclxuICBjb2xvcmVkQmFyOiBmYWxzZSxcclxuICBjb2xvclRoZW1lOiBcImNsYXNzaWNcIixcclxuICBudW1iZXJEaXNwbGF5Rm9ybWF0OiBcImNvbXBhY3RTaG9ydFwiLFxyXG4gIHNob3dUb29sdGlwUGVyY2VudGFnZTogZmFsc2UsXHJcbiAgdG9vbHRpcFBlcmNlbnRhZ2VNb2RlOiBcImRhc2hfbGlrZVwiLFxyXG4gIG51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzOiBmYWxzZSxcclxuICBoaWRlUHJlbWl1bVRlYXNlcjogZmFsc2UsXHJcbiAgc2VsZWN0b3JzOiB7XHJcbiAgICBkaXNsaWtlVGV4dENvbnRhaW5lcjogW10sXHJcbiAgICBsaWtlVGV4dENvbnRhaW5lcjogW10sXHJcbiAgICBidXR0b25zOiB7XHJcbiAgICAgIHNob3J0czoge1xyXG4gICAgICAgIG1vYmlsZTogW10sXHJcbiAgICAgICAgZGVza3RvcDogW10sXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlZ3VsYXI6IHtcclxuICAgICAgICBtb2JpbGU6IFtdLFxyXG4gICAgICAgIGRlc2t0b3BNZW51OiBbXSxcclxuICAgICAgICBkZXNrdG9wTm9NZW51OiBbXSxcclxuICAgICAgfSxcclxuICAgICAgbGlrZUJ1dHRvbjoge1xyXG4gICAgICAgIHNlZ21lbnRlZDogW10sXHJcbiAgICAgICAgc2VnbWVudGVkR2V0QnV0dG9uczogW10sXHJcbiAgICAgICAgbm90U2VnbWVudGVkOiBbXSxcclxuICAgICAgfSxcclxuICAgICAgZGlzbGlrZUJ1dHRvbjoge1xyXG4gICAgICAgIHNlZ21lbnRlZDogW10sXHJcbiAgICAgICAgc2VnbWVudGVkR2V0QnV0dG9uczogW10sXHJcbiAgICAgICAgbm90U2VnbWVudGVkOiBbXSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBtZW51Q29udGFpbmVyOiBbXSxcclxuICAgIHJvdW5kZWREZXNpZ246IFtdLFxyXG4gIH0sXHJcbn07XHJcblxyXG5sZXQgc3RvcmVkRGF0YSA9IHtcclxuICBsaWtlczogMCxcclxuICBkaXNsaWtlczogMCxcclxuICBwcmV2aW91c1N0YXRlOiBORVVUUkFMX1NUQVRFLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gaXNNb2JpbGUoKSB7XHJcbiAgcmV0dXJuIGxvY2F0aW9uLmhvc3RuYW1lID09IFwibS55b3V0dWJlLmNvbVwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1Nob3J0cygpIHtcclxuICByZXR1cm4gbG9jYXRpb24ucGF0aG5hbWUuc3RhcnRzV2l0aChcIi9zaG9ydHNcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzTmV3RGVzaWduKCkge1xyXG4gIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbW1lbnQtdGVhc2VyXCIpICE9PSBudWxsO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1JvdW5kZWREZXNpZ24oKSB7XHJcbiAgcmV0dXJuIHF1ZXJ5U2VsZWN0b3IoZXh0Q29uZmlnLnNlbGVjdG9ycy5yb3VuZGVkRGVzaWduKSAhPT0gbnVsbDtcclxufVxyXG5cclxubGV0IHNob3J0c09ic2VydmVyID0gbnVsbDtcclxuXHJcbmlmIChpc1Nob3J0cygpICYmICFzaG9ydHNPYnNlcnZlcikge1xyXG4gIGNvbnNvbGUubG9nKFwiSW5pdGlhbGl6aW5nIHNob3J0cyBtdXRhdGlvbiBvYnNlcnZlclwiKTtcclxuICBzaG9ydHNPYnNlcnZlciA9IGNyZWF0ZU9ic2VydmVyKFxyXG4gICAge1xyXG4gICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxyXG4gICAgfSxcclxuICAgIChtdXRhdGlvbkxpc3QpID0+IHtcclxuICAgICAgbXV0YXRpb25MaXN0LmZvckVhY2goKG11dGF0aW9uKSA9PiB7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgbXV0YXRpb24udHlwZSA9PT0gXCJhdHRyaWJ1dGVzXCIgJiZcclxuICAgICAgICAgIG11dGF0aW9uLnRhcmdldC5ub2RlTmFtZSA9PT0gXCJUUC1ZVC1QQVBFUi1CVVRUT05cIiAmJlxyXG4gICAgICAgICAgbXV0YXRpb24udGFyZ2V0LmlkID09PSBcImJ1dHRvblwiXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnU2hvcnQgdGh1bWIgYnV0dG9uIHN0YXR1cyBjaGFuZ2VkJyk7XHJcbiAgICAgICAgICBpZiAobXV0YXRpb24udGFyZ2V0LmdldEF0dHJpYnV0ZShcImFyaWEtcHJlc3NlZFwiKSA9PT0gXCJ0cnVlXCIpIHtcclxuICAgICAgICAgICAgbXV0YXRpb24udGFyZ2V0LnN0eWxlLmNvbG9yID1cclxuICAgICAgICAgICAgICBtdXRhdGlvbi50YXJnZXQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmlkID09PSBcImxpa2UtYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgID8gZ2V0Q29sb3JGcm9tVGhlbWUodHJ1ZSlcclxuICAgICAgICAgICAgICAgIDogZ2V0Q29sb3JGcm9tVGhlbWUoZmFsc2UpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbXV0YXRpb24udGFyZ2V0LnN0eWxlLmNvbG9yID0gXCJ1bnNldFwiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhcIlVuZXhwZWN0ZWQgbXV0YXRpb24gb2JzZXJ2ZXIgZXZlbnQ6IFwiICsgbXV0YXRpb24udGFyZ2V0ICsgbXV0YXRpb24udHlwZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0xpa2VzRGlzYWJsZWQoKSB7XHJcbiAgLy8gcmV0dXJuIHRydWUgaWYgdGhlIGxpa2UgYnV0dG9uJ3MgdGV4dCBkb2Vzbid0IGNvbnRhaW4gYW55IG51bWJlclxyXG4gIGlmIChpc01vYmlsZSgpKSB7XHJcbiAgICByZXR1cm4gL15cXEQqJC8udGVzdChnZXRCdXR0b25zKCkuY2hpbGRyZW5bMF0ucXVlcnlTZWxlY3RvcihcIi5idXR0b24tcmVuZGVyZXItdGV4dFwiKS5pbm5lclRleHQpO1xyXG4gIH1cclxuICByZXR1cm4gL15cXEQqJC8udGVzdChnZXRMaWtlVGV4dENvbnRhaW5lcigpLmlubmVyVGV4dCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVmlkZW9MaWtlZCgpIHtcclxuICBpZiAoaXNNb2JpbGUoKSkge1xyXG4gICAgcmV0dXJuIGdldExpa2VCdXR0b24oKS5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uXCIpLmdldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIikgPT09IFwidHJ1ZVwiO1xyXG4gIH1cclxuICByZXR1cm4gKFxyXG4gICAgZ2V0TGlrZUJ1dHRvbigpLmNsYXNzTGlzdC5jb250YWlucyhcInN0eWxlLWRlZmF1bHQtYWN0aXZlXCIpIHx8XHJcbiAgICBnZXRMaWtlQnV0dG9uKCkucXVlcnlTZWxlY3RvcihcImJ1dHRvblwiKT8uZ2V0QXR0cmlidXRlKFwiYXJpYS1wcmVzc2VkXCIpID09PSBcInRydWVcIlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVmlkZW9EaXNsaWtlZCgpIHtcclxuICBpZiAoaXNNb2JpbGUoKSkge1xyXG4gICAgcmV0dXJuIGdldERpc2xpa2VCdXR0b24oKS5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uXCIpLmdldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIikgPT09IFwidHJ1ZVwiO1xyXG4gIH1cclxuICByZXR1cm4gKFxyXG4gICAgZ2V0RGlzbGlrZUJ1dHRvbigpLmNsYXNzTGlzdC5jb250YWlucyhcInN0eWxlLWRlZmF1bHQtYWN0aXZlXCIpIHx8XHJcbiAgICBnZXREaXNsaWtlQnV0dG9uKCkucXVlcnlTZWxlY3RvcihcImJ1dHRvblwiKT8uZ2V0QXR0cmlidXRlKFwiYXJpYS1wcmVzc2VkXCIpID09PSBcInRydWVcIlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlKHN0b3JlZERhdGEpIHtcclxuICBpZiAoaXNWaWRlb0xpa2VkKCkpIHtcclxuICAgIHJldHVybiB7IGN1cnJlbnQ6IExJS0VEX1NUQVRFLCBwcmV2aW91czogc3RvcmVkRGF0YS5wcmV2aW91c1N0YXRlIH07XHJcbiAgfVxyXG4gIGlmIChpc1ZpZGVvRGlzbGlrZWQoKSkge1xyXG4gICAgcmV0dXJuIHsgY3VycmVudDogRElTTElLRURfU1RBVEUsIHByZXZpb3VzOiBzdG9yZWREYXRhLnByZXZpb3VzU3RhdGUgfTtcclxuICB9XHJcbiAgcmV0dXJuIHsgY3VycmVudDogTkVVVFJBTF9TVEFURSwgcHJldmlvdXM6IHN0b3JlZERhdGEucHJldmlvdXNTdGF0ZSB9O1xyXG59XHJcblxyXG4vLy0tLSAgIFNldHMgVGhlIExpa2VzIEFuZCBEaXNsaWtlcyBWYWx1ZXMgICAtLS0vL1xyXG5mdW5jdGlvbiBzZXRMaWtlcyhsaWtlc0NvdW50KSB7XHJcbiAgY29uc29sZS5sb2coYFNFVCBsaWtlcyAke2xpa2VzQ291bnR9YCk7XHJcbiAgZ2V0TGlrZVRleHRDb250YWluZXIoKS5pbm5lclRleHQgPSBsaWtlc0NvdW50O1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXREaXNsaWtlcyhkaXNsaWtlc0NvdW50KSB7XHJcbiAgY29uc29sZS5sb2coYFNFVCBkaXNsaWtlcyAke2Rpc2xpa2VzQ291bnR9YCk7XHJcblxyXG4gIGNvbnN0IF9jb250YWluZXIgPSBnZXREaXNsaWtlVGV4dENvbnRhaW5lcigpO1xyXG4gIF9jb250YWluZXI/LnJlbW92ZUF0dHJpYnV0ZShcImlzLWVtcHR5XCIpO1xyXG5cclxuICBsZXQgX2Rpc2xpa2VUZXh0O1xyXG4gIGlmICghaXNMaWtlc0Rpc2FibGVkKCkpIHtcclxuICAgIGlmIChpc01vYmlsZSgpKSB7XHJcbiAgICAgIGdldEJ1dHRvbnMoKS5jaGlsZHJlblsxXS5xdWVyeVNlbGVjdG9yKFwiLmJ1dHRvbi1yZW5kZXJlci10ZXh0XCIpLmlubmVyVGV4dCA9IGRpc2xpa2VzQ291bnQ7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIF9kaXNsaWtlVGV4dCA9IGRpc2xpa2VzQ291bnQ7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnNvbGUubG9nKFwibGlrZXMgY291bnQgZGlzYWJsZWQgYnkgY3JlYXRvclwiKTtcclxuICAgIGlmIChpc01vYmlsZSgpKSB7XHJcbiAgICAgIGdldEJ1dHRvbnMoKS5jaGlsZHJlblsxXS5xdWVyeVNlbGVjdG9yKFwiLmJ1dHRvbi1yZW5kZXJlci10ZXh0XCIpLmlubmVyVGV4dCA9IGxvY2FsaXplKFwiVGV4dExpa2VzRGlzYWJsZWRcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIF9kaXNsaWtlVGV4dCA9IGxvY2FsaXplKFwiVGV4dExpa2VzRGlzYWJsZWRcIik7XHJcbiAgfVxyXG5cclxuICBpZiAoX2Rpc2xpa2VUZXh0ICE9IG51bGwgJiYgX2NvbnRhaW5lcj8uaW5uZXJUZXh0ICE9PSBfZGlzbGlrZVRleHQpIHtcclxuICAgIF9jb250YWluZXIuaW5uZXJUZXh0ID0gX2Rpc2xpa2VUZXh0O1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TGlrZUNvdW50RnJvbUJ1dHRvbigpIHtcclxuICB0cnkge1xyXG4gICAgaWYgKGlzU2hvcnRzKCkpIHtcclxuICAgICAgLy9Zb3V0dWJlIFNob3J0cyBkb24ndCB3b3JrIHdpdGggdGhpcyBxdWVyeS4gSXQncyBub3QgbmVjZXNzYXJ5OyB3ZSBjYW4gc2tpcCBpdCBhbmQgc3RpbGwgc2VlIHRoZSByZXN1bHRzLlxyXG4gICAgICAvL0l0IHNob3VsZCBiZSBwb3NzaWJsZSB0byBmaXggdGhpcyBmdW5jdGlvbiwgYnV0IGl0J3Mgbm90IGNyaXRpY2FsIHRvIHNob3dpbmcgdGhlIGRpc2xpa2UgY291bnQuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgbGlrZUJ1dHRvbiA9XHJcbiAgICAgIGdldExpa2VCdXR0b24oKS5xdWVyeVNlbGVjdG9yKFwieXQtZm9ybWF0dGVkLXN0cmluZyN0ZXh0XCIpID8/IGdldExpa2VCdXR0b24oKS5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uXCIpO1xyXG5cclxuICAgIGxldCBsaWtlc1N0ciA9IGxpa2VCdXR0b24uZ2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiKS5yZXBsYWNlKC9cXEQvZywgXCJcIik7XHJcbiAgICByZXR1cm4gbGlrZXNTdHIubGVuZ3RoID4gMCA/IHBhcnNlSW50KGxpa2VzU3RyKSA6IGZhbHNlO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlLCBzdG9yZWREYXRhKSB7XHJcbiAgY29uc3QgZm9ybWF0dGVkRGlzbGlrZSA9IG51bWJlckZvcm1hdChyZXNwb25zZS5kaXNsaWtlcyk7XHJcbiAgc2V0RGlzbGlrZXMoZm9ybWF0dGVkRGlzbGlrZSk7XHJcbiAgaWYgKGV4dENvbmZpZy5udW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlcyA9PT0gdHJ1ZSkge1xyXG4gICAgY29uc3QgbmF0aXZlTGlrZXMgPSBnZXRMaWtlQ291bnRGcm9tQnV0dG9uKCk7XHJcbiAgICBpZiAobmF0aXZlTGlrZXMgIT09IGZhbHNlKSB7XHJcbiAgICAgIHNldExpa2VzKG51bWJlckZvcm1hdChuYXRpdmVMaWtlcykpO1xyXG4gICAgfVxyXG4gIH1cclxuICBzdG9yZWREYXRhLmRpc2xpa2VzID0gcGFyc2VJbnQocmVzcG9uc2UuZGlzbGlrZXMpO1xyXG4gIHN0b3JlZERhdGEubGlrZXMgPSBnZXRMaWtlQ291bnRGcm9tQnV0dG9uKCkgfHwgcGFyc2VJbnQocmVzcG9uc2UubGlrZXMpO1xyXG4gIGNyZWF0ZVJhdGVCYXIoc3RvcmVkRGF0YS5saWtlcywgc3RvcmVkRGF0YS5kaXNsaWtlcyk7XHJcbiAgaWYgKGV4dENvbmZpZy5jb2xvcmVkVGh1bWJzID09PSB0cnVlKSB7XHJcbiAgICBpZiAoaXNTaG9ydHMoKSkge1xyXG4gICAgICAvLyBmb3Igc2hvcnRzLCBsZWF2ZSBkZWFjdGl2YXRlZCBidXR0b25zIGluIGRlZmF1bHQgY29sb3JcclxuICAgICAgbGV0IHNob3J0TGlrZUJ1dHRvbiA9IGdldExpa2VCdXR0b24oKS5xdWVyeVNlbGVjdG9yKFwidHAteXQtcGFwZXItYnV0dG9uI2J1dHRvblwiKTtcclxuICAgICAgbGV0IHNob3J0RGlzbGlrZUJ1dHRvbiA9IGdldERpc2xpa2VCdXR0b24oKS5xdWVyeVNlbGVjdG9yKFwidHAteXQtcGFwZXItYnV0dG9uI2J1dHRvblwiKTtcclxuICAgICAgaWYgKHNob3J0TGlrZUJ1dHRvbi5nZXRBdHRyaWJ1dGUoXCJhcmlhLXByZXNzZWRcIikgPT09IFwidHJ1ZVwiKSB7XHJcbiAgICAgICAgc2hvcnRMaWtlQnV0dG9uLnN0eWxlLmNvbG9yID0gZ2V0Q29sb3JGcm9tVGhlbWUodHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNob3J0RGlzbGlrZUJ1dHRvbi5nZXRBdHRyaWJ1dGUoXCJhcmlhLXByZXNzZWRcIikgPT09IFwidHJ1ZVwiKSB7XHJcbiAgICAgICAgc2hvcnREaXNsaWtlQnV0dG9uLnN0eWxlLmNvbG9yID0gZ2V0Q29sb3JGcm9tVGhlbWUoZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHNob3J0c09ic2VydmVyLm9ic2VydmUoc2hvcnRMaWtlQnV0dG9uKTtcclxuICAgICAgc2hvcnRzT2JzZXJ2ZXIub2JzZXJ2ZShzaG9ydERpc2xpa2VCdXR0b24pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZ2V0TGlrZUJ1dHRvbigpLnN0eWxlLmNvbG9yID0gZ2V0Q29sb3JGcm9tVGhlbWUodHJ1ZSk7XHJcbiAgICAgIGdldERpc2xpa2VCdXR0b24oKS5zdHlsZS5jb2xvciA9IGdldENvbG9yRnJvbVRoZW1lKGZhbHNlKTtcclxuICAgIH1cclxuICB9XHJcbiAgLy9UZW1wb3JhcnkgZGlzYWJsaW5nIHRoaXMgLSBpdCBicmVha3MgYWxsIHBsYWNlcyB3aGVyZSBnZXRCdXR0b25zKClbMV0gaXMgdXNlZFxyXG4gIC8vIGNyZWF0ZVN0YXJSYXRpbmcocmVzcG9uc2UucmF0aW5nLCBpc01vYmlsZSgpKTtcclxufVxyXG5cclxuLy8gVGVsbHMgdGhlIHVzZXIgaWYgdGhlIEFQSSBpcyBkb3duXHJcbmZ1bmN0aW9uIGRpc3BsYXlFcnJvcihlcnJvcikge1xyXG4gIGdldERpc2xpa2VUZXh0Q29udGFpbmVyKCkuaW5uZXJUZXh0ID0gbG9jYWxpemUoXCJ0ZXh0VGVtcFVuYXZhaWxhYmxlXCIpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXRTdGF0ZShzdG9yZWREYXRhKSB7XHJcbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgIHdpbmRvdy5fX3J5ZFNldFN0YXRlQ2FsbHMgPSAod2luZG93Ll9fcnlkU2V0U3RhdGVDYWxscyB8fCAwKSArIDE7XHJcbiAgfVxyXG4gIHN0b3JlZERhdGEucHJldmlvdXNTdGF0ZSA9IGlzVmlkZW9EaXNsaWtlZCgpID8gRElTTElLRURfU1RBVEUgOiBpc1ZpZGVvTGlrZWQoKSA/IExJS0VEX1NUQVRFIDogTkVVVFJBTF9TVEFURTtcclxuICBsZXQgc3RhdHNTZXQgPSBmYWxzZTtcclxuICBjb25zb2xlLmxvZyhcIlZpZGVvIGlzIGxvYWRlZC4gQWRkaW5nIGJ1dHRvbnMuLi5cIik7XHJcblxyXG4gIGxldCB2aWRlb0lkID0gZ2V0VmlkZW9JZCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgbGV0IGxpa2VDb3VudCA9IGdldExpa2VDb3VudEZyb21CdXR0b24oKSB8fCBudWxsO1xyXG5cclxuICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChnZXRBcGlFbmRwb2ludChgL3ZvdGVzP3ZpZGVvSWQ9JHt2aWRlb0lkfSZsaWtlQ291bnQ9JHtsaWtlQ291bnQgfHwgXCJcIn1gKSwge1xyXG4gICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgfSxcclxuICB9KVxyXG4gICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIGRpc3BsYXlFcnJvcihyZXNwb25zZS5lcnJvcik7XHJcbiAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgIH0pXHJcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgIC5jYXRjaChkaXNwbGF5RXJyb3IpO1xyXG4gIGNvbnNvbGUubG9nKFwicmVzcG9uc2UgZnJvbSBhcGk6XCIpO1xyXG4gIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSk7XHJcbiAgaWYgKHJlc3BvbnNlICE9PSB1bmRlZmluZWQgJiYgIShcInRyYWNlSWRcIiBpbiByZXNwb25zZSkgJiYgIXN0YXRzU2V0KSB7XHJcbiAgICBwcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UsIHN0b3JlZERhdGEpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0SW5pdGlhbFN0YXRlKCkge1xyXG4gIGF3YWl0IHNldFN0YXRlKHN0b3JlZERhdGEpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbml0RXh0Q29uZmlnKCkge1xyXG4gIGluaXRpYWxpemVEaXNhYmxlVm90ZVN1Ym1pc3Npb24oKTtcclxuICBpbml0aWFsaXplRGlzYWJsZUxvZ2dpbmcoKTtcclxuICBpbml0aWFsaXplQ29sb3JlZFRodW1icygpO1xyXG4gIGluaXRpYWxpemVDb2xvcmVkQmFyKCk7XHJcbiAgaW5pdGlhbGl6ZUNvbG9yVGhlbWUoKTtcclxuICBpbml0aWFsaXplTnVtYmVyRGlzcGxheUZvcm1hdCgpO1xyXG4gIGluaXRpYWxpemVUb29sdGlwUGVyY2VudGFnZSgpO1xyXG4gIGluaXRpYWxpemVUb29sdGlwUGVyY2VudGFnZU1vZGUoKTtcclxuICBpbml0aWFsaXplTnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXMoKTtcclxuICBpbml0aWFsaXplSGlkZVByZW1pdW1UZWFzZXIoKTtcclxuICBhd2FpdCBpbml0aWFsaXplU2VsZWN0b3JzKCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVTZWxlY3RvcnMoKSB7XHJcbiAgbGV0IHJlc3VsdCA9IGF3YWl0IGZldGNoKGdldEFwaUVuZHBvaW50KFwiL2NvbmZpZ3Mvc2VsZWN0b3JzXCIpLCB7XHJcbiAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICBoZWFkZXJzOiB7XHJcbiAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICB9LFxyXG4gIH0pXHJcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIHNlbGVjdG9yczpcIiwgZXJyb3IpO1xyXG4gICAgfSk7XHJcbiAgZXh0Q29uZmlnLnNlbGVjdG9ycyA9IHJlc3VsdCA/PyBleHRDb25maWcuc2VsZWN0b3JzO1xyXG4gIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVEaXNhYmxlVm90ZVN1Ym1pc3Npb24oKSB7XHJcbiAgZ2V0QnJvd3NlcigpLnN0b3JhZ2Uuc3luYy5nZXQoW1wiZGlzYWJsZVZvdGVTdWJtaXNzaW9uXCJdLCAocmVzKSA9PiB7XHJcbiAgICBpZiAocmVzLmRpc2FibGVWb3RlU3VibWlzc2lvbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdldEJyb3dzZXIoKS5zdG9yYWdlLnN5bmMuc2V0KHsgZGlzYWJsZVZvdGVTdWJtaXNzaW9uOiBmYWxzZSB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV4dENvbmZpZy5kaXNhYmxlVm90ZVN1Ym1pc3Npb24gPSByZXMuZGlzYWJsZVZvdGVTdWJtaXNzaW9uO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0aWFsaXplRGlzYWJsZUxvZ2dpbmcoKSB7XHJcbiAgZ2V0QnJvd3NlcigpLnN0b3JhZ2Uuc3luYy5nZXQoW1wiZGlzYWJsZUxvZ2dpbmdcIl0sIChyZXMpID0+IHtcclxuICAgIGlmIChyZXMuZGlzYWJsZUxvZ2dpbmcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBnZXRCcm93c2VyKCkuc3RvcmFnZS5zeW5jLnNldCh7IGRpc2FibGVMb2dnaW5nOiB0cnVlIH0pO1xyXG4gICAgICBleHRDb25maWcuZGlzYWJsZUxvZ2dpbmcgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXh0Q29uZmlnLmRpc2FibGVMb2dnaW5nID0gcmVzLmRpc2FibGVMb2dnaW5nO1xyXG4gICAgfVxyXG4gICAgLy8gSW5pdGlhbGl6ZSBjb25zb2xlIG1ldGhvZHMgYmFzZWQgb24gbG9nZ2luZyBjb25maWdcclxuICAgIGluaXRpYWxpemVMb2dnaW5nKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVDb2xvcmVkVGh1bWJzKCkge1xyXG4gIGdldEJyb3dzZXIoKS5zdG9yYWdlLnN5bmMuZ2V0KFtcImNvbG9yZWRUaHVtYnNcIl0sIChyZXMpID0+IHtcclxuICAgIGlmIChyZXMuY29sb3JlZFRodW1icyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdldEJyb3dzZXIoKS5zdG9yYWdlLnN5bmMuc2V0KHsgY29sb3JlZFRodW1iczogZmFsc2UgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBleHRDb25maWcuY29sb3JlZFRodW1icyA9IHJlcy5jb2xvcmVkVGh1bWJzO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0aWFsaXplQ29sb3JlZEJhcigpIHtcclxuICBnZXRCcm93c2VyKCkuc3RvcmFnZS5zeW5jLmdldChbXCJjb2xvcmVkQmFyXCJdLCAocmVzKSA9PiB7XHJcbiAgICBpZiAocmVzLmNvbG9yZWRCYXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBnZXRCcm93c2VyKCkuc3RvcmFnZS5zeW5jLnNldCh7IGNvbG9yZWRCYXI6IGZhbHNlIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXh0Q29uZmlnLmNvbG9yZWRCYXIgPSByZXMuY29sb3JlZEJhcjtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZUNvbG9yVGhlbWUoKSB7XHJcbiAgZ2V0QnJvd3NlcigpLnN0b3JhZ2Uuc3luYy5nZXQoW1wiY29sb3JUaGVtZVwiXSwgKHJlcykgPT4ge1xyXG4gICAgaWYgKHJlcy5jb2xvclRoZW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgZ2V0QnJvd3NlcigpLnN0b3JhZ2Uuc3luYy5zZXQoeyBjb2xvclRoZW1lOiBmYWxzZSB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV4dENvbmZpZy5jb2xvclRoZW1lID0gcmVzLmNvbG9yVGhlbWU7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVOdW1iZXJEaXNwbGF5Rm9ybWF0KCkge1xyXG4gIGdldEJyb3dzZXIoKS5zdG9yYWdlLnN5bmMuZ2V0KFtcIm51bWJlckRpc3BsYXlGb3JtYXRcIl0sIChyZXMpID0+IHtcclxuICAgIGlmIChyZXMubnVtYmVyRGlzcGxheUZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdldEJyb3dzZXIoKS5zdG9yYWdlLnN5bmMuc2V0KHsgbnVtYmVyRGlzcGxheUZvcm1hdDogXCJjb21wYWN0U2hvcnRcIiB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGV4dENvbmZpZy5udW1iZXJEaXNwbGF5Rm9ybWF0ID0gcmVzLm51bWJlckRpc3BsYXlGb3JtYXQ7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVUb29sdGlwUGVyY2VudGFnZSgpIHtcclxuICBnZXRCcm93c2VyKCkuc3RvcmFnZS5zeW5jLmdldChbXCJzaG93VG9vbHRpcFBlcmNlbnRhZ2VcIl0sIChyZXMpID0+IHtcclxuICAgIGlmIChyZXMuc2hvd1Rvb2x0aXBQZXJjZW50YWdlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgZ2V0QnJvd3NlcigpLnN0b3JhZ2Uuc3luYy5zZXQoeyBzaG93VG9vbHRpcFBlcmNlbnRhZ2U6IGZhbHNlIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXh0Q29uZmlnLnNob3dUb29sdGlwUGVyY2VudGFnZSA9IHJlcy5zaG93VG9vbHRpcFBlcmNlbnRhZ2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVUb29sdGlwUGVyY2VudGFnZU1vZGUoKSB7XHJcbiAgZ2V0QnJvd3NlcigpLnN0b3JhZ2Uuc3luYy5nZXQoW1widG9vbHRpcFBlcmNlbnRhZ2VNb2RlXCJdLCAocmVzKSA9PiB7XHJcbiAgICBpZiAocmVzLnRvb2x0aXBQZXJjZW50YWdlTW9kZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdldEJyb3dzZXIoKS5zdG9yYWdlLnN5bmMuc2V0KHsgdG9vbHRpcFBlcmNlbnRhZ2VNb2RlOiBcImRhc2hfbGlrZVwiIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXh0Q29uZmlnLnRvb2x0aXBQZXJjZW50YWdlTW9kZSA9IHJlcy50b29sdGlwUGVyY2VudGFnZU1vZGU7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVOdW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlcygpIHtcclxuICBnZXRCcm93c2VyKCkuc3RvcmFnZS5zeW5jLmdldChbXCJudW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlc1wiXSwgKHJlcykgPT4ge1xyXG4gICAgaWYgKHJlcy5udW1iZXJEaXNwbGF5UmVmb3JtYXRMaWtlcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGdldEJyb3dzZXIoKS5zdG9yYWdlLnN5bmMuc2V0KHsgbnVtYmVyRGlzcGxheVJlZm9ybWF0TGlrZXM6IGZhbHNlIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXh0Q29uZmlnLm51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzID0gcmVzLm51bWJlckRpc3BsYXlSZWZvcm1hdExpa2VzO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0aWFsaXplSGlkZVByZW1pdW1UZWFzZXIoKSB7XHJcbiAgZ2V0QnJvd3NlcigpLnN0b3JhZ2Uuc3luYy5nZXQoW1wiaGlkZVByZW1pdW1UZWFzZXJcIl0sIChyZXMpID0+IHtcclxuICAgIGlmIChyZXMuaGlkZVByZW1pdW1UZWFzZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBnZXRCcm93c2VyKCkuc3RvcmFnZS5zeW5jLnNldCh7IGhpZGVQcmVtaXVtVGVhc2VyOiBmYWxzZSB9KTtcclxuICAgICAgZXh0Q29uZmlnLmhpZGVQcmVtaXVtVGVhc2VyID0gZmFsc2U7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBleHRDb25maWcuaGlkZVByZW1pdW1UZWFzZXIgPSByZXMuaGlkZVByZW1pdW1UZWFzZXIgPT09IHRydWU7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCB7XHJcbiAgaXNNb2JpbGUsXHJcbiAgaXNTaG9ydHMsXHJcbiAgaXNWaWRlb0Rpc2xpa2VkLFxyXG4gIGlzVmlkZW9MaWtlZCxcclxuICBpc05ld0Rlc2lnbixcclxuICBpc1JvdW5kZWREZXNpZ24sXHJcbiAgZ2V0U3RhdGUsXHJcbiAgc2V0U3RhdGUsXHJcbiAgc2V0SW5pdGlhbFN0YXRlLFxyXG4gIHNldExpa2VzLFxyXG4gIHNldERpc2xpa2VzLFxyXG4gIGdldExpa2VDb3VudEZyb21CdXR0b24sXHJcbiAgTElLRURfU1RBVEUsXHJcbiAgRElTTElLRURfU1RBVEUsXHJcbiAgTkVVVFJBTF9TVEFURSxcclxuICBleHRDb25maWcsXHJcbiAgaW5pdEV4dENvbmZpZyxcclxuICBzdG9yZWREYXRhLFxyXG4gIGlzTGlrZXNEaXNhYmxlZCxcclxufTtcclxuIiwiaW1wb3J0IHsgZXh0Q29uZmlnLCBpc1Nob3J0cyB9IGZyb20gXCIuL3N0YXRlXCI7XHJcblxyXG5mdW5jdGlvbiBudW1iZXJGb3JtYXQobnVtYmVyU3RhdGUpIHtcclxuICByZXR1cm4gZ2V0TnVtYmVyRm9ybWF0dGVyKGV4dENvbmZpZy5udW1iZXJEaXNwbGF5Rm9ybWF0KS5mb3JtYXQobnVtYmVyU3RhdGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXROdW1iZXJGb3JtYXR0ZXIob3B0aW9uU2VsZWN0KSB7XHJcbiAgbGV0IHVzZXJMb2NhbGVzO1xyXG4gIGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZykge1xyXG4gICAgdXNlckxvY2FsZXMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZztcclxuICB9IGVsc2UgaWYgKG5hdmlnYXRvci5sYW5ndWFnZSkge1xyXG4gICAgdXNlckxvY2FsZXMgPSBuYXZpZ2F0b3IubGFuZ3VhZ2U7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHVzZXJMb2NhbGVzID0gbmV3IFVSTChcclxuICAgICAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJoZWFkID4gbGlua1tyZWw9J3NlYXJjaCddXCIpKVxyXG4gICAgICAgICAgPy5maW5kKChuKSA9PiBuPy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpPy5pbmNsdWRlcyhcIj9sb2NhbGU9XCIpKVxyXG4gICAgICAgICAgPy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpLFxyXG4gICAgICApPy5zZWFyY2hQYXJhbXM/LmdldChcImxvY2FsZVwiKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIkNhbm5vdCBmaW5kIGJyb3dzZXIgbG9jYWxlLiBVc2UgZW4gYXMgZGVmYXVsdCBmb3IgbnVtYmVyIGZvcm1hdHRpbmcuXCIpO1xyXG4gICAgICB1c2VyTG9jYWxlcyA9IFwiZW5cIjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCBmb3JtYXR0ZXJOb3RhdGlvbjtcclxuICBsZXQgZm9ybWF0dGVyQ29tcGFjdERpc3BsYXk7XHJcbiAgc3dpdGNoIChvcHRpb25TZWxlY3QpIHtcclxuICAgIGNhc2UgXCJjb21wYWN0TG9uZ1wiOlxyXG4gICAgICBmb3JtYXR0ZXJOb3RhdGlvbiA9IFwiY29tcGFjdFwiO1xyXG4gICAgICBmb3JtYXR0ZXJDb21wYWN0RGlzcGxheSA9IFwibG9uZ1wiO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJzdGFuZGFyZFwiOlxyXG4gICAgICBmb3JtYXR0ZXJOb3RhdGlvbiA9IFwic3RhbmRhcmRcIjtcclxuICAgICAgZm9ybWF0dGVyQ29tcGFjdERpc3BsYXkgPSBcInNob3J0XCI7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBcImNvbXBhY3RTaG9ydFwiOlxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgZm9ybWF0dGVyTm90YXRpb24gPSBcImNvbXBhY3RcIjtcclxuICAgICAgZm9ybWF0dGVyQ29tcGFjdERpc3BsYXkgPSBcInNob3J0XCI7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gSW50bC5OdW1iZXJGb3JtYXQodXNlckxvY2FsZXMsIHtcclxuICAgIG5vdGF0aW9uOiBmb3JtYXR0ZXJOb3RhdGlvbixcclxuICAgIGNvbXBhY3REaXNwbGF5OiBmb3JtYXR0ZXJDb21wYWN0RGlzcGxheSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9jYWxpemUobG9jYWxlU3RyaW5nLCBzdWJzdGl0dXRpb25zKSB7XHJcbiAgdHJ5IHtcclxuICAgIGlmICh0eXBlb2YgY2hyb21lICE9PSBcInVuZGVmaW5lZFwiICYmIGNocm9tZT8uaTE4bj8uZ2V0TWVzc2FnZSkge1xyXG4gICAgICBjb25zdCBhcmdzID0gc3Vic3RpdHV0aW9ucyA9PT0gdW5kZWZpbmVkID8gW2xvY2FsZVN0cmluZ10gOiBbbG9jYWxlU3RyaW5nLCBzdWJzdGl0dXRpb25zXTtcclxuICAgICAgY29uc3QgbWVzc2FnZSA9IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoLi4uYXJncyk7XHJcbiAgICAgIGlmIChtZXNzYWdlKSB7XHJcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS53YXJuKFwiTG9jYWxpemF0aW9uIGxvb2t1cCBmYWlsZWQgZm9yXCIsIGxvY2FsZVN0cmluZywgZXJyb3IpO1xyXG4gIH1cclxuXHJcbiAgaWYgKEFycmF5LmlzQXJyYXkoc3Vic3RpdHV0aW9ucykpIHtcclxuICAgIHJldHVybiBzdWJzdGl0dXRpb25zLmpvaW4oXCIgXCIpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHN1YnN0aXR1dGlvbnMgIT0gbnVsbCkge1xyXG4gICAgcmV0dXJuIGAke3N1YnN0aXR1dGlvbnN9YDtcclxuICB9XHJcblxyXG4gIHJldHVybiBsb2NhbGVTdHJpbmc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEJyb3dzZXIoKSB7XHJcbiAgaWYgKHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGNocm9tZS5ydW50aW1lICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICByZXR1cm4gY2hyb21lO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mIGJyb3dzZXIgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGJyb3dzZXIucnVudGltZSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgcmV0dXJuIGJyb3dzZXI7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnNvbGUubG9nKFwiYnJvd3NlciBpcyBub3Qgc3VwcG9ydGVkXCIpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VmlkZW9JZCh1cmwpIHtcclxuICBjb25zdCB1cmxPYmplY3QgPSBuZXcgVVJMKHVybCk7XHJcbiAgY29uc3QgcGF0aG5hbWUgPSB1cmxPYmplY3QucGF0aG5hbWU7XHJcbiAgaWYgKHBhdGhuYW1lLnN0YXJ0c1dpdGgoXCIvY2xpcFwiKSkge1xyXG4gICAgcmV0dXJuIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwibWV0YVtpdGVtcHJvcD0ndmlkZW9JZCddXCIpIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJtZXRhW2l0ZW1wcm9wPSdpZGVudGlmaWVyJ11cIikpXHJcbiAgICAgIC5jb250ZW50O1xyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAocGF0aG5hbWUuc3RhcnRzV2l0aChcIi9zaG9ydHNcIikpIHtcclxuICAgICAgcmV0dXJuIHBhdGhuYW1lLnNsaWNlKDgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVybE9iamVjdC5zZWFyY2hQYXJhbXMuZ2V0KFwidlwiKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5WaWV3cG9ydChlbGVtZW50KSB7XHJcbiAgY29uc3QgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgY29uc3QgaGVpZ2h0ID0gaW5uZXJIZWlnaHQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICBjb25zdCB3aWR0aCA9IGlubmVyV2lkdGggfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gIHJldHVybiAoXHJcbiAgICAvLyBXaGVuIHNob3J0IChjaGFubmVsKSBpcyBpZ25vcmVkLCB0aGUgZWxlbWVudCAobGlrZS9kaXNsaWtlIEFORCBzaG9ydCBpdHNlbGYpIGlzXHJcbiAgICAvLyBoaWRkZW4gd2l0aCBhIDAgRE9NUmVjdC4gSW4gdGhpcyBjYXNlLCBjb25zaWRlciBpdCBvdXRzaWRlIG9mIFZpZXdwb3J0XHJcbiAgICAhKHJlY3QudG9wID09IDAgJiYgcmVjdC5sZWZ0ID09IDAgJiYgcmVjdC5ib3R0b20gPT0gMCAmJiByZWN0LnJpZ2h0ID09IDApICYmXHJcbiAgICByZWN0LnRvcCA+PSAwICYmXHJcbiAgICByZWN0LmxlZnQgPj0gMCAmJlxyXG4gICAgcmVjdC5ib3R0b20gPD0gaGVpZ2h0ICYmXHJcbiAgICByZWN0LnJpZ2h0IDw9IHdpZHRoXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNTaG9ydHNMb2FkZWQodmlkZW9JZCkge1xyXG4gIGlmICghdmlkZW9JZCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAvLyBGaW5kIGFsbCByZWVsIGNvbnRhaW5lcnNcclxuICBjb25zdCByZWVsQ29udGFpbmVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIucmVlbC12aWRlby1pbi1zZXF1ZW5jZS1uZXdcIik7XHJcblxyXG4gIGZvciAoY29uc3QgY29udGFpbmVyIG9mIHJlZWxDb250YWluZXJzKSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGNvbnRhaW5lcidzIHRodW1ibmFpbCBtYXRjaGVzIG91ciB2aWRlbyBJRFxyXG4gICAgY29uc3QgdGh1bWJuYWlsID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIucmVlbC12aWRlby1pbi1zZXF1ZW5jZS10aHVtYm5haWxcIik7XHJcbiAgICBpZiAodGh1bWJuYWlsKSB7XHJcbiAgICAgIGNvbnN0IGJnSW1hZ2UgPSB0aHVtYm5haWwuc3R5bGUuYmFja2dyb3VuZEltYWdlO1xyXG4gICAgICAvLyBZb3VUdWJlIHRodW1ibmFpbCBVUkxzIGNvbnRhaW4gdGhlIHZpZGVvIElEIGluIHRoZSBmb3JtYXQ6IC92aS9WSURFT19JRC9cclxuICAgICAgaWYgKChiZ0ltYWdlICYmIGJnSW1hZ2UuaW5jbHVkZXMoYC8ke3ZpZGVvSWR9L2ApKSB8fCAoIWJnSW1hZ2UgJiYgaXNJblZpZXdwb3J0KGNvbnRhaW5lcikpKSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBjb250YWluZXIgaGFzIHRoZSByZW5kZXJlciB3aXRoIHZpc2libGUgZXhwZXJpbWVudC1vdmVybGF5XHJcbiAgICAgICAgY29uc3QgcmVuZGVyZXIgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcihcInl0ZC1yZWVsLXZpZGVvLXJlbmRlcmVyXCIpO1xyXG4gICAgICAgIGlmIChyZW5kZXJlcikge1xyXG4gICAgICAgICAgY29uc3QgZXhwZXJpbWVudE92ZXJsYXkgPSByZW5kZXJlci5xdWVyeVNlbGVjdG9yKFwiI2V4cGVyaW1lbnQtb3ZlcmxheVwiKTtcclxuICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgZXhwZXJpbWVudE92ZXJsYXkgJiZcclxuICAgICAgICAgICAgIWV4cGVyaW1lbnRPdmVybGF5LmhpZGRlbiAmJlxyXG4gICAgICAgICAgICB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShleHBlcmltZW50T3ZlcmxheSkuZGlzcGxheSAhPT0gXCJub25lXCIgJiZcclxuICAgICAgICAgICAgZXhwZXJpbWVudE92ZXJsYXkuaGFzQ2hpbGROb2RlcygpXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzVmlkZW9Mb2FkZWQoKSB7XHJcbiAgY29uc3QgdmlkZW9JZCA9IGdldFZpZGVvSWQod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG5cclxuICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgU2hvcnRzIFVSTFxyXG4gIGlmIChpc1Nob3J0cygpKSB7XHJcbiAgICByZXR1cm4gaXNTaG9ydHNMb2FkZWQodmlkZW9JZCk7XHJcbiAgfVxyXG5cclxuICAvLyBSZWd1bGFyIHZpZGVvIGNoZWNrc1xyXG4gIHJldHVybiAoXHJcbiAgICAvLyBkZXNrdG9wOiBzcHJpbmcgMjAyNCBVSVxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgeXRkLXdhdGNoLWdyaWRbdmlkZW8taWQ9JyR7dmlkZW9JZH0nXWApICE9PSBudWxsIHx8XHJcbiAgICAvLyBkZXNrdG9wOiBvbGRlciBVSVxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgeXRkLXdhdGNoLWZsZXh5W3ZpZGVvLWlkPScke3ZpZGVvSWR9J11gKSAhPT0gbnVsbCB8fFxyXG4gICAgLy8gbW9iaWxlOiBubyB2aWRlby1pZCBhdHRyaWJ1dGVcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwbGF5ZXJbbG9hZGluZz1cImZhbHNlXCJdOm5vdChbaGlkZGVuXSknKSAhPT0gbnVsbFxyXG4gICk7XHJcbn1cclxuXHJcbmNvbnN0IG9yaWdpbmFsQ29uc29sZSA9IHtcclxuICBsb2c6IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSksXHJcbiAgZGVidWc6IGNvbnNvbGUuZGVidWcuYmluZChjb25zb2xlKSxcclxuICBpbmZvOiBjb25zb2xlLmluZm8uYmluZChjb25zb2xlKSxcclxuICB3YXJuOiBjb25zb2xlLndhcm4uYmluZChjb25zb2xlKSxcclxuICBlcnJvcjogY29uc29sZS5lcnJvci5iaW5kKGNvbnNvbGUpLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZUxvZ2dpbmcoKSB7XHJcbiAgaWYgKGV4dENvbmZpZy5kaXNhYmxlTG9nZ2luZykge1xyXG4gICAgY29uc29sZS5sb2cgPSAoKSA9PiB7fTtcclxuICAgIGNvbnNvbGUuZGVidWcgPSAoKSA9PiB7fTtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc29sZS5sb2cgPSBvcmlnaW5hbENvbnNvbGUubG9nO1xyXG4gICAgY29uc29sZS5kZWJ1ZyA9IG9yaWdpbmFsQ29uc29sZS5kZWJ1ZztcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldENvbG9yRnJvbVRoZW1lKHZvdGVJc0xpa2UpIHtcclxuICBsZXQgY29sb3JTdHJpbmc7XHJcbiAgc3dpdGNoIChleHRDb25maWcuY29sb3JUaGVtZSkge1xyXG4gICAgY2FzZSBcImFjY2Vzc2libGVcIjpcclxuICAgICAgaWYgKHZvdGVJc0xpa2UgPT09IHRydWUpIHtcclxuICAgICAgICBjb2xvclN0cmluZyA9IFwiZG9kZ2VyYmx1ZVwiO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbG9yU3RyaW5nID0gXCJnb2xkXCI7XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIFwibmVvblwiOlxyXG4gICAgICBpZiAodm90ZUlzTGlrZSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbG9yU3RyaW5nID0gXCJhcXVhXCI7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29sb3JTdHJpbmcgPSBcIm1hZ2VudGFcIjtcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgXCJjbGFzc2ljXCI6XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICBpZiAodm90ZUlzTGlrZSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbG9yU3RyaW5nID0gXCJsaW1lXCI7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29sb3JTdHJpbmcgPSBcInJlZFwiO1xyXG4gICAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBjb2xvclN0cmluZztcclxufVxyXG5cclxuZnVuY3Rpb24gcXVlcnlTZWxlY3RvcihzZWxlY3RvcnMsIGVsZW1lbnQpIHtcclxuICBsZXQgcmVzdWx0O1xyXG4gIGZvciAoY29uc3Qgc2VsZWN0b3Igb2Ygc2VsZWN0b3JzKSB7XHJcbiAgICByZXN1bHQgPSAoZWxlbWVudCA/PyBkb2N1bWVudCkucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBxdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9ycykge1xyXG4gIGxldCByZXN1bHQ7XHJcbiAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBzZWxlY3RvcnMpIHtcclxuICAgIHJlc3VsdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xyXG4gICAgaWYgKHJlc3VsdC5sZW5ndGggIT09IDApIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlT2JzZXJ2ZXIob3B0aW9ucywgY2FsbGJhY2spIHtcclxuICBjb25zdCBvYnNlcnZlcldyYXBwZXIgPSBuZXcgT2JqZWN0KCk7XHJcbiAgb2JzZXJ2ZXJXcmFwcGVyLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gIG9ic2VydmVyV3JhcHBlci5vYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKTtcclxuICBvYnNlcnZlcldyYXBwZXIub2JzZXJ2ZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUoZWxlbWVudCwgdGhpcy5vcHRpb25zKTtcclxuICB9O1xyXG4gIG9ic2VydmVyV3JhcHBlci5kaXNjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5vYnNlcnZlci5kaXNjb25uZWN0KCk7XHJcbiAgfTtcclxuICByZXR1cm4gb2JzZXJ2ZXJXcmFwcGVyO1xyXG59XHJcblxyXG5leHBvcnQge1xyXG4gIG51bWJlckZvcm1hdCxcclxuICBnZXROdW1iZXJGb3JtYXR0ZXIsXHJcbiAgZ2V0QnJvd3NlcixcclxuICBnZXRWaWRlb0lkLFxyXG4gIGlzSW5WaWV3cG9ydCxcclxuICBpc1ZpZGVvTG9hZGVkLFxyXG4gIGluaXRpYWxpemVMb2dnaW5nLFxyXG4gIGdldENvbG9yRnJvbVRoZW1lLFxyXG4gIGxvY2FsaXplLFxyXG4gIHF1ZXJ5U2VsZWN0b3IsXHJcbiAgcXVlcnlTZWxlY3RvckFsbCxcclxuICBjcmVhdGVPYnNlcnZlcixcclxufTtcclxuIiwiaW1wb3J0IHsgY29uZmlnIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xyXG5pbXBvcnQgeyBnZXRCcm93c2VyLCBsb2NhbGl6ZSB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5cclxuY29uc3QgUEFUUkVPTl9KT0lOX1VSTCA9IFwiaHR0cHM6Ly93d3cucGF0cmVvbi5jb20vam9pbi9yZXR1cm55b3V0dWJlZGlzbGlrZS9jaGVja291dD9yaWQ9ODAwODY0OVwiO1xyXG5jb25zdCBTVVBQT1JUX0RPQ19VUkwgPSBjb25maWcubGlua3M/LmhlbHAgPz8gXCJodHRwczovL3JldHVybnlvdXR1YmVkaXNsaWtlLmNvbS9oZWxwXCI7XHJcbmNvbnN0IENPTU1VTklUWV9VUkwgPSBjb25maWcubGlua3M/LmRpc2NvcmQgPz8gXCJodHRwczovL2Rpc2NvcmQuZ2cvbVluRVNZNE1kNVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluaXRDaGFuZ2Vsb2dQYWdlKCkge1xyXG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRpbmdcIikge1xyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgc2V0dXApO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzZXR1cCgpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAgYXBwbHlMb2NhbGVNZXRhZGF0YSgpO1xyXG4gIGxvY2FsaXplSHRtbFBhZ2UoKTtcclxuICBkZWNvcmF0ZVNjcmVlbnNob3RQbGFjZWhvbGRlcnMoKTtcclxuICBiaW5kQWN0aW9ucygpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhcHBseUxvY2FsZU1ldGFkYXRhKCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBicm93c2VyTG9jYWxlID0gY2hyb21lPy5pMThuPy5nZXRNZXNzYWdlPy4oXCJAQHVpX2xvY2FsZVwiKTtcclxuICAgIGlmIChicm93c2VyTG9jYWxlKSB7XHJcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nID0gYnJvd3NlckxvY2FsZTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5kZWJ1ZyhcIlVuYWJsZSB0byByZXNvbHZlIFVJIGxvY2FsZVwiLCBlcnJvcik7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBsb2NhbGl6ZUh0bWxQYWdlKCkge1xyXG4gIGNvbnN0IGVsZW1lbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJodG1sXCIpO1xyXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBlbGVtZW50cy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcclxuICAgIGNvbnN0IGVsZW1lbnQgPSBlbGVtZW50c1tpbmRleF07XHJcbiAgICBjb25zdCBvcmlnaW5hbCA9IGVsZW1lbnQuaW5uZXJIVE1MLnRvU3RyaW5nKCk7XHJcbiAgICBjb25zdCBsb2NhbGl6ZWQgPSBvcmlnaW5hbC5yZXBsYWNlKC9fX01TR18oXFx3KylfXy9nLCAobWF0Y2gsIGtleSkgPT4ge1xyXG4gICAgICByZXR1cm4ga2V5ID8gbG9jYWxpemUoa2V5KSA6IFwiXCI7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAobG9jYWxpemVkICE9PSBvcmlnaW5hbCkge1xyXG4gICAgICBlbGVtZW50LmlubmVySFRNTCA9IGxvY2FsaXplZDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlY29yYXRlU2NyZWVuc2hvdFBsYWNlaG9sZGVycygpIHtcclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiW2RhdGEtc2NyZWVuc2hvdF1cIikuZm9yRWFjaCgod3JhcHBlcikgPT4ge1xyXG4gICAgY29uc3QgdHlwZSA9IHdyYXBwZXIuZ2V0QXR0cmlidXRlKFwiZGF0YS1zY3JlZW5zaG90XCIpO1xyXG4gICAgY29uc3QgbGFiZWxLZXkgPSBnZXRQbGFjZWhvbGRlckxhYmVsS2V5KHR5cGUpO1xyXG4gICAgaWYgKCFsYWJlbEtleSkgcmV0dXJuO1xyXG5cclxuICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gd3JhcHBlci5xdWVyeVNlbGVjdG9yKFwiLnJ5ZC1mZWF0dXJlLWNhcmRfX3BsYWNlaG9sZGVyXCIpO1xyXG4gICAgaWYgKCFwbGFjZWhvbGRlcikgcmV0dXJuO1xyXG5cclxuICAgIGNvbnN0IGxhYmVsID0gbG9jYWxpemUobGFiZWxLZXkpO1xyXG4gICAgcGxhY2Vob2xkZXIuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImltZ1wiKTtcclxuICAgIHBsYWNlaG9sZGVyLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgbGFiZWwpO1xyXG4gICAgcGxhY2Vob2xkZXIudGl0bGUgPSBsYWJlbDtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0UGxhY2Vob2xkZXJMYWJlbEtleSh0eXBlKSB7XHJcbiAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICBjYXNlIFwidGltZWxpbmVcIjpcclxuICAgICAgcmV0dXJuIFwiY2hhbmdlbG9nX3NjcmVlbnNob3RfbGFiZWxfdGltZWxpbmVcIjtcclxuICAgIGNhc2UgXCJtYXBcIjpcclxuICAgICAgcmV0dXJuIFwiY2hhbmdlbG9nX3NjcmVlbnNob3RfbGFiZWxfbWFwXCI7XHJcbiAgICBjYXNlIFwidGVhc2VyXCI6XHJcbiAgICAgIHJldHVybiBcImNoYW5nZWxvZ19zY3JlZW5zaG90X2xhYmVsX3RlYXNlclwiO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBiaW5kQWN0aW9ucygpIHtcclxuICBjb25zdCBicm93c2VyID0gZ2V0QnJvd3NlcigpO1xyXG5cclxuICBjb25zdCB1cGdyYWRlQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyeWQtY2hhbmdlbG9nLXVwZ3JhZGVcIik7XHJcbiAgaWYgKHVwZ3JhZGVCdXR0b24pIHtcclxuICAgIHVwZ3JhZGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICBvcGVuRXh0ZXJuYWwoUEFUUkVPTl9KT0lOX1VSTCwgYnJvd3Nlcik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN1cHBvcnRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJ5ZC1jaGFuZ2Vsb2ctc3VwcG9ydFwiKTtcclxuICBpZiAoc3VwcG9ydEJ1dHRvbikge1xyXG4gICAgc3VwcG9ydEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIG9wZW5FeHRlcm5hbChTVVBQT1JUX0RPQ19VUkwsIGJyb3dzZXIpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb250YWN0QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyeWQtY2hhbmdlbG9nLWNvbnRhY3RcIik7XHJcbiAgaWYgKGNvbnRhY3RCdXR0b24pIHtcclxuICAgIGNvbnRhY3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICBvcGVuRXh0ZXJuYWwoQ09NTVVOSVRZX1VSTCwgYnJvd3Nlcik7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9wZW5FeHRlcm5hbCh1cmwsIGJyb3dzZXIpIHtcclxuICBpZiAoIXVybCkgcmV0dXJuO1xyXG5cclxuICB0cnkge1xyXG4gICAgaWYgKGJyb3dzZXIgJiYgYnJvd3Nlci50YWJzICYmIHR5cGVvZiBicm93c2VyLnRhYnMuY3JlYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgYnJvd3Nlci50YWJzLmNyZWF0ZSh7IHVybCB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmRlYnVnKFwidGFicy5jcmVhdGUgdW5hdmFpbGFibGUsIGZhbGxpbmcgYmFja1wiLCBlcnJvcik7XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgd2luZG93Lm9wZW4odXJsLCBcIl9ibGFua1wiLCBcIm5vb3BlbmVyXCIpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLndhcm4oXCJGYWlsZWQgdG8gb3BlbiBleHRlcm5hbCB1cmxcIiwgdXJsLCBlcnJvcik7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IGluaXRDaGFuZ2Vsb2dQYWdlIH0gZnJvbSBcIi4vc3JjL2NoYW5nZWxvZ1wiO1xyXG5cclxuaW5pdENoYW5nZWxvZ1BhZ2UoKTtcclxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==