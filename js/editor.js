let svg = document.querySelector("#timeline-svg");

function updateCanvasSize() {
	let svg_parent = document.querySelector("#timeline");

	svg.setAttribute("height", 0);
	svg.setAttribute("width", 0);
	let height = svg_parent.offsetHeight;
	let width = svg_parent.offsetWidth;
	svg.setAttribute("height", height);
	svg.setAttribute("width", width);
}

function getMousePosition(e) {
	var CTM = editorCanvas.getScreenCTM();
	return {
		x: (e.clientX - CTM.e) / CTM.a,
		y: (e.clientY - CTM.f) / CTM.d
	};
}

let selectedElement = null;
function dragStart(e) {
	let element = e.target;
	if (!element.classList.contains("event")) return;
	selectedElement = element;
}

function drag(e) {
  if (selectedElement == null) return;
	e.preventDefault();
	var coord = getMousePosition(e);
	selectedElement.setAttributeNS(null, "cx", coord.x);
  selectedElement.setAttributeNS(null, "cy", coord.y);
  selectedElement.dispatchEvent(new Event("move"));
}

function dragEnd(e) {
	if (selectedElement == null) return;
	dropElement(selectedElement);
}

const EditorState = {
  READY: 0,
  ADDING_THROW_EVENT: 1,
  ADDING_CATCH_EVENT: 2,
}

let currentEditorState = EditorState.READY;


function dropElement(element) {
  let hand;
  let time = element.getAttribute("cx");
  let y = element.getAttribute("cy");
	if (y < 0.5){
    y = 0.25;
    hand = Hand.LEFT;
  } 
  else{ 
    y = 0.75;
    hand = Hand.RIGHT
  }
  element.setAttribute("cy", y);
  
  let relocateEvent = new CustomEvent("relocate", {hand, time});
  element.dispatchEvent(relocateEvent);
  element.dispatchEvent(new Event("move"));

  selectedElement = null;

  switch(currentEditorState) {
    case EditorState.ADDING_THROW_EVENT:
      selectedElement = throwEvent.catchCircle;
      currentEditorState = EditorState.ADDING_CATCH_EVENT;
      break;
    case EditorState.ADDING_CATCH_EVENT:
      currentEditorState = EditorState.READY;
      break;
  }
}

let throwEvent = undefined;


function addBallEvent() {
	if (currentEditorState != EditorState.READY) return;
  currentEditorState = EditorState.ADDING_THROW_EVENT;
  throwEvent = new ThrowEvent();
  selectedElement = throwEvent.throwCircle;
}



function createCircle(){
  let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.classList.add("event");
  circle.setAttribute("r", "0.05");
  circle.setAttribute("cx", "-1");
  svg.appendChild(circle);
  return circle;
}
class CurveBetween
{
  constructor() 
  {
    this.startPosition = undefined;
    this.endPosition = undefined;
    this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.path.classList.add("curve-between");
    svg.appendChild(this.path);
  }

  setStart(position)
  {
    this.startPosition = position;
    this.updatePath();
  }

  setEnd(position)
  {
    this.endPosition = position;
    this.updatePath();
  }
  highlight()
  {
    this.path.classList.add("highlighted");
  }

  dehighlight()
  {
    this.path.classList.remove("highlighted");
  }
  updatePath()
  {
    if (this.startPosition == undefined || this.endPosition == undefined)
      return;

    let sx = this.startPosition.x;
    let sy = this.startPosition.y;
    
    let ex = this.endPosition.x;
    let ey = this.endPosition.y;
    
    let mx = (sx + ex) / 2;
    let my = 0.5;
    
    let pathString = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`
    this.path.setAttribute("d", pathString);
  }

}

class ThrowEvent {
  constructor()
  {
    this.curveBetween = new CurveBetween();

    this.throwCircle = createCircle();
    this.throwCircle.classList.add("throw-event");
    this.throwCircle.addEventListener("mouseover", () => { this.onCircleHover() });
    this.throwCircle.addEventListener("mouseleave", () => { this.onCircleUnhover() });

    this.throwCircle.addEventListener("relocate", (event)=>{this.updateThrowTime(event)});
    this.throwCircle.addEventListener("move", ()=>{this.updateThrowMarkerPosition()})
    
    this.catchCircle = createCircle();
    this.catchCircle.classList.add("catch-event");
    this.catchCircle.addEventListener("mouseover", () => { this.onCircleHover() });
    this.catchCircle.addEventListener("mouseleave", () => { this.onCircleUnhover() });
    this.catchCircle.addEventListener("relocate", (event) => { this.updateCatchTime(event) });
    this.catchCircle.addEventListener("move", () => {this.updateCatchMarkerPosition()});
  }

  updateThrowMarkerPosition(event) {
    let throwPosition = {
      x: parseFloat(this.throwCircle.getAttribute("cx")),
      y: parseFloat(this.throwCircle.getAttribute("cy")),
    };
    if(currentEditorState != EditorState.ADDING_THROW_EVENT){
      let catchX = parseFloat(this.catchCircle.getAttribute("cx"));
      if(throwPosition.x > catchX) {
        this.throwCircle.setAttribute("cx", catchX);
        throwPosition.x = catchX;
      }
    }
    this.curveBetween.setStart(throwPosition);
  }

  updateCatchMarkerPosition(event) {
    let catchPosition = {
      x: parseFloat(this.catchCircle.getAttribute("cx")),
      y: parseFloat(this.catchCircle.getAttribute("cy")),
    };

    let throwX = parseFloat(this.throwCircle.getAttribute("cx"));
    if (catchPosition.x < throwX) {
      this.catchCircle.setAttribute("cx", throwX);
      catchPosition.x = throwX;
    }
    this.curveBetween.setEnd(catchPosition);
  }
  
  updateThrowTime(){}
  updateCatchTime(){}

  onCircleHover() {
    this.throwCircle.classList.add("highlighted");
    this.catchCircle.classList.add("highlighted");
    this.curveBetween.highlight();
  }

  onCircleUnhover() {
    this.throwCircle.classList.remove("highlighted");
    this.catchCircle.classList.remove("highlighted");
    this.curveBetween.dehighlight();
  }

}
function addHandEvent() {
	//za chj nie umiemy
}

function clearEvents(){
  confirm("This will delete your trick. Are you sure?");
  svg.querySelectorAll("circle, path").forEach(e => e.remove());
}

let editorCanvas = document.getElementById("timeline-svg");
editorCanvas.addEventListener("mousedown", dragStart);
editorCanvas.addEventListener("mousemove", drag);
editorCanvas.addEventListener("mouseup", dragEnd);
editorCanvas.addEventListener("mouseleave", dragEnd);
window.addEventListener("blur", dragEnd);
window.addEventListener("load", updateCanvasSize);
window.addEventListener("resize", updateCanvasSize);