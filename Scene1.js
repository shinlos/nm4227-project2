import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  throttle,
  TILE_SIZE,
  TIMEOUT_DURATION,
} from './utils.js'

const GRASS_TILES = [
  [1, 12],
  [2, 12],
  [3, 12],
  [4, 12],
  [5, 12],
  [6, 12],
  [7, 12],
  [10, 12],
  [11, 12],
  [12, 12],
  [13, 12],
  [14, 12],
  [15, 12],
  [16, 12],
  [17, 12],
  [18, 12],
  [19, 12],
  [20, 12],
  [21, 12],
  [22, 12],
  [23, 12],
  // step 1
  [24, 11],
  [25, 10],
  // step 2
  [21, 9],
  [22, 9],
  [20, 8],
  // step 3
  [15, 7],
  [16, 7],
  [17, 7],
  [18, 7],
  // goal
  [12, 7],
  [13, 7],
  [11, 6],
  [10, 5],
  // hanging
  [12, 2],
  [13, 2],
  [14, 2],
  [15, 2],
]

const DIRT_TILES = [
  [24, 12],
  [25, 12],
  [26, 12],
  [1, 13],
  [2, 13],
  [3, 13],
  [4, 13],
  [5, 13],
  [6, 13],
  [7, 13],
  [8, 13],
  [9, 13],
  [10, 13],
  [11, 13],
  [12, 13],
  [13, 13],
  [14, 13],
  [15, 13],
  [16, 13],
  [17, 13],
  [18, 13],
  [19, 13],
  [20, 13],
  [21, 13],
  [22, 13],
  [23, 13],
  [24, 13],
  [25, 13],
  [26, 13],
  // step 1
  [25, 11],
  // goal
  [10, 7],
  [11, 7],
  [10, 6],
]

const SPIKES_TILES = [
  [8, 12],
  [9, 12],
  [26, 11],
]

const DOWN_FACING_SPIKE_TILES = [
  // below goal
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  // hanging
  [12, 3],
  [13, 3],
  [14, 3],
  [15, 3],
]

const GOAL = [10, 4]

class Scene1 extends Phaser.Scene {
  constructor() {
    super('learnGame')
  }

  preload() {
    this.load.image('bg', 'assets/sky.png')

    this.load.image('avatar_left_walk_1', 'assets/avatar/left-step-1.png')
    this.load.image('avatar_left_walk_2', 'assets/avatar/left-step-2.png')
    this.load.image('avatar_left_walk_3', 'assets/avatar/left-step-3.png')
    this.load.image('avatar_left_walk_4', 'assets/avatar/left-step-4.png')
    this.load.image('avatar_left_walk_5', 'assets/avatar/left-step-5.png')
    this.load.image('avatar_left_walk_6', 'assets/avatar/left-step-6.png')
    this.load.image('avatar_right_walk_1', 'assets/avatar/right-step-1.png')
    this.load.image('avatar_right_walk_2', 'assets/avatar/right-step-2.png')
    this.load.image('avatar_right_walk_3', 'assets/avatar/right-step-3.png')
    this.load.image('avatar_right_walk_4', 'assets/avatar/right-step-4.png')
    this.load.image('avatar_right_walk_5', 'assets/avatar/right-step-5.png')
    this.load.image('avatar_right_walk_6', 'assets/avatar/right-step-6.png')

    this.load.image('dirt_tile', 'assets/dirt.png') // 32px x 32px
    this.load.image('grass_tile', 'assets/grass.png') // 32px x 32px
    this.load.image('spike_down_tile', 'assets/spike_down_tile.png') // 12px x 32px
    this.load.image('spike_tile', 'assets/spike_tile.png') // 32px x 12px
    this.load.image('goal', 'assets/grades/aplus.png') // 32px x 32px

    this.load.audio('audio_winning', 'assets/audio/winning.mp3')
    this.load.audio('audio_death_spike_tile', 'assets/audio/death_spike.mp3')
    this.load.audio(
      'audio_death_spike_bottom_tile',
      'assets/audio/death_spike_bottom.mp3',
    )
    this.load.audio(
      'audio_death_spike_right_tile',
      'assets/audio/death_spike_right.mp3',
    )
    this.load.audio('audio_jump', 'assets/audio/jump.mp3')
    this.load.audio('audio_respawn', 'assets/audio/respawn.mp3')
    this.load.audio('audio_walk', 'assets/audio/reg_footstep.mp3')

    // encouragement
    this.load.audio('e0', 'assets/audio/encouragements/e0.mp3')
    this.load.audio('e1', 'assets/audio/encouragements/e1.mp3')
  }

  create() {
    this.gameOver = false
    this.canJump = true
    function getScreenCoordinate(tileNumber, tileSize) {
      const origin = tileSize / 2
      // -1 due to 1 based indexing
      return origin + (tileNumber - 1) * tileSize
    }
    function getSpikeScreenYCoordinate(tileNumber, tileSize) {
      const origin = tileSize - 6
      // -1 due to 1 based indexing
      return origin + (tileNumber - 1) * tileSize
    }
    function getDownSpikeScreenYCoordinate(tileNumber, tileSize) {
      const origin = 6
      // -1 due to 1 based indexing
      return origin + (tileNumber - 1) * tileSize
    }

    const bg = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'bg',
    )
    const scaleX = this.cameras.main.width / bg.width
    const scaleY = this.cameras.main.height / bg.height
    const scale = Math.min(scaleX, scaleY)
    bg.setScale(scale).setScrollFactor(0)

