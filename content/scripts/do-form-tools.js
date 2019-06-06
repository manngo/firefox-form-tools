/*	Do Form Tools
	================================================ */

	'use strict';
	const testing=false;
	/* global chrome, addStyleElement, toggleAttribute, widgets, say, smartQuotes, handleTab, handleQuotes */
	/* exported doit, testing */
	/* jshint -W100 */


/*	Listener
	================================================ */
	if(!inited) {
		chrome.runtime.onMessage.addListener(doFormTools);
	}

/*	Global Variables
	================================================ */

	var inited,		//	once only
		options,	//	settings
		textareas,	//	pre-existing text areas
		zoom,		//	zoom box
		active,		//	addon active
		managed=[];	//	elements affected by form-tools

/*	init
	================================================ */

	function init(request) {
		//	Variables

		//	Pre-existing Text Areas
			textareas=document.querySelectorAll('textarea');

		//	Zoom Box
//			zoom=doZoomBox(request);

		//	Event Handlers
			document['form-tools']={};
//			document['form-tools'].handleTab=handleTab.bind(null,request.options);
//			document['form-tools'].handleQuotes=handleQuotes.bind(null,request.options);
			document['form-tools'].handleTab=handleTab;
//			document['form-tools'].handleQuotes=handleQuotes;

		//	Context Menus
//			doContextMenus(true);

		//	Once Only
			return true;
	}

/*	Zoom Box
	================================================ */

	function doZoomBox(request) {
		var background,zoom,css,textarea;
		var ajax = new XMLHttpRequest();

		//	Create Zoom Box
			background=document.createElement('div');
			background.setAttribute('id',`${request.options.zoomPrefix}-background`);
			document.body.appendChild(background);

			zoom=document.createElement('div');
			zoom.setAttribute('id',request.options.zoomPrefix);
			zoom.innerHTML=request.zoom;

			document.body.appendChild(zoom);

		//	CSS
			css=chrome.extension.getURL("/content/zoom-template.css");
			ajax.onreadystatechange=process;
			ajax.open('get', css, true);
			ajax.send(null);

			function process() {
				if (this.readyState==4 && this.status==200) {
					css=this.responseText.replace(new RegExp('{id}','g'),request.options.zoomPrefix);
					addStyleElement(css);
					zoom.style.left = (window.innerWidth - zoom.offsetWidth)/2 + 'px';
					zoom.style.top = (window.innerHeight - zoom.offsetHeight)/2 + 'px';
					zoom.style.position='fixed';
					zoom.style.display=background.style.display='none';
				}
			}

		//	Buttons

			textarea=zoom.querySelector('textarea');

			zoom.querySelector('button#do-zoom-convert-quotes').onclick=function() {
				textarea.value=smartQuotes(textarea.value);
			};

			zoom.querySelector('button#do-zoom-smart-quotes').onclick=function() {
				toggleAttribute(this,'selected');
				if(this.hasAttribute('selected')) {
					textarea.addEventListener('keypress',handleQuotes);
					this.title='Normal "Dumb" Quotes"';
				}
				else {
					textarea.removeEventListener('keypress',handleQuotes);
					this.title='Enable “Smart” Quotes"';
				}

				textarea.focus();
			};

		//	Draggable

			widgets.draggable(zoom,zoom.querySelector('div'));

		//	zoomIn Function
			function zoomIn(input) {
				zoom.style.display=background.style.display='flex';
				textarea.value=input.value;
				zoom.querySelector('button#do-zoom-ok').onclick=zoomOut.bind(this,true);
				zoom.querySelector('button#do-zoom-cancel').onclick=zoomOut.bind(this,false);
				function zoomOut(keep) {
					if(keep) input.value=textarea.value;
					zoom.style.display=background.style.display='none';
					input.focus();
				}
			}

		return {
			"element": zoom,
			"open": zoomIn
		};

	}

