const pi = 3.141593
const pi_2 = 1.570796
const pi2 = 6.283185
const rad2deg = 57.295780
const deg2rad = 0.017453
const vw = () => window.innerWidth;
const vw_2 = () => window.innerWidth / 2;
const vh = () => window.innerHeight;
const vh_2 = () => window.innerHeight / 2;


const game = {
    p1: {
        id: "p1",
        scale: 2.0,
        pos: {
            x: -580,
            y: 0
        },
        vel: 0,
        dVel: 0,
        dir: 0,
        dDir: 0,
        step: function (timestamp) {
            let dx = this.vel * Math.sin(this.dir);
            let dy = -this.vel * Math.cos(this.dir);
            this.pos.x += dx;
            this.pos.y += dy;

            this.dVel = (game.controls.forward.frame > 0) * 0.0510;
            this.dVel += (game.controls.back.frame > 0) * (-0.10);
            this.vel += this.dVel;
            this.vel *= 0.99;
            this.vel = Math.max(this.vel, -0.6);

            let steerCurve = Math.min((timestamp - Math.max(game.controls.right.frame, game.controls.left.frame)) / 300, 1.0);
            if (game.controls.left.frame) this.dDir -= 0.0041 * steerCurve * Math.min(this.vel / 1.0, 1.0);
            if (game.controls.right.frame) this.dDir += 0.0041 * steerCurve * Math.min(this.vel / 1.0, 1.0);
            this.dDir *= 0.9;
            this.dir += this.dDir;
        },
        draw: function () {
            document.getElementById(this.id).style.transform = `translateX(${this.pos.x}px) translateY(${this.pos.y}px) rotate(${this.dir}rad) rotateY(${-game.camera.rot.x}rad) scale(${this.scale}) `;
        }
    },
    controls: {
        forward: { frame: 0, code: 38 },
        back: { frame: 0, code: 40 },
        left: { frame: 0, code: 37 },
        right: { frame: 0, code: 39 },
        jump: { frame: 0, code: 32 },

        read: function (event, frame) {
            Object.getOwnPropertyNames(this).forEach(name => {
                if (event.keyCode == this[name].code) {
                    if (this[name].frame == 0 || frame == 0)
                        this[name].frame = frame;
                }
            });
        },
    },
    camera: {
        trackedObject: undefined,
        speed: 0.2,
        offset: -5,
        distance: 20,
        perspective: 0,
        fov: 0,
        target: {
            x: 0,
            y: 0,
            z: 0
        },
        rot: {
            x: 0,
            y: 0,
            z: 0
        },
        pos: { z: 0 },
        zoom: 1,
        step: function () {
            this.speed = document.getElementsByName("camera.speed")[0].value;
            this.pos.z = document.getElementsByName("camera.pos.z")[0].value;

            let o = this.trackedObject;
            this.target.x += (o.pos.x - this.offset * Math.sin(o.dir) - this.target.x) * this.speed;
            this.target.y += (o.pos.y + this.offset * Math.cos(o.dir) - this.target.y) * this.speed;
            this.rot.z = (this.speed * o.dir) + (1.0 - this.speed) * this.rot.z;
            this.rot.x = document.getElementsByName("camera.rot.x")[0].value * deg2rad;
            this.offset = document.getElementsByName("camera.offset")[0].value;
            this.distance = document.getElementsByName("camera.distance")[0].value;
            this.fov = document.getElementsByName("camera.fov")[0].value * deg2rad;
            this.perspective = vw_2() / Math.tan(this.fov / 2);
        },
        draw: function () {
            document.getElementById("target").style.transform = `translateX(${this.target.x}px) translateY(${this.target.y}px) rotate(${this.rot.z}rad)`;
            document.getElementById("world").style.transformOrigin = `${vw_2()}px ${vh_2()}px`
            document.getElementById("world").style.transform = `
            scale(${this.zoom})
            perspective(${this.perspective}px)
            rotateX(${this.rot.x}rad)
            translateZ(${-(this.distance - this.perspective) * Math.cos(this.rot.x) - this.pos.z}px)
            rotateZ(${-this.rot.z}rad)
            translateY(${-this.target.y - (this.distance - this.perspective) * Math.cos(this.rot.z) * Math.sin(this.rot.x)}px)
            translateX(${-this.target.x + (this.distance - this.perspective) * Math.sin(this.rot.z) * Math.sin(this.rot.x)}px)
            `;
            let skyWidth = window.innerWidth / this.fov * pi2;
            let horizon = this.perspective * Math.tan(this.rot.x - pi_2) + vh_2();
            sky.style.backgroundSize = `${skyWidth}px`;
            sky.style.backgroundPositionX = `${-this.rot.z / pi2 * skyWidth +  vw_2()}px`;
            sky.style.backgroundPositionY = `${horizon - parseFloat(getComputedStyle(sky).backgroundSize.split(' ')[0]) / game.skyRatio() }px`;
            document.body.style.backgroundImage = `linear-gradient(#f8e890 ${horizon - 10}px, #009F00 ${horizon + 10}px)`;
        }
    },
    skyRatio: ()=> {return sky.naturalWidth / sky.naturalHeight},
    init: function () {
        document.addEventListener('keydown', (event) => this.controls.read(event, event.timeStamp));
        document.addEventListener('keyup', (event) => this.controls.read(event, 0));
        game.camera.trackedObject = game.p1;

        const sky = document.getElementById("sky");
        sky.onload = ()=>{this.skyRatio = sky.naturalWidth / sky.naturalHeight;}
        sky.style.backgroundImage = `url('${sky.src}')`;
        
        

        window.requestAnimationFrame(game.step);


    },
    step: function (timestamp) {

        game.p1.step(timestamp);
        game.camera.step();
        game.p1.draw();
        game.camera.draw();





        window.requestAnimationFrame(game.step);
    },
};
game.init();