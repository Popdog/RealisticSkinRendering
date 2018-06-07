/*
 *  Some usefule function.
 *  Collected from various sources.
 *  Copyright of the source appears before those functions.
 */
"use strict";
function syncRead(filename){
	var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET",filename,false);
    xmlhttp.send(null);
    //xmlhttp.onreadystatechange = function(){
	if(xmlhttp.status==200 && xmlhttp.readyState==4){ 
		var data = xmlhttp.responseText;
		return data;
	}
	else{
		alert(filename+" does not exist.");
		return null;
	}
}
function asyncRead(filename,callback){
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	  if(xmlhttp.status==200 && xmlhttp.readyState==4){ 
		var data = xmlhttp.responseText;
		callback(data);
	  }
	};
	xmlhttp.open("GET",filename,true);
	xmlhttp.send();
}

function create8BitGrayScaleDataTexture(gl, data, width,height){
	return createColorDataTexture(gl, data, width,height, 1);
}

function createColorDataTexture(gl, data, width, height, nChannels){
	if (nChannels < 1 || nChannels > 4){
		console.log("Error in createColorDataTexture: nChannels parameter should have value between 1 to 4.");
		return null;
	}
	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	
	let internalFormat = gl.RGBA;   // format we want in the texture
	let srcFormat = gl.RGBA;        // format of data we are supplying
	switch (nChannels){
		case 1: 
			internalFormat = gl.R8;
			srcFormat = gl.RED;
			break;
		case 2: 
			internalFormat = gl.RG8;
			srcFormat = gl.RG;
			break;
		case 3: 
			internalFormat = gl.RGB;
			srcFormat = gl.RGB;
			break;
	}
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, srcFormat, gl.UNSIGNED_BYTE, new Uint8Array(data));
	 
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	return texture;
}

function createVao(gl,program,attribNames,attribSizes,attribData,elementArray, iattribNames, iattribSizes, iattribDivs, iattribData)
{
    let attributes = {
        perVertex: {
            namesInShader: attribNames,
            data: attribData,
            srcDatumSizes: attribSizes
        }
    };
    if (iattribNames)
        attributes.perInstance = {
            namesInShader: iattribNames,
            data: iattribData,
            srcDatumSizes: iattribSizes,
            divs : iattribDivs
        };
    if (elementArray)
        attributes.indices = {
            data: elementArray,
        };
    //console.log(attributes);
    return createVAO(gl,program,attributes);
}
function createVAO(gl,program, attribs){
	let aBuffers =[];
    for (let aIndex = 0; aIndex < attribs.perVertex.namesInShader.length; aIndex++) {
        aBuffers[aIndex] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, aBuffers[aIndex]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attribs.perVertex.data[aIndex]), gl.STATIC_DRAW);
    }
    let aiBuffers = undefined;
	if (attribs.perInstance){
        aiBuffers = [];
		for (let aiIndex = 0; aiIndex < attribs.perInstance.namesInShader.length; aiIndex++) {
            aiBuffers[aiIndex] = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, aiBuffers[aiIndex]);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attribs.perInstance.data[aiIndex]), gl.STATIC_DRAW);
		}
	}

    let indexBuffer = undefined;
    if (attribs.indices) {
		if (attribs.indices.data.length>65536)console.log("Unsigned Int Indices");
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            ((attribs.indices.data.length>65536)
                ? new Uint32Array(attribs.indices.data)
                : new Uint16Array(attribs.indices.data)),
            gl.STATIC_DRAW
        );
    }
	let isProgArray = Array.isArray(program);
	let VAO = undefined;
	if (isProgArray){
		VAO = [];
		program.forEach(function(e,i){VAO[i]=createSingleVao(e);})
	}
	else VAO = createSingleVao(program);
    return VAO;
	function createSingleVao(p) {
    	let vao =  gl.createVertexArray();
        gl.bindVertexArray(vao);
        for (let aIndex = 0; aIndex < aBuffers.length; aIndex++) {
            let aLocation = gl.getAttribLocation(p, attribs.perVertex.namesInShader[aIndex]);
            gl.bindBuffer(gl.ARRAY_BUFFER, aBuffers[aIndex]);
            gl.enableVertexAttribArray(aLocation);
            gl.vertexAttribPointer(
                // attriblocation, size, type, normalize, stride, offset
                aLocation, attribs.perVertex.srcDatumSizes[aIndex], gl.FLOAT, false, 0, 0
            );
        }
        if (aiBuffers){
			for (let aiIndex = 0; aiIndex < aiBuffers.length; aiIndex++) {
				let aiLocation = gl.getAttribLocation(p, attribs.perInstance.namesInShader[aiIndex]);
				gl.bindBuffer(gl.ARRAY_BUFFER, aiBuffers[aiIndex]);
				gl.enableVertexAttribArray(aiLocation);
				gl.vertexAttribPointer(
					// attriblocation, size, type, normalize, stride, offset
					aiLocation, attribs.perInstance.srcDatumSizes[aiIndex], gl.FLOAT, false, 0, 0
				);
				gl.vertexAttribDivisor(aiLocation, attribs.perInstance.divs[aiIndex]);
			}
		}
		if (indexBuffer) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        }
		gl.bindVertexArray(null);
        return vao;
    }
}
/**
 * readObj function has been adapted from the Apple-developed WebGL demo at
 * https://www.khronos.org/registry/webgl/sdk/demos/webkit/TeapotPerVertex.html
 * Copyright as below.
 */

