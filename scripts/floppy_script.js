const canvas = document.getElementById("canvas");

// stabilizing speed
var ENTROPY_VALUE = 0.999;
var PERPETUAL_MOTION_VALUE = 1.001;
var REMOVE_ENERGY_ON_KILL_VALUE = 0.9;
var IDEAL_AVG_MOMENTUM = 5000;

// min/max speeds for boost
var BOOST_TIME_LIMIT = 2000;
var BOOST_MIN_SPEED = 0.5
var BOOST_MAX_SPEED = 5

// crab rave variables
var CRABRAVE_TIME_LIMIT = 2900;
var crabRaveTimer = 0;
var globalCrab = 0;

// battle variables
var BATTLE_WIDTH_MIN = 320;
var BATTLE_HEIGHT_MIN = 180;
var battleActive = false;
var battleTimer = 0;
var battleWidth = canvas.width;
var battleHeight = canvas.height;
var battleShrinkFrequency = 200;
var announcedWinner = true;

// canvas edges for battle shrinking
var xmin = null;
var xmax = null;
var ymin = null;
var ymax = null;

// default floppy
const defaultFloppyID = "M";
const defaultFloppyName = "M";
const defaultFloppyColor = "#ffffff";


// set constants
function setConstants(){
	ENTROPY_VALUE = document.getElementById("inputEntropy").value;
	PERPETUAL_MOTION_VALUE = document.getElementById("inputPerpetual").value;
	REMOVE_ENERGY_ON_KILL_VALUE = document.getElementById("inputRemoveOnKill").value;
	IDEAL_AVG_MOMENTUM = document.getElementById("inputAvgSpeed").value;
	
	BOOST_TIME_LIMIT = document.getElementById("inputBoostTimeLimit").value;
	BOOST_MIN_SPEED = document.getElementById("inputBoostMinSpeed").value;
	BOOST_MAX_SPEED = document.getElementById("inputBoostMaxSpeed").value;
	
	CRABRAVE_TIME_LIMIT = document.getElementById("inputCrabRaveTimeLimit").value;
	
	BATTLE_WIDTH_MIN = document.getElementById("inputBattleWidthMin").value;
	BATTLE_HEIGHT_MIN = document.getElementById("inputBattleHeightMin").value;
}


// utility functions
// to save JSON file
function SaveAsFile(t, f, m) {
    try {
        var b = new Blob([t], {
                type: m
            });
        saveAs(b, f);
    } catch (e) {
        window.open("data:" + m + "," + encodeURIComponent(t), "_blank", "");
    }
}

// generate random color
const randomColor = () => {
   let color = '#';
   for (let i = 0; i < 6; i++){
      const random = Math.random();
      const bit = (random * 16) | 0;
      color += (bit).toString(16);
   };
   return color;
};

// generate random property
function getRandomProperty(obj) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};


// classes
// floppy disk class
class Floppy extends Ball {
    constructor(userID, username, name, color) {
        super(
			(Math.random() * (canvas.width - 200)) + 100,
			(Math.random() * (canvas.height - 200)) + 100,
			Math.random() * 7 - 3,
			Math.random() * 7 - 3,
			24
		);
		this._m += Math.random() * 400 - 200;
		this.userID = userID;
		this.username = username;
        this.name = name;
        this.color = color;
		this.randomColor = randomColor();
		this.defaultRenderType = "none";
        this.renderType = this.defaultRenderType;
		this.permissions = ["none", "cat"];
		this.boostTimer = 0;
		this.lives = 3;
		this.show = true;
		this.savedShowStatus = this.show;
    }

	// check if given name matches this floppy's name
    matchesName(checkName, matchCase = false) {
        // get name of ball
        let thisName = this.name;

        // if not matching case, make both ball name and given name lowercase
        if (!matchCase) {
            thisName = this.name.toLowerCase().trim();
            checkName = checkName.toLowerCase().trim();
        }

        return thisName == checkName;
    }
	
