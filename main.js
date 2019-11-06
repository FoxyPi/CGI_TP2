var gl;
var program;
var color_buffer;
var draw_function;
var currentMModel;
var filled;
var canvas;
var xScale, yScale;
var i = 0;
var rxValue;
var ryValue;
var theta;
var gamma;
var mView;
var currentView = "axo";

var defaultLookAtMatrix =
{ "at" : [0,0,0], "eye" : [0,0,0], "up" : [0,1,0]};

var viewMemory = 
{ "ortho" : orthographicView(0,0), "axo" : orthographicView(toAxonometric(42)), "oblique" : obliqueView(1, radians(30)), "perspective": perspectiveView(2)};


var freeAxonActive = false;
var freeObliqueActive = false;

function $(x){
    return document.getElementById(x);
}

function canvasSetup(canvas){
    xScale = canvas.width / window.innerWidth;
    canvas.width = window.innerWidth;
    yScale = canvas.height / (window.innerHeight - 300);
    canvas.height = window.innerHeight - 300;
}

window.onload = function(){
    canvas = $("gl-canvas");
    canvasSetup(canvas);
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    canvas.addEventListener("wheel", function(event){
        document.body.style.overflow = "hidden";
        let scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
        mProjection = mult(scalem(scaleFactor, scaleFactor, scaleFactor), mProjection);
    });

    canvas.parentElement.onclick = function(){
        document.body.style.overflow = "scroll";
    }

    setupButtonsAndSliders();
    setupKeybinds();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0,0.0,0.0,0.6);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    mModelLoc = gl.getUniformLocation(program,"mModel") ;
    mViewLoc = gl.getUniformLocation(program,"mView");
    mProjectionLoc = gl.getUniformLocation(program,"mProjection") ;

    cubeInit(gl);
    currentMModel = mat4();
    draw_function = cubeDraw;

    mProjection = ortho(-2,2,-2,2,-10,10);
    mProjection = mult(scalem(xScale,yScale,1), mProjection); 

    filled = false;

    $("dimetric").click();
    
    //gl.isEnabled(gl.CULL_FACE) ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);
    //gl.frontFace(gl.CCW)
    render();
}

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
    $("cubeButton").onclick = function(){
        cubeInit(gl);
        currentMModel = mat4();
        draw_function = cubeDraw;
    }


    $("cylinderButton").onclick = function(){
        cylinderInit(gl);
        currentMModel = mat4();
        draw_function = cylinderDraw;
    }


    $("sphereButton").onclick = function(){
        sphereInit(gl,0,0);
        currentMModel = mat4();
        draw_function = sphereDraw;
    }


    $("bunnyButton").onclick = function(){
        bunnyInit(gl);
        currentMModel = mult(mat4(),scalem(5,5,5));
        draw_function = bunnyDraw;
    }

    
    $("torusButton").onclick = function(){
        torusInit(gl);
        currentMModel = mat4();
        draw_function = torusDraw;
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
        ryValue = 90;

        mView = orthographicView(rxValue,ryValue);
    }


    //AXO
    $("isometric").onclick = function(){
        if(freeAxonActive)
            $("freeAxon").click();

        let axonAngles = toAxonometric(30, 30);

        mView = orthographicView(axonAngles[0],axonAngles[1]);
    };

    $("dimetric").onclick = function(){
        if(freeAxonActive)
            $("freeAxon").click();

        let axonAngles = toAxonometric(42, 7);

        mView =  orthographicView(axonAngles[0],axonAngles[1]);
    };

    $("trimetric").onclick = function() {
        if(freeAxonActive)
            $("freeAxon").click();

        let axonAngles = toAxonometric(54.16, 23.16);

        mView = orthographicView(axonAngles[0],axonAngles[1]);
    };


    $("freeAxon").onclick = function(){   
        if(!freeAxonActive){
            mView = orthographicView(axonAngles[0],axonAngles[1]);

            $("alphaSlider").disabled = false;
            $("betaSlider").disabled = false;
            
            $("activeFreeAxonTag").innerHTML = "Active"

            $("alphaSlider").value = 0;
            $("betaSlider").value = 0;

            $("alphaDisplay").value = 0;
            $("betaDisplay").value = 0;
        }
        else{
            $("activeFreeAxonTag").innerHTML = "Inactive"

            $("alphaSlider").disabled = true;
            $("betaSlider").disabled = true;
        }
        freeAxonActive = !freeAxonActive;
    }

    $("alphaSlider").oninput = function(event){
        if(freeAxonActive){
            mView = orthographicView(event.target.value ,$("betaSlider").value);
            $("alphaDisplay").value = event.target.value;
        }
    }

    $("betaSlider").oninput = function(event){
        if(freeAxonActive){
            mView =  orthographicView($("alphaSlider").value, event.target.value);
            $("betaDisplay").value = event.target.value;
        }
    }


    //OBLIQUE
    $("cavalier").onclick = function(){
        if(freeObliqueActive)
            $("freeOblique").click();
        mView = obliqueView(1,radians(30));
    }

    $("cabinet").onclick = function(){
        if(freeObliqueActive)
            $("freeOblique").click();
        mView = obliqueView(0.5,radians(30));
    }

    $("freeOblique").onclick = function(){
        if(!freeObliqueActive){
            mView = obliqueView($("lSlider").value, $("alphaObliqueSlider").value);
            $("alphaObliqueSlider").disabled = false;
            $("lSlider").disabled = false;

            $("activeFreeObliqueTag").innerHTML = "Active"

            $("lSlider").value = 0.5;
            $("alphaObliqueSlider").value = 0;

            $("lDisplay").value = 0.5;
            $("alphaDisplayOblique").value = 0;
        }
        else{
            $("activeFreeObliqueTag").innerHTML = "Inactive"

            $("alphaObliqueSlider").disabled = true;
            $("lSlider").disabled = true;
        }

        freeObliqueActive = !freeObliqueActive;
    }

    $("lSlider").oninput = function(event){
        mView = obliqueView(event.target.value,$("alphaObliqueSlider").value);
    }

    $("alphaObliqueSlider").oninput = function(event){
        mView = obliqueView($("lSlider").value, radians(event.target.value));
    }
    //PERSPECTIVE
    $("dSlider").oninput = function(event){
        mView = perspectiveView(event.target.value);
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
                break;
            case "b":
                gl.isEnabled(gl.CULL_FACE) ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE);
                gl.cullFace(gl.BACK);
                break;
        }
    }
}