/*	Context Menus
	================================================ */

	function doContextMenus(enable) {
		/*	Context Menus
			================================================
			input[text]		zoom,convert-quotes,tabs,smart-quotes
			input[email]	zoom
			input[password]	password,paste-password
			textarea		convert-quotes,tabs,smart-quotes
			================================================ */

			var contextmenu={
				'zoom':		{label: 'Zoom …', onclick: handleZoomMenu},
				'convertQuotes':	{label: 'Convert Quotes …', onclick: handleConvertQuotesMenu},
				'smartQuotes':	{label: 'Smart Quotes', onclick: handleSmartQuotesMenu, type: 'checkbox'},	//	toggle
				'tabs':		{label: 'Allow Tabs', onclick: handleTabMenu, type: 'checkbox'},				//	toggle
				'password':	{label: 'Show Password …', onclick: handleShowPasswordMenu},
				'pastePassword':	{label: 'Allow Pasting Password …', onclick: handlePastePasswordMenu}
			};

			contextMenu('form-tools-menu-text',[contextmenu.zoom,contextmenu.convertQuotes,contextmenu.tabs,contextmenu.smartQuotes]);
			contextMenu('form-tools-menu-email',[contextmenu.zoom]);
			contextMenu('form-tools-menu-password',[contextmenu.password,contextmenu.pastePassword]);
			contextMenu('form-tools-menu-textarea',[contextmenu.convertQuotes,contextmenu.tabs,contextmenu.smartQuotes]);

		//	Attach

			var elements=document.querySelectorAll('input[type="text"]');
			if(elements) for(var i=0;i<elements.length;i++) {
				if(enable) elements[i].setAttribute('contextmenu','form-tools-menu-text');
				else elements[i].removeAttribute('contextmenu');
			}
			var elements=document.querySelectorAll('input[type="email"]');
			if(elements) for(var i=0;i<elements.length;i++) elements[i].setAttribute('contextmenu','form-tools-menu-email');
			var elements=document.querySelectorAll('input[type="password"]');
			if(elements) for(var i=0;i<elements.length;i++) elements[i].setAttribute('contextmenu','form-tools-menu-password');
			var elements=document.querySelectorAll('textarea');
			if(elements) for(var i=0;i<elements.length;i++) elements[i].setAttribute('contextmenu','form-tools-menu-textarea');

		//	Support Functions

			function contextMenu(id,menuitems) {
				var menu=document.createElement('menu');
				menu.setAttribute('id',id);
				menu.setAttribute('type','context');
				for(var i=0;i<menuitems.length;i++) {
					var menuitem=document.createElement('menuitem');
					menuitem.innerHTML=menuitems[i].label;
					menuitem.onclick=menuitems[i].onclick;
					if(menuitems[i].type) menuitem.setAttribute('type',menuitems[i].type);
					menu.appendChild(menuitem);
				}
				document.body.appendChild(menu);
				return menu;
			}
	}

	function setContextMenus(enable) {
		var textElements=document.querySelectorAll('input[type="text"]');
		var emailElements=document.querySelectorAll('input[type="email"]');
		var passwordElements=document.querySelectorAll('input[type="password"]');
		var textareaElements=document.querySelectorAll('textarea');

		if(textElements) for(var i=0;i<textElements.length;i++) {
			if(enable) textElements[i].setAttribute('contextmenu','form-tools-menu-text');
			else textElements[i].removeAttribute('contextmenu');
		}
		if(emailElements) for(var i=0;i<emailElements.length;i++) {
			if(enable) emailElements[i].setAttribute('contextmenu','form-tools-menu-email');
			else emailElements[i].removeAttribute('contextmenu');
		}
		if(passwordElements) for(var i=0;i<passwordElements.length;i++) {
			if(enable) passwordElements[i].setAttribute('contextmenu','form-tools-menu-password');
			else passwordElements[i].removeAttribute('contextmenu');
		}
		if(textareaElements) for(var i=0;i<textareaElements.length;i++) {
			if(enable) textareaElements[i].setAttribute('contextmenu','form-tools-menu-textarea');
			else textareaElements[i].removeAttribute('contextmenu');
		}
	}


/*	Dispatch
	================================================ */

	function doFormTools(request, sender, sendResponse) {
		if(!inited) inited=init(request);

		//	Options
			options=request.options;
			active=request.selected.indexOf('do-enable')>-1;

//		document['form-tools'].handleTab=handleTab.bind(null,request.options);
//		document['form-tools'].handleQuotes=handleQuotes.bind(null,request.options);


		//	Do Init
			if(request.action=='do-init') {
				for(var i=0;i<request.selected.length;i++) dispatch(request.selected[i]);
			}
			else dispatch(request.action,request);

		//	Dispatch: legacy.js:do-form-tools:dispatch

			function dispatch(action) {
				var enable=request.selected.indexOf(action)>-1;
				switch(action) {
					case 'do-enable':
						doEnable(enable);			//	toggle
						break;
					default:
						say(`oops ${action}`);
				}
			}
	}

	function doEnable(enabled) {
		say(`Enabled: ${enabled}`);
		setContextMenus(enabled);
	}


	/*	Live Smart Quotes
		============================================ */


	/*	Convert to Smart Quotes
		============================================ */

		function handleConvertQuotesMenu(e) {
			var element=document.activeElement;
			element.value=smartQuotes(element.value);
		}

	/*	Show Passwords
		============================================ */

		function handleShowPasswordMenu() {
			showPassword(document.activeElement);
		}

		function showPassword(password) {
			password.setAttribute('type','text');
			window.setTimeout(function() {
				password.setAttribute('type','password');
			},options.passwordDelay*1000);
		}


/*  Event Handlers
    ================================================ */

	function handleTabMenu(e) {
		var element=document.activeElement;
		if(toggleItem(element,'form-tools-tabs')) {
			element.style.cssText=`-moz-tab-size: ${options.tabWidth}; tab-size: ${options.tabWidth};`;
			element.addEventListener('keydown',document['form-tools'].handleTab);
		}
		else {
			element.removeEventListener('keydown',document['form-tools'].handleTab);
		}
	}

	function handleSmartQuotesMenu(e) {
		var element=document.activeElement;
		if(toggleItem(element,'form-tools-smart-quotes')) {
			element.addEventListener('keypress',document['form-tools'].handleQuotes);
		}
		else {
			element.removeEventListener('keypress',document['form-tools'].handleQuotes);
		}
	}

//	Zoom Key: legacy.js:do-form-tools:handleZoomKey

	function handlePastePasswordMenu(e) {
		document.activeElement.removeAttribute('onpaste');
	}


	function handleZoomMenu(e) {
		if(!active) {
			say('not active');
		}
		else {
			say('seems to be active');
			zoom.open(document.activeElement);
		}
	}

/*	Support Functions
    ================================================ */

	function toggleItem(item,attribute) {
		if(item.hasAttribute(attribute)) {
			item.checked=false;
			item.removeAttribute(attribute);
		}
		else {
			item.checked=true;
			item.setAttribute(attribute,true);
		}
		return item.checked;
	}
