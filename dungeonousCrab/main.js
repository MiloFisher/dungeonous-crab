title = " Dungeon-ous Crab";

description = `
Time for Crab
`;

characters = [//a
`
  r
  rr
 r
 r
  r rr
   rrr
`,//b
`
   r
  rr
    r
    r
rr r
rrr
`,//c
`
 rrrrr
r  rrr
  r rr
 r  r
   r
`,//d
`
rrrrr
rrr  r
rr r
 r  r
  r
`,//e
`

  r
  rr
 r
  r rr
r  rrr
`,//f
`

   r
  rr
    r
rr r
rrr  r
`,//g
`
 rrrrr
   rrr
 rr rr
    r
  rr
`,//h
`
rrrrr
rrr  
rr rr
 r
  rr
`,//i
`
l l l
 l l
`,//j
`
 l l
l l l
`,//k
`
l
ll
 ll
  ll
   LL
    LL
`,//l
`
b bb b
bbbbbb
bbbbbb
bbbbbb
 bbbb
 bbbb
`,//m
`


    ll
   lrl
 YYYll
 YYYll
`,//n
`


l
ll
ll
ll
`,//o
`
    ll
    ll
    ll
     l
     l
     l
`,//p
`
ll
llllll
lLllll
lLllll
llLlll
llLllL
`,//q
`


ll
llll
Llll
lllll
`,//r
`
lllLLl
 lllll
   Y
   Y
  YYY
`,//s
`
lllll
`,//t
`


ll
lrl
llYYY
llYYY
`,//u
`


     l
    ll
    ll
    ll
`,//v
`
ll
ll
ll
l
l
l
`,//w
`
    ll
llllll
llllLl
llllLl
lllLll
LllLll
`,//x
`


    ll
  llll
  lllL
 lllll
`,//y
`
lLLlll
lllll
  Y
  Y
 YYY
`,//z
`
 lllll
`
];

const G = {
  WIDTH: 300,
  HEIGHT: 200,
  TILE_SIZE: 200,
  MAP_SIZE: 1200, // must be evenly divisible by TILE_SIZE
  PLAYER_SPAWN_X: 150,
  PLAYER_SPAWN_Y: 100,
  PLAYER_SPEED: 2,
  PLAYER_HITBOX: 10,
  RENDER_DISTANCE: 300,
  ENEMY_RENDER_DISTANCE: 400,
  ENEMY_AGGRO_DISTANCE: 100,
  ENEMY_SPEED: 1.2,
  ENEMY_HITBOX: 16,
  MINIMAP_ENABLED: true,
  MINIMAP_X: 250,
  MINIMAP_Y: 20,
};

// Configure game options.
// options = {
//   viewSize?: { x: number; y: number }; // Set the screen size.
//   theme?: "simple" | "pixel" | "shape" | "shapeDark" | "crt" | "dark";
//    // Select the appearance theme.
//   isPlayingBgm?: boolean; // Play BGM.
//   isReplayEnabled?: boolean; // Enable replay.
//   seed?: number; // Set the random number seed used to generate sounds.
//
//   isCapturing?: boolean; // Capture a screen by pressing 'c' key.
//   isCapturingGameCanvasOnly?: boolean;
//    // Additional setting for isCapturing,
//    // will omit the margins on two sides when enabled.
//    // Not recommended for pixiJS themes due to complications with scale factor
//   captureCanvasScale?: number;
//    // Additional setting for isCapturingGameCanvasOnly,
//    // set the scale of the output file, default: 1.
//    // High scale (higher than 4) might lead to poor performance or crashing.
//    // Will suffer poor performance and not be retained and when used on pixiJS
//    // themes due to heavy post-processing and resizing. Value below 1 is
//    // recommended in such cases (e.g. 0.4).
//   isDrawingParticleFront?: boolean; // Draw particles in front of the screen.
//   isDrawingScoreFront?: boolean; // Draw the added score in front of the screen.
//   isShowingScore?: boolean; // Show a score and a hi-score.
//   isMinifying?: boolean; // Show a minified code to the console.
// };
options = {
  theme: "dark",
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  isPlayingBgm: true,
  seed: 17, // 7 taps, 17 cartoony cool, 22 bop w/ gravel
  isDrawingParticleFront: true,
  isDrawingScoreFront: true,
};

let player;
let playerMoveCount;
let playerMoveDistance;
let worldOffset;
let sand;
let map;
let water;
let waveFrame;
let spawnPoints;
let spawn;
let spawnedIn;
let items;
let particles;
let itemBaseSize;
let enemies;

function start() {
  // Instantiate player
  player = {
    pos: vec(G.PLAYER_SPAWN_X, G.PLAYER_SPAWN_Y),
    targetPos: vec(G.PLAYER_SPAWN_X, G.PLAYER_SPAWN_Y),
    currAnimFrame: 0,
    lastAnimFrame: 1,
    knifeEquipped: false,
    bucketEquipped: false,
    invincible: 0,
  };
  // World offset
  worldOffset = vec(0,0);
  // Enemies
  enemies = [];
  // Items
  items = [];
  // Item base size
  itemBaseSize = 12;
  // Particles
  particles = [];
  // Generate sand speck positions
  sand = [];
  for(var i = 0; i < G.MAP_SIZE; i++) {
    sand.push(vec(rnd(-G.MAP_SIZE * .5, G.MAP_SIZE * .5), rnd(-G.MAP_SIZE * .5,G.MAP_SIZE * .5)));
  }
  // Generate map
  do{
    generateMap();
  } while(mapCheck());
  // Generate water position array
  waterPositions();
  // Set wave frame
  waveFrame = 0;
  // Spawned in
  spawnedIn = false;
}

function update() {
  if (!ticks) { start(); }
  if (ticks % 4 == 0) { animationUpdate(); }
  
  // Draw order vvv
  collisionUpdate();
  backgroundUpdate();
  particleUpdate();
  enemyUpdate();
  playerUpdate();

  if(!spawnedIn) {
    color("light_black");
    box(player.pos, 300);
    worldOffset.x = G.PLAYER_SPAWN_X + G.MAP_SIZE * .5 - spawn.y * G.TILE_SIZE - G.TILE_SIZE * .5;
    worldOffset.y = G.PLAYER_SPAWN_Y + G.MAP_SIZE * .5 - spawn.x * G.TILE_SIZE - G.TILE_SIZE * .5;
    spawnedIn = true;
  }
}

