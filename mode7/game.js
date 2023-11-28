const game = {
    paused: false,
    p1: {
        id: "p1",
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
            document.getElementById(this.id).style.transform = `translateX(${this.pos.x}px) translateY(${this.pos.y}px) rotate(${this.dir}rad) rotateY(-80deg)`;
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
        distance: 20,
        pos: {
            x: 0,
            y: 0,
            z: 0
        },
        rot: {
            x: 0,
            y: 0,
            z: 0
        },
        zoom: 8,
        step: function () {
            let o = this.trackedObject;
            this.pos.x = o.pos.x - this.distance * Math.sin(o.dir);
            this.pos.y = o.pos.y + this.distance * Math.cos(o.dir);
            this.rot.z = o.dir;
        },
        draw: function () {
            document.getElementById("camera").style.transform = `translateX(${this.pos.x}px) translateY(${this.pos.y}px) rotate(${this.rot.z}rad)`;
            document.getElementById("world").style.transformOrigin = `${window.innerWidth/2 }px ${window.innerHeight/2 }px`
            document.getElementById("world").style.transform = `
            scale(${this.zoom})
            perspective(10vw)
            rotateX(85deg)
            translateZ(${-this.distance * 1.8}px)

            rotateZ(${-this.rot.z}rad)
            translateY(${-this.pos.y + (this.distance * Math.cos(this.rot.z)*0)}px)
            translateX(${-this.pos.x - (this.distance * Math.sin(this.rot.z)*0)}px)
            `;
            const sky = document.getElementById("sky");
            sky.style.backgroundPositionX = `${-0.7 * this.rot.z * sky.clientWidth}px`

        }
    },
    init: function () {
        document.addEventListener('keydown', (event) => this.controls.read(event, event.timeStamp));
        document.addEventListener('keyup', (event) => this.controls.read(event, 0));
        game.camera.trackedObject = game.p1;
        window.requestAnimationFrame(game.step);

    },
    step: function (timestamp) {
        if (!this.paused) {
            // const element = document.getElementById("map");
            let start, previousTimestamp;
            let done = false;

            if (start === undefined) {
                start = timestamp;
            }
            const elapsed = timestamp - start;

            if (previousTimestamp !== timestamp) {
                // Math.min() is used here to make sure the element stops at exactly 200px
                const count = Math.min(0.1 * elapsed, 200);
                //element.style.transform = `translateX(${count}px)`;
                if (count === 200) done = true;
            }

            game.p1.step(timestamp);
            game.p1.draw();
            game.camera.step();
            game.camera.draw();





            window.requestAnimationFrame(game.step);
        }
    },
};
game.init();