const canvas = document.getElementById("canvas");
const crabRaveTimeLimit = 2900;
var crabRaveTimer = 0;
var globalCrab = 0;


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


// classes
// floppy disk class
class Floppy extends Ball {
    constructor(userID, name, color) {
        super(
			Math.random() * 1400 + 100,
			Math.random() * 700 + 100,
			Math.random() * 7 - 3,
			Math.random() * 7 - 3,
			24
		);
		this._m += Math.random() * 400 - 200;
		this.userID = userID;
        this.name = name;
        this.color = color;
		this.randomColor = randomColor();
		this.defaultRenderType = null;
        this.renderType = this.defaultRenderType;
		this.permissions = ["cat"];
		this.show = true;
    }
	
	// for saving data
	get asJSON() {
		return {
			id: this.userID,
			name: this.name,
			color: this.color,
			dR: this.defaultRenderType,
			perm: this.permissions
		};
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
			case null:
				ctx.drawImage(document.getElementById("floppy"), this.x - 24, this.y - 24);
				break;

			case "cat":
				ctx.drawImage(document.getElementById("floppy_cat"), this.x - 40, this.y - 40);
				break;

			case "crab":
				ctx.drawImage(document.getElementById("floppy_crab"), this.x - 38, this.y - 38);
				break;
			
			default:
				ctx.drawImage(document.getElementById("floppy"), this.x - 24, this.y - 24);
			}
		}
        ctx.strokeStyle = this.color ?? this.randomColor;
        ctx.fillStyle = this.color ?? this.randomColor;
		ctx.fillText(this.name.charAt(0), this.x - 8, this.y - 1);
    }
	
	// read data from localStorage
	readFromStorage(stored) {
		this.name = stored.name;
		this.color = stored.color;
		if (typeof(stored.dR) != 'undefined') {
			this.defaultRenderType = stored.dR;
		}
		this.renderType = this.defaultRenderType;
		for (let i in stored.perm) {
			if (!this.permissions.includes(stored.perm[i])) {
				this.permissions.push(stored.perm[i]);
			}
		}
	}
}

// list of floppies
class Floppies {
	constructor() {
		this.list = {};
	}
	
