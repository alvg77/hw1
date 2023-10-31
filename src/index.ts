import Jimp from 'jimp';

async function readImage() {
    try {
        const img = await Jimp.read('catJedi.jpg'); // read image
        const imgData: number[][][] = []; // 3D array to store the image data for each pixel and color channel
        
        // store the data from the image into the 3D array
        img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
            const red = Jimp.intToRGBA(img.getPixelColor(x, y)).r; // get the red value for the pixel
            const green = Jimp.intToRGBA(img.getPixelColor(x, y)).g; // get the green value for the pixel
            const blue = Jimp.intToRGBA(img.getPixelColor(x, y)).b; // get the blue value for the pixel

            // if the row doesn't exist, create it
            if (!imgData[y]) {
                imgData[y] = [];
            }
        
            // store the pixel data in the 3D array
            imgData[y][x] = [red, green, blue];
        });
        
        return imgData;
    } catch (err) {
        console.error('Error reading the image:', err);
    }
}

function getHistogram(img: number[][]): number[] {
    // initialize an array of 256 elements with 0, as there are 256 different values for a pixel, as it is 8-bit
    const hist: number[] = new Array(256).fill(0);
    // iterate and count the number of pixels with the same value
    for (const row of img) {
        for (const pixel of row) {
            hist[pixel]++;
        }
    }
    return hist;
}

function equalization(img: number[][], hist: number[]) {
    const c_0: number = 0; // the minimum value for a pixel
    const c_max: number = 255; // the maximum value for a pixel
    const c_n: number[] = new Array(256).fill(0); // the new values for the pixels

    const p_0: number = 0; // starting pixel
    const p_max: number = img.length * img[0].length; // final pixel

    const h_mid: number = p_max / (c_max + 1); // pmax -> number of pixels; cmax + 1-> number of bins
    var h_sum: number = 0; // the sum of the pixels

    var r_ver: number = 0; 

    // calculate the new values for each pixel
    for (let i = c_0; i <= c_max; i++) {
        let l_c: number = r_ver;
        h_sum += hist[i];
        while (h_sum > h_mid) {
            h_sum -= h_mid;
            r_ver++;
        }
        let r_c: number = r_ver;
        
        c_n[i] = Math.random() * (r_c - l_c) + l_c;
    }

    // change the values of the pixels in the image
    for (let i = 0; i < img.length; i++) {
        for (let j = 0; j < img[0].length; j++) {
            img[i][j] = c_n[img[i][j]];
        }
    }

    return img;
}

async function writeImage(img: number[][][]) {
    // create a new image with the same dimensions as the original one
    const image = new Jimp(img[0].length, img.length);
    // iterate through the pixels and set the new values
    image.scan(0, 0, img[0].length, img.length, (x, y, idx) => {
        const pixelValue = img[y][x];
        // set the pixel value for each color channel and the alpha channel
        image.setPixelColor(Jimp.rgbaToInt(pixelValue[0], pixelValue[1], pixelValue[2], 255), x, y);
    });

    // save the image
    image.write('out.jpg', (err) => {
        if (!err) {
            console.log('Equalized image saved as out.jpg');
        } else {
            console.error('Error saving the equalized image:', err);
        }
    });
}

// get single color channel from the image
function getColorChannel(img: number[][][], channel: number) {
    return img.map(row => row.map(pixel => pixel[channel]));
}

// combine the color channels into a single image
function combineColorChannels(red: number[][], green: number[][], blue: number[][]) {
    return red.map((row, i) => row.map((pixel, j) => [pixel, green[i][j], blue[i][j]]));
}

async function main() {
    console.log('Starting...');
    const img = await readImage();

    const redChannel = getColorChannel(img, 0);
    const greenChannel = getColorChannel(img, 1);
    const blueChannel = getColorChannel(img, 2);

    const histRed = getHistogram(redChannel);
    const histGreen = getHistogram(greenChannel);
    const histBlue = getHistogram(blueChannel);

    const equalizedRed = equalization(redChannel, histRed);
    const equalizedGreen = equalization(greenChannel, histGreen);
    const equalizedBlue = equalization(blueChannel, histBlue);

    const combined = combineColorChannels(equalizedRed, equalizedGreen, equalizedBlue);

    await writeImage(combined);
}

main();