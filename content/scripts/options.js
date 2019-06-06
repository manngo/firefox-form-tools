/*	Form Tool Options
	================================================ */

	'use strict';
	/*global chrome */
	/*jshint unused:var */

	document.addEventListener('DOMContentLoaded', restoreOptions);
	document.querySelector('form#options').addEventListener('submit',saveOptions);

	var options={};

		function saveOptions(event) {
			var form=document.querySelector('form#options');

			options.passwordDelay=form['show-password-delay'].value*1;
			options.tabWidth=form['tab-width'].value*1;

//			options.useSpaces=form['use-spaces'].checked;

			var tabKey=form.querySelector('input[name="tab-key"]:checked');
			options.tab = tabKey&&tabKey.value=='spaces' ? ' '.repeat(options.tabWidth) : '\t';

			var ctrlQuote=form.querySelector('input[name="ctrl-quote"]:checked');
			options.ctrlQuote = ctrlQuote ? ctrlQuote.value : 'dumb';

			options.zoomPrefix=form['zoom-prefix'].value;

			chrome.storage.local.set({"options":options},showStorage.bind(this,false));
		}

		function restoreOptions() {
			chrome.storage.local.get(null,onGet);
			function onGet(result) {
				if (chrome.runtime.lastError) say(chrome.runtime.lastError);
				else {
					options.passwordDelay=result.options.passwordDelay||10;
					options.tabWidth=result.options.tabWidth||4;
					options.ctrlQuote=result.options.ctrlQuote||'dumb';
					options.zoomPrefix=result.options.zoomPrefix||'zoom-box';
					options.tab=result.options.tab||'\t';
				}

				var form=document.querySelector('form#options');

				form['show-password-delay'].value=options.passwordDelay;
				form['tab-width'].value=options.tabWidth;

				var tabKey = options.tab=='\t' ? 'tab' : 'spaces';
				form.querySelector(`input[value="${tabKey}"]`).checked=true;

				form.querySelector(`input[value="${options.ctrlQuote}"]`).checked=true;
				form['zoom-prefix'].value=options.zoomPrefix;
			}
		}

		function say(text) {
			var message=document.querySelector('div#message');
			message.innerHTML=text;
		}

		function showStorage(show) {
			chrome.storage.local.get(null,function(result) {
				if(show) alert(`Result: ${JSON.stringify(result)}`);
			});
		}
