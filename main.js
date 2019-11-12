var gl;
var program;
const Y_PIXEL_MARGIN = 300;
var draw_function;
var currentMModel;
var filled;
var canvas, canvas_default_width, canvas_default_height;
var xScale, yScale;
var scaleFactor = 1;
var i = 0;

var rxValue, ryValue;
var theta, gamma;

var mView;
var currentView = "axo";
var normalProjection; //para guardar o "zoom" mesmo quando se faz perspective
var viewMemory;


var freeAxonActive = false;
var freeObliqueActive = false;

function $(x){
    return document.getElementById(x);
}

function canvasSetup(canvas){
    xScale =  (window.innerWidth - 20) / canvas_default_width;
    canvas.width = window.innerWidth - 20;
    yScale = (window.innerHeight - Y_PIXEL_MARGIN) / canvas_default_height;
    canvas.height = window.innerHeight - Y_PIXEL_MARGIN;   
}

window.onresize = function(){
    canvasSetup(canvas);
    if(currentView != "perspective"){
        //mProjection = ortho(-2 * xScale, 2 * xScale, -2 * yScale, 2 * yScale,-10,10);
        this.console.log(-2 * xScale, 2 * xScale, -2 * yScale, 2 * yScale);
        viewMemory["perspective"] = perspectiveView($("dSlider").value);
    }else
        mProjection = perspectiveView($("dSlider").value);
}

window.onload = function(){
    canvas = $("gl-canvas");
    this.canvas_default_width = canvas.width;
    this.canvas_default_height = canvas.height;
    canvasSetup(canvas);
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    canvas.addEventListener("wheel", function(event){
        document.body.style.overflow = "hidden";
        let scale = event.deltaY > 0 ? 0.91 : 1.1;
        scaleFactor *= scale;
        mProjection = mult(scalem(scale, scale, 1), mProjection);
    });

    canvas.parentElement.onclick = function(){
        document.body.style.overflow = "scroll";
    }

    setupButtonsAndSliders();
    setupKeybinds();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.4,0.4,0.4,1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    mModelLoc = gl.getUniformLocation(program,"mModel") ;
    mViewLoc = gl.getUniformLocation(program,"mView");
    mProjectionLoc = gl.getUniformLocation(program,"mProjection") ;

    cubeInit(gl);
    cylinderInit(gl);
    sphereInit(gl,0,0);
    bunnyInit(gl);
    torusInit(gl);

    viewMemory={
    "ortho" : orthographicView(0,0), 
    "axo" : orthographicView(toAxonometric(42)), 
    "oblique" : obliqueView(1, radians(30)), 
    "perspective": perspectiveView(2)
    };

    currentMModel = mat4();
    draw_function = cubeDraw;

    mProjection = ortho(-2 * xScale, 2*xScale, -2 * yScale, 2*yScale,-10,10);

    mView = mat4();

    normalProjection = mProjection;

    filled = false;

    $("dimetric").click();    
    $("views").options[1].selected = true;

    //gl.isEnabled(gl.CULL_FACE) ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);
    //gl.frontFace(gl.CCW)
    render();
}

//USAR LEFT RIGHT NA TRANSFORMAÇAO

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    

    gl.uniformMatrix4fv(mModelLoc, false, flatten(currentMModel));
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    draw_function(gl,program,filled);

    requestAnimationFrame(render);
}

