/*
    Imports
*/
const cliProgress = require('cli-progress');
const { createCanvas, loadImage } = require('canvas')
const mongoose = require('mongoose');
const { writeFile } = require('fs')
const path = require("path");
const config = require("./config").getConfig();

/*
    Vars
*/
const size = 256;
const scale = 1;

const canvas = createCanvas(size * scale, size * scale);
const context = canvas.getContext('2d');

const colors = [
    "",
    "#000000",
    "#808080",
    "#c0c0c0",
    "#ffffff",
    "#000080",
    "#0000ff",
    "#008080",
    "#00ffff",
    "#008000",
    "#00ff00",
    "#808000",
    "#ffff00",
    "#800000",
    "#ff0000",
    "#800080",
    "#ff00ff"
]

/*
    Create Gif Encoder
*/
const GIFEncoder = require("gifencoder");
const encoder = new GIFEncoder(size * scale,size * scale);

/*
    Load Mongo DB
*/
mongoose.connect(config.db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (err) {
    if (err) throw err;
    console.log("Connected to database!")
});

const pixelSchema = mongoose.Schema({
    timestamp: Number,
    userID: String,
    color: Number,
    x: Number,
    y: Number
});
const pixel = mongoose.model('Pixel', pixelSchema);

/*
    Start Gif Encoder
*/
encoder.setDelay(0.1);
encoder.start();

/*
    Paint White First
*/
context.fillStyle = "#ffffff";
context.fillRect(0,0,size * scale,size * scale);
encoder.addFrame(context);

/*
    Progress Bar
*/
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
/*
    Get Pixels
*/
pixel.find().sort({_id:1}).then(async pixels => {

    /*
        Load Banner
    */
    //var banner = await loadImage(path.join(__dirname, 'output', 'banner.png'))
    //context.drawImage(banner,0,0,256,53);

    /*
        Bar Set
    */
    bar.start(pixels.length, 0);

    /*
        Loop Pixels
    */
    let pixelPerFrame = 20;
    let currentPixelCount = 0;
    for(let pixel in pixels) {
        pixel = pixels[pixel];

        /*
            Get Color
        */
        let color = getColor(pixel.color);
        if(!color) {
            continue;
        }

        /*
            Create Frame
        */
        context.fillStyle = color;
        context.fillRect(pixel.x * scale, pixel.y * scale, scale, scale);

        /*
            Bar Update
        */
        bar.increment();

        /*
            Add Pixel to Frame
        */
        if(pixelPerFrame <= currentPixelCount) {
            encoder.addFrame(context);
            currentPixelCount = 0;
        } else {
            currentPixelCount++;
        }
    }

    /*
        Stop Progress
    */
    bar.stop();

    /*
        Save File
    */
    encoder.finish();

    const buffer = encoder.out.getData()
    writeFile(path.join(__dirname, 'output', 'timelapse.gif'), buffer, err => {
        if(err) throw err;
        console.log("Export successful!")
    })
});

/*
    Utils
*/
function getColor(int) {
    if(int === 0) {
        return null;
    }

    return colors[int];
}