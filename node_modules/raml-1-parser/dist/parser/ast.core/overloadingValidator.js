"use strict";
var linter = require("./linter");
var messageRegistry = require("../../../resources/errorMessages");
function escapeUri(u) {
    var ss = "";
    var level = 0;
    for (var i = 0; i < u.length; i++) {
        var c = u.charAt(i);
        if (level == 0) {
            ss = ss + c;
        }
        if (c == '{') {
            level++;
        }
        if (c == '}') {
            level--;
        }
    }
    return ss;
}
var OverloadingValidator = /** @class */ (function () {
    function OverloadingValidator() {
        this.uriToResources = {};
        this.conflictingUriToResources = {};
        //acceptMethod(x:wrapper.Resource,m:wrapper.Method){
        //    var uri=escapeUri(wrapperHelper.absoluteUri(x))+m.method();
        //    var pos=this.holder[uri];
        //    if (!pos){
        //        pos=[];
        //        this.holder[uri]=pos;
        //    }
        //    pos.push(m);
        //    if (pos.length>1){
        //        this.conflicting[uri]=pos;
        //    }
        //    //wrapperHelper.absoluteUri(m.parent().)
        //}
    }
    OverloadingValidator.prototype.validateApi = function (api, acceptor) {
        var _this = this;
        var resources = api.resources();
        resources.forEach(function (resource) {
            _this.acceptResource(resource);
            var subResources = resource.resources();
            subResources.forEach(function (subResource) { return _this.acceptResource(subResource); });
        });
        for (var uri in this.conflictingUriToResources) {
            var resources = this.conflictingUriToResources[uri];
            if (resources.length > 1) {
                //we should be only reporting resources, which have different keys or parent.
                //otherwise it is handled by the general key validator
                //thus performing additional filtering
                var idToSimilarResources = {};
                resources.forEach(function (resource) {
                    var highLevel = resource.highLevel();
                    var complexId = "";
                    if (highLevel.parent() != null) {
                        complexId += highLevel.parent().id() + ".";
                    }
                    complexId += highLevel.localId();
                    var resourcesWithId = idToSimilarResources[complexId];
                    if (resourcesWithId == null) {
                        resourcesWithId = [];
                        idToSimilarResources[complexId] = resourcesWithId;
                    }
                    resourcesWithId.push(resource);
                });
                //var isTemplateOverlap=uri.indexOf('{')!=-1;
                var ids = Object.keys(idToSimilarResources);
                if (ids.length > 1) {
                    //if we have more than a single id of conflicting resources
                    resources.forEach(function (resource) {
                        acceptor.accept(linter.createIssue1(messageRegistry.RESOURCES_SHARE_SAME_URI, {}, resource.highLevel(), false));
                    });
                }
            }
            ////now we should layout parameters by items
            //var overmapQuery={};
            //var overmapHeaders={};
            //
            //var pushed:wrapper.Method[]=[];
            //ms.forEach(m=>{
            //    m.queryParameters().forEach(api=>{
            //        var key=api.name();
            //        if (!api.required()){
            //            return;
            //        }
            //        var set:any=overmapQuery[key];
            //        if (!set){
            //            set=[];
            //            overmapQuery[key]=set;
            //        }
            //        set.push(m);
            //        pushed.push(m);
            //    });
            //    m.headers().forEach(api=>{
            //        var key=api.name();
            //        if (!api.required()){
            //            return;
            //        }
            //        var set:any=overmapHeaders[key];
            //        if (!set){
            //            set=[];
            //            overmapHeaders[key]=set;
            //        }
            //        set.push(m);
            //        pushed.push(m);
            //    });
            //
            //})
            //var notPushed=ms.filter(x=>!_.find(pushed,y=>y==x))
            //if (notPushed.length>0){
            //    notPushed.forEach(m=>{
            //        acceptor.accept(linter.createIssue(hl.IssueCode.KEY_SHOULD_BE_UNIQUE_INTHISCONTEXT,"method overloading is ambiguous",m.highLevel(),true))
            //    })
            //}
            //for (var key in overmapQuery){
            //    var cm:wrapper.Method[]=overmapQuery[key];
            //    if (cm.length>1){
            //        var over={};
            //        var pushed2:wrapper.Method[]=[];
            //        cm.forEach(m=>{
            //            var pr=_.find(m.queryParameters(),x=>x.name()==key);
            //            if (pr['enum']){
            //                var ev:any[]=pr['enum']();
            //                if (ev&&ev.length>0){
            //                    ev.forEach(value=>{
            //                        var t:wrapper.Method[]=over[value];
            //                        if (!t){
            //                            t=[]
            //                            over[value]=t;
            //                        }
            //                        t.push(m);
            //                        pushed2.push(m)
            //                    })
            //                }
            //            }
            //        });
            //        var notPushed2=cm.filter(x=>!_.find(pushed2,y=>y==x))
            //        if (notPushed2.length>0){
            //            notPushed2.forEach(m=>{
            //                acceptor.accept(linter.createIssue(hl.IssueCode.KEY_SHOULD_BE_UNIQUE_INTHISCONTEXT,"method overloading is ambiguous no domain restrictions",m.highLevel(),true))
            //            })
            //        }
            //        for (var k in over){
            //            var rs=over[k];
            //            if (rs.length>1){
            //                rs.forEach(m=>
            //                acceptor.accept(linter.createIssue(hl.IssueCode.KEY_SHOULD_BE_UNIQUE_INTHISCONTEXT,"method overloading is ambiguous ( enum value "+k+")",m.highLevel(),true)));
            //            }
            //        }
            //        //this is potential conflict
            //    }
            //}
        }
    };
    OverloadingValidator.prototype.acceptResource = function (resource) {
        var uri = resource.absoluteUri();
        var resources = this.uriToResources[uri];
        if (!resources) {
            resources = [];
            this.uriToResources[uri] = resources;
        }
        resources.push(resource);
        if (resources.length > 1) {
            this.conflictingUriToResources[uri] = resources;
        }
        //resource.methods().forEach(m=>{
        //    this.acceptMethod(resource,m);
        //})
    };
    return OverloadingValidator;
}());
module.exports = OverloadingValidator;
//# sourceMappingURL=overloadingValidator.js.map