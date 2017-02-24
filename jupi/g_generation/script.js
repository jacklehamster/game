var canvas = document.getElementsByTagName("canvas")[0];
var ctx = canvas.getContext("2d");
var time = 0;
var nop = function() {};
var loop = nop;
var preNext = nop;
var loadGameFunction;
var skip = location.search.indexOf("skip") > 0;

var state = {
    name: "",
    slots: [],
};

function clearCanvas() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    makeBackground();
}
function nextScene() {
    loop = nop;
    preNext(); preNext = nop;
    sceneIndex = Math.min(scenes.length-1, sceneIndex+1);
    scenes[sceneIndex]();
}
function loadGame(savedState) {
    loop = nop;
    preNext(); preNext = nop;

    state = savedState;
    sceneIndex = scenes.indexOf(loadGameFunction);
    loadGameFunction(true);
}
function startOver() {
    state.name = "";
    state.slots = [];
    loop = nop;
    preNext(); preNext = nop;
    sceneIndex = 0;
    scenes[sceneIndex]();
}
function makeBox() {
    for(var i=0;i<4;i++) box[i] += (arguments[i]-box[i])/8;
}
function makeHero() {
    for(var i=0;i<4;i++) hero[i+5] += (arguments[i]-hero[i+5])/8;
}
function makeText(text, start) {
    var size = Math.floor((time-start)/100);
    return text.slice(0,Math.max(0,Math.min(size,text.length)));
}
function enterText(text,start) {
    return text + (time > start && (time-start) % 1200 < 900 ? "_":"");
}

function saveState(id, state) {
    localStorage.setItem(id, JSON.stringify(
        {
            name: state.name,
            slots: state.slots.map(
                function(img) {
                    return img.src;
                }
            )
        }
    ));
}

function loadState(id) {
    var state = JSON.parse(localStorage.getItem(id));
    if(state) {
        state.slots = state.slots.map(function(url) {
            var img = new Image();
            img.src = url;
            img.style.borderRadius = "50%";
            return img;
        });
    }
    return state;
}

var grd=ctx.createRadialGradient(
    canvas.width/2-50,canvas.height/2+20,20,
    canvas.width/2+50,canvas.height/2-20,300);
//grd.addColorStop(0,"#D0E0E0");
grd.addColorStop(0,"#FFFFFF");
grd.addColorStop(1,"#EEFEFE");

