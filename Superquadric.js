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
        superBuild();
        superUploadData(gl);
    }
    // Generate points using polar coordinates
    superBuild(){
        // phi will be latitude
        // theta will be longitude
    
        let d_phi = Math.PI / (this.nlat+1);
        let d_theta = 2*Math.PI / this.nlon;
        let r = 0.5;
        let x,y,z;

        
        // Generate middle
        for(var i=0, phi=Math.PI/2-d_phi; i<this.nlat; i++, phi-=d_phi) {
            for(var j=0, theta=0; j<this.nlon; j++, theta+=d_theta) {
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
        for(var i=0; i<this.nlon-1; i++) {
            this.super_faces.push(0);
            this.super_faces.push(i+2);
            this.super_faces.push(i+1);
        }
        this.super_faces.push(0);
        this.super_faces.push(1);
        this.super_faces.push(this.nlon);
        
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
        this.super_faces.push(offset+this.nlon);
        this.super_faces.push(offset+this.nlon-1);
        this.super_faces.push(offset);
    
        // Build the edges
        for(var i=0; i<this.nlon; i++) {
            super_edges.push(0);   // North pole 
            super_edges.push(i+1);
        }

        for(var i=0; i<this.nlat; i++, p++) {
            for(var j=0; j<this.nlon;j++, p++) {
                var p = 1 + i*this.nlon + j;
                super_edges.push(p);   // horizontal line (same latitude)
                if(j!=this.nlon-1) 
                    super_edges.push(p+1);
                else super_edges.push(p+1-this.nlon);
                
                if(i!=this.nlat-1) {
                    super_edges.push(p);   // vertical line (same longitude)
                    super_edges.push(p+this.nlon);
                }
                else {
                    super_edges.push(p);
                    super_edges.push(super_points.length-1);
                }
            }
        }
        
    }

    superUploadData(gl)
    {
        super_points_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, super_points_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(super_points), gl.STATIC_DRAW);
        
        super_normals_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, super_normals_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(super_normals), gl.STATIC_DRAW);
        
        super_faces_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, super_faces_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.super_faces), gl.STATIC_DRAW);
        
        super_edges_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, super_edges_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(super_edges), gl.STATIC_DRAW);
    }

    superDrawWireFrame(gl, program)
    {    
        gl.useProgram(program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, super_points_buffer);
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, super_normals_buffer);
        var vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, super_edges_buffer);
        gl.drawElements(gl.LINES, super_edges.length, gl.UNSIGNED_SHORT, 0);
    }

    superDrawFilled(gl, program)
    {
        gl.useProgram(program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, super_points_buffer);
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, super_normals_buffer);
        var vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, super_faces_buffer);
        gl.drawElements(gl.TRIANGLES, this.super_faces.length, gl.UNSIGNED_SHORT, 0);
    }

    superDraw(gl, program, filled=false) {
        if(filled) superDrawFilled(gl, program);
        else superDrawWireFrame(gl, program);
    }
}