/*
* Copyright (C) 2009 Apple Inc. All Rights Reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions
* are met:
* 1. Redistributions of source code must retain the above copyright
*    notice, this list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright
*    notice, this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
* EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
* PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
* CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
* EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
* PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
* PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
* OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


function readOBJ(url,callback)
{
	if (callback) {
        asyncRead(url,
			function (data) {
				callback(parseOBJ(data));
            }
        )
    }
    else{
		return parseOBJ(syncRead(url));
	}
	function parseOBJ(OBJdata)
	{
	    let vertexArray = [ ];
        let normalArray = [ ];
        let textureArray = [ ];
        let indexArray = [ ];
        let bounds = {
            min:[Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE],
            max:[-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE]
        };
        let vertex = [ ];
        let normal = [ ];
        let texture = [ ];
        let facemap = { };
        let index = 0;
		
		// NOTE: Obj file may have multiple sets of data
		// 	In such cases face indices are likely to be negative.
		let newFacesFlag = false;
        let lines = OBJdata.split("\n");
        for (let lineIndex in lines) {
            let line = lines[lineIndex].replace(/[ \t]+/g, " ").replace(/\s\s*$/, "");

            // ignore comments
            if (line[0] == "#")
                continue;

            let array = line.split(" ");
            if (array[0] == "v") {
				newFacesFlag = true;
                // vertex
                vertex.push(parseFloat(array[1]));
                vertex.push(parseFloat(array[2]));
                vertex.push(parseFloat(array[3]));
            }
            else if (array[0] == "vt") {
                // normal
                texture.push(parseFloat(array[1]));
                texture.push(parseFloat(array[2]));
            }
            else if (array[0] == "vn") {
                // normal
                normal.push(parseFloat(array[1]));
                normal.push(parseFloat(array[2]));
                normal.push(parseFloat(array[3]));
            }
            else if (array[0] == "f") {
                // face
				if (newFacesFlag){
					console.log(vertex.length/3,texture.length/2,normal.length/3);
					newFacesFlag = false;
				}
                if (array.length < 4 || array.length > 5) {
                    console.log("*** Error: face '"+line+"' not handled");
                    continue;
                }
				let indices=[1,2,3], nIndices=3;
				if (array.length == 5){
					nIndices = 6;
					indices[3] = 1; indices[4] = 3; indices[5] = 4;
				}
                //for (let i = 1; i < 4; ++i) 
				for (let id=0; id<nIndices; id++)
				{
					let i = indices[id];
					let f = array[i].split("/");
					let vtx, nor, tex;

					if (f.length == 1) {
						let num = parseInt(f[0]);
						if (num<0) vtx = vertex.length/3+num;
						else vtx =  num - 1;
						nor = vtx;
						tex = vtx;
						indexArray.push(vtx);
						let x = vertex[vtx*3],
							y = vertex[vtx*3+1],
							z = vertex[vtx*3+2];
						if (bounds.max[0]<x) bounds.max[0] = x; if (bounds.min[0]>x) bounds.min[0] = x;
						if (bounds.max[1]<y) bounds.max[1] = y; if (bounds.min[1]>y) bounds.min[1] = y;
						if (bounds.max[2]<z) bounds.max[2] = z; if (bounds.min[2]>z) bounds.min[2] = z;
					}
					else if (f.length == 3) {
						let num = parseInt(f[0]);
						if (num<0) vtx = vertex.length/3+num;
						else vtx =  num - 1;
						num = parseInt(f[1]);
						if (num<0) tex = texture.length/2+num;
						else tex =  num - 1;
						num = parseInt(f[2]);
						if (num<0) nor = normal.length/3+num;
						else nor =  num - 1;

						// do the vertices
						let x = 0;
						let y = 0;
						let z = 0;
						if (vtx * 3 + 2 < vertex.length) {
							x = vertex[vtx*3];
							y = vertex[vtx*3+1];
							z = vertex[vtx*3+2];
						}
						vertexArray.push(x); if (bounds.max[0]<x) bounds.max[0] = x; if (bounds.min[0]>x) bounds.min[0] = x;
						vertexArray.push(y); if (bounds.max[1]<y) bounds.max[1] = y; if (bounds.min[1]>y) bounds.min[1] = y;
						vertexArray.push(z); if (bounds.max[2]<z) bounds.max[2] = z; if (bounds.min[2]>z) bounds.min[2] = z;

						// do the texture coordinates
						x = 0;
						y = 0;
						if (texture.length) {
							if (tex * 2 + 1 < texture.length) {
								x = texture[tex * 2];
								y = texture[tex * 2 + 1];
							}
							textureArray.push(x);
							textureArray.push(y);
						}

						// do the normals
						x = 0;
						y = 0;
						z = 1;
						if(normal.length) {
							if (nor * 3 + 2 < normal.length) {
								x = normal[nor * 3];
								y = normal[nor * 3 + 1];
								z = normal[nor * 3 + 2];
							}
							normalArray.push(x);
							normalArray.push(y);
							normalArray.push(z);
						}
						//facemap[array[i]] = index++;
					}
					else {
						console.log("*** Error: did not understand face '"+array[i]+"'");
						return null;
					}
                }
            }
        }
        bounds.center = [0.5*(bounds.min[0]+bounds.max[0]),0.5*(bounds.min[1]+bounds.max[1]),0.5*(bounds.min[2]+bounds.max[2])];
        bounds.diagonal = Math.sqrt((bounds.min[0]-bounds.max[0])*(bounds.min[0]-bounds.max[0])+
            (bounds.min[1]-bounds.max[1])*(bounds.min[1]-bounds.max[1])+
            (bounds.min[2]-bounds.max[2])*(bounds.min[2]-bounds.max[2]));
		let model = {"bounds":bounds};
		if (indexArray.length){
			model.indices = indexArray;
			model.vertexPositions = vertex;
			if (texture.length) model.vertexTextureCoords = texture;
			if (normal.length==0) computeNormals();
			model.vertexNormals = normal;
		}
		else{
			model.vertexPositions = vertexArray;
			if (textureArray.length) model.vertexTextureCoords = textureArray;
			if (normalArray.length)model.vertexNormals = normalArray;
		}
        return model;
		function computeNormals(){
			// Computes normals from an index array and vertex coordinae array.
			// uses cross product to compute the vertex normals and weighted averages the normals computed
			// from the adjacent faces. 
			vertex.forEach(function(){normal.push(0);});
			for (let i=0; i<indexArray.length; i+=3){
				let vtx0 = indexArray[i]; 
				let x0 = vertex[3*vtx0],y0 = vertex[3*vtx0+1],z0 = vertex[3*vtx0+2];
				let vtx1 = indexArray[i+1];
				let x1 = vertex[3*vtx1]-x0,y1 = vertex[3*vtx1+1]-y0,z1 = vertex[3*vtx1+2]-z0;
				let vtx2 = indexArray[i+2];
				let x2 = vertex[3*vtx2]-x0,y2 = vertex[3*vtx2+1]-y0,z2 = vertex[3*vtx2+2]-z0;
				let nx = y1*z2-z1*y2, ny=z1*x2-x1*z2, nz=x1*y2-y1*x2;
				normal[3*vtx0] += nx; normal[3*vtx1] += nx; normal[3*vtx2] += nx;
				normal[3*vtx0+1] += ny; normal[3*vtx1+1] += ny; normal[3*vtx2+1] += ny;
				normal[3*vtx0+2] += nz; normal[3*vtx1+2] += nz; normal[3*vtx2+2] += nz;
			}
			for (let i=0; i<normal.length; i+=3){
				let length = Math.sqrt(normal[i]*normal[i]+normal[i+1]*normal[i+1]+normal[i+2]*normal[i+2]);
				if (length>0){
					normal[i] /= length; normal[i+1] /= length; normal[i+2] /= length;
				}
			}
		}
    }
}
/*
 * Copyright 2015, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

function createShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  let success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }else{
	  
  }
 
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function resize(canvas) {
  // Lookup the size the browser is displaying the canvas.
  let displayWidth  = canvas.clientWidth;
  let displayHeight = canvas.clientHeight;
 
  // Check if the canvas is not the same size.
  if (canvas.width  !== displayWidth ||
      canvas.height !== displayHeight) {
 
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }
}
//
// Adapted from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function load2DTexture(gl, url) {
	let texture = gl.createTexture();
	texture.loadComplete = false;
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Flip the image's Y axis to match the WebGL texture coordinate space.
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	// Because images have to be download over the internet
	// they might take a moment until they are ready.
	// Until then put a single pixel in the texture so we can
	// use it immediately. When the image has finished downloading
	// we'll update the texture with the contents of the image.

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
				new Uint8Array([0, 0, 255, 255])); // opaque blue

	let image = new Image();
	image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		texture.loadComplete = true;
		//gl.generateMipmap(gl.TEXTURE_2D);
	};
	image.src = url;

	return texture;
}

function loadCubemap(gl, cubemappath, texturefiles)
{
    var tex = gl.createTexture();
    tex.complete = false;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

    var imgs = [];
    var count = 6;
    for (var i=0; i<6;i++){
        var img = new Image();
        imgs[i] = img;
        img.onload = function() {
            //console.log("Cubemap image loaded.");
            count--;
            if (count==0){
                var directions =[
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                ];
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                for (var dir=0;dir<6;dir++){
                    gl.texImage2D(directions[dir], 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, imgs[dir]);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                tex.complete = true;
            }
        }
        imgs[i].src = cubemappath+texturefiles[i];
    }
    return tex;
}