function playerUpdate() {
  // Player movement
  if(input.isPressed && spawnedIn) {
    player.targetPos = vec(input.pos);
    playerMoveDistance = distance(player.pos, player.targetPos);
    playerMoveCount = playerMoveDistance;
  }
  if (playerMoveCount > 0) {
    worldOffset.x -= (player.targetPos.x - player.pos.x) / playerMoveDistance * G.PLAYER_SPEED;
    worldOffset.y -= (player.targetPos.y - player.pos.y) / playerMoveDistance * G.PLAYER_SPEED;
    playerMoveCount -= (1 + 1 / playerMoveDistance) * G.PLAYER_SPEED;
  }
  // Draw player
  color("black");
  switch(player.currAnimFrame) {
    case 0: 
      char("a", player.pos.x - 3, player.pos.y - 2);
      char("b", player.pos.x + 2, player.pos.y - 2);
      char("c", player.pos.x - 3, player.pos.y + 3);
      char("d", player.pos.x + 3, player.pos.y + 3);
      if(player.knifeEquipped) {
        char("k", player.pos.x + 2, player.pos.y - 6);
      }
      if (player.bucketEquipped) {
        char("l", player.pos.x, player.pos.y + 5);
      }
      break;
    case 1:
      char("e", player.pos.x - 3, player.pos.y - 2);
      char("f", player.pos.x + 3, player.pos.y - 2);
      char("g", player.pos.x - 3, player.pos.y + 3);
      char("h", player.pos.x + 2, player.pos.y + 3);
      if (player.knifeEquipped) {
        char("k", player.pos.x + 2, player.pos.y - 5);
      }
      if (player.bucketEquipped) {
        char("l", player.pos.x, player.pos.y + 5);
      }
      break;
  }
  // Draw minimap
  if(G.MINIMAP_ENABLED) {
    drawMinimap();
  }
  // Effects
  if(player.invincible > 0) {
    player.invincible--;
  }
}

function enemyUpdate() {
  for(var i = 0; i < enemies.length; i++) {
    if (distance1(player.pos.x, player.pos.y, enemies[i].pos.x + worldOffset.x, enemies[i].pos.y + worldOffset.y) < G.ENEMY_RENDER_DISTANCE) {
      // Enemy Movement
      var distToPlayer = distance1(player.pos.x, player.pos.y, enemies[i].pos.x + worldOffset.x, enemies[i].pos.y + worldOffset.y);
      if (distToPlayer < G.ENEMY_AGGRO_DISTANCE && distance1(enemies[i].homePos.x + worldOffset.x, enemies[i].homePos.y + worldOffset.y, player.pos.x, player.pos.y) < G.ENEMY_AGGRO_DISTANCE && player.invincible == 0 && spawnedIn) {
        if(distToPlayer > 2) {
          var moveDistance = distance1(player.pos.x, player.pos.y, enemies[i].pos.x + worldOffset.x, enemies[i].pos.y + worldOffset.y);
          enemies[i].pos.x += (player.pos.x - (enemies[i].pos.x + worldOffset.x)) / moveDistance * G.ENEMY_SPEED;
          enemies[i].pos.y += (player.pos.y - (enemies[i].pos.y + worldOffset.y)) / moveDistance * G.ENEMY_SPEED;
          if (ticks % 12 == 0) {
            play("hit");
          }
          if (ticks % 45 == 0) {
            play("laser");
          }
        }
        enemies[i].pos.x + worldOffset.x > player.pos.x ? enemies[i].direction = 0 : enemies[i].direction = 1;
      } else if (distance1(enemies[i].homePos.x + worldOffset.x, enemies[i].homePos.y + worldOffset.y, enemies[i].pos.x + worldOffset.x, enemies[i].pos.y + worldOffset.y) > 2) {
        var moveDistance = distance1(enemies[i].homePos.x + worldOffset.x, enemies[i].homePos.y + worldOffset.y, enemies[i].pos.x + worldOffset.x, enemies[i].pos.y + worldOffset.y);
        enemies[i].pos.x += ((enemies[i].homePos.x + worldOffset.x) - (enemies[i].pos.x + worldOffset.x)) / moveDistance * G.ENEMY_SPEED;
        enemies[i].pos.y += ((enemies[i].homePos.y + worldOffset.y) - (enemies[i].pos.y + worldOffset.y)) / moveDistance * G.ENEMY_SPEED;
        enemies[i].pos.x + worldOffset.x > enemies[i].homePos.x + worldOffset.x ? enemies[i].direction = 0 : enemies[i].direction = 1;
        if (ticks % 12 == 0) {
          play("hit");
        }
      }
      // Draw Enemy
      var x = enemies[i].pos.x + worldOffset.x;
      var y = enemies[i].pos.y + worldOffset.y;
    
      color("black");
      if(enemies[i].direction == 0) {
        char("m", x - 6, y - 6);
        char("n", x - 2, y - 6);
        char("o", x - 6, y);
        char("p", x, y);
        char("q", x + 5, y);
        char("r", x, y + 5);
        char("s", x + 5, y + 3);
      } else {
        char("t", x + 4, y - 6);
        char("u", x + 0, y - 6);
        char("v", x + 4, y);
        char("w", x, y);
        char("x", x - 6, y);
        char("y", x, y + 5);
        char("z", x - 6, y + 3);
      }
      color("transparent");
      if(box(x,y,G.ENEMY_HITBOX).isColliding.rect.light_blue && player.invincible == 0) {
        if(hitPlayer()){
          enemies.splice(i, 1);
          i--;
        }
      }
    }
  }
}

function hitPlayer() {
  if(player.knifeEquipped) {
    player.knifeEquipped = false;
    particles.push(new p(player.pos.x, player.pos.y, 5, 1, -PI / 2, PI * 2, "light_red", 10));
    particles.push(new p(player.pos.x, player.pos.y, 1, .5, -PI / 2, PI * 2, "red", 10));
    addScore(50, player.pos);
    play("jump");
    return true;
  } else if(player.bucketEquipped) {
    player.bucketEquipped = false;
    player.invincible = 30;
    particles.push(new p(player.pos.x, player.pos.y, 4, .8, -PI / 2, PI * 2, "blue", 30));
    play("explosion");
    return false;
  } else {
    gameOver();
    return false;
  }
}

function nextLevel() {
  play("hit");
  play("lucky");
  play("select");
  start();
}

function gameOver() {
  play("hit");
  play("explosion");
  play("lucky");
  play("select");
  end();
}

function collisionUpdate() {
  // Player collisions
  drawWater();
  color("transparent");
  // Water collision
  if (box(player.pos, G.PLAYER_HITBOX).isColliding.rect.cyan) {
    worldOffset.x += (player.targetPos.x - player.pos.x) / playerMoveDistance * G.PLAYER_SPEED;
    worldOffset.y += (player.targetPos.y - player.pos.y) / playerMoveDistance * G.PLAYER_SPEED;
    playerMoveCount = 0;
  }
}

