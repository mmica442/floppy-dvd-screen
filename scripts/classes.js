const borderCr = 1;
const minBorderCollideSpeed = 0.5;

// vector
class Vector {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    set x(value) {
        this._x = value;
    }

    get x() {
        return this._x;
    }

    set y(value) {
        this._y = value;
    }

    get y() {
        return this._y;
    }

    get value() {
        return (this.x ** 2 + this.y ** 2) ** (1 / 2);
    }

    get str() {
        return this.x.toFixed(2) + ", " + this.y.toFixed(2);
    }

    print() {
        console.log(this.str);
    }

    sum(v2) {
        return new Vector(this.x + v2.x, this.y + v2.y);
    }

    diff(v2) {
        return new Vector(this.x - v2.x, this.y - v2.y);
    }

    multScalar(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    divScalar(scalar) {
        return new Vector(this.x / scalar, this.y / scalar);
    }
}

// point mass
class Point {
    constructor(x, y, m, v) {
        // m, v are optional
        this._x = x;
        this._y = y;

        if (typeof arguments[2] == "object") {
            // if 3rd argument is a vector, m was not given
            m = 1;
            v = arguments[2];
        } else {
            m = arguments[2];
            v = arguments[3];
        }

        // m is optional, so if not given, set to 1
        if (m === undefined)
            m = 1;
        this._m = m;

        // v is optional, so if not given, set to 0
        if (v === undefined)
            v = new Vector(0, 0);
        this.v = v;
    }

    set x(value) {
        this._x = value;
    }

    get x() {
        return this._x;
    }

    set y(value) {
        this._y = value;
    }

    get y() {
        return this._y;
    }

    get relativeX() {
        return this.x;
    }

    get relativeY() {
        return canvas.getBoundingClientRect().bottom - this.y;
    }

    set m(value) {
        if (value >= 0) {
            this._m = value;
        } else {
            var msg = "Cannot set mass to a negative number! Value given: " + value;
            printLog(msg);
            console.log(msg);
        }
    }

    get m() {
        return this._m;
    }

    set vx(value) {
        this.v.x = value;
    }

    get vx() {
        return this.v.x;
    }

    set vy(value) {
        this.v.y = value;
    }

    get vy() {
        return this.v.y;
    }

    // momentum = mass * velocity
    get momentum() {
        return this.v.multScalar(this.m);
    }

    // distance to collide with something
    get collisionDistance() {
        // overload in children
        return 0;
    }

    get strPos() {
        return this.x.toFixed(2) + ", " + this.y.toFixed(2);
    }

    get strV() {
        return this.v.str;
    }

    get str() {
        var tmp = "position: (" + this.strPos + ")\nvelocity: (" + this.strV + ")";
        if (this.m > 0)
            tmp += "\nmass: " + this.m.toFixed(2);
        return tmp;
    }

    print() {
        console.log(this.str);
    }

    // move this point by given vector
    move(vector) {
        this.x += vector.x;
        this.y += vector.y;
    }

    // update position, check border collision
    update(c, xmax, ymax, xmin = 0, ymin = 0) {
        xmax = xmax ?? c.width;
        ymax = ymax ?? c.height;
        this.move(this.v);
        this.borderCollide(xmax, ymax, xmin, ymin);
    }

    // check if this collides with the canvas border
    borderCollide(xmax, ymax, xmin = 0, ymin = 0) {
        var collision = false;
        if (this.y + this.collisionDistance > ymax) {
			this.vy = Math.abs(this.vy);
			this.vy  = (this.vy < minBorderCollideSpeed) ? -minBorderCollideSpeed : -this.vy;
            // this.y = ymax - this.collisionDistance;
            collision = true;
        } else if (this.y - this.collisionDistance < ymin) {
			this.vy = Math.abs(this.vy);
			if (this.vy < minBorderCollideSpeed) this.vy = minBorderCollideSpeed;
            // this.y = ymin + this.collisionDistance;
            collision = true;
        }
        if (this.x + this.collisionDistance > xmax) {
			this.vx = Math.abs(this.vx);
			this.vx  = (this.vx < minBorderCollideSpeed) ? -minBorderCollideSpeed : -this.vx;
            // this.x = xmax - this.collisionDistance;
            collision = true;
        } else if (this.x - this.collisionDistance < xmin) {
			this.vx = Math.abs(this.vx);
			if (this.vx < minBorderCollideSpeed) this.vx = minBorderCollideSpeed;
            // this.x = xmin + this.collisionDistance;
            collision = true;
        }
        if (collision) {
            this.v = this.v.multScalar(borderCr);
        }
    }

