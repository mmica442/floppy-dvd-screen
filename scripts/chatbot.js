//CLIENTID and OAUTHTOKEN declared in other file for hiding

// connecting to twitch chat
const client = new tmi.Client({
		// options: { debug: true },
		clientId: CLIENTID,
		connection: {
			reconnect: true,
			secure: true
		},
		identity: {
			username: 'mmica_bot',
			password: 'oauth:' + OAUTHTOKEN
		},
        channels: ["mmica442"],
    });
client.connect();


// on connecting, send a message
client.on("connected", (address, port) => {
	client.say("mmica442", "*hacker voice* i'm in");
});


// on raid
client.on("raided", (channel, username, viewers) => {
	client.say("mmica442", `!so ${username} Wow! Thanks for the raid, @${username}!!!`);
});


// on message
client.on("message", (channel, tags, message, self) => {
    let currentUserID = tags["user-id"];
    let uniformMessage = message.toLowerCase().trim();
	let splitMessage = uniformMessage.split(" ");
	
	if (self) return;

    // add ball or update color
	chatters.updateFloppy(currentUserID, tags["display-name"], tags["username"], tags["color"], true);

    // check for broadcaster stuff
	if (tags.hasOwnProperty("badges") && tags["badges"] != null) {
		if (tags["badges"].hasOwnProperty("broadcaster")) {
			if (uniformMessage.startsWith("!!cat")) {
				if (splitMessage.length > 1) {
					let findUser = chatters.findByName(splitMessage[1], false);
					if (findUser !== null) {
						findUser.setRenderType("cat");
					}
				}
			}  else if (uniformMessage.startsWith("!!crab ")) {
				if (splitMessage.length > 1) {
					let findUser = chatters.findByName(splitMessage[1], false);
					if (findUser !== null) {
						findUser.setRenderType("crab", true);
					}
				}
			}  else if (uniformMessage.startsWith("!!bee ")) {
				if (splitMessage.length > 1) {
					let findUser = chatters.findByName(splitMessage[1], false);
					if (findUser !== null) {
						findUser.setRenderType("bee", true);
					}
				}
			} else if (uniformMessage.startsWith("!!reset")) {
				if (splitMessage.length > 1) {
					let findUser = chatters.findByName(splitMessage[1], false);
					if (findUser !== null) {
						findUser.setRenderType("none");
					}
				}
			} else if (uniformMessage.startsWith("!!crabrave")) {
				crabRaveTimer = CRABRAVE_TIME_LIMIT;
			}
		}
	}

    // check for command
    if (uniformMessage.startsWith("!cat")) {
        chatters.list[currentUserID].setRenderType("cat");
		
	} else if (uniformMessage.startsWith("!crab")) {
        chatters.list[currentUserID].setRenderType("crab");
		
	} else if (uniformMessage.startsWith("!bee")) {
        chatters.list[currentUserID].setRenderType("bee");
				
    } else if (uniformMessage.startsWith("!uncat") || uniformMessage.startsWith("!uncrab") || uniformMessage.startsWith("!reset")) {
        chatters.list[currentUserID].setRenderType("none");
		
    } else if (uniformMessage.startsWith("!set ")) {
		if (splitMessage.length > 1) chatters.list[currentUserID].setRenderType(splitMessage[1]);		
		
    } else if (uniformMessage.startsWith("!setdefault ")) {
		if (splitMessage.length > 1) chatters.list[currentUserID].setDefaultRenderType(splitMessage[1]);
		
    } else if (uniformMessage.startsWith("!boost")) {
		chatters.list[currentUserID].boost();
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
					findUser.setRenderType("none");
					client.say("mmica442", `@${tags.username}, I can't believe you've un-catted @` + message + "...");
				}
            }
            break;
		
		// crab someone
		case "05dc19ab-2477-41af-89a9-6b4d6d8048ba":
			findUser = chatters.findByName(message, false);
            if (findUser != null) {
                findUser.setRenderType("crab", true);
				client.say("mmica442", `@${tags.username}, you've successfully crabbed @` + message + ".");
            } else {
				chatters.list[currentUserID].setRenderType("crab", true);
				client.say("mmica442", `@${tags.username}, you've successfully crabbed yourself!`);
			}
			break;
		
		// carcinization permissions
		case "f5382314-32a4-4b7e-b65a-8d067e0caf23":
			if (!chatters.list[currentUserID].permissions.includes("crab")) {
				chatters.list[currentUserID].permissions.push("crab");
			}
			client.say("mmica442", `Congratulations, @${tags.username}! You can now use the "!crab" and "!uncrab" commands to modify your floppy disk! You can also "!setdefault crab" to make your floppy disk default to displaying as a crab!`);
			break;
		
		// crab rave
		case "f7dc5438-f26a-4b3c-818b-7abea937b065":
			crabRaveTimer = CRABRAVE_TIME_LIMIT;
			client.say("mmica442", "🦀 TIME 🦀 FOR 🦀 CRAB 🦀");
			break;
			
		default:
			console.log(message + ": " + JSON.stringify(tags));
        }
    }
});