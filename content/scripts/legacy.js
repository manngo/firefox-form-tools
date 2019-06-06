/*	Legacy Code
	================================================ */

	'use strict';
	/*global storage,options */
	/*exported doit, testClick, dispatch */

	//	Dummy Variables

		var e,id,data,saveStorage;		//	form-tools:doit-toggles

	//	form-tools:toggles
		var toggles=[];					//	togglable elements
		doToggles();

		function doToggles() {
			toggles=document.querySelectorAll('div#menu>button.toggle');
			if(storage.selected) {
				var items=JSON.parse(storage.selected||'{}');
				for(var i=0;i<items.length;i++)
					if(document.getElementById(items[i]))
						document.getElementById(items[i]).setAttribute('selected',true);
			}
		}

	//	form-tools:doit-toggles

		if(Array.prototype.indexOf.call(toggles,e.target)>-1) {	//	if in toggles
			var items = storage.selected.length ? JSON.parse(storage.selected||'{}') : [];
			var i=items.indexOf(id);
			if(i<0) {	//	not selected
				e.target.setAttribute('selected',true);
				items.push(id);
			}
			else {
				e.target.removeAttribute('selected');
				items.splice(i,1);
			}
			data.selected=items;
			storage.selected=JSON.stringify(items);
			saveStorage();
		}

	//	do-form-tools:dispatch
		/* global request,doEnable,smartQuotes */

		function dispatch(action) {
			var enable=request.selected.indexOf(action)>-1;
			switch(action) {
				case 'do-enable':
					doEnable(enable);			//	toggle
					break;

				case 'do-show-passwords':
					doShowPasswords();
					break;
				case 'do-paste-password':
					doPastePassword(enable);	//	toggle
					break;

				case 'do-tab-textarea':
					doTabTextarea(enable);		//	toggle
					break;
				case 'do-smart-quotes':
					doSmartQuotes(enable);		//	toggle
					break;
				case 'do-convert-quotes':
					doConvertQuotes();
					break;

				case 'do-zoom':
					doZoom(enable);				//	toggle
					break;

				default:
					alert(`oops ${action}`);
			}
		}

	/*	Live Smart Quotes
		============================================ */

		function doSmartQuotes(enabled) {
			//	If only on selected element, need to do the same thing as convert
			//	Also, how to indicate toggle?

			//	window.focus();
			//	var element=document.querySelector('textarea:focus,input[type="text"]:focus');
			//	if(!element) return;

			var elements=document.querySelectorAll('textarea,input[type="text"]');
			if(!elements) return;
			for(var i=0;i<elements.length;i++) {
				if(enabled) elements[i].addEventListener('keypress',document['form-tools'].handleQuotes);
				else elements[i].removeEventListener('keypress',document['form-tools'].handleQuotes);
			}
		}

	/*	Convert to Smart Quotes
		============================================ */

		function doConvertQuotes() {
			window.focus();
			window.setTimeout(function() {
				var element=document.querySelector('textarea:focus,input[type="text"]:focus');
				if(!element) return;
				element.value=smartQuotes(element.value);
			},125);
		}

	/*	Allow Paste in Password Fields
		============================================ */

		function doPastePassword(enabled) {
			var passwords=document.querySelectorAll('input[type="password"],input[data-paste-password],input[data-show-password]');
			if(passwords.length) {
				for(var i=0;i<passwords.length;i++) {
					if(enabled) {
//						passwords[i].setAttribute('data-paste-password',passwords[i].getAttribute('onpaste'));
						passwords[i].removeAttribute('onpaste');
					}
//					else {
//						passwords[i].setAttribute('onpaste',passwords[i].getAttribute('data-paste-password'));
//						passwords[i].removeAttribute('data-paste-password');
//					}
				}
			}
		}

/*	Show Passwords
	============================================ */

	function doShowPasswords() {
		var passwords=document.querySelectorAll('input[type="password"],input[data-show-password]');
		if(passwords.length) {
			for(var i=0;i<passwords.length;i++) {
				passwords[i].setAttribute('data-show-password',true);
				passwords[i].setAttribute('type','text');
			}
			window.setTimeout(function() {
				for(var i=0;i<passwords.length;i++) {
					passwords[i].removeAttribute('data-show-password');
					passwords[i].setAttribute('type','password');
				}
			},options.passwordDelay*1000);
		}
	}

/*	Zoom Text Boxes
	============================================ */

	function doZoom(enabled) {
		var textBoxes=document.querySelectorAll('input[type="text"],input[type="email"]');
		if(!textBoxes.length) return;

		for(var i=0;i<textBoxes.length;i++) {
			if(enabled) {
				textBoxes[i].addEventListener('keyup',document['form-tools'].handleZoomKey);
//				textBoxes[i].setAttribute('contextmenu','form-tools-menu-zoom');
			}
			else {
				textBoxes[i].removeEventListener('keyup',document['form-tools'].handleZoomKey);
//				textBoxes[i].emoveAttribute('contextmenu');
			}
		}
	}

/*	Tab in Text Area
	============================================ */

	/* global textareas */

	function doTabTextarea(enabled) {
		if(!textareas.length) return;
		for(var i=0;i<textareas.length;i++) {
			textareas[i].style.cssText=`-moz-tab-size: ${options.tabWidth}; tab-size: ${options.tabWidth};`;

			if(enabled) textareas[i].addEventListener('keydown',document['form-tools'].handleTab);
			else textareas[i].removeEventListener('keydown',document['form-tools'].handleTab);
		}
	}

	//	do-form-tools:handleZoomKey
	/* exported handleZoomKey */
	/* global zoom */

		document['form-tools'].handleZoomKey=handleZoomKey;

		function handleZoomKey(e) {
			function activated(e) {
				return e.metaKey && e.keyCode==69 || e.ctrlKey && e.keyCode==90 && e.shiftKey;
			}
			if(activated(e)) {
				zoom.open(this);
				return false;	//	done
			}
			else {
				return true;	//	process as normal
			}
		}

