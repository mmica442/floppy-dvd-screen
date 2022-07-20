const borderCr = 1;

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
    if (m === undefined) m = 1;
    this._m = m;

    // v is optional, so if not given, set to 0
    if (v === undefined) v = new Vector(0, 0);
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
    if (this.m > 0) tmp += "\nmass: " + this.m.toFixed(2);
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
  update() {
    // todo: kinematics?
    this.move(this.v);
    this.borderCollide(canvas);
  }

  // check if this collides with the canvas border
  borderCollide(c) {
    var collision = false;
    if (this.y + this.collisionDistance > c.height) {
      this.vy = -this.vy;
      this.y = c.height - this.collisionDistance;
      collision = true;
    } else if (this.y - this.collisionDistance < 0) {
      this.vy = -this.vy;
      this.y = 0 + this.collisionDistance;
      collision = true;
    }
    if (this.x - this.collisionDistance < 0) {
      this.vx = -this.vx;
      this.x = 0 + this.collisionDistance;
      collision = true;
    } else if (this.x + this.collisionDistance > c.width) {
      this.vx = -this.vx;
      this.x = c.width - this.collisionDistance;
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
  getCollisionVf(point2, Cr) {
    // using coefficient of restitution, Cr. this will change depending on the object this is colliding with
    // FUCK
    // JavaScript can't overload operators. Either need to extend JS with custom features (SweetJS?) or do a ValueOf thing, which can't return a new vector
    //https://stackoverflow.com/questions/19620667/javascript-operator-overloading
    // *touches statement sadly* perhaps someday...
    //Anyways the commented statement is a much easier-to-read version of the calculation. See wikipedia page for "coefficient of restitution" for formulae. Also the below khan academy page for more detail.
    // https://www.khanacademy.org/science/physics/linear-momentum/elastic-and-inelastic-collisions/a/what-are-elastic-and-inelastic-collisions
    // return ((ball1.v * ball1.mass) + (ball2.v * ball2.mass) + (ball2.mass * ball1.Cr * (ball2.v - ball1.v))) / (ball1.mass + ball2.mass)
    return this.momentum
      .sum(point2.momentum)
      .sum(point2.v.diff(this.v).multScalar(point2.m * Cr))
      .divScalar(this.m + point2.m);
  }

  // process of collision
  collides(point2, Cr) {
    if (this.isColliding(point2) && this.v.value > 0.01 && point2.v.value > 0.01) {
      var msg = "before collision";
      if (this.collisionDistance + point2.collisionDistance > 0) {
        msg += "\ncollision distance: " + (this.collisionDistance + point2.collisionDistance).toFixed(2);
      }
      if (this.getDistance(point2) > 0) {
        msg += "\ndistance: " + this.getDistance(point2).toFixed(2);
      }

      //velocity adjustments
      var tmp = this.getCollisionVf(point2, Cr);
      point2.v = point2.getCollisionVf(this, 1);
      this.v = tmp;
    }
  }
}