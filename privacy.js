function getChrome() {
  if (chrome.runtime.getBrowserInfo == undefined) {
    return true;
  }
  return false;
}

function onSet(result) {
  if (result) {
    console.log("->: Value was updated");
  } else {
    console.log("-X: Value was not updated");
  }
}

// This disables queries to centralized databases of bad URLs to screen for
// risky sites in your browser
function disableHyperlinkAuditing() {
  if (!getChrome()) {
    var setting = browser.privacy.websites.hyperlinkAuditingEnabled.set({
      value: false
    });
    console.log("Disabling hyperlink auditing/val=", {
      value: false
    });
    setting.then(onSet);
  }
}

// This enables first-party isolation
function enableFirstPartyIsolation() {
  if (!getChrome()) {
    var setting = browser.privacy.websites.firstPartyIsolate.set({
      value: true
    });
    console.log("Enabling first party isolation/val=", {
      value: true
    });
    setting.then(onSet);
  }
}

// This rejects tracking cookies and third-party cookies but it
// LEAVES "Persistent" Cookies unmodified in favor of an option in the content
// interface for now
function disableEvilCookies() {
  if (!getChrome()) {
    var getting = browser.privacy.websites.cookieConfig.get({});
    getting.then(got => {
      var setting = browser.privacy.websites.cookieConfig.set({
        value: {
          behavior: "reject_third_party",
          nonPersistentCookies: got.value.nonPersistentCookies
        }
      });
      console.log("Setting cookie behavior/val=", {
        value: {
          behavior: "reject_third_party",
          nonPersistentCookies: got.value.nonPersistentCookies
        }
      });
      setting.then(onSet);
    });
  }
}

// Make sure that they're gone
/*function disableBadCookies(){
    var setting = browser.privacy.websites.thirdPartyCookiesAllowed.set({
      value: false
    });
    console.log("Disabling third party cookies/val=", {
      value: false
    })
    setting.then(onSet);
}*/

// this disables the use of referrer headers
function disableReferrers() {
  if (!getChrome()) {
    var setting = browser.privacy.websites.referrersEnabled.set({
      value: false
    });
    console.log("Disabling referrer headers/val=", {
      value: false
    });
    setting.then(onSet);
  }
}

// enable fingerprinting resistent features(letterboxing and stuff)
function enableResistFingerprinting() {
  if (!getChrome()) {
    var setting = browser.privacy.websites.referrersEnabled.set({
      value: true
    });
    console.log("Enabling resist fingerprinting/val=", {
      value: true
    });
    setting.then(onSet);
  }
}

// This is essentially a blocklist of clearnet web-sites known to do bad tracking
function enableTrackingProtection() {
  if (!getChrome()) {
    var setting = browser.privacy.websites.trackingProtectionMode.set({
      value: "always"
    });
    console.log("Enabling tracking protection/val=", {
      value: "always"
    });
    setting.then(onSet);
  }
}

// This disables protected content, which is a form of digital restrictions
// management dependent on identifying information
function disableDigitalRestrictionsManagement() {
  if (!getChrome()) {
    var gettingInfo = browser.runtime.getPlatformInfo();
    gettingInfo.then(got => {
      if (got.os == "win") {
        var setting = browser.privacy.websites.protectedContentEnabled.set({
          value: false
        });
        console.log(
          "Setting Protected Content(Digital Restrictions Management) false/val=",
          {
            value: false
          }
        );
        setting.then(onSet);
      }
    });
  }
}

function setAllPrivacy() {
  disableHyperlinkAuditing();
  enableFirstPartyIsolation();
  disableEvilCookies();
  disableReferrers();
  enableTrackingProtection();
  enableResistFingerprinting();
  disableDigitalRestrictionsManagement();
}

setAllPrivacy();

function ResetPeerConnection() {
  if (!getChrome()) {
    browser.privacy.network.peerConnectionEnabled.set({
      value: false
    });
    browser.privacy.network.networkPredictionEnabled.set({
      value: false
    });
  }
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value: "disable_non_proxied_udp"
  });
  console.log("Re-disabled WebRTC");
}

function EnablePeerConnection() {
  if (!getChrome()) {
    browser.privacy.network.peerConnectionEnabled.set({
      value: true
    });
    browser.privacy.network.networkPredictionEnabled.set({
      value: false
    });
  }
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value: "disable_non_proxied_udp"
  });
  console.log("Enabled WebRTC");
}

ResetPeerConnection();

function ResetDisableSavePasswords() {
  browser.privacy.services.passwordSavingEnabled.set({
    value: false
  });
  console.log("Re-disabled saved passwords");
}