function backgroundUpdate() {
  // Player hitbox for items
  color("light_blue");
  box(player.pos, G.PLAYER_HITBOX);
  // Draw water edges of map
  color("cyan");
  box(worldOffset.x - G.MAP_SIZE, worldOffset.y - G.MAP_SIZE, G.MAP_SIZE);
  box(worldOffset.x, worldOffset.y - G.MAP_SIZE, G.MAP_SIZE);
  box(worldOffset.x + G.MAP_SIZE, worldOffset.y - G.MAP_SIZE, G.MAP_SIZE);
  box(worldOffset.x - G.MAP_SIZE, worldOffset.y + G.MAP_SIZE, G.MAP_SIZE);
  box(worldOffset.x, worldOffset.y + G.MAP_SIZE, G.MAP_SIZE);
  box(worldOffset.x + G.MAP_SIZE, worldOffset.y + G.MAP_SIZE, G.MAP_SIZE);
  box(worldOffset.x - G.MAP_SIZE, worldOffset.y, G.MAP_SIZE);
  box(worldOffset.x + G.MAP_SIZE, worldOffset.y, G.MAP_SIZE);
  // Draw beach base
  color("yellow");
  box(worldOffset.x, worldOffset.y, G.MAP_SIZE);
  // Draw sand specks
  color("light_black");
  for (var i = 0; i < sand.length; i++) {
    if (distance1(player.pos.x, player.pos.y, sand[i].x + worldOffset.x, sand[i].y + worldOffset.y) < G.RENDER_DISTANCE) {
      box(sand[i].x + worldOffset.x, sand[i].y + worldOffset.y, 1)
    }
  }
  // Draw water
  drawWater();
  // Draw waves
  color("black");
  for (var i = 0; i < water.length; i++) {
    if (distance1(player.pos.x, player.pos.y, water[i].pos.x + worldOffset.x, water[i].pos.y + worldOffset.y) < G.RENDER_DISTANCE) {
      if (waveFrame < 5) {
        char("i", water[i].pos.x + water[i].pos1.x + worldOffset.x, water[i].pos.y + water[i].pos1.y + worldOffset.y);

        char("j", water[i].pos.x + water[i].pos2.x + worldOffset.x, water[i].pos.y + water[i].pos2.y + worldOffset.y);

        char("i", water[i].pos.x + water[i].pos3.x + worldOffset.x, water[i].pos.y + water[i].pos3.y + worldOffset.y);
      } else {
        char("j", water[i].pos.x + water[i].pos1.x + worldOffset.x, water[i].pos.y + water[i].pos1.y + worldOffset.y);

        char("i", water[i].pos.x + water[i].pos2.x + worldOffset.x, water[i].pos.y + water[i].pos2.y + worldOffset.y);

        char("j", water[i].pos.x + water[i].pos3.x + worldOffset.x, water[i].pos.y + water[i].pos3.y + worldOffset.y);
      }
    }
  }
  // Draw items
  drawItems();
}

function particleUpdate() {
  for(var i = 0; i < particles.length; i++) {
    color(particles[i].color);
    particle(
      particles[i].x,
      particles[i].y,
      particles[i].amount,
      particles[i].speed,
      particles[i].angle,
      particles[i].width
    );
    particles[i].duration--;
    if(particles[i].duration <= 0) {
      particles.splice(i,1);
      i--;
    }
  }
}

function drawItems() {
  for(var i = 0; i < items.length; i++) {
    if (distance1(player.pos.x, player.pos.y, items[i].pos.x + worldOffset.x, items[i].pos.y + worldOffset.y) < G.RENDER_DISTANCE) {
      switch(items[i].type) {
        case "knife":
          var equipped = false; 
          color("light_purple");
          if (box(items[i].pos.x + worldOffset.x, items[i].pos.y + worldOffset.y, itemBaseSize).isColliding.rect.light_blue){
            if(!player.knifeEquipped) {
              player.knifeEquipped = true;
              equipped = true;
              particles.push(new p(player.pos.x, player.pos.y, 3, 1, -PI/2, PI*2, "purple", 10));
              particles.push(new p(player.pos.x, player.pos.y, 1, .5, -PI / 2, PI * 2, "light_purple", 10));
              play("coin");
            }
          }
          color("purple");
          box(items[i].pos.x + worldOffset.x, items[i].pos.y + worldOffset.y, itemBaseSize - 2);
          color("black");
          char("k", items[i].pos.x + worldOffset.x, items[i].pos.y + worldOffset.y);
          if(equipped) {
            items.splice(i, 1);
            i--;
          }
          break;
        case "bucket":
          var equipped = false;
          color("light_green");
          if (box(items[i].pos.x + worldOffset.x, items[i].pos.y + worldOffset.y, itemBaseSize).isColliding.rect.light_blue) {
            if (!player.bucketEquipped) {
              player.bucketEquipped = true;
              equipped = true;
              particles.push(new p(player.pos.x, player.pos.y, 3, 1, -PI / 2, PI * 2, "green", 10));
              particles.push(new p(player.pos.x, player.pos.y, 1, .5, -PI / 2, PI * 2, "light_green", 10));
              play("powerUp");
            }
          }
          color("green");
          box(items[i].pos.x + worldOffset.x, items[i].pos.y + worldOffset.y, itemBaseSize - 2);
          color("black");
          char("l", items[i].pos.x + worldOffset.x, items[i].pos.y + worldOffset.y);
          if (equipped) {
            items.splice(i, 1);
            i--;
          }
          break;
        case "towel":
          var color1, color2, color3;
          switch(items[i].version) {
            case 0:
              color1 = "light_black";
              color2 = "light_green";
              color3 = "light_red";
              break;
            case 1:
              color1 = "light_cyan";
              color2 = "green";
              color3 = "purple";
              break;
            case 2:
              color1 = "light_red";
              color2 = "light_black";
              color3 = "blue";
              break;
          }
          // @ts-ignore
          color(color1);
          box(items[i].pos.x + worldOffset.x - 10, items[i].pos.y + worldOffset.y, 20);
          box(items[i].pos.x + worldOffset.x + 10, items[i].pos.y + worldOffset.y, 20);
          // @ts-ignore
          color(color2);
          for(var j = -19; j < 20; j += 2) {
            box(items[i].pos.x + worldOffset.x - j, items[i].pos.y + worldOffset.y - 6, 2);
          }
          // @ts-ignore
          color(color3);
          for (var j = -19; j < 20; j += 2) {
            box(items[i].pos.x + worldOffset.x - j, items[i].pos.y + worldOffset.y - 3, 2);
          }
          // @ts-ignore
          color(color2);
          for (var j = -19; j < 20; j += 2) {
            box(items[i].pos.x + worldOffset.x - j, items[i].pos.y + worldOffset.y + 3, 2);
          }
          // @ts-ignore
          color(color3);
          for (var j = -19; j < 20; j += 2) {
            box(items[i].pos.x + worldOffset.x - j, items[i].pos.y + worldOffset.y + 6, 2);
          }
          break;
        case "sand castle":
          var x = items[i].pos.x + worldOffset.x;
          var y = items[i].pos.y + worldOffset.y;
          color("light_yellow");
          box(x, y - 12, 20);
          box(x, y, 16);
          box(x - 10, y, 16);
          box(x + 10, y, 16);
          box(x - 10, y - 2, 16);
          box(x + 10, y - 2, 16);
          color("yellow");
          box(x, y - 10, 18);
          box(x, y, 14);
          box(x - 10, y, 14);
          box(x + 10, y, 14);
          box(x - 16, y - 8, 2);
          box(x - 12, y - 8, 2);
          box(x + 16, y - 8, 2);
          box(x + 12, y - 8, 2);
          box(x - 8, y - 20, 2);
          box(x - 4, y - 20, 2);
          box(x, y - 20, 2);
          box(x + 4, y - 20, 2);
          box(x + 8, y - 20, 2);
          color("light_yellow");
          box(x, y + 3, 6);
          box(x, y - 2, 6);
          box(x, y - 4, 4);
          box(x - 4, y - 14, 2);
          box(x - 4, y - 12, 2);
          box(x + 4, y - 14, 2);
          box(x + 4, y - 12, 2);
          box(x - 11, y - 2, 2);
          box(x - 11, y, 2);
          box(x + 11, y - 2, 2);
          box(x + 11, y, 2);
          color("light_black");
          for(var j = 0; j < 8; j++) {
            box(x, y - 22 - 2 * j, 2);
          }
          color("red");
          for (var j = 0; j < 5; j++) {
            box(x + 2, y - 28 - 2 * j, 2);
          }
          for (var j = 0; j < 3; j++) {
            box(x + 4, y - 30 - 2 * j, 2);
          }
          for (var j = 0; j < 1; j++) {
            box(x + 6, y - 32 - 2 * j, 2);
          }
          color("transparent");
          if(box(x, y, 16).isColliding.rect.light_blue) {
            nextLevel();
          }
          break;
      }
    }
  }
}

