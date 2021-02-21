// ==UserScript==
// @name         WSU info system remove access limitation
// @namespace    http://tampermonkey.net/
// @version      0.0.3
// @description  try make wsu info page easy!
// @author       wsu-helper-user
// @match        https://info.wsu.ac.kr/*
// @grant        none
// @updateURL    https://wsu-helper-user.github.io/info-system/remove-access-limitation.user.js
// ==/UserScript==

const isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
// console.debug(' -- ischrome: ' + isChrome);

const initShowModalDialog = function() {
    // All references to document object will be on top window
    var dialogDocument = window.top.document;

    window.spawn = window.spawn || function(gen) {
        function continuer(verb, arg) {
            var result;
            try {
                result = generator[verb](arg);
            } catch (err) {
                return Promise.reject(err);
            }
            if (result.done) {
                return result.value;
            } else {
                return Promise.resolve(result.value).then(onFulfilled, onRejected);
            }
        }
        var generator = gen();
        var onFulfilled = continuer.bind(continuer, 'next');
        var onRejected = continuer.bind(continuer, 'throw');
        return onFulfilled();
    };

    // Override window.close function to close the last dialog created,
    // if window.shoModalDialog function doesn't exist
    window.close = window.showModalDialog ? window.close : function(close) {
        return function() {
            var dialogTags = dialogDocument.getElementsByTagName('dialog');
            var dialog = dialogTags[dialogTags.length - 1];
            if (dialog)
                dialog.close();
            else
                return close.call();
        };
    }(window.close);

    // Override window.shoModalDialog function if doesn't exist
    window.showModalDialog = window.showModalDialog || function (url, arg, opt) {
        url = url || ''; //URL of a dialog
        arg = arg || null; //arguments to a dialog
        opt = opt || 'dialogWidth:300px;dialogHeight:200px'; //options: dialogTop;dialogLeft;dialogWidth;dialogHeight or CSS styles

        // To create an interface for the showModalDialog place showModalDialog.interface in a comment inside
        // e.g.: function showMaximizedDialog(url, args, options) { // showModalDialog.interface
        var callerName = (showModalDialog.caller + '').indexOf('showModalDialog.interface') > -1 ? showModalDialog.caller.name : 'showModalDialog';

        // If it's only an interface, call the caller from caller
        var caller = (callerName === 'showModalDialog' ? showModalDialog.caller : showModalDialog.caller.caller);
        var dialogTitle = 'dialog-title';
        caller = showModalDialog.caller.toString();
        var dialog = dialogDocument.body.appendChild(dialogDocument.createElement('dialog'));
        var lastDialog = dialogDocument.querySelectorAll('dialog')[dialogDocument.querySelectorAll('dialog').length - 1];
        dialog.setAttribute('style', opt.replace(/dialog/gi, ''));
        dialog.innerHTML = '<div id=' + dialogTitle + '>';
        dialog.innerHTML += '<span id="dialog-close"><a href="#">&times;</a></span>';
        dialog.innerHTML += '</div><iframe id="dialog-body" src="' + url + '"></iframe>';
        lastDialog.querySelector('#dialog-body').contentWindow.dialogArguments = arg;
        lastDialog.querySelector('#dialog-close').addEventListener('click', function (e) {
            e.preventDefault();
            dialog.close();
        });

        // --------------------------------------------------------------
        // Create the css part for the dialog
        if (!dialogDocument.getElementById('dialog-css')) {
            var css = '<!--' +
            'dialog {padding: calc(1.8em + 1px) 0 0 0;box-shadow: 0px 0px 25px 2px #aaa;border: 1px solid;position: fixed !important;}' +
            'dialog::backdrop {background: rgba(0, 0, 0, .2)}' +
            '#' + dialogTitle + ' {width: 100%;background-color: #395484;position: absolute;left: 0;top: 0;height: calc(1.8em + 1px);}' +
            '#dialog-close {-webkit-transition: .2s ease-in-out;-moz-transition: .2s ease-in-out;-o-transition: .2s ease-in-out;transition: .2s ease-in-out;' +
            'position: absolute; top: 1px; right: 1px; width: 1.8em; height: calc(1.8em - 1px);text-align: center;}' +
            '#dialog-close:hover {background-color: #D00;} -->' +
            '#dialog-close a {font-size: 20px; color: #FFF; text-decoration: none; outline: none;}' +
            '#dialog-body {border: 0; width: 100%; height: 100%;}' +
            '-->';

            var head = dialogDocument.head || dialogDocument.getElementsByTagName('head')[0];
            var style = dialogDocument.createElement('style');

            style.type = 'text/css';
            style.id = 'dialog-css';
            style.appendChild(dialogDocument.createTextNode(css));
            head.appendChild(style);
        }

        // --------------------------------------------------------------
        // Make the dialog draggable
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        dialog.querySelector('#' + dialogTitle).onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup
            pos3 = e.clientX;
            pos4 = e.clientY;
            dialogDocument.onmouseup = closeDragElement;
            // call a function whenever the cursor moves
            dialogDocument.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position
            dialog.style.top = (dialog.offsetTop - pos2) + "px";
            dialog.style.marginLeft = (dialog.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // stop moving when mouse button is released
            dialogDocument.onmouseup = null;
            dialogDocument.onmousemove = null;
        }

        dialog.showModal();

        //if using yield or async/await
        try {
            if (caller.indexOf('yield') >= 0 || caller.indexOf('await') >= 0) {
                return new Promise(function (resolve, reject) {
                    dialog.addEventListener('close', function () {
                        var returnValue = lastDialog.querySelector('#dialog-body').contentWindow.returnValue;
                        dialogDocument.body.removeChild(dialog);
                        resolve(returnValue);
                    });
                });
            }
        } catch(e) {}

        //if using eval
        var isNext = false;
        var nextStmts = caller.split('\n').filter(function(stmt) {
            if (isNext || stmt.indexOf(callerName + '(') >= 0)
                return isNext = true;
            return false;
        });

        dialog.addEventListener('close', function() {
            var returnValue = lastDialog.querySelector('#dialog-body').contentWindow.returnValue;
            dialogDocument.body.removeChild(dialog);
            nextStmts[0] = nextStmts[0].replace(new RegExp('(window\.)?' + callerName + '\(.*\)' , 'g'), JSON.stringify(returnValue));
            var unclosedParenthesis = (nextStmts[0].match(/\(/g) || []).length - (nextStmts[0].match(/\)/g) || []).length;
            var closeParenthesis = repeat(')', unclosedParenthesis);
            nextStmts[0] += closeParenthesis;
            var decodedStmts = nextStmts.join('\n').replace(/^function\s+\(\s*\)\s*{/, '');
            var unopenedBraces = (decodedStmts.match(/}/g) || []).length - (decodedStmts.match(/{/g) || []).length;
            var openBraces = repeat('{', unopenedBraces);
            eval(openBraces + '\n' + decodedStmts);
        });

        // --------------------------------------------------------------
        // Function to repeat string
        function repeat(pattern, count) {
            if (count < 1) return '';
            var result = '';
            while (count > 1) {
                if (count & 1) result += pattern;
                count >>= 1, pattern += pattern;
            }
            return result + pattern;
        }

        throw 'Execution stopped until showModalDialog is closed';
    };
};

(function (win, doc) {
    Object.defineProperty(navigator, 'platform', {value:'win64'});
    //console.debug({ platform: win.navigator.platform });
    //console.debug({ location: win.location.href });

    // try open popup
    /*
    if (location.href.indexOf('/index_new.jsp') !== -1) {
        const popup = window.open('about:blank', '_blank', 'menubar=no,location=no,resizable=no,scrollbars=no,status=no');
        if (popup) {
            popup.close();
        }
    }
    */

    var observeDOM = (function(){
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        return function( obj, callback ){
            if( !obj || obj.nodeType !== 1 ) return;

            if( MutationObserver ){
                // define a new observer
                var mutationObserver = new MutationObserver(callback)

                // have the observer observe foo for changes in children
                mutationObserver.observe( obj, { childList:true, subtree:true })
                return mutationObserver
            }

            // browser support fallback
            else if( window.addEventListener ){
                obj.addEventListener('DOMNodeInserted', callback, false)
                obj.addEventListener('DOMNodeRemoved', callback, false)
            }
        }
    })();

    function reInit() {
        try {
            this.cbI_ENG_CHK.setDisabled( false);
            this.edId.setDisabled( false);
            this.edPass.setDisabled( false );
            this.imgLogin.setDisabled( false );
            this.trigger1.setDisabled( false );
            this.trigger2.setDisabled( false );
            this.trigger3.setDisabled( false );
            this.cbI_ENG_CHK.setDisabled = () => { return false };

            this.edId.setValue( "" );
            this.tb_msg.setValue( "" );
            this.edId.setValue = () => {};
            // this.edId.focus();
        } catch (e) {}
    };
    function fn_comm_getBrowserInfo() {
        return ['MSIE', 11];
    };
    async function fn_comm_OpenModalPopup( url, popupName, /*optional*/options, /*optional*/params, /*optional*/target ) {
        options = WebSquare.extend( {
            width : 500,
            height : 500,
            resizable  : true,
            scrollbars : false
        }, options);

        var new_url = url;

        if( url.match(/\.xml$/) ) {
            new_url = fn_comm_getWebsquareUrl( url, params, target );
        } else if(url.match(/\.html$/)) {
            new_url = fn_comm_getHTMLUrl( url, params, target );
        } else if(url.match(/\.jsp$/)) {
            new_url = fn_comm_getHTMLUrl( url, params, target );
        }
        options.resizable  = (options.resizable  == true) ? "yes" : "no";
        options.scrollbars = (options.scrollbars == true) ? "yes" : "no";

        var strOptions = "dialogWidth:" + parseInt(options.width) + "px; dialogHeight:" + parseInt(options.height)+"px";

        var popProperty = strOptions + "; status:no; resizable:" + options.resizable+"; scroll:" + options.scrollbars + "; center:yes; help:no";

        var popupWin = await this.showModalDialog(new_url, self, popProperty);

        //alert("[1]\n" +WebSquare.xml.indent(popupWin));
        //alert(WebSquare.xml.indent(popupWin));

        return popupWin; // returnValue.
    };

    const f = doc.getElementsByTagName('frame');
    if (f && f.length > 0) {
        // console.debug('- run reInit with frame');
        const fr = f[0].contentWindow;
        fr.fn_comm_getBrowserInfo = fn_comm_getBrowserInfo;
        reInit.apply(fr);
        //initShowModalDialog.call(fr);
        observeDOM(fr.body, function () {
            // console.debug('-- dom changed (frame)');
            if (!fr.reinit) {
                fr.reinit = reInit;
                fr.reinit.apply(fr);
            } else if (fr.cbI_ENG_CHK && fr.cbI_ENG_CHK.setDisabled !== false) {
                fr.reinit.apply(fr);
            }
            if (fr.fn_comm_getBrowserInfo) {
                fr.fn_comm_getBrowserInfo = fn_comm_getBrowserInfo;
                // console.debug(fr.fn_comm_getBrowserInfo());
            }
            if (isChrome && fr.fn_comm_OpenModalPopup) {
                fr.fn_comm_OpenModalPopup = fn_comm_OpenModalPopup.bind(fr);
            }
            /*
            if (isChrome && fr.fn_setReturnvalue) {
                fr.fn_setReturnvalue = function (value) {
                    console.debug({ fr: fr }, value);
                    fr.returnValue = value;
                    const dialog = fr.getElementsByTagName('dialog')[0];
                    dialog.close();
                }
            }
            */
        });
    } else {
        // console.debug('- run reInit without frame');
        win.fn_comm_getBrowserInfo = fn_comm_getBrowserInfo;
        reInit.apply(win);
        initShowModalDialog.call(win);
        observeDOM(doc.body, function () {
            // console.debug('-- dom changed');
            if (!win.reinit) {
                win.reinit = reInit;
                win.reinit.apply(win);
            } else if (win.cbI_ENG_CHK && win.cbI_ENG_CHK.setDisabled !== false) {
                win.reinit.apply(win);
            }

            if (win.fn_comm_getBrowserInfo) {
                win.fn_comm_getBrowserInfo = fn_comm_getBrowserInfo;
            }
            if (isChrome && win.fn_comm_OpenModalPopup) {
                win.fn_comm_OpenModalPopup = fn_comm_OpenModalPopup.bind(win);
            }
            /*
            if (isChrome && win.fn_setReturnvalue) {
                win.fn_setReturnvalue = function (value) {
                    console.debug({ win: win }, value);
                    win.returnValue = value;
                    var dialogTags = win.getElementsByTagName('dialog');
                    var dialog = dialogTags[dialogTags.length - 1];
                    if (dialog)
                        dialog.close();
                    else
                        return close.call();
                }
            }
            */
        });
    }
})(window, document);