function EnableSavePasswords() {
  browser.privacy.services.passwordSavingEnabled.set({
    value: true
  });
  console.log("Enabled saved passwords");
}

//ResetDisableSavePasswords()

var defaultSettings = {
  since: "forever",
  dataTypes: ["downloads", "passwords", "formData", "localStorage", "history"]
};

var appSettings = {
  since: "forever",
  dataTypes: [""]
};

function onError(e) {
  console.error(e);
}

function checkStoredSettings(storedSettings) {
  chrome.storage.local.set(appSettings);
}

if (!getChrome()) {
  const gettingStoredSettings = browser.storage.local.get();
  gettingStoredSettings.then(checkStoredSettings, onError);
}

function clearCookiesContext(cookieStoreId) {}

function forgetBrowsingData(storedSettings) {
  function getSince(selectedSince) {
    if (selectedSince === "forever") {
      return 0;
    }

    const times = {
      hour: () => {
        return 1000 * 60 * 60;
      },
      day: () => {
        return 1000 * 60 * 60 * 24;
      },
      week: () => {
        return 1000 * 60 * 60 * 24 * 7;
      }
    };

    const sinceMilliseconds = times[selectedSince].call();
    return Date.now() - sinceMilliseconds;
  }

  function getTypes(selectedTypes) {
    let dataTypes = {};
    for (let item of selectedTypes) {
      dataTypes[item] = true;
    }
    return dataTypes;
  }

  const since = getSince(defaultSettings.since);
  const dataTypes = getTypes(defaultSettings.dataTypes);

  function notify() {
    let dataTypesString = Object.keys(dataTypes).join(", ");
    let sinceString = new Date(since).toLocaleString();
    browser.notifications.create({
      type: "basic",
      title: "Removed browsing data",
      message: `Removed ${dataTypesString}\n for i2pbrowser`
    });
  }

  function deepCleanHistory(historyItems) {
    console.log("Deep cleaning history");
    for (item of historyItems) {
      if (i2pHost(item.url)) {
        console.log(item);
        browser.history.deleteUrl({
          url: item.url
        });
        browser.browsingData.removeCache({});
        console.log("cleared Cache");
        browser.browsingData
          .removePasswords({
            hostnames: [i2pHostName(item.url)],
            since: since
          })
          .then(onGot);
        console.log("cleared Passwords");
        browser.browsingData
          .removeDownloads({
            hostnames: [i2pHostName(item.url)],
            since: since
          })
          .then(onGot);
        console.log("cleared Downloads");
        browser.browsingData
          .removeFormData({
            hostnames: [i2pHostName(item.url)],
            since: since
          })
          .then(onGot);
        console.log("cleared Form Data");
        browser.browsingData
          .removeLocalStorage({
            hostnames: [i2pHostName(item.url)],
            since: since
          })
          .then(onGot);
        console.log("cleared Local Storage");

        contexts = browser.contextualIdentities.query({
          name: "i2pbrowser"
        });

        function deepCleanCookies(cookies) {
          console.log("COOKIES cookies", cookies);
          for (cookie of cookies) {
            console.log("COOKIE cookie", cookie);
            var removing = browser.cookies.remove({
              firstPartyDomain: cookie.firstPartyDomain,
              name: cookie.name,
              url: item.url
            });
            removing.then(onGot, onError);
          }
        }

        function deepCleanContext(cookieStoreIds) {
          console.log("CLEANING cleaning,", cookieStoreIds);
          for (cookieStoreId of cookieStoreIds) {
            console.log("CONTEXT context", cookieStoreId);
            var removing = browser.cookies.getAll({
              firstPartyDomain: null,
              storeId: cookieStoreId.cookieStoreId
            });
            removing.then(deepCleanCookies, onError);
          }
        }

        contexts.then(deepCleanContext, onError);
      }
    }
    notify();
  }

  var searching = browser.history.search({
    text: "i2p",
    startTime: 0
  });

  searching.then(deepCleanHistory);

  setAllPrivacy();
  ResetPeerConnection();
}

function i2pHostName(url) {
  let hostname = "";
  if (url.indexOf("://") > -1) {
    hostname = url.split("/")[2];
  } else {
    hostname = url.split("/")[0];
  }
  return hostname;
}

function i2pHost(url) {
  let hostname = i2pHostName(url);
  return hostname.endsWith(".i2p");
}

function onGot(contexts) {
  if (contexts != null) {
    for (let context of contexts) {
      console.log(context);
    }
  }
}

function onError(e) {
  console.error(e);
}

//browser.contextualIdentities.query("i2pbrowser").then(clearCookiesContext, onError);
