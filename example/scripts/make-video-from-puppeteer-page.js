const { launch, getStream, wss } = require("puppeteer-stream");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const outputWebm = path.join(__dirname, "output.webm");
const outputMp4 = path.join(__dirname, "output.mp4");
const file = fs.createWriteStream(outputWebm);

async function test() {
    const browser = await launch({
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: "new", // supports audio!
        // headless: false, // for debugging
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            '--window-size=1920,1080',
            '--ozone-override-screen-size=1920,1080', // for linux
        ]
    });

    const page = await browser.newPage();

    // Create a promise that resolves when the final progress update is received.
    let resolveFinalProgress;
    const finalProgressPromise = new Promise(resolve => {
        resolveFinalProgress = resolve;
    });

    // Expose __onActionProgress so that progress stats from the client are logged in Node.
    // When a final progress update is received, we resolve the promise.
    await page.exposeFunction('__onActionProgress', (progress) => {
        console.log("Progress update:", progress);
        // Check if this progress update indicates completion.
        if (progress.progress === "100.0" || progress.currentAction >= progress.totalActions) {
            resolveFinalProgress();
        }
    });

    // Navigate to the puppeteer page.
    await page.setViewport({ width: 0, height: 0 });
    await page.goto("http://localhost:8000/puppeteer");

    // Inject CSS to remove margins/padding so the video fills the viewport
    await page.addStyleTag({ content: `body { margin: 0; padding: 0; }` });

    // Give the page some time to settle.
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    await sleep(15000);

    const videoConstraints = {
        mandatory: {
          minWidth: 1920,
          minHeight: 1080,
          maxWidth: 1920,
          maxHeight: 1080,
        },
      };

    // Start the stream and pipe it to a file.
    const stream = await getStream(page, {
        audio: true,
        video: true,
        mimeType: "video/webm", // WebM is well-supported for high-quality web video
        audioBitsPerSecond: 384000, // 384 kbps for high-quality stereo audio
        videoBitsPerSecond: 18000000, // 18 Mbps (18,000 kbps) for high-quality 1080p video
        frameSize: 100, // 100ms packets for good streaming balance
        videoConstraints
    });
    stream.pipe(file);
    console.log("Recording started");

    // Wait a moment before triggering interaction.
    await sleep(1000);

    // Trigger interaction with a simulated click.
    await page.click("body");
    console.log("Simulated click triggered");

    // Wait until the client sends a final progress update.
    await finalProgressPromise;

    // Once complete, tear down the recording.
    console.log("Final progress received. Stopping recording...");
    await stream.destroy();
    file.close();
    console.log("Recording finished");

    await browser.close();
    (await wss).close();

    // Once we're sure the webm file is done, convert it to mp4.
    console.log("Starting conversion from WebM to MP4...");
    try {
        await convertToMp4(outputWebm, outputMp4);
        console.log("Conversion complete:", outputMp4);
    } catch (err) {
        console.error("Error converting file:", err);
    }
}

function convertToMp4(input, output) {
    return new Promise((resolve, reject) => {
        // -y: overwrite output file if it exists
        const ffmpegCommand = `ffmpeg -y -i "${input}" "${output}"`;
        exec(ffmpegCommand, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            resolve();
        });
    });
}

test().catch(err => {
    console.error("Error during recording:", err);
});
