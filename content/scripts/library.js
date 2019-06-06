/*	Library
	================================================ */

	'use strict';

	/* exported say, widgets, addStyleElement, toggleAttribute, smartQuotes, handleTab, handleQuotes */
	/* jshint unused: vars */
	/* jshint -W100 */


	var widgets={};


/*	Say Function
	================================================ */

	function say(message) {
		if(!testing) return;
		var div=document.createElement('div');
		//	div.style.cssText='';
		div.setAttribute('id','message');
		div.style.cssText=
`border: thin solid #666;
background-color: white;
position: fixed;
bottom: 10px; right: 10px;
box-shadow: 4px 4px 4px #666;
width: 200px; height: 200px;
padding: 1em;
font-family: monospace;
white-space: pre-wrap;
overflow: auto;
`;
		document.body.appendChild(div);
		say=function(message) {
			if(typeof message=='object') message=JSON.stringify(message);
			div.textContent+=message+'\n';
		};
		say(message);
	}

/*	Add Style Element
	================================================ */

	function addStyleElement(css) {
		var element=document.createElement('style');
		element.setAttribute('type', 'text/css');
		element.textContent=css;
		document.head.appendChild(element);
	}

/*	Toggle Attribute
	================================================ */

	function toggleAttribute(element,attribute,value) {
		if(value===undefined) value=true;
		if(element.hasAttribute(attribute)) element.removeAttribute(attribute);
		else element.setAttribute(attribute,value);
	}



/*	Draggable (absolute)
	================================================ */

    (function() {
		if(!widgets.draggable) widgets.draggable=function(element,handle) {
			element.style.position='fixed';

            element.activateDrag=function() {
				if(handle) handle.onmousedown=element.startDrag;
				element.onmousedown=element.startDrag;
            };

			element.startDrag=function(event) {
				var target=event.target;
				if(this!=target) return;

				//	Element Position
					element.left=element.offsetLeft;
					element.top =element.offsetTop;
				//	Mouse Position
					element.startX=event.clientX;
					element.startY=event.clientY;

                //	Enable Drag & Drop Events
					document.onmousemove=element.drag;
					document.onmouseup=element.release;

                //	Change Appearance
					element.style.cursor='move';
					element.style.opacity='.60';
					element.style.filter='alpha(opacity=60)';

                return false;
			};

			element.drag=function(event) {
				element.style.left=element.left + event.clientX - element.startX + 'px';
				element.style.top =element.top  + event.clientY - element.startY + 'px';
				return false;
			};
			element.release=function(event) {
				document.onmousemove=null;
				document.onmouseup=null;
				element.style.opacity=element.style.filter=null;
				element.style.cursor=null;
			};

            element.activateDrag();
		};
	})();

/*	Convert to Smart Quotes
	============================================ */

	function smartQuotes(text) {
		if(!text) return;
		//	Need some way to allow some straight quotes
		//	RegEx /(^|\B)(')\b/g = (Start or Not WordBoundary) (Quote) WordBoundary / global (all)
		text=text.replace(/(^|\B)(')\b/g,'‘');
		text=text.replace(/(^|\B)(")\b/g,'“');
		text=text.replace(/'/g,'’');
		text=text.replace(/"/g,'”');
		return text;
	}

/*	Allow Tab Key
	============================================ */

	function handleTab(e) {
		if(e.keyCode==9) {
			var tab=options.tab||'\t';
			var start=e.target.selectionStart;
			var offset=tab.length;
			e.target.value=`${e.target.value.substring(0,start)}${tab}${e.target.value.substring(e.target.selectionEnd)}`;
			e.target.setSelectionRange(start+offset,start+offset);
			e.target.focus();
			e.preventDefault();

			return false;	//	done
		}
		else return true;	//	process as normal
	}

/*	Handle Quotes
	============================================ */

	function handleQuotes(e) {
		//	Need some way to allow leading ’twas
		var target=e.target;
		var code=e.charCode;
		var ctrlQuote=options.ctrlQuote||'dumb';
		var char;
		switch (code) {
			case 34:
			case 39:
				if(e.ctrlKey == (ctrlQuote=='dumb')) {		//	ctrl->allow straight quotes
					insertChar(e.shiftKey?'"':"'");
				}
				else {
					var text=target.value;
					var previous=text.substr(target.selectionStart-1,1);
					var current=String.fromCharCode(e.charCode);
					var test=previous+current;

					if(code==34 || code==39 && e.shiftKey)
						char = test.match(/(^|\s|\(|\[|‘)(")/) ? '“' : '”';
					else
						char = test.match(/(^|\s|\(|\[|“)(')/) ? '‘' : '’';

					insertChar(char);
				}
				e.preventDefault();
				break;
			default:
				return true;
		}

		function insertChar(char) {
			var start;
			target.value=target.value.substring(0,start=target.selectionStart)+char+target.value.substring(target.selectionEnd);
			target.setSelectionRange(start+1,start+1);
		}
	}