    // create platforms
    const platforms = this.physics.add.staticGroup()
    const platformsCreated = DIRT_TILES.map((coordinate) => {
      const x = getScreenCoordinate(coordinate[0], TILE_SIZE)
      const y = getScreenCoordinate(coordinate[1], TILE_SIZE)
      return platforms.create(x, y, 'dirt_tile')
    })
    GRASS_TILES.map((coordinate) => {
      const x = getScreenCoordinate(coordinate[0], TILE_SIZE)
      const y = getScreenCoordinate(coordinate[1], TILE_SIZE)
      return platforms.create(x, y, 'grass_tile')
    })

    // create spikes
    const spikes = this.physics.add.staticGroup()
    const spikesCreated = SPIKES_TILES.map((coordinate) => {
      const x = getScreenCoordinate(coordinate[0], TILE_SIZE)
      const y = getSpikeScreenYCoordinate(coordinate[1], TILE_SIZE)
      return spikes.create(x, y, 'spike_tile')
    })
    DOWN_FACING_SPIKE_TILES.forEach((coordinate) => {
      const x = getScreenCoordinate(coordinate[0], TILE_SIZE)
      const y = getDownSpikeScreenYCoordinate(coordinate[1], TILE_SIZE)
      const spike = spikes.create(x, y, 'spike_down_tile')
      spikesCreated.push(spike)
    })

    // create goal
    const goal = this.physics.add.staticGroup()
    const goalX = getScreenCoordinate(GOAL[0], TILE_SIZE)
    const goalY = getSpikeScreenYCoordinate(GOAL[1], TILE_SIZE)
    goal.create(goalX, goalY, 'goal')

    // create player
    this.playerStartingX = getScreenCoordinate(2, TILE_SIZE)
    this.playerStartingY = getScreenCoordinate(11, TILE_SIZE)
    this.player = this.physics.add.sprite(
      this.playerStartingX,
      this.playerStartingY,
      'avatar_right_walk_1',
    )
    this.player.setSize(14, 30, 2, 0) // modify bounding box
    this.anims.create({
      key: 'walk_left',
      frames: [
        { key: 'avatar_left_walk_1' },
        { key: 'avatar_left_walk_2' },
        { key: 'avatar_left_walk_3' },
        { key: 'avatar_left_walk_4' },
        { key: 'avatar_left_walk_5' },
        { key: 'avatar_left_walk_6' },
      ],
      frameRate: 24,
      repeat: 0,
    })
    this.anims.create({
      key: 'walk_right',
      frames: [
        { key: 'avatar_right_walk_1' },
        { key: 'avatar_right_walk_2' },
        { key: 'avatar_right_walk_3' },
        { key: 'avatar_right_walk_4' },
        { key: 'avatar_right_walk_5' },
        { key: 'avatar_right_walk_6' },
      ],
      frameRate: 24,
      repeat: 0,
    })

    // audio
    this.winningSound = this.sound.add('audio_winning')
    this.deathSoundSpikeTile = this.sound.add('audio_death_spike_tile')
    this.deathSoundSpikeBottomTile = this.sound.add(
      'audio_death_spike_bottom_tile',
    )
    this.deathSoundSpikeRightTile = this.sound.add(
      'audio_death_spike_right_tile',
    )
    this.jumpSound = this.sound.add('audio_jump')
    this.respawnSound = this.sound.add('audio_respawn', { volume: 0.2 })
    this.walkSound = this.sound.add('audio_walk', { volume: 0.1 })
    this.throttledWalkSound = throttle(function () {
      this.walkSound.play()
    }, 200)

    this.encouragements = []
    for (let i = 0; i < 2; i++) {
      this.encouragements.push(this.sound.add('e' + i))
    }

    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, platforms)
    this.physics.add.collider(this.player, spikes, this.hitSpikes, null, this)
    this.physics.add.collider(this.player, goal, this.reachGoal, null, this)

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  update() {
    if (this.gameOver) {
      return
    }

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-120)
      if (this.player.body.touching.down) {
        this.player.anims.play('walk_left', true)
        this.throttledWalkSound()
      }
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(120)
      if (this.player.body.touching.down) {
        this.player.anims.play('walk_right', true)
        this.throttledWalkSound()
      }
    } else {
      this.player.setVelocityX(0)
    }

    if (this.cursors.up.isUp) {
      // debounce jump
      this.canJump = true
    }
    if (
      this.canJump &&
      this.cursors.up.isDown &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-380)
      this.jumpSound.play()
      this.canJump = false
    }
  }

  hitSpikes(pointer, gameObject) {
    if (this.gameOver) {
      // debounce collision
      return
    }
    this.gameOver = true
    this.player.setVelocityX(0)
    this.player.setVelocityY(0)
    switch (gameObject.texture.key) {
      case 'spike_tile':
        this.deathSoundSpikeTile.play()
        break
      case 'spike_right_tile':
        this.deathSoundSpikeBottomTile.play()
        break
      case 'spike_down_tile':
        this.deathSoundSpikeRightTile.play()
        break
    }
    this.showMotivationalText()
    setTimeout(() => {
      this.gameOver = false
      this.respawnSound.play()
      this.player.x = this.playerStartingX
      this.player.y = this.playerStartingY
    }, TIMEOUT_DURATION)
  }

  reachGoal() {
    this.winningSound.play()
    this.showVictoryText()
    this.gameOver = true
  }

  showMotivationalText() {
    // select random taunt
    const rng = Math.floor(Math.random() * this.encouragements.length)
    this.encouragements[rng].play()
  }

  showVictoryText() {
    setTimeout(() => {
      this.scene.start('brace')
    }, TIMEOUT_DURATION)
  }
}

export { Scene1 }
