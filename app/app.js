/*
 * Libraries
 */
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const crypto = require('crypto');
const tex = require('escape-latex');
const latex = require('node-latex');
const fs = require('fs');
const passport = require('passport');
const redis = require('redis');
const cookie = require('cookie');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20');
const mariadb = require('mariadb');
const querystring = require('querystring');

/*
 * Constants from process environment variables and docker configuration
 */
const redisCredentials = {
    host: 'redis'
}
const databaseCredentials = {
    host: 'database',
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
}
const oauth20 = {
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.OAUTH_CLIENT_SECRET,
    session_secret: process.env.OAUTH_SESSION_SECRET,
}

/*
 * Globals
 */
const pool = mariadb.createPool(databaseCredentials);
const param = require('./resources/application-param');
const layout = require('./resources/template-layout');
const resources = path.join(__dirname, 'resources');
const texresources = path.join(resources, 'tex');
const download = path.join(__dirname, 'public', 'download');
const viewerPrefix = 'web/viewer.html?file=';
const viewerAffix = '#pagemode=none&zoom=page-fit';

/*
 * Initialization
 */
let indexRouter = require('./routes/index');

let client = redis.createClient(redisCredentials);
client.on('error', function(err) {
    console.log('Error ' + err);
});

let redisStore = require('connect-redis')(session);
let store = new redisStore({ client });

let app = express();
let io = require('socket.io')();
app.io = io;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: store,
    secret: oauth20.session_secret,
    resave: false,
    saveUninitialized: true
}));

module.exports = app;

passport.use(new GoogleStrategy({
    clientID: oauth20.client_id,
    clientSecret: oauth20.client_secret,
    callbackURL: oauth20.callback_url
}, async function(accessToken, refreshToken, googleProfile, callback) {
    // Check if google id has been registered in database
    let conn = await pool.getConnection();
    let rows = await conn.query('SELECT * FROM users WHERE googleid = ?;', [googleProfile.id]);
    if (rows.length === 1) {
        // Update profile data in case anything changed
        await conn.query('UPDATE users SET googleprofile = ? WHERE googleid = ?;', [JSON.stringify(googleProfile._json), googleProfile.id]);
    } else if (rows.length === 0) {
        // Insert google id and profile data into database
        await conn.query('INSERT INTO users SET googleid = ?, googleprofile = ?;', [googleProfile.id, JSON.stringify(googleProfile._json)]);
    }
    conn.end();
    return callback(null, { id: googleProfile.id, profile: googleProfile._json });
}));

passport.serializeUser((userObject, done) => {
    done(null, userObject.id);
});

