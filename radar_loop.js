const loopImageCount = 8; // 7 is default from them (+1 since we might miss the first)
const radarLoopID = "IDR703";
const drawLocalTimeString = true;
const frameDuration = 750;
const reloadMinutes = 10;

// -------------

const imgWidth = 512;
const imgHeight = 512;

const canvasWidth = window.innerWidth > 512 ? 512 : window.innerWidth; // 512;
const canvasHeight = window.innerWidth > 557 ? 557 : window.innerWidth;

// -------------

async function main() {
  const staticImages = await generateStaticImages(radarLoopID);
  const { loopImages, loopTexts } = await generateLoopImages(radarLoopID);

  // -----------

  const radarLoopCanvas = document.getElementById("radar_loop");
  radarLoopCanvas.width = canvasWidth;
  radarLoopCanvas.height = canvasHeight;

  const whiteBGContext = radarLoopCanvas.getContext("2d");
  whiteBGContext.fillStyle = "white";
  whiteBGContext.fillRect(0, 0, radarLoopCanvas.width, radarLoopCanvas.height);

  const imageViewContext = radarLoopCanvas.getContext("2d");

  // -----------

  let loopIndex = 1;
  const timer = setInterval(() => {
    drawFrame(imageViewContext, staticImages, loopImages, loopTexts, loopIndex);

    loopIndex++;
    if (loopIndex > loopImages.length - 1) {
      loopIndex = 0;
    }
  }, frameDuration);
}

function drawFrame(imageViewContext, staticImages, loopImages, loopTexts, frame) {
  drawBasic(imageViewContext, staticImages, false);
  if (drawLocalTimeString) drawTimeString(imageViewContext, loopTexts[frame]);
  imageViewContext.drawImage(loopImages[frame], 0, 0, imgWidth, imgHeight, 0, 0, canvasWidth, canvasHeight - 45);
  drawBasic(imageViewContext, staticImages, true);
}

function drawBasic(imageViewContext, loadedImages, under) {
  if (!under) {
    imageViewContext.drawImage(loadedImages["legend"], 0, 0, imgWidth, imgHeight + 45, 0, 0, canvasWidth, canvasHeight);
    imageViewContext.drawImage(loadedImages["background"], 0, 0, imgWidth, imgHeight, 0, 0, canvasWidth, canvasHeight - 45);
    imageViewContext.drawImage(loadedImages["topography"], 0, 0, imgWidth, imgHeight, 0, 0, canvasWidth, canvasHeight - 45);
  } else {
    imageViewContext.drawImage(loadedImages["range"], 0, 0, imgWidth, imgHeight, 0, 0, canvasWidth, canvasHeight - 45);
    imageViewContext.drawImage(loadedImages["locations"], 0, 0, imgWidth, imgHeight, 0, 0, canvasWidth, canvasHeight - 45);
  }
}

function drawTimeString(imageViewContext, textContent) {
  imageViewContext.font = "20px Courier New";
  imageViewContext.fillStyle = "black";
  imageViewContext.fillText(textContent, 10, 40);
}

// -------------------

function getRadarTimeString(date) {
  // 202108100455

  const datePart = `${date.getUTCFullYear()}${("0" + (date.getUTCMonth() + 1)).slice(-2)}${("0" + date.getUTCDate()).slice(-2)}`;
  const timePart = `${("0" + date.getUTCHours()).slice(-2)}${("0" + date.getUTCMinutes()).slice(-2)}`;

  return `${datePart}${timePart}`;
}

async function generateStaticImages(radarLoopID) {
  const preloadImages = {};

  preloadImages["legend"] = `http://www.bom.gov.au/products/radar_transparencies/IDR.legend.0.png`;

  preloadImages["background"] = `http://www.bom.gov.au/products/radar_transparencies/${radarLoopID}.background.png`;
  preloadImages["topography"] = `http://www.bom.gov.au/products/radar_transparencies/${radarLoopID}.topography.png`;
  preloadImages["locations"] = `http://www.bom.gov.au/products/radar_transparencies/${radarLoopID}.locations.png`;
  preloadImages["range"] = `http://www.bom.gov.au/products/radar_transparencies/${radarLoopID}.range.png`;

  for (const imageIdent of Object.keys(preloadImages)) {
    const imageSourceUrl = preloadImages[imageIdent];

    try {
      const imageElement = await preloadImage(imageSourceUrl);
      preloadImages[imageIdent] = imageElement;
    } catch (error) {
      console.log("preloadImage error", error);
      throw new Error("failed to load some static images!");
    }
  }
  return preloadImages;
}

async function generateLoopImages(radarLoopID) {
  // loop images
  const fiveMinutesInMS = 1000 * 60 * 5;

  // most recent time/image
  const mostRecent = new Date(Math.floor(new Date().getTime() / fiveMinutesInMS) * fiveMinutesInMS);
  let timestamp = mostRecent.getTime();

  let loopImages = [];
  for (let i = 0; i < loopImageCount; i++) {
    const thisRadarTime = getRadarTimeString(new Date(timestamp));
    const thisReadTime = new Date(timestamp).toLocaleTimeString();
    const imageUrl = `http://www.bom.gov.au/radar/${radarLoopID}.T.${thisRadarTime}.png`;
    loopImages.push([imageUrl, thisReadTime]);

    timestamp = timestamp - fiveMinutesInMS; // look another 5 minutes back
  }

  let outImages = [];
  let loopTexts = [];
  for (const imageIdent in loopImages) {
    const imageSourceUrl = loopImages[imageIdent][0];
    const imageSourceText = loopImages[imageIdent][1];

    console.log(loopImages, imageIdent);

    try {
      const imageElement = await preloadImage(imageSourceUrl);
      outImages.push(imageElement);
      loopTexts.push(imageSourceText);
    } catch (error) {
      console.log("preloadImage error", error);
    }
  }

  outImages = outImages.reverse();
  loopTexts = loopTexts.reverse();

  return { loopTexts, loopImages: outImages };
}

function preloadImage(imageSource) {
  return new Promise((resolve, reject) => {
    console.log("preloadImage", imageSource);
    let img = new Image();
    img.src = imageSource;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = reject;
  });
}

window.addEventListener("load", main);
