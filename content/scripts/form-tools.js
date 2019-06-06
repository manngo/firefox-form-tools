	/*global chrome */
	/*exported doit, testClick */
	/* jshint unused: vars */
	/* jshint -W100 */

/*	Form Tools
	================================================

	Future Options & Enhancements

	3	Allow meta-tab for tab
		Which combination doesn’t interfere with OS?
	5	Stored CSS for zoom box

	9	Need to validate settings!!
	10	Change textarea to monospace …

		var style=window.getComputedStyle(textarea,null);
		var fontFamily=style.getPropertyValue('font-family');
		//	store fontFamily somewhere
		var styleFontFamily=textarea.style.fontFamily;	//	is it local?
		textarea.style.fontFamily='monospace';
		//	Restore:
		if(styleFontFamily) textarea.style.fontFamily=styleFontFamily;
		else textarea.style.fontFamily=null;

	11	Not just textareas?
	12	Buttons as well as context menus

	Note:	You cannot have variable property names
			Therefore:
				storage.tabId	won’t work
				storage[tabId]	will

	================================================ */

	'use strict';

	//	Hash
	//	See: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
		function hash(string) {
			string=string.split('');
			var result=string.reduce(doit,0)>>>0;
			return `0000000000000${result}`.substr(-12);
			function doit(previous,current) {
				return (previous << 5) - previous + current.charCodeAt(0);
			}
		}

	//	Callback for storage.set

		function showStorage(show) {
			chrome.storage.local.get(null,function(result) {
				var stuff={};
				if(show) {
					stuff.options=result.options;
					stuff.etc=result[tabId];
					alert(`Result: ${JSON.stringify(stuff)}`);
				}
			});
		}

	//	Initialise Variables

		var tabId='';					//	current tab

		var storage={					//	JSON for storage
			"selected": "",
			"tempOptions": "",
			"enabled": false
		};
		var data={						//	live
			"selected": {},
			"options": {				//	defaults
				tabWidth: 4,
				passwordDelay: 10,
				ctrlQuote: "dumb",
				zoomPrefix: "zoom-box",
				tab: "\t"
			},
			"tempOptions": {},
			"enabled": false
		};

	//	Intialise Code

		window.addEventListener('load',init);
		document.addEventListener('click',doit);

	//	Load Options

		chrome.storage.local.get('options',restoreOptions);
		function restoreOptions(result) {
			if(!result.options) return;
			data.options.tabWidth=result.options.tabWidth||data.options.tabWidth;
			data.options.passwordDelay=result.options.passwordDelay||data.options.passwordDelay;
			data.options.ctrlQuote=result.options.ctrlQuote||data.options.ctrlQuote;
			data.options.zoomPrefix=result.options.zoomPrefix||data.options.zoomPrefix;
			data.options.tab = result.options.tab||'\t';
		}

	//	Support Functions

		function saveStorage(show) {
			var object={};			//	can’t use variables as property names
			object[tabId]=storage;
			chrome.storage.local.set(object,showStorage.bind(this,show));
		}

	function init() {
		var query={
			active:true,
			windowType:"normal",
			currentWindow: true
		};
		setOptionButtons();
		var now=new Date; now=now.toString();
//		chrome.storage.local.set({"now":now},showStorage.bind(this,false));
		chrome.tabs.query(query,function(tabs) {
			var id=`000${tabs[0].id}`.substr(-3),
				url=`000000000000${hash(tabs[0].url)}`.substr(-12);
			tabId=`tab-${id}${url}`;

			chrome.storage.local.get(tabId,init2);

		});
	}

	function init2(result) {
		if (chrome.runtime.lastError) alert(`onGet: ${chrome.runtime.lastError}`);
		else {
			if(result && result[tabId]) {
				if(result[tabId].selected) {
					storage.selected=result[tabId].selected;
					data.selected=JSON.parse(storage.selected);
				}
				if(result[tabId].tempOptions) {
					storage.tempOptions=result[tabId].tempOptions;
					data.tempOptions=JSON.parse(storage.tempOptions);
				}
				if(result[tabId].enabled) {
					storage.enabled=result[tabId].enabled;
					data.enabled=JSON.parse(storage.enabled);
				}
			}
		}
//		if(data.enabled)
		dispatch('do-init',{"zoom": document.querySelector('template#zoom').innerHTML});

		init3();
	}

	function init3() {	//	Need to wait until after options above
		//	Local Settings

			restoreTempOptions();

		//	Toggles: legacy.js:form-tools:toggles
		//	Enabled
			if(data.enabled) document.getElementById('do-enable').setAttribute('selected',true);
			else document.getElementById('do-enable').removeAttribute('selected');

		//	Settings
			document.querySelector('button#do-settings').onclick=function(e) {
				chrome.runtime.openOptionsPage();
			};

	}

	function doit(e) {
		if(!e.target.matches('div#menu>button') || e.target.matches('.no-action')) return;
		var id=e.target.getAttribute('id');

		//	Toggles: legacy.js:form-tools:doit-toggles
		if(id=='do-enable') {
			if(data.enabled) {
				e.target.removeAttribute('selected');
				data.selected=[];
			}
			else {
				e.target.setAttribute('selected',true);
				data.selected=['do-enable'];
			}
			data.enabled=!data.enabled;
			storage.enabled=JSON.stringify(data.enabled);
			storage.selected=JSON.stringify(data.selected);
		}

		saveStorage(false);

		//	Dispatch
			dispatch(id);

		window.close();
	}


