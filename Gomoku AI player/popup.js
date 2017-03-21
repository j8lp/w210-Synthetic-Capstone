/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2016 Eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";


let page = null;

function onLoad()
{

  document.getElementById("enabled").addEventListener("click", toggleEnabled, false);
  document.getElementById("singlemove").addEventListener("click", activateClickHide, false);
  document.getElementById("clickhide-cancel").addEventListener("click", cancelClickHide, false);

  // Set up collapsing of menu items
  for (let collapser of document.getElementsByClassName("collapse"))
  {
    collapser.addEventListener("click", toggleCollapse, false);
    if (!Prefs[collapser.dataset.option])
      document.getElementById(collapser.dataset.collapsable).classList.add("collapsed");
  }
}

function toggleEnabled()
{
  let disabled = document.body.classList.toggle("disabled");
  if (disabled)
  {

  }
  else
  {
    // Remove any exception rules applying to this URL

  }
}

function activateClickHide()
{
  document.body.classList.add("clickhide-active");
  page.sendMessage({type: "composer.content.startPickingElement"});

  // Close the popup after a few seconds, so user doesn't have to
 // activateClickHide.timeout = window.setTimeout(ext.closePopup, 5000);
}

function cancelClickHide()
{
  if (activateClickHide.timeout)
  {
    window.clearTimeout(activateClickHide.timeout);
    activateClickHide.timeout = null;
  }
  document.body.classList.remove("clickhide-active");
  page.sendMessage({type: "composer.content.finished"});
}

function toggleCollapse(event)
{
  let collapser = event.currentTarget;
  Prefs[collapser.dataset.option] = !Prefs[collapser.dataset.option];
  collapser.parentNode.classList.toggle("collapsed");
}

 chrome.tabs.query({
    active: !0,
    currentWindow: !0
}, function(a) {
    window.domain = new URL(a[0].url).hostname.replace("www.", ""), "linkedin.com" == window.domain ? chrome.tabs.query({
        active: !0,
        currentWindow: !0
    }, function(a) {
        chrome.tabs.sendMessage(a[0].id, {
            subject: "linkedin_page_type"
        }, function(a) {
            "undefined" != typeof a && "profile" == a.linkedin_page_type ? LinkedinProfile.launch() : "undefined" != typeof a && "search" == a.linkedin_page_type ? LinkedinSearch.launch() : ($("#domain-search").show(), 
            DomainSearch.launch());
        });
    }) : ($("#domain-search").show(), DomainSearch.launch());
});
chrome.tabs.query({active: true, currentWindow: true}, onLoad)

document.addEventListener("DOMContentLoaded", onLoad, false);