function drawWater() {
  for(var r = 0; r < map.length; r++) {
    for(var c = 0; c < map[0].length; c++) {
      var x = worldOffset.x - (G.MAP_SIZE * .5) + (G.TILE_SIZE * c) + (G.TILE_SIZE * .5);
      var y = worldOffset.y - (G.MAP_SIZE * .5) + (G.TILE_SIZE * r) + (G.TILE_SIZE * .5);
      switch(map[r][c].id){
        case 0:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          break;
        case 1:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x - 40, y + 80, 40);
          box(x, y + 80, 40);
          box(x + 40, y + 80, 40);
          break;
        case 2:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x - 80, y + 40, 40);
          box(x - 80, y, 40);
          box(x - 80, y - 40, 40);
          break;
        case 3:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x - 40, y - 80, 40);
          box(x, y - 80, 40);
          box(x + 40, y - 80, 40);
          break;
        case 4:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x + 80, y + 40, 40);
          box(x + 80, y, 40);
          box(x + 80, y - 40, 40);
          break;
        case 5:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x + 80, y + 40, 40);
          box(x + 80, y, 40);
          box(x + 80, y - 40, 40);
          box(x - 80, y + 40, 40);
          box(x - 80, y, 40);
          box(x - 80, y - 40, 40);
          break;
        case 6:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x - 40, y - 80, 40);
          box(x, y - 80, 40);
          box(x + 40, y - 80, 40);
          box(x - 40, y + 80, 40);
          box(x, y + 80, 40);
          box(x + 40, y + 80, 40);
          break;
        case 7:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x + 80, y + 40, 40);
          box(x + 80, y, 40);
          box(x + 80, y - 40, 40);
          box(x - 80, y + 40, 40);
          box(x - 80, y, 40);
          box(x - 80, y - 40, 40);
          box(x - 40, y + 80, 40);
          box(x, y + 80, 40);
          box(x + 40, y + 80, 40);
          break;
        case 8:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x + 40, y - 80, 40);
          box(x, y - 80, 40);
          box(x - 40, y - 80, 40);
          box(x - 80, y + 40, 40);
          box(x - 80, y, 40);
          box(x - 80, y - 40, 40);
          box(x - 40, y + 80, 40);
          box(x, y + 80, 40);
          box(x + 40, y + 80, 40);
          break;
        case 9:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x + 80, y + 40, 40);
          box(x + 80, y, 40);
          box(x + 80, y - 40, 40);
          box(x - 80, y + 40, 40);
          box(x - 80, y, 40);
          box(x - 80, y - 40, 40);
          box(x - 40, y - 80, 40);
          box(x, y - 80, 40);
          box(x + 40, y - 80, 40);
          break;
        case 10:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x + 40, y - 80, 40);
          box(x, y - 80, 40);
          box(x - 40, y - 80, 40);
          box(x + 80, y + 40, 40);
          box(x + 80, y, 40);
          box(x + 80, y - 40, 40);
          box(x - 40, y + 80, 40);
          box(x, y + 80, 40);
          box(x + 40, y + 80, 40);
          break;
        case 11:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x - 40, y + 80, 40);
          box(x, y + 80, 40);
          box(x + 40, y + 80, 40);
          box(x - 80, y + 40, 40);
          box(x - 80, y, 40);
          box(x - 80, y - 40, 40);
          break;
        case 12:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x - 40, y - 80, 40);
          box(x, y - 80, 40);
          box(x + 40, y - 80, 40);
          box(x - 80, y + 40, 40);
          box(x - 80, y, 40);
          box(x - 80, y - 40, 40);
          break;
        case 13:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x - 40, y - 80, 40);
          box(x, y - 80, 40);
          box(x + 40, y - 80, 40);
          box(x + 80, y + 40, 40);
          box(x + 80, y, 40);
          box(x + 80, y - 40, 40);
          break;
        case 14:
          color("cyan");
          box(x - 80, y - 80, 40);
          box(x - 80, y + 80, 40);
          box(x + 80, y - 80, 40);
          box(x + 80, y + 80, 40);
          box(x - 40, y + 80, 40);
          box(x, y + 80, 40);
          box(x + 40, y + 80, 40);
          box(x + 80, y + 40, 40);
          box(x + 80, y, 40);
          box(x + 80, y - 40, 40);
          break;
        case 15:
          color("cyan");
          box(x, y, G.TILE_SIZE);
          break;
      }
    }
  }
}

