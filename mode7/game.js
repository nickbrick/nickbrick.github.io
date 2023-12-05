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
    stop: function () { this.step = function () { }; },
    p1: {
        id: "p1",
        elms: { logical: undefined, shadow: undefined, visual: undefined },
        scale: 1.0,
        pos: {
            x: -0,
            y: 0
        },
        offset: -0.5,
        toScreen: function () {
            let rect = this.elms.logical.getBoundingClientRect();
            return {
                x: rect.left,
                y: rect.top,
            }
        },
        vel: 0,
        dVel: 0,
        dir: 0,
        dDir: 0,
        angle: function () { return game.camera.rot.z - this.dir },
        init: function () {
            this.elms.logical = document.createElement("div");
            this.elms.logical.id = this.id + "-logical";
            this.elms.logical.classList = "sprite logical";
            document.getElementById("world").appendChild(this.elms.logical);

            this.elms.shadow = document.createElement("div");
            this.elms.shadow.id = this.id + "-shadow";
            this.elms.shadow.classList = "sprite shadow";
            document.getElementById("world").appendChild(this.elms.shadow);

            this.elms.visual = document.getElementById(this.id);
        },


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
            if (Math.abs(this.vel) < 0.1 && Math.abs(this.dVel) < 0.01) this.vel = 0;

            let steerCurve = Math.min((timestamp - Math.max(game.controls.right.frame, game.controls.left.frame)) / 300, 1.0);
            if (game.controls.left.frame) this.dDir -= 0.0041 * steerCurve;//* Math.min(this.vel / 1.0, 1.0);
            if (game.controls.right.frame) this.dDir += 0.0041 * steerCurve;//* Math.min(this.vel / 1.0, 1.0);
            this.dDir *= 0.9;
            this.dir += this.dDir;



        },
        draw: function () {
            this.elms.logical.style.transform = `
            translateX(${vw_2() + this.pos.x}px)
            translateY(${vh_2() + this.pos.y}px)
            rotate(${this.dir}rad)
            `;

            this.elms.shadow.style.width = `${this.size}px`;
            this.elms.shadow.style.height = `${this.size}px`;
            this.elms.shadow.style.transform = `
            translateX(${vw_2() + this.pos.x - this.size / 2}px)
            translateY(${vh_2() + this.pos.y - this.size / 2}px)
            rotate(${this.dir}rad)
            scale(${this.scale})`;

            let diff = { x: this.pos.x - game.camera.pos().x, y: this.pos.y - game.camera.pos().y, z: 0 - game.camera.pos().z };
            let dot = diff.x * game.camera.normal.x + diff.y * game.camera.normal.y + diff.z * game.camera.normal.z;
            this.elms.visual.style.backgroundImage = `url('${this.elms.visual.src}')`;
            this.elms.visual.style.width = `${this.elms.visual.naturalHeight}px`;
            this.elms.visual.style.height = `${this.elms.visual.naturalHeight}px`;
            let frameSize = this.elms.visual.naturalHeight + 1;
            let frames = (this.elms.visual.naturalWidth) / frameSize;
            let frameAngSize = pi_2 / frames;
            let correctedAngle = this.angle() + frameAngSize / 2;
            let halfCircleFract = (correctedAngle / pi) % 2;
            let flip = halfCircleFract > 0 ^ Math.abs(halfCircleFract) % 2 > 1;
            let sign = flip ? -1 : 1;
            if (Math.abs(halfCircleFract % 2) > 1){ 
                    halfCircleFract = (sign * 2 - halfCircleFract);
            }
            let frame = Math.floor(Math.abs(halfCircleFract) * frames);
            if (frame == 0 || frame == frames-1) sign = 1;
            this.elms.visual.style.backgroundPositionX = `${-frame * frameSize}px`;
            this.elms.visual.style.transform = `
            translateX(${this.toScreen().x - parseFloat(getComputedStyle(this.elms.visual).width) / 2}px)
            translateY(${this.toScreen().y - parseFloat(getComputedStyle(this.elms.visual).width) / 2}px)
            translateZ(0px)
            scale(${this.scale * (game.camera.perspective / dot)})
            translateY(${- this.elms.visual.naturalHeight / 2}px)
            scaleX(${sign})
            `;
            console.clear();
            console.log(flip);
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
        normal: {
            x: 0,
            y: 0,
            z: -1
        },
        pos: function (world = false) {
            return {
                x: this.target.x + (this.distance - world * this.perspective) * Math.sin(this.rot.z) * Math.sin(this.rot.x),
                y: this.target.y - (this.distance - world * this.perspective) * Math.cos(this.rot.z) * Math.sin(this.rot.x),
                z: this.height + (this.distance - world * this.perspective) * Math.cos(this.rot.x)
            };
        },
        height: 0,
        zoom: 1,
        step: function () {
            this.speed = parseFloat(document.getElementsByName("camera.speed")[0].value);
            this.height = parseFloat(document.getElementsByName("camera.height")[0].value);

            let o = this.trackedObject;
            this.target.x += (o.pos.x - this.offset * Math.sin(o.dir) - this.target.x) * this.speed;
            this.target.y += (o.pos.y + this.offset * Math.cos(o.dir) - this.target.y) * this.speed;
            this.rot.z = (this.speed * o.dir) + (1.0 - this.speed) * this.rot.z;
            this.rot.x = parseFloat(document.getElementsByName("camera.rot.x")[0].value) * deg2rad;
            this.offset = parseFloat(document.getElementsByName("camera.offset")[0].value);
            this.fov = parseFloat(document.getElementsByName("camera.fov")[0].value) * deg2rad;
            this.perspective = vw_2() / Math.tan(this.fov / 2);
            this.distance = parseFloat(document.getElementsByName("camera.distance")[0].value);

            this.normal.x = -Math.sin(this.rot.z) * Math.sin(this.rot.x);
            this.normal.y = Math.cos(this.rot.z) * Math.sin(this.rot.x);
            this.normal.z = -Math.cos(this.rot.x);


        },
        draw: function () {
            document.getElementById("world").style.transformOrigin = `${vw_2()}px ${vh_2()}px`
            document.getElementById("world").style.transform = `
            scale(${this.zoom})
            perspective(${this.perspective}px)
            rotateX(${-this.rot.x}rad)
            rotateZ(${-this.rot.z}rad)
            translateX(${-this.pos(true).x}px)
            translateY(${-this.pos(true).y}px)
            translateZ(${-this.pos(true).z}px)            
            `;
            let skyWidth = window.innerWidth / this.fov * pi2;
            let horizon = this.perspective * Math.tan(-this.rot.x - pi_2) + vh_2();
            sky.style.backgroundSize = `${skyWidth}px`;
            sky.style.backgroundPositionX = `${-this.rot.z / pi2 * skyWidth + vw_2()}px`;
            sky.style.backgroundPositionY = `${horizon - parseFloat(getComputedStyle(sky).backgroundSize.split(' ')[0]) / game.skyRatio}px`;
            document.body.style.backgroundImage = `linear-gradient(#f8e890 ${horizon - 10}px, #009F00 ${horizon + 10}px)`;

        }
    },
    init: function () {
        document.addEventListener('keydown', (event) => this.controls.read(event, event.timeStamp));
        document.addEventListener('keyup', (event) => this.controls.read(event, 0));
        game.camera.trackedObject = game.p1;

        const sky = document.getElementById("sky");
        this.skyRatio = sky.naturalWidth / sky.naturalHeight;
        sky.style.backgroundImage = `url('${sky.src}')`;

        this.p1.init();


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