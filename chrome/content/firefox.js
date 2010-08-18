addEventListener('load', function(){
	removeEventListener('load', arguments.callee, false);
	
	let eTLD = Cc["@mozilla.org/network/effective-tld-service;1"]
		.getService(Ci.nsIEffectiveTLDService);
	let baseDomain = eTLD.getBaseDomainFromHost;
	
	function $(id) document.getElementById(id);
	function unique(array) array.filter(function(e) !((e in this) || (this[e] = null)), {});
	
	function buildHosts() {
		let hosts = [];
		try {
			let view = PlacesUIUtils.getViewForNode(document.popupNode);
			let node = view.selectedNode;
			
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
					catch (ex) {}
				}
			}
			for each (let sn in (view.selectedNodes || view.getSelectionNodes())) {
				add(sn);
			}
		}
		catch (ex) {
			Components.utils.reportError(ex);
		}
		return hosts;
	}
	
	function purge(array) {
		unique(array).forEach(function(e) PlacesUIUtils.privateBrowsing.removeDataFromDomain(e));
	}
	
	$('cmd_massforget_forgetmultiple').addEventListener('command', function() {
		purge(buildHosts());
	}, true);
	
	$('cmd_massforget_forgetdomains').addEventListener('command', function() {
		purge(buildHosts().map(function(e) baseDomain(e)));
	}, true);
	
}, false);
