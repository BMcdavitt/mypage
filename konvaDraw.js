
//  'container' is the id of the <div> displaying the konva stage
//  imagePath is he path to the image to display
//  scaleBy is the speed in which scroll wheel will zoom

let kWidth = document.getElementById('container').clientWidth
let kHeight = document.getElementById('container').clientHeight
let isDraggableOn = false
let mobileDoubleTouch = false
let imagePath = 'dog.png'
let scaleBy = 1.1

const brushColor = '#0707fa'
const brushSize = 2.5

let stage = new Konva.Stage({
    container: 'container',
    width: kWidth,
    height: kHeight,
  })
  
let imageLayer = new Konva.Layer()
let drawLayer = new Konva.Layer()
let imageObj = new Image()

Konva.hitOnDragEnabled = true

//*********************************************************
//***                   Draw Image                      ***
//*********************************************************

imageObj.src = imagePath
imageObj.onload = function () {
  let showImage = new Konva.Image({
    image: imageObj
  })
  imageLayer.add(showImage)
}

stage.add(imageLayer)
imageLayer.draw()

stage.add(drawLayer)

//Scale up the image to fit the container

window.addEventListener('load', (event) => {

  let newScale = stage.scaleX()

  let widthScale = kWidth / imageObj.width
  let heightScale = kHeight / imageObj.height

  if(widthScale > 1 || heightScale > 1) {
    newScale = Math.max(widthScale, heightScale)
    stage.scale({x: newScale, y: newScale})
  }

})

//********************************************************

function getValidCord(pos, imageSize, containerSize) {
  let newPos = Math.min(pos, 0)

  if(newPos !== 0){
    if((imageSize * stage.scaleX()) < containerSize)
    { 
      newPos = 0
    }else
    {
      newPos = Math.max(pos, (containerSize + (0 - (imageSize * stage.scaleX()))))
    }
  }

  return newPos
}

//*********************************************************
//***   Mobile Pinch Zoom and Two Finger Drag Support   ***
//*********************************************************

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getCenter(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

let lastCenter = null;
let lastDist = 0;

stage.on('touchmove', function (e) {

  e.evt.preventDefault()
  let touch1 = e.evt.touches[0]
  let touch2 = e.evt.touches[1]

  if (touch1 && touch2) {
    mobileDoubleTouch = true
    if (stage.isDragging()) {
      stage.stopDrag()
    }
    movePathArray = []
    movePathDelay = 0
  }

  if(!mobileDoubleTouch) {
    return
  }

  let p1 = {
    x: touch1.clientX,
    y: touch1.clientY,
  }
  let p2 = {
    x: touch2.clientX,
    y: touch2.clientY,
  }

  if (!lastCenter) {
    lastCenter = getCenter(p1, p2)
    return
  }
  let newCenter = getCenter(p1, p2)

  let dist = getDistance(p1, p2)

  if (!lastDist) {
    lastDist = dist
  }

    // local coordinates of center point
    let pointTo = {
      x: (newCenter.x - stage.x()) / stage.scaleX(),
      y: (newCenter.y - stage.y()) / stage.scaleX(),
  }
  let oldScale = stage.scaleX()
  let scale = stage.scaleX() * (dist / lastDist)
  
   if(((imageObj.width * scale) < kWidth) && direction === -1){
    scale = oldScale
  } else if (((imageObj.height * scale) < kHeight) && direction === -1) {
    scale = oldScale
  }

  stage.scaleX(scale)
  stage.scaleY(scale)

  // calculate new position of the stage
  let dx = newCenter.x - lastCenter.x
  let dy = newCenter.y - lastCenter.y

  let newPos = {
    x: newCenter.x - pointTo.x * scale + dx,
    y: newCenter.y - pointTo.y * scale + dy,
  }

  newPos.x = getValidCord(newPos.x, imageObj.width, kWidth)
  newPos.y = getValidCord(newPos.y, imageObj.height, kHeight)

  stage.position(newPos)

  lastDist = dist
  lastCenter = newCenter

})

stage.on('touchend', function () {
  lastDist = 0;
  lastCenter = null;
});

//********************************************
//***   Scroll Wheel Zoom In/Out Support   ***
//********************************************

stage.on('wheel', (e) => {

  e.evt.preventDefault()

  let oldScale = stage.scaleX()
  let pointer = stage.getPointerPosition()

  let mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  }

  let direction = e.evt.deltaY > 0 ? -1 : 1

  let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
  
  if(((imageObj.width * newScale) < kWidth) && (direction < 0)){
    newScale = oldScale
  } else if (((imageObj.height * newScale) < kHeight) && (direction < 0)) {
    newScale = oldScale
  }

  stage.scale({ x: newScale, y: newScale })

  let newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  }

  newPos.x = getValidCord(newPos.x, imageObj.width, kWidth)
  newPos.y = getValidCord(newPos.y, imageObj.height, kHeight)

  stage.position(newPos)
})

