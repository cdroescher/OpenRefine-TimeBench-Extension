/* ===== /scripts/project.js ===== */

/*

 Copyright 2010, Google Inc.
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are
 met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
 copyright notice, this list of conditions and the following disclaimer
 in the documentation and/or other materials provided with the
 distribution.
 * Neither the name of Google Inc. nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

//var theProject;
//var ui = {};

var lang = (navigator.language|| navigator.userLanguage).split("-")[0];
var dictionary = "";
$.ajax({
    url : "/command/core/load-language?",
    type : "POST",
    async : false,
    data : {
        module : "core"
//		lang : lang
    },
    success : function(data) {
        dictionary = data;
    }
});
$.i18n.setDictionary(dictionary);
// End internationalization

var Refine = {
    refineHelperService: "http://openrefine-helper.freebaseapps.com"
};

Refine.reportException = function(e) {
    if (window.console) {
        console.log(e);
    }
};


Refine.setTitle = function(status) {
    var title = theProject.metadata.name + " - OpenRefine";
    if (status) {
        title = status + " - " + title;
    }
    document.title = title;

    $("#project-name-button").text(theProject.metadata.name);
};

Refine.reinitializeProjectData = function(f, fError) {
    $.getJSON(
        "/command/core/get-project-metadata?" + $.param({ project: theProject.id }), null,
        function(data) {
            if (data.status == 'error') {
                alert(data.message);
                if (fError) {
                    fError();
                }
            } else {
                theProject.metadata = data;
                $.getJSON(
                    "/command/core/get-models?" + $.param({ project: theProject.id }), null,
                    function(data) {
                        for (var n in data) {
                            if (data.hasOwnProperty(n)) {
                                theProject[n] = data[n];
                            }
                        }
                        f();
                    },
                    'json'
                );
            }
        },
        'json'
    );
};


Refine.postCoreProcess = function(command, params, body, updateOptions, callbacks) {
    Refine.postProcess("core", command, params, body, updateOptions, callbacks);
};

Refine.postProcess = function(moduleName, command, params, body, updateOptions, callbacks) {
    updateOptions = updateOptions || {};
    callbacks = callbacks || {};

    params = params || {};
    params.project = theProject.id;

    body = body || {};
    if (!("includeEngine" in updateOptions) || updateOptions.includeEngine) {
        body.engine = JSON.stringify(
            "engineConfig" in updateOptions ?
                updateOptions.engineConfig :
                ui.browsingEngine.getJSON()
        );
    }

    var done = false;
    var dismissBusy = null;

    function onDone(o) {
        done = true;
        if (dismissBusy) {
            dismissBusy();
        }

        Refine.clearAjaxInProgress();

        if (o.code == "error") {
            if ("onError" in callbacks) {
                try {
                    callbacks.onError(o);
                } catch (e) {
                    Refine.reportException(e);
                }
            } else {
                alert(o.message);
            }
        } else {
            if ("onDone" in callbacks) {
                try {
                    callbacks.onDone(o);
                } catch (e) {
                    Refine.reportException(e);
                }
            }

            if (o.code == "ok") {
                Refine.update(updateOptions, callbacks.onFinallyDone);

                if ("historyEntry" in o) {
                    ui.processPanel.showUndo(o.historyEntry);
                }
            } else if (o.code == "pending") {
                if ("onPending" in callbacks) {
                    try {
                        callbacks.onPending(o);
                    } catch (e) {
                        Refine.reportException(e);
                    }
                }
                ui.processPanel.update(updateOptions, callbacks.onFinallyDone);
            }
        }
    }

    Refine.setAjaxInProgress();

    $.post(
        "/command/" + moduleName + "/" + command + "?" + $.param(params),
        body,
        onDone,
        "json"
    );

    window.setTimeout(function() {
        if (!done) {
            dismissBusy = DialogSystem.showBusy();
        }
    }, 500);
};

Refine.setAjaxInProgress = function() {
    $(document.body).attr("ajax_in_progress", "true");
};

Refine.clearAjaxInProgress = function() {
    $(document.body).attr("ajax_in_progress", "false");
};

/*
 *  Utility model functions
 */

Refine.cellIndexToColumn = function(cellIndex) {
    var columns = theProject.columnModel.columns;
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        if (column.cellIndex == cellIndex) {
            return column;
        }
    }
    return null;
};
Refine.columnNameToColumn = function(columnName) {
    var columns = theProject.columnModel.columns;
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        if (column.name == columnName) {
            return column;
        }
    }
    return null;
};
Refine.columnNameToColumnIndex = function(columnName) {
    var columns = theProject.columnModel.columns;
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        if (column.name == columnName) {
            return i;
        }
    }
    return -1;
};