	// set size
	setHalfSize() {
		if (this.radius > 12) {
			this.vx *= 3;
			this.vy *= 3;
			this._m /= 2;
			this.radius = 12;
		}
	}
	
	// set regular size
	setNormalSize() {
		if (this.radius < 24) {
			this.vx /= 3;
			this.vy /= 3;
			this._m *= 2;
			this.radius = 24;
		}
	}
	
	// get valid render type
	validRenderType(value, override = false) {
		if (value == null) return "none";
		// if not null, then clean string
		value = String(value).toLowerCase().trim();
		// if value is in permissions OR we're overriding permissions, then set value
		if (override || this.permissions.includes(value)) return value;
	}
	
	// set renderType
	setRenderType(value, override = false) {
		let tmp = this.validRenderType(value, override) ?? this.renderType;
		
		if (this.renderType == "bee" && tmp != "bee" ) {
			this.setNormalSize();
		} else if (this.renderType != "bee" && tmp == "bee") {
			this.setHalfSize();
		}
		
		this.renderType = tmp;
	}
	
	// set defaultRenderType
	setDefaultRenderType(value = null, override = false) {
		this.defaultRenderType = this.validRenderType(value, override) ?? this.defaultRenderType;
	}
	
	// boost
	boost() {
		if (this.boostTimer == 0) {
			this.boostTimer = BOOST_TIME_LIMIT;
		}
	}

	// draw floppy on screen
    draw(ctx) {
		if (!this.show) {
			return;
		}
		// if crabbing, display crab
		if (globalCrab == 1) {
			ctx.drawImage(document.getElementById("floppy_crab"), this.x - 38, this.y - 38);
		} else if (globalCrab == 2) {
			ctx.drawImage(document.getElementById("floppy_crab_2"), this.x - 38, this.y - 38);
		} else {
			// otherwise go off renderType
			switch (this.renderType) {
			case "none":
				ctx.drawImage(document.getElementById("floppy"), this.x - 24, this.y - 24);
				break;

			case "cat":
				ctx.drawImage(document.getElementById("floppy_cat"), this.x - 40, this.y - 40);
				break;

			case "crab":
				ctx.drawImage(document.getElementById("floppy_crab"), this.x - 38, this.y - 38);
				break;

			case "bee":
				ctx.drawImage(document.getElementById("floppy_bee"), this.x - 24, this.y - 24);
				ctx.font = "12px W95FA";
				break;
			
			default:
				ctx.drawImage(document.getElementById("floppy"), this.x - 24, this.y - 24);
			}
		}
        ctx.strokeStyle = this.color ?? this.randomColor;
        ctx.fillStyle = this.color ?? this.randomColor;
		ctx.fillText(this.name.charAt(0), this.x, this.y);
		
		ctx.font = "24px W95FA";
		if (battleActive) {
			// if victor
			if (chatters.numberVisible == 1) {
				ctx.fillText(this.name, this.x, this.y + 48);
				if (!announcedWinner) {
					client.say("mmica442", `Congrats @${this.username}, you've won the battle!`);
					announcedWinner = true;
				}
			}
			
			// display lives
			ctx.strokeStyle = "#ffffff";
			ctx.fillStyle = "#ffffff";
			ctx.fillText(this.lives, this.x, this.y - 30);
		}
    }
	
	// update floppy position
	update(c, xmax, ymax, xmin = 0, ymin = 0) {
		// temporarily boost speed of floppy
		if (this.boostTimer == BOOST_TIME_LIMIT) {
			this.vx *= Math.random() * 4 + 2;
			if (Math.abs(this.vx) > BOOST_MAX_SPEED) this.vx = Math.sign(this.vx) * BOOST_MAX_SPEED;
			this.vy *= Math.random() * 4 + 2;
			if (Math.abs(this.vy) > BOOST_MAX_SPEED) this.vy = Math.sign(this.vy) * BOOST_MAX_SPEED;
		} else if (this.boostTimer == 1000) {
			this.vx /= Math.random() * 4 + 4;
			if (Math.abs(this.vx) < BOOST_MIN_SPEED) this.vx = Math.sign(this.vx) * BOOST_MIN_SPEED;
			this.vy /= Math.random() * 4 + 4;
			if (Math.abs(this.vy) < BOOST_MIN_SPEED) this.vy = Math.sign(this.vy) * BOOST_MIN_SPEED;
		}
		// update position
		super.update(c, xmax, ymax, xmin, ymin);
		// decrement boostTimer
		if (this.boostTimer > 0) this.boostTimer -= 1;
		
		// if battle active, speed up when hit border?
	}
	
