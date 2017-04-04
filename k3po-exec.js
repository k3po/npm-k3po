var spawn = require('child_process').spawn,
    fs = require('fs'),
    readline = require('readline'),
    mkdirp = require('mkdirp'),
    getDirName = require('path').dirname,
    argv = require('minimist')(process.argv.slice(2));

var config = argv.pom,
    pidFile = argv.pidFile,
    outputFile = argv.log;

// Kill by pid if pid file exists
if (fs.existsSync(pidFile)) {
    var lineReader = readline.createInterface({
        input: fs.createReadStream(pidFile)
    });
    lineReader.on('line', function (line) {
        try {
            console.log("Killing K3PO, PID = " + line);
            process.kill(line, 'SIGHUP');
        } catch (e) {
            //NOOP
        }
    });
    lineReader.on('close', function () {
        fs.unlinkSync(pidFile);
    });
}

// We always stop it, so haven't formalized stop command, instead all we do is check
// if asked to start
if (argv._[0] === 'start') {

    if (fs.existsSync(outputFile)) {
        // remove outputFile if exists
        fs.unlinkSync(outputFile);
    } else {
        // create directories if needed
        mkdirp(getDirName(outputFile));
    }

    console.log("Starting K3PO via mvn " + config);

    var out = fs.createWriteStream(outputFile);
    var child = spawn("mvn",
        ['k3po:start', '-Dmaven.k3po.daemon=false', '-f', config]
    );

    // save PID
    mkdirp(getDirName(pidFile));
    fs.writeFileSync(pidFile, child.pid);

    child.unref();

    // wait for success line
    child.stdout.on('data', function (data) {
        process.stdout.write(" " + data);
        if (data.indexOf("K3PO started") > -1) {
            console.log("Started K3PO");
            child.stdout.pipe(out);
            child.stdin.pipe(out);
            process.exit(0);
        }
    });

    child.stderr.on('data', function (data) {
        process.stdout.write(" " + data);
    });

    // fail is success line not read
    child.on('close', function (code) {
        console.log("Failed to start K3PO");
        process.kill(child.pid, 'SIGHUP');
        process.exit(-1);
    });
}