function drawMinimap() {
  for (var r = 0; r < map.length; r++) {
    for (var c = 0; c < map[0].length; c++) {
      var x = G.MINIMAP_X + c * 5;
      var y = G.MINIMAP_Y + r * 5;
      switch (map[r][c].id) {
        case 0:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);
          break;
        case 1:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 1, y + 4, 1);
          box(x + 2, y + 4, 1);
          box(x + 3, y + 4, 1);
          break;
        case 2:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x, y + 1, 1);
          box(x, y + 2, 1);
          box(x, y + 3, 1);
          break;
        case 3:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 1, y, 1);
          box(x + 2, y, 1);
          box(x + 3, y, 1);
          break;
        case 4:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 4, y + 1, 1);
          box(x + 4, y + 2, 1);
          box(x + 4, y + 3, 1);
          break;
        case 5:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 4, y + 1, 1);
          box(x + 4, y + 2, 1);
          box(x + 4, y + 3, 1);
          box(x, y + 1, 1);
          box(x, y + 2, 1);
          box(x, y + 3, 1);
          break;
        case 6:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 1, y, 1);
          box(x + 2, y, 1);
          box(x + 3, y, 1);
          box(x + 1, y + 4, 1);
          box(x + 2, y + 4, 1);
          box(x + 3, y + 4, 1);
          break;
        case 7:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 4, y + 1, 1);
          box(x + 4, y + 2, 1);
          box(x + 4, y + 3, 1);
          box(x, y + 1, 1);
          box(x, y + 2, 1);
          box(x, y + 3, 1);
          box(x + 1, y + 4, 1);
          box(x + 2, y + 4, 1);
          box(x + 3, y + 4, 1);
          break;
        case 8:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 1, y, 1);
          box(x + 2, y, 1);
          box(x + 3, y, 1);
          box(x + 1, y + 4, 1);
          box(x + 2, y + 4, 1);
          box(x + 3, y + 4, 1);
          box(x, y + 1, 1);
          box(x, y + 2, 1);
          box(x, y + 3, 1);
          break;
        case 9:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 4, y + 1, 1);
          box(x + 4, y + 2, 1);
          box(x + 4, y + 3, 1);
          box(x, y + 1, 1);
          box(x, y + 2, 1);
          box(x, y + 3, 1);
          box(x + 1, y, 1);
          box(x + 2, y, 1);
          box(x + 3, y, 1);
          break;
        case 10:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 1, y, 1);
          box(x + 2, y, 1);
          box(x + 3, y, 1);
          box(x + 1, y + 4, 1);
          box(x + 2, y + 4, 1);
          box(x + 3, y + 4, 1);
          box(x + 4, y + 1, 1);
          box(x + 4, y + 2, 1);
          box(x + 4, y + 3, 1);
          break;
        case 11:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x, y + 1, 1);
          box(x, y + 2, 1);
          box(x, y + 3, 1);
          box(x + 1, y + 4, 1);
          box(x + 2, y + 4, 1);
          box(x + 3, y + 4, 1);
          break;
        case 12:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 1, y, 1);
          box(x + 2, y, 1);
          box(x + 3, y, 1);
          box(x, y + 1, 1);
          box(x, y + 2, 1);
          box(x, y + 3, 1);
          break;
        case 13:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 4, y + 1, 1);
          box(x + 4, y + 2, 1);
          box(x + 4, y + 3, 1);
          box(x + 1, y, 1);
          box(x + 2, y, 1);
          box(x + 3, y, 1);
          break;
        case 14:
          color("light_yellow");
          box(x + 2, y + 2, 5);
          color("light_cyan");
          box(x, y, 1);
          box(x + 4, y, 1);
          box(x, y + 4, 1);
          box(x + 4, y + 4, 1);

          box(x + 1, y + 4, 1);
          box(x + 2, y + 4, 1);
          box(x + 3, y + 4, 1);
          box(x + 4, y + 1, 1);
          box(x + 4, y + 2, 1);
          box(x + 4, y + 3, 1);
          break;
        case 15:
          // color("light_cyan");
          // box(x + 2, y + 2, 5);
          break;
      }
    }
  }
  color("light_red");
  box(G.MINIMAP_X + (G.MAP_SIZE / 40)/2 + (player.pos.x / 40) - (worldOffset.x / 40) - .5, G.MINIMAP_Y + (G.MAP_SIZE / 40)/2 + (player.pos.y / 40) - (worldOffset.y / 40) - .5, 1);
}

function animationUpdate() {
  // Player animations
  if(playerMoveCount > 0) {
    player.currAnimFrame++;
    if (player.currAnimFrame > player.lastAnimFrame) {
      player.currAnimFrame = 0;
    }
    play("hit");
  } else {
    player.currAnimFrame = 0;
  }
  // Wave animations
  if(waveFrame == 9) {
    waveFrame = 0;
    for(var i = 0; i < water.length; i++) {
      water[i].pos1 = vec(rnd(-17, 17), rnd(-17, 17));
      water[i].pos2 = vec(rnd(-17, 17), rnd(-17, 17));
      water[i].pos3 = vec(rnd(-17, 17), rnd(-17, 17));
    }
  } else {
    waveFrame++;
  }
  // Item animations
  if(ticks % 22 == 0) {
    if(itemBaseSize == 12) {
      itemBaseSize = 10;
    } else {
      itemBaseSize = 12;
    }
  }
}

function distance(v, v1) {
  return Math.sqrt(Math.pow(v1.x - v.x, 2) + Math.pow(v1.y - v.y, 2));
}

function distance1(x, y, x1, y1) {
  return Math.sqrt(Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2));
}

function mapCheck(){
  // Check if there are any spawn points
  if(spawnPoints.length == 0) {
    return true;
  }

  // Choose random spawn point
  spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

  // Branch out from spawn
  var visited = [];
  checkTile(spawn.x, spawn.y, visited);

  // If max branch length < 15, re-generate map
  if(visited.length < 15){
    return true;
  }

  // Replace unreachable tiles with t15 (empty tile)
  for(var r = 0; r < map.length; r++) {
    for(var c = 0; c < map[0].length; c++) {
      var hasVisited = false;
      for(var i = 0; i < visited.length; i++) {
        if(r == visited[i].x && c == visited[i].y) {
          hasVisited = true;
          break;
        }
      }
      if(!hasVisited) {
        map[r][c] = new t15;
      }
    }
  }

  // Spawn items
  spawnItems(visited);
  return false;
}