Refine.fetchRows = function(start, limit, onDone, sorting) {
    var body = {
        engine: JSON.stringify(ui.browsingEngine.getJSON())
    };
    if (sorting) {
        body.sorting = JSON.stringify(sorting);
    }

    $.post(
        "/command/core/get-rows?" + $.param({ project: theProject.id, start: start, limit: limit }) + "&callback=?",
        body,
        function(data) {
            theProject.rowModel = data;

            // Un-pool objects
            for (var r = 0; r < data.rows.length; r++) {
                var row = data.rows[r];
                for (var c = 0; c < row.cells.length; c++) {
                    var cell = row.cells[c];
                    if ((cell) && ("r" in cell)) {
                        cell.r = data.pool.recons[cell.r];
                    }
                }
            }

            if (onDone) {
                onDone();
            }
        },
        "jsonp"
    );
};




/* ===== /scripts/util/url.js ===== */

/*

 Copyright 2010, Google Inc.
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are
 met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
 copyright notice, this list of conditions and the following disclaimer
 in the documentation and/or other materials provided with the
 distribution.
 * Neither the name of Google Inc. nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

URL = {
    schemes: { // 1 means followed by ://, 0 means followed by just :
        "callto":0,
        "chrome":1,
        "file":1,
        "ftp":1,
        "http":1,
        "https":1,
        "imap":1,
        "info":0,
        "irc":1,
        "jar":0,
        "javascript":0,
        "lastfm":1,
        "ldap":1,
        "ldaps":1,
        "mailto":0,
        "news":0,
        "nntp":1,
        "pop":1,
        "sftp":1,
        "skype":0,
        "smb":1,
        "ssh":1,
        "svn":1,
        "svn+ssh":1,
        "telnet":1,
        "view-source":0
    }
};
(function() {
    var minLength = 100;
    var maxLength = 0;

    for (var n in URL.schemes) {
        minLength = Math.min(minLength, n.length);
        maxLength = Math.max(maxLength, n.length);
    }

    URL.minSchemeLength = minLength;
    URL.maxSchemeLength = maxLength;
})();

URL.getParameters = function() {
    var r = {};

    var params = window.location.search;
    if (params.length > 1) {
        params = params.substr(1).split("&");
        $.each(params, function() {
            pair = this.split("=");
            r[pair[0]] = unescape(pair[1]);
        });
    }

    return r;
};

URL.looksLikeUrl = function(s) {
    if (s.length > URL.minSchemeLength + 1) {
        var sep = s.substring(0, URL.maxSchemeLength + 3).indexOf(":");
        if (sep >= URL.minSchemeLength) {
            var scheme = s.substring(0, sep).toLowerCase();
            if (scheme in URL.schemes) {
                return (URL.schemes[scheme] === 0) || (s.substring(sep + 1, sep + 3) == "//");
            }
        }
    }
    return false;
};

URL.getHostname = function(){
    var url = location.href;  // entire url including querystring - also: window.location.href;
    var baseURL = url.substring(0, url.indexOf('/',7));//7 is the length of http://
    return baseURL;
};

URL.urlify = function(str) {
    if(!str) {
        return '';
    }
    return escape(str.replace(/\W/g, '_'));
};

/* ===== /scripts/util/string.js ===== */

/*

 Copyright 2010, Google Inc.
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are
 met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
 copyright notice, this list of conditions and the following disclaimer
 in the documentation and/or other materials provided with the
 distribution.
 * Neither the name of Google Inc. nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

String.prototype.trim = function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
};

String.prototype.startsWith = function(s) {
    return this.length >= s.length && this.substring(0, s.length) == s;
};

String.prototype.endsWith = function(s) {
    return this.length >= s.length && this.substring(this.length - s.length) == s;
};

String.prototype.contains = function(s) {
    return this.indexOf(s) >= 0;
};

String.encodeSeparator = function(s) {
    return s.replace("\\", "\\\\")
        .replace("\r", "\\r")
        .replace("\n", "\\n")
        .replace("\t", "\\t");
};

String.decodeSeparator = function(s) {
    return s.replace("\\n", "\n")
        .replace("\\r", "\r")
        .replace("\\t", "\t")
        .replace("\\\\", "\\");
};


/* ===== /scripts/util/ajax.js ===== */

