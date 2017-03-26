chrome.tabs.onUpdated.addListener(function(id, info, tab){
    var url = tab.url
    var isBGA = url.includes("boardgamearena.com/gomoku")
    if (isBGA){
        chrome.browserAction.setPopup({tabId:id, popup:"popup.html"})
        chrome.browserAction.setIcon({tabId:id, path:"icons/icon_enabled.png"})
    } else{
        chrome.browserAction.setPopup({tabId:id, popup:"popup_inactive.html"})
        chrome.browserAction.setIcon({tabId:id, path:"icons/icon_inactive.png"})
        //chrome.tabs.executeScript(null, {"file": "path/to/extension.js"});
}});