function openTab(event,tabId){
    var i, tablinks, tabContents;

    tabContents = document.getElementsByClassName("tabcontent");

    //MEMORY
    viewMemory[currentView] = mView;
    switch(event.target.id){
        case "orthoButton":
            currentView = "ortho";
            break;
        case "axonButton":
            currentView = "axo";
            break;
        case "obliqueButton":
            currentView = "oblique";
            break;
        case "perspectiveButton":
            currentView = "perspective";
            break;
        default:
            alert("Unexpected Button");
    }

    mView = viewMemory[currentView];

    //TAB FUNCTIONALITY
    for(i = 0; i < tabContents.length;i++)
        tabContents[i].style.display = "none";

    
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) 
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    

    document.getElementById(tabId).style.display = "block";
    event.currentTarget.className += " active";    
}

function orthographicView(rxValue,ryValue){
    var view = lookAt(defaultLookAtMatrix.eye, defaultLookAtMatrix.at, defaultLookAtMatrix.up);
    view = mult(rotateY(ryValue), view);
    view = mult(rotateX(rxValue), view);
    return view;
}

function obliqueView(l, alpha){
    var view = lookAt(defaultLookAtMatrix.eye, defaultLookAtMatrix.at, defaultLookAtMatrix.up);
    view = mult(mat4([1,0,(-l * Math.cos(alpha)),0],
                      [0,1,(-l * Math.sin(alpha)),0],
                      [0,0,1,0],
                      [0,0,0,1]), view);
    return view;
}

function perspectiveView(d){
    return mat4([1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,1/d,1]);
}