function checkTile(row, col, visited) {
  var tile = map[row][col];
  visited.push(vec(row, col));

  if(tile.north) {
    var alreadyVisited = false;
    visited.forEach(e => {
      if(e.x == row - 1 && e.y == col) {
        alreadyVisited = true;
      }
    });
    if(!alreadyVisited) {
      checkTile(row - 1, col, visited);
    }
  }
  if (tile.east) {
    var alreadyVisited = false;
    visited.forEach(e => {
      if (e.x == row && e.y == col + 1) {
        alreadyVisited = true;
      }
    });
    if (!alreadyVisited) {
      checkTile(row, col + 1, visited);
    }
  }
  if (tile.south) {
    var alreadyVisited = false;
    visited.forEach(e => {
      if (e.x == row + 1 && e.y == col) {
        alreadyVisited = true;
      }
    });
    if (!alreadyVisited) {
      checkTile(row + 1, col, visited);
    }
  }
  if (tile.west) {
    var alreadyVisited = false;
    visited.forEach(e => {
      if (e.x == row && e.y == col - 1) {
        alreadyVisited = true;
      }
    });
    if (!alreadyVisited) {
      checkTile(row, col - 1, visited);
    }
  }

  return visited;
}

function spawnItems(tiles) {
  var spawnId = 0;
  for(var i = 0; i < tiles.length; i++) {
    var x = -(G.MAP_SIZE * .5) + (G.TILE_SIZE * tiles[i].y) + (G.TILE_SIZE * .5);
    var y = -(G.MAP_SIZE * .5) + (G.TILE_SIZE * tiles[i].x) + (G.TILE_SIZE * .5);
    if (tiles[i].x == spawn.x && tiles[i].y == spawn.y) {
      spawnId = i;
      continue;
    }
    var totalItems = 4;
    switch(Math.floor(Math.random() * totalItems)) {
      case 0:
        items.push(new item("knife", x, y, 0));
        break;
      case 1:
        items.push(new item("bucket", x, y, 0));
        break;
      case 2:
        items.push(new item("towel", x, y, Math.floor(Math.random() * 3)));
        break;
      case 3:
        items.push(new item("towel", x, y, Math.floor(Math.random() * 3)));
        break;
    }
  }

  // Set sandcastle to random item farther than 600 (lowers if fails 100 times)
  var selection = 0;
  var targetDistance = 600;
  var attempts = 0;
  do {
    selection = Math.floor(Math.random() * items.length);
    attempts++;
    if(attempts >= 100) {
      attempts = 0;
      targetDistance -= 50;
    }
  } while (distance1(items[selection].pos.x + worldOffset.x, items[selection].pos.y + worldOffset.y, player.pos.x, player.pos.y) < targetDistance && targetDistance >= 0);

  // Add sand castle
  items[selection] = new item("sand castle", items[selection].pos.x, items[selection].pos.y, 0);
  //items[selection] = new item("sand castle", -(G.MAP_SIZE * .5) + (G.TILE_SIZE * tiles[spawnId].y) + (G.TILE_SIZE * .5), -(G.MAP_SIZE * .5) + (G.TILE_SIZE * tiles[spawnId].x) + (G.TILE_SIZE * .5), 0);

  // Add enemies on each towel
  for (var i = 0; i < items.length; i++) {
    if(items[i].type == "towel") {
      enemies.push(new enemy(items[i].pos.x, items[i].pos.y));
    }
  }
}

function generateMap() {
  // Create 2D array spanning map
  map = [];
  spawnPoints = [];
  var len = G.MAP_SIZE/G.TILE_SIZE;
  for(var i = 0; i < len; i++) {
    map.push([]);
  }
  // Generate tiles
  for(var r = 0; r < len; r++) {
    for(var c = 0; c < len; c++) {
      var tile = selectTile(r, c, len, map);
      map[r].push(tile);
      if(tile.id == 0) {
        spawnPoints.push(vec(r,c));
      }
    }
  }
}

function selectTile(row, col, len, map) {
  var allowNorth = true;
  var allowEast = true;
  var allowSouth = true;
  var allowWest = true;

  // Establish available connections
  if(row == 0) {
    allowNorth = false;
  } else {
    allowNorth = map[row - 1][col].south;
  }
  if (row == len - 1) {
    allowSouth = false;
  }
  if (col == 0) {
    allowWest = false;
  } else {
    allowWest = map[row][col - 1].east;
  }
  if (col == len - 1) {
    allowEast = false;
  }

  // Weed out invalid tiles
  var tiles = [new t0(), new t1(), new t2(), new t3(), new t4(), new t5(), new t6(), new t7(), new t8(), new t9(), new t10(), new t11(), new t12(), new t13(), new t14(), new t15()];
  for(var i = 0; i < tiles.length; i++) {
    if (tiles[i].north != allowNorth || tiles[i].west != allowWest || (!allowSouth && (tiles[i].south != allowSouth)) || (!allowEast && (tiles[i].east != allowEast))) {
      tiles.splice(i,1);
      i--;
    }
  }

  // Randomly select tile
  return tiles[Math.floor(Math.random() * tiles.length)];
}

