import * as THREE from './vendor/three.module.js';

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 15;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerWidth/2 );
  const camera = new THREE.OrthographicCamera(-4, 4, 2, -2, near, far);
  //const camera = new THREE.PerspectiveCamera(fov,aspect,near,far);
  camera.position.z = 4;

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 4, 4);
    scene.add(light);
  }

  fetch('face_text.txt')
    .then(response => response.text())
    .then(data => parsePhoenixFile(data));

  fetch('sphere_filled.json')
    .then(response => response.json())
    .then(data => buildObject(data));

  function buildObject(data) {

    let geometry = new THREE.Geometry();

    data.vertices.forEach(x =>
      geometry.vertices.push(
        new THREE.Vector3( x[0],  x[1], x[2] )
      )
    );

    data.tris.forEach(x =>
      geometry.faces.push(
        new THREE.Face3( x[0]-1,  x[1]-1, x[2]-1 )
      )
    );

    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();
    geometry.computeFlatVertexNormals ();

    //const material = new THREE.MeshPhongMaterial({color: 0x44aa88});  // greenish blue
    //const obj = new THREE.Mesh(geometry, material);
    //scene.add(obj);

  }

  function parsePhoenixFile(file){
    const re = /\n|\r|\r\n/gm;
    let fileArray = file.split(re);

    let vertexCount = Number.parseInt(fileArray[1].split(' ')[0]);

    let vertices = fileArray.slice(2,vertexCount+2);
    vertices.forEach((x,i,a) => (a[i]=x.split(' ')));
    vertices.forEach((x,i,a) => x.forEach((x,i,a)=>(a[i]=Number.parseFloat(x))));
    console.log('vertices');console.log(vertices);
    let tris = fileArray.slice(vertexCount+2);
    tris = tris.filter((x,i,a)=> x.includes(' '));
    tris.forEach((x,i,a) => (a[i]=x.split(' ')));
    tris.forEach((x,i,a) => x.forEach((x,i,a)=>(a[i]=Number.parseFloat(x))));

    console.log('tris');console.log(tris);

    //let obj = {'vertices':vertices};
    let v = [];
    vertices.forEach(x => x.forEach(x2 => v.push(x2)));
    let positions = new Float32Array( v.length );
    v.forEach((x,i)=>positions[i]=x);
    let scales = new Float32Array( vertices.length );
    vertices.forEach((x,i)=>scales[i]=0.01);
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.setAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );

    let material = new THREE.ShaderMaterial( {

      uniforms: {
        color: { value: new THREE.Color( 0xffffff ) },
      },
      vertexShader: "attribute float scale;\n" +
                      "\n" +
                      "    void main() {\n" +
                      "\n" +
                      "      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n" +
                      "\n" +
                      "      gl_PointSize = scale * ( 300.0 / - mvPosition.z );\n" +
                      "\n" +
                      "      gl_Position = projectionMatrix * mvPosition;\n" +
                      "\n" +
                      "    }",
      fragmentShader: "uniform vec3 color;\n" +
                        "\n" +
                        "    void main() {\n" +
                        "\n" +
                        "      if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;\n" +
                        "\n" +
                        "      gl_FragColor = vec4( color, 1.0 );\n" +
                        "\n" +
                        "    }"

    } );

    //
    geometry.computeBoundingSphere();

    let particles = new THREE.Points( geometry, material );

    let trigeo = new THREE.Geometry();
    vertices.forEach(x => trigeo.vertices.push(
      new THREE.Vector3( x[0],  x[1], x[2] ))
    );

    tris.forEach(x => x.length > 3 ?
                      trigeo.faces.push(
      new THREE.Face3( x[1]-1,  x[2]-1, x[0]-1 ),
      new THREE.Face3( x[0]-1,  x[2]-1, Math.abs(x[3])-1 )):
                      trigeo.faces.push(
      new THREE.Face3(   x[1]-1, Math.abs(x[2])-1,x[0]-1 ))
    );


    trigeo.computeBoundingSphere();
    trigeo.computeFaceNormals();
    trigeo.computeFlatVertexNormals ();

    //const phongMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const phongMaterial = new THREE.MeshNormalMaterial({wireframe:false});  // greenish blue
    const obj = new THREE.Mesh(trigeo, phongMaterial);
    obj.name='face';
    particles.name='points';
    scene.add(obj);
    scene.add( particles );
    animate();
    //return obj;
  }
  function animate() {

    requestAnimationFrame( animate );

    render();

  }

  function render() {

    var time = Date.now() * 0.001;

    scene.getChildByName('face').rotateOnAxis(new THREE.Vector3(0,1,0),0.01);
    scene.getChildByName('points').rotateOnAxis(new THREE.Vector3(0,1,0),0.01);
    renderer.render( scene, camera );

  }
}

main();