	// add floppy if userID not in list, otherwise update floppy
	updateFloppy(userID, name, color, show) {
		if (this.list.hasOwnProperty(userID)) {
			if (typeof show == 'boolean') {
				this.list[userID].show = show;
			}
			this.list[userID].name = name;
			this.list[userID].color = color;
		} else {
			this.list[userID] = new Floppy(userID, name, color);
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
	
	// physics
	runBallPhysics(c) {
		//canvas variable setup and frame refresh
		const ctx = c.getContext("2d");
		ctx.canvas.width = c.width;
		ctx.lineWidth = 2;
		ctx.font = "24px W95FA";

		for (let i in this.list) {
			if (this.list[i].show) {
				this.list[i].update(c);

				if (Object.keys(this.list).length > 1) {
					for (let j in this.list) {
						if (j != i && this.list[j].show) {
							this.list[i].collides(this.list[j], 1);
						}
					}
				}
			}
		}
		if (crabRaveTimer > 0) {
			allCrab();
		}
		for (let i in this.list) {
			this.list[i].draw(ctx);
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
			this.updateFloppy(f, tmp[f].name, tmp[f].color);
			this.list[f].readFromStorage(tmp[f]);
			if (!keepShowStatus) {
				this.list[f].show = false;
			}
		}
		chatters.updateFloppy("M", "M", "#ffffff", true);
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
}

// crab rave
function allCrab(){
	if (crabRaveTimer == crabRaveTimeLimit) {
		globalCrab = 1;
	} else if (crabRaveTimer == 1) {
		globalCrab = 0;
	} else if (crabRaveTimer % 100 == 0) {
		if (globalCrab == 1) {
			globalCrab = 2;
		} else {
			globalCrab = 1;
		}
	}
	crabRaveTimer = crabRaveTimer - 1;
}

// create the floppies group and load from localStorage
const chatters = new Floppies();
chatters.loadFromLocalStorage();


// connecting to twitch chat
const client = new tmi.Client({
        channels: ["mmica442"],
    });
client.connect();
// client.join("mmica442");

client.on("message", (channel, tags, message, self) => {
    let currentUserID = tags["user-id"];
    let uniformMessage = message.toLowerCase().trim();
	let splitMessage = uniformMessage.split(" ");

    // add ball or update color
	chatters.updateFloppy(currentUserID, tags["display-name"], tags["color"], true);

    // check for broadcaster stuff
	if (tags.hasOwnProperty("badges") && tags["badges"] != null) {
		if (tags["badges"].hasOwnProperty("broadcaster")) {
			if (uniformMessage.startsWith("!!cat")) {
				if (splitMessage.length > 1) {
					let findUser = chatters.findByName(splitMessage[1], false);
					if (findUser !== null) {
						findUser.renderType = "cat";
					}
				}
			}  else if (uniformMessage.startsWith("!!crab ")) {
				if (splitMessage.length > 1) {
					let findUser = chatters.findByName(splitMessage[1], false);
					if (findUser !== null) {
						findUser.renderType = "crab";
					}
				}
			} else if (uniformMessage.startsWith("!!reset")) {
				if (splitMessage.length > 1) {
					let findUser = chatters.findByName(splitMessage[1], false);
					if (findUser !== null) {
						findUser.renderType = null;
					}
				}
			} else if (uniformMessage.startsWith("!!crabrave")) {
				crabRaveTimer = crabRaveTimeLimit;
			}
		}
	}

    // check for catting/uncatting
    if (uniformMessage.startsWith("!cat")) {
        chatters.list[currentUserID].renderType = "cat";
	} else if (uniformMessage.startsWith("!crab")) {
		if (chatters.list[currentUserID].permissions.includes("crab")) {
			chatters.list[currentUserID].renderType = "crab";
		}
    } else if (uniformMessage.startsWith("!uncat") || uniformMessage.startsWith("!uncrab")) {
        chatters.list[currentUserID].renderType = null;
    } else if (uniformMessage.startsWith("!setdefault ")) {
		if (splitMessage.length > 1) {
			if (chatters.list[currentUserID].permissions.includes(splitMessage[1].trim())) {
				chatters.list[currentUserID].defaultRenderType = splitMessage[1].trim();
			} else if (splitMessage[1].trim() == "none") {
				chatters.list[currentUserID].defaultRenderType = null;
			}
		}
    }

    // check for custom reward ID
    if (tags.hasOwnProperty("custom-reward-id")) {
		let findUser = null;
        switch (tags["custom-reward-id"]) {
		// uncat someone
        case "87af0b1e-c952-4450-af08-5f74e506fb9b":
            findUser = chatters.findByName(message, false);
            if (findUser != null) {
				if (findUser.renderType == "cat") {
					findUser.renderType = null;
				}
            }
            // client.say("mmica442", "I can't believe you've un-catted " + message + "...");
            break;
		
		// crab someone
		case "05dc19ab-2477-41af-89a9-6b4d6d8048ba":
			findUser = chatters.findByName(message, false);
            if (findUser != null) {
                findUser.renderType = "crab";
            } else {
				chatters.list[currentUserID].renderType = "crab";
			}
			break;
		
		// carcinization permissions
		case "f5382314-32a4-4b7e-b65a-8d067e0caf23":
			if (!chatters.list[currentUserID].permissions.includes("crab")) {
				chatters.list[currentUserID].permissions.push("crab");
			}
			break;
		
		// crab rave
		case "f7dc5438-f26a-4b3c-818b-7abea937b065":
			crabRaveTimer = crabRaveTimeLimit;
			break;
			
		default:
			console.log(message + ": " + JSON.stringify(tags));
        }
    }
});

// main
function main() {
    chatters.runBallPhysics(canvas);
    var repeater = window.setTimeout(main, 10); //~100 fps max
}
