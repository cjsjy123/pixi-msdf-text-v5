(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["MSDFText"] = factory();
	else
		root["MSDFText"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var MSDFText_1 = __webpack_require__(1);
exports.MSDFText = MSDFText_1.MSDFText;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vertShader = __webpack_require__(2);
var fragShader = __webpack_require__(3);
var MSDFCharInfo = /** @class */ (function () {
    function MSDFCharInfo() {
    }
    MSDFCharInfo.Create = function (l, charcode, drawx, drawy, draww, drawh, rawx, rawy, raww, rawh) {
        var info = null;
        if (MSDFCharInfo._pool.length > 0) {
            info = MSDFCharInfo._pool.pop();
        }
        else {
            info = new MSDFCharInfo();
        }
        info.set(l, charcode, drawx, drawy, draww, drawh, rawx, rawy, raww, rawh);
        return info;
    };
    MSDFCharInfo.prototype.set = function (l, charcode, drawx, drawy, draww, drawh, rawx, rawy, raww, rawh) {
        this.line = l;
        this.charCode = charcode;
        if (!this.drawRect) {
            this.drawRect = new PIXI.Rectangle();
        }
        this.drawRect.x = drawx;
        this.drawRect.y = drawy;
        this.drawRect.width = draww;
        this.drawRect.height = drawh;
        if (!this.rawRect) {
            this.rawRect = new PIXI.Rectangle();
        }
        this.rawRect.x = rawx;
        this.rawRect.y = rawy;
        this.rawRect.width = raww;
        this.rawRect.height = rawh;
    };
    MSDFCharInfo.prototype.dispose = function () {
        MSDFCharInfo._pool.push(this);
    };
    MSDFCharInfo._pool = new Array();
    return MSDFCharInfo;
}());
var MSDFText = /** @class */ (function (_super) {
    __extends(MSDFText, _super);
    function MSDFText(text, options) {
        var _this = this;
        // Steve -- Create default geometry, uniforms and shader for our base constructor
        var geometry = new PIXI.Geometry();
        var indices = new PIXI.Buffer(null, false, true);
        var uvs = new PIXI.Buffer(null, false, false);
        var vertices = new PIXI.Buffer(null, false, false);
        geometry.addIndex(indices)
            .addAttribute('aVertexPosition', vertices)
            .addAttribute('aTextureCoord', uvs);
        var program = new PIXI.Program(vertShader, fragShader, 'MSDFShader');
        var uniforms = {};
        var shader = new PIXI.Shader(program, uniforms);
        _this = _super.call(this, geometry, shader) || this;
        // Steve -- Now we've called the constructor, we're free to use `this`.
        _this.indices = indices;
        _this.uvs = uvs;
        _this.vertices = vertices;
        _this.shader = shader;
        _this.texture = options.texture || PIXI.Texture.WHITE;
        _this._text = text;
        _this._font = {
            fontFace: options.fontFace,
            fontSize: options.fontSize,
            color: options.fillColor === undefined ? 0xFF0000 : options.fillColor,
            weight: options.weight === undefined ? 0.5 : 1 - options.weight,
            align: options.align,
            kerning: options.kerning === undefined ? true : options.kerning,
            strokeColor: options.strokeColor || 0,
            dropShadow: options.dropShadow || false,
            dropShadowColor: options.dropShadowColor || 0,
            dropShadowAlpha: options.dropShadowAlpha === undefined ? 0.5 : options.dropShadowAlpha,
            dropShadowBlur: options.dropShadowBlur || 0,
            dropShadowOffset: options.dropShadowOffset || new PIXI.Point(2, 2),
            pxrange: options.pxrange === undefined ? 3 : options.pxrange,
        };
        if (options.strokeThickness === undefined || options.strokeThickness === 0) {
            _this._font.strokeWeight = 0;
        }
        else {
            _this._font.strokeWeight = _this._font.weight - options.strokeThickness;
        }
        _this.nocheck = options.noCheck || false;
        // TODO: layout option initialze
        _this._baselineOffset = options.baselineOffset === undefined ? 0 : options.baselineOffset;
        _this._letterSpacing = options.letterSpacing === undefined ? 0 : options.letterSpacing;
        _this._lineSpacing = options.lineSpacing === undefined ? 0 : options.lineSpacing;
        _this._textWidth = _this._textHeight = 0;
        _this._maxWidth = options.maxWidth || 0;
        // Steve -- Don't believe this is needed?, as it now seems to take care of all the dirty flags itself, when we update the buffers.
        // this._anchor = new PIXI.ObservablePoint(() => { }, this, 0, 0);
        _this._textMetricsBound = new PIXI.Rectangle();
        _this.chars = [];
        _this.cachepoint = new PIXI.Point();
        _this.updateText();
        return _this;
    }
    Object.defineProperty(MSDFText.prototype, "text", {
        get: function () { return this._text; },
        set: function (value) { this._text = this.unescape(value); this.updateText(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MSDFText.prototype, "fontData", {
        get: function () { return this._font; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MSDFText.prototype, "textWidth", {
        // public get glDatas(): any { return this._glDatas; } --> Steve -- Don't believe this is needed anymore?
        get: function () { return this._textWidth; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MSDFText.prototype, "textHeight", {
        get: function () { return this._textHeight; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MSDFText.prototype, "maxWidth", {
        get: function () { return this._maxWidth; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MSDFText.prototype, "textMetric", {
        get: function () { return this._textMetricsBound; },
        enumerable: true,
        configurable: true
    });
    MSDFText.prototype.isSpace = function (charcode) {
        // \t \v \f space
        return charcode == 9 || charcode == 11 || charcode == 12 || charcode == 32;
    };
    MSDFText.prototype.isToNextLine = function (charcode, nextcharcode) {
        if (charcode === 13 && nextcharcode === 10) {
            return 2;
        }
        else if (charcode == 13) {
            return 1;
        }
        else if (charcode == 10) {
            return 1;
        }
        return -1;
    };
    MSDFText.prototype.updateText = function () {
        // clear all gizmo
        // this.removeChildren();
        // Steve -- Typescript casting hack to reference the static fonts array
        var fontData = PIXI.BitmapText.fonts[this._font.fontFace];
        if (!fontData)
            throw new Error("Invalid fontFace: " + this._font.fontFace);
        // No beauty way to get bitmap font texture
        var texture = this.getBitmapTexture(this._font.fontFace);
        this._font.rawSize = fontData.size;
        var scale = this._font.fontSize / fontData.size;
        // const lineWidths: number[] = [];
        var texWidth = texture.width;
        var texHeight = texture.height;
        this.cachepoint.x = 0;
        this.cachepoint.y = -this._baselineOffset * scale;
        var prevCharCode = -1;
        var lastLineWidth = 0;
        var maxLineWidth = 0;
        var line = 0;
        var lastSpace = -1;
        var lastSpaceWidth = 0;
        var spacesRemoved = 0;
        var maxLineHeight = 0;
        var usedsize = 0;
        //  \f\n\r\t\v ascii  9-13  \r=13 \n=10 space=32
        for (var i = 0; i < this._text.length; i++) {
            var charCode = this._text.charCodeAt(i);
            var nextCode = i + 1 < this._text.length ? this._text.charCodeAt(i + 1) : -1;
            // If char is space, cache to lastSpace
            if (this.isSpace(charCode)) {
                lastSpace = i;
                lastSpaceWidth = lastLineWidth;
            }
            // If char is return next line
            if (this.isToNextLine(charCode, nextCode) > 0) {
                lastLineWidth -= this._letterSpacing;
                // lineWidths.push(lastLineWidth);
                maxLineWidth = Math.max(maxLineWidth, lastLineWidth);
                line++;
                this.cachepoint.x = 0;
                this.cachepoint.y += fontData.lineHeight * scale + this._lineSpacing * scale;
                prevCharCode = -1;
                continue;
            }
            if (lastSpace !== -1 && this._maxWidth > 0 && this.cachepoint.x > this._maxWidth) {
                PIXI.utils.removeItems(this.chars, lastSpace - spacesRemoved, i - lastSpace);
                i = lastSpace;
                lastSpace = -1;
                ++spacesRemoved;
                lastSpaceWidth -= this._letterSpacing;
                // lineWidths.push(lastSpaceWidth);
                maxLineWidth = Math.max(maxLineWidth, lastSpaceWidth);
                line++;
                this.cachepoint.x = 0;
                this.cachepoint.y += fontData.lineHeight * scale + this._lineSpacing * scale;
                prevCharCode = -1;
                continue;
            }
            var charData = fontData.chars[charCode];
            if (!charData)
                continue;
            if (this._font.kerning && prevCharCode !== -1 && charData.kerning[prevCharCode]) {
                this.cachepoint.x += charData.kerning[prevCharCode] * scale;
            }
            var updatedchar = this.chars[usedsize];
            if (!updatedchar) {
                updatedchar = MSDFCharInfo.Create(line, charCode, this.cachepoint.x + charData.xOffset * scale, this.cachepoint.y + charData.yOffset * scale, charData.texture.width * scale, charData.texture.height * scale, charData.texture.orig.x, charData.texture.orig.y, charData.texture.width, charData.texture.height);
                this.chars.push(updatedchar);
            }
            else {
                updatedchar.set(line, charCode, this.cachepoint.x + charData.xOffset * scale, this.cachepoint.y + charData.yOffset * scale, charData.texture.width * scale, charData.texture.height * scale, charData.texture.orig.x, charData.texture.orig.y, charData.texture.width, charData.texture.height);
            }
            usedsize++;
            // lastLineWidth = pos.x + (charData.texture.width * scale + charData.xOffset);
            this.cachepoint.x += (charData.xAdvance + this._letterSpacing) * scale;
            lastLineWidth = this.cachepoint.x;
            maxLineHeight = Math.max(maxLineHeight, this.cachepoint.y + fontData.lineHeight * scale);
            prevCharCode = charCode;
        }
        if (usedsize < this.chars.length) {
            for (var index = usedsize; index < this.chars.length; index++) {
                var element = this.chars[index];
                if (element) {
                    element.dispose();
                }
            }
            this.chars.splice(usedsize, this.chars.length - usedsize);
        }
        // lineWidths.push(lastLineWidth);
        maxLineWidth = Math.max(maxLineWidth, lastLineWidth);
        // const lineAlignOffsets = [];
        // for (let i = 0; i <= line; i++) {
        //     let alignOffset = 0;
        //     if (this._font.align === "right") {
        //         alignOffset = maxLineWidth - lineWidths[i];
        //     } else if (this._font.align === "center") {
        //         alignOffset = (maxLineWidth - lineWidths[i]) / 2;
        //     }
        //     lineAlignOffsets.push(alignOffset);
        // }
        // Update line alignment and fontSize
        // let lineNo = -1;
        // for (const char of chars) {
        //     char.drawRect.x = char.drawRect.x + lineAlignOffsets[char.line];
        //     if (lineNo !== char.line) {
        //         lineNo = char.line;
        //         // draw line gizmo
        //         if (this._debugLevel > 1) {
        //             this.drawGizmoRect(new PIXI.Rectangle(
        //                 char.drawRect.x - fontData.chars[char.charCode].xOffset * scale,
        //                 char.drawRect.y - fontData.chars[char.charCode].yOffset * scale,
        //                 lineWidths[lineNo],
        //                 fontData.lineHeight * scale
        //             ), 1, 0x00FF00, 0.5);
        //         }
        //     }
        // }
        // // draw text bound gizmo
        // if (this._debugLevel > 0) {
        //     this.drawGizmoRect(this.getLocalBounds(), 1, 0xFFFFFF, 0.5);
        // }
        this._textWidth = maxLineWidth;
        this._textHeight = maxLineHeight;
        //0, 0, maxLineWidth, maxLineHeight
        this._textMetricsBound.width = maxLineHeight;
        this._textMetricsBound.height = maxLineHeight;
        this.vertices.update(this.toVertices(this.vertices.data, this.chars));
        this.uvs.update(this.toUVs(this.uvs.data, this.chars, texWidth, texHeight));
        this.indices.update(this.createIndicesForQuads(this.indices.data, this.chars.length));
        if (this.shader.uniforms.uSampler !== texture) {
            this.shader.uniforms.uSampler = texture;
        }
        this.updateUniforms();
    };
    MSDFText.prototype.updateUniforms = function () {
        // Steve -- Binding is no longer required, apparently.
        // Steve -- Not sure we need this, since Mesh has it's own blendmode?
        // If we do -- then we can pass State into the Mesh constructor, same way we passed the geometry & shader.
        //if (renderer.state) renderer.state.setBlendMode(msdfText.blendMode);
        if (!this.worldarray) {
            this.worldarray = new Float32Array(9);
        }
        if (!this.soffsetarray) {
            this.soffsetarray = new Float32Array(2);
        }
        this.worldTransform.toArray(true, this.worldarray);
        this.soffsetarray[0] = this._font.dropShadowOffset.x;
        this.soffsetarray[1] = this._font.dropShadowOffset.x;
        this.shader.uniforms.translationMatrix = this.worldarray;
        this.shader.uniforms.u_alpha = this.worldAlpha;
        this.shader.uniforms.u_color = PIXI.utils.hex2rgb(this._font.color);
        this.shader.uniforms.u_fontSize = this._font.fontSize * this.scale.x;
        this.shader.uniforms.u_fontInfoSize = 1;
        this.shader.uniforms.u_weight = this._font.weight;
        this.shader.uniforms.u_pxrange = this._font.pxrange;
        this.shader.uniforms.strokeWeight = this._font.strokeWeight;
        this.shader.uniforms.strokeColor = PIXI.utils.hex2rgb(this._font.strokeColor);
        this.shader.uniforms.tint = PIXI.utils.hex2rgb(this.tint);
        this.shader.uniforms.hasShadow = this._font.dropShadow;
        this.shader.uniforms.shadowOffset = this.soffsetarray;
        this.shader.uniforms.shadowColor = PIXI.utils.hex2rgb(this._font.dropShadowColor);
        this.shader.uniforms.shadowAlpha = this._font.dropShadowAlpha;
        this.shader.uniforms.shadowSmoothing = this._font.dropShadowBlur;
    };
    MSDFText.prototype.getBitmapTexture = function (fontFace) {
        // Steve -- Typescript casting hack
        var fontData = PIXI.BitmapText.fonts[fontFace];
        if (!fontData)
            return PIXI.Texture.EMPTY;
        // No beauty way to get bitmap font texture, hack needed
        for (var key in fontData.chars) {
            var data = fontData.chars[key];
            var texturePath = data.texture.baseTexture.resource.url;
            return PIXI.utils.TextureCache[texturePath];
        }
        return PIXI.Texture.EMPTY;
    };
    MSDFText.prototype.toVertices = function (old, chars) {
        var totalIndices = chars.length * 4 * 2;
        var positions = null;
        if (old && old.length === totalIndices) {
            positions = old;
        }
        else {
            positions = new Float32Array(totalIndices);
        }
        var i = 0;
        for (var _i = 0, chars_1 = chars; _i < chars_1.length; _i++) {
            var char = chars_1[_i];
            var x = char.drawRect.x;
            var y = char.drawRect.y;
            // quad size
            var w = char.drawRect.width;
            var h = char.drawRect.height;
            // BL
            positions[i++] = x;
            positions[i++] = y;
            // TL
            positions[i++] = x;
            positions[i++] = y + h;
            // TR
            positions[i++] = x + w;
            positions[i++] = y + h;
            // BR
            positions[i++] = x + w;
            positions[i++] = y;
        }
        return positions;
    };
    MSDFText.prototype.toUVs = function (old, chars, texWidth, texHeight) {
        var totalIndices = chars.length * 4 * 2;
        var uvs = null;
        if (old && old.length === totalIndices) {
            uvs = old;
        }
        else {
            uvs = new Float32Array(totalIndices);
        }
        var i = 0;
        for (var _i = 0, chars_2 = chars; _i < chars_2.length; _i++) {
            var char = chars_2[_i];
            // Note: v coordinate is reversed 2D space Y coordinate
            var u0 = char.rawRect.x / texWidth;
            var u1 = (char.rawRect.x + char.rawRect.width) / texWidth;
            var v0 = (char.rawRect.y + char.rawRect.height) / texHeight;
            var v1 = char.rawRect.y / texHeight;
            // BL
            uvs[i++] = u0;
            uvs[i++] = v1;
            // TL
            uvs[i++] = u0;
            uvs[i++] = v0;
            // TR
            uvs[i++] = u1;
            uvs[i++] = v0;
            // BR
            uvs[i++] = u1;
            uvs[i++] = v1;
        }
        return uvs;
    };
    MSDFText.prototype.createIndicesForQuads = function (old, size) {
        // the total number of indices in our array, there are 6 points per quad.
        var totalIndices = size * 6;
        var indices = null;
        if (old && old.length === totalIndices) {
            indices = old;
        }
        else {
            indices = new Uint16Array(totalIndices);
        }
        // fill the indices with the quads to draw
        for (var i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
            indices[i + 0] = j + 0;
            indices[i + 1] = j + 1;
            indices[i + 2] = j + 2;
            indices[i + 3] = j + 0;
            indices[i + 4] = j + 2;
            indices[i + 5] = j + 3;
        }
        return indices;
    };
    MSDFText.prototype.drawGizmoRect = function (rect, lineThickness, lineColor, lineAlpha) {
        if (lineThickness === void 0) { lineThickness = 1; }
        if (lineColor === void 0) { lineColor = 0xFFFFFF; }
        if (lineAlpha === void 0) { lineAlpha = 1; }
        var gizmo = new PIXI.Graphics();
        gizmo
            .lineStyle(lineThickness, lineColor, lineAlpha, 0.5, true)
            .drawRect(rect.x, rect.y, rect.width, rect.height);
        this.addChild(gizmo);
    };
    MSDFText.prototype.unescape = function (input) {
        if (this.nocheck) {
            return input;
        }
        return input.replace(/(\\n|\\r)/g, "\n");
    };
    MSDFText.Debug = false;
    return MSDFText;
}(PIXI.Mesh));
exports.MSDFText = MSDFText;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = "#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 translationMatrix;\nuniform mat3 projectionMatrix;\nuniform float u_fontInfoSize;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    vTextureCoord = aTextureCoord;\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition * u_fontInfoSize, 1.0)).xy, 0.0, 1.0);\n}\n"

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = "#define GLSLIFY 1\nvarying vec2 vTextureCoord;\nuniform vec3 u_color;\nuniform sampler2D uSampler;\nuniform float u_alpha;\nuniform float u_fontSize;\nuniform float u_weight;\nuniform float u_pxrange;\n\nuniform vec3 tint;\n// Stroke effect parameters\nuniform float strokeWeight;\nuniform vec3 strokeColor;\n\n// Shadow effect parameters\nuniform bool hasShadow;\nuniform vec2 shadowOffset;\nuniform float shadowSmoothing;\nuniform vec3 shadowColor;\nuniform float shadowAlpha;\n\nfloat median(float r, float g, float b) {\n    return max(min(r, g), min(max(r, g), b));\n}\n\nvoid main(void)\n{\n    float smoothing = clamp(2.0 * u_pxrange / u_fontSize, 0.0, 0.5);\n\n    vec2 textureCoord = vTextureCoord * 2.;\n    vec3 sample = texture2D(uSampler, vTextureCoord).rgb;\n    float dist = median(sample.r, sample.g, sample.b);\n\n    float alpha;\n    vec3 color;\n\n    // dirty if statment, will change soon\n    if (strokeWeight > 0.0) {\n        alpha = smoothstep(strokeWeight - smoothing, strokeWeight + smoothing, dist);\n        float outlineFactor = smoothstep(u_weight - smoothing, u_weight + smoothing, dist);\n        color = mix(strokeColor, u_color, outlineFactor) * alpha;\n    } else {\n        alpha = smoothstep(u_weight - smoothing, u_weight + smoothing, dist);\n        color = u_color * alpha;\n    }\n    vec4 text = vec4(color * tint, alpha) * u_alpha;\n    if (hasShadow == false) {\n        gl_FragColor = text;\n    } else {\n        vec3 shadowSample = texture2D(uSampler, vTextureCoord - shadowOffset).rgb;\n        float shadowDist = median(shadowSample.r, shadowSample.g, shadowSample.b);\n        float distAlpha = smoothstep(0.5 - shadowSmoothing, 0.5 + shadowSmoothing, shadowDist);\n        vec4 shadow = vec4(shadowColor, shadowAlpha * distAlpha);\n        gl_FragColor = mix(shadow, text, text.a);\n    }\n}"

/***/ })
/******/ ]);
});
//# sourceMappingURL=pixi-msdf-text.js.map