    // get distance between 2 points
    getDistance(point2) {
        return ((this.x - point2.x) ** 2 + (this.y - point2.y) ** 2) ** (1 / 2);
    }

    // check if this point and a given other point are within collision distance
    isColliding(point2) {
        return this.collisionDistance + point2.collisionDistance > this.getDistance(point2);
    }

    // calculate final momentum of this point when colliding with point2
    getCollisionVf(point2, Cr = 1) {
        // using coefficient of restitution, Cr. this will change depending on the object this is colliding with
        // FUCK
        // JavaScript can't overload operators. Either need to extend JS with custom features (SweetJS?) or do a ValueOf thing, which can't return a new vector
        //https://stackoverflow.com/questions/19620667/javascript-operator-overloading
        // *touches statement sadly* perhaps someday...
        //Anyways the commented statement is a much easier-to-read version of the calculation. See wikipedia page for "coefficient of restitution" for formulae. Also the below khan academy page for more detail.
        // https://www.khanacademy.org/science/physics/linear-momentum/elastic-and-inelastic-collisions/a/what-are-elastic-and-inelastic-collisions
        // return ((ball1.v * ball1.mass) + (ball2.v * ball2.mass) + (ball2.mass * ball1.Cr * (ball2.v - ball1.v))) / (ball1.mass + ball2.mass)
        return this.momentum.sum(point2.momentum).sum(point2.v.diff(this.v).multScalar(point2.m * Cr)).divScalar(this.m + point2.m);
    }

    // process of collision
    collides(point2, Cr = 1) {
        if (this.isColliding(point2) && this.v.value > 0.01 && point2.v.value > 0.01) {
            //velocity adjustments
            var tmp = this.getCollisionVf(point2, Cr);
            point2.v = point2.getCollisionVf(this, Cr);
            this.v = tmp;
        }
    }
}

// ball
class Ball extends Point {
    constructor(xOrigin, yOrigin, vx, vy, radius, m) {
        if (m === undefined)
            m = Math.PI * radius ** 2;
        super(xOrigin, yOrigin, m, new Vector(vx, vy));
        this.radius = radius;
    }

    get str() {
        return super.str + "\nradius: " + this.radius.toFixed(2);
    }

    get collisionDistance() {
        // overloads
        return this.radius;
    }

    collides(ball2, Cr = 1) {
        // overloads
        super.collides(ball2, Cr);

        if (this.isColliding(ball2)) {
            //reset position to get rid of overlap (separation)
            var overlap = this.collisionDistance + ball2.collisionDistance - this.getDistance(ball2) + 1;
            var xOver = overlap * Math.cos(Math.atan(Math.abs((this.y - ball2.y) / (this.x - ball2.x))));
            var yOver = overlap * Math.sin(Math.atan(Math.abs((this.y - ball2.y) / (this.x - ball2.x))));

            if (this.x <= ball2.x) {
                this.x -= xOver / 2;
                ball2.x += xOver / 2;
            } else {
                this.x += xOver / 2;
                ball2.x -= xOver / 2;
            }
            if (this.y <= ball2.y) {
                this.y -= yOver / 2;
                ball2.y += yOver / 2;
            } else {
                this.y += yOver / 2;
                ball2.y -= yOver / 2;
            }
        }
    }
}
