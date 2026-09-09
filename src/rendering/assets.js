const atlas = new Image();

let atlasReady = false;

atlas.onload = () => {
  atlasReady = true;
};

atlas.src = "assets/atlas.png";

const actorAtlas = new Image();

let actorAtlasReady = false;

actorAtlas.onload = () => {
  actorAtlasReady = true;
};

actorAtlas.src = "assets/actors.png";

const landmarkAtlas = new Image();

let landmarkAtlasReady = false;

landmarkAtlas.onload = () => {
  landmarkAtlasReady = true;
};

landmarkAtlas.src = "assets/landmarks.png";

const extraAtlas = new Image();

extraAtlas.src = "assets/extras.png";

const battleBackdrop = new Image();

battleBackdrop.src = "assets/battle_backdrop.png";

const propsAtlas = new Image();

propsAtlas.src = "assets/props.png";

const gameImages = [
  atlas,
  actorAtlas,
  landmarkAtlas,
  extraAtlas,
  propsAtlas,
  battleBackdrop,
];

let assetError = false;

gameImages.forEach((im) => {
  im.onerror = () => {
    assetError = true;
  };
});