/*

 Copyright 2010, Google Inc.
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are
 met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
 copyright notice, this list of conditions and the following disclaimer
 in the documentation and/or other materials provided with the
 distribution.
 * Neither the name of Google Inc. nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

Ajax = {};

Ajax.chainGetJSON = function() {
    var a = arguments;
    var i = 0;
    var next = function() {
        if (i <= a.length - 3) {
            var url = a[i++];
            var data = a[i++];
            var callback = a[i++];

            $.getJSON(url, data, function(o) {
                callback(o);
                next();
            }, "json");
        } else if (i < a.length) {
            var finalCallback = a[i++];
            finalCallback();
        }
    };
    next();
};
















/* ===== /scripts/reconciliation/freebase-query-panel.js ===== */

/*

 Copyright 2010, Google Inc.
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are
 met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
 copyright notice, this list of conditions and the following disclaimer
 in the documentation and/or other materials provided with the
 distribution.
 * Neither the name of Google Inc. nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

function ReconFreebaseQueryPanel(column, service, container) {
    this._column = column;
    this._service = service;
    this._container = container;

    this._constructUI();
}

ReconFreebaseQueryPanel.prototype.activate = function() {
    this._panel.show();
};

ReconFreebaseQueryPanel.prototype.deactivate = function() {
    this._panel.hide();
};

ReconFreebaseQueryPanel.prototype.dispose = function() {
    this._panel.remove();
    this._panel = null;

    this._column = null;
    this._service = null;
    this._container = null;
};

ReconFreebaseQueryPanel.prototype._constructUI = function() {
    var self = this;
    this._panel = $(DOM.loadHTML("core", "scripts/reconciliation/freebase-query-panel.html")).appendTo(this._container);
    this._elmts = DOM.bind(this._panel);

    this._elmts.or_recon_contain.html($.i18n._('core-recon')["cell-contains"]);
    this._elmts.or_recon_fbId.html($.i18n._('core-recon')["fb-id"]);
    this._elmts.or_recon_fbGuid.html($.i18n._('core-recon')["fb-guid"]);
    this._elmts.or_recon_fbKey.html($.i18n._('core-recon')["fb-key"]);
    this._elmts.or_recon_fbEnNs.html($.i18n._('core-recon')["fb-en-ns"]);
    this._elmts.or_recon_thisNs.html($.i18n._('core-recon')["this-ns"]);

    this._wireEvents();
};

ReconFreebaseQueryPanel.prototype._wireEvents = function() {
    var self = this;
    this._elmts.strictNamespaceInput
        .suggest({ filter : '(all type:/type/namespace)' })
        .bind("fb-select", function(e, data) {
            self._panel.find('input[name="recon-dialog-strict-choice"][value="key"]').attr("checked", "true");
            self._panel.find('input[name="recon-dialog-strict-namespace-choice"][value="other"]').attr("checked", "true");
        });
};

ReconFreebaseQueryPanel.prototype.start = function() {
    var bodyParams;

    var match = $('input[name="recon-dialog-strict-choice"]:checked')[0].value;
    if (match == "key") {
        var namespaceChoice = $('input[name="recon-dialog-strict-namespace-choice"]:checked')[0];
        var namespace;

        if (namespaceChoice.value == "other") {
            var suggest = this._elmts.strictNamespaceInput.data("data.suggest");
            if (!suggest) {
                alert($.i18n._('core-recon')["specify-ns"]);
                return;
            }
            namespace = {
                id: suggest.id,
                name: suggest.name
            };
        } else {
            namespace = {
                id: namespaceChoice.value,
                name: namespaceChoice.getAttribute("nsName")
            };
        }

        bodyParams = {
            columnName: this._column.name,
            config: JSON.stringify({
                mode: "freebase/strict",
                match: "key",
                namespace: namespace
            })
        };
    } else if (match == "id") {
        bodyParams = {
            columnName: this._column.name,
            config: JSON.stringify({
                mode: "freebase/strict",
                match: "id"
            })
        };
    } else if (match == "guid") {
        bodyParams = {
            columnName: this._column.name,
            config: JSON.stringify({
                mode: "freebase/strict",
                match: "guid"
            })
        };
    }

    Refine.postCoreProcess(
        "reconcile",
        {},
        bodyParams,
        { cellsChanged: true, columnStatsChanged: true }
    );
};

