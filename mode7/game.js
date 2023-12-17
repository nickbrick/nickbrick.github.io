const pi = 3.141593
const pi_2 = 1.570796
const tau = 6.283185
const rad2deg = 57.295780
const deg2rad = 0.017453
const epsilon = 0.0001;
const g = 0.41;
const vw = () => window.innerWidth; // resolution / dpr
const vw_2 = () => vw()/2;
const vh = () => window.innerHeight;
const vh_2 = () => vh()/2;
const mod = (n, m) => (n % m + m) % m;
const balancedNormalizeAngle = (a) => {
    a = a % tau;
    a = (a + tau) % tau;
    if (a > pi) a -= tau;
    return a;
}
const circlesDiff = (x, target) => {
    let diff = target - x;
    return ~~(diff / tau);
}
const minMagnitude = (a, b) => { if (Math.abs(a) < Math.abs(b)) return a; else return b; }
const game = {
    stop: function () { this.step = function () { }; },
    p1: {
        id: "p1",
        elms: { logical: undefined, shadow: undefined, visual: undefined },
        scale: 0.40,
        pos: {
            x: -0,
            y: 0,
            z: 100
        },
        offset: 0.1,
        toScreen: function () {
            let rect = this.elms.logical.getBoundingClientRect();
            return {
                x: rect.left,
                y: rect.top,
            }
        },
        vel: { h: 0, v: 0 },
        dVel: { h: 0, v: 0 },
        track: 0,
        dTrack: 0,
        heading: 0,
        dHeading: 0,
        config: {
            jump: 3.5,
            acceleration: 0.03,
            accelerationBalance: 0.0005205, // 0 → track, 1 → heading
            braking: 0.080,
            friction: { base: 0.988, side: 0.0251 },
            reverse: -0.86,
            resting: { vel: 0.1, dVel: 0.01 },
            steering: {
                ground: 0.00071,
                air: 0.0017,
                framesToMax: 10,
                decay: 0.9,
                speedPenalty: true
            },
            turning: {
                ground:{
                    accelerating: 0.516,
                    coasting: .815,
                    braking: 0.05
                },
                air: 0
            }

        },
        angle: function () { return game.camera.rot.z - this.heading },
        turn: function () { return balancedNormalizeAngle(this.heading - this.track); },
        grounded: function () { return this.pos.z < epsilon && this.vel.v <= epsilon; },
        init: function () {
            this.elms.logical = document.createElement("div");
            this.elms.logical.id = this.id + "-logical";
            this.elms.logical.classList = "sprite logical";
            document.getElementById("world").appendChild(this.elms.logical);

            this.elms.visual = document.getElementById(this.id);

            this.elms.shadow = document.createElement("div");
            this.elms.shadow.id = this.id + "-shadow";
            this.elms.shadow.classList = "sprite shadow";
            document.getElementById("world").appendChild(this.elms.shadow);

        },


        step: function (timestamp) {

            { // position
                let dx = this.vel.h * Math.sin(this.track);
                let dy = -this.vel.h * Math.cos(this.track);
                this.pos.x += dx;
                this.pos.y += dy;
            }

            { // velocity
                let angleCurve = Math.max(0, Math.sin(Math.abs(this.angle())-0.9)) + 1;
                let basePower = (game.controls.forward.frame > 0) * this.grounded() * this.config.acceleration * angleCurve;
                let vel = { x: (this.vel.h+basePower) * Math.sin(this.track), y: -(this.vel.h+basePower) * Math.cos(this.track) }
                let power = { x: basePower * Math.sin(this.heading), y: -basePower * Math.cos(this.heading) };
                let newVel = { x: power.x + vel.x, y: power.y + vel.y };
                this.track += circlesDiff(this.track, this.heading) * tau;

                if ((this.vel.h + basePower) != 0)
                    this.track = this.track + this.turn() * this.config.accelerationBalance * basePower / (this.vel.h + basePower);
                this.dVel.h = Math.hypot(newVel.x, newVel.y) - this.vel.h;
                this.dVel.h += (game.controls.back.frame > 0) * (-this.config.braking);
                this.vel.h += this.dVel.h;
                if (this.grounded()) 
                    this.vel.h *= this.config.friction.base * Math.cos(this.turn() * this.vel.h * this.config.friction.side);
                this.vel.h = Math.max(this.vel.h, this.config.reverse);
                if (Math.abs(this.vel.h) < this.config.resting.vel && Math.abs(this.dVel.h) < this.config.resting.dVel)
                    this.vel.h = 0;
            }

            { // heading
                let steerCurve = Math.min((timestamp - Math.max(game.controls.right.frame, game.controls.left.frame)) / this.config.steering.framesToMax, 1.0);
                let speedPenalty = this.config.steering.speedPenalty ? Math.min(this.vel.h / 1.0, 1.0) : 1.0;
                let base = this.grounded() ? this.config.steering.ground * speedPenalty : this.config.steering.air;
                if (game.controls.left.frame) this.dHeading -= base * steerCurve;
                if (game.controls.right.frame) this.dHeading += base * steerCurve;
                if (game.controls.right.frame + game.controls.left.frame == 0)
                    this.dHeading = minMagnitude(-Math.sign(this.turn()) * this.config.steering.ground*2, -this.turn());
                this.heading += this.dHeading;
            }

            { // track
                let base = 0;
                if (!this.grounded()) base = this.config.turning.air;
                else if (this.dVel.h < -epsilon) base = this.config.turning.ground.braking;
                else if (this.dVel.h < epsilon) base = this.config.turning.ground.coasting;
                else base = this.config.turning.ground.accelerating;
                let withSpeed = Math.sign(this.turn()) * base / (Math.abs(this.vel.h + 0.51) ** 2);
                this.dTrack = minMagnitude(withSpeed, this.turn());
                this.track += this.dTrack;
            }

            { // jumping
                if (this.grounded() && game.controls.jump.frame)
                    this.vel.v = this.config.jump;
                else {
                    this.dVel.v = this.grounded() ? 0 : -g;
                    this.vel.v = this.grounded() ? 0 : this.vel.v + this.dVel.v;
                    this.pos.z += this.vel.v;
                    this.pos.z = Math.max(this.pos.z, 0);
                }
            }

        },
        draw: function () {
            this.elms.logical.style.transform = `
            translateX(${vw_2() + this.pos.x}px)
            translateY(${vh_2() + this.pos.y}px)
            rotate(${this.track}rad)
            `;

            this.elms.shadow.style.width = `${this.elms.visual.naturalHeight}px`;
            this.elms.shadow.style.height = `${this.elms.visual.naturalHeight}px`;
            this.elms.shadow.style.transform = `
            translateX(${vw_2() + this.pos.x - this.elms.visual.naturalHeight / 2}px)
            translateY(${vh_2() + this.pos.y - this.elms.visual.naturalHeight / 2}px)
            rotate(${this.heading}rad)
            scale(${this.scale})`;

            let diff = { x: this.pos.x - game.camera.pos().x, y: this.pos.y - game.camera.pos().y, z: this.pos.z - game.camera.pos().z };
            let dot = diff.x * game.camera.normal.x + diff.y * game.camera.normal.y + diff.z * game.camera.normal.z;
            this.elms.visual.style.backgroundImage = `url('${this.elms.visual.src}')`;
            this.elms.visual.style.width = `${this.elms.visual.naturalHeight}px`;
            this.elms.visual.style.height = `${this.elms.visual.naturalHeight}px`;
            let frameSize = this.elms.visual.naturalHeight;
            let frames = (this.elms.visual.naturalWidth) / frameSize;
            let frameAngSize = pi_2 / frames;
            let correctedAngle = Math.abs(this.angle() / pi);
            let halfCircleFract = (correctedAngle) % 2;
            let flip = mod((this.angle() / pi), 2) < 1;
            let sign = flip ? -1 : 1;
            let retrograde = (halfCircleFract) > 1;
            let sawtooth = (!retrograde) * halfCircleFract + (retrograde) * (2 - halfCircleFract);
            let frame = Math.round(sawtooth * (frames - 1));
            if (frame == 0 || frame == frames - 1) sign = 1;
            let jump = this.pos.z * (game.camera.perspective / dot) * Math.sin(game.camera.rot.x);
            this.elms.visual.style.backgroundPositionX = `${-frame * frameSize}px`;
            this.elms.visual.style.transform = `
            translateX(${this.toScreen().x - parseFloat(getComputedStyle(this.elms.visual).width) / 2}px)
            translateY(${this.toScreen().y - parseFloat(getComputedStyle(this.elms.visual).width) / 2 + jump}px)
            translateZ(0px)
            scale(${this.scale * (game.camera.perspective / dot)})
            translateY(${this.elms.visual.naturalHeight * (this.offset - 0.5)}px)
            scaleX(${sign})
            `;
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
            // console.log(event.keyCode);
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
                z: this.target.z + (this.distance - world * this.perspective) * Math.cos(this.rot.x)
            };
        },
        turn: function (target) { return balancedNormalizeAngle(target.track - this.rot.z); },
        zoom: 1,
        step: function () {
            this.speed = parseFloat(document.getElementsByName("camera.speed")[0].value);
            this.target.z = parseFloat(document.getElementsByName("camera.height")[0].value);

            let o = this.trackedObject;
            this.target.x += (o.pos.x - this.offset * Math.sin(o.track) - this.target.x) * this.speed;
            this.target.y += (o.pos.y + this.offset * Math.cos(o.track) - this.target.y) * this.speed;
            this.rot.z += circlesDiff(this.rot.z, o.track) * tau;
            let turn = this.turn(o);
            this.rot.z += this.speed * turn;
            this.rot.x = parseFloat(document.getElementsByName("camera.rot.x")[0].value) * deg2rad;
            this.offset = parseFloat(document.getElementsByName("camera.offset")[0].value);
            this.fov = parseFloat(document.getElementsByName("camera.fov")[0].value) * deg2rad;
            this.perspective = vh() / Math.tan(this.fov / 2);
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
            let skyWidth = 1 / (this.fov / tau);
            let horizon = this.perspective * Math.tan(-this.rot.x - pi_2) + vh_2();
            sky.style.backgroundSize = `${vw() * skyWidth}px`;
            sky.style.backgroundPositionX = `${-this.rot.z / tau * skyWidth * vw() + vw_2()}px`;
            sky.style.backgroundPositionY = `${horizon - parseFloat(getComputedStyle(sky).backgroundSize.split(' ')[0]) / game.skyRatio}px`;
            document.getElementById("viewport").style.backgroundImage = `linear-gradient(#f8e890 ${horizon - 10}px, #009F00 ${horizon + 10}px)`;

        }
    },
    init: function () {
        document.addEventListener('keydown', (event) => this.controls.read(event, event.timeStamp));
        document.addEventListener('keyup', (event) => this.controls.read(event, 0));
        game.camera.trackedObject = game.p1;
        this.p1.init();

        const sky = document.getElementById("sky");
        this.skyRatio = sky.naturalWidth / sky.naturalHeight;
        sky.style.backgroundImage = `url('${sky.src}')`;


        window.requestAnimationFrame(game.step);


    },
    step: function (timestamp) {

        game.p1.step(timestamp);
        game.camera.step();
        game.p1.draw();
        game.camera.draw();


        document.getElementById("viewport").style.width = `${vw()}px`;
        document.getElementById("viewport").style.height = `${vh()}px`;


        window.requestAnimationFrame(game.step);
    },
};
game.init();