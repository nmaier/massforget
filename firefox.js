/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mass Forget.
 *
 * The Initial Developer of the Original Code is Nils Maier
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *	 Nils Maier <MaierMan@web.de>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

addEventListener('load', function(){ // local scope
	// remove listener again
	removeEventListener('load', arguments.callee, false);
	
	// For use in "forget domain(s)"
	let baseDomain = Cc["@mozilla.org/network/effective-tld-service;1"]
		.getService(Ci.nsIEffectiveTLDService).getBaseDomainFromHost;

	function $(id) document.getElementById(id);
	// Helper: Generate a unique array 
	function unique(array) array.filter(function(e) !((e in this) || (this[e] = null)), {});

	// Helper build list of host that are in the current selection
	function buildHosts() {
		let hosts = [];
		try {
			// View and node
			let view = PlacesUIUtils.getViewForNode(document.popupNode);
			let node = view.selectedNode;
			
			// Recursive adding of hosts
			function add(aItem) {
				
				if (PlacesUtils.nodeIsHost(aItem)) {
					let queries = aItem.getQueries({});
					hosts.push(queries[0].domain);
				}				
				else if (PlacesUtils.nodeIsContainer(aItem)) {
					for each (let item in PlacesUtils.getURLsForContainerNode(aItem)) {
						arguments.callee(item);
					}
				}
				else if (!aItem.isBookmark){
					try {
						hosts.push(PlacesUtils._uri(aItem.uri).host);
					}
					catch (ex) {/* no op*/}
				}
			}
			
			// Process current selection
			// Firefox 4.0 || 3.6
			for each (let sn in (view.selectedNodes || view.getSelectionNodes())) {
				add(sn);
			}
		}
		catch (ex) {
			Components.utils.reportError(ex);
		}
		return hosts;
	}
	
	// Purge a list of hosts
	function purge(hosts) {
		unique(hosts).forEach(function(e) PlacesUIUtils.privateBrowsing.removeDataFromDomain(e));
	}
	
	// multiple sites
	$('cmd_massforget_forgetmultiple').addEventListener('command', function() {
		purge(buildHosts());
	}, true);
	
	// single/multiple domain(s)
	$('cmd_massforget_forgetdomains').addEventListener('command', function() {
		// map to effective base domain
		purge(buildHosts().map(function(e) baseDomain(e)));
	}, true);
	
}, false); // load listener