function waterPositions() {
  water = [];
  for (var r = 0; r < map.length; r++) {
    for (var c = 0; c < map[0].length; c++) {
      var x = worldOffset.x - (G.MAP_SIZE * .5) + (G.TILE_SIZE * c) + (G.TILE_SIZE * .5);
      var y = worldOffset.y - (G.MAP_SIZE * .5) + (G.TILE_SIZE * r) + (G.TILE_SIZE * .5);
      switch (map[r][c].id) {
        case 0:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          break;
        case 1:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x - 40, y + 80));
          water.push(new w(x, y + 80));
          water.push(new w(x + 40, y + 80));
          break;
        case 2:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x - 80, y + 40));
          water.push(new w(x - 80, y));
          water.push(new w(x - 80, y - 40));
          break;
        case 3:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x - 40, y - 80));
          water.push(new w(x, y - 80));
          water.push(new w(x + 40, y - 80));
          break;
        case 4:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x + 80, y + 40));
          water.push(new w(x + 80, y));
          water.push(new w(x + 80, y - 40));
          break;
        case 5:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x + 80, y + 40));
          water.push(new w(x + 80, y));
          water.push(new w(x + 80, y - 40));
          water.push(new w(x - 80, y + 40));
          water.push(new w(x - 80, y));
          water.push(new w(x - 80, y - 40));
          break;
        case 6:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x - 40, y - 80));
          water.push(new w(x, y - 80));
          water.push(new w(x + 40, y - 80));
          water.push(new w(x - 40, y + 80));
          water.push(new w(x, y + 80));
          water.push(new w(x + 40, y + 80));
          break;
        case 7:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x + 80, y + 40));
          water.push(new w(x + 80, y));
          water.push(new w(x + 80, y - 40));
          water.push(new w(x - 80, y + 40));
          water.push(new w(x - 80, y));
          water.push(new w(x - 80, y - 40));
          water.push(new w(x - 40, y + 80));
          water.push(new w(x, y + 80));
          water.push(new w(x + 40, y + 80));
          break;
        case 8:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x + 40, y - 80));
          water.push(new w(x, y - 80));
          water.push(new w(x - 40, y - 80));
          water.push(new w(x - 80, y + 40));
          water.push(new w(x - 80, y));
          water.push(new w(x - 80, y - 40));
          water.push(new w(x - 40, y + 80));
          water.push(new w(x, y + 80));
          water.push(new w(x + 40, y + 80));
          break;
        case 9:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x + 80, y + 40));
          water.push(new w(x + 80, y));
          water.push(new w(x + 80, y - 40));
          water.push(new w(x - 80, y + 40));
          water.push(new w(x - 80, y));
          water.push(new w(x - 80, y - 40));
          water.push(new w(x - 40, y - 80));
          water.push(new w(x, y - 80));
          water.push(new w(x + 40, y - 80));
          break;
        case 10:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x + 40, y - 80));
          water.push(new w(x, y - 80));
          water.push(new w(x - 40, y - 80));
          water.push(new w(x + 80, y + 40));
          water.push(new w(x + 80, y));
          water.push(new w(x + 80, y - 40));
          water.push(new w(x - 40, y + 80));
          water.push(new w(x, y + 80));
          water.push(new w(x + 40, y + 80));
          break;
        case 11:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x - 40, y + 80));
          water.push(new w(x, y + 80));
          water.push(new w(x + 40, y + 80));
          water.push(new w(x - 80, y + 40));
          water.push(new w(x - 80, y));
          water.push(new w(x - 80, y - 40));
          break;
        case 12:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x - 40, y - 80));
          water.push(new w(x, y - 80));
          water.push(new w(x + 40, y - 80));
          water.push(new w(x - 80, y + 40));
          water.push(new w(x - 80, y));
          water.push(new w(x - 80, y - 40));
          break;
        case 13:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x - 40, y - 80));
          water.push(new w(x, y - 80));
          water.push(new w(x + 40, y - 80));
          water.push(new w(x + 80, y + 40));
          water.push(new w(x + 80, y));
          water.push(new w(x + 80, y - 40));
          break;
        case 14:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x - 40, y + 80));
          water.push(new w(x, y + 80));
          water.push(new w(x + 40, y + 80));
          water.push(new w(x + 80, y + 40));
          water.push(new w(x + 80, y));
          water.push(new w(x + 80, y - 40));
          break;
        case 15:
          water.push(new w(x - 80, y - 80));
          water.push(new w(x - 80, y + 80));
          water.push(new w(x + 80, y - 80));
          water.push(new w(x + 80, y + 80));
          water.push(new w(x + 40, y - 80));
          water.push(new w(x, y - 80));
          water.push(new w(x - 40, y - 80));
          water.push(new w(x + 80, y + 40));
          water.push(new w(x + 80, y));
          water.push(new w(x + 80, y - 40));
          water.push(new w(x - 40, y + 80));
          water.push(new w(x, y + 80));
          water.push(new w(x + 40, y + 80));
          water.push(new w(x - 80, y + 40));
          water.push(new w(x - 80, y));
          water.push(new w(x - 80, y - 40));
          water.push(new w(x - 40, y + 40));
          water.push(new w(x - 40, y));
          water.push(new w(x - 40, y - 40));
          water.push(new w(x, y + 40));
          water.push(new w(x, y));
          water.push(new w(x, y - 40));
          water.push(new w(x + 40, y + 40));
          water.push(new w(x + 40, y));
          water.push(new w(x + 40, y - 40));
          break;
      }
    }
  }
  // Add water around map border
  // Top
  for(var i = -1; i < map.length + 1; i++) {
    var x = worldOffset.x - (G.MAP_SIZE * .5) + (G.TILE_SIZE * i) + (G.TILE_SIZE * .5);
    var y = worldOffset.y - (G.MAP_SIZE * .5) + (G.TILE_SIZE * -1) + (G.TILE_SIZE * .5);
    water.push(new w(x - 80, y - 80));
    water.push(new w(x - 80, y + 80));
    water.push(new w(x + 80, y - 80));
    water.push(new w(x + 80, y + 80));
    water.push(new w(x + 40, y - 80));
    water.push(new w(x, y - 80));
    water.push(new w(x - 40, y - 80));
    water.push(new w(x + 80, y + 40));
    water.push(new w(x + 80, y));
    water.push(new w(x + 80, y - 40));
    water.push(new w(x - 40, y + 80));
    water.push(new w(x, y + 80));
    water.push(new w(x + 40, y + 80));
    water.push(new w(x - 80, y + 40));
    water.push(new w(x - 80, y));
    water.push(new w(x - 80, y - 40));
    water.push(new w(x - 40, y + 40));
    water.push(new w(x - 40, y));
    water.push(new w(x - 40, y - 40));
    water.push(new w(x, y + 40));
    water.push(new w(x, y));
    water.push(new w(x, y - 40));
    water.push(new w(x + 40, y + 40));
    water.push(new w(x + 40, y));
    water.push(new w(x + 40, y - 40));
  }
  // Bottom
  for (var i = -1; i < map.length + 1; i++) {
    var x = worldOffset.x - (G.MAP_SIZE * .5) + (G.TILE_SIZE * i) + (G.TILE_SIZE * .5);
    var y = worldOffset.y - (G.MAP_SIZE * .5) + (G.TILE_SIZE * map.length) + (G.TILE_SIZE * .5);
    water.push(new w(x - 80, y - 80));
    water.push(new w(x - 80, y + 80));
    water.push(new w(x + 80, y - 80));
    water.push(new w(x + 80, y + 80));
    water.push(new w(x + 40, y - 80));
    water.push(new w(x, y - 80));
    water.push(new w(x - 40, y - 80));
    water.push(new w(x + 80, y + 40));
    water.push(new w(x + 80, y));
    water.push(new w(x + 80, y - 40));
    water.push(new w(x - 40, y + 80));
    water.push(new w(x, y + 80));
    water.push(new w(x + 40, y + 80));
    water.push(new w(x - 80, y + 40));
    water.push(new w(x - 80, y));
    water.push(new w(x - 80, y - 40));
    water.push(new w(x - 40, y + 40));
    water.push(new w(x - 40, y));
    water.push(new w(x - 40, y - 40));
    water.push(new w(x, y + 40));
    water.push(new w(x, y));
    water.push(new w(x, y - 40));
    water.push(new w(x + 40, y + 40));
    water.push(new w(x + 40, y));
    water.push(new w(x + 40, y - 40));
  }
  // Left
  for (var i = -1; i < map.length + 1; i++) {
    var x = worldOffset.x - (G.MAP_SIZE * .5) + (G.TILE_SIZE * -1) + (G.TILE_SIZE * .5);
    var y = worldOffset.y - (G.MAP_SIZE * .5) + (G.TILE_SIZE * i) + (G.TILE_SIZE * .5);
    water.push(new w(x - 80, y - 80));
    water.push(new w(x - 80, y + 80));
    water.push(new w(x + 80, y - 80));
    water.push(new w(x + 80, y + 80));
    water.push(new w(x + 40, y - 80));
    water.push(new w(x, y - 80));
    water.push(new w(x - 40, y - 80));
    water.push(new w(x + 80, y + 40));
    water.push(new w(x + 80, y));
    water.push(new w(x + 80, y - 40));
    water.push(new w(x - 40, y + 80));
    water.push(new w(x, y + 80));
    water.push(new w(x + 40, y + 80));
    water.push(new w(x - 80, y + 40));
    water.push(new w(x - 80, y));
    water.push(new w(x - 80, y - 40));
    water.push(new w(x - 40, y + 40));
    water.push(new w(x - 40, y));
    water.push(new w(x - 40, y - 40));
    water.push(new w(x, y + 40));
    water.push(new w(x, y));
    water.push(new w(x, y - 40));
    water.push(new w(x + 40, y + 40));
    water.push(new w(x + 40, y));
    water.push(new w(x + 40, y - 40));
  }
  // Right
  for (var i = -1; i < map.length + 1; i++) {
    var x = worldOffset.x - (G.MAP_SIZE * .5) + (G.TILE_SIZE * map.length) + (G.TILE_SIZE * .5);
    var y = worldOffset.y - (G.MAP_SIZE * .5) + (G.TILE_SIZE * i) + (G.TILE_SIZE * .5);
    water.push(new w(x - 80, y - 80));
    water.push(new w(x - 80, y + 80));
    water.push(new w(x + 80, y - 80));
    water.push(new w(x + 80, y + 80));
    water.push(new w(x + 40, y - 80));
    water.push(new w(x, y - 80));
    water.push(new w(x - 40, y - 80));
    water.push(new w(x + 80, y + 40));
    water.push(new w(x + 80, y));
    water.push(new w(x + 80, y - 40));
    water.push(new w(x - 40, y + 80));
    water.push(new w(x, y + 80));
    water.push(new w(x + 40, y + 80));
    water.push(new w(x - 80, y + 40));
    water.push(new w(x - 80, y));
    water.push(new w(x - 80, y - 40));
    water.push(new w(x - 40, y + 40));
    water.push(new w(x - 40, y));
    water.push(new w(x - 40, y - 40));
    water.push(new w(x, y + 40));
    water.push(new w(x, y));
    water.push(new w(x, y - 40));
    water.push(new w(x + 40, y + 40));
    water.push(new w(x + 40, y));
    water.push(new w(x + 40, y - 40));
  }
  // Populate starting wave positions
  for (var i = 0; i < water.length; i++) {
    water[i].pos1 = vec(rnd(-17, 17), rnd(-17, 17));
    water[i].pos2 = vec(rnd(-17, 17), rnd(-17, 17));
    water[i].pos3 = vec(rnd(-17, 17), rnd(-17, 17));
  }
}

