var gl
var program
var color_buffer
var draw_function
var currentMModel
var filled
var canvas


window.onload = function(){
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    setupButtons()
    setupKeybinds()

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.0,0.0,0.0,1.0)

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    mModelLoc = gl.getUniformLocation(program,"mModel") 
    mViewLoc = gl.getUniformLocation(program,"mView")
    mProjectionLoc = gl.getUniformLocation(program,"mProjection") 

    cubeInit(gl)
    currentMModel = mat4()
    draw_function = cubeDraw

    filled = true

    render()
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT)
    var at = [0, 0, 0];
    var eye = [1, 1, 1];
    var up = [0, 1, 0];
    mView = lookAt(eye, at, up);
    mProjection = ortho(-2,2,-2,2,10,-10);

    gl.uniformMatrix4fv(mModelLoc, false, flatten(currentMModel))
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView))
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection))

    draw_function(gl,program,filled);

    requestAnimationFrame(render)
}

function setupButtons(){
    document.getElementById("cubeButton").onclick = function(){
        cubeInit(gl)
        currentMModel = mat4()
        draw_function = cubeDraw
    }


    document.getElementById("cylinderButton").onclick = function(){
        cylinderInit(gl)
        currentMModel = mat4()
        draw_function = cylinderDraw
    }


    document.getElementById("sphereButton").onclick = function(){
        sphereInit(gl,0,0)
        currentMModel = mat4()
        draw_function = sphereDraw
    }


    document.getElementById("bunnyButton").onclick = function(){
        bunnyInit(gl)
        currentMModel = mult(mat4(),scalem(5,5,5))
        draw_function = bunnyDraw
    }

    
    document.getElementById("torusButton").onclick = function(){
        torusInit(gl)
        currentMModel = mat4()
        draw_function = torusDraw
    }

}

function setupKeybinds(){
    document.onkeydown = function(event){
        switch(event.key){
            case "w":
                filled = false
                break;
            case "f":
                filled = true
                break;
            case "z":
                gl.isEnabled(gl.DEPTH_TEST) ? gl.disable(gl.DEPTH_TEST) : gl.enable(gl.DEPTH_TEST)
                gl.depthFunc(gl.LESS)
                break;
            case "b":
                gl.isEnabled(gl.CULL_FACE) ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE)
                gl.cullFace(gl.BACK)
                break;
        }
    }
}

