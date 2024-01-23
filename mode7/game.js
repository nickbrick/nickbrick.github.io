const pi = 3.141593
const pi_2 = 1.570796
const tau = 6.283185
const rad2deg = 57.295780
const deg2rad = 0.017453
const epsilon = 0.0001;
const g = 0.41 * 60 * 60;
const vw = () => window.innerWidth; // resolution / dpr
const vw_2 = () => vw() / 2;
const vh = () => window.innerHeight;
const vh_2 = () => vh() / 2;
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
class Sprite {
    constructor(id, src) {
        this.id = id;
        this.src = src;
        this.elms = { logical: undefined, shadow: undefined, visual: undefined, visualWrapper: undefined };
        this.scale = 0.40;
        this.pos = {
            x: 95,
            y: 540,
            z: 100
        };
        this.offset = 0.1;

        this.vel = { h: 0, v: 0 };
        this.dVel = { h: 0, v: 0 };
        this.track = 0;
        this.dTrack = 0;
        this.heading = 0;
        this.dHeading = 0;
        this.steerCurve = 0; // → +, ← -
        this.config = {
            jump: 3.5 * 60,
            topSpeed: 500 * 60,
            acceleration: 0.025 * 60 * 60,
            accelerationBalance: 0.25, // 0 → track, 1 → heading
            braking: 0.08 * 60 * 60,
            friction: { base: 1.3 * 60, side: 2.051 * 60 },
            reverse: -100.86 * 60,
            resting: { vel: 0.1 * 60, dVel: 0.01 * 60 },
            steering: {
                ground: 0.04 * 60,
                air: 0.07 * 60,
                msToMax: 300,
                decay: 0.9 * 60,
                speedPenalty: true
            },
            turning: {
                ground: {
                    accelerating: 0.20 * 60,
                    coasting: 0.52 * 60,
                    braking: 0.1 * 60
                },
                air: 0 * 60
            }

        };
    }
    toScreen() {
        let rect = this.elms.logical.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
        }
    }
    angle() { return game.camera.rot.z - this.heading; }
    turn() { return balancedNormalizeAngle(this.heading - this.track); }
    grounded() { return this.pos.z < epsilon && this.vel.v <= epsilon; }
    init() {
        this.elms.visualWrapper = document.createElement("div");
        this.elms.visualWrapper.id = this.id + "-wrapper";
        document.getElementById("sprites").appendChild(this.elms.visualWrapper);

        this.elms.visual = document.createElement("img");
        this.elms.visual.id = this.id + "-visual";
        this.elms.visual.classList = "sprite";
        this.elms.visual.src = this.src;
        this.elms.visualWrapper.appendChild(this.elms.visual);

        this.elms.logical = document.createElement("div");
        this.elms.logical.id = this.id + "-logical";
        this.elms.logical.classList = "sprite logical";
        document.getElementById("world").appendChild(this.elms.logical);

        this.elms.shadow = document.createElement("div");
        this.elms.shadow.id = this.id + "-shadow";
        this.elms.shadow.classList = "sprite shadow";
        document.getElementById("world").appendChild(this.elms.shadow);
    }
    step() {

        { // position
            let dx = this.vel.h * Math.sin(this.track) * game.dt;
            let dy = -this.vel.h * Math.cos(this.track) * game.dt;
            this.pos.x += dx;
            this.pos.y += dy;
        }

        { // velocity
            let angleCurve = Math.max(0, Math.sin(Math.abs(this.angle()) - 0.9)) + 1;
            let basePower = (game.controls.forward.ms > 0) * this.grounded() * this.config.acceleration * game.dt * angleCurve;
            let vel = { x: (this.vel.h + basePower) * Math.sin(this.track), y: -(this.vel.h + basePower) * Math.cos(this.track) }
            let power = { x: basePower * Math.sin(this.heading), y: -basePower * Math.cos(this.heading) };
            let newVel = { x: power.x + vel.x, y: power.y + vel.y };
            this.track += circlesDiff(this.track, this.heading) * tau;

            if ((this.vel.h + basePower) != 0)
                this.track = this.track + Math.cos(this.turn()) * this.config.accelerationBalance * basePower / (this.vel.h + basePower);
            this.dVel.h = Math.hypot(newVel.x, newVel.y) - this.vel.h;
            this.dVel.h += (game.controls.back.ms > 0) * (-this.config.braking * game.dt);
            if (this.grounded()) {
                let friction = game.dt * Math.abs(this.config.friction.base + Math.sin(this.turn()) * this.config.friction.side);
                this.dVel.h -= friction;
            }
            this.vel.h += this.dVel.h;

            this.vel.h = Math.max(this.vel.h, this.config.reverse * game.dt);
            this.vel.h = Math.min(this.vel.h, this.config.topSpeed * game.dt);
            if (Math.abs(this.vel.h) < this.config.resting.vel && Math.abs(this.dVel.h) < this.config.resting.dVel)
                this.vel.h = 0;
        }

        { // heading
            const curveStep = game.dt * 1000 / this.config.steering.msToMax;
            this.steerCurve += (((game.controls.right.ms > 0) * (1 + Math.sign(this.steerCurve < 0))) - ((game.controls.left.ms > 0) * (1 + Math.sign(this.steerCurve > 0)))) * curveStep;
            this.steerCurve = minMagnitude(this.steerCurve, Math.sign(this.steerCurve));
            if (game.controls.right.ms + game.controls.left.ms == 0)
                this.steerCurve -= minMagnitude(Math.sign(this.steerCurve) * 1.5 * curveStep, this.steerCurve);
            let speedPenalty = this.config.steering.speedPenalty ? Math.min(this.vel.h * game.dt / 2.0, 1.0) : 1.0;
            let base = (this.grounded() ? this.config.steering.ground * speedPenalty : this.config.steering.air) * game.dt;
            this.dHeading = base * this.steerCurve;
            this.dHeading = base * this.steerCurve;
            this.heading += this.dHeading;
        }

        { // track
            let base = 0;
            if (!this.grounded()) base = this.config.turning.air * game.dt;
            else if (game.controls.back.ms) base = this.config.turning.ground.braking * game.dt;
            else if (game.controls.forward.ms) base = this.config.turning.ground.accelerating * game.dt;
            else base = this.config.turning.ground.coasting * game.dt;
            base += this.grounded() * 0.1 * Math.abs(this.turn()) ** 3;
            let withSpeed = Math.sign(this.turn()) * base / (Math.abs(this.vel.h * game.dt) ** 1.5);
            this.dTrack = minMagnitude(withSpeed, this.turn());
            this.track += this.dTrack;

            if (Math.abs(this.turn()) > deg2rad)
                this.elms.visualWrapper.classList.add("vibrate-2");
            else
                this.elms.visualWrapper.classList.remove("vibrate-2");
        }

        { // jumping
            if (this.grounded() && game.controls.jump.ms)
                this.vel.v = this.config.jump;
            else {
                this.dVel.v = this.grounded() ? 0 : -g * game.dt;
                this.vel.v = this.grounded() ? 0 : this.vel.v + this.dVel.v;
                this.pos.z += this.vel.v * game.dt;
                this.pos.z = Math.max(this.pos.z, 0);
            }
        }
    }
    draw() {
        this.elms.logical.style.transform = `
            translateX(${this.pos.x}px)
            translateY(${this.pos.y}px)
            rotate(${this.track}rad)
            `;

        this.elms.shadow.style.width = `${this.elms.visual.naturalHeight}px`;
        this.elms.shadow.style.height = `${this.elms.visual.naturalHeight}px`;
        this.elms.shadow.style.transform = `
            translateX(${this.pos.x - this.elms.visual.naturalHeight / 2}px)
            translateY(${this.pos.y - this.elms.visual.naturalHeight / 2}px)
            rotate(${this.heading}rad)
            scale(${this.scale})`;

        let diff = { x: this.pos.x - game.camera.pos().x, y: this.pos.y - game.camera.pos().y, z: this.pos.z - game.camera.pos().z };
        let dot = diff.x * game.camera.normal.x + diff.y * game.camera.normal.y + diff.z * game.camera.normal.z;
        this.elms.visual.style.backgroundImage = `url('${this.elms.visual.src}')`;
        this.elms.visual.style.width = `${this.elms.visual.naturalHeight}px`;
        this.elms.visual.style.height = `${this.elms.visual.naturalHeight}px`;
        let frameSize = this.elms.visual.naturalHeight;
        let frames = (this.elms.visual.naturalWidth) / frameSize;
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
        this.elms.visual.style.zIndex = Math.round(100000 / dot);
        let x = this.toScreen().x - parseFloat(getComputedStyle(this.elms.visual).width) / 2;
        let y = this.toScreen().y - parseFloat(getComputedStyle(this.elms.visual).width) / 2 + jump;
        let finalScale = this.scale * Math.max((game.camera.perspective / dot), 0);
        this.elms.visual.style.transform = `
            translateX(${x}px)
            translateY(${y}px)
            translateZ(0px)
            scale(${finalScale})
            translateY(${this.elms.visual.naturalHeight * (this.offset - 0.5)}px)
            scaleX(${sign})
            `;
        this.elms.visualWrapper.style.transformOrigin = `${x}px ${y}px`;
        this.elms.visualWrapper.style.width = `${this.elms.visual.naturalHeight * finalScale}px`;
        this.elms.visualWrapper.style.height = `${this.elms.visual.naturalHeight * finalScale}px`;
    }
}