	// for saving data
	get asJSON() {
		return {
			id: this.userID,
			user: this.username,
			name: this.name,
			color: this.color,
			dR: this.defaultRenderType,
			show: this.show,
			perm: this.permissions
		};
	}
	
	// read data from localStorage
	readFromStorage(stored) {
		if (typeof(stored.name) != 'undefined') {
			this.name = stored.name;
		}
		if (typeof(stored.user) != 'undefined') {
			this.username = stored.user;
		}
		if (typeof(stored.color) != 'undefined') {
			this.color = stored.color;
		}
		if (typeof(stored.dR) != 'undefined') {
			if (stored.dR == null) {
				this.defaultRenderType = "none";
			} else {
				this.defaultRenderType = stored.dR;
			}
		}
		if (typeof(stored.perm) != 'undefined') {
			for (let i in stored.perm) {
				if (!this.permissions.includes(stored.perm[i])) {
					this.permissions.push(stored.perm[i]);
				}
			}
		}
		if (typeof(stored.show) != 'undefined') {
			this.savedShowStatus = stored.show;
		}
		this.setRenderType(this.defaultRenderType, true);
	}
}

// list of floppies
class Floppies {
	constructor() {
		this.list = {};
	}
	
	// add floppy if userID not in list, otherwise update floppy
	updateFloppy(userID, name, username, color, show) {
		if (this.list.hasOwnProperty(userID)) {
			if (typeof show == 'boolean') {
				if (battleActive) {
					this.list[userID].savedShowStatus = show;
				} else {
					this.list[userID].show = show;
				}
			}
			this.list[userID].name = name;
			this.list[userID].username = username;
			this.list[userID].color = color;
		} else {
			this.list[userID] = new Floppy(userID, name, username, color);
		}
	}

	// search for ball by display name
	findByName(checkName, matchCase) {
		let findUser = null;
		for (let i in this.list) {
			// if matches, break loop and return that ball
			if (this.list[i].matchesName(checkName, false)) {
				findUser = this.list[i];
				break;
			}
		}
		return findUser;
	}
	
	// number of visible floppies
	get numberVisible() {
		let num = 0;
		for (let i in this.list) {
			if (this.list[i].show) num++;
		}
		return num;
	}
	
	// avg speed
	get avgSpeed() {
		let sum = 0;
		let num = 0;
		for (let i in this.list) {
			if (this.list[i].show) {
				sum += this.list[i].v.value;
				num ++;
			}
		}
		return sum / num;
	}
	
	// avg momentum
	get avgMomentum() {
		let sum = 0;
		let num = 0;
		for (let i in this.list) {
			if (this.list[i].show) {
				sum += this.list[i].momentum.value;
				num ++;
			}
		}
		return sum / num;
	}
	
	// show all floppies
	showAll() {
		for (let i in this.list) {
			this.list[i].savedShowStatus = this.list[i].show;
			this.list[i].show = true;
		}
	}
	
	// hide all floppies
	hideAll(hideDefault = false) {
		for (let i in this.list) {
			this.list[i].savedShowStatus = this.list[i].show;
			this.list[i].show = false;
		}
		if (!hideDefault) {
			this.list["M"].show = true;
		}
	}
	
	// save show status
	saveShowStatus() {
		for (let i in this.list) {
			this.list[i].savedShowStatus = this.list[i].show;
		}
	}
	
