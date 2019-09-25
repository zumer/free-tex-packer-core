let getPackerByType = require("./packers/index").getPackerByType;
let getExporterByType = require("./exporters/index").getExporterByType;
let getFilterByType = require("./filters").getFilterByType;
let FilesProcessor = require("./FilesProcessor");
let appInfo = require('./package.json');
let Jimp = require("jimp");

function getErrorDescription(txt) {
    return appInfo.name + ": " + txt;
}

function fixPath(path) {
    return path.split("\\").join("/");
}

function loadImage(file, files) {
	return Jimp.read(file.contents)
		.then(image => {
			image.name = fixPath(file.path);
			image._base64 = file.contents.toString("base64");
			image.width = image.bitmap.width;
			image.height = image.bitmap.height;
			files[image.name] = image;
		})
		.catch(e => {
			console.error(getErrorDescription("Error reading " + file.path));
		});
}

module.exports = function(images, options, cb) {
	options = options || {};
    options = Object.assign({}, options);
    
    options.textureName = options.textureName === undefined ? "pack-result" : options.textureName;
    options.width = options.width === undefined ? 2048 : options.width;
    options.height = options.height === undefined ? 2048 : options.height;
    options.powerOfTwo = !!options.powerOfTwo;
    options.fixedSize = options.fixedSize === undefined ? false : options.fixedSize;
    options.padding = options.padding === undefined ? 0 : options.padding;
    options.extrude = options.extrude === undefined ? 0 : options.extrude;
    options.allowRotation = options.allowRotation === undefined ? true : options.allowRotation;
    options.detectIdentical = options.detectIdentical === undefined ? true : options.detectIdentical;
    options.allowTrim = options.allowTrim === undefined ? true : options.allowTrim;
    options.trimMode = options.trimMode === undefined ? "trim" : options.trimMode;
    options.alphaThreshold = options.alphaThreshold === undefined ? 0 : options.alphaThreshold;
    options.removeFileExtension = options.removeFileExtension === undefined ? false : options.removeFileExtension;
    options.prependFolderName = options.prependFolderName === undefined ? true : options.prependFolderName;
    options.textureFormat = options.textureFormat === undefined ? "png" : options.textureFormat;
    options.base64Export = options.base64Export === undefined ? false : options.base64Export;
    options.scale = options.scale === undefined ? 1 : options.scale;
    options.tinify = options.tinify === undefined ? false : options.tinify;
    options.tinifyKey = options.tinifyKey === undefined ? "" : options.tinifyKey;
    options.filter = options.filter === undefined ? "none" : options.filter;

    if(!options.packer) options.packer = "MaxRectsBin";
    if(!options.exporter) options.exporter = "JsonHash";

    let packer = getPackerByType(options.packer);
    if(!packer) {
        throw new Error(getErrorDescription("Unknown packer " + options.packer));
    }

    if(!options.packerMethod) {
        options.packerMethod = packer.defaultMethod;
    }

    let packerMethod = packer.getMethodByType(options.packerMethod);
    if(!packerMethod) {
        throw new Error(getErrorDescription("Unknown packer method " + options.packerMethod));
    }

    let exporter;
    if(typeof options.exporter == "string") {
        exporter = getExporterByType(options.exporter);
    }
    else {
        exporter = options.exporter;
    }
	
	if(!exporter.allowRotation) options.allowRotation = false;
	if(!exporter.allowTrim) options.allowTrim = false;
    
    if(!exporter) {
        throw new Error(getErrorDescription("Unknown exporter " + options.exporter));
    }
    
    let filter = getFilterByType(options.filter);
    if(!filter) {
        throw new Error(getErrorDescription("Unknown filter " + options.filter));
    }

    options.packer = packer;
    options.packerMethod = packerMethod;
    options.exporter = exporter;
    options.filter = filter;
	
	let files = {};
	let p = [];
	
	for(let file of images) {
		p.push(loadImage(file, files));
    }
	
	Promise.all(p).then(() => {
        
        let names = Object.keys(files);
        for(let key of names) {
            let img = files[key];
            //img._base64 = file.contents.toString("base64");
            let newWidth = img.width * options.reScale;
            let newHeight = img.height * options.reScale;
            img = img.resize(newWidth, newHeight);

			img.width = newWidth;
			img.height = newHeight;
			files[img.name] = img;
        }

		FilesProcessor.start(files, options, 
			(res) => {
				if(cb) cb(res);
			},
			(error) => {
				console.error(getErrorDescription(error.description));
			});
	});
};