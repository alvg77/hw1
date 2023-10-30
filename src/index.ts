import Jimp from 'jimp';

async function readImage() {
    try {
        const img = await Jimp.read('in.jpg');
        img.grayscale();
        const imgData: number[][] = [];
        
        img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
            const pixelValue = Jimp.intToRGBA(img.getPixelColor(x, y)).r; // Assuming grayscale, so using the red channel.
            
            if (!imgData[y]) {
                imgData[y] = [];
            }
            
            imgData[y][x] = pixelValue;
        });
        
        return imgData;
    } catch (err) {
        console.error('Error reading the image:', err);
    }
}

function getHistogram(img: number[][]): number[] {
    const hist: number[] = new Array(256).fill(0);
    for (const row of img) {
        for (const pixel of row) {
            hist[pixel]++;
        }
    }
    return hist;
}

function equalization(img: number[][], hist: number[]) {
    const c_0: number = 0;
    const c_max: number = 255;
    const c_n: number[] = new Array(256).fill(0);

    const p_0: number = 0;
    const p_max: number = img.length * img[0].length;

    const h_mid: number = p_max / (c_max + 1); // pmax -> number of pixels; cmax + 1-> number of bins
    var h_sum: number = 0;

    var r_ver: number = 0;

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

    for (let i = 0; i < img.length; i++) {
        for (let j = 0; j < img[0].length; j++) {
            img[i][j] = c_n[img[i][j]];
        }
    }

    return img;
}

async function writeImage(img: number[][]) {
    const image = new Jimp(img[0].length, img.length);
    image.scan(0, 0, img[0].length, img.length, (x, y, idx) => {
        const pixelValue = img[y][x];
        image.setPixelColor(Jimp.rgbaToInt(pixelValue, pixelValue, pixelValue, 255), x, y);
    });
    image.write('out.jpg', (err) => {
        if (!err) {
            console.log('Equalized image saved as out.jpg');
        } else {
            console.error('Error saving the equalized image:', err);
        }
    });
}

async function main() {
    console.log('Starting...');
    const img = await readImage();
    const hist = getHistogram(img);
    const equalizedImg = equalization(img, hist);
    await writeImage(equalizedImg);
}

main();