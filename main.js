var gl;
var program;
var color_buffer;
var draw_function;
var currentMModel;
var filled;
var canvas;
var i = 0;
var rxValue;
var ryValue;
var theta;
var gamma;

window.onload = function(){
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }


    let rySlider = document.getElementById("rySlider");
    rySlider.oninput = function(){
        ryValue = parseFloat(rySlider.value);
    }

    setupButtons();
    setupKeybinds();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0,0.0,0.0,1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    mModelLoc = gl.getUniformLocation(program,"mModel") ;
    mViewLoc = gl.getUniformLocation(program,"mView");
    mProjectionLoc = gl.getUniformLocation(program,"mProjection") ;

    cubeInit(gl);
    currentMModel = mat4();
    draw_function = cubeDraw;

    filled = true;

    rxValue = 0;
    ryValue = 0;

    document.getElementById("dimetric").click();
    gl.isEnabled(gl.CULL_FACE) ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    var at = [0, 0, 0];
    var eye = [0, 0, 0];
    var up = [0, 1, 0];
    mView = lookAt(eye, at, up);
    mView = mult(mView, translate(0,0,-1));
    mView = mult(mView, rotateX(theta));
    mView = mult(mView, rotateY(gamma));
    
    mProjection = ortho(-2,2,-2,2,-10,10);

    gl.uniformMatrix4fv(mModelLoc, false, flatten(currentMModel));
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    draw_function(gl,program,filled);

    requestAnimationFrame(render);
}

function setupButtons(){
    document.getElementById("cubeButton").onclick = function(){
        cubeInit(gl);
        currentMModel = mat4();
        draw_function = cubeDraw;
    }


    document.getElementById("cylinderButton").onclick = function(){
        cylinderInit(gl);
        currentMModel = mat4();
        draw_function = cylinderDraw;
    }


    document.getElementById("sphereButton").onclick = function(){
        sphereInit(gl,0,0);
        currentMModel = mat4();
        draw_function = sphereDraw;
    }


    document.getElementById("bunnyButton").onclick = function(){
        bunnyInit(gl);
        //currentMModel = mult(mat4(),scalem(5,5,5));
        draw_function = bunnyDraw;
    }

    
    document.getElementById("torusButton").onclick = function(){
        torusInit(gl);
        currentMModel = mat4();
        draw_function = torusDraw;
    }

    document.getElementById("mainElevation").onclick = function(){
        rxValue = 0;
        ryValue = 0;
    }

    document.getElementById("plan").onclick = function(){
        rxValue = 90;
        ryValue = 0;
    }
    
    document.getElementById("rightElevation").onclick = function(){
        rxValue = 0;
        ryValue = 90;
    }

    document.getElementById("isometric").onclick = function(){
        rxValue = 35.26;
        ryValue = 45;
    }

    document.getElementById("dimetric").onclick = function(){
        rxValue = 7;
        ryValue = 42;

        theta = Math.atan(Math.sqrt(Math.tan(ryValue)/Math.tan(rxValue))) - 90
        gamma = Math.asin(Math.sqrt(Math.tan(ryValue)*Math.tan(rxValue)))

        
    }

    document.getElementById("trimetric").onclick = function(){
        rxValue = 23.16
        ryValue = 54.16
    }
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

