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
var normalProjection; //para guardar o "zoom" mesmo quando se faz perspective

var viewMemory;


var freeAxonActive = false;
var freeObliqueActive = false;

function $(x){
    return document.getElementById(x);
}

function canvasSetup(canvas){
    xScale =  window.innerWidth / canvas.width;
    canvas.width = window.innerWidth;
    yScale = (window.innerHeight - 300) / canvas.height;
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

    this.console.log(xScale, yScale);
    mProjection = ortho(-2 * xScale, 2*xScale, -2 * yScale, 2*yScale,-10,10);

    mView = mat4();

    normalProjection = mProjection;
    filled = false;

    $("dimetric").click();
    
    //gl.isEnabled(gl.CULL_FACE) ? gl.disable(gl.CULL_FACE) : gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);
    //gl.frontFace(gl.CCW)
    render();
}

//USAR LEFT RIGHT NA TRTANSFORMAÇAO

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
        currentMModel = mat4();
        draw_function = cubeDraw;
    }


    $("cylinderButton").onclick = function(){
        currentMModel = mat4();
        draw_function = cylinderDraw;
    }


    $("sphereButton").onclick = function(){
        currentMModel = mat4();
        draw_function = sphereDraw;
    }


    $("bunnyButton").onclick = function(){
        currentMModel = mult(mat4(),scalem(5,5,5));
        draw_function = bunnyDraw;
    }

    
    $("torusButton").onclick = function(){
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
        ryValue = -90;

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
            mView = orthographicView($("thetaSlider").value, $("gammaSlider").value);

            $("gammaSlider").disabled = false;
            $("thetaSlider").disabled = false;
            
            $("activeFreeAxonTag").innerHTML = "Active"

            $("gammaSlider").value = 0;
            $("thetaSlider").value = 0;

            $("gammaDisplay").value = 0;
            $("thetaDisplay").value = 0;
        }
        else{
            $("activeFreeAxonTag").innerHTML = "Inactive"

            $("gammaSlider").disabled = true;
            $("thetaSlider").disabled = true;
        }
        freeAxonActive = !freeAxonActive;
    }

    $("gammaSlider").oninput = function(event){
        if(freeAxonActive){
            mView = orthographicView(event.target.value ,$("thetaSlider").value);
            $("gammaDisplay").value = event.target.value;
        }
    }

    $("thetaSlider").oninput = function(event){
        if(freeAxonActive){
            mView =  orthographicView($("gammaSlider").value, event.target.value);
            $("thetaDisplay").value = event.target.value;
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
    viewMemory[currentView] = currentView == "perspective" ? mProjection : mView;
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

    if(currentView == "perspective"){
        mView = mat4();
        normalProjection = mProjection;
        mProjection = viewMemory[currentView];
        console.log(mProjection);   
    }else{
        mProjection = normalProjection;
        mView = viewMemory[currentView];
    }

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
    console.log(xScale, yScale);
    let persp = mat4([1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,-1/d,1]);
    return mult(ortho(-2 * xScale, 2*xScale, -2 * yScale, 2*yScale,-10,10), persp);
}

class Superquadric{

    constructor(e1, e2){
        this.super_points = [];
        this.super_normals = [];
        this.super_faces = [];
        this.super_edges = [];
        this.nlat = nlat | 20;
        this.nlon = nlon | 30;
        this.e1 = e1;
        this.e2 = e2;
        sphereBuild(nlat, nlon);
        sphereUploadData(gl);
    }
    // Generate points using polar coordinates
     sphereBuild(nlat, nlon){
        // phi will be latitude
        // theta will be longitude
    
        let d_phi = Math.PI / (nlat+1);
        let d_theta = 2*Math.PI / nlon;
        let r = 0.5;
        let x,y,z;

        
        // Generate middle
        for(var i=0, phi=Math.PI/2-d_phi; i<nlat; i++, phi-=d_phi) {
            for(var j=0, theta=0; j<nlon; j++, theta+=d_theta) {
                x = r * Math.pow(Math.cos(phi), e1) * Math.pow(Math.cos(theta), e2);
                y = r * Math.pow(Math.sin(phi), e1);
                z = r * Math.pow(Math.cos(phi), e1) * Math.pow(Math.sin(theta), e2);
                var pt = vec3(x,y,z);
                this.super_points.push(pt);
                var n = vec3(pt);
                this.super_normals.push(normalize(n));
            }
        }
        
        // Generate norh south cap
        var south = vec3(0,-r,0);
        this.super_points.push(south);
        this.super_normals.push(vec3(0,-1,0));
        
        // Generate the faces
        
        // north pole faces
        for(var i=0; i<nlon-1; i++) {
            this.super_faces.push(0);
            this.super_faces.push(i+2);
            this.super_faces.push(i+1);
        }
        this.super_faces.push(0);
        this.super_faces.push(1);
        this.super_faces.push(nlon);
        
        // general middle faces
        var offset=1;
        
        for(var i = 0; i < this.nlat-1; i++) {
            for(var j = 0; j<this.nlon-1; j++) {
                var p = offset+i*this.nlon+j;
                this.super_faces.push(p);
                this.super_faces.push(p+this.nlon+1);
                this.super_faces.push(p+this.nlon);
                
                this.super_faces.push(p);
                this.super_faces.push(p+1);
                this.super_faces.push(p+this.nlon+1);
            }
            var p = offset+i*this.nlon+this.nlon-1;
            this.super_faces.push(p);
            this.super_faces.push(p+1);
            this.super_faces.push(p+this.nlon);

            this.super_faces.push(p);
            this.super_faces.push(p-this.nlon+1);
            this.super_faces.push(p+1);
        }
        
        // south pole faces
        var offset = 1 + (this.nlat-1) * this.nlon;
        for(var j=0; j<this.nlon-1; j++) {
            this.super_faces.push(offset+this.nlon);
            this.super_faces.push(offset+j);
            this.super_faces.push(offset+j+1);
        }
        this.super_faces.push(offset+nlon);
        this.super_faces.push(offset+nlon-1);
        this.super_faces.push(offset);
    
        // Build the edges
        for(var i=0; i<nlon; i++) {
            sphere_edges.push(0);   // North pole 
            sphere_edges.push(i+1);
        }

        for(var i=0; i<nlat; i++, p++) {
            for(var j=0; j<nlon;j++, p++) {
                var p = 1 + i*nlon + j;
                sphere_edges.push(p);   // horizontal line (same latitude)
                if(j!=nlon-1) 
                    sphere_edges.push(p+1);
                else sphere_edges.push(p+1-nlon);
                
                if(i!=nlat-1) {
                    sphere_edges.push(p);   // vertical line (same longitude)
                    sphere_edges.push(p+nlon);
                }
                else {
                    sphere_edges.push(p);
                    sphere_edges.push(sphere_points.length-1);
                }
            }
        }
        
    }

    function sphereUploadData(gl)
    {
        sphere_points_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sphere_points_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(sphere_points), gl.STATIC_DRAW);
        
        sphere_normals_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sphere_normals_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(sphere_normals), gl.STATIC_DRAW);
        
        sphere_faces_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_faces_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.super_faces), gl.STATIC_DRAW);
        
        sphere_edges_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_edges_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere_edges), gl.STATIC_DRAW);
    }

    function sphereDrawWireFrame(gl, program)
    {    
        gl.useProgram(program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, sphere_points_buffer);
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, sphere_normals_buffer);
        var vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_edges_buffer);
        gl.drawElements(gl.LINES, sphere_edges.length, gl.UNSIGNED_SHORT, 0);
    }

    function sphereDrawFilled(gl, program)
    {
        gl.useProgram(program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, sphere_points_buffer);
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, sphere_normals_buffer);
        var vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_faces_buffer);
        gl.drawElements(gl.TRIANGLES, this.super_faces.length, gl.UNSIGNED_SHORT, 0);
    }

    function sphereDraw(gl, program, filled=false) {
        if(filled) sphereDrawFilled(gl, program);
        else sphereDrawWireFrame(gl, program);
    }
}