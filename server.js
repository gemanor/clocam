var http = require('http');
var express = require('express');
var router = express();
var server = http.createServer(router);
var path = require('path');
var fs = require('fs');
var rt = require("thumb-express");

router.use(rt.init(path.join(__dirname)));
router.use(express.static(path.join(__dirname)));

router.use(express.bodyParser());
router.use('/users', express.static(path.resolve(__dirname + '/users')));
router.use('/thumb', express.static(path.resolve(__dirname + '/thumb')));

router.get('/', function(req, res) {
    fs.readdir('/users/', function(err, files) {
        res.send('successfully deleted ' + files);
    });
});

router.get('/.thumb', function(req, res) {
});

router.post('/upload', function(req, res) {
    var reqObj = req.body,
        userName = reqObj.userName;
    fs.readFile(req.files.file.path, function(err, data) {
        fs.writeFile(__dirname + '/users/' + userName + '/' + req.files.file.originalFilename, data, function(err) {
            if (err) {
                res.send(err);
            }
            else {
                res.send('/users/' + userName + '/' + req.files.file.originalFilename);
            }
        });
    });
});

router.post('/login', function(req, res) {
    var reqObj = req.body,
        userName = reqObj.userName;
    if (userName === undefined) res.send('error');
    fs.exists('users/' + userName, function(exists) {
        if (!exists) fs.mkdirSync('users/' + userName, '0777');
        var sendObj = getFilesList('users/' + userName + '/');
        if (sendObj) res.send(sendObj);
        else res.send('error');
    });
});

router.get('/directorieslist', function(req, res) {
    var reqObj = req.query,
        userName = reqObj.username,
        userPath = 'users/' + userName;
    fs.exists(userPath, function(exists) {
        if (exists) {
            var dirTree = function(filename) {
                var stats = fs.lstatSync(filename),
                    info = {};
                if (stats.isDirectory()) {
                    info.path = filename;
                    info.name = path.basename(filename);
                    info.children = fs.readdirSync(filename).map(function(child) {
                        return dirTree(filename + '/' + child);
                    });
                }
                return info;
            };
            var directories = dirTree(userPath);
            res.send(directories);
        }
        else {
            res.send('wrong user name.');
        }
    });
});

function getFilesList(folderPath) {
    if (fs.existsSync(folderPath)) {
        var files = fs.readdirSync(folderPath);
        if (files) {
            var i, resFiles = {}, subFiles, h;
            for (i = 0; i < files.length; i++) {
                if (fs.statSync(folderPath + '/' + files[i]).isDirectory()) {
                    var subFilesObj = {};
                    subFiles = fs.readdirSync(folderPath + '/' + files[i]);
                    if (subFiles.length) {
                        for (h = 0; h < subFiles.length; h++) {
                            if (fs.existsSync(folderPath + files[i] + '/' + subFiles[h])) {
                                if (fs.statSync(folderPath + files[i] + '/' + subFiles[h]).isFile()) {
                                    subFilesObj[h] = {
                                        'name': subFiles[h],
                                        'path': folderPath + files[i] + '/' + subFiles[h]
                                    };
                                }
                            }
                        }
                    }
                    resFiles[i] = {
                        'type': 'directory',
                        'name': files[i],
                        'path': folderPath + files[i],
                        'thumbs': subFilesObj
                    };
                }
                else {
                    var type = files[i].substr(files[i].lastIndexOf('.') + 1);
                    if (type == 'jpeg' || type == 'jpg' || type == 'png' || type == 'gif') {
                        resFiles[i] = {
                            'type': 'image',
                            'name': files[i],
                            'path': folderPath + files[i]
                        };
                    } else {
                       resFiles[i] = {
                            'type': 'video',
                            'name': files[i],
                            'path': folderPath + files[i]
                        }; 
                    }
                }
            }
            return resFiles;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}

router.get('/fileslist', function(req, res) {
    var reqObj = req.query,
        userName = reqObj.username,
        folder = reqObj.path || '',
        userPath = 'users/' + userName,
        folderPath = folder === '' ? userPath + '/' : folder + '/';
    fs.exists(userPath, function(exists) {
        if (exists) {
            var sendObj = getFilesList(folderPath);
            if (sendObj) res.send(sendObj);
            else res.send('error');
        }
        else {
            res.send('wrong user name.');
        }
    });
});

router.post('/createDirectory', function(req, res) {
    var reqObj = req.body,
        userName = reqObj.userName,
        dirName = reqObj.dirName;
    fs.exists('users/' + userName, function(exists) {
        if (exists) {
            fs.exists('users/' + userName + '/' + dirName, function(exists) {
                if (!exists) {
                    fs.mkdirSync('users/' + userName + '/' + dirName, '0777');
                    res.send('folder created');
                }
                else {
                    res.send('folder already created!');
                }
            });
        }
        else res.send('error');
    });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0");