	// restore show status to whatever it last was
	restoreShowStatus() {
		for (let i in this.list) {
			this.list[i].show = this.list[i].savedShowStatus;
		}
	}
	
	// create an object and store to localStorage as JSON
	saveToLocalStorage() {
		let tmp = {};
		for (let i in this.list) {
			tmp[i] = this.list[i].asJSON;
		}
		console.log(tmp);
		tmp = JSON.stringify(tmp);
		localStorage.setItem("floppies", tmp);
		document.getElementById("outputJSON").value = tmp;
		SaveAsFile(tmp, "export_floppy.json", "text/json;charset=utf-8");
	}
	
	// load JSON into floppies
	loadJSON(data, keepShowStatus = false) {
		let tmp = JSON.parse(data);
		for (let f in tmp) {
			this.updateFloppy(f, tmp[f].name, tmp[f].user, tmp[f].color);
			this.list[f].readFromStorage(tmp[f]);
			if (!keepShowStatus) {
				this.list[f].show = false;
			}
		}
		chatters.updateFloppy(defaultFloppyID, defaultFloppyName, defaultFloppyName, defaultFloppyColor, true);
		console.log(this.list);
	}
	
	// load JSON from localStorage
	loadFromLocalStorage(keepShowStatus = false) {
		if (localStorage.getItem("floppies")) {
			this.loadJSON(localStorage.getItem("floppies"), keepShowStatus);
		}
	}
	
	// load JSON from input text box
	loadFromJSON(keepShowStatus = false) {
		this.loadJSON(document.getElementById("inputJSON").value, keepShowStatus);
	}
	
	// output current Floppies list as JSON to output text box
	outputFloppies() {
		document.getElementById("outputJSON").value = JSON.stringify(this.list);
	}
	
	// physics
	runBallPhysics(c) {
		//canvas variable setup and frame refresh
		const ctx = c.getContext("2d");
		ctx.canvas.width = c.width;
		ctx.lineWidth = 2;
		ctx.font = "24px W95FA";
		ctx.textAlign = "center";
		
		// loop through floppies
		for (let i in this.list) {
			if (this.list[i].show) {
				let numVisible = this.numberVisible;
				
				// if battle active slowly shrink space
				if (battleActive) {
					// set the rate of shrinkage based on the number of visible floppies
					if (numVisible > 24) {
						battleShrinkFrequency = 500;
					} else if (numVisible > 12) {
						battleShrinkFrequency = 300;
					} else if (numVisible > 6) {
						battleShrinkFrequency = 120;
					} else if (numVisible > 3) {
						battleShrinkFrequency = 60;
					} else {
						battleShrinkFrequency = 20;
					}
					// if battleTimer is divisible by shrink rate then actually shrink
					if (battleTimer % battleShrinkFrequency == 0) {
						if (battleWidth > BATTLE_WIDTH_MIN) {
							battleWidth -= 4;
							xmin = (c.width - battleWidth) / 4;
							xmax = c.width - (xmin * 3);
						}
						if (battleHeight > BATTLE_HEIGHT_MIN) {
							battleHeight -= 2;
							ymin = (c.height - battleHeight) / 2;
							ymax = c.height - ymin;
						}
					}
					// update with min/max limits
					this.list[i].update(c, xmax, ymax, xmin, ymin);
				} else {
					// update based on canvas size
					this.list[i].update(c);
				}

				// check for collisions
				if (numVisible > 1) {
					for (let j in this.list) {
						if (j != i && this.list[j].show) {
							// fight
							if (battleActive) {
								if (this.list[i].isColliding(this.list[j])) {
									let wl = (this.list[i].momentum.value < this.list[j].momentum.value) ? [j, i] : [i, j];
									this.list[wl[1]].lives -= 1;
									if (this.list[wl[1]].lives <= 0) {
										this.list[wl[1]].show = false;
										this.list[wl[0]].vx *= REMOVE_ENERGY_ON_KILL_VALUE;
										this.list[wl[0]].vy *= REMOVE_ENERGY_ON_KILL_VALUE;
									} else {
										this.list[i].collides(this.list[j], ENTROPY_VALUE);
									}
								}
							} else {							
								// collision
								this.list[i].collides(this.list[j], ENTROPY_VALUE);
							}
						}
					}
				}
			}
		}
		if (battleActive) {
			battleTimer += 1;
		}
		
		// randomly increase speed
		if (this.avgMomentum < IDEAL_AVG_MOMENTUM) {
			let tmp = getRandomProperty(this.list);
			tmp.vx *= PERPETUAL_MOTION_VALUE;
			tmp.vy *= PERPETUAL_MOTION_VALUE;
		}
		
		// run crab rave
		if (crabRaveTimer > 0) {
			if (crabRaveTimer == CRABRAVE_TIME_LIMIT) {
				globalCrab = 1;
			} else if (crabRaveTimer == 1) {
				globalCrab = 0;
			} else if (crabRaveTimer % 40 == 0) {
				if (globalCrab == 1) {
					globalCrab = 2;
				} else {
					globalCrab = 1;
				}
			}
			crabRaveTimer -= 1;
		}
		
		// draw floppies
		for (let i in this.list) {
			this.list[i].draw(ctx);
		}
	}
}

