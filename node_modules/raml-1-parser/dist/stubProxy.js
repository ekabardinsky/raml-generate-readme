"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var hlimpl = require("./parser/highLevelImpl");
var jsyaml = require("./parser/jsyaml/jsyaml2lowLevel");
var stubs = require("./parser/stubs");
function createStubNode(t, p, key, unit) {
    if (key === void 0) { key = null; }
    return stubs.createStubNode(t, p, key, unit);
}
exports.createStubNode = createStubNode;
function createStub(parent, property, key) {
    return stubs.createStub(parent, property, key);
}
exports.createStub = createStub;
function createStubNoParentPatch(parent, property, key) {
    return stubs.createStub0(parent, property, key);
}
exports.createStubNoParentPatch = createStubNoParentPatch;
function createResourceStub(parent, key) {
    return stubs.createResourceStub(parent, key);
}
exports.createResourceStub = createResourceStub;
function createMethodStub(parent, key) {
    return stubs.createMethodStub(parent, key);
}
exports.createMethodStub = createMethodStub;
function createResponseStub(parent, key) {
    return stubs.createResponseStub(parent, key);
}
exports.createResponseStub = createResponseStub;
function createBodyStub(parent, key) {
    return stubs.createBodyStub(parent, key);
}
exports.createBodyStub = createBodyStub;
function createUriParameterStub(parent, key) {
    return stubs.createUriParameterStub(parent, key);
}
exports.createUriParameterStub = createUriParameterStub;
function createQueryParameterStub(parent, key) {
    return stubs.createQueryParameterStub(parent, key);
}
exports.createQueryParameterStub = createQueryParameterStub;
function createASTPropImpl(node, parent, _def, _prop, fk) {
    if (fk === void 0) { fk = false; }
    return new hlimpl.ASTPropImpl(node, parent, _def, _prop, fk);
}
exports.createASTPropImpl = createASTPropImpl;
function createASTNodeImpl(node, parent, _def, _prop) {
    return new hlimpl.ASTNodeImpl(node, parent, _def, _prop);
}
exports.createASTNodeImpl = createASTNodeImpl;
function createVirtualASTPropImpl(node, parent, _def, _prop) {
    return new VirtualAttr(node, parent, _def, _prop);
}
exports.createVirtualASTPropImpl = createVirtualASTPropImpl;
function createVirtualNodeImpl(node, parent, _def, _prop) {
    return new VirtualNode(node, parent, _def, _prop);
}
exports.createVirtualNodeImpl = createVirtualNodeImpl;
var VirtualAttr = /** @class */ (function (_super) {
    __extends(VirtualAttr, _super);
    function VirtualAttr() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VirtualAttr.prototype.value = function () {
        return "";
    };
    return VirtualAttr;
}(hlimpl.ASTPropImpl));
var VirtualNode = /** @class */ (function (_super) {
    __extends(VirtualNode, _super);
    function VirtualNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VirtualNode.prototype.value = function () {
        return "";
    };
    return VirtualNode;
}(hlimpl.ASTNodeImpl));
function createMapping(name, value) {
    return jsyaml.createMapping(name, value);
}
exports.createMapping = createMapping;
function createMap() {
    return jsyaml.createMap([]);
}
exports.createMap = createMap;
function createAttr(_property, val) {
    return stubs.createAttr(_property, val);
}
exports.createAttr = createAttr;
//# sourceMappingURL=stubProxy.js.map