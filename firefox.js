/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

addEventListener("load", function massforget_load(){ // local scope
  function $(id) document.getElementById(id);

  // Helper: Generate a unique array
  function unique(a) {
    let u = Object.create(null);
    let rv = [];
    for (let i of a) {
      if (i in u) {
        continue;
      }
      rv.push(i);
      u[i] = null;
    }
    return rv;
  }

  // Helper build list of host that are in the current selection
  function buildHosts() {
    // Recursive adding of hosts
    function add(aItem) {
      if (PlacesUtils.nodeIsHost(aItem)) {
        let queries = aItem.getQueries({});
        hosts.push(queries[0].domain);
      }
      else if (PlacesUtils.nodeIsContainer(aItem)) {
        for (let item of PlacesUtils.getURLsForContainerNode(aItem)) {
          add(item);
        }
      }
      else if (!aItem.isBookmark){
        try {
          hosts.push(PlacesUtils._uri(aItem.uri).host);
        }
        catch (ex) {/* no op*/}
      }
    }

    let hosts = [];
    try {
      // View and node
      let view = PlacesUIUtils.getViewForNode(document.popupNode);
      let node = view.selectedNode;

      // Process current selection
      // Firefox 4.0 || 3.6
      for (let sn of view.selectedNodes) {
        add(sn);
      }
    }
    catch (ex) {
      Cu.reportError(ex);
    }
    return hosts;
  }

  // Purge a list of hosts
  function purge(hosts) {
    for (var host of unique(hosts)) {
      removeData(host);
    }
  }

  function baseDomain(uri) {
    try {
      return Services.eTLD.getBaseDomainFromHost(uri);
    }
    catch (ex) {
      if (/NS_ERROR_HOST_IS_IP_ADDRESS/.test(ex)) {
        return uri;
      }
      throw ex;
    }
  }

  // remove listener again
  removeEventListener("load", massforget_load, false);

  // Feature detect what is actually available
  const removeDataHost = (window.ForgetAboutSite || window.ClearRecentHistory || window.PlacesUIUtils.privateBrowsing);
  const removeData = removeDataHost.removeDataFromDomain.bind(removeData);

  // multiple sites
  $("cmd_massforget_forgetmultiple").addEventListener("command", function() {
    purge(buildHosts());
  }, true);

  // single/multiple domain(s)
  $("cmd_massforget_forgetdomains").addEventListener("command", function() {
    // map to effective base domain
    purge(buildHosts().map(function(e) baseDomain(e)));
  }, true);

}, false); // load listener

/* vim: set et ts=2 sw=2 : */
