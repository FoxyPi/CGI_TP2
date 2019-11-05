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
var modelMemory = 
{ "ortho" : null, "axo" : null, "oblique" : null, "perspective": null};

var defaultLookAtMatrix =
{ "at" : [0,0,0], "eye" : [0,0,0], "up" : [0,1,0]};

var axonAngles;
var freeAxonActive = false;

function $(x){
    return document.getElementById(x);
}

function canvasSetup(canvas){
    xScale = canvas.width / window.innerWidth;
    canvas.width = window.innerWidth;
    yScale = canvas.height / (window.innerHeight - 100);
    canvas.height = window.innerHeight - 100;
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

    filled = true;

    $("dimetric").click();
    
    gl.isEnabled(gl.CULL_FACE) ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW)
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    

    gl.uniformMatrix4fv(mModelLoc, false, flatten(currentMModel));
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    draw_function(gl,program,filled);

    requestAnimationFrame(render);
}

function setupButtonsAndSliders(){
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

    $("mainElevation").onclick = function(){
        rxValue = 0;
        ryValue = 0;

        orthographicView(rxValue,ryValue);
    }

    $("plan").onclick = function(){
        rxValue = 90;
        ryValue = 0;
        orthographicView(rxValue,ryValue);
    }
    
    $("rightElevation").onclick = function(){
        rxValue = 0;
        ryValue = 90;

        orthographicView(rxValue,ryValue);
    }

    $("isometric").onclick = function(){
        axonAngles = toAxonometric(30, 30);

        orthographicView(axonAngles[0],axonAngles[1]);
    };

    $("dimetric").onclick = function(){
        axonAngles = toAxonometric(42, 7);

        orthographicView(axonAngles[0],axonAngles[1]);
    };

    $("trimetric").onclick = function() {
        axonAngles = toAxonometric(54.16, 23.16);

        orthographicView(axonAngles[0],axonAngles[1]);
    };


    $("freeAxon").onclick = function(){   
        if(!freeAxonActive){
            orthographicView(axonAngles[0],axonAngles[1]);
            freeAxonActive = true;
            
            $("activeFreeAxonTag").innerHTML = "Active"
            $("alphaSlider").value = "0";
            $("betaSlider").value = "0";
        }
        else{
            $("activeFreeAxonTag").innerHTML = "Inactive"
            freeAxonActive = false;
        }
    }

    $("alphaSlider").oninput = function(event){
        axonAngles[0] = parseFloat(event.target.value);
        orthographicView(axonAngles[0],axonAngles[1]);
        
        console.log(axonAngles[0])
    }

    $("betaSlider").oninput = function(event){
        axonAngles[1] = parseFloat(event.target.value);
        orthographicView(axonAngles[0],axonAngles[1]);

        console.log(axonAngles[1])
    }
    /*$("isometric").onclick = (x => toAxonometric(30, 30));

    $("dimetric").onclick = (x => toAxonometric(42, 7));

    $("trimetric").onclick = (x => toAxonometric(54.16, 23.16));

    $("freeAxon").onclick = (x => toAxonometric($("alpha").value, $("beta").value));
    */


    $("cavalier").onclick = function(){
        var l = 1;
        var alpha = radians(30);

        obliqueView(l,alpha)
    }

    $("cabinet").onclick = function(){
        var l = 0.5;
        var alpha = radians(30);

        obliqueView(l,alpha)
    }
}

function degrees(radians) {
    return radians * 180 / Math.PI;
  };

function toAxonometric(a, b){
    let theta = Math.atan(Math.sqrt(Math.tan(radians(a))/Math.tan(radians(b)))) - Math.PI/2;
    let epsilon = Math.asin(Math.sqrt(Math.tan(radians(a) * Math.tan(radians(b)))));
    console.log("Epsilon is ", degrees(epsilon));
    console.log("Theta is ", degrees(theta)); 
    
    
    let r1 = Math.cos(epsilon);
    let r2 = Math.cos(theta) / Math.cos(radians(b));
    let r3 = -Math.sin(theta) / Math.cos(radians(a));
    console.log("R1 is ",r1);
    console.log("R2 is ",r2);
    console.log("R3 Is ",r3);
    

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
    for(i = 0; i < tabContents.length;i++)
        tabContents[i].style.display = "none";

    
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) 
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    

    document.getElementById(tabId).style.display = "block";
    event.currentTarget.className += " active";    
}

function orthographicView(rxValue,ryValue){
    mView = lookAt(defaultLookAtMatrix.eye, defaultLookAtMatrix.at, defaultLookAtMatrix.up);
    mView = mult(rotateY(ryValue), mView);
    mView = mult(rotateX(rxValue), mView);
}

function obliqueView(l, alpha){
    mView = lookAt(defaultLookAtMatrix.eye, defaultLookAtMatrix.at, defaultLookAtMatrix.up);
    mView = mult(mat4([1,0,(-l * Math.cos(alpha)),0],
                      [0,1,(-l * Math.sin(alpha)),0],
                      [0,0,1,0],
                      [0,0,0,1]), mView);
}