function setupButtonsAndSliders(){

    //MODEL BUTTONS

    $("models").onchange = function(event){
        let model = event.target.options[event.target.selectedIndex].value;
       switch(model){
           case "cube": 
                draw_function = cubeDraw;
                break;
            case "cylinder":
                draw_function = cylinderDraw;
                break;
            case "sphere":
                draw_function = sphereDraw;
                break;
            case "bunny":
                draw_function = bunnyDraw;
                break;
            case "torus":
                draw_function = torusDraw;
                break;
            case "super":
                $("superSliders").style.visibility = "visible";
                superInit(gl, Number($("e1Slider").value), Number($("e2Slider").value));
                draw_function = superDraw;
                break;
            default:
                alert("How did you do that?");
       }

       if(model != "super")
        $("superSliders").style.visibility = "hidden";
    }

    //SUPER

    $("e1Slider").oninput = function(event){        
        superInit(gl, Number(event.target.value), Number($("e2Slider").value));
    }

    $("e2Slider").oninput = function(event){        
        superInit(gl, Number($("e1Slider").value), Number(event.target.value));
    }

    //VIEWS

    $("views").onchange = function(event){
        var i, tablinks, tabContents;
    
        tabContents = document.getElementsByClassName("tabcontent");
    
        //MEMORY
        viewMemory[currentView] = currentView == "perspective" ? mProjection : mView;
    
        currentView = event.target.options[event.target.selectedIndex].value;
    
        if(currentView == "perspective"){
            mView = mat4();
            normalProjection = mProjection;
            mProjection = viewMemory[currentView];
        }else{
            mProjection = normalProjection;
            mView = viewMemory[currentView];
        }
    
        //TAB FUNCTIONALITY
        for(i = 0; i < tabContents.length;i++)
            tabContents[i].style.display = "none";
    
        
        tablinks = event.target.options;
        for (i = 0; i < tablinks.length; i++) 
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        
    
        document.getElementById(currentView + "Tab").style.display = "block";
        event.target.options[event.target.selectedIndex].className += " active";    
    }
    
    //ORTHO


    $("mainElevation").onclick = function(){
        rxValue = 0;
        ryValue = 0;

        mView = orthographicView(rxValue,ryValue);
    }

    $("plan").onclick = function(){
        rxValue = 90;
        ryValue = 0;
        mView = orthographicView(rxValue,ryValue);
    }
    
    $("rightElevation").onclick = function(){
        rxValue = 0;
        ryValue = -90;

        mView = orthographicView(rxValue,ryValue);
    }


    //AXO
    $("isometric").onclick = function(){
        $("gammaSlider").disabled = true;
        $("thetaSlider").disabled = true;

        let axonAngles = toAxonometric(30, 30);

        mView = orthographicView(axonAngles[0],axonAngles[1]);
    };

    $("dimetric").onclick = function(){
        $("gammaSlider").disabled = true;
        $("thetaSlider").disabled = true;

        let axonAngles = toAxonometric(42, 7);

        mView =  orthographicView(axonAngles[0],axonAngles[1]);
    };

    $("trimetric").onclick = function() {
        $("gammaSlider").disabled = true;
        $("thetaSlider").disabled = true;

        let axonAngles = toAxonometric(54.16, 23.16);

        mView = orthographicView(axonAngles[0],axonAngles[1]);
    };


    $("freeAxon").onclick = function(){   
            mView = orthographicView($("thetaSlider").value, $("gammaSlider").value);

            $("gammaSlider").disabled = false;
            $("thetaSlider").disabled = false;
            
            $("gammaDisplay").value = $("gammaSlider").value;
            $("thetaDisplay").value = $("thetaSlider").value;
}

    $("gammaSlider").oninput = function(event){
        mView = orthographicView(event.target.value ,$("thetaSlider").value);
        $("gammaDisplay").value = event.target.value;
    }

    $("thetaSlider").oninput = function(event){
        mView =  orthographicView($("gammaSlider").value, event.target.value);
        $("thetaDisplay").value = event.target.value;
    }


    //OBLIQUE
    $("cavalier").onclick = function(){
        $("alphaObliqueSlider").disabled = true;
        $("lSlider").disabled = true;

        mView = obliqueView(1,radians(30));
    }

    $("cabinet").onclick = function(){
        $("alphaObliqueSlider").disabled = true;
        $("lSlider").disabled = true;

        mView = obliqueView(0.5,radians(30));
    }

    $("freeOblique").onclick = function(){
            mView = obliqueView($("lSlider").value, $("alphaObliqueSlider").value);
            $("alphaObliqueSlider").disabled = false;
            $("lSlider").disabled = false;

            $("lDisplay").value = $("lSlider").value;
            $("alphaDisplayOblique").value = $("alphaObliqueSlider").value;
    }

    $("lSlider").oninput = function(event){
        $("lDisplay").value = event.target.value;
        mView = obliqueView(event.target.value,$("alphaObliqueSlider").value);
    }

    $("alphaObliqueSlider").oninput = function(event){
        $("alphaDisplayOblique").value = event.target.value;
        mView = obliqueView($("lSlider").value, radians(event.target.value));
    }
    //PERSPECTIVE
    $("dSlider").oninput = function(event){
        mProjection = perspectiveView(event.target.value);
        $("dDisplay").value = event.target.value;
    }
}

function degrees(radians) {
    return radians * 180 / Math.PI;
  };

function toAxonometric(a, b){
    let theta = Math.atan(Math.sqrt(Math.tan(radians(a))/Math.tan(radians(b)))) - Math.PI/2;
    let epsilon = Math.asin(Math.sqrt(Math.tan(radians(a) * Math.tan(radians(b)))));

            //rxValue        //ryValue
    return [degrees(epsilon),degrees(theta)];

    /*rxValue = degrees(epsilon);
    ryValue = degrees(theta);*/
}

function setupKeybinds(){
    document.onkeydown = function(event){
        switch(event.key){
            case "w":
                filled = false;
                break;
            case "f":
                filled = true;
                break;
            case "z":
                gl.isEnabled(gl.DEPTH_TEST) ? gl.disable(gl.DEPTH_TEST) : gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LESS);
                if(gl.isEnabled(gl.DEPTH_TEST)){
                    $("zbuffer").style.color = "green";
                    $("zbuffer").value = "ON";
                }else{
                    $("zbuffer").style.color = "red";
                    $("zbuffer").value = "OFF";
                }
                break;
            case "b":
                gl.isEnabled(gl.CULL_FACE) ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.BACK);
                if(gl.isEnabled(gl.CULL_FACE)){
                    $("culling").style.color = "green";
                    $("culling").value = "ON";
                }else{
                    $("culling").style.color = "red";
                    $("culling").value = "OFF";
                }
                break;
        }
    }
}

function orthographicView(rxValue,ryValue){
    var view = mat4();
    view = mult(rotateY(ryValue), view);
    view = mult(rotateX(rxValue), view);
    return view;
}

function obliqueView(l, alpha){
    var view = mat4();  
    view = mult(mat4([1,0,(-l * Math.cos(alpha)),0],
                      [0,1,(-l * Math.sin(alpha)),0],
                      [0,0,1,0],
                      [0,0,0,1]), view);
    return view;
}

function perspectiveView(d){
    let persp = mat4([1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,-1/d,1]);
    return mult(ortho(-2 * xScale, 2*xScale, -2 * yScale, 2*yScale,-10,10), persp);
}