// show avg speed
function showAvgSpeed() {
	let avgSpeed = chatters.avgSpeed;
	document.getElementById("avgSpeed").value = avgSpeed;
	if (document.getElementById("avgSpeedMax").value == "") document.getElementById("avgSpeedMax").value = avgSpeed;
	if (document.getElementById("avgSpeedMin").value == "") document.getElementById("avgSpeedMin").value = avgSpeed;
	if (avgSpeed > document.getElementById("avgSpeedMax").value) document.getElementById("avgSpeedMax").value = avgSpeed;
	if (avgSpeed < document.getElementById("avgSpeedMin").value) document.getElementById("avgSpeedMin").value = avgSpeed;
}

// show avg momentum
function showAvgMomentum() {
	let avgMomentum = chatters.avgMomentum;
	document.getElementById("avgSpeed").value = avgMomentum;
	if (document.getElementById("avgSpeedMax").value == "") document.getElementById("avgSpeedMax").value = avgMomentum;
	if (document.getElementById("avgSpeedMin").value == "") document.getElementById("avgSpeedMin").value = avgMomentum;
	if (avgSpeed > document.getElementById("avgSpeedMax").value) document.getElementById("avgSpeedMax").value = avgMomentum;
	if (avgSpeed < document.getElementById("avgSpeedMin").value) document.getElementById("avgSpeedMin").value = avgMomentum;
}

// bonk battle
function bonkBattle() {
	battleTimer = 0;
	battleWidth = canvas.width;
	battleHeight = canvas.height;
	xmin = 0;
	xmax = battleWidth;
	ymin = 0;
	ymax = battleHeight;
	announcedWinner = false;
	for (let i in chatters.list) {
		chatters.list[i].savedShowStatsus = chatters.list[i].show;
		chatters.list[i].lives = 3;
	}
	chatters.list[defaultFloppyID].show = false;
	battleActive = true;
	client.say("mmica442", "A battle is starting! Each floppy starts with 3 lives. On colliding with another floppy, the floppy with less momentum (mass x velocity) loses a life. The last floppy left wins! You can use !boost to briefly boost the speed of your floppy, but after about 10 seconds, your speed will be reduced to less than what you started with, so be careful. The screen area will also shrink over the course of the battle.");
}

function endBonkBattle() {
	for (let i in chatters.list) {
		chatters.list[i].show = chatters.list[i].savedShowStatus;
	}
	battleActive = false;
}


// create the floppies group and load from localStorage
const chatters = new Floppies();
chatters.loadFromLocalStorage();
setConstants();

// main
function main() {
    chatters.runBallPhysics(canvas);
    var repeater = window.setTimeout(main, 10); //~100 fps max
}
