define([
    'utils',
], function(Utils) {

     'use strict';
    
    const MAX_TEXTURES = 16;
    const SPRITE_SHEET_SIZE = 2048;
    const CHUNKSIZES = 8;

    const chunks = [];

    /**
     *  FUNCTION DEFINITIONS
     */   
     
    function doesFit(tex,x,y,width,height) {
        if(x+width>SPRITE_SHEET_SIZE || y+height>SPRITE_SHEET_SIZE) return false;
    
        if(chunks[tex]) {
            for(let xi=0;xi<width;xi++) {
                if(chunks[tex][x+xi]) {
                    for(let yi=0;yi<height;yi++) {
                        if(chunks[tex][x+xi][y+yi]) {
                            return false;
                        }
                    }                
                }
            }
        }
        
        return true;
    }    
     
    function findSlot(canvas) {
        if(canvas.width <= 1 && canvas.height <= 1) {
            return null;
        }
        if(canvas.width>SPRITE_SHEET_SIZE||canvas.height>SPRITE_SHEET_SIZE) {
            return null;
        }
        const chunkWidth = Math.ceil(canvas.width/CHUNKSIZES);
        const chunkHeight = Math.ceil(canvas.height/CHUNKSIZES);
    
        for(let tex=0;tex<MAX_TEXTURES;tex++) {
            for(let x=0;x<SPRITE_SHEET_SIZE/CHUNKSIZES-chunkWidth;x++) {
                for(let y=0;y<SPRITE_SHEET_SIZE/CHUNKSIZES-chunkHeight;y++) {
                    if(doesFit(tex,x,y,chunkWidth,chunkHeight)) {
                        return {tex:tex,x:x*CHUNKSIZES,y:y*CHUNKSIZES};
                    }
                }                
            }
        }    
        return null;
    }
    
    function fillSlot(tex,x,y,canvas) {
        if(!chunks[tex]) chunks[tex] = [];
        const chunkWidth = Math.ceil((canvas.width+1)/CHUNKSIZES);
        const chunkHeight = Math.ceil((canvas.height+1)/CHUNKSIZES);
    
        for(let xi=0;xi<chunkWidth;xi++) {
            if(!chunks[tex][x/CHUNKSIZES+xi]) chunks[tex][x/CHUNKSIZES+xi] = [];
            for(let yi=0;yi<chunkHeight;yi++) {
                chunks[tex][x/CHUNKSIZES+xi][y/CHUNKSIZES+yi] = canvas;
            }                
        }
    }    
    
    function getSlot(canvas) {
        const slot = findSlot(canvas);
        if(slot) {
            fillSlot(slot.tex,slot.x,slot.y,canvas);
        }
        return slot;
    }
     
    function destroyEverything() {
        chunks.length = 0;
    }
   
    /**
     *  PUBLIC DECLARATIONS
     */
    function Packer() {
    }

    Packer.getSlot = getSlot;

    Utils.onDestroy(destroyEverything);

    /**
     *   PROCESSES
     */

    return Packer;
 });
