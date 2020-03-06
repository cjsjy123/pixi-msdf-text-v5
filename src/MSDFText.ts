
const vertShader = require("./msdf.vert")
const fragShader = require("./msdf.frag")

class MSDFCharInfo {
    private static _pool: MSDFCharInfo[] = new Array<MSDFCharInfo>();

    public line: number;
    public charCode: number;
    public drawRect: PIXI.Rectangle;
    public rawRect: PIXI.Rectangle;

    public static Create(l: number, charcode: number,
        drawx: number, drawy: number, draww: number, drawh: number,
        rawx: number, rawy: number, raww: number, rawh: number) {

        let info: MSDFCharInfo = null;

        if (MSDFCharInfo._pool.length > 0) {
            info = MSDFCharInfo._pool.pop();
        } else {
            info = new MSDFCharInfo();
        }

        info.set(l,charcode,drawx,drawy,draww,drawh,rawx,rawy,raww,rawh)

        return info;
    }

    public set(l: number, charcode: number,
        drawx: number, drawy: number, draww: number, drawh: number,
        rawx: number, rawy: number, raww: number, rawh: number)
    {
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
    }

    public dispose() {
        MSDFCharInfo._pool.push(this);
    }
}

export interface MSDFTextOption {
    // Basic
    fontFace: string;
    fontSize: number;
    fillColor?: number;
    weight?: number;
    // Effect
    texture?: PIXI.Texture;
    strokeColor?: number;
    strokeThickness?: number;
    dropShadow?: boolean;
    dropShadowColor?: number;
    dropShadowAlpha?: number;
    dropShadowOffset?: PIXI.Point;
    dropShadowBlur?: number;
    // Layout
    align?: "left" | "right" | "center";
    baselineOffset?: number;
    letterSpacing?: number;
    kerning?: boolean;
    lineSpacing?: number;
    maxWidth?: number;

    noCheck?: boolean;
    // Debug
    debugLevel?: 1 | 2 | 3;
    pxrange?: number;
}

export class MSDFText extends PIXI.Mesh {
    public static Debug: boolean = false;

    private _text: string;
    // Font data passed to renderer
    private _font: any;
    private _textWidth: number;
    private _textHeight: number;
    private _maxWidth: number;

    // TODO: add Effect & Layout
    private _baselineOffset: number;
    private _letterSpacing: number;
    private _lineSpacing: number;


    // TODO: Metrics object
    private _textMetricsBound: PIXI.Rectangle;

    private indices: PIXI.Buffer;
    private uvs: PIXI.Buffer;
    private vertices: PIXI.Buffer;

    private nocheck: boolean;

    private chars: MSDFCharInfo[];
    private cachepoint: PIXI.IPoint;
    private worldarray: Float32Array;
    private soffsetarray: Float32Array;
    
    public get text(): string { return this._text; }
    public set text(value) { this._text = this.unescape(value); this.updateText(); }
    public get fontData(): any { return this._font; }
    // public get glDatas(): any { return this._glDatas; } --> Steve -- Don't believe this is needed anymore?
    public get textWidth(): number { return this._textWidth; }
    public get textHeight(): number { return this._textHeight; }
    public get maxWidth(): number { return this._maxWidth; }
    public get textMetric(): PIXI.Rectangle { return this._textMetricsBound; }

    constructor(text: string, options: MSDFTextOption) {
        // Steve -- Create default geometry, uniforms and shader for our base constructor
        const geometry = new PIXI.Geometry();

        const indices = new PIXI.Buffer(null, false, true);
        const uvs = new PIXI.Buffer(null, false, false);
        const vertices = new PIXI.Buffer(null, false, false);

        geometry.addIndex(indices)
            .addAttribute('aVertexPosition', vertices)
            .addAttribute('aTextureCoord', uvs);

        const program = new PIXI.Program(vertShader, fragShader, 'MSDFShader');
        const uniforms = {};
        const shader = new PIXI.Shader(program, uniforms);

        super(geometry, shader);

        // Steve -- Now we've called the constructor, we're free to use `this`.
        this.indices = indices;
        this.uvs = uvs;
        this.vertices = vertices;
        this.shader = shader;

        this.texture = options.texture || PIXI.Texture.WHITE;

        this._text = text;
        this._font = {
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
            this._font.strokeWeight = 0;
        } else {
            this._font.strokeWeight = this._font.weight - options.strokeThickness;
        }

        this.nocheck = options.noCheck || false;

        // TODO: layout option initialze
        this._baselineOffset = options.baselineOffset === undefined ? 0 : options.baselineOffset;
        this._letterSpacing = options.letterSpacing === undefined ? 0 : options.letterSpacing;
        this._lineSpacing = options.lineSpacing === undefined ? 0 : options.lineSpacing;

        this._textWidth = this._textHeight = 0;
        this._maxWidth = options.maxWidth || 0;
        // Steve -- Don't believe this is needed?, as it now seems to take care of all the dirty flags itself, when we update the buffers.
        // this._anchor = new PIXI.ObservablePoint(() => { }, this, 0, 0);
        this._textMetricsBound = new PIXI.Rectangle();
        this.chars = [];
        this.cachepoint = new PIXI.Point();

        this.updateText();
    }