passport.deserializeUser((userId, done) => {
    done(null, { id: userId });
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);

let jobs = [];
let queue = [];
let requests = [];

const prepare = function(val) {
    return val === '' ? param.placeholder : tex(val.substring(0, Math.min(val.length, param.charCutoff)));
};

/*
 * Passport middleware
 */
io.use((socket, next) => {
    try {
        // Examine cookies in request header
        const parsedCookie = cookie.parse(socket.request.headers.cookie);
        const connectAuth = parsedCookie['connect.sid'].substr(2, 32);
        store.load(connectAuth, function (err, session) {
            if (err) console.log(err);
            // Check if user is logged in through passport strategy
            if (session && session.passport) socket.user = session.passport.user;
        });
    } catch(err) {
    } finally {
        next();
    }
});

/*
 * On new connection
 */
io.on('connection', function(socket) {
    socket.ip = socket.request.connection.remoteAddress;
    socket.occupied = false;
    socket.dump = false;
    socket.impatience = 0;
    socket.filename = 'Curriculum Vitae ' + crypto.randomBytes(8).toString('hex');
    socket.texpath = path.join(texresources, socket.filename + '.tex');
    socket.pdf = path.join(download, socket.filename + '.pdf');
    socket.download = path.join('/download', socket.filename + '.pdf');
    socket.data = JSON.parse(JSON.stringify(param));
    socket.handshakeComplete = false;
    socket.auth = function() {
        if (socket.user) {
            // User has logged in through passport
            socket.emit('account-management', param.accountManagement.loggedIn);
            socket.load();
        } else {
            // Guest user
            socket.emit('account-management', param.accountManagement.loggedOut);
            socket.emit('pdf', viewerPrefix + encodeURI(path.join('/download', socket.data.template + '.pdf')) + viewerAffix);
        }
    };
    socket.load = async function() {
        // Load account data
        let conn = await pool.getConnection();
        let rows = await conn.query('SELECT * FROM users WHERE googleid = ?;', [socket.user]);
        if (rows.length === 1) {
            let profile = JSON.parse(rows[0].googleprofile);            // Load profile
            socket.emit('profile-info', profile.name, profile.picture); // Emit profile
            param.categories.forEach(function(category) {
                // Write data to socket
                if (rows[0][category]) socket.data[category] = JSON.parse(rows[0][category]);
            });
        }
        conn.end();
        socket.emit('load-input', socket.data); // Load input field values
        socket.make();                          // Make CV for returning user
    };
    socket.store = async function(category, data) {
        let conn = await pool.getConnection();
        // Write data to database category
        await conn.query(`UPDATE users SET ${category} = ? WHERE googleid = ?;`, [JSON.stringify(data), socket.user]);
    };
    socket.nullify = async function(category) {
        let conn = await pool.getConnection();
        // Write empty string to database category
        await conn.query(`UPDATE users SET ${category} = ? WHERE googleid = ?;`, ['', socket.user]);
    };
    socket.unlink = function() {
        // Unlink tex file
        fs.unlink(socket.texpath, function(err) { fs.unlink(socket.pdf, function(err) {}) });
    };
    socket.unblock = function() {
        // Re-enable writing to file
        jobs.splice(jobs.indexOf(socket.ip), 1);
        if (socket.dump) socket.unlink();
        socket.occupied = false;
    };
    socket.make = function(id, data) {
        // Do not allow more than one job per socket
        if (socket.occupied) {
            socket.emit('err', param.err.occupied);
            return;
        }
        // Queue jobs from identical IP addresses
        if (jobs.includes(socket.ip)) {
            queue.push(socket.ip);
            requests.push({ socket: socket, id: id, data: data });
            return;
        }
        jobs.push(socket.ip);           // Remember IP in jobs
        socket.occupied = true;         // No more jobs from ip while occupied
        data = querystring.parse(data); // Get data from form in correct format
        // Delete old file, catch err if undefined
        fs.unlink(socket.texpath, function(err) {
            let file = fs.createWriteStream(socket.texpath);    // Write to this variable
            socket.data.categories.forEach(function(category) {
                socket.emit('impatience-mock', category, param.impatienceMock[0]);
                if (category === id) {
                    // Check for correct category, e.g. general, education, experience, internship
                    socket.data[category].properties.forEach(function(property) {
                        // Check for correct property, e.g. first_name, last_name, title, location
                        if (property in data) {
                            let old = socket.data[category][property];
                            if (Array.isArray(data[property])) {
                                socket.data[category][property] = data[property].map(prepare);  // Update array
                            } else {
                                socket.data[category][property] = prepare(data[property]);      // Update value
                            }
                        }
                    });
                    if (socket.user) socket.store(category, socket.data[category]);
                }
                // Update pdf in loop
                for (let part in layout[socket.data.template][category]) {
                    if (!layout[socket.data.template][category].hasOwnProperty(part)) continue; // Continue if part in prototype
                    // For every part, e.g. begin, loop, end
                    let inquiry = layout[socket.data.template][category][part];  // Inquiry of part in tex document
                    if (inquiry) {
                        // Check if action required
                        let mem = '';   // Memory for do:unique operation
                        // Get minimal value for max loop iteration
                        let iter = part === 'loop' ? Object.values(socket.data[category]).reduce((min, p) => p.length < min ? p.length : min, param.entryLimit) : 1;
                        for (let i = 0; i < iter; i++) {
                            let block = inquiry;    // Keep original inquiry
                            let query = new RegExp('\\@.+\\@', 'g');    // Look for first-loop ignore operation
                            let beginOp = block.search(query);  // Operation begin location
                            if (beginOp !== -1) {
                                // Found
                                let endOp = block.indexOf('@', beginOp + 1);    // Look for end of this first-loop ignore operation
                                if (i === 0) {
                                    // If in first loop, remove operators and content
                                    block = block.substring(0, beginOp) + block.substring(endOp + 1);
                                } else {
                                    // If not in first loop, remove operators only
                                    block = block.substring(0, beginOp) + block.substring(beginOp + 1, endOp) + block.substring(endOp + 1);
                                }
                            }
                            socket.data[category].properties.forEach(function(property) {
                                // For every property in category
                                let value = socket.data[category][property]; // Value to replace with
                                let val = Array.isArray(value) ? value[i] : value;   // Get from array if in loop
                                // Look for do operation
                                let query = new RegExp('\\$do:\\w+\\$' + category + ':' + property + '\\$');
                                let beginOp = block.search(query);  // Operation begin location
                                if (beginOp !== -1) {
                                    // Found do operation
                                    let endOp = block.indexOf('\n', beginOp);       // Operation line end location
                                    let piece = block.substring(beginOp, endOp);    // Operation and content
                                    if (piece.indexOf('$do:optional$') === 0 && (val === param.placeholder || val === '') ||
                                        piece.indexOf('$do:unique$') === 0 && mem.indexOf('{' + val + '}') !== -1) {
                                        // If do:optional and not filled in or do:unique and found in memory
                                        block = block.substring(0, beginOp) + block.substring(endOp + 1);   // Remove operation and entry
                                    } else if (piece.indexOf('$do:optional$') === 0 ||
                                        piece.indexOf('$do:unique$') === 0 && mem.indexOf('{' + val + '}') === -1) {
                                        let lengthOp = 1;
                                        for (let j = 0; j < 2; j++) lengthOp = piece.indexOf('$', lengthOp) + 1;  // Find operation length
                                        block = block.substring(0, beginOp) + block.substring(beginOp + lengthOp);      // Remove operation
                                    }
                                }
                                query = new RegExp('(?<!\\$)' + category + ':' + property + '(?!\\$)', 'g');    // Look for replace operation
                                block = block.replace(query, val);  // Replace match with (array) value
                            });
                            mem += block;       // Remember previous blocks
                            file.write(block);  // Write block to file
                        }
                    }
                }
            });
            file.end();     // Close file
            // PDF file creation with xelatex
            file.on('finish', function() {
                let input = fs.createReadStream(socket.texpath);
                let output = fs.createWriteStream(socket.pdf);
                let pdf = latex(input, { cmd: 'xelatex', inputs: resources });
                let viewer = viewerPrefix + encodeURI(socket.download) + '&preview=' + crypto.randomBytes(2).toString('hex') + viewerAffix;
                pdf.pipe(output);
                pdf.on('error', function (err) {
                    console.log(err);
                    socket.emit('err', param.err.compile);
                    socket.prepare();
                });
                pdf.on('finish', function () {
                    socket.emit('pdf', viewer);
                    socket.prepare();
                });
            });
        });
    };
    socket.prepare = function() {
        socket.unblock();
        let index = queue.indexOf(socket.ip);
        if (index !== -1) {
            let req = requests[index];
            queue.splice(index, 1);
            requests.splice(index, 1);
            req.socket.make(req.id, req.data);
        }
    };
    socket.emit('param', socket.data);
    socket.on('make', function(id, data) {
        socket.make(id, data);
    });
    // Handshake
    socket.on('handshake', function() {
        if (!socket.handshakeComplete) {
            socket.handshakeComplete = true;
            socket.auth();
        }
    });
    // Mock if clicking on patience button
    socket.on('impatient', function(id) {
        socket.impatience++;
        let mock = param.impatienceMock[Math.min(socket.impatience, param.impatienceMock.length - 1)];
        socket.data.categories.forEach(function(category) {
            if (category === id) socket.emit('impatience-mock', id, mock);  // Mock for impatience
        });
    });
    // Ability to remove entire category
    socket.on('remove', function(id) {
        socket.data.categories.forEach(function(category) {
            if (category === id) {
                // Remove data from category
                socket.data[id] = param[id];
                socket.nullify(id);
                socket.make();
            }
        });
    });
    // Clean up on disconnect
    socket.on('disconnect', function() {
        if (socket.occupied) {
            socket.dump = true; // Unlink on finish
        } else {
            socket.unlink();    // Unlink now
        }
    });
});
