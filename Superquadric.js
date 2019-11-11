    var super_points = [];
    var super_normals = [];
    var super_faces = [];
    var super_edges = [];
    var nlat = nlat | 20;
    var nlon = nlon | 30;
    
    var super_points_buffer;
    var super_normals_buffer;
    var super_faces_buffer;
    var super_edges_buffer;
    
    function superInit(gl, e1, e2){
        super_points = [];
        super_normals = [];
        super_faces = [];
        super_edges = [];
        superBuild(e1,e2);
        superUploadData(gl);
        console.log("Super points " + super_points.length)
    }

    // Generate points using polar coordinates
    function superBuild(e1,e2){
        // phi will be latitude
        // theta will be longitude
    
        let d_phi = Math.PI / (nlat + 1);
        let d_theta = 2*Math.PI / nlon;
        let r = 0.5;
        let x,y,z;

        // Generate north polar cap
        var north = vec3(0,r,0);
        super_points.push(north);
        super_normals.push(vec3(0,1,0));

        // Generate middle
        for(var i=0, phi=Math.PI/2-d_phi; i<nlat; i++, phi-=d_phi) {
            for(var j=0, theta=0; j<nlon; j++, theta+=d_theta) {
                x = r * expOperator(Math.cos(phi), e1) * expOperator(Math.cos(theta), e2);
                y = r * expOperator(Math.sin(phi), e1);
                z = r * expOperator(Math.cos(phi), e1) * expOperator(Math.sin(theta), e2);
                var pt = vec3(x,y,z);
                super_points.push(pt);
                var n = vec3(pt);
                super_normals.push(normalize(n));
            }
        }
        
        // Generate norh south cap
        var south = vec3(0,-r,0);
        super_points.push(south);
        super_normals.push(vec3(0,-1,0));
        
        // Generate the faces
        
        // north pole faces
        for(var i=0; i<nlon-1; i++) {
            super_faces.push(0);
            super_faces.push(i+2);
            super_faces.push(i+1);
        }
        super_faces.push(0);
        super_faces.push(1);
        super_faces.push(nlon);
        
        // general middle faces
        var offset=1;
        
        for(var i = 0; i < nlat-1; i++) {
            for(var j = 0; j<nlon-1; j++) {
                var p = offset+i*nlon+j;
                super_faces.push(p);
                super_faces.push(p+nlon+1);
                super_faces.push(p+nlon);
                
                super_faces.push(p);
                super_faces.push(p+1);
                super_faces.push(p+nlon+1);
            }
            var p = offset+i*nlon+nlon-1;
            super_faces.push(p);
            super_faces.push(p+1);
            super_faces.push(p+nlon);

            super_faces.push(p);
            super_faces.push(p-nlon+1);
            super_faces.push(p+1);
        }
        
        // south pole faces
        var offset = 1 + (nlat-1) * nlon;
        for(var j=0; j<nlon-1; j++) {
            super_faces.push(offset+nlon);
            super_faces.push(offset+j);
            super_faces.push(offset+j+1);
        }
        super_faces.push(offset+nlon);
        super_faces.push(offset+nlon-1);
        super_faces.push(offset);
    
        // Build the edges
        for(var i=0; i<nlon; i++) {
            super_edges.push(0);   // North pole 
            super_edges.push(i+1);
        }

        for(var i=0; i<nlat; i++, p++) {
            for(var j=0; j<nlon;j++, p++) {
                var p = 1 + i*nlon + j;
                super_edges.push(p);   // horizontal line (same latitude)
                if(j!=nlon-1) 
                    super_edges.push(p+1);
                else super_edges.push(p+1-nlon);
                
                if(i!=nlat-1) {
                    super_edges.push(p);   // vertical line (same longitude)
                    super_edges.push(p+nlon);
                }
                else {
                    super_edges.push(p);
                    super_edges.push(super_points.length-1);
                }
            }
        }
        
    }

    function superUploadData(gl)
    {
        if(super_points_buffer == undefined)
            super_points_buffer =  gl.createBuffer();
        
        gl.bindBuffer(gl.ARRAY_BUFFER, super_points_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(super_points), gl.STATIC_DRAW);
        
        if(super_normals_buffer == undefined)
            super_normals_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, super_normals_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(super_normals), gl.STATIC_DRAW);
        
        if(super_faces_buffer == undefined)
            super_faces_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, super_faces_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(super_faces), gl.STATIC_DRAW);
        
        if(super_edges_buffer == undefined)
            super_edges_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, super_edges_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(super_edges), gl.STATIC_DRAW);
    }

    function superDrawWireFrame(gl, program)
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

    function superDrawFilled(gl, program)
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
        gl.drawElements(gl.TRIANGLES, super_faces.length, gl.UNSIGNED_SHORT, 0);
    }

    function superDraw(gl, program, filled=false) {
        if(filled) superDrawFilled(gl, program);
        else superDrawWireFrame(gl, program);
    }

    function expOperator(base,exp){
        return Math.sign(base)*Math.pow(Math.abs(base),exp);
    }