    private isSpace(charcode: number) {
        // \t \v \f space
        return charcode == 9 || charcode == 11 || charcode == 12  || charcode ==32;
    }

    private isToNextLine(charcode: number,nextcharcode: number)
    {
        if (charcode === 13 && nextcharcode === 10) {
            return 2;
        }
        else if(charcode == 13)
        {
            return 1;
        }
        else if(charcode == 10)
        {
            return 1;
        }
        return -1;
    }

    public updateText() {
        // clear all gizmo
        // this.removeChildren();

        // Steve -- Typescript casting hack to reference the static fonts array
        const fontData = (PIXI.BitmapText as any).fonts[this._font.fontFace];
        if (!fontData) throw new Error("Invalid fontFace: " + this._font.fontFace);
        // No beauty way to get bitmap font texture
        const texture = this.getBitmapTexture(this._font.fontFace);
        this._font.rawSize = fontData.size;

        const scale = this._font.fontSize / fontData.size;

        // const lineWidths: number[] = [];
        const texWidth = texture.width;
        const texHeight = texture.height;

        this.cachepoint.x = 0;
        this.cachepoint.y = -this._baselineOffset * scale;

        let prevCharCode = -1;
        let lastLineWidth = 0;
        let maxLineWidth = 0;
        let line = 0;
        let lastSpace = -1;
        let lastSpaceWidth = 0;
        let spacesRemoved = 0;
        let maxLineHeight = 0;
        let usedsize = 0;
        //  \f\n\r\t\v ascii  9-13  \r=13 \n=10 space=32

        for (let i = 0; i < this._text.length; i++) {
            const charCode = this._text.charCodeAt(i);
            const nextCode = i+1 < this._text.length?this._text.charCodeAt(i+1):-1;
            // If char is space, cache to lastSpace
            if (this.isSpace(charCode)) {
                lastSpace = i;
                lastSpaceWidth = lastLineWidth;
            }

            // If char is return next line
            if (this.isToNextLine(charCode,nextCode) > 0) {
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

            const charData = fontData.chars[charCode];

            if (!charData) continue;

            if (this._font.kerning && prevCharCode !== -1 && charData.kerning[prevCharCode]) {
                this.cachepoint.x += charData.kerning[prevCharCode] * scale;
            }

            let updatedchar = this.chars[usedsize]
            if(!updatedchar)
            {
                updatedchar = MSDFCharInfo.Create(line,charCode,
                    this.cachepoint.x + charData.xOffset * scale,
                    this.cachepoint.y + charData.yOffset * scale,
                    charData.texture.width * scale,
                    charData.texture.height * scale,
                    charData.texture.orig.x,
                    charData.texture.orig.y,
                    charData.texture.width,
                    charData.texture.height)
                
                this.chars.push(updatedchar)
            }
            else
            {
                updatedchar.set(line,charCode,
                    this.cachepoint.x + charData.xOffset * scale,
                    this.cachepoint.y + charData.yOffset * scale,
                    charData.texture.width * scale,
                    charData.texture.height * scale,
                    charData.texture.orig.x,
                    charData.texture.orig.y,
                    charData.texture.width,
                    charData.texture.height)
            }

            usedsize++;
            // lastLineWidth = pos.x + (charData.texture.width * scale + charData.xOffset);
            this.cachepoint.x += (charData.xAdvance + this._letterSpacing) * scale;
            lastLineWidth = this.cachepoint.x;
            maxLineHeight = Math.max(maxLineHeight, this.cachepoint.y + fontData.lineHeight * scale);
            prevCharCode = charCode;
        }

        if(usedsize < this.chars.length)
        {
            for (let index = usedsize; index < this.chars.length; index++) {
                const element = this.chars[index];
                if(element)
                {
                    element.dispose();
                }
            }
    
            this.chars.splice(usedsize,this.chars.length - usedsize)
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

        this.vertices.update(this.toVertices(this.vertices.data as any, this.chars));
        this.uvs.update(this.toUVs(this.uvs.data as any,this.chars, texWidth, texHeight));
        this.indices.update(this.createIndicesForQuads(this.indices.data as any,this.chars.length));

        if (this.shader.uniforms.uSampler !== texture) {
            this.shader.uniforms.uSampler = texture;
        }
        this.updateUniforms();
    }

    public updateUniforms() {
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

        this.worldTransform.toArray(true,this.worldarray);
        this.soffsetarray[0] = this._font.dropShadowOffset.x ;
        this.soffsetarray[1] = this._font.dropShadowOffset.x ;

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
    }

    private getBitmapTexture(fontFace: string): PIXI.Texture {
        // Steve -- Typescript casting hack
        const fontData = (PIXI.BitmapText as any).fonts[fontFace];
        if (!fontData) return PIXI.Texture.EMPTY;
        // No beauty way to get bitmap font texture, hack needed

        for (const key in fontData.chars) {
            let data = fontData.chars[key]
            let texturePath = data.texture.baseTexture.resource.url;
            return PIXI.utils.TextureCache[texturePath];
        }
        return PIXI.Texture.EMPTY;
    }

    private toVertices(old: Float32Array, chars: MSDFCharInfo[]): Float32Array {
        const totalIndices = chars.length * 4 * 2;
        let positions: Float32Array = null;

        if (old && old.length === totalIndices) {
            positions = old;
        } else {
            positions = new Float32Array(totalIndices);
        }

        let i = 0;

        for (const char of chars) {
            const x = char.drawRect.x;
            const y = char.drawRect.y;
            // quad size
            const w = char.drawRect.width;
            const h = char.drawRect.height;

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
    }

    private toUVs(old: Float32Array, chars: MSDFCharInfo[], texWidth: number, texHeight: number): Float32Array {

        const totalIndices = chars.length * 4 * 2;
        let uvs: Float32Array = null;

        if (old && old.length === totalIndices) {
            uvs = old;
        } else {
            uvs = new Float32Array(totalIndices);
        }

        let i = 0;

        for (const char of chars) {
            // Note: v coordinate is reversed 2D space Y coordinate
            const u0 = char.rawRect.x / texWidth;
            const u1 = (char.rawRect.x + char.rawRect.width) / texWidth;
            const v0 = (char.rawRect.y + char.rawRect.height) / texHeight;
            const v1 = char.rawRect.y / texHeight;
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
    }

    private createIndicesForQuads(old: Uint16Array, size: number): Uint16Array {
        // the total number of indices in our array, there are 6 points per quad.
        const totalIndices = size * 6;
        let indices: Uint16Array = null;

        if (old && old.length === totalIndices) {
            indices = old;
        } else {
            indices = new Uint16Array(totalIndices);
        }

        // fill the indices with the quads to draw
        for (let i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
            indices[i + 0] = j + 0;
            indices[i + 1] = j + 1;
            indices[i + 2] = j + 2;
            indices[i + 3] = j + 0;
            indices[i + 4] = j + 2;
            indices[i + 5] = j + 3;
        }
        return indices;
    }

    private drawGizmoRect(rect: PIXI.Rectangle, lineThickness: number = 1, lineColor: number = 0xFFFFFF, lineAlpha: number = 1): void {
        const gizmo = new PIXI.Graphics();
        gizmo
            .lineStyle(lineThickness, lineColor, lineAlpha, 0.5, true)
            .drawRect(rect.x, rect.y, rect.width, rect.height);
        this.addChild(gizmo);
    }

    private unescape(input: string): string {
        if (this.nocheck) {
            return input;
        }
        return input.replace(/(\\n|\\r)/g, "\n");
    }
}
