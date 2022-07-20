const canvas = document.getElementById("canvas");

//balls
class Ball extends Point {
  constructor(xOrigin, yOrigin, radius, name, color) {
    super(xOrigin, yOrigin, new Vector(Math.random() * 7 - 3, Math.random() * 7 - 3));
    this.radius = radius;
    this.name = name;
    this.color = color;
    this.renderCat = false;
  }

  matchesName(checkName, matchCase) {
    // get name of ball
    let thisName = this.name;

    // if not matching case, make both ball name and given name lowercase
    if (!matchCase) {
      thisName = this.name.toLowerCase().trim();
      checkName = checkName.toLowerCase().trim();
    }

    return thisName == checkName;
  }

  get str() {
    return super.str + "\nradius: " + this.radius.toFixed(2);
  }

  get m() {
    return Math.PI * this.radius ** 2;
  }

  get collisionDistance() {
    // overloads
    return this.radius;
  }

  draw(ctx) {
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    if (this.renderCat) {
      ctx.drawImage(document.getElementById("floppy_cat"), this.x - 40, this.y - 40);
      ctx.fillText(this.name.charAt(0), this.x - 8, this.y - 1);
    } else {
      ctx.drawImage(document.getElementById("floppy"), this.x - 24, this.y - 24);
      ctx.fillText(this.name.charAt(0), this.x - 8, this.y - 1);
    }
  }

  update(posX, posY, c) {
    // this.vy += this.gravity;
    super.update();
  }

  mouseCollide(posX, posY) {
    //line segment intersecting circle is gonna be hard >_>
  }

  collides(ball2, Cr) {
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

const balls = {};
function createBall(userID, name, color) {
  balls[userID] = new Ball(Math.random() * 1400 + 100, Math.random() * 700 + 100, 24, name, color);
}
createBall("M", "M", "#ffffff");

// search for ball by display name
function findByName(checkName, matchCase) {
  let findUser = null;
  for (let i in balls) {
    // if matches, break loop and return that ball
    if (balls[i].matchesName(checkName, false)) {
      findUser = balls[i];
      break;
    }
  }
  return findUser;
}

// run physics for balls
function ballPhysics(c) {
  //canvas variable setup and frame refresh
  const ctx = c.getContext("2d");
  ctx.canvas.width = c.width;
  ctx.lineWidth = 2;
  ctx.font = "24px W95FA";

  for (let i in balls) {
    balls[i].update(0, 0, c);

    if (Object.keys(balls).length > 1) {
      for (let j in balls) {
        if (j != i) {
          balls[i].collides(balls[j], 1);
        }
      }
    }
  }
  for (let i in balls) {
    balls[i].draw(ctx);
  }
}

function SaveAsFile(t, f, m) {
  try {
    var b = new Blob([t], { type: m });
    saveAs(b, f);
  } catch (e) {
    window.open("data:" + m + "," + encodeURIComponent(t), "_blank", "");
  }
}

function saveJSON() {
  // console.log(text);
  SaveAsFile(JSON.stringify(balls), "export_floppy.json", "text/json;charset=utf-8");
}

const client = new tmi.Client({
  channels: ["mmica442"],
});
client.connect();
// client.join("mmica442");

client.on("message", (channel, tags, message, self) => {
  let currentUserID = tags["user-id"];
  let uniformMessage = message.toLowerCase().trim();

  // add ball or update color
  if (currentUserID in balls) {
    balls[currentUserID].color = tags["color"];
  } else {
    createBall(currentUserID, tags["display-name"], tags["color"]);
  }

  // check for me (channel owner) stuff (mostly for debugging)
  if (currentUserID == "720767504") {
    let splitMessage = uniformMessage.split(" ");
    if (uniformMessage.startsWith("!cat")) {
      if (splitMessage.length > 1) {
        let findUser = findByName(splitMessage[1], false);
        if (findUser !== null) {
          findUser.renderCat = true;
        }
      }
    } else if (uniformMessage.startsWith("!uncat")) {
      if (splitMessage.length > 1) {
        let findUser = findByName(splitMessage[1], false);
        if (findUser !== null) {
          findUser.renderCat = false;
        }
      }
    }
  }

  // check for catting/uncatting
  if (uniformMessage.startsWith("!cat")) {
    balls[currentUserID].renderCat = true;
  } else if (uniformMessage.startsWith("!uncat")) {
    balls[currentUserID].renderCat = false;
  }

  // check for custom reward ID
  if (tags.hasOwnProperty("custom-reward-id")) {
    switch (tags["custom-reward-id"]) {
      case "87af0b1e-c952-4450-af08-5f74e506fb9b":
        let findUser = findByName(message, false);
        if (findUser !== null) {
          findUser.renderCat = false;
        }
        // client.say("mmica442", "I can't believe you've un-catted " + message + "...");
        break;
    }
  }
});

function main() {
  ballPhysics(canvas);
  var repeater = window.setTimeout(main, 10); //~100 fps max
}