var started = false;
function makeBackground() {
    ctx.fillStyle=started||sceneIndex>0?grd:"#000000";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#000000";
}
var hero = [null,0,0,0,0,0,0,0,0];
var box = [canvas.width/2,canvas.height/2,1,1];
var sceneIndex = 0;
var scenes = [
    function() {
        var start = time+1000;
        var error = 0;

        loop = function () {
            started = time>=start;
            clearCanvas();
            ctx.font = "30px Comic";
            ctx.fillText(makeText("Welcome... what is your name?", start),260,150);
            if(time - start > 4000) {
                var shake = error ? Math.max(0,(300+error-time)/3) : 0;
                if(shake ===0) {
                    error = 0;
                }
                makeBox(
                    200 + (Math.random()-.5)*shake,
                    200 + (Math.random()-.5)*shake,
                    500,
                    80
                );
            } else {
                makeBox(0,0,canvas.width,canvas.height);
                if(!started) {
                    ctx.fillStyle=grd;
                    ctx.fillRect.apply(ctx,box);
                }
            }
            ctx.strokeRect.apply(ctx,box);
            ctx.font = "60px Comic";
            ctx.fillText(enterText(state.name,start + 4500),250,260);
        }
        var f;
        document.addEventListener("keydown",
            f = function(e) {
                e = e || event;
                if(e.keyCode===13) {
                    if(state.name === "SKIP") {
                        var savedState = loadState("game");
                        if(savedState) {
                            loadGame(savedState);
                        } else {
                            state.name = "";
                        }
                    } else if(state.name.length) {
                        nextScene();
                    } else {
                        error = time;
                    }
                } else if(e.keyCode===8) {
                    state.name = state.name.slice(0,state.name.length-1);
                } else {
                    var key = e.key || String.fromCharCode("0x"+e.keyIdentifier.split("U+")[1]);
                    state.name += key.toUpperCase();
                    if(state.name===" ") state.name = "";
                    if(state.name.length>10) state.name = state.name.slice(1);
                }
                e.preventDefault();
            }
        );
        function cancel(e) {
            e = e || event;
            e.preventDefault();
            return false;
        }
        document.addEventListener('dragover', cancel);
        document.addEventListener('dragenter', cancel);
        document.addEventListener('dragleave', cancel);
        document.addEventListener('drop', cancel);

        preNext = function() {
            document.removeEventListener("keydown",f);
            document.removeEventListener('dragover', cancel);
            document.removeEventListener('dragenter', cancel);
            document.removeEventListener('dragleave', cancel);
            document.removeEventListener('drop', cancel);
        }
    },
    promptImage = function() {
        var start = time;
        var message = [
            null,
            ["Hello " + state.name + ". May I see you?", "Please drop a picture in the box below."],
            ["You look great "+state.name+"! Let's keep going.", "What do you like? Please drop a picture below"],
            ["How about something you dislike?", "Can you drop that picture below?"],
            ["Finally, can you drop one more picture?", "Just choose something random."]
        ];

        var dropped = 0;
        var mx = 0, my = 0;
        var img = new Image();
        state.slots[sceneIndex-1] = img;
        img.style.borderRadius = "50%";
        var dragOver = 0;
        img.addEventListener("load", function(e) {
            hero[5] = mx - img.naturalWidth/2;
            hero[6] = my - img.naturalHeight/2;
            hero[7] = img.naturalWidth;
            hero[8] = img.naturalHeight;
        });
        hero[0] = img;
        loop = function() {
            clearCanvas();
            ctx.font = "25px Comic";
            ctx.fillText(makeText(message[sceneIndex][0],start),290,30);
            ctx.fillText(makeText(message[sceneIndex][1],start+4500),255,60);
            var max = Math.max(img.naturalWidth, img.naturalHeight);
            if(dropped && time-dropped>600 && img.naturalWidth) {
                makeBox(
                    400,
                    175,
                    100*img.naturalWidth/max,
                    100*img.naturalHeight/max
                );
            } else {
                makeBox(
                    300 + dragOver*Math.sin(time/30)*20,
                    75 + dragOver*Math.sin(time/30)*20,
                    300 -2*dragOver*Math.sin(time/30)*20,
                    300 -2*dragOver*Math.sin(time/30)*20);
            }
            ctx.strokeRect.apply(ctx,box.map(Math.round));
            hero[3] = img.naturalWidth; hero[4] = img.naturalHeight;
            makeHero(400,175,100*img.naturalWidth/max,100*img.naturalHeight/max);
            ctx.drawImage.apply(ctx,hero);
            if(dropped && time - dropped > 1000) {
                nextScene();
            }
        }

        function cancel(e) {
            e = e || event;
            if(e.type=='dragenter') {
                dragOver = 1;
            }else if(e.type=='dragleave') {
                dragOver = 0;
            }
            e.preventDefault();
            return false;
        }

        preNext = function() {
            document.removeEventListener('dragover', cancel);
            document.removeEventListener('dragenter', cancel);
            document.removeEventListener('dragleave', cancel);
            document.removeEventListener('drop', f);
        }

        // Tells the browser that we *can* drop on this target
        var f;
        document.addEventListener('dragover', cancel);
        document.addEventListener('dragenter', cancel);
        document.addEventListener('dragleave', cancel);
        document.addEventListener('drop', f = function (e) {
            e = e || event;
            dropped = time;
            dragOver = 0;
            if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.
            mx = e.pageX;
            my = e.pageY;
            var dt    = e.dataTransfer;
            var items = dt.items;
            var files = dt.files;
            var file = files[0];
            var reader = new FileReader();
            reader.addEventListener( 'loadend', function(e) {
                if((file.type!='image/gif'
                    &&file.type!='image/jpeg'
                    &&file.type!='image/png')
                    ||file.size>10000000) {
                    return;
                }
                var bin = this.result;
                img.src = this.result;
                reader = null;
            });

            reader.readAsDataURL(file);
            return false;
        });
    },
    promptImage,
    promptImage,
    promptImage,
    function() {
        var start = time;
        makeBox(
            0,
            0,
            canvas.width,
            canvas.height
        );

        function cancel(e) {
            e = e || event;
            e.preventDefault();
            return false;
        }
        document.addEventListener('dragover', cancel);
        document.addEventListener('dragenter', cancel);
        document.addEventListener('dragleave', cancel);
        document.addEventListener('drop', cancel);

        loop = function () {
            clearCanvas();
            ctx.font = "30px Comic";
            ctx.fillText(makeText("Let's go over this again shall we?", start),260,100);
            ctx.fillText(makeText("        is what "+state.name+" looks like.", start+4000),260,150);
            ctx.fillText(makeText("        is something "+state.name+" is fond of.", start+8000),260,200);
            ctx.fillText(makeText(".. not so much ", start+13000),260,250);
            ctx.fillText(makeText("About            ... I just don't know what to say", start+17000),260,300);
            ctx.fillText(makeText("Are you happy with your choices?", start+26000),260,350);
            ctx.fillText(makeText("Press the  space bar  for YES, esc for NO.", start+31000),260,400);
            for(var i=0; i<state.slots.length;i++) {
                if(time-start > timings[i]) {
                    var scale = 50/state.slots[i].naturalHeight;
                    ctx.drawImage(state.slots[i],
                        0,0,state.slots[i].naturalWidth,state.slots[i].naturalHeight,
                        locations[i][0],locations[i][1],state.slots[i].naturalWidth*scale, state.slots[i].naturalHeight*scale);
                }
            }
            if(time-start > 33000) {
                makeBox(
                    locations[4][0]+Math.sin(time/50)*8,
                    locations[4][1]+Math.sin(time/50)*8,
                    locations[4][2]+-2*Math.sin(time/50)*8,
                    locations[4][3]+-2*Math.sin(time/50)*8
                );
                ctx.strokeRect.apply(ctx,box.map(Math.round));
            }
        }

        var f;
        document.addEventListener("keydown",
            f = function(e) {
                e = e || event;
                if(time-start > 33000 || skip) {
                    if(e.keyCode===32) {
                        nextScene();
                    } else if(e.keyCode===27) {
                        startOver();
                    }
                }
                e.preventDefault();
            }
        );
        preNext = function() {
            document.removeEventListener("keydown",f);
            document.removeEventListener('dragover', cancel);
            document.removeEventListener('dragenter', cancel);
            document.removeEventListener('dragleave', cancel);
            document.removeEventListener('drop', cancel);
        }
    },
    loadGameFunction = function(loading) {
        if(loading) {
            loop = function () {
                clearCanvas();
                if(state.slots.every(function(slot) {
                    return slot.naturalWidth;
                })) {
                    nextScene();
                }
            }
        } else {
            nextScene();
        }
    },
    function() {
        saveState("game", state);

        function cancel(e) {
            e = e || event;
            e.preventDefault();
            return false;
        }
        document.addEventListener('dragover', cancel);
        document.addEventListener('dragenter', cancel);
        document.addEventListener('dragleave', cancel);
        document.addEventListener('drop', cancel);

        var scale = 50/state.slots[0].naturalHeight;
        var pos = [
            locations[0][0],
            locations[0][1],
            state.slots[0].naturalWidth*scale,
            state.slots[0].naturalHeight*scale,
        ];
        var dx=10,dy=0;
        var bounce = 0;
        var bounceTime = 0;

        var currentTime = time;
        var delay = time+1000;

        var lines = [
            [900,410,200,delay],
            [950,420,150,delay],
            [1000,415,100,delay],
            [1100,435,170,delay],
            [1200,430,130,delay],
        ];
        var mountains = [
            [1970,150,delay],
            [2050,250,delay],
            [2130,200,delay],
            [3300,300,delay],
            [3450,270,delay],
        ];

        var foeSizes = [
            50,300,400,500,800
        ];

        var foes = [
            [4000,0,delay,300,0,0],
            [12000,0,delay,500,0,0],
            [13000,0,delay,100,0,0],
            [50000,0,delay,100,0,0],
            [70000,0,delay,350,0,0],
            [82000,0,delay,100,1,0],
            [103000,0,delay,100,1,0],
            [110000,0,delay,100,1,0],
        ];

        var rand = 2;

        var ppos = {};
        function getFoePosition(foe) {
            var foeScale = foe[3]/3/state.slots[2].naturalHeight;
            var t = time-foe[2];
            var x,y;
            x = foe[0]-t/2;
            var h = foe[3]<=100 ? (t*1.5 % (foe[3]*2)-foe[3])/foe[3] : (t/4 % (foe[3]*2)-foe[3])/foe[3];
            h = 1-h*h;
            y = foe[4]===0
                ? 400-state.slots[2].naturalHeight*foeScale-h*foe[3]/2
                : h*foe[3]/2;
            ppos.x = x+state.slots[2].naturalWidth*foeScale/2;
            ppos.y = y+state.slots[2].naturalHeight*foeScale/2;
            return ppos;
        }



        function drawFoe(foe) {
            var foeScale = foe[3]/3/state.slots[2].naturalHeight;
            var t = time-foe[2];
            var pos = getFoePosition(foe);

            if(!foe[5]) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(pos.x, pos.y,
                    Math.min(state.slots[2].naturalWidth*foeScale,state.slots[2].naturalHeight*foeScale)/2,
                    0, Math.PI*2,true
                );
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(state.slots[2],
                    state.slots[2].naturalWidth*0,
                    state.slots[2].naturalHeight*0,
                    state.slots[2].naturalWidth*1,
                    state.slots[2].naturalHeight*1,
                    pos.x-state.slots[2].naturalWidth*foeScale/2,
                    pos.y-state.slots[2].naturalHeight*foeScale/2,
                    state.slots[2].naturalWidth*foeScale,
                    state.slots[2].naturalHeight*foeScale
                );
                ctx.restore();
            }
            if(pos.x+100 < 0) {
                if(gameOver) {
                    foe[5] = 1;
                } else {
                    foe[0] += 1000 + 1000*Math.random();
                    rand += (Math.random()-.5)*2;
                    rand = Math.max(0,rand);
                    foe[5] = 0;
                }
//                foe[3] = foeSizes[ Math.round(rand) % foeSizes.length ];
            }
        }

        function drawLine(line) {
            var t = time-line[3];
            var x = line[0]-t/5;
            ctx.moveTo(x,line[1]);
            ctx.lineTo(x+line[2],line[1]);
            if(x+line[1] < 0) {
                line[3] = time;
            }
        }

        var foes = [
            [4000,0,delay,300,0,0],
            [12000,0,delay,500,0,0],
            [13000,0,delay,100,0,0],
            [20000,0,delay,100,0,0],
            [22000,0,delay,350,0,0],
            [42000,0,delay,100,1,0],
            [50300,0,delay,100,1,0],
            [106100,0,delay,100,1,0],
        ];

        var bonuses = [
            [900,400,delay,true],
            [900,400,delay,true],
            [900,400,delay,true],
            [900,400,delay,true],
            [900,400,delay,true],
            [900,400,delay,true],
            [900,400,delay,true],
            [900,400,delay,true],
        ];
        var bonusIndex = 0;
        function drawBonus(bonus) {
            var t = time - bonus[2];
            var scale = 50/state.slots[1].naturalHeight;
            var x = bonus[0] - t/5;
            var y = bonus[1] - state.slots[1].naturalHeight*scale/2;
            if(!bonus[3]) {
                ctx.drawImage(state.slots[1],
                    state.slots[1].naturalWidth*0,
                    state.slots[1].naturalHeight*0,
                    state.slots[1].naturalWidth*1,
                    state.slots[1].naturalHeight*1,
                    x,
                    y,
                    state.slots[1].naturalWidth*scale,
                    state.slots[1].naturalHeight*scale
                );
            }
            if(x+state.slots[1].naturalWidth*scale < 0) {
                bonus[4] = true;
            }
        }

        function drawMountain(mountain) {
            var t = time - mountain[2];
            var x = mountain[0] - t/20;
            var height = mountain[1]/2;
            ctx.beginPath();
            ctx.moveTo(x,400);
            ctx.lineTo(x+height,400-height);
            ctx.lineTo(x+height*2,400);
            ctx.closePath();
            ctx.fill();
//            ctx.beginPath();
//            ctx.moveTo(x+height,400-height);
//            ctx.lineTo(x+height*2,400);
//            ctx.stroke();
            if(x+height*2 < 0) {
                mountain[2] = time;
            }
        }

        var shots = [
            [900,-1000,delay,true],
//            [900,-1000,delay+400,true],
//            [900,-1000,delay+800,true],
//            [900,-1000,delay+1200,true],
//            [900,-1000,delay+1600,true],
        ];
//        var shotIndex = 0;

        var spos = {};
        function getShotPosition(shot) {
            var t = time - shot[2];
            var scale = 40/state.slots[3].naturalHeight;
            var x = shot[0] + t;
            var y = shot[1] + state.slots[3].naturalHeight*scale/2;

            var h = (t-300)/300;
            h = 1-h*h;

            y -= h*250;
            spos.x = x;
            spos.y = y;
            return spos;
        }

        function drawShot(shot) {
            if(gameOver) return;
            var t = time - shot[2];
            var scale = 40/state.slots[3].naturalHeight;
            var ppos = getShotPosition(shot);
            var angle = t/100;
            if(!shot[3]) {
                ctx.translate(ppos.x, ppos.y);
                ctx.rotate(angle);
                ctx.drawImage(state.slots[3],
                    0,
                    0,
                    state.slots[3].naturalWidth,
                    state.slots[3].naturalHeight,
                    - state.slots[3].naturalWidth*scale/2,
                    - state.slots[3].naturalHeight*scale/2,
                    state.slots[3].naturalWidth*scale,
                    state.slots[3].naturalHeight*scale
                );
                ctx.rotate(-angle);
                ctx.translate(-ppos.x, -ppos.y);
            }

            if(t > 800 || shot[3]) {
                shot[0] = pos[0];
                shot[1] = pos[1];
                shot[2] = time;
                shot[3] = false;
            }
        }

        var particles = new Array(100);
        for(var i=0;i<particles.length;i++) {
            particles[i] = [0, 0, 0, 0, delay, null, true];
        }
        var particleIndex = 0;
        function fetchParticle() {
            var particle = particles[particleIndex];
            particleIndex = (particleIndex+1)%particles.length;
            return particle;
        }

        var movingParticles = [];

        function throwParticle(x,y,img) {
            var particle = fetchParticle();
            particle[0] = x;
            particle[1] = y;
            particle[2] = (Math.random()-.5)*100;
            particle[3] = -(.5+Math.random())*100;
            particle[4] = time;
            particle[5] = img;
            particle[6] = false;
            movingParticles.push(particle);
        }

        function drawParticle(particle) {
            var t = time - particle[4];
            var img = particle[5];
            var scale = 20/img.naturalHeight;
            var x = particle[0]-img.naturalWidth*scale + t/500*particle[2];
            var y = particle[1];

            var h = (t-250)/500;
            h = 1-h*h;

            y += h*particle[3];


            ctx.save();
            ctx.beginPath();
            ctx.arc(x+img.naturalWidth*scale/2, y+img.naturalHeight*scale/2,
                Math.min(img.naturalWidth*scale,img.naturalHeight*scale)/2,
                0, Math.PI*2,true
            );
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(particle[5],
                0,
                0,
                img.naturalWidth,
                img.naturalHeight,
                x,
                y,
                img.naturalWidth*scale,
                img.naturalHeight*scale
            );
            ctx.restore();

            if(t > 3000) {
                particle[6] = true;
            }
        }

        var gameOver = 0;

        function checkCollision(foe,index) {
            if(gameOver) {
                return;
            }
            if(!foe[5]) {
                var foeScale = foe[3]/3/state.slots[2].naturalHeight;
                var radius = Math.min(state.slots[2].naturalWidth*foeScale,state.slots[2].naturalHeight*foeScale)/2;

                var ppos= getFoePosition(foe);

                var dx = pos[0] - ppos.x;
                var dy = pos[1] - ppos.y;
                var dist = Math.sqrt(dx*dx+dy*dy);
                if(dist < radius + pos[2]/4) {
                    gameOver = time;
                    for(var p=0;p<10;p++) {
                        throwParticle(pos[0],pos[1],state.slots[0]);
                    }
                    return;
                }

                for(var i=0;i<shots.length;i++) {
                    if(!shots[i][3]) {
                        var spos = getShotPosition(shots[i]);
                        if(spos.x < 900) {
                            var dx = ppos.x - spos.x;
                            var dy = ppos.y - spos.y;
                            var dist = Math.sqrt(dx*dx+dy*dy);
                            //console.log(dist, radius+20);
                            if(dist < radius+10) {
                                foe[5] = 1;
                                shots[i][3] = true;
                                var bonus = bonuses[bonusIndex];
                                bonusIndex = (bonusIndex + 1)%bonuses.length;
                                bonus[0] = ppos.x;
                                bonus[1] = ppos.y;
                                bonus[2] = time;
                                bonus[3] = false;
                                for(var p=0;p<10;p++) {
                                    throwParticle(ppos.x,ppos.y,state.slots[2]);
                                }
                            }
                        }
                    }
                }
            }
        }

        function filterParticle(particle) {
            return !particle[6];
        }

        loop = function () {
            clearCanvas();
            var w = time-bounceTime < 200 && bounce ? Math.cos((time-bounceTime)/10) * bounce/5 : 0;

            ctx.beginPath();
            lines.forEach(drawLine);
            ctx.stroke();

            ctx.fillStyle = "#EEEEFF";
            mountains.forEach(drawMountain);

            foes.forEach(checkCollision);

            bonuses.forEach(drawBonus);
            shots.forEach(drawShot);

            if(!gameOver) {
                var x = pos[0];
                var y = pos[1];
                var angle = dy/100;
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.drawImage(state.slots[0],
                    0,0,state.slots[0].naturalWidth,state.slots[0].naturalHeight,
                    w-pos[2]/2,
                    -w-pos[3]/2,
                    pos[2]-w*2,
                    pos[3]+w*2);
                ctx.rotate(-angle);
                ctx.translate(-x, -y);
            }


            foes.forEach(drawFoe);
            movingParticles.forEach(drawParticle);
            movingParticles = movingParticles.filter(filterParticle);

            if(!gameOver) {
                while(currentTime < time) {
                    if(space) {
                        jump(false);
                    }
                    if(pos[1]+pos[3]/2+dy > 400) {
                        pos[1] = 400 - pos[3] / 2;
                        bounceTime = time;
                        bounce = dy;
                        dy = -dy * bounceValue;
                        if (dy > -1) {
                            dy = 0;
                            bounce = 0;
                            bounceTime = 0;
                        }
                    } else if(pos[1]-pos[3]/2+dy < 0) {
                        bounceTime = time;
                        bounce = dy;
                        dy = -dy * bounceValue;
                    } else if(pos[1] < 400-pos[3]/2) {
                        dy++;
                    }
                    if(dy) {
                        pos[1] += dy;
                    }
                    currentTime+=20;
                }
            }

            makeBox(
                0,
                400,
                900,
                2
            );
            ctx.strokeRect.apply(ctx,box.map(Math.round));
        }

        var plane = false;
        var doubleJump = false;
        var jumpCount = 0;
        function jump(justJump) {
            if(plane) {
                if(pos[1] === 400-pos[3]/2 && dy===0) {
                    dy = -5;
                } else if(justJump) {
                    dy = -5;
                } else {
                    dy-= 1.5;
                }
            } else {
                if(pos[1] === 400-pos[3]/2 && dy===0) {
                    dy = -16;
                    jumpCount = 1;
                } else if(doubleJump && justJump && jumpCount == 1) {
                    dy = -16;
                    jumpCount = 2;
                } else {
                    dy -= 1/2;
                }
            }
        }

        var f,f2;
        document.addEventListener("keydown",
            f = function(e) {
                e = e || event;
                if(e.keyCode===32) {
                    if(!gameOver) {
                        jump(!space);
                        space = true;
                    } else if(time-gameOver>3000) {
                        loadGame(state);
                    }
                } else if(e.keyCode===27) {
                    startOver();
                }
                e.preventDefault();
            }
        );
        document.addEventListener("keyup",
            f2 = function(e) {
                e = e || event;
                if(e.keyCode===32) {
                    space = false;
                }
                e.preventDefault();
            }
        );
        var space = false;

        preNext = function() {
            document.removeEventListener("keydown",f);
            document.removeEventListener("keyup",f2);
            document.removeEventListener('dragover', cancel);
            document.removeEventListener('dragenter', cancel);
            document.removeEventListener('dragleave', cancel);
            document.removeEventListener('drop', cancel);
        }
    },
    nop,
];

var jumpValue = -5;
var floatValue = 1;
var bounceValue = .2;
var locations = [[250,110],[250,165],[445,215],[345,265],
    [375,374,125,40],
];
var timings = [4000, 8000, 15000, 18000];


scenes[0]();
function looper(t) {
    time = t;
    loop();
    requestAnimationFrame(looper);
}
looper(0);