//********************************************
//***          Support for drawing         ***
//********************************************
let canvas = document.createElement('canvas')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

let image = new Konva.Image({
  image: canvas,
  x: 0,
  y: 0,
})
drawLayer.add(image)

let context = canvas.getContext('2d')
context.strokeStyle = brushColor
context.lineJoin = 'round'
context.lineWidth = brushSize

let isPaint = false
let lastPointerPosition

//  edit movePathDelayCount to adjust, this prevents accidental marks when pinch zooming
let movePathDelayCount = 5
let movePathArray = []
let movePathDelay = 0

image.on('mousedown touchstart', function () {

  if(mobileDoubleTouch) {
    return
  }

  isPaint = true
  lastPointerPosition = stage.getPointerPosition()

  movePathDelay = 0

})

stage.on('mouseup mouseout touchend', function () {

  if(mobileDoubleTouch) {
    mobileDoubleTouch = false
  }

  // if((movePathArray.length > 0) && !mobileDoubleTouch) {
  //   drawMovePathArray()
  // }

  movePathDelay = 0
  isPaint = false
})

stage.on('mousemove touchmove', function () {

  if(mobileDoubleTouch) {
    return
  }
  
  if (!isPaint) {
    return
  }

  if (isDraggableOn) {
    return
  }

  context.globalCompositeOperation = 'source-over'
  
  context.beginPath()

  let newScale = stage.scaleX()
  let stageX = Math.abs(stage.x())
  let stageY = Math.abs(stage.y())

  let localPosFrom = {
    x: ((lastPointerPosition.x + stageX) / newScale),
    y: ((lastPointerPosition.y + stageY) / newScale),
  }

  context.moveTo(localPosFrom.x, localPosFrom.y)
  let pos = stage.getPointerPosition()

  localPos = {
    x: ((pos.x + stageX) / newScale),
    y: ((pos.y + stageY) / newScale),
  }

  lastPointerPosition = pos

  if(movePathDelay < movePathDelayCount) {

    movePathArray[movePathDelay] = {
      fromX: localPosFrom.x,
      fromY: localPosFrom.y,
      toX: localPos.x,
      toY: localPos.y
    }

    movePathDelay++
 
 } else {

  if(movePathArray.length > 0) {
    drawMovePathArray()
  }

  draw(localPosFrom.x, localPosFrom.y, localPos.x, localPos.y)
 }

})

function draw(fromX, fromY, toX, toY) {
  context.moveTo(fromX, fromY)
  stage.getPointerPosition()
  context.lineTo(toX, toY)
  context.closePath()
  context.stroke()
  drawLayer.batchDraw()
}

function drawMovePathArray() {
  for(let i = 0; i < movePathArray.length; i++) {
    draw(movePathArray[i].fromX, movePathArray[i].fromY, movePathArray[i].toX, movePathArray[i].toY )
  }

  movePathArray = []
}


//********************************************
//***        Support for dragging          ***
//********************************************

let container = stage.container()
container.tabIndex = 1
container.focus()

container.addEventListener('keydown', function (e) {

  if(e.keyCode===17) {
    stage.draggable(true)
    stage.dragBoundFunc(function(pos) {

      return {
        x: getValidCord(pos.x, imageObj.width, kWidth),
        y: getValidCord(pos.y, imageObj.height, kHeight)
      }
    })

    isDraggableOn = true
  }
})

container.addEventListener('keyup', function (e) {

  if(e.keyCode===17) {
    stage.draggable(false)
    isDraggableOn = false
  }
})

//******************************************************
//***        Support for responsive display          ***
//******************************************************

window.addEventListener('resize', fitStageIntoParentContainer);

function fitStageIntoParentContainer() {
  let kWidth = document.getElementById('container').clientWidth
  let kHeight = document.getElementById('container').clientHeight

  stage.width(kWidth)
  stage.height(kHeight)
}


