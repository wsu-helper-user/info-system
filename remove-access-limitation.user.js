// ==UserScript==
// @name         WSU info remove access limitation
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  try make wsu info page easy!
// @author       wsu-helper-user
// @match        https://info.wsu.ac.kr/*
// @require      https://unpkg.com/showmodaldialog
// @grant        none
// @updateURL    https://wsu-helper-user.github.io/info-system/remove-access-limitation.user.js
// ==/UserScript==

(function(win, doc) {
    'use strict';

    Object.defineProperty(navigator, 'platform', {value:'win64'});
    console.debug(window, { platform: navigator.platform });

    function reInit() {
        console.debug('-- reinit with', { caller: this });
        try {
            this.cbI_ENG_CHK.setDisabled( false);
            this.edId.setDisabled( false);
            this.edPass.setDisabled( false );
            this.imgLogin.setDisabled( false );
            this.trigger1.setDisabled( false );
            this.trigger2.setDisabled( false );
            this.trigger3.setDisabled( false );
            this.edId.setValue( "" );
            this.tb_msg.setValue( "" );
            this.edId.focus();
        } catch (e) {
            //console.error('failed to find form with:', { location: this.location.href });
        }
    };
    const f = doc.getElementsByTagName('frame');
    if (f && f.length > 0) {
        console.debug('- run reInit with frame');
        const fr = f[0].contentWindow;
        fr.init = reInit;
        fr.init.apply(fr);
    } else {
        win.init = reInit;
        win.init.apply(win);
    }
    if (win.fn_comm_getBrowserInfo) {
        win.fn_comm_getBrowserInfo = function () { return ["MSIE", 11] };
    }
})(window, document);