const game = {
    stop: function () { this.step = function () { }; },
    debug: function (set) {
        if (parseInt(set)) {
            var lnk = document.createElement('link');
            lnk.id = "debug-css";
            lnk.href = 'debug.css';
            lnk.rel = 'stylesheet';
            lnk.type = 'text/css';
            (document.head || document.documentElement).appendChild(lnk);

            document.getElementById("sky").style.backgroundImage = "url('skyback1.png')";
        }
        else {
            (document.head || document.documentElement).removeChild(document.getElementById("debug-css"));
            document.getElementById("sky").style.backgroundImage = "url('skyback.png')";

        }
    },
    p1: new Sprite("p1", "toad.png"),
    p2: new Sprite("p2", "luigi.png"),
    controls: {
        forward: { ms: 0, code: 38 },
        back: { ms: 0, code: 40 },
        left: { ms: 0, code: 37 },
        right: { ms: 0, code: 39 },
        jump: { ms: 0, code: 32 },

        read: function (event, ms) {
            Object.getOwnPropertyNames(this).forEach(name => {
                if (event.keyCode == this[name].code) {
                    if (this[name].ms == 0 || ms == 0)
                        this[name].ms = ms;
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
            translateX(${vw() / 2}px)
            translateY(${vh() / 2}px)
            translateX(${-this.pos(true).x}px)
            translateY(${-this.pos(true).y}px)
            translateZ(${-this.pos(true).z}px)        

            `;
            let skyWidth = 1 / ((this.fov / tau) * vw() / vh());
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
        {
            this.p2.init();
            this.p2.pos.x = 64;
            this.p2.pos.y = 564;
            this.p2.pos.z = 0;
        }
        const sky = document.getElementById("sky");
        this.skyRatio = sky.naturalWidth / sky.naturalHeight;
        sky.style.backgroundImage = `url('${sky.src}')`;


        window.requestAnimationFrame(game.step);
    },
    step: function (timestamp) {

        game.dt = (timestamp - game.lastTimestamp) / 1000 * game.speedMultiplier;
        game.lastTimestamp = timestamp;
        let doSkip = false;
        if (isNaN(game.dt)) doSkip = true;
        if (game.dt > 1 / 30) doSkip = true;

        if (!doSkip) {
            game.p1.step(timestamp);
            // game.p2.step(timestamp);
            game.camera.step();
            game.p1.draw();
            game.p2.draw();
            game.camera.draw();
            drawCompass();

            document.getElementById("viewport").style.width = `${vw()}px`;
            document.getElementById("viewport").style.height = `${vh()}px`;
        }
        window.requestAnimationFrame(game.step);
    },
    lastTimestamp: 0,
    dt: 0,
    speedMultiplier: 1,
};
game.init();
function drawCompass() {
    document.getElementById("disc").style.transform = `rotate(${-game.camera.rot.z}rad)`;
    document.getElementById("arrow-head").style.transform = `rotate(${-game.camera.rot.z + game.p1.heading}rad)`;
    document.getElementById("arrow-track").style.transform = `rotate(${-game.camera.rot.z + game.p1.track}rad)`;

    let flip = game.p1.steerCurve < 0;
    document.getElementById("bar-steer").style.background = `linear-gradient(90deg, black 50%, red 50%, red ${50 * (1 + Math.abs(game.p1.steerCurve))}%,black ${50 * (1 + Math.abs(game.p1.steerCurve))}%)`;
    document.getElementById("bar-steer").style.transform = `scaleX(${flip ? "-" : ""}1)`;

    document.getElementById("bar-turn").style.background = `linear-gradient(90deg, black 50%, green 50%, green ${50 * (1 + Math.abs(game.p1.dTrack) * 10)}%,black ${50 * (1 + Math.abs(game.p1.dTrack) * 10)}%)`;
    document.getElementById("bar-turn").style.transform = `scaleX(${Math.sign(game.p1.dTrack) == 0 ? 1 : Math.sign(game.p1.dTrack)})`;
}