// Enemy
function enemy(x, y) {
  this.pos = vec(x,y);
  this.homePos = vec(x,y);
  this.direction = 0;
}
// Particle
function p(x,y, amount, speed, angle, width, color, duration) {
  this.x = x;
  this.y = y;
  this.amount = amount;
  this.speed = speed; 
  this.angle = angle; 
  this.width = width; 
  this.color = color;
  this.duration = duration;
}
// Item
function item(type, x, y, version) {
  this.type = type;
  this.pos = vec(x, y);
  this.version = version;
}
// Water
function w(x,y) {
  this.pos = vec(x,y);
  this.pos1 = vec(0,0);
  this.pos2 = vec(0, 0);
  this.pos3 = vec(0, 0);
}
// TILES
// 4-way
function t0() {
  this.id = 0;
  this.north = true;
  this.east = true;
  this.south = true;
  this.west = true;
}
// 3-ways
function t1() {
  this.id = 1;
  this.north = true;
  this.east = true;
  this.south = false;
  this.west = true;
}
function t2() {
  this.id = 2;
  this.north = true;
  this.east = true;
  this.south = true;
  this.west = false;
}
function t3() {
  this.id = 3;
  this.north = false;
  this.east = true;
  this.south = true;
  this.west = true;
}
function t4() {
  this.id = 4;
  this.north = true;
  this.east = false;
  this.south = true;
  this.west = true;
}
// 2-ways
function t5() {
  this.id = 5;
  this.north = true;
  this.east = false;
  this.south = true;
  this.west = false;
}
function t6() {
  this.id = 6;
  this.north = false;
  this.east = true;
  this.south = false;
  this.west = true;
}
// 1-ways
function t7() {
  this.id = 7;
  this.north = true;
  this.east = false;
  this.south = false;
  this.west = false;
}
function t8() {
  this.id = 8;
  this.north = false;
  this.east = true;
  this.south = false;
  this.west = false;
}
function t9() {
  this.id = 9;
  this.north = false;
  this.east = false;
  this.south = true;
  this.west = false;
}
function t10() {
  this.id = 10;
  this.north = false;
  this.east = false;
  this.south = false;
  this.west = true;
}
// bends
function t11() {
  this.id = 11;
  this.north = true;
  this.east = true;
  this.south = false;
  this.west = false;
}
function t12() {
  this.id = 12;
  this.north = false;
  this.east = true;
  this.south = true;
  this.west = false;
}
function t13() {
  this.id = 13;
  this.north = false;
  this.east = false;
  this.south = true;
  this.west = true;
}
function t14() {
  this.id = 14;
  this.north = true;
  this.east = false;
  this.south = false;
  this.west = true;
}
function t15() {
  this.id = 15;
  this.north = false;
  this.east = false;
  this.south = false;
  this.west = false;
}
