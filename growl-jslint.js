var sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    growl = require('growl'),
    nopt = require("nopt"),
    jslint = require('/Users/pseidel/.nave/installed/0.4.8/lib/node/.npm/jslint/0.1.0/package/lib/linter');

/**
 * Test single file with jslint
 */
function validate(filename, callback) {
    fs.readFile(filename, 'utf8', function(err, file) {
        sys.print('Checking ' + filename.replace(__dirname + '/', '') + '... ');
        callback(jslint.lint(file));
    });
}

/**
 * Output status of JSLint validation
 */
function status(ok) {
   var errors = ok.errors;
    if(errors.length == 0) {
        sys.puts("all right");
    } else {
        sys.puts(errors.length + ' errors');
        for (var i = 0; i < errors.length; i += 1) {
            if (errors[i]) {
                sys.puts(' ' + errors[i].line + ': ' + errors[i].reason);
            }
        }
    }
}

function status_and_growl(filename, ok) {
    if(ok.errors.length > 0) {
        growl.notify(filename + "\n" + ok.errors.length + ' errors (check console)');
    }
    status(ok);
}

/**
 * Process file or directory through callback function
 */
function walk(filename, callback){
    fs.stat(filename, function(err, stats) {
        if(stats.isFile() && filename.match(/\.js$/)) {
            // Filename - do callback
            callback(filename);
        } else if(stats.isDirectory()) {
            // Directory - walk recursive
            fs.readdir(filename, function(err, files) {
                for(var i = 0; i < files.length; i++) {
                    walk(filename + '/' + files[i], callback);
                }
            });
        }
    });
}

var options = {
   "directory" : [String],
   "fileregex" : [String]
}
var shorthandOptions = {
   "d" : "--directory",
   "re" : "--fileregex"
}
var parsed = nopt(options, shorthandOptions);

var dirname = parsed.directory || __dirname;
var fregex = new RegExp(parsed.fileregex || ".*");

var _bind = function (f /* args */) {
   var _args = Array.prototype.slice.call(arguments, 1);
   return function() {
      f.apply(this, _args.concat(Array.prototype.slice.call(arguments)));
   }
}
walk(dirname, function(filename) {
   if (filename.search(fregex) >= 0) {
      validate(filename, _bind(status_and_growl, filename));

      fs.watchFile(filename, function(curr, prev) {
          if(curr.mtime - prev.mtime !== 0) {
              validate(filename, _bind(status_and_growl, filename));
          }
      });      
   }
});