/*	Dispatch
	================================================ */

	function dispatch(action,more) {
		var options=Object.assign({},data.options,data.tempOptions);
		var request={"action": action, "selected": data.selected, "options": options};
		if(more) Object.assign(request,more);

		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, request,null,null);
		});
	}

/*	Temporary Options
	================================================ */

	function setOptionButtons() {
		var form=document.querySelector('form#options');
		var menu=document.querySelector('div#menu');

		document.querySelector('button#local-options').onclick=function(event) {
			showOptions();
			event.preventDefault();
		};
		function showOptions() {
			form.setAttribute('visible',true);
			menu.removeAttribute('visible');
		}
		function hideOptions() {
			menu.setAttribute('visible',true);
			form.removeAttribute('visible');
		}

		form['save-options'].onclick=function() {
			saveTempOptions();
			hideOptions();
		};
		form['reset-options'].onclick=function() {
			data.tempOptions={};
			storage.tempOptions='';
			saveStorage();
			hideOptions();
		};
		form['cancel-options'].onclick=hideOptions;
	}

	function saveTempOptions(event) {
		var form=document.querySelector('form#options');
		var options={};

		//	Read from Form
			data.tempOptions.passwordDelay=form['show-password-delay'].value*1||undefined;
			data.tempOptions.tabWidth=form['tab-width'].value*1||undefined;

			var ctrlQuote=form.querySelector('input[name="ctrl-quote"]:checked');
			data.tempOptions.ctrlQuote = ctrlQuote ? ctrlQuote.value : 'dumb';

			var tabKey=form.querySelector('input[name="tab-key"]:checked');
			data.tempOptions.tab = tabKey && tabKey.value=='spaces' ? ' '.repeat(data.tempOptions.tabWidth||data.options.tabWidth) : '\t';

		//	Save
			storage.tempOptions=JSON.stringify(data.tempOptions);
			saveStorage(false);

		//	Copy into options
			Object.assign(options,data.options,data.tempOptions);

		//	Re-initialise
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {"action": "do-init", "selected": data.selected, "options": options});
			});
			return false;
	}

	function restoreTempOptions() {
		var tabKey;

		var form=document.querySelector('form#options');

			form['show-password-delay'].placeholder=data.options.passwordDelay;
			form['show-password-delay'].value=data.tempOptions.passwordDelay||'';

			form['tab-width'].placeholder=data.options.tabWidth;
			form['tab-width'].value=data.tempOptions.tabWidth||'';

			if(data.tempOptions.tab) {
				tabKey = data.tempOptions.tab=='\t' ? 'tab' : 'spaces';
				form.querySelector(`input[value="${tabKey}"]`).checked=true;
			}

			tabKey = data.options.tab=='\t' ? 'tab' : 'spaces';
			form.querySelector(`input[value="${tabKey}"]`).parentNode.querySelector('span').style.fontWeight='bold';

			form.querySelector(`input[value="${data.options.ctrlQuote}"]`).parentNode.querySelector('span').style.fontWeight='bold';
			if(data.tempOptions.ctrlQuote) form.querySelector(`input[value="${data.tempOptions.ctrlQuote}"]`